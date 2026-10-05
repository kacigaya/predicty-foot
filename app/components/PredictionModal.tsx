"use client";

import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { LocalTime } from "@/app/components/LocalTime";
import { TeamCrest } from "@/app/components/TeamCrest";
import { OddsTable } from "@/app/components/OddsTable";
import { PredictionResult } from "@/app/components/PredictionResult";
import { usePrediction } from "@/app/components/usePrediction";
import {
  averageH2HOdds,
  formatOdds,
  impliedProbabilities,
} from "@/app/lib/odds";
import type { Fixture } from "@/app/lib/crests";

// `children` is the trigger element. Rendering it through DialogTrigger (rather
// than controlling `open` from outside) is what lets Base UI return focus to it on close.
export function PredictionModal({
  event,
  children,
}: {
  event: Fixture;
  children: React.ReactElement;
}) {
  const { prediction, error, isPending, generate, regenerate } = usePrediction(
    event.id,
    event.sport_key,
  );

  const avg = averageH2HOdds(event);
  const implied = impliedProbabilities(avg);

  return (
    <Dialog>
      <DialogTrigger render={children} />
      <DialogPopup className="max-w-3xl">
        <DialogHeader className="border-b pe-12">
          <DialogTitle className="text-balance leading-tight tracking-tight sm:text-2xl">
            {event.home_team} vs {event.away_team}
          </DialogTitle>
          <DialogDescription className="order-first font-mono text-xs">
            {event.sport_title} · <LocalTime iso={event.commence_time} format="kickoffLong" />
          </DialogDescription>
        </DialogHeader>

        <DialogPanel>
          <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 border-b border-border pt-5 pb-6">
            <TeamPanel name={event.home_team} crest={event.homeCrest} odds={formatOdds(avg.home)} prob={implied.home} />
            <div className="flex flex-col items-center gap-1 self-center px-2">
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Draw</span>
              <span className="font-mono text-base sm:text-lg font-semibold tabular-nums text-foreground">
                {formatOdds(avg.draw)}
              </span>
              <span className="font-mono text-xs tabular-nums text-muted-foreground">
                {(implied.draw * 100).toFixed(0)}%
              </span>
            </div>
            <TeamPanel name={event.away_team} crest={event.awayCrest} odds={formatOdds(avg.away)} prob={implied.away} />
          </div>

          <div className="space-y-6 pt-6" aria-live="polite" aria-busy={isPending}>
            {error && (
              <div
                role="alert"
                className="rounded-xl border border-destructive/30 bg-destructive/10 p-4"
              >
                <p className="mb-1 font-mono text-xs uppercase text-destructive font-medium">
                  Prediction failed
                </p>
                <p className="text-pretty text-sm text-foreground/90">{error}</p>
              </div>
            )}

            {isPending ? (
              <div role="status" className="flex items-center justify-center gap-3 py-10">
                <Spinner aria-hidden role={undefined} className="size-4 text-muted-foreground" />
                <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  Analysing {event.bookmakers.length} bookmakers
                </span>
              </div>
            ) : prediction ? (
              <>
                <PredictionResult prediction={prediction} event={event} />
                <div className="flex justify-end border-t border-border pt-4">
                  <Button variant="outline" size="sm" onClick={regenerate}>
                    Regenerate
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">
                  Gemini reads the averaged odds from{" "}
                  <span className="font-mono tabular-nums text-foreground font-medium">
                    {event.bookmakers.length}
                  </span>{" "}
                  bookmakers and returns a likely score, win, goals and half-time probabilities, likely scorers, corners and cards, and one suggested bet.
                </p>
                <Button onClick={generate} size="lg" className="w-full">
                  Generate prediction
                </Button>
              </>
            )}

            <div className="border-t border-border pt-6">
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-muted-foreground">
                All bookmakers
              </p>
              <OddsTable event={event} />
            </div>
          </div>
        </DialogPanel>
      </DialogPopup>
    </Dialog>
  );
}

function TeamPanel({
  name,
  crest,
  odds,
  prob,
}: {
  name: string;
  crest: string | null;
  odds: string;
  prob: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 text-center">
      <TeamCrest name={name} src={crest} size="lg" />
      <p className="text-balance font-heading text-base font-semibold leading-tight text-foreground sm:text-lg">
        {name}
      </p>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-base font-semibold tabular-nums text-foreground">{odds}</span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{(prob * 100).toFixed(0)}%</span>
      </div>
    </div>
  );
}
