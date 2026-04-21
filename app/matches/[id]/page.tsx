import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { TeamCrest } from "@/app/components/TeamCrest";
import { OddsTable } from "@/app/components/OddsTable";
import { MatchPredictionPanel } from "@/app/matches/[id]/MatchPredictionPanel";
import {
  averageH2HOdds,
  findEventAcrossLeagues,
  formatOdds,
  impliedProbabilities,
} from "@/app/lib/odds";
import { LEAGUES, getLeague } from "@/app/lib/leagues";

export const revalidate = 60;

export default async function MatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sport?: string }>;
}) {
  const { id } = await params;
  const { sport } = await searchParams;

  const keys = sport ? [sport, ...LEAGUES.map((l) => l.key)] : LEAGUES.map((l) => l.key);
  const found = await findEventAcrossLeagues(keys, id);
  if (!found) notFound();

  const { event, sportKey } = found;
  const league = getLeague(sportKey);
  const avg = averageH2HOdds(event);
  const implied = impliedProbabilities(avg);
  const kickoff = new Date(event.commence_time);

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#7b7a70] hover:text-[#d8ff3e] transition-colors"
      >
        <ArrowLeft className="size-3" />
        Back to fixtures
      </Link>

      {/* Editorial masthead */}
      <div className="border-b border-[#2a2a25] pb-10">
        <div className="flex items-center justify-between mb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d8ff3e]">
            {league?.flag} {league?.name ?? event.sport_title}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
            {format(kickoff, "EEE d MMM yyyy · HH:mm")}
          </p>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <TeamCrest name={event.home_team} size="lg" />
            <p className="font-display text-3xl italic text-[#f4efe2] leading-tight">
              {event.home_team}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl text-[#d8ff3e] tabular-nums">
                {formatOdds(avg.home)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
                {(implied.home * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 px-3">
            <span className="font-display text-6xl italic text-[#4a4a44] leading-none">
              /
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
              Draw {formatOdds(avg.draw)}
            </span>
          </div>
          <div className="flex flex-col items-center gap-4 text-center">
            <TeamCrest name={event.away_team} size="lg" />
            <p className="font-display text-3xl italic text-[#f4efe2] leading-tight">
              {event.away_team}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl text-[#d8ff3e] tabular-nums">
                {formatOdds(avg.away)}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
                {(implied.away * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-10 py-10">
        <MatchPredictionPanel eventId={event.id} sportKey={sportKey} event={event} />

        <div>
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
            § Market ledger — {event.bookmakers.length} bookmakers
          </p>
          <OddsTable event={event} />
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" asChild>
            <Link href="/">
              More fixtures <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
