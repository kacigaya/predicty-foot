import { afterEach, expect, spyOn, test } from "bun:test";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fallbackOdds, readLastOdds, writeLastOdds } from "./odds-cache";
import type { OddsSnapshot } from "./odds-feed";

const originalDirectory = process.env.ODDS_CACHE_DIR;
let directory: string;
afterEach(async () => {
  if (originalDirectory === undefined) delete process.env.ODDS_CACHE_DIR;
  else process.env.ODDS_CACHE_DIR = originalDirectory;
  if (directory) await rm(directory, { recursive: true, force: true });
});

function snapshot(): OddsSnapshot {
  return {
    fetchedAt: "2026-10-01T10:00:00Z", stale: false,
    events: [{
      id: "e1", sport_key: "soccer_epl", sport_title: "EPL",
      commence_time: "2026-10-02T10:00:00Z", home_team: "Arsenal", away_team: "Chelsea",
      bookmakers: [],
    }],
  };
}

test("atomically replaces a feed, isolates leagues, and ignores damaged files", async () => {
  directory = await mkdtemp(path.join(tmpdir(), "pfoot-cache-test-"));
  process.env.ODDS_CACHE_DIR = directory;
  await writeLastOdds("soccer_epl", snapshot());
  expect(await readLastOdds("soccer_epl")).toEqual(snapshot());
  expect(await readLastOdds("soccer_spain_la_liga")).toBeNull();
  const empty = { ...snapshot(), events: [] };
  await writeLastOdds("soccer_epl", empty);
  expect(await readLastOdds("soccer_epl")).toEqual(empty);
  const files = await readdir(directory);
  expect(files).toHaveLength(1);
  await writeFile(path.join(directory, files[0]), "{broken");
  expect(await readLastOdds("soccer_epl")).toBeNull();
  await writeFile(path.join(directory, files[0]), JSON.stringify({ ...snapshot(), events: [{ home_team: {} }] }));
  expect(await readLastOdds("soccer_epl")).toBeNull();
  await writeLastOdds("soccer_spain_la_liga", snapshot());
  expect(await readLastOdds("soccer_spain_la_liga")).toBeNull();
});

test("rejects expired, future, invalid, empty, and already-started snapshots", () => {
  const now = Date.parse("2026-10-01T11:00:00Z");
  expect(fallbackOdds(snapshot(), now)?.stale).toBe(true);
  expect(fallbackOdds({ ...snapshot(), fetchedAt: "invalid" }, now)).toBeNull();
  expect(fallbackOdds({ ...snapshot(), fetchedAt: "2026-10-01T12:00:00Z" }, now)).toBeNull();
  expect(fallbackOdds(snapshot(), Date.parse("2026-10-02T10:00:00Z"))).toBeNull();
  expect(fallbackOdds({ ...snapshot(), events: [] }, now)).toBeNull();
  const started = snapshot();
  started.events[0].commence_time = new Date(now).toISOString();
  expect(fallbackOdds(started, now)).toBeNull();
});

test("a cache write failure does not propagate to the provider caller", async () => {
  directory = await mkdtemp(path.join(tmpdir(), "pfoot-cache-test-"));
  const blocked = path.join(directory, "file");
  await writeFile(blocked, "not a directory");
  process.env.ODDS_CACHE_DIR = blocked;
  const errorSpy = spyOn(console, "error").mockImplementation(() => {});
  try {
    await writeLastOdds("soccer_epl", snapshot());
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(await readLastOdds("soccer_epl")).toBeNull();
  } finally {
    errorSpy.mockRestore();
  }
});
