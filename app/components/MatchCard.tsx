"use client";

import { useMemo } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { TeamCrest } from "@/app/components/TeamCrest";
import { PredictionModal } from "@/app/components/PredictionModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    <Card
      render={<article />}
      className="flex flex-1 flex-col p-5 transition-[border-color,box-shadow] hover:border-foreground/25 hover:shadow-xs"
    >
      <time
        dateTime={event.commence_time}
        className="mb-3 font-mono text-xs text-muted-foreground tabular-nums"
      >
        {format(kickoff, "EEE d MMM, HH:mm")}
      </time>

      <div className="mb-4 space-y-2.5">
        <TeamRow name={event.home_team} favored={favored === "home"} />
        <TeamRow name={event.away_team} favored={favored === "away"} />
      </div>

      <dl className="grid grid-cols-3 rounded-xl border border-border/70 bg-muted/30 p-1.5">
        <OddCell
          label="1"
          title="Home win"
          value={formatOdds(avg.home)}
          highlight={favored === "home"}
        />
        <OddCell
          label="X"
          title="Draw"
          value={formatOdds(avg.draw)}
          highlight={favored === "draw"}
        />
        <OddCell
          label="2"
          title="Away win"
          value={formatOdds(avg.away)}
          highlight={favored === "away"}
        />
      </dl>

      <div className="mt-4 flex items-center justify-between gap-2 pt-1">
        <PredictionModal event={event}>
          <Button size="sm">Predict</Button>
        </PredictionModal>
        <Button
          size="sm"
          variant="ghost"
          render={
            <Link
              href={`/matches/${encodeURIComponent(event.id)}?sport=${encodeURIComponent(event.sport_key)}`}
            />
          }
        >
          Details
        </Button>
      </div>
    </Card>
  );
}

function TeamRow({ name, favored }: { name: string; favored: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <TeamCrest name={name} size="sm" />
      <p
        className="flex-1 truncate text-sm font-medium text-foreground leading-none"
        title={name}
      >
        {name}
      </p>
      {favored && (
        <span
          className="size-1.5 shrink-0 rounded-full bg-primary"
          title="Market favourite"
        >
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
    <div className="flex flex-col items-center py-1.5 text-center">
      <dt className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
        <abbr title={title} className="no-underline">
          {label}
        </abbr>
      </dt>
      <dd
        className={cn(
          "font-mono text-base font-semibold tabular-nums mt-0.5",
          highlight ? "text-foreground font-bold" : "text-muted-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}
