"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PredictionResult } from "@/app/components/PredictionResult";
import { usePrediction } from "@/app/components/usePrediction";
import type { OddsEvent } from "@/app/lib/odds";

export function MatchPredictionPanel({
  sportKey,
  event,
}: {
  sportKey: string;
  event: OddsEvent;
}) {
  const { prediction, error, isPending, generate, regenerate } = usePrediction(
    event.id,
    sportKey,
  );

  return (
    <Card
      render={<section />}
      aria-labelledby="prediction-heading"
      aria-live="polite"
      aria-busy={isPending}
      className="p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 id="prediction-heading" className="font-heading text-xl font-bold tracking-tight text-foreground">
          Gemini prediction
        </h2>
        <Button
          onClick={prediction ? regenerate : generate}
          loading={isPending}
          size="sm"
          variant={prediction ? "outline" : "default"}
        >
          {prediction ? "Regenerate" : "Generate"}
        </Button>
      </div>

      {isPending && (
        <p role="status" className="font-mono text-xs text-muted-foreground">
          Analysing {event.bookmakers.length} bookmakers
        </p>
      )}

      {error && !isPending && (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="mb-1 font-mono text-xs font-medium text-destructive-foreground">Prediction failed</p>
          <p className="text-pretty text-sm text-foreground/90">{error}</p>
        </div>
      )}

      {!prediction && !error && !isPending && (
        <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
          Gemini reads the averaged odds from{" "}
          <span className="font-mono tabular-nums text-foreground font-medium">{event.bookmakers.length}</span>{" "}
          bookmakers and returns a likely score, win, goals and half-time probabilities, likely scorers, corners and cards, and one suggested bet.
        </p>
      )}

      {prediction && !isPending && (
        <PredictionResult prediction={prediction} event={event} compact />
      )}
    </Card>
  );
}
