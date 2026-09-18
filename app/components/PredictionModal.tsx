"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { TeamCrest } from "@/app/components/TeamCrest";
import { OddsTable } from "@/app/components/OddsTable";
import { PredictionResult } from "@/app/components/PredictionResult";
import { generatePredictionAction } from "@/app/actions/generatePrediction";
import type { AIPrediction } from "@/app/lib/gemini";
import {
  averageH2HOdds,
  formatOdds,
  impliedProbabilities,
  type OddsEvent,
} from "@/app/lib/odds";

// `children` is the trigger. Going through DialogTrigger (rather than
// controlling `open` from outside) is what lets Radix return focus to it on close.
export function PredictionModal({
  event,
  children,
}: {
  event: OddsEvent;
  children: React.ReactNode;
}) {
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const avg = averageH2HOdds(event);
  const implied = impliedProbabilities(avg);

  const onGenerate = () => {
    setError(null);
    startTransition(async () => {
      const result = await generatePredictionAction(event.id, event.sport_key);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setPrediction(result.prediction);
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogDescription>
            {event.sport_title} · {format(new Date(event.commence_time), "EEE d MMM yyyy, HH:mm")}
          </DialogDescription>
          <DialogTitle>
            {event.home_team} vs {event.away_team}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-line pb-6">
          <TeamPanel name={event.home_team} odds={formatOdds(avg.home)} prob={implied.home} />
          <div className="flex flex-col items-center gap-1 self-center px-2">
            <span className="font-mono text-xs uppercase text-muted">Draw</span>
            <span className="font-mono text-lg tabular-nums text-foreground">{formatOdds(avg.draw)}</span>
            <span className="font-mono text-xs tabular-nums text-muted">
              {(implied.draw * 100).toFixed(0)}%
            </span>
          </div>
          <TeamPanel name={event.away_team} odds={formatOdds(avg.away)} prob={implied.away} />
        </div>

        <div className="space-y-6 pt-6" aria-live="polite" aria-busy={isPending}>
          {error && (
            <div role="alert" className="border border-destructive/40 bg-destructive/5 p-4">
              <p className="mb-1 font-mono text-xs uppercase text-destructive">Prediction failed</p>
              <p className="text-pretty text-sm text-foreground">{error}</p>
            </div>
          )}

          {isPending ? (
            <div role="status" className="flex items-center justify-center gap-3 py-8">
              <Loader2 aria-hidden className="size-4 animate-spin text-accent motion-reduce:animate-none" />
              <span className="font-mono text-xs uppercase text-muted">
                Analysing {event.bookmakers.length} bookmakers
              </span>
            </div>
          ) : prediction ? (
            <>
              <PredictionResult prediction={prediction} event={event} />
              <div className="flex justify-end border-t border-line pt-4">
                <Button variant="secondary" size="sm" onClick={onGenerate}>
                  Regenerate
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-pretty text-sm leading-relaxed text-muted">
                Gemini reads the averaged odds from{" "}
                <span className="font-mono tabular-nums text-foreground">{event.bookmakers.length}</span>{" "}
                bookmakers and returns a likely score, win probabilities, and one suggested bet.
              </p>
              <Button onClick={onGenerate} size="lg" className="w-full">
                Generate prediction
              </Button>
            </>
          )}

          <div className="border-t border-line pt-6">
            <p className="mb-3 font-mono text-xs uppercase text-muted">All bookmakers</p>
            <OddsTable event={event} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TeamPanel({ name, odds, prob }: { name: string; odds: string; prob: number }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <TeamCrest name={name} size="lg" />
      <p className="text-balance font-display text-xl leading-tight text-foreground sm:text-2xl">{name}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-lg tabular-nums text-accent">{odds}</span>
        <span className="font-mono text-xs tabular-nums text-muted">{(prob * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
