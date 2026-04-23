"use client";

import { useEffect, useState, useTransition } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { RefreshCw, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/app/lib/utils";
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
    <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
      {/* Section header — editorial */}
      <div className="grid gap-6 sm:grid-cols-12 sm:gap-8 mb-10">
        <div className="sm:col-span-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-10 bg-[#d8ff3e]" />
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[#d8ff3e]">
              § 01 — The Fixture List
            </p>
          </div>
          <h2 className="font-display text-5xl leading-none tracking-tight text-[#f4efe2] sm:text-6xl">
            This week&apos;s<br />
            <span className="italic text-[#7b7a70]">upcoming</span>
          </h2>
        </div>
        <div className="sm:col-span-4 flex flex-col justify-end gap-3">
          <div className="flex items-center justify-between border-t border-[#2a2a25] pt-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
              {currentLeague?.flag} {currentLeague?.name}
            </p>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#4a4a44]">
              H2H avg
            </span>
          </div>
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
              Updated {updatedLabel}
            </p>
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
      </div>

      <div className="mb-10">
        <LeagueSelector value={league} onChange={setLeague} />
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => load(league)} />
      ) : isPending ? (
        <GridSkeleton />
      ) : events.length === 0 ? (
        <EmptyState leagueName={currentLeague?.name ?? "this league"} />
      ) : (
        <div className="grid gap-px bg-[#2a2a25] border border-[#2a2a25] sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, i) => (
            <MatchCard key={event.id} event={event} index={i} />
          ))}
          {/* Fill remaining slots to avoid background bleed */}
          {events.length % 3 !== 0 && (
            <div className={cn(
              "bg-[#0a0a09] hidden lg:block",
              events.length % 3 === 1 ? "col-span-2" : "col-span-1"
            )} />
          )}
          {events.length % 2 !== 0 && (
            <div className="bg-[#0a0a09] hidden sm:block lg:hidden" />
          )}
        </div>
      )}
    </section>
  );
}

function GridSkeleton() {
  return (
    <div className="grid gap-px bg-[#2a2a25] border border-[#2a2a25] sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-80 rounded-none bg-[#131311]" />
      ))}
    </div>
  );
}

function EmptyState({ leagueName }: { leagueName: string }) {
  return (
    <div className="border border-[#2a2a25] bg-[#131311] p-16 text-center">
      <p className="font-display text-3xl italic text-[#7b7a70]">
        Nothing on the slate.
      </p>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[#6a6a63]">
        No fixtures for {leagueName} — try another league.
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
    <div className="flex flex-col items-start gap-4 border border-[#ff5b36]/30 bg-[#ff5b36]/5 p-8">
      <div className="flex items-center gap-3">
        <AlertCircle className="size-5 text-[#ff5b36]" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff5b36]">
          Feed interrupted
        </p>
      </div>
      <p className="font-display text-2xl italic text-[#f4efe2]">{message}</p>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        <RefreshCw className="size-3" /> Retry
      </Button>
    </div>
  );
}
