"use client";

import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { LeagueSelector } from "@/app/components/LeagueSelector";
import { MatchCard } from "@/app/components/MatchCard";
import { Card, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { getOddsAction } from "@/app/actions/getOdds";
import { DEFAULT_LEAGUE_KEY, getLeague } from "@/app/lib/leagues";
import type { OddsEvent } from "@/app/lib/odds";

const BATCH_SIZE = 6;

export function MatchBoard({
  initialEvents,
  initialError,
  initialFetchedAt,
}: {
  initialEvents: OddsEvent[];
  initialError: string | null;
  initialFetchedAt: string;
}) {
  const [league, setLeague] = useState(DEFAULT_LEAGUE_KEY);
  const [events, setEvents] = useState(initialEvents);
  const [error, setError] = useState(initialError);
  const [fetchedAt, setFetchedAt] = useState(initialFetchedAt);
  const [updatedLabel, setUpdatedLabel] = useState("just now");
  const [isPending, startTransition] = useTransition();
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);

  useEffect(() => {
    const updateLabel = () => {
      setUpdatedLabel(
        formatDistanceToNowStrict(new Date(fetchedAt), { addSuffix: true }),
      );
    };
    updateLabel();
    const intervalId = window.setInterval(updateLabel, 5000);
    return () => window.clearInterval(intervalId);
  }, [fetchedAt]);

  const load = (key: string) => {
    setVisibleCount(BATCH_SIZE);
    startTransition(async () => {
      const result = await getOddsAction(key);
      if (!result.ok) {
        setError(result.error);
        setEvents([]);
        return;
      }
      setError(null);
      setEvents(result.events);
      setFetchedAt(result.fetchedAt);
    });
  };

  const changeLeague = (key: string) => {
    setLeague(key);
    load(key);
  };

  const visibleEvents = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;
  const currentLeague = getLeague(league);

  return (
    <section
      id="fixtures"
      className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6"
      aria-busy={isPending}
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1.5 font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {currentLeague?.name ?? "League"}
          </p>
          <h2 className="text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Upcoming fixtures
          </h2>
        </div>
        <div className="flex items-center gap-4">
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            Updated {updatedLabel}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => load(league)}
            disabled={isPending}
          >
            <RefreshCw
              aria-hidden
              className={cn("size-3.5", isPending && "animate-spin motion-reduce:animate-none")}
            />
            Refresh
          </Button>
        </div>
      </div>

      <LeagueSelector value={league} onChange={changeLeague}>
        {error ? (
          <ErrorState message={error} onRetry={() => load(league)} />
        ) : isPending ? (
          <GridSkeleton />
        ) : events.length === 0 ? (
          <EmptyState
            leagueName={currentLeague?.name ?? "this league"}
            onRefresh={() => load(league)}
          />
        ) : (
          <>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleEvents.map((event) => (
                <li key={event.id} className="flex">
                  <MatchCard event={event} />
                </li>
              ))}
            </ul>

            {hasMore && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => setVisibleCount((n) => n + BATCH_SIZE)}
                >
                  Show {Math.min(BATCH_SIZE, events.length - visibleCount)} more
                </Button>
              </div>
            )}
          </>
        )}
      </LeagueSelector>
    </section>
  );
}

function GridSkeleton() {
  return (
    <div role="status">
      <span className="sr-only">Loading fixtures</span>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="h-64 animate-pulse p-5" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({
  leagueName,
  onRefresh,
}: {
  leagueName: string;
  onRefresh: () => void;
}) {
  return (
    <Card className="flex flex-col items-start gap-4 p-8">
      <CardTitle as="h3" className="text-xl font-bold">
        No upcoming fixtures
      </CardTitle>
      <CardDescription className="text-sm">
        The odds feed has nothing listed for {leagueName} right now. Pick another league above or
        check again later.
      </CardDescription>
      <Button size="sm" variant="outline" onClick={onRefresh}>
        <RefreshCw aria-hidden className="size-3.5" /> Refresh
      </Button>
    </Card>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-foreground"
    >
      <div className="flex items-center gap-2">
        <AlertCircle aria-hidden className="size-4 text-destructive" />
        <p className="font-mono text-xs uppercase text-destructive font-medium">
          Could not load odds
        </p>
      </div>
      <p className="text-pretty text-sm text-foreground/90">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        <RefreshCw aria-hidden className="size-3.5" /> Retry
      </Button>
    </div>
  );
}
