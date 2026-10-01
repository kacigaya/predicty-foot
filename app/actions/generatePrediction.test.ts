import { afterAll, beforeAll, beforeEach, describe, expect, mock, spyOn, test, type Mock } from "bun:test";
import type { OddsEvent } from "@/app/lib/odds";

// Only the edges are faked: the Gemini SDK client, fetch for the odds feed and
// next/headers. Mocking our own modules would leak into their own test files,
// since Bun shares one module registry across files.
process.env.ODDS_API_KEY = "test-key";
process.env.GEMINI_API_KEY = "test-key";

const IDS = ["evtB", "evtC", ...Array.from({ length: 10 }, (_, i) => `evtD${i}`)];
const feed: OddsEvent[] = IDS.map((id) => ({
  id,
  sport_key: "soccer_epl",
  sport_title: "EPL",
  commence_time: "2026-10-03T14:00:00Z",
  home_team: "Arsenal",
  away_team: "Chelsea",
  bookmakers: [],
}));

let calls = 0;
let clientIp = "203.0.113.1";


const genai = await import("@google/genai");
mock.module("@google/genai", () => ({
  ...genai,
  GoogleGenAI: class {
    models = {
      generateContent: async () => {
        calls += 1;
        await Bun.sleep(5);
        return { text: JSON.stringify({ reasoning: `call-${calls}` }) };
      },
    };
  },
}));
mock.module("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": clientIp }),
}));

const { generatePredictionAction } = await import("./generatePrediction");

// Installed per file so the stub never answers another file's fetches.
let fetchSpy: Mock<typeof fetch>;
beforeAll(() => {
  fetchSpy = spyOn(globalThis, "fetch").mockImplementation(
    (async () => Response.json(feed)) as unknown as typeof fetch,
  );
});

beforeEach(() => {
  calls = 0;
});

afterAll(() => {
  fetchSpy.mockRestore();
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
    expect([a, b, c].every((r) => r.ok && r.prediction.reasoning === "call-1")).toBe(true);
  });

  test("fresh requests bypass the cache and replace it", async () => {
    clientIp = "203.0.113.3";
    await generatePredictionAction("evtC", "soccer_epl");
    const fresh = await generatePredictionAction("evtC", "soccer_epl", { fresh: true });
    const after = await generatePredictionAction("evtC", "soccer_epl");
    expect(calls).toBe(2);
    expect(fresh.ok && fresh.prediction.reasoning).toBe("call-2");
    expect(after.ok && after.prediction.reasoning).toBe("call-2");
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
