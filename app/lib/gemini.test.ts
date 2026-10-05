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

  test("defaults the extra markets without a market to compare against", () => {
    const p = normalizePrediction({}, event);
    expect(p.halfTime.score).toEqual({ home: 0, away: 0 });
    expect(p.goals.over25).toEqual({ ai: 0.5, market: null });
    expect(p.scorers).toEqual([]);
    expect(p.corners).toEqual({ expected: 10, over: { ai: 0.5, market: null } });
    expect(p.cards.expected).toBe(4);
  });

  test("never puts more half-time goals than full-time goals", () => {
    const p = normalizePrediction({ score: { home: 1, away: 0 }, halfTimeScore: { home: 3, away: 2 } }, event);
    expect(p.halfTime.score).toEqual({ home: 1, away: 0 });
  });

  test("accepts percentages and clamps probabilities and totals", () => {
    const p = normalizePrediction(
      { over25Probability: 62, bttsProbability: 1.4e3, cardsOverProbability: -1, expectedCorners: 99, expectedCards: 3.46 },
      event,
    );
    expect(p.goals.over25.ai).toBeCloseTo(0.62);
    expect(p.goals.btts.ai).toBe(1);
    expect(p.cards.over.ai).toBe(0.5);
    expect(p.corners.expected).toBe(25);
    expect(p.cards.expected).toBe(3.5);
  });

  const markets: OddsEvent = {
    ...event,
    bookmakers: [
      {
        key: "dk",
        title: "DraftKings",
        last_update: "2026-10-01T10:00:00Z",
        markets: [
          {
            key: "totals",
            last_update: "2026-10-01T10:00:00Z",
            outcomes: [
              { name: "Over", point: 2.5, price: 1.5 },
              { name: "Under", point: 2.5, price: 2.5 },
            ],
          },
          {
            key: "player_goal_scorer_anytime",
            last_update: "2026-10-01T10:00:00Z",
            outcomes: ["Saka", "Havertz", "Odegaard", "Trossard", "Palmer"].map((player, i) => ({
              name: "Yes",
              description: player,
              price: 2.5 + i,
            })),
          },
        ],
      },
    ],
  };

  test("compares with the market where it is priced", () => {
    const p = normalizePrediction({}, event, markets);
    expect(p.goals.over25.market).toBeCloseTo(0.625);
    expect(p.goals.over25.ai).toBeCloseTo(0.625);
    expect(p.goals.btts.market).toBeNull();
  });

  test("keeps only priced scorers, at most three per side, with market odds", () => {
    const p = normalizePrediction(
      {
        scorers: [
          { player: "saka", side: "home", probability: 0.4 },
          { player: "Saka", side: "home", probability: 0.4 },
          { player: "Made Up", side: "home", probability: 0.9 },
          { player: { name: "Havertz" }, side: "home", probability: 0.3 },
          { player: "Havertz", side: "both", probability: 0.3 },
          { player: "Havertz", side: "home" },
          { player: "Odegaard", side: "home", probability: 0.2 },
          { player: "Trossard", side: "home", probability: 0.2 },
          { player: "Palmer", side: "away", probability: 25 },
        ],
      },
      event,
      markets,
    );
    expect(p.scorers).toEqual([
      { player: "Saka", side: "home", ai: 0.4, odds: 2.5 },
      { player: "Havertz", side: "home", ai: 1 / 3.5, odds: 3.5 },
      { player: "Odegaard", side: "home", ai: 0.2, odds: 4.5 },
      { player: "Palmer", side: "away", ai: 0.25, odds: 6.5 },
    ]);
  });

  test("drops every scorer when the books publish none", () => {
    const p = normalizePrediction({ scorers: [{ player: "Saka", side: "home", probability: 0.4 }] }, event);
    expect(p.scorers).toEqual([]);
  });
});
