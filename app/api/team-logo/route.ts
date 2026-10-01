import { NextRequest, NextResponse } from "next/server";
import { CREST_SLUGS } from "@/app/lib/crests";
import { createInMemoryRateLimiter, getClientIp } from "@/app/lib/rate-limit";

type CacheEntry = { url: string | null; ts: number };

const cache = new Map<string, CacheEntry>();

const POSITIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const NEGATIVE_TTL_MS = 30 * 1000; // 30s
const POSITIVE_CACHE_CONTROL = "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400";
const NEGATIVE_CACHE_CONTROL = "public, max-age=30, s-maxage=30";
const MAX_NAME_LENGTH = 100;
const MAX_CACHE_ENTRIES = 2000;

// High allowance for client-side fixture grids with many concurrent crest requests
const teamLogoRateLimiter = createInMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 600,
});

const ALIASES: Record<string, string> = {
  "Paris Saint Germain": "Paris SG",
  "Paris Saint-Germain": "Paris SG",
  PSG: "Paris SG",
  "Atletico Madrid": "Atlético Madrid",
  "Atlético de Madrid": "Atlético Madrid",
  "Club Atletico de Madrid": "Atlético Madrid",
  "Athletic Bilbao": "Athletic Club",
  "Athletic Club de Bilbao": "Athletic Club",
  "Real Betis": "Real Betis Balompié",
  "Bayer Leverkusen": "Bayer 04 Leverkusen",
  "Bayern Munich": "Bayern München",
  "Borussia Monchengladbach": "Borussia Mönchengladbach",
  "Borussia M'gladbach": "Borussia Mönchengladbach",
  Koln: "FC Köln",
  "FC Cologne": "FC Köln",
  "Inter Milan": "Inter",
  "AC Milan": "Milan",
  "AS Roma": "Roma",
  "Wolverhampton Wanderers": "Wolves",
  "Brighton and Hove Albion": "Brighton",
  "Nottingham Forest": "Nottingham Forest",
  "Tottenham Hotspur": "Tottenham",
  "West Ham United": "West Ham",
  "Newcastle United": "Newcastle",
  "Manchester United": "Man United",
  "Manchester City": "Man City",
  "Leicester City": "Leicester",
  "Ipswich Town": "Ipswich",
  "Coventry City": "Coventry",
  "Hull City": "Hull",
  "Leeds United": "Leeds",
  "Sporting Lisbon": "Sporting CP",
  "Sporting Clube de Portugal": "Sporting CP",
  "PSV Eindhoven": "PSV",
};

function normalizeTeamName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const NORMALIZED_ALIASES: Record<string, string> = Object.fromEntries(
  Object.entries(ALIASES).map(([key, value]) => [normalizeTeamName(key), value]),
);

function resolveAlias(name: string): string | undefined {
  return ALIASES[name] ?? NORMALIZED_ALIASES[normalizeTeamName(name)];
}

function simplifyName(name: string): string {
  return name
    .replace(/^(fc|ac|as|afc|sc|club|cf|rc|rcd|ca|ud|cd|vfb|vfl|1\.)\s+/i, "")
    .replace(/\s+(fc|ac|as|afc|sc|cf|f\.c\.|c\.f\.)$/i, "")
    .trim();
}

function cacheControlFor(url: string | null): string {
  return url ? POSITIVE_CACHE_CONTROL : NEGATIVE_CACHE_CONTROL;
}

function validateTeamName(name: string): boolean {
  return (
    name.length > 0 &&
    name.length <= MAX_NAME_LENGTH &&
    /^[\p{L}\p{N} .,'’()\-/]+$/u.test(name)
  );
}

function pruneOldestCacheEntries(): void {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const entries = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
  for (const [key] of entries.slice(0, cache.size - MAX_CACHE_ENTRIES)) {
    cache.delete(key);
  }
}

function staticBadgeFor(name: string): string | null {
  const alias = resolveAlias(name);
  const slug =
    CREST_SLUGS[normalizeTeamName(name)] ??
    (alias ? CREST_SLUGS[normalizeTeamName(alias)] : undefined) ??
    CREST_SLUGS[normalizeTeamName(simplifyName(name))];
  return slug ? `/crests/${slug}.png` : null;
}

function isAllowedBadgeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      [
        "www.thesportsdb.com",
        "r2.thesportsdb.com",
        "images.thesportsdb.com",
      ].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

function candidatesFor(name: string): string[] {
  const alias = resolveAlias(name);
  const simplified = simplifyName(name);
  const simplifiedAlias = alias ? simplifyName(alias) : undefined;
  return Array.from(
    new Set([name, alias, simplified, simplifiedAlias].filter(Boolean) as string[]),
  );
}

async function searchTheSportsDB(query: string): Promise<string | null> {
  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`,
    {
      headers: { "User-Agent": "Mozilla/5.0 (predicty-foot)" },
      signal: AbortSignal.timeout(4000),
    },
  );
  if (!res.ok) return null;
  const data = await res.json();
  const teams: Array<Record<string, string>> = data?.teams ?? [];
  const soccer = teams.find(
    (t) => t.strSport === "Soccer" || t.strSport === "Football",
  );
  const badge = soccer?.strBadge ?? null;
  return badge && isAllowedBadgeUrl(badge) ? badge : null;
}

async function resolveBadge(name: string): Promise<string | null> {
  // Tier 1: crests bundled in public/crests
  const staticBadge = staticBadgeFor(name);
  if (staticBadge) return staticBadge;

  const candidates = candidatesFor(name);

  // Tier 2: TheSportsDB search for teams without a bundled crest
  for (const q of candidates) {
    const candidateStatic = staticBadgeFor(q);
    if (candidateStatic) return candidateStatic;

    try {
      const badge = await searchTheSportsDB(q);
      if (badge) return badge;
    } catch {
      // try next
    }
  }

  return null;
}

export async function GET(req: NextRequest) {
  if (teamLogoRateLimiter.check(getClientIp(req.headers))) {
    return NextResponse.json(
      { url: null, error: "Too many requests." },
      { status: 429, headers: { "Cache-Control": NEGATIVE_CACHE_CONTROL } },
    );
  }

  const rawName = req.nextUrl.searchParams.get("name");
  const name = rawName?.trim() ?? "";
  if (!validateTeamName(name)) {
    return NextResponse.json(
      { url: null, error: "Invalid team name." },
      { status: 400, headers: { "Cache-Control": NEGATIVE_CACHE_CONTROL } },
    );
  }

  const cacheKey = normalizeTeamName(name);
  const hit = cache.get(cacheKey);
  const now = Date.now();
  if (hit) {
    const ttl = hit.url ? POSITIVE_TTL_MS : NEGATIVE_TTL_MS;
    if (now - hit.ts < ttl) {
      return NextResponse.json(
        { url: hit.url },
        {
          headers: { "Cache-Control": cacheControlFor(hit.url) },
        },
      );
    }
  }

  const badge = await resolveBadge(name);
  cache.set(cacheKey, { url: badge, ts: now });
  pruneOldestCacheEntries();

  return NextResponse.json(
    { url: badge },
    { headers: { "Cache-Control": cacheControlFor(badge) } },
  );
}
