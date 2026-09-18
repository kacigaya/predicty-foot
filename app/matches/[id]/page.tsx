import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { TeamCrest } from "@/app/components/TeamCrest";
import { OddsTable } from "@/app/components/OddsTable";
import { MatchPredictionPanel } from "@/app/matches/[id]/MatchPredictionPanel";
import {
  averageH2HOdds,
  findEventAcrossLeagues,
  formatOdds,
  impliedProbabilities,
  type OddsEvent,
} from "@/app/lib/odds";
import { LEAGUES, getLeague } from "@/app/lib/leagues";

export const revalidate = 60;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sport?: string }>;
};

const LEAGUE_KEYS = LEAGUES.map((l) => l.key);

async function loadMatch(props: Props) {
  const { id } = await props.params;
  const { sport } = await props.searchParams;
  // The hint only reorders the search; an unknown key is ignored, never fetched.
  const keys = sport && LEAGUE_KEYS.includes(sport) ? [sport, ...LEAGUE_KEYS] : LEAGUE_KEYS;
  return findEventAcrossLeagues(keys, id);
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const found = await loadMatch(props);
  if (!found) return { title: "Match not found", robots: { index: false } };
  const { event, sportKey } = found;
  const title = `${event.home_team} vs ${event.away_team}`;
  const description = `${event.sport_title} odds and Gemini prediction for ${title}, kick-off ${format(new Date(event.commence_time), "EEE d MMM yyyy, HH:mm")} UTC.`;
  const path = `/matches/${encodeURIComponent(event.id)}?sport=${encodeURIComponent(sportKey)}`;
  return {
    title,
    description,
    // Fixtures expire after kick-off, so they are not worth indexing.
    robots: { index: false, follow: true },
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
    twitter: { title, description },
  };
}

export default async function MatchPage(props: Props) {
  const found = await loadMatch(props);
  if (!found) notFound();

  const { event, sportKey } = found;
  const league = getLeague(sportKey);
  const avg = averageH2HOdds(event);
  const implied = impliedProbabilities(avg);
  const kickoff = new Date(event.commence_time);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 rounded-sm font-mono text-xs uppercase text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <ArrowLeft aria-hidden className="size-3" />
        All fixtures
      </Link>

      <div className="border-b border-line pb-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-xs uppercase text-accent">
            {league?.name ?? event.sport_title}
          </p>
          <time dateTime={event.commence_time} className="font-mono text-xs uppercase tabular-nums text-muted">
            {format(kickoff, "EEE d MMM yyyy, HH:mm")}
          </time>
        </div>

        <h1 className="sr-only">
          {event.home_team} vs {event.away_team}
        </h1>

        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 sm:gap-6">
          <TeamSummary name={event.home_team} odds={formatOdds(avg.home)} prob={implied.home} />
          <div className="flex flex-col items-center gap-1 self-center px-2">
            <span className="font-mono text-xs uppercase text-muted">Draw</span>
            <span className="font-mono text-xl tabular-nums text-foreground">{formatOdds(avg.draw)}</span>
            <span className="font-mono text-xs tabular-nums text-muted">{(implied.draw * 100).toFixed(0)}%</span>
          </div>
          <TeamSummary name={event.away_team} odds={formatOdds(avg.away)} prob={implied.away} />
        </div>
      </div>

      <div className="space-y-10 py-10">
        <MatchPredictionPanel sportKey={sportKey} event={event} />

        <section aria-labelledby="bookmakers-heading">
          <h2 id="bookmakers-heading" className="mb-4 font-display text-2xl text-foreground">
            All bookmakers <span className="font-mono text-sm tabular-nums text-muted">({event.bookmakers.length})</span>
          </h2>
          <OddsTable event={event} />
        </section>
      </div>
    </div>
  );
}

function TeamSummary({ name, odds, prob }: { name: OddsEvent["home_team"]; odds: string; prob: number }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <TeamCrest name={name} size="lg" />
      <p className="text-balance font-display text-2xl leading-tight text-foreground sm:text-3xl">{name}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-2xl tabular-nums text-accent">{odds}</span>
        <span className="font-mono text-xs tabular-nums text-muted">{(prob * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
