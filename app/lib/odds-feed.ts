import { unstable_rethrow } from "next/navigation";
import { OddsApiError, type OddsEvent } from "./odds";
import { readLastOdds, writeLastOdds, fallbackOdds, isOddsFeed } from "./odds-cache";

const API_BASE = "https://api.the-odds-api.com/v4";

function assertApiKey(): string {
  const key = process.env.ODDS_API_KEY;
  if (!key) {
    throw new OddsApiError(
      "Missing ODDS_API_KEY. Add it to .env.local to fetch odds.",
      500
    );
  }
  return key;
}

export type OddsSnapshot = { events: OddsEvent[]; fetchedAt: string; stale: boolean };

// The fresh odds cache. Each call costs 3 provider credits (one market, three
// regions), so a league is fetched at most once per TTL, and concurrent
// callers share the request in flight. fetchedAt is when the provider
// answered, which is what "Updated …" in the UI reports.
const CACHE_TTL_MS = 5 * 60 * 1000;
const FALLBACK_RETRY_MS = 60 * 1000;
const oddsCache = new Map<string, { snapshot: OddsSnapshot; ts: number }>();
const fallbackCache = new Map<string, { snapshot: OddsSnapshot; ts: number }>();
const inFlight = new Map<string, Promise<OddsSnapshot>>();

async function requestOdds(sportKey: string): Promise<OddsSnapshot> {
  const apiKey = assertApiKey();
  const params = new URLSearchParams({
    apiKey,
    regions: "eu,uk,us",
    markets: "h2h",
    oddsFormat: "decimal",
    dateFormat: "iso",
  });

  const url = `${API_BASE}/sports/${encodeURIComponent(sportKey)}/odds/?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new OddsApiError(
      `Odds API error (${res.status}): ${body || res.statusText}`,
      res.status
    );
  }

  const events: unknown = await res.json();
  if (!isOddsFeed(events) || events.some((event) => event.sport_key !== sportKey)) {
    throw new OddsApiError("Invalid odds feed.", 502);
  }
  const now = Date.now();
  const snapshot = { events, fetchedAt: new Date(now).toISOString(), stale: false };
  oddsCache.set(sportKey, { snapshot, ts: now });
  fallbackCache.delete(sportKey);
  await writeLastOdds(sportKey, snapshot);
  return snapshot;
}

// Callers validate sportKey with isLeagueKey, which also bounds the cache size.
export function fetchOdds(sportKey: string): Promise<OddsSnapshot> {
  const cached = oddsCache.get(sportKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return Promise.resolve(cached.snapshot);
  }

  // Serve the fallback for a minute before retrying, without extending its original age.
  const failed = fallbackCache.get(sportKey);
  if (failed && Date.now() - failed.ts < FALLBACK_RETRY_MS) {
    const fallback = fallbackOdds(failed.snapshot);
    if (fallback) return Promise.resolve(fallback);
  }
  fallbackCache.delete(sportKey);

  let request = inFlight.get(sportKey);
  if (!request) {
    request = requestOdds(sportKey).catch(async (err: unknown) => {
      unstable_rethrow(err);
      const last = oddsCache.get(sportKey)?.snapshot ?? await readLastOdds(sportKey);
      const fallback = last && fallbackOdds(last);
      if (!fallback) throw err;
      fallbackCache.set(sportKey, { snapshot: last, ts: Date.now() });
      return fallback;
    }).finally(() => inFlight.delete(sportKey));
    inFlight.set(sportKey, request);
  }
  return request;
}

// Extra markets for one fixture, read from the event-odds endpoint. It costs
// one credit per market returned per region, and asking for a market the
// books have not priced is free. Player props are US-only, hence one region.
const EVENT_MARKETS = [
  "player_goal_scorer_anytime",
  "totals",
  "btts",
  "alternate_totals_corners",
  "alternate_totals_cards",
].join(",");
const MAX_EVENT_ENTRIES = 200;
const eventCache = new Map<string, { event: OddsEvent | null; ts: number }>();
const eventInFlight = new Map<string, Promise<OddsEvent | null>>();

function isOddsEvent(value: unknown): value is OddsEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { bookmakers?: unknown }).bookmakers)
  );
}

async function requestEventMarkets(sportKey: string, eventId: string): Promise<OddsEvent | null> {
  const params = new URLSearchParams({
    apiKey: assertApiKey(),
    regions: "us",
    markets: EVENT_MARKETS,
    oddsFormat: "decimal",
    dateFormat: "iso",
  });
  const url = `${API_BASE}/sports/${encodeURIComponent(sportKey)}/events/${encodeURIComponent(eventId)}/odds?${params.toString()}`;

  const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new OddsApiError(
      `Odds API error (${res.status}): ${body || res.statusText}`,
      res.status
    );
  }

  const body: unknown = await res.json();
  const event = isOddsEvent(body) ? body : null;
  eventCache.delete(eventId);
  eventCache.set(eventId, { event, ts: Date.now() });
  // Maps iterate in insertion order, so the first key is the oldest.
  for (const key of eventCache.keys()) {
    if (eventCache.size <= MAX_EVENT_ENTRIES) break;
    eventCache.delete(key);
  }
  return event;
}

// Same TTL and in-flight sharing as fetchOdds, so Regenerate does not spend
// credits again. Null when the fixture is gone or the reply is malformed.
export function fetchEventMarkets(sportKey: string, eventId: string): Promise<OddsEvent | null> {
  const cached = eventCache.get(eventId);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return Promise.resolve(cached.event);
  }

  let request = eventInFlight.get(eventId);
  if (!request) {
    request = requestEventMarkets(sportKey, eventId).finally(() => eventInFlight.delete(eventId));
    eventInFlight.set(eventId, request);
  }
  return request;
}

export async function fetchEventById(
  sportKey: string,
  eventId: string
): Promise<OddsEvent | null> {
  const { events } = await fetchOdds(sportKey);
  return events.find((e) => e.id === eventId) ?? null;
}

// Null when the event is in none of the leagues that answered. Throws when no
// league answered at all, so an outage is not reported as a missing match.
export async function findEventAcrossLeagues(
  sportKeys: string[],
  eventId: string
): Promise<{ event: OddsEvent; sportKey: string } | null> {
  const keys = [...new Set(sportKeys)];
  let lastError: unknown;
  let answered = 0;
  for (const key of keys) {
    try {
      const event = await fetchEventById(key, eventId);
      answered += 1;
      if (event) return { event, sportKey: key };
    } catch (err) {
      unstable_rethrow(err);
      console.error(`[findEventAcrossLeagues] ${key}:`, err);
      lastError = err;
    }
  }
  if (answered === 0 && keys.length > 0) throw lastError;
  return null;
}
