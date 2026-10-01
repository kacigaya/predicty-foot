import { describe, expect, test } from "bun:test";
import { averageH2HOdds, formatOdds, impliedProbabilities, type OddsEvent } from "./odds";

function event(prices: Array<[number, number, number]>): OddsEvent {
  return {
    id: "e1",
    sport_key: "soccer_epl",
    sport_title: "EPL",
    commence_time: "2026-10-03T14:00:00Z",
    home_team: "Arsenal",
    away_team: "Chelsea",
    bookmakers: prices.map(([home, draw, away], i) => ({
      key: `bm${i}`,
      title: `Bookmaker ${i}`,
      last_update: "2026-10-01T10:00:00Z",
      markets: [
        {
          key: "h2h",
          last_update: "2026-10-01T10:00:00Z",
          outcomes: [
            { name: "Arsenal", price: home },
            { name: "Draw", price: draw },
            { name: "Chelsea", price: away },
          ],
        },
      ],
    })),
  };
}

describe("averageH2HOdds", () => {
  test("averages each outcome across bookmakers", () => {
    const avg = averageH2HOdds(event([[2, 3, 4], [2.2, 3.4, 3.6]]));
    expect(avg.home).toBeCloseTo(2.1);
    expect(avg.draw).toBeCloseTo(3.2);
    expect(avg.away).toBeCloseTo(3.8);
    expect(avg.bookmakerCount).toBe(2);
  });

  test("returns null outcomes without bookmakers", () => {
    expect(averageH2HOdds(event([]))).toEqual({ home: null, draw: null, away: null, bookmakerCount: 0 });
  });
});

describe("impliedProbabilities", () => {
  test("removes the overround so outcomes sum to 1", () => {
    const p = impliedProbabilities({ home: 2, draw: 3.5, away: 3.8, bookmakerCount: 1 });
    expect(p.home + p.draw + p.away).toBeCloseTo(1);
    expect(p.home).toBeGreaterThan(p.away);
  });

  test("is all zero when no prices exist", () => {
    expect(impliedProbabilities({ home: null, draw: null, away: null, bookmakerCount: 0 })).toEqual({
      home: 0,
      draw: 0,
      away: 0,
    });
  });
});

describe("formatOdds", () => {
  test("uses two decimals and an en dash for missing values", () => {
    expect(formatOdds(2.456)).toBe("2.46");
    expect(formatOdds(null)).toBe("–");
    expect(formatOdds(Number.NaN)).toBe("–");
  });
});
