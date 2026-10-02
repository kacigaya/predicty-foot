"use client";

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { LeagueSelector } from "@/app/components/LeagueSelector";
import { MatchCard } from "@/app/components/MatchCard";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeague, leagueHref } from "@/app/lib/leagues";
import type { FixturesResult } from "@/app/lib/fixtures";

const BATCH_SIZE = 6;

// The league lives in the URL (/?league=) and the server renders its fixtures.
// Switching league is a navigation, which Next runs ahead of any pending server
// action, so it never waits behind a prediction.
export function MatchBoard({ league, result }: { league: string; result: FixturesResult }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // The tab moves as soon as it is clicked; the URL catches up when the server answers.
  const [selectedLeague, setSelectedLeague] = useOptimistic(league);
  // Reset paging when the league changes without remounting, which would drop
  // keyboard focus from the tab list.
  const [paging, setPaging] = useState({ league, count: BATCH_SIZE });
  const visibleCount = paging.league === league ? paging.count : BATCH_SIZE;
  const [updatedLabel, setUpdatedLabel] = useState("just now");

  const events = result.ok ? result.events : [];
  const error = result.ok ? null : result.error;
  const fetchedAt = result.ok ? result.fetchedAt : null;

  useEffect(() => {
    if (!fetchedAt) return;
    const updateLabel = () => {
      setUpdatedLabel(
        formatDistanceToNowStrict(new Date(fetchedAt), { addSuffix: true }),
      );
    };
    updateLabel();
    const intervalId = window.setInterval(updateLabel, 5000);
    return () => window.clearInterval(intervalId);
  }, [fetchedAt]);

  const changeLeague = (key: string) => {
    startTransition(() => {
      setSelectedLeague(key);
      router.push(leagueHref(key), { scroll: false });
    });
  };

  // Re-renders on the server; odds are cached for five minutes, so this shows
  // newer data only once the cache has expired. The label says how old it is.
  const refresh = () => {
    startTransition(() => router.refresh());
  };

  const visibleEvents = events.slice(0, visibleCount);
  const hasMore = visibleCount < events.length;
  const currentLeague = getLeague(selectedLeague);

  return (
    <section
      id="fixtures"
      className="mx-auto w-full max-w-6xl scroll-mt-24 px-4 pb-16 sm:px-6"
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
          {fetchedAt && (
            <p className="font-mono text-xs text-muted-foreground tabular-nums">
              Updated {updatedLabel}
            </p>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={refresh}
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

      <LeagueSelector value={selectedLeague} onChange={changeLeague}>
        {isPending ? (
          <GridSkeleton />
        ) : error ? (
          <ErrorState message={error} onRetry={refresh} />
        ) : events.length === 0 ? (
          <EmptyState
            leagueName={currentLeague?.name ?? "this league"}
            onRefresh={refresh}
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
                  onClick={() => setPaging({ league, count: visibleCount + BATCH_SIZE })}
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
          <Skeleton key={i} className="h-64 rounded-2xl" />
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
      <CardTitle render={<h3 />} className="text-xl font-bold">
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
