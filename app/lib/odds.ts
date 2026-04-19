const API_BASE = "https://api.the-odds-api.com/v4";

export type Outcome = {
  name: string;
  price: number;
  point?: number;
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

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const oddsCache = new Map<string, { data: OddsEvent[]; ts: number }>();

export async function fetchOdds(
  sportKey: string,
  opts: { revalidate?: number } = {}
): Promise<OddsEvent[]> {
  const cached = oddsCache.get(sportKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const apiKey = assertApiKey();
  const params = new URLSearchParams({
    apiKey,
    regions: "eu,uk,us",
    markets: "h2h",
    oddsFormat: "decimal",
    dateFormat: "iso",
  });

  const url = `${API_BASE}/sports/${encodeURIComponent(sportKey)}/odds/?${params.toString()}`;

  const res = await fetch(url, {
    next: { revalidate: opts.revalidate ?? 60, tags: [`odds:${sportKey}`] },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new OddsApiError(
      `Odds API error (${res.status}): ${body || res.statusText}`,
      res.status
    );
  }

  const events = (await res.json()) as OddsEvent[];
  oddsCache.set(sportKey, { data: events, ts: Date.now() });
  return events;
}

export async function fetchEventById(
  sportKey: string,
  eventId: string,
  opts: { revalidate?: number } = {}
): Promise<OddsEvent | null> {
  const events = await fetchOdds(sportKey, opts);
  return events.find((e) => e.id === eventId) ?? null;
}

export async function findEventAcrossLeagues(
  sportKeys: string[],
  eventId: string
): Promise<{ event: OddsEvent; sportKey: string } | null> {
  for (const key of sportKeys) {
    try {
      const event = await fetchEventById(key, eventId);
      if (event) return { event, sportKey: key };
    } catch {
      // swallow and try next league
    }
  }
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

export function formatOdds(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(2);
}
