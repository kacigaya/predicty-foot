import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OddsEvent } from "./odds";
import type { OddsSnapshot } from "./odds-feed";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// Both provider responses and files must be safe to render and use in calculations.
export function isOddsFeed(value: unknown): value is OddsEvent[] {
  return Array.isArray(value) && value.every((event: unknown) =>
    record(event) &&
    [event.id, event.sport_key, event.sport_title, event.home_team, event.away_team]
      .every((field) => typeof field === "string") &&
    typeof event.commence_time === "string" && Number.isFinite(Date.parse(event.commence_time)) &&
    event.cachedAt === undefined &&
    Array.isArray(event.bookmakers) && event.bookmakers.every((book: unknown) =>
      record(book) && [book.key, book.title, book.last_update].every((field) => typeof field === "string") &&
      Array.isArray(book.markets) && book.markets.every((market: unknown) =>
        record(market) && typeof market.key === "string" && typeof market.last_update === "string" &&
        Array.isArray(market.outcomes) && market.outcomes.every((outcome: unknown) =>
          record(outcome) && typeof outcome.name === "string" &&
          typeof outcome.price === "number" && Number.isFinite(outcome.price) && outcome.price > 1 &&
          (outcome.point === undefined || (typeof outcome.point === "number" && Number.isFinite(outcome.point))) &&
          (outcome.description === undefined || typeof outcome.description === "string"),
        ),
      ),
    ),
  );
}

function cacheFile(sportKey: string): string {
  const directory = process.env.ODDS_CACHE_DIR || path.join(process.cwd(), ".cache", "odds");
  // Fixed-length names keep even an accidental unvalidated key inside the directory.
  return path.join(directory, `${createHash("sha256").update(sportKey).digest("hex")}.json`);
}

export async function writeLastOdds(sportKey: string, snapshot: OddsSnapshot): Promise<void> {
  const file = cacheFile(sportKey);
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(temporary, JSON.stringify({ events: snapshot.events, fetchedAt: snapshot.fetchedAt }), { mode: 0o600 });
    await rename(temporary, file);
  } catch {
    // Cache storage is optional; a disk failure must not hide a successful provider response.
    console.error("[odds-cache] Could not persist the odds feed.");
  } finally {
    await rm(temporary, { force: true }).catch(() => {});
  }
}

export async function readLastOdds(sportKey: string): Promise<OddsSnapshot | null> {
  try {
    const value: unknown = JSON.parse(await readFile(cacheFile(sportKey), "utf8"));
    if (!record(value) || typeof value.fetchedAt !== "string" || !isOddsFeed(value.events)) return null;
    if (value.events.some((event) => event.sport_key !== sportKey)) return null;
    return { events: value.events, fetchedAt: value.fetchedAt, stale: false };
  } catch {
    return null;
  }
}

export function fallbackOdds(snapshot: OddsSnapshot, now = Date.now()): OddsSnapshot | null {
  const age = now - Date.parse(snapshot.fetchedAt);
  if (!Number.isFinite(age) || age < 0 || age >= MAX_AGE_MS) return null;
  // A failed refresh cannot tell us whether a started fixture finished or was postponed.
  const events = snapshot.events.filter((event) => Date.parse(event.commence_time) > now)
    .map((event) => ({ ...event, cachedAt: snapshot.fetchedAt }));
  if (events.length === 0) return null;
  return { events, fetchedAt: snapshot.fetchedAt, stale: true };
}
