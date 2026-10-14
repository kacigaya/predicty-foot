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
  // Present only when the server serves a fallback feed.
  cachedAt?: string;
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
