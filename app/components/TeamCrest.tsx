"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { cn, teamInitials } from "@/app/lib/utils";

type LogoCacheEntry = { url: string | null; ts: number };
type LogoResultState = { name: string; done: boolean; url: string | null };

const logoCache = new Map<string, LogoCacheEntry>();
const inFlightRequests = new Map<string, Promise<string | null>>();

const POSITIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days (matches server)
const NEGATIVE_TTL_MS = 60 * 1000; // 1 min
const STORAGE_KEY = "predicty_foot_crests_v1";
const MAX_STORAGE_ENTRIES = 250;

function getFreshCachedLogo(name: string): { hit: boolean; url: string | null } {
  const entry = logoCache.get(name);
  if (!entry) return { hit: false, url: null };

  const ttl = entry.url ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
  if (Date.now() - entry.ts >= ttl) return { hit: false, url: null };

  return { hit: true, url: entry.url };
}

function getStoredLogo(name: string): LogoCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw);
    const entry = store?.[name] as LogoCacheEntry | undefined;
    if (!entry || typeof entry.ts !== "number") return null;

    const ttl = entry.url ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
    if (Date.now() - entry.ts >= ttl) return null;
    return entry;
  } catch {
    return null;
  }
}

function saveLogoToStorage(name: string, entry: LogoCacheEntry): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const store: Record<string, LogoCacheEntry> = raw ? JSON.parse(raw) : {};
    store[name] = entry;

    const keys = Object.keys(store);
    if (keys.length > MAX_STORAGE_ENTRIES) {
      const sorted = keys.sort((a, b) => store[a].ts - store[b].ts);
      for (const oldKey of sorted.slice(0, keys.length - MAX_STORAGE_ENTRIES)) {
        delete store[oldKey];
      }
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage write failures (quota or private mode)
  }
}

async function fetchTeamLogo(name: string): Promise<string | null> {
  const stored = getStoredLogo(name);
  if (stored) {
    return stored.url;
  }

  const existing = inFlightRequests.get(name);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(`/api/team-logo?name=${encodeURIComponent(name)}`);
      if (!res.ok) throw new Error(`Team logo request failed: ${res.status}`);
      const data: { url: string | null } = await res.json();
      return data?.url ?? null;
    } catch {
      return null;
    } finally {
      inFlightRequests.delete(name);
    }
  })();

  inFlightRequests.set(name, promise);
  return promise;
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

    fetchTeamLogo(name)
      .then((url) => {
        if (cancelled) return;
        const entry: LogoCacheEntry = { url, ts: Date.now() };
        logoCache.set(name, entry);
        saveLogoToStorage(name, entry);
        setResolved({ name, done: true, url });
      })
      .catch(() => {
        if (cancelled) return;
        const entry: LogoCacheEntry = { url: null, ts: Date.now() };
        logoCache.set(name, entry);
        saveLogoToStorage(name, entry);
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

  const pixelSize = {
    sm: 28,
    md: 40,
    lg: 56,
  }[size];

  const showLogo = Boolean(logoUrl);

  if (loading) {
    return (
      <div
        aria-hidden
        className={cn(
          dims,
          "animate-pulse rounded-full bg-muted motion-reduce:animate-none",
          className,
        )}
      />
    );
  }

  if (showLogo && logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={`${name} crest`}
        width={pixelSize}
        height={pixelSize}
        className={cn(dims, "object-contain", className)}
        onError={() => {
          const entry: LogoCacheEntry = { url: null, ts: Date.now() };
          logoCache.set(name, entry);
          saveLogoToStorage(name, entry);
          setResolved({ name, done: true, url: null });
        }}
      />
    );
  }

  const textSize =
    size === "sm" ? "text-[10px]" : size === "lg" ? "text-lg" : "text-xs";

  return (
    <div
      role="img"
      aria-label={`${name} crest`}
      className={cn(
        "flex items-center justify-center rounded-full border border-border bg-muted font-mono font-semibold text-foreground",
        dims,
        textSize,
        className,
      )}
    >
      {teamInitials(name)}
    </div>
  );
}
