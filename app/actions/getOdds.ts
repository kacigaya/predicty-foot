"use server";

import { unstable_rethrow } from "next/navigation";
import { fetchOdds, OddsApiError } from "@/app/lib/odds";
import { withCrests, type Fixture } from "@/app/lib/crests";
import { isLeagueKey } from "@/app/lib/leagues";

export type GetOddsResult =
  | { ok: true; events: Fixture[]; fetchedAt: string }
  | { ok: false; error: string; status?: number };

// Provider error bodies and the missing-key hint are logged, not shown: they
// describe server configuration, which the browser has no use for.
function publicMessage(err: OddsApiError): string {
  if (err.status === 401 || err.status === 403) return "The odds provider rejected the API key.";
  if (err.status === 429) return "The odds provider's rate limit was reached. Try again in a minute.";
  return "The odds feed is unavailable right now.";
}

export async function getOddsAction(sportKey: string): Promise<GetOddsResult> {
  if (!isLeagueKey(sportKey)) {
    return { ok: false, error: "Unknown league.", status: 400 };
  }
  try {
    const { events, fetchedAt } = await fetchOdds(sportKey);
    return { ok: true, events: events.map(withCrests), fetchedAt };
  } catch (err) {
    // Next signals dynamic rendering by throwing; its message carries the
    // request URL, API key included, so it must never reach the log below.
    unstable_rethrow(err);
    console.error("[getOddsAction]", err);
    if (err instanceof OddsApiError) {
      return { ok: false, error: publicMessage(err), status: err.status };
    }
    return { ok: false, error: "The odds feed is unavailable right now." };
  }
}
