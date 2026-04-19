import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Calendar, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[#7c8494] hover:text-amber-400 transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Back to matches
      </Link>

      <Card className="overflow-hidden">
        <div className="border-b border-[#252d3a] p-6">
          <div className="flex items-center justify-between text-xs text-[#7c8494]">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#252d3a] bg-[#1e2430] px-2.5 py-1">
              {league?.flag} {league?.name ?? event.sport_title}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3" />
              {format(kickoff, "EEE d MMM yyyy · HH:mm")}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="flex flex-col items-center gap-3 text-center">
              <TeamCrest name={event.home_team} size="lg" />
              <p className="text-base font-semibold text-white">{event.home_team}</p>
              <p className="text-xs text-[#7c8494]">
                {formatOdds(avg.home)} · {(implied.home * 100).toFixed(0)}% implied
              </p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-[#4a5060]">VS</p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-[#4a5060]">
                Draw {formatOdds(avg.draw)}
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <TeamCrest name={event.away_team} size="lg" />
              <p className="text-base font-semibold text-white">{event.away_team}</p>
              <p className="text-xs text-[#7c8494]">
                {formatOdds(avg.away)} · {(implied.away * 100).toFixed(0)}% implied
              </p>
            </div>
          </div>
        </div>

        <CardContent className="space-y-8 p-6">
          <MatchPredictionPanel eventId={event.id} sportKey={sportKey} event={event} />

          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">
              All bookmaker odds
            </h3>
            <OddsTable event={event} />
            <p className="mt-2 text-[11px] text-[#4a5060]">
              {event.bookmakers.length} bookmakers · best price highlighted
            </p>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" asChild>
              <Link href="/">
                Browse more matches <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
