import { expect, test } from "bun:test";
import { formatTime } from "./time";

test("formats in the requested zone", () => {
  const iso = "2026-10-03T14:00:00Z";
  expect(formatTime(iso, "kickoff", "UTC")).toBe("Sat, 3 Oct, 14:00");
  expect(formatTime(iso, "kickoffLong", "Europe/Paris")).toBe("Sat, 3 Oct 2026, 16:00");
  expect(formatTime("2026-10-03T04:05:00Z", "clock", "UTC")).toBe("04:05");
});
