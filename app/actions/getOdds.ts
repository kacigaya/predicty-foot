"use server";

import { fetchOdds, OddsApiError, type OddsEvent } from "@/app/lib/odds";
import { LEAGUES } from "@/app/lib/leagues";

const ALLOWED_SPORT_KEYS = new Set(LEAGUES.map((l) => l.key));

export type GetOddsResult =
  | { ok: true; events: OddsEvent[]; fetchedAt: string }
  | { ok: false; error: string; status?: number };

// Provider error bodies and the missing-key hint are logged, not shown: they
// describe server configuration, which the browser has no use for.
function publicMessage(err: OddsApiError): string {
  if (err.status === 401 || err.status === 403) return "The odds provider rejected the API key.";
  if (err.status === 429) return "The odds provider's rate limit was reached. Try again in a minute.";
  return "The odds feed is unavailable right now.";
}

export async function getOddsAction(sportKey: string): Promise<GetOddsResult> {
  if (!ALLOWED_SPORT_KEYS.has(sportKey)) {
    return { ok: false, error: "Unknown league.", status: 400 };
  }
  try {
    const events = await fetchOdds(sportKey, { revalidate: 60 });
    return { ok: true, events, fetchedAt: new Date().toISOString() };
  } catch (err) {
    console.error("[getOddsAction]", err);
    if (err instanceof OddsApiError) {
      return { ok: false, error: publicMessage(err), status: err.status };
    }
    return { ok: false, error: "The odds feed is unavailable right now." };
  }
}
