import { NextRequest, NextResponse } from "next/server";
import { createInMemoryRateLimiter } from "@/app/lib/rate-limit";

type CacheEntry = { url: string | null; ts: number };

const cache = new Map<string, CacheEntry>();

const POSITIVE_TTL_MS = 24 * 60 * 60 * 1000;
const NEGATIVE_TTL_MS = 60 * 1000;
const POSITIVE_CACHE_CONTROL = "public, max-age=86400, s-maxage=86400";
const NEGATIVE_CACHE_CONTROL = "public, max-age=60, s-maxage=60";
const MAX_NAME_LENGTH = 80;
const MAX_CACHE_ENTRIES = 500;

const teamLogoRateLimiter = createInMemoryRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
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

const STATIC_BADGES: Record<string, string> = {
  "paris saint germain":
    "https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png",
  "paris sg":
    "https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png",
  "atletico madrid":
    "https://r2.thesportsdb.com/images/media/team/badge/0ulh3q1719984315.png",
  "real sociedad":
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Real_Sociedad_logo.svg/330px-Real_Sociedad_logo.svg.png",
  getafe:
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/46/Getafe_logo.svg/330px-Getafe_logo.svg.png",
  "getafe cf":
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/46/Getafe_logo.svg/330px-Getafe_logo.svg.png",
  barcelona:
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/330px-FC_Barcelona_%28crest%29.svg.png",
  "fc barcelona":
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/330px-FC_Barcelona_%28crest%29.svg.png",
  "celta vigo":
    "https://upload.wikimedia.org/wikipedia/en/thumb/1/12/RC_Celta_de_Vigo_logo.svg/330px-RC_Celta_de_Vigo_logo.svg.png",
  "levante ud":
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg/330px-Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg.png",
  levante:
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg/330px-Levante_Uni%C3%B3n_Deportiva%2C_S.A.D._logo.svg.png",
  sevilla:
    "https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Sevilla_FC_logo.svg/330px-Sevilla_FC_logo.svg.png",
  "sevilla fc":
    "https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Sevilla_FC_logo.svg/330px-Sevilla_FC_logo.svg.png",
  "rayo vallecano":
    "https://upload.wikimedia.org/wikipedia/en/thumb/d/d8/Rayo_Vallecano_logo.svg/330px-Rayo_Vallecano_logo.svg.png",
  espanyol:
    "https://upload.wikimedia.org/wikipedia/en/thumb/9/92/RCD_Espanyol_crest.svg/330px-RCD_Espanyol_crest.svg.png",
  oviedo:
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Real_Oviedo_logo.svg/330px-Real_Oviedo_logo.svg.png",
  "real oviedo":
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/6e/Real_Oviedo_logo.svg/330px-Real_Oviedo_logo.svg.png",
  villarreal:
    "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Villarreal_CF_logo-en.svg/330px-Villarreal_CF_logo-en.svg.png",
  "villarreal cf":
    "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Villarreal_CF_logo-en.svg/330px-Villarreal_CF_logo-en.svg.png",
  "elche cf":
    "https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Elche_CF_logo.svg/330px-Elche_CF_logo.svg.png",
  "bayern munich":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg/330px-FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg.png",
  "bayern munchen":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg/330px-FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg.png",
  "fc bayern munchen":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg/330px-FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg.png",
  "borussia dortmund":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/330px-Borussia_Dortmund_logo.svg.png",
  dortmund:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/330px-Borussia_Dortmund_logo.svg.png",
  "bayer leverkusen":
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/59/Bayer_04_Leverkusen_logo.svg/330px-Bayer_04_Leverkusen_logo.svg.png",
  "bayer 04 leverkusen":
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/59/Bayer_04_Leverkusen_logo.svg/330px-Bayer_04_Leverkusen_logo.svg.png",
  "rb leipzig":
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/RB_Leipzig_2014_logo.svg/330px-RB_Leipzig_2014_logo.svg.png",
  leipzig:
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/RB_Leipzig_2014_logo.svg/330px-RB_Leipzig_2014_logo.svg.png",
  "eintracht frankfurt":
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/7e/Eintracht_Frankfurt_crest.svg/330px-Eintracht_Frankfurt_crest.svg.png",
  frankfurt:
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/7e/Eintracht_Frankfurt_crest.svg/330px-Eintracht_Frankfurt_crest.svg.png",
  "sc freiburg":
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/SC_Freiburg_logo.svg/330px-SC_Freiburg_logo.svg.png",
  freiburg:
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/SC_Freiburg_logo.svg/330px-SC_Freiburg_logo.svg.png",
  "mainz 05":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/1._FSV_Mainz_05_logo.svg/330px-1._FSV_Mainz_05_logo.svg.png",
  mainz:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/1._FSV_Mainz_05_logo.svg/330px-1._FSV_Mainz_05_logo.svg.png",
  "vfb stuttgart":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/VfB_Stuttgart_1893_Logo.svg/330px-VfB_Stuttgart_1893_Logo.svg.png",
  stuttgart:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/VfB_Stuttgart_1893_Logo.svg/330px-VfB_Stuttgart_1893_Logo.svg.png",
  "vfl wolfsburg":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/VfL_Wolfsburg_Logo.svg/330px-VfL_Wolfsburg_Logo.svg.png",
  wolfsburg:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/VfL_Wolfsburg_Logo.svg/330px-VfL_Wolfsburg_Logo.svg.png",
  hoffenheim:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Logo_TSG_Hoffenheim.svg/330px-Logo_TSG_Hoffenheim.svg.png",
  "tsg hoffenheim":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Logo_TSG_Hoffenheim.svg/330px-Logo_TSG_Hoffenheim.svg.png",
  "union berlin":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/1._FC_Union_Berlin_Logo.svg/330px-1._FC_Union_Berlin_Logo.svg.png",
  "werder bremen":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/SV-Werder-Bremen-Logo.svg/330px-SV-Werder-Bremen-Logo.svg.png",
  "fc augsburg":
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/FC_Augsburg_logo.svg/330px-FC_Augsburg_logo.svg.png",
  augsburg:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/FC_Augsburg_logo.svg/330px-FC_Augsburg_logo.svg.png",
  "borussia monchengladbach":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Borussia_M%C3%B6nchengladbach_logo.svg/330px-Borussia_M%C3%B6nchengladbach_logo.svg.png",
  "borussia m gladbach":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Borussia_M%C3%B6nchengladbach_logo.svg/330px-Borussia_M%C3%B6nchengladbach_logo.svg.png",
  "borussia mgladbach":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Borussia_M%C3%B6nchengladbach_logo.svg/330px-Borussia_M%C3%B6nchengladbach_logo.svg.png",
  "fc heidenheim":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/1._FC_Heidenheim_1846.svg/330px-1._FC_Heidenheim_1846.svg.png",
  heidenheim:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/1._FC_Heidenheim_1846.svg/330px-1._FC_Heidenheim_1846.svg.png",
  "st pauli":
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/FC_St._Pauli_logo_%282018%29.svg/330px-FC_St._Pauli_logo_%282018%29.svg.png",
  "fc st pauli":
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/FC_St._Pauli_logo_%282018%29.svg/330px-FC_St._Pauli_logo_%282018%29.svg.png",
  "holstein kiel":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Holstein_Kiel_Logo.svg/330px-Holstein_Kiel_Logo.svg.png",
  kiel:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Holstein_Kiel_Logo.svg/330px-Holstein_Kiel_Logo.svg.png",
  bochum:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/VfL_Bochum_logo.svg/330px-VfL_Bochum_logo.svg.png",
  "vfl bochum":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/VfL_Bochum_logo.svg/330px-VfL_Bochum_logo.svg.png",
};

function resolveAlias(name: string): string | undefined {
  return ALIASES[name] ?? NORMALIZED_ALIASES[normalizeTeamName(name)];
}

function simplifyName(name: string): string {
  return name
    .replace(/^(fc|ac|as|afc|sc|club)\s+/i, "")
    .replace(/\s+(fc|ac|as|afc|sc|cf)$/i, "")
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
  return STATIC_BADGES[normalizeTeamName(name)] ?? null;
}

function isAllowedBadgeUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ["www.thesportsdb.com", "r2.thesportsdb.com", "upload.wikimedia.org"].includes(
        url.hostname,
      )
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

async function searchOnce(query: string): Promise<string | null> {
  const res = await fetch(
    `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`,
    { headers: { "User-Agent": "Mozilla/5.0 (predicty-foot)" } },
  );
  if (!res.ok) throw new Error(`SportsDB ${res.status}`);
  const data = await res.json();
  const teams: Array<Record<string, string>> = data?.teams ?? [];
  const soccer = teams.find((t) => t.strSport === "Soccer");
  const badge = soccer?.strBadge ?? null;
  return badge && isAllowedBadgeUrl(badge) ? badge : null;
}

async function resolveBadge(name: string): Promise<string | null> {
  const staticBadge = staticBadgeFor(name);
  if (staticBadge) return staticBadge;

  const candidates = candidatesFor(name);
  for (const q of candidates) {
    const candidateStatic = staticBadgeFor(q);
    if (candidateStatic) return candidateStatic;

    try {
      const badge = await searchOnce(q);
      if (badge) return badge;
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("SportsDB 429") || error.message.includes("SportsDB 5"))
      ) {
        break;
      }
      // try next candidate
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  if (teamLogoRateLimiter.check(req)) {
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

  const badge = (await resolveBadge(name)) ?? staticBadgeFor(name) ?? null;
  cache.set(cacheKey, { url: badge, ts: now });
  pruneOldestCacheEntries();

  return NextResponse.json(
    { url: badge },
    { headers: { "Cache-Control": cacheControlFor(badge) } },
  );
}
