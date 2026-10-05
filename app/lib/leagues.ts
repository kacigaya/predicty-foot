export type League = {
  key: string;
  name: string;
  shortName: string;
  country: string;
  // Official mark in public/leagues, built by `bun run leagues`. Marks published
  // in white also have a `logoDark` original; `logo` is then the light-theme copy.
  logo: string;
  logoDark?: string;
};

export const LEAGUES: League[] = [
  { key: "soccer_epl", name: "Premier League", shortName: "EPL", country: "England", logo: "/leagues/premier-league.png" },
  { key: "soccer_spain_la_liga", name: "La Liga", shortName: "La Liga", country: "Spain", logo: "/leagues/la-liga.png" },
  { key: "soccer_germany_bundesliga", name: "Bundesliga", shortName: "BL", country: "Germany", logo: "/leagues/bundesliga.png" },
  { key: "soccer_italy_serie_a", name: "Serie A", shortName: "Serie A", country: "Italy", logo: "/leagues/serie-a.png" },
  { key: "soccer_france_ligue_one", name: "Ligue 1", shortName: "L1", country: "France", logo: "/leagues/ligue-1.png" },
  { key: "soccer_uefa_champs_league", name: "Champions League", shortName: "UCL", country: "Europe", logo: "/leagues/champions-league.png", logoDark: "/leagues/champions-league-dark.png" },
  { key: "soccer_uefa_europa_league", name: "Europa League", shortName: "UEL", country: "Europe", logo: "/leagues/europa-league.png", logoDark: "/leagues/europa-league-dark.png" },
  { key: "soccer_netherlands_eredivisie", name: "Eredivisie", shortName: "Ere", country: "Netherlands", logo: "/leagues/eredivisie.png", logoDark: "/leagues/eredivisie-dark.png" },
  { key: "soccer_uefa_nations_league", name: "Nations League", shortName: "UNL", country: "Europe", logo: "/leagues/nations-league.png" },
];

export const DEFAULT_LEAGUE_KEY = "soccer_epl";

export function getLeague(key: string): League | undefined {
  return LEAGUES.find((l) => l.key === key);
}

// Allowlist check for league keys coming from the browser. Every caller that
// forwards a key to the odds provider goes through this.
export function isLeagueKey(key: string): boolean {
  return LEAGUES.some((l) => l.key === key);
}

// Home page URL showing a league's fixtures; the default league is plain "/".
export function leagueHref(key: string): string {
  return key === DEFAULT_LEAGUE_KEY ? "/" : `/?league=${encodeURIComponent(key)}`;
}
