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

  const implied = impliedProbabilities(averageH2HOdds(event));

  const onGenerate = () => {
    setError(null);
    startTransition(async () => {
      const res = await generatePredictionAction(eventId, sportKey);
      if (!res.ok) {
        setError(res.error);
        toast.error("Prediction failed");
        return;
      }
      setPrediction(res.prediction);
      toast.success("Prediction ready");
      if (res.prediction.confidence > 75) setConfettiKey((k) => k + 1);
    });
  };

  return (
    <div className="border border-[#2a2a25] p-5">
      {confettiKey > 0 && <Confetti trigger={confettiKey} />}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d8ff3e]">
          § Gemini prediction
        </p>
        <Button onClick={onGenerate} disabled={isPending} size="sm">
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          {prediction ? "Redo" : "Generate"}
        </Button>
      </div>

      {/* Loading */}
      {isPending && (
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#7b7a70]">
          Analyzing {event.bookmakers.length} bookmakers…
        </p>
      )}

      {/* Error */}
      {error && !isPending && (
        <p className="text-sm text-[#ff5b36]">{error}</p>
      )}

      {/* Result */}
      {prediction && !isPending && (
        <div className="space-y-4">
          {/* Verdict */}
          <div className="border-l-2 border-[#d8ff3e] pl-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
              {prediction.confidence}% conviction
            </p>
            <p className="font-display text-xl italic text-[#f4efe2]">
              {prediction.winner === "draw"
                ? "Draw."
                : `${prediction.winnerTeam}.`}
            </p>
            <p className="font-mono text-3xl tabular-nums text-[#d8ff3e] mt-1">
              {prediction.score.home}
              <span className="mx-2 text-[#4a4a44]">–</span>
              {prediction.score.away}
            </p>
          </div>

          {/* Probabilities */}
          <div className="grid grid-cols-3 gap-px bg-[#2a2a25] border border-[#2a2a25]">
            <ProbCell label="Home" ai={prediction.aiProbabilities.home} market={implied.home} />
            <ProbCell label="Draw" ai={prediction.aiProbabilities.draw} market={implied.draw} />
            <ProbCell label="Away" ai={prediction.aiProbabilities.away} market={implied.away} />
          </div>

          {/* Reasoning */}
          <p className="text-sm leading-relaxed text-[#c7c2b4]">
            {prediction.reasoning}
          </p>

          {/* Key factors */}
          {prediction.keyFactors.length > 0 && (
            <ul className="space-y-1">
              {prediction.keyFactors.map((f, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-[#f4efe2]"
                >
                  <span className="font-mono text-xs text-[#d8ff3e] mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          )}

          {/* Suggested bet */}
          <div className="border border-[#d8ff3e]/20 bg-[#d8ff3e]/[0.03] p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#d8ff3e]">
              The play
            </p>
            <p className="font-display text-lg italic text-[#f4efe2] mt-0.5">
              {prediction.suggestedBet.market} — {prediction.suggestedBet.pick}
            </p>
            {prediction.suggestedBet.rationale && (
              <p className="mt-1 text-xs text-[#7b7a70]">
                {prediction.suggestedBet.rationale}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProbCell({
  label,
  ai,
  market,
}: {
  label: string;
  ai: number;
  market: number;
}) {
  const edge = ai - market;
  const tone =
    edge > 0.03
      ? "text-[#d8ff3e]"
      : edge < -0.03
      ? "text-[#ff5b36]"
      : "text-[#4a4a44]";

  return (
    <div className="bg-[#0a0a09] p-3 text-center">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#6a6a63]">
        {label}
      </p>
      <p className="font-mono text-lg tabular-nums text-[#d8ff3e] mt-0.5">
        {(ai * 100).toFixed(0)}%
      </p>
      <p className={`font-mono text-[10px] tabular-nums ${tone}`}>
        {edge > 0 ? "+" : ""}
        {(edge * 100).toFixed(1)}% vs mkt
      </p>
    </div>
  );
}
