import { describe, expect, test } from "bun:test";
import { normalizePrediction } from "./gemini";
import type { OddsEvent } from "./odds";

const event: OddsEvent = {
  id: "e1",
  sport_key: "soccer_epl",
  sport_title: "EPL",
  commence_time: "2026-10-03T14:00:00Z",
  home_team: "Arsenal",
  away_team: "Chelsea",
  bookmakers: [],
};

describe("normalizePrediction", () => {
  test("keeps a well-formed prediction", () => {
    const p = normalizePrediction(
      {
        winner: "away",
        winnerTeam: "Chelsea",
        score: { home: 0, away: 2 },
        confidence: 61.4,
        aiProbabilities: { home: 0.2, draw: 0.25, away: 0.55 },
        reasoning: "Market leans away.",
        keyFactors: ["Price drift"],
        suggestedBet: { market: "1X2", pick: "Chelsea", rationale: "Value." },
      },
      event,
    );
    expect(p.winner).toBe("away");
    expect(p.score).toEqual({ home: 0, away: 2 });
    expect(p.confidence).toBe(61);
    expect(p.keyFactors).toEqual(["Price drift"]);
    expect(p.suggestedBet.pick).toBe("Chelsea");
  });

  test.each<[unknown]>([["a string"], [null], [[1, 2]], [{}]])("falls back to defaults for %p", (raw) => {
    const p = normalizePrediction(raw, event);
    expect(p.winner).toBe("home");
    expect(p.winnerTeam).toBe("Arsenal");
    expect(p.confidence).toBe(50);
    expect(p.score).toEqual({ home: 1, away: 1 });
    expect(p.reasoning).toBe("Analysis unavailable.");
  });

  test("drops non-string key factors that would crash React", () => {
    const p = normalizePrediction({ keyFactors: [{ factor: "x" }, "  kept  ", 3, ""] }, event);
    expect(p.keyFactors).toEqual(["kept"]);
  });

  test("rejects non-numeric values instead of producing NaN", () => {
    const p = normalizePrediction({ confidence: "80", score: { home: "2", away: 1.6 } }, event);
    expect(p.confidence).toBe(50);
    expect(p.score).toEqual({ home: 1, away: 2 });
  });

  test("clamps confidence to 0..100", () => {
    expect(normalizePrediction({ confidence: 250 }, event).confidence).toBe(100);
    expect(normalizePrediction({ confidence: -5 }, event).confidence).toBe(0);
  });

  test("normalizes percentages and falls back on partial or negative probabilities", () => {
    const pct = normalizePrediction({ aiProbabilities: { home: 10, draw: 20, away: 70 } }, event);
    expect(pct.aiProbabilities.away).toBeCloseTo(0.7);
    const fallback = { home: 0.4, draw: 0.3, away: 0.3 };
    expect(normalizePrediction({ aiProbabilities: { home: 0.5 } }, event).aiProbabilities).toEqual(fallback);
    expect(
      normalizePrediction({ aiProbabilities: { home: -1, draw: 1, away: 1 } }, event).aiProbabilities,
    ).toEqual(fallback);
  });

  test("derives an invalid winner from the most likely outcome", () => {
    const p = normalizePrediction({ winner: "Chelsea", aiProbabilities: { home: 1, draw: 2, away: 7 } }, event);
    expect(p.winner).toBe("away");
    expect(p.winnerTeam).toBe("Chelsea");
  });
});
