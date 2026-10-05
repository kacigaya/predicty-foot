"use server";

import { headers } from "next/headers";
import { unstable_rethrow } from "next/navigation";
import { findEventAcrossLeagues, fetchEventById, fetchEventMarkets, type OddsEvent } from "@/app/lib/odds";
import { generatePrediction, GeminiError, type AIPrediction } from "@/app/lib/gemini";
import { isLeagueKey, LEAGUES } from "@/app/lib/leagues";
import { createInMemoryRateLimiter, getClientIp } from "@/app/lib/rate-limit";

const EVENT_ID_PATTERN = /^[a-zA-Z0-9:_-]{1,120}$/;

// One prediction per fixture is shared by every visitor for this long, so
// opening a popular match costs a single Gemini call.
const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

// Counts Gemini calls only; cached answers are free. Server actions are public
// POST endpoints, so without this anyone could spend the Gemini quota.
const geminiLimiter = createInMemoryRateLimiter({ windowMs: 60 * 1000, maxRequests: 5 });

const cache = new Map<string, { prediction: AIPrediction; ts: number }>();
const inFlight = new Map<string, Promise<AIPrediction | null>>();

export type PredictionResult =
  | { ok: true; prediction: AIPrediction }
  | { ok: false; error: string };

function remember(eventId: string, prediction: AIPrediction): void {
  cache.delete(eventId);
  cache.set(eventId, { prediction, ts: Date.now() });
  // Maps iterate in insertion order, so the first key is the oldest.
  for (const key of cache.keys()) {
    if (cache.size <= MAX_CACHE_ENTRIES) break;
    cache.delete(key);
  }
}

// The extra markets are optional: without them the prediction still runs,
// with no scorers and no market comparison for the extra fields.
async function eventMarkets(sportKey: string, eventId: string): Promise<OddsEvent | null> {
  try {
    return await fetchEventMarkets(sportKey, eventId);
  } catch (err) {
    unstable_rethrow(err);
    console.error("[generatePredictionAction] event markets:", err);
    return null;
  }
}

// Null when the fixture is no longer in the odds feed.
async function predict(eventId: string, sportKey?: string): Promise<AIPrediction | null> {
  const found = sportKey
    ? { event: await fetchEventById(sportKey, eventId), sportKey }
    : await findEventAcrossLeagues(LEAGUES.map((l) => l.key), eventId);
  if (!found?.event) return null;
  return generatePrediction(found.event, await eventMarkets(found.sportKey, eventId));
}

// `fresh` skips the cache (the Regenerate button) and always counts against
// the rate limit.
export async function generatePredictionAction(
  eventId: string,
  sportKey?: string,
  options?: { fresh?: boolean },
): Promise<PredictionResult> {
  try {
    if (typeof eventId !== "string" || !EVENT_ID_PATTERN.test(eventId)) {
      return { ok: false, error: "Invalid event id." };
    }

    if (sportKey !== undefined && (typeof sportKey !== "string" || !isLeagueKey(sportKey))) {
      return { ok: false, error: "Invalid sport key." };
    }

    const ip = getClientIp(await headers());
    const fresh = options?.fresh === true;

    // No await from here until inFlight.set, or two concurrent requests for the
    // same fixture would both miss the cache and both call Gemini.
    const cached = cache.get(eventId);
    if (!fresh && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      return { ok: true, prediction: cached.prediction };
    }

    let request = inFlight.get(eventId);
    if (!request) {
      if (geminiLimiter.check(ip)) {
        return { ok: false, error: "Too many predictions. Try again in a minute." };
      }
      request = predict(eventId, sportKey);
      inFlight.set(eventId, request);
      request
        .then((prediction) => prediction && remember(eventId, prediction))
        .catch(() => {})
        .finally(() => inFlight.delete(eventId));
    }

    const prediction = await request;
    if (!prediction) {
      return { ok: false, error: "Match not found or no longer available." };
    }
    return { ok: true, prediction };
  } catch (err) {
    unstable_rethrow(err);
    console.error("[generatePredictionAction]", err);
    if (err instanceof GeminiError) {
      return { ok: false, error: "Prediction service unavailable." };
    }
    return { ok: false, error: "Failed to generate prediction." };
  }
}
