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
    <div className="border border-[#2a2a25] bg-[#131311] p-6">
      {confettiKey > 0 && <Confetti trigger={confettiKey} />}

      <div className="flex items-start justify-between gap-4 border-b border-[#2a2a25] pb-5">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d8ff3e]">
            § Gemini reading
          </p>
          <p className="mt-1 font-display text-2xl italic text-[#f4efe2]">
            Commission a prediction.
          </p>
        </div>
        <Button onClick={onGenerate} disabled={isPending} size="default">
          {isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
          {prediction ? "Recompose" : "Generate"}
        </Button>
      </div>

      {isPending && (
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.2em] text-[#7b7a70]">
          Reading form · H2H · {event.bookmakers.length} bookmakers…
        </p>
      )}

      {error && !isPending && (
        <div className="mt-5 border border-[#ff5b36]/30 bg-[#ff5b36]/5 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff5b36]">
            Error
          </p>
          <p className="mt-1 text-sm text-[#f4efe2]">{error}</p>
        </div>
      )}

      {prediction && !isPending && (
        <div className="mt-6 space-y-6">
          <div className="border-l-2 border-[#d8ff3e] pl-5 py-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
              The Verdict · {prediction.confidence}% conviction
            </p>
            <p className="mt-1 font-display text-2xl italic text-[#f4efe2]">
              {prediction.winner === "draw" ? "A share of the spoils." : `${prediction.winnerTeam} take it.`}
            </p>
            <p className="mt-3 font-mono text-4xl tabular-nums text-[#d8ff3e]">
              {prediction.score.home}
              <span className="mx-3 text-[#4a4a44]">—</span>
              {prediction.score.away}
            </p>
          </div>

          <div className="grid gap-px bg-[#2a2a25] border border-[#2a2a25] sm:grid-cols-3">
            <ProbMini label="Home" ai={prediction.aiProbabilities.home} market={implied.home} />
            <ProbMini label="Draw" ai={prediction.aiProbabilities.draw} market={implied.draw} />
            <ProbMini label="Away" ai={prediction.aiProbabilities.away} market={implied.away} />
          </div>

          <p className="font-display text-lg italic leading-relaxed text-[#c7c2b4]">
            {prediction.reasoning}
          </p>

          {prediction.keyFactors.length > 0 && (
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
          )}

          <div className="border border-[#d8ff3e]/30 bg-[#d8ff3e]/[0.04] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#d8ff3e]">
              The play
            </p>
            <p className="mt-1 font-display text-xl italic text-[#f4efe2]">
              {prediction.suggestedBet.market} — {prediction.suggestedBet.pick}
            </p>
            {prediction.suggestedBet.rationale && (
              <p className="mt-2 text-sm leading-relaxed text-[#7b7a70]">
                {prediction.suggestedBet.rationale}
              </p>
            )}
          </div>

          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a4a44]">
            Filed {format(new Date(prediction.generatedAt), "HH:mm:ss")}
          </p>
        </div>
      )}
    </div>
  );
}

function ProbMini({ label, ai, market }: { label: string; ai: number; market: number }) {
  const edge = ai - market;
  const tone =
    edge > 0.03 ? "text-[#d8ff3e]" : edge < -0.03 ? "text-[#ff5b36]" : "text-[#4a4a44]";
  return (
    <div className="bg-[#0a0a09] p-4">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#f4efe2]">
          {label}
        </span>
        <span className={`font-mono text-[10px] tabular-nums ${tone}`}>
          {edge > 0 ? "+" : ""}
          {(edge * 100).toFixed(1)}%
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between">
        <span className="font-mono text-lg tabular-nums text-[#d8ff3e]">
          {(ai * 100).toFixed(0)}%
        </span>
        <span className="font-mono text-xs tabular-nums text-[#4a4a44]">
          mkt {(market * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
