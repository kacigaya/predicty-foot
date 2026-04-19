import { NextResponse } from "next/server";
import { fetchOdds, OddsApiError } from "@/app/lib/odds";
import { DEFAULT_LEAGUE_KEY } from "@/app/lib/leagues";

export const revalidate = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sportKey = searchParams.get("sportKey") ?? DEFAULT_LEAGUE_KEY;

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
    const status = err instanceof OddsApiError ? err.status : 500;
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
