import { afterEach, describe, expect, setSystemTime, test } from "bun:test";
import { createInMemoryRateLimiter, getClientIp } from "./rate-limit";

afterEach(() => {
  setSystemTime();
});

describe("createInMemoryRateLimiter", () => {
  test("allows maxRequests per window, then limits", () => {
    const limiter = createInMemoryRateLimiter({ windowMs: 60_000, maxRequests: 2 });
    expect(limiter.check("a")).toBe(false);
    expect(limiter.check("a")).toBe(false);
    expect(limiter.check("a")).toBe(true);
    expect(limiter.check("b")).toBe(false);
  });

  test("resets after the window", () => {
    setSystemTime(new Date("2026-10-01T10:00:00Z"));
    const limiter = createInMemoryRateLimiter({ windowMs: 60_000, maxRequests: 1 });
    expect(limiter.check("a")).toBe(false);
    expect(limiter.check("a")).toBe(true);
    setSystemTime(new Date("2026-10-01T10:01:00Z"));
    expect(limiter.check("a")).toBe(false);
  });
});

describe("getClientIp", () => {
  test("uses the first X-Forwarded-For entry", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 172.18.0.1" }))).toBe("203.0.113.7");
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});
