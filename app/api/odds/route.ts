import { NextRequest, NextResponse } from "next/server";
import { fetchOdds, OddsApiError } from "@/app/lib/odds";
import { DEFAULT_LEAGUE_KEY, LEAGUES } from "@/app/lib/leagues";
import { createInMemoryRateLimiter } from "@/app/lib/rate-limit";

export const revalidate = 60;

const ALLOWED_SPORT_KEYS = new Set(LEAGUES.map((l) => l.key));
const oddsRateLimiter = createInMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
});

export async function GET(request: NextRequest) {
  if (oddsRateLimiter.check(request)) {
    return NextResponse.json({ ok: false, error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const sportKey = searchParams.get("sportKey") ?? DEFAULT_LEAGUE_KEY;

  // Validate sportKey against whitelist to prevent arbitrary API calls
  if (!ALLOWED_SPORT_KEYS.has(sportKey)) {
    return NextResponse.json(
      { ok: false, error: "Invalid sport key." },
      { status: 400 }
    );
  }

  try {
    const events = await fetchOdds(sportKey, { revalidate: 60 });
    return NextResponse.json(
      { ok: true, sportKey, count: events.length, fetchedAt: new Date().toISOString(), events },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (err) {
    // Return safe error messages — never leak internal details
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
