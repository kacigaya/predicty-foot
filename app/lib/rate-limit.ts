import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

export type InMemoryRateLimiter = {
  check: (req: NextRequest) => boolean;
};

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
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

  return {
    check(req: NextRequest): boolean {
      const now = Date.now();

      for (const [key, entry] of store.entries()) {
        if (entry.resetAt <= now) {
          store.delete(key);
        }
      }

      const ip = getClientIp(req);
      const current = store.get(ip);

      if (!current || current.resetAt <= now) {
        store.set(ip, { count: 1, resetAt: now + windowMs });
        return false;
      }

      current.count += 1;
      store.set(ip, current);
      return current.count > maxRequests;
    },
  };
}
