"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { PredictionResult } from "@/app/components/PredictionResult";
import { generatePredictionAction } from "@/app/actions/generatePrediction";
import type { AIPrediction } from "@/app/lib/gemini";
import type { OddsEvent } from "@/app/lib/odds";

export function MatchPredictionPanel({
  sportKey,
  event,
}: {
  sportKey: string;
  event: OddsEvent;
}) {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onGenerate = () => {
    setError(null);
    startTransition(async () => {
      const res = await generatePredictionAction(event.id, sportKey);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPrediction(res.prediction);
    });
  };

  return (
    <section
      aria-labelledby="prediction-heading"
      aria-live="polite"
      aria-busy={isPending}
      className="rounded-sm border border-line p-5"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="prediction-heading" className="font-display text-2xl text-foreground">
          Gemini prediction
        </h2>
        <Button onClick={onGenerate} disabled={isPending} size="sm">
          {isPending && <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" />}
          {prediction ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {isPending && (
        <p role="status" className="font-mono text-xs uppercase text-muted">
          Analysing {event.bookmakers.length} bookmakers
        </p>
      )}

      {error && !isPending && (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4">
          <p className="mb-1 font-mono text-xs uppercase text-destructive">Prediction failed</p>
          <p className="text-pretty text-sm text-foreground">{error}</p>
        </div>
      )}

      {!prediction && !error && !isPending && (
        <p className="text-pretty text-sm leading-relaxed text-muted">
          Gemini reads the averaged odds from{" "}
          <span className="font-mono tabular-nums text-foreground">{event.bookmakers.length}</span>{" "}
          bookmakers and returns a likely score, win probabilities, and one suggested bet.
        </p>
      )}

      {prediction && !isPending && (
        <PredictionResult prediction={prediction} event={event} compact />
      )}
    </section>
  );
}
