import { NextRequest, NextResponse } from "next/server";
import { fetchOdds, OddsApiError } from "@/app/lib/odds";
import { DEFAULT_LEAGUE_KEY, isLeagueKey } from "@/app/lib/leagues";
import { createInMemoryRateLimiter, getClientIp } from "@/app/lib/rate-limit";

const oddsRateLimiter = createInMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
});

export async function GET(request: NextRequest) {
  if (oddsRateLimiter.check(getClientIp(request.headers))) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const sportKey = searchParams.get("sportKey") ?? DEFAULT_LEAGUE_KEY;

  if (!isLeagueKey(sportKey)) {
    return NextResponse.json(
      { ok: false, error: "Invalid sport key." },
      { status: 400 }
    );
  }

  try {
    const { events, fetchedAt } = await fetchOdds(sportKey);
    return NextResponse.json(
      { ok: true, sportKey, count: events.length, fetchedAt, events },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    // Return safe error messages; never leak internal details
    const status = err instanceof OddsApiError ? err.status : 500;
    const safeMessage =
      err instanceof OddsApiError
        ? "Failed to fetch odds from provider."
        : "An unexpected error occurred.";
    if (!(err instanceof OddsApiError)) {
      console.error("[/api/odds] Unexpected error:", err);
    }
    return NextResponse.json({ ok: false, error: safeMessage }, { status });
  }
}
