import { expect, test } from "bun:test";
import { formatTime } from "./time";

test("formats UTC without depending on ICU data", () => {
  expect(formatTime("2026-10-03T14:00:00Z", "kickoff", true)).toBe("Sat 3 Oct, 14:00");
  expect(formatTime("2026-09-27T09:05:00Z", "kickoffLong", true)).toBe("Sun 27 Sep 2026, 09:05");
  expect(formatTime("2026-10-03T04:05:00Z", "clock", true)).toBe("04:05");
});

test("uses the runtime zone when not UTC", () => {
  const d = new Date("2026-10-03T23:30:00Z");
  const expected = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  expect(formatTime(d.toISOString(), "clock", false)).toBe(expected);
});
