"use client";

import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { RefreshCw, AlertCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { LeagueSelector } from "@/app/components/LeagueSelector";
import { MatchCard } from "@/app/components/MatchCard";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Button } from "@/app/components/ui/button";
import { getOddsAction } from "@/app/actions/getOdds";
import { DEFAULT_LEAGUE_KEY, getLeague } from "@/app/lib/leagues";
import type { OddsEvent } from "@/app/lib/odds";

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

  useEffect(() => {
    const updateLabel = () => {
      setUpdatedLabel(
        formatDistanceToNowStrict(new Date(fetchedAt), {
          addSuffix: true,
        }),
      );
    };

    updateLabel();
    const intervalId = window.setInterval(updateLabel, 1000);
    return () => window.clearInterval(intervalId);
  }, [fetchedAt]);

  const load = (key: string) => {
    startTransition(async () => {
      const result = await getOddsAction(key);
      if (!result.ok) {
        setError(result.error);
        setEvents([]);
        toast.error("Could not load odds", { description: result.error });
        return;
      }
      setError(null);
      setEvents(result.events);
      setFetchedAt(result.fetchedAt);
    });
  };

  useEffect(() => {
    if (league === DEFAULT_LEAGUE_KEY) return;
    load(league);
  }, [league]);

  const currentLeague = getLeague(league);

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Upcoming matches
          </h2>
          <p className="mt-1 text-sm text-[#7c8494]">
            {currentLeague?.flag} {currentLeague?.name} · averaged H2H across bookmakers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-md border border-[#252d3a] bg-[#161b22] px-3 py-1.5 text-[11px] text-[#7c8494]">
            <Clock className="size-3" />
            <span>Updated {updatedLabel}</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => load(league)}
            disabled={isPending}
          >
            <RefreshCw className={isPending ? "size-3 animate-spin" : "size-3"} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="mb-8">
        <LeagueSelector value={league} onChange={setLeague} />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => load(league)} />
      ) : isPending ? (
        <GridSkeleton />
      ) : events.length === 0 ? (
        <EmptyState leagueName={currentLeague?.name ?? "this league"} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <MatchCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-72 rounded-xl" />
      ))}
    </div>
  );
}

function EmptyState({ leagueName }: { leagueName: string }) {
  return (
    <div className="rounded-xl border border-[#252d3a] bg-[#161b22] p-12 text-center">
      <p className="text-sm text-[#7c8494]">
        No upcoming matches for {leagueName}. Try another league or come back later.
      </p>
    </div>
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
    <div className="flex flex-col items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center">
      <AlertCircle className="size-8 text-red-400" />
      <p className="max-w-md text-sm text-red-300">{message}</p>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        <RefreshCw className="size-3" /> Try again
      </Button>
    </div>
  );
}
