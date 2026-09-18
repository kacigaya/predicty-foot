// Canonical origin for metadata (canonical, Open Graph). Override with
// NEXT_PUBLIC_SITE_URL for previews; it is inlined at build time.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pfoot.gayakaci.duckdns.org";

export const SITE_NAME = "Predicty Foot";

export const SITE_DESCRIPTION =
  "Averaged bookmaker odds and Gemini match predictions for Europe's top football leagues.";
