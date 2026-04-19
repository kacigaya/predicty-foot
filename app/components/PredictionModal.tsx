"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Loader2,
  Target,
  BarChart3,
  Info,
  ChevronRight,
} from "lucide-react";
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
            <DialogTitle>Match Analysis</DialogTitle>
            <DialogDescription>
              {event.sport_title} · {format(new Date(event.commence_time), "EEE d MMM yyyy · HH:mm")}
            </DialogDescription>
          </DialogHeader>

          {/* Teams face-off */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamCrest name={event.home_team} size="lg" />
              <p className="text-center text-sm font-semibold text-white">
                {event.home_team}
              </p>
              <p className="text-xs text-[#7c8494]">
                {formatOdds(avg.home)} · {(implied.home * 100).toFixed(0)}%
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 text-[#4a5060] px-2">
              <span className="text-xs font-bold uppercase tracking-widest">VS</span>
              <span className="text-[10px]">
                Draw {formatOdds(avg.draw)}
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 flex-1">
              <TeamCrest name={event.away_team} size="lg" />
              <p className="text-center text-sm font-semibold text-white">
                {event.away_team}
              </p>
              <p className="text-xs text-[#7c8494]">
                {formatOdds(avg.away)} · {(implied.away * 100).toFixed(0)}%
              </p>
            </div>
          </div>

          {!prediction && !isPending && (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#252d3a] bg-[#1e2430] p-4 text-sm text-[#7c8494]">
                <p className="flex items-start gap-2">
                  <Info className="mt-0.5 size-4 shrink-0 text-sky-400" />
                  <span>
                    Generate a prediction combining live market consensus from{" "}
                    <strong className="text-[#e4e8ee]">{event.bookmakers.length}</strong> bookmakers
                    with AI match analysis.
                  </span>
                </p>
              </div>
              <Button onClick={onGenerate} size="lg" className="w-full">
                Generate Prediction
                <ChevronRight className="size-4" />
              </Button>
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#7c8494]">
                  All bookmaker odds
                </h4>
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
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function PredictionSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center gap-3 py-6">
        <Loader2 className="size-5 animate-spin text-amber-500" />
        <span className="text-sm text-[#7c8494]">Analysing the match…</span>
      </div>
      <div className="h-24 animate-pulse rounded-lg bg-[#1e2430]" />
      <div className="h-24 animate-pulse rounded-lg bg-[#1e2430]" />
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
    <div className="space-y-4">
      {/* Result card */}
      <div className="rounded-lg border border-amber-600/20 bg-amber-500/5 p-5">
        <div className="flex items-center justify-between mb-3">
          <Badge variant={confidenceTone} className="gap-1">
            {prediction.confidence}% confidence
          </Badge>
          {prediction.confidence >= 75 && (
            <Badge variant="success" className="gap-1">
              High conviction
            </Badge>
          )}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#7c8494]">
            Predicted result
          </p>
          <p className="text-xl font-bold text-white mt-0.5">
            {prediction.winner === "draw"
              ? "Draw"
              : `${prediction.winnerTeam} win`}
          </p>
          <p className="text-2xl font-black tabular-nums text-amber-400 mt-1">
            {event.home_team.split(" ")[0]} {prediction.score.home} – {prediction.score.away}{" "}
            {event.away_team.split(" ")[0]}
          </p>
        </div>
      </div>

      {/* Probabilities */}
      <div className="grid gap-3 sm:grid-cols-3">
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

      {/* Reasoning */}
      <div className="rounded-lg border border-[#252d3a] bg-[#1e2430] p-4">
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7c8494]">
          <BarChart3 className="size-3.5" /> Reasoning
        </h4>
        <p className="text-sm leading-relaxed text-[#e4e8ee]">{prediction.reasoning}</p>
      </div>

      {/* Key factors */}
      {prediction.keyFactors.length > 0 && (
        <div className="rounded-lg border border-[#252d3a] bg-[#1e2430] p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#7c8494]">
            Key factors
          </h4>
          <ul className="grid gap-2 sm:grid-cols-2">
            {prediction.keyFactors.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-md bg-[#0e1117] p-2 text-xs text-[#e4e8ee]"
              >
                <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded text-[10px] font-bold text-amber-500 bg-amber-500/10">
                  {i + 1}
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Value bet */}
      <div className="rounded-lg border border-amber-600/20 bg-amber-500/5 p-4">
        <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Target className="size-3.5" /> Suggested value bet
        </h4>
        <p className="text-sm font-semibold text-white">
          {prediction.suggestedBet.market} — {prediction.suggestedBet.pick}
        </p>
        {prediction.suggestedBet.rationale && (
          <p className="mt-1 text-xs text-[#7c8494]">{prediction.suggestedBet.rationale}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#4a5060]">
        <span>
          Generated {format(new Date(prediction.generatedAt), "HH:mm:ss")}
        </span>
        <Button variant="secondary" size="sm" onClick={onRegenerate}>
          Regenerate
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
    edge > 0.03 ? "text-green-400" : edge < -0.03 ? "text-red-400" : "text-[#4a5060]";

  return (
    <div className="rounded-lg border border-[#252d3a] bg-[#0e1117] p-3">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-semibold text-[#e4e8ee]">{label}</span>
        <span className={edgeTone}>
          {edge > 0 ? "+" : ""}
          {(edge * 100).toFixed(1)}%
        </span>
      </div>
      <p className="mt-1 truncate text-xs text-[#4a5060]" title={team}>
        {team}
      </p>
      <div className="mt-2 space-y-1.5">
        <ProbBar label="AI" value={ai} tone="amber" />
        <ProbBar label="Market" value={market} tone="zinc" />
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
  tone: "amber" | "zinc";
}) {
  const pct = Math.max(0, Math.min(100, value * 100));
  const color = tone === "amber" ? "bg-amber-500" : "bg-[#4a5060]";
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-[10px] uppercase tracking-wider text-[#4a5060]">
        {label}
      </span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#1e2430]">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-[10px] tabular-nums text-[#7c8494]">
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}
