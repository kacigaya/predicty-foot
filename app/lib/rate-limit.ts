type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type InMemoryRateLimiter = {
  // True when `key` is over the limit; counts this call either way.
  check: (key: string) => boolean;
};

// Caddy strips client-supplied X-Forwarded-For and Traefik appends the bridge
// address, so the first entry is the real client (see ~/DOKPLOY.md).
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function createInMemoryRateLimiter({
  windowMs,
  maxRequests,
}: {
  windowMs: number;
  maxRequests: number;
}): InMemoryRateLimiter {
  const store = new Map<string, RateLimitEntry>();
  let nextSweep = 0;

  return {
    check(key: string): boolean {
      const now = Date.now();

      // Expired entries are dropped at most once per window, not on every call.
      if (now >= nextSweep) {
        for (const [k, entry] of store) {
          if (entry.resetAt <= now) store.delete(k);
        }
        nextSweep = now + windowMs;
      }

      const current = store.get(key);
      if (!current || current.resetAt <= now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return maxRequests < 1;
      }

      current.count += 1;
      return current.count > maxRequests;
    },
  };
}
