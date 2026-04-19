"use client";

import { useEffect, useState } from "react";
import { cn, teamInitials, teamColor } from "@/app/lib/utils";

type LogoCacheEntry = { url: string | null; ts: number };
type LogoResultState = { name: string; done: boolean; url: string | null };

const logoCache = new Map<string, LogoCacheEntry>();
const POSITIVE_TTL_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 60 * 1000;

function getFreshCachedLogo(name: string): { hit: boolean; url: string | null } {
  const entry = logoCache.get(name);
  if (!entry) return { hit: false, url: null };

  const ttl = entry.url ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
  if (Date.now() - entry.ts >= ttl) return { hit: false, url: null };

  return { hit: true, url: entry.url };
}

export function TeamCrest({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const cached = getFreshCachedLogo(name);
  const [resolved, setResolved] = useState<LogoResultState | null>(null);
  const current = resolved?.name === name ? resolved : null;
  const logoUrl = cached.hit ? cached.url : current?.url ?? null;
  const loading = !cached.hit && !current?.done;

  useEffect(() => {
    if (cached.hit || current?.done) return;

    let cancelled = false;

    fetch(`/api/team-logo?name=${encodeURIComponent(name)}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`Team logo request failed: ${r.status}`);
        return r.json();
      })
      .then((data: { url: string | null }) => {
        if (cancelled) return;
        logoCache.set(name, { url: data.url, ts: Date.now() });
        setResolved({ name, done: true, url: data.url });
      })
      .catch(() => {
        if (cancelled) return;
        logoCache.set(name, { url: null, ts: Date.now() });
        setResolved({ name, done: true, url: null });
      });

    return () => {
      cancelled = true;
    };
  }, [cached.hit, current?.done, name]);

  const dims = {
    sm: "size-7",
    md: "size-10",
    lg: "size-14",
  }[size];

  const showLogo = Boolean(logoUrl);

  if (loading) {
    return (
      <div
        className={cn(
          dims,
          "rounded-full bg-[#1e2430] animate-pulse",
          className,
        )}
      />
    );
  }

  if (showLogo) {
    return (
      <img
        src={logoUrl ?? undefined}
        alt={`${name} crest`}
        className={cn(dims, "object-contain drop-shadow-sm", className)}
        onError={() => {
          logoCache.set(name, { url: null, ts: Date.now() });
          setResolved({ name, done: true, url: null });
        }}
        loading="lazy"
      />
    );
  }

  const textSize =
    size === "sm" ? "text-[10px]" : size === "lg" ? "text-lg" : "text-xs";

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-bold text-white/90",
        dims,
        textSize,
        className,
      )}
      style={{ background: teamColor(name) }}
      aria-label={name}
    >
      {teamInitials(name)}
    </div>
  );
}
