"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { TeamCrest } from "@/app/components/TeamCrest";
import { PredictionModal } from "@/app/components/PredictionModal";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";
import {
  averageH2HOdds,
  formatOdds,
  impliedProbabilities,
  type OddsEvent,
} from "@/app/lib/odds";

export function MatchCard({ event }: { event: OddsEvent }) {
  const avg = useMemo(() => averageH2HOdds(event), [event]);
  const implied = useMemo(() => impliedProbabilities(avg), [avg]);
  const kickoff = new Date(event.commence_time);

  const favored =
    implied.home >= implied.draw && implied.home >= implied.away
      ? "home"
      : implied.away >= implied.draw
      ? "away"
      : "draw";

  return (
    <article className="flex flex-1 flex-col rounded-sm border border-line bg-surface p-5">
      <time
        dateTime={event.commence_time}
        className="mb-4 font-mono text-xs uppercase tabular-nums text-muted"
      >
        {format(kickoff, "EEE d MMM, HH:mm")}
      </time>

      <div className="mb-4 space-y-2">
        <TeamRow name={event.home_team} favored={favored === "home"} />
        <TeamRow name={event.away_team} favored={favored === "away"} />
      </div>

      <dl className="grid grid-cols-3 border-t border-line pt-3">
        <OddCell label="1" title="Home win" value={formatOdds(avg.home)} highlight={favored === "home"} />
        <OddCell label="X" title="Draw" value={formatOdds(avg.draw)} highlight={favored === "draw"} />
        <OddCell label="2" title="Away win" value={formatOdds(avg.away)} highlight={favored === "away"} />
      </dl>

      <div className="mt-4 flex items-center justify-between gap-2">
        <PredictionModal event={event}>
          <Button size="sm">Predict</Button>
        </PredictionModal>
        <Button size="sm" variant="ghost" asChild>
          <Link href={`/matches/${encodeURIComponent(event.id)}?sport=${encodeURIComponent(event.sport_key)}`}>
            Details
          </Link>
        </Button>
      </div>
    </article>
  );
}

function TeamRow({ name, favored }: { name: string; favored: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <TeamCrest name={name} size="sm" />
      <p className="flex-1 truncate text-base leading-tight text-foreground" title={name}>
        {name}
      </p>
      {favored && (
        <span className="size-1.5 shrink-0 rounded-full bg-accent">
          <span className="sr-only">Market favourite</span>
        </span>
      )}
    </div>
  );
}

function OddCell({
  label,
  title,
  value,
  highlight,
}: {
  label: string;
  title: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center py-2">
      <dt className="font-mono text-xs uppercase text-muted">
        <abbr title={title} className="no-underline">
          {label}
        </abbr>
      </dt>
      <dd
        className={cn(
          "font-mono text-xl tabular-nums",
          highlight ? "text-accent" : "text-foreground"
        )}
      >
        {value}
      </dd>
    </div>
  );
}
