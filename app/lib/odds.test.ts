import { afterEach, describe, expect, setSystemTime, spyOn, test } from "bun:test";
import {
  averageH2HOdds,
  averageOutcomes,
  marketProbability,
  scorerOdds,
  twoWayProbability,
  fetchOdds,
  findEventAcrossLeagues,
  formatOdds,
  impliedProbabilities,
  OddsApiError,
  type Market,
  type OddsEvent,
} from "./odds";

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

function markets(...books: Array<Array<Omit<Market, "last_update">>>): OddsEvent {
  return {
    ...event([]),
    bookmakers: books.map((ms, i) => ({
      key: `bm${i}`,
      title: `Bookmaker ${i}`,
      last_update: "2026-10-01T10:00:00Z",
      markets: ms.map((m) => ({ ...m, last_update: "2026-10-01T10:00:00Z" })),
    })),
  };
}

describe("averageOutcomes", () => {
  test("groups by name, player and line and skips invalid prices", () => {
    const e = markets(
      [{ key: "totals", outcomes: [{ name: "Over", point: 2.5, price: 1.8 }, { name: "Over", point: 3.5, price: 3 }] }],
      [{ key: "totals", outcomes: [{ name: "Over", point: 2.5, price: 2 }, { name: "Under", point: 2.5, price: 0.5 }] }],
    );
    const avg = averageOutcomes(e, "totals");
    expect(avg).toHaveLength(2);
    expect(avg.find((o) => o.point === 2.5)?.price).toBeCloseTo(1.9);
  });
});

describe("twoWayProbability", () => {
  test("removes the margin from both sides", () => {
    expect(twoWayProbability(1.9, 1.9)).toBeCloseTo(0.5);
    expect(twoWayProbability(1.5, 2.5)).toBeCloseTo(0.625);
    expect(twoWayProbability(undefined, 2)).toBeNull();
  });
});

describe("marketProbability", () => {
  test("reads one line and is null when a side is missing", () => {
    const e = markets([
      {
        key: "totals",
        outcomes: [
          { name: "Over", point: 2.5, price: 1.5 },
          { name: "Under", point: 2.5, price: 2.5 },
          { name: "Over", point: 3.5, price: 2.2 },
        ],
      },
      { key: "btts", outcomes: [{ name: "Yes", price: 1.8 }] },
    ]);
    expect(marketProbability(e, "totals", "Over", "Under", 2.5)).toBeCloseTo(0.625);
    expect(marketProbability(e, "totals", "Over", "Under", 3.5)).toBeNull();
    expect(marketProbability(e, "btts", "Yes", "No")).toBeNull();
    expect(marketProbability(null, "btts", "Yes", "No")).toBeNull();
  });
});

describe("scorerOdds", () => {
  test("lists Yes outcomes by shortest average price", () => {
    const e = markets(
      [{ key: "player_goal_scorer_anytime", outcomes: [{ name: "Yes", description: "Saka", price: 2.6 }, { name: "Yes", description: "Palmer", price: 3 }] }],
      [{ key: "player_goal_scorer_anytime", outcomes: [{ name: "Yes", description: "Saka", price: 2.4 }, { name: "No", description: "Saka", price: 1.4 }, { name: "Yes", description: " ", price: 2 }] }],
    );
    expect(scorerOdds(e)).toEqual([
      { player: "Saka", price: 2.5 },
      { player: "Palmer", price: 3 },
    ]);
    expect(scorerOdds(null)).toEqual([]);
  });
});

describe("formatOdds", () => {
  test("uses two decimals and an en dash for missing values", () => {
    expect(formatOdds(2.456)).toBe("2.46");
    expect(formatOdds(null)).toBe("–");
    expect(formatOdds(Number.NaN)).toBe("–");
  });
});

describe("fetchOdds", () => {
  process.env.ODDS_API_KEY = "test-key";

  afterEach(() => {
    setSystemTime();
  });

  function mockProvider(response: () => Response) {
    return spyOn(globalThis, "fetch").mockImplementation((async () => response()) as unknown as typeof fetch);
  }

  test("shares one provider request between concurrent callers and caches it", async () => {
    setSystemTime(new Date("2026-10-01T10:00:00Z"));
    const fetchSpy = mockProvider(() => Response.json([event([[2, 3, 4]])]));
    const [a, b] = await Promise.all([fetchOdds("cache_a"), fetchOdds("cache_a")]);
    const c = await fetchOdds("cache_a");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
    expect(c).toBe(a);
    expect(a.fetchedAt).toBe("2026-10-01T10:00:00.000Z");
    fetchSpy.mockRestore();
  });

  test("refetches after five minutes and reports the new fetch time", async () => {
    setSystemTime(new Date("2026-10-01T10:00:00Z"));
    const fetchSpy = mockProvider(() => Response.json([]));
    await fetchOdds("cache_b");
    setSystemTime(new Date("2026-10-01T10:04:59Z"));
    await fetchOdds("cache_b");
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    setSystemTime(new Date("2026-10-01T10:05:01Z"));
    const later = await fetchOdds("cache_b");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(later.fetchedAt).toBe("2026-10-01T10:05:01.000Z");
    fetchSpy.mockRestore();
  });

  test("does not cache provider errors", async () => {
    const fetchSpy = mockProvider(() => new Response("quota", { status: 429 }));
    await expect(fetchOdds("cache_c")).rejects.toBeInstanceOf(OddsApiError);
    await expect(fetchOdds("cache_c")).rejects.toBeInstanceOf(OddsApiError);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    fetchSpy.mockRestore();
  });
});

describe("findEventAcrossLeagues", () => {
  process.env.ODDS_API_KEY = "test-key";

  test("skips a failing league and finds the event in another", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async (url: string) =>
      url.includes("find_down")
        ? new Response("down", { status: 503 })
        : Response.json([event([[2, 3, 4]])])) as unknown as typeof fetch);
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    const found = await findEventAcrossLeagues(["find_down", "find_up"], "e1");
    expect(found?.sportKey).toBe("find_up");
    expect(await findEventAcrossLeagues(["find_down", "find_up"], "missing")).toBeNull();
    fetchSpy.mockRestore();
    errorSpy.mockRestore();
  });

  test("throws when every league fails instead of reporting not found", async () => {
    const fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
      (async () => new Response("down", { status: 503 })) as unknown as typeof fetch,
    );
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    await expect(findEventAcrossLeagues(["all_down_a", "all_down_b"], "e1")).rejects.toBeInstanceOf(OddsApiError);
    fetchSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
