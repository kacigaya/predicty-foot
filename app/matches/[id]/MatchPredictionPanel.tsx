"use client";

import { useState, useTransition } from "react";
import { Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Confetti } from "@/app/components/Confetti";
import { generatePredictionAction } from "@/app/actions/generatePrediction";
import type { AIPrediction } from "@/app/lib/gemini";
import type { OddsEvent } from "@/app/lib/odds";
import { averageH2HOdds, impliedProbabilities } from "@/app/lib/odds";
import { format } from "date-fns";

export function MatchPredictionPanel({
  eventId,
  sportKey,
  event,
}: {
  eventId: string;
  sportKey: string;
  event: OddsEvent;
}) {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confettiKey, setConfettiKey] = useState(0);
  const [isPending, startTransition] = useTransition();

  const onGenerate = () => {
    setError(null);
    startTransition(async () => {
      const res = await generatePredictionAction(eventId, sportKey);
      if (!res.ok) {
        setError(res.error);
        toast.error("Prediction failed", { description: res.error });
        return;
      }
      setPrediction(res.prediction);
      toast.success("Prediction ready");
      if (res.prediction.confidence > 75) setConfettiKey((k) => k + 1);
    });
  };

  const avg = averageH2HOdds(event);
  const implied = impliedProbabilities(avg);

  return (
    <div className="rounded-xl border border-[#252d3a] bg-[#1e2430] p-5">
      {confettiKey > 0 && <Confetti trigger={confettiKey} />}

      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-white">AI Prediction</h3>
          <p className="text-xs text-[#7c8494]">
            Fuses live market consensus with AI match analysis.
          </p>
        </div>
        <Button onClick={onGenerate} disabled={isPending} size="default">
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ChevronRight className="size-4" />
          )}
          {prediction ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {isPending && (
        <p className="mt-4 text-sm text-[#7c8494]">
          Analysing form, H2H, and {event.bookmakers.length} bookmakers…
        </p>
      )}

      {error && !isPending && (
        <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {prediction && !isPending && (
        <div className="mt-5 space-y-4">
          <div className="rounded-lg border border-amber-600/20 bg-amber-500/5 p-4">
            <p className="text-[10px] uppercase tracking-wider text-[#7c8494]">Predicted result</p>
            <p className="mt-1 text-lg font-bold text-white">
              {prediction.winner === "draw" ? "Draw" : `${prediction.winnerTeam} win`}
            </p>
            <p className="text-3xl font-black tabular-nums text-amber-400">
              {prediction.score.home} – {prediction.score.away}
            </p>
            <p className="mt-2 text-xs text-[#7c8494]">
              Confidence: <span className="font-semibold text-white">{prediction.confidence}%</span>
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <ProbMini label="Home" ai={prediction.aiProbabilities.home} market={implied.home} />
            <ProbMini label="Draw" ai={prediction.aiProbabilities.draw} market={implied.draw} />
            <ProbMini label="Away" ai={prediction.aiProbabilities.away} market={implied.away} />
          </div>

          <div className="rounded-lg border border-[#252d3a] bg-[#0e1117] p-3 text-sm leading-relaxed text-[#e4e8ee]">
            {prediction.reasoning}
          </div>

          {prediction.keyFactors.length > 0 && (
            <ul className="grid gap-1.5 sm:grid-cols-2">
              {prediction.keyFactors.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 rounded-md bg-[#0e1117] p-2 text-xs text-[#e4e8ee]"
                >
                  <span className="mt-0.5 size-1.5 rounded-full bg-amber-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-lg border border-amber-600/20 bg-amber-500/5 p-3">
            <p className="text-[10px] uppercase tracking-wider text-amber-400">Suggested bet</p>
            <p className="text-sm font-semibold text-white">
              {prediction.suggestedBet.market} — {prediction.suggestedBet.pick}
            </p>
            {prediction.suggestedBet.rationale && (
              <p className="mt-1 text-xs text-[#7c8494]">{prediction.suggestedBet.rationale}</p>
            )}
          </div>

          <p className="text-[11px] text-[#4a5060]">
            Generated {format(new Date(prediction.generatedAt), "HH:mm:ss")}
          </p>
        </div>
      )}
    </div>
  );
}

function ProbMini({ label, ai, market }: { label: string; ai: number; market: number }) {
  const edge = ai - market;
  const tone =
    edge > 0.03 ? "text-green-400" : edge < -0.03 ? "text-red-400" : "text-[#4a5060]";
  return (
    <div className="rounded-lg border border-[#252d3a] bg-[#0e1117] p-2.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7c8494]">
          {label}
        </span>
        <span className={`text-[10px] ${tone}`}>
          {edge > 0 ? "+" : ""}
          {(edge * 100).toFixed(1)}%
        </span>
      </div>
      <div className="mt-1.5 flex items-end justify-between text-xs">
        <span className="text-amber-400">AI {(ai * 100).toFixed(0)}%</span>
        <span className="text-[#4a5060]">Mkt {(market * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
