"use server";

import { fetchOdds, OddsApiError, type OddsEvent } from "@/app/lib/odds";

export type GetOddsResult =
  | { ok: true; events: OddsEvent[]; fetchedAt: string }
  | { ok: false; error: string; status?: number };

export async function getOddsAction(sportKey: string): Promise<GetOddsResult> {
  try {
    const events = await fetchOdds(sportKey, { revalidate: 60 });
    return { ok: true, events, fetchedAt: new Date().toISOString() };
  } catch (err) {
    if (err instanceof OddsApiError) {
      return { ok: false, error: err.message, status: err.status };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown error fetching odds.",
    };
  }
}
