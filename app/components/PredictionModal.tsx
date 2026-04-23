"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Target, Info, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { TeamCrest } from "@/app/components/TeamCrest";
import { OddsTable } from "@/app/components/OddsTable";
import { Confetti } from "@/app/components/Confetti";
import { generatePredictionAction } from "@/app/actions/generatePrediction";
import type { AIPrediction } from "@/app/lib/gemini";
import {
  averageH2HOdds,
  formatOdds,
  impliedProbabilities,
  type OddsEvent,
} from "@/app/lib/odds";

export function PredictionModal({
  event,
  open,
  onOpenChange,
}: {
  event: OddsEvent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const avg = averageH2HOdds(event);
  const implied = impliedProbabilities(avg);

  const onGenerate = () => {
    setError(null);
    startTransition(async () => {
      const result = await generatePredictionAction(event.id, event.sport_key);
      if (!result.ok) {
        setError(result.error);
        toast.error("Prediction failed", { description: result.error });
        return;
      }
      setPrediction(result.prediction);
      toast.success("Prediction ready");
      if (result.prediction.confidence > 75) {
        setConfettiKey((k) => k + 1);
      }
    });
  };

  return (
    <>
      {confettiKey > 0 && <Confetti trigger={confettiKey} />}
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogDescription>
              {event.sport_title} · {format(new Date(event.commence_time), "EEE d MMM yyyy · HH:mm")}
            </DialogDescription>
            <DialogTitle>
              The <em>matter</em> at hand.
            </DialogTitle>
          </DialogHeader>

          {/* Teams face-off — editorial */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-6 border-b border-[#2a2a25]">
            <TeamPanel
              name={event.home_team}
              odds={formatOdds(avg.home)}
              prob={implied.home}
              side="left"
            />
            <div className="flex flex-col items-center gap-2 px-2">
              <span className="font-display text-4xl italic text-[#4a4a44]">/</span>
              <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6a6a63]">
                Draw {formatOdds(avg.draw)}
              </span>
            </div>
            <TeamPanel
              name={event.away_team}
              odds={formatOdds(avg.away)}
              prob={implied.away}
              side="right"
            />
          </div>

          {!prediction && !isPending && (
            <div className="space-y-5 pt-5">
              <div className="border border-[#2a2a25] bg-[#0a0a09] p-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 size-4 shrink-0 text-[#d8ff3e]" />
                  <p className="text-sm leading-relaxed text-[#c7c2b4]">
                    A reading combining live market consensus from{" "}
                    <span className="font-mono text-[#d8ff3e]">{event.bookmakers.length}</span> bookmakers with Gemini match analysis.
                  </p>
                </div>
              </div>
              <Button onClick={onGenerate} size="lg" className="w-full">
                Commission Prediction
                <ChevronRight className="size-4" />
              </Button>
              <div className="border-t border-[#2a2a25] pt-6">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
                  § Market ledger — all bookmakers
                </p>
                <OddsTable event={event} />
              </div>
            </div>
          )}

          {isPending && <PredictionSkeleton />}

          {prediction && !isPending && (
            <PredictionView
              prediction={prediction}
              event={event}
              onRegenerate={onGenerate}
            />
          )}

          {error && (
            <div className="border border-[#ff5b36]/30 bg-[#ff5b36]/5 p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff5b36] mb-1">
                Error
              </p>
              <p className="text-sm text-[#f4efe2]">{error}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function TeamPanel({
  name,
  odds,
  prob,
  side,
}: {
  name: string;
  odds: string;
  prob: number;
  side: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 ${
        side === "left" ? "sm:items-end" : "sm:items-start"
      }`}
    >
      <TeamCrest name={name} size="lg" />
      <p className="text-center font-display text-2xl italic text-[#f4efe2] leading-tight">
        {name}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-lg text-[#d8ff3e] tabular-nums">{odds}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
          {(prob * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

function PredictionSkeleton() {
  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-center gap-3 py-6">
        <Loader2 className="size-5 animate-spin text-[#d8ff3e]" />
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7b7a70]">
          Reading the match…
        </span>
      </div>
      <div className="h-24 animate-pulse bg-[#1c1c19]" />
      <div className="h-24 animate-pulse bg-[#1c1c19]" />
    </div>
  );
}

function PredictionView({
  prediction,
  event,
  onRegenerate,
}: {
  prediction: AIPrediction;
  event: OddsEvent;
  onRegenerate: () => void;
}) {
  const avg = averageH2HOdds(event);
  const implied = impliedProbabilities(avg);
  const confidenceTone =
    prediction.confidence >= 75
      ? "success"
      : prediction.confidence >= 55
      ? "default"
      : "warning";

  return (
    <div className="space-y-6 pt-6">
      {/* Verdict — headline treatment */}
      <div className="relative border-l-2 border-[#d8ff3e] pl-6 py-2">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant={confidenceTone}>{prediction.confidence}% conviction</Badge>
          {prediction.confidence >= 75 && (
            <Badge variant="success">High ·</Badge>
          )}
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
          The Verdict
        </p>
        <p className="mt-1 font-display text-3xl italic text-[#f4efe2]">
          {prediction.winner === "draw"
            ? "A share of the spoils."
            : `${prediction.winnerTeam} take it.`}
        </p>
        <p className="mt-3 font-mono text-5xl tabular-nums text-[#d8ff3e]">
          {prediction.score.home}<span className="text-[#4a4a44] mx-3">—</span>{prediction.score.away}
        </p>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
          {event.home_team.split(" ")[0]} · {event.away_team.split(" ")[0]}
        </p>
      </div>

      {/* Probabilities */}
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
          § Probability — AI vs Market
        </p>
        <div className="grid gap-px bg-[#2a2a25] border border-[#2a2a25] sm:grid-cols-3">
          <ProbRow
            label="Home"
            team={event.home_team}
            ai={prediction.aiProbabilities.home}
            market={implied.home}
          />
          <ProbRow
            label="Draw"
            team="Draw"
            ai={prediction.aiProbabilities.draw}
            market={implied.draw}
          />
          <ProbRow
            label="Away"
            team={event.away_team}
            ai={prediction.aiProbabilities.away}
            market={implied.away}
          />
        </div>
      </div>

      {/* Reasoning */}
      <div>
        <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
          § Reasoning
        </p>
        <p className="font-display text-xl italic leading-relaxed text-[#c7c2b4] first-letter:font-display first-letter:text-5xl first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:text-[#d8ff3e] first-letter:not-italic">
          {prediction.reasoning}
        </p>
      </div>

      {/* Key factors */}
      {prediction.keyFactors.length > 0 && (
        <div>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
            § Key factors
          </p>
          <ul className="grid gap-px bg-[#2a2a25] border border-[#2a2a25] sm:grid-cols-2">
            {prediction.keyFactors.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-3 bg-[#0a0a09] p-4 text-sm text-[#f4efe2]"
              >
                <span className="font-mono text-xs tabular-nums text-[#d8ff3e]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Value bet */}
      <div className="border border-[#d8ff3e]/30 bg-[#d8ff3e]/[0.04] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Target className="size-3.5 text-[#d8ff3e]" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d8ff3e]">
            The play
          </p>
        </div>
        <p className="font-display text-2xl italic text-[#f4efe2]">
          {prediction.suggestedBet.market} — {prediction.suggestedBet.pick}
        </p>
        {prediction.suggestedBet.rationale && (
          <p className="mt-2 text-sm leading-relaxed text-[#7b7a70]">
            {prediction.suggestedBet.rationale}
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#2a2a25] pt-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a4a44]">
          Filed {format(new Date(prediction.generatedAt), "HH:mm:ss")}
        </span>
        <Button variant="secondary" size="sm" onClick={onRegenerate}>
          Recompose
        </Button>
      </div>
    </div>
  );
}

function ProbRow({
  label,
  team,
  ai,
  market,
}: {
  label: string;
  team: string;
  ai: number;
  market: number;
}) {
  const edge = ai - market;
  const edgeTone =
    edge > 0.03 ? "text-[#d8ff3e]" : edge < -0.03 ? "text-[#ff5b36]" : "text-[#4a4a44]";

  return (
    <div className="bg-[#0a0a09] p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#f4efe2]">
          {label}
        </span>
        <span className={`font-mono text-[10px] tabular-nums ${edgeTone}`}>
          {edge > 0 ? "+" : ""}
          {(edge * 100).toFixed(1)}%
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-[#6a6a63]" title={team}>
        {team}
      </p>
      <div className="mt-3 space-y-2">
        <ProbBar label="AI" value={ai} tone="accent" />
        <ProbBar label="Mkt" value={market} tone="mute" />
      </div>
    </div>
  );
}

function ProbBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "mute";
}) {
  const pct = Math.max(0, Math.min(100, value * 100));
  const color = tone === "accent" ? "bg-[#d8ff3e]" : "bg-[#4a4a44]";
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 font-mono text-[9px] uppercase tracking-[0.2em] text-[#4a4a44]">
        {label}
      </span>
      <div className="h-[3px] flex-1 overflow-hidden bg-[#1c1c19]">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right font-mono text-[10px] tabular-nums text-[#7b7a70]">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}
