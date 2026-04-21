"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { TeamCrest } from "@/app/components/TeamCrest";
import { PredictionModal } from "@/app/components/PredictionModal";
import {
  averageH2HOdds,
  formatOdds,
  impliedProbabilities,
  type OddsEvent,
} from "@/app/lib/odds";

export function MatchCard({ event, index }: { event: OddsEvent; index: number }) {
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

  const num = String(index + 1).padStart(2, "0");

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group relative text-left bg-[#0a0a09] p-6 transition-colors hover:bg-[#131311] focus:outline-none focus-visible:bg-[#131311]"
      >
        {/* Index number watermark */}
        <span
          aria-hidden
          className="pointer-events-none absolute right-4 top-4 font-display text-6xl italic text-[#1c1c19] group-hover:text-[#2a2a25] transition-colors"
        >
          {num}
        </span>

        {/* Meta row */}
        <div className="relative flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63] mb-6">
          <span>{format(kickoff, "EEE d MMM · HH:mm")}</span>
          <span className="text-[#d8ff3e]">
            {formatDistanceToNowStrict(kickoff, { addSuffix: true })}
          </span>
        </div>

        {/* Teams — stacked editorial */}
        <div className="relative space-y-3 mb-6">
          <TeamRow
            name={event.home_team}
            label="Home"
            favored={favored === "home"}
          />
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-[#2a2a25]" />
            <span className="font-display text-xs italic text-[#4a4a44]">versus</span>
            <span className="h-px flex-1 bg-[#2a2a25]" />
          </div>
          <TeamRow
            name={event.away_team}
            label="Away"
            favored={favored === "away"}
          />
        </div>

        {/* Odds — huge tabular */}
        <div className="relative grid grid-cols-3 border-t border-[#2a2a25]">
          <OddCell label="1" value={formatOdds(avg.home)} highlight={favored === "home"} />
          <OddCell label="X" value={formatOdds(avg.draw)} highlight={favored === "draw"} border />
          <OddCell label="2" value={formatOdds(avg.away)} highlight={favored === "away"} />
        </div>

        {/* CTA hint */}
        <div className="relative mt-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em]">
          <span className="text-[#6a6a63]">Read the analysis</span>
          <span className="flex items-center gap-1 text-[#d8ff3e] transition-transform group-hover:translate-x-1">
            → Open
          </span>
        </div>
      </button>

      <PredictionModal event={event} open={open} onOpenChange={setOpen} />
    </>
  );
}

function TeamRow({
  name,
  label,
  favored,
}: {
  name: string;
  label: string;
  favored: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <TeamCrest name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a4a44]">
          {label}
          {favored && (
            <span className="ml-2 text-[#d8ff3e]">• favored</span>
          )}
        </p>
        <p className="font-display text-xl leading-tight text-[#f4efe2] truncate">
          {name}
        </p>
      </div>
    </div>
  );
}

function OddCell({
  label,
  value,
  highlight,
  border,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  border?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-4 ${
        border ? "border-x border-[#2a2a25]" : ""
      } ${highlight ? "bg-[#d8ff3e]/[0.06]" : ""}`}
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a4a44]">
        {label}
      </span>
      <span
        className={`mt-1 font-mono text-2xl tabular-nums ${
          highlight ? "text-[#d8ff3e]" : "text-[#f4efe2]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
