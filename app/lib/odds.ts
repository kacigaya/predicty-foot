import { unstable_rethrow } from "next/navigation";

const API_BASE = "https://api.the-odds-api.com/v4";

export type Outcome = {
  name: string;
  price: number;
  point?: number;
  // Player name on player prop markets, where `name` is "Yes" or "Over".
  description?: string;
};

export type Market = {
  key: string;
  last_update: string;
  outcomes: Outcome[];
};

export type Bookmaker = {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
};

export type OddsEvent = {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Bookmaker[];
};

export type AveragedOdds = {
  home: number | null;
  draw: number | null;
  away: number | null;
  bookmakerCount: number;
};

export class OddsApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "OddsApiError";
  }
}

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

export type OddsSnapshot = { events: OddsEvent[]; fetchedAt: string };

// The only odds cache. Each call costs 3 provider credits (one market, three
// regions), so a league is fetched at most once per TTL, and concurrent
// callers share the request in flight. fetchedAt is when the provider
// answered, which is what "Updated …" in the UI reports.
const CACHE_TTL_MS = 5 * 60 * 1000;
const oddsCache = new Map<string, { snapshot: OddsSnapshot; ts: number }>();
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

  const events = (await res.json()) as OddsEvent[];
  const now = Date.now();
  const snapshot = { events, fetchedAt: new Date(now).toISOString() };
  oddsCache.set(sportKey, { snapshot, ts: now });
  return snapshot;
}

// Callers validate sportKey with isLeagueKey, which also bounds the cache size.
export function fetchOdds(sportKey: string): Promise<OddsSnapshot> {
  const cached = oddsCache.get(sportKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return Promise.resolve(cached.snapshot);
  }

  let request = inFlight.get(sportKey);
  if (!request) {
    request = requestOdds(sportKey).finally(() => inFlight.delete(sportKey));
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

export function averageH2HOdds(event: OddsEvent): AveragedOdds {
  const totals = { home: 0, draw: 0, away: 0 };
  const counts = { home: 0, draw: 0, away: 0 };

  for (const bm of event.bookmakers) {
    const h2h = bm.markets.find((m) => m.key === "h2h");
    if (!h2h) continue;
    for (const o of h2h.outcomes) {
      if (o.name === event.home_team) {
        totals.home += o.price;
        counts.home += 1;
      } else if (o.name === event.away_team) {
        totals.away += o.price;
        counts.away += 1;
      } else if (o.name === "Draw") {
        totals.draw += o.price;
        counts.draw += 1;
      }
    }
  }

  return {
    home: counts.home ? totals.home / counts.home : null,
    draw: counts.draw ? totals.draw / counts.draw : null,
    away: counts.away ? totals.away / counts.away : null,
    bookmakerCount: event.bookmakers.length,
  };
}

export function impliedProbabilities(o: AveragedOdds) {
  const raw = {
    home: o.home ? 1 / o.home : 0,
    draw: o.draw ? 1 / o.draw : 0,
    away: o.away ? 1 / o.away : 0,
  };
  const sum = raw.home + raw.draw + raw.away;
  if (sum === 0) return { home: 0, draw: 0, away: 0 };
  return {
    home: raw.home / sum,
    draw: raw.draw / sum,
    away: raw.away / sum,
  };
}

// Fixed lines for the extra markets, so the model never picks a line and the
// market price can be looked up at the same one.
export const GOALS_LINE = 2.5;
export const CORNERS_LINE = 9.5;
export const CARDS_LINE = 4.5;

export type AveragedOutcome = {
  name: string;
  description?: string;
  point?: number;
  price: number;
};

// Average price of each distinct outcome of one market across bookmakers.
export function averageOutcomes(event: OddsEvent, marketKey: string): AveragedOutcome[] {
  const groups = new Map<string, { outcome: Outcome; total: number; count: number }>();
  for (const bm of event.bookmakers) {
    const market = bm.markets.find((m) => m.key === marketKey);
    if (!market) continue;
    for (const o of market.outcomes) {
      if (!Number.isFinite(o.price) || o.price <= 1) continue;
      const key = `${o.name}|${o.description ?? ""}|${o.point ?? ""}`;
      const group = groups.get(key) ?? { outcome: o, total: 0, count: 0 };
      group.total += o.price;
      group.count += 1;
      groups.set(key, group);
    }
  }
  return [...groups.values()].map(({ outcome, total, count }) => ({
    name: outcome.name,
    description: outcome.description,
    point: outcome.point,
    price: total / count,
  }));
}

// Probability of the first side of a two-way market with the margin removed.
export function twoWayProbability(price: number | undefined, other: number | undefined): number | null {
  if (!price || !other) return null;
  const a = 1 / price;
  return a / (a + 1 / other);
}

// Margin-free probability of "Over" (or "Yes") for one market and line, or
// null when the books do not price both sides.
export function marketProbability(
  event: OddsEvent | null,
  marketKey: string,
  yes: string,
  no: string,
  point?: number,
): number | null {
  if (!event) return null;
  const outcomes = averageOutcomes(event, marketKey).filter((o) => o.point === point);
  return twoWayProbability(
    outcomes.find((o) => o.name === yes)?.price,
    outcomes.find((o) => o.name === no)?.price,
  );
}

export type ScorerOdds = { player: string; price: number };

// Anytime goalscorer prices, shortest first. Player names come from the
// bookmakers, so they are current squad members of one of the two teams.
export function scorerOdds(event: OddsEvent | null): ScorerOdds[] {
  if (!event) return [];
  return averageOutcomes(event, "player_goal_scorer_anytime")
    .flatMap((o) => (o.name === "Yes" && o.description?.trim() ? [{ player: o.description.trim(), price: o.price }] : []))
    .sort((a, b) => a.price - b.price);
}

export function formatOdds(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "–";
  return value.toFixed(2);
}
