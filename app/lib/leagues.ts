export type League = {
  key: string;
  name: string;
  shortName: string;
  country: string;
  flag: string;
};

export const LEAGUES: League[] = [
  { key: "soccer_epl", name: "Premier League", shortName: "EPL", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { key: "soccer_spain_la_liga", name: "La Liga", shortName: "La Liga", country: "Spain", flag: "🇪🇸" },
  { key: "soccer_germany_bundesliga", name: "Bundesliga", shortName: "BL", country: "Germany", flag: "🇩🇪" },
  { key: "soccer_italy_serie_a", name: "Serie A", shortName: "Serie A", country: "Italy", flag: "🇮🇹" },
  { key: "soccer_france_ligue_one", name: "Ligue 1", shortName: "L1", country: "France", flag: "🇫🇷" },
  { key: "soccer_uefa_champs_league", name: "Champions League", shortName: "UCL", country: "Europe", flag: "🏆" },
  { key: "soccer_uefa_europa_league", name: "Europa League", shortName: "UEL", country: "Europe", flag: "🥈" },
  { key: "soccer_netherlands_eredivisie", name: "Eredivisie", shortName: "Ere", country: "Netherlands", flag: "🇳🇱" },
];

export const DEFAULT_LEAGUE_KEY = "soccer_epl";

export function getLeague(key: string): League | undefined {
  return LEAGUES.find((l) => l.key === key);
}
