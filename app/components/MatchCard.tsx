"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { TeamCrest } from "@/app/components/TeamCrest";
import { PredictionModal } from "@/app/components/PredictionModal";
import {
  averageH2HOdds,
  formatOdds,
  impliedProbabilities,
  type OddsEvent,
} from "@/app/lib/odds";

export function MatchCard({ event }: { event: OddsEvent }) {
  const [open, setOpen] = useState(false);

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
    <>
      <Card className="group relative overflow-hidden transition-colors hover:border-[#30363d]">
        {/* Accent stripe on left */}
        <div className="absolute inset-y-0 left-0 w-0.5 bg-amber-500/60 opacity-0 group-hover:opacity-100 transition-opacity" />

        <CardContent className="p-5 space-y-4">
          {/* Date & countdown */}
          <div className="flex items-center justify-between text-[11px] text-[#7c8494]">
            <div className="flex items-center gap-1.5">
              <Calendar className="size-3" />
              <span>{format(kickoff, "EEE d MMM · HH:mm")}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              <Clock className="size-3" />
              <span>{formatDistanceToNowStrict(kickoff, { addSuffix: true })}</span>
            </div>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <div className="flex flex-col items-center gap-2 text-center">
              <TeamCrest name={event.home_team} size="md" />
              <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">
                {event.home_team}
              </p>
              {favored === "home" && (
                <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wide">
                  Favored
                </span>
              )}
            </div>

            <div className="flex flex-col items-center justify-center text-[#4a5060]">
              <span className="text-[10px] font-bold uppercase tracking-widest">vs</span>
            </div>

            <div className="flex flex-col items-center gap-2 text-center">
              <TeamCrest name={event.away_team} size="md" />
              <p className="text-sm font-semibold text-white line-clamp-2 leading-tight">
                {event.away_team}
              </p>
              {favored === "away" && (
                <span className="text-[10px] font-medium text-amber-500 uppercase tracking-wide">
                  Favored
                </span>
              )}
            </div>
          </div>

          {/* Odds */}
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-[#252d3a] bg-[#252d3a]">
            <OddCell label="1" value={formatOdds(avg.home)} highlight={favored === "home"} />
            <OddCell label="X" value={formatOdds(avg.draw)} highlight={favored === "draw"} />
            <OddCell label="2" value={formatOdds(avg.away)} highlight={favored === "away"} />
          </div>

          <Button
            onClick={() => setOpen(true)}
            variant="secondary"
            className="w-full group/btn"
            size="default"
          >
            Get Prediction
            <ChevronRight className="size-3.5 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
        </CardContent>
      </Card>

      <PredictionModal event={event} open={open} onOpenChange={setOpen} />
    </>
  );
}

function OddCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-2.5 transition-colors ${
        highlight ? "bg-amber-500/8" : "bg-[#0e1117]"
      }`}
    >
      <span className="text-[10px] font-medium text-[#4a5060] uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-sm font-bold tabular-nums ${
          highlight ? "text-amber-400" : "text-[#e4e8ee]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
