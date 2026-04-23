"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { TeamCrest } from "@/app/components/TeamCrest";
import { PredictionModal } from "@/app/components/PredictionModal";
import {
  averageH2HOdds,
  formatOdds,
  impliedProbabilities,
  type OddsEvent,
} from "@/app/lib/odds";

export function MatchCard({ event }: { event: OddsEvent; index: number }) {
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
      <button
        onClick={() => setOpen(true)}
        className="group relative text-left bg-[#0a0a09] p-5 transition-colors hover:bg-[#131311] focus:outline-none focus-visible:bg-[#131311]"
      >
        {/* Meta */}
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63] mb-4">
          {format(kickoff, "EEE d MMM · HH:mm")}
        </p>

        {/* Teams */}
        <div className="space-y-2 mb-4">
          <TeamRow name={event.home_team} favored={favored === "home"} />
          <TeamRow name={event.away_team} favored={favored === "away"} />
        </div>

        {/* Odds */}
        <div className="grid grid-cols-3 border-t border-[#2a2a25] pt-3">
          <OddCell label="1" value={formatOdds(avg.home)} highlight={favored === "home"} />
          <OddCell label="X" value={formatOdds(avg.draw)} highlight={favored === "draw"} />
          <OddCell label="2" value={formatOdds(avg.away)} highlight={favored === "away"} />
        </div>

        {/* CTA */}
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a4a44] group-hover:text-[#d8ff3e] transition-colors text-right">
          →
        </p>
      </button>

      <PredictionModal event={event} open={open} onOpenChange={setOpen} />
    </>
  );
}

function TeamRow({ name, favored }: { name: string; favored: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <TeamCrest name={name} size="sm" />
      <p className="font-display text-lg leading-tight text-[#f4efe2] truncate flex-1">
        {name}
      </p>
      {favored && (
        <span className="size-1.5 rounded-full bg-[#d8ff3e] shrink-0" />
      )}
    </div>
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
    <div className="flex flex-col items-center py-2">
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a4a44]">
        {label}
      </span>
      <span
        className={`font-mono text-xl tabular-nums ${
          highlight ? "text-[#d8ff3e]" : "text-[#f4efe2]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
