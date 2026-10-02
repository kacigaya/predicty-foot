"use client";

import { useState, useTransition } from "react";
import { generatePredictionAction } from "@/app/actions/generatePrediction";
import type { AIPrediction } from "@/app/lib/gemini";

// Prediction state shared by the fixture dialog and the match page. `generate`
// may return the server's cached prediction; `regenerate` always asks Gemini.
export function usePrediction(eventId: string, sportKey: string) {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (fresh: boolean) => {
    setError(null);
    startTransition(async () => {
      const result = await generatePredictionAction(eventId, sportKey, { fresh });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPrediction(result.prediction);
    });
  };

  return {
    prediction,
    error,
    isPending,
    generate: () => run(false),
    regenerate: () => run(true),
  };
}
