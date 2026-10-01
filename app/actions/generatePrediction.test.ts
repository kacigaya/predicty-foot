import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { AIPrediction } from "@/app/lib/gemini";
import type { OddsEvent } from "@/app/lib/odds";

const event: OddsEvent = {
  id: "evt1",
  sport_key: "soccer_epl",
  sport_title: "EPL",
  commence_time: "2026-10-03T14:00:00Z",
  home_team: "Arsenal",
  away_team: "Chelsea",
  bookmakers: [],
};

let calls = 0;
let clientIp = "203.0.113.1";

mock.module("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": clientIp }),
}));
mock.module("@/app/lib/odds", () => ({
  fetchEventById: async (_sport: string, id: string) => (id.startsWith("evt") ? { ...event, id } : null),
  findEventAcrossLeagues: async () => null,
}));
mock.module("@/app/lib/gemini", () => ({
  GeminiError: class GeminiError extends Error {},
  generatePrediction: async (): Promise<AIPrediction> => {
    calls += 1;
    await Bun.sleep(5);
    return { generatedAt: `call-${calls}` } as AIPrediction;
  },
}));

const { generatePredictionAction } = await import("./generatePrediction");

beforeEach(() => {
  calls = 0;
});

describe("generatePredictionAction", () => {
  test("rejects malformed input before calling anything", async () => {
    expect(await generatePredictionAction("../x", "soccer_epl")).toEqual({ ok: false, error: "Invalid event id." });
    expect(await generatePredictionAction("evtA", "nope")).toEqual({ ok: false, error: "Invalid sport key." });
    expect(await generatePredictionAction(42 as unknown as string)).toEqual({ ok: false, error: "Invalid event id." });
    expect(calls).toBe(0);
  });

  test("serves the cached prediction and shares in-flight requests", async () => {
    clientIp = "203.0.113.2";
    const [a, b] = await Promise.all([
      generatePredictionAction("evtB", "soccer_epl"),
      generatePredictionAction("evtB", "soccer_epl"),
    ]);
    const c = await generatePredictionAction("evtB", "soccer_epl");
    expect(calls).toBe(1);
    expect([a, b, c].every((r) => r.ok && r.prediction.generatedAt === "call-1")).toBe(true);
  });

  test("fresh requests bypass the cache and replace it", async () => {
    clientIp = "203.0.113.3";
    await generatePredictionAction("evtC", "soccer_epl");
    const fresh = await generatePredictionAction("evtC", "soccer_epl", { fresh: true });
    const after = await generatePredictionAction("evtC", "soccer_epl");
    expect(calls).toBe(2);
    expect(fresh.ok && fresh.prediction.generatedAt).toBe("call-2");
    expect(after.ok && after.prediction.generatedAt).toBe("call-2");
  });

  test("limits Gemini calls per client, not cached reads", async () => {
    clientIp = "203.0.113.4";
    for (let i = 0; i < 5; i++) {
      expect((await generatePredictionAction(`evtD${i}`, "soccer_epl")).ok).toBe(true);
    }
    expect(await generatePredictionAction("evtD9", "soccer_epl")).toEqual({
      ok: false,
      error: "Too many predictions. Try again in a minute.",
    });
    expect((await generatePredictionAction("evtD0", "soccer_epl")).ok).toBe(true);
    clientIp = "203.0.113.5";
    expect((await generatePredictionAction("evtD9", "soccer_epl")).ok).toBe(true);
  });

  test("reports a missing fixture without calling Gemini", async () => {
    clientIp = "203.0.113.6";
    expect(await generatePredictionAction("gone", "soccer_epl")).toEqual({
      ok: false,
      error: "Match not found or no longer available.",
    });
    expect(calls).toBe(0);
  });
});
