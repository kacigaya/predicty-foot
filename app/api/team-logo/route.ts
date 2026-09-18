import { NextRequest, NextResponse } from "next/server";
import { createInMemoryRateLimiter } from "@/app/lib/rate-limit";

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

const STATIC_BADGES: Record<string, string> = {
  // English Premier League
  arsenal:
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/330px-Arsenal_FC.svg.png",
  "aston villa":
    "https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/Aston_Villa_logo.svg/330px-Aston_Villa_logo.svg.png",
  bournemouth:
    "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/AFC_Bournemouth_%282013%29.svg/330px-AFC_Bournemouth_%282013%29.svg.png",
  "afc bournemouth":
    "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/AFC_Bournemouth_%282013%29.svg/330px-AFC_Bournemouth_%282013%29.svg.png",
  brentford:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Brentford_FC_crest.svg/330px-Brentford_FC_crest.svg.png",
  brighton:
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Brighton_%26_Hove_Albion_logo.svg/330px-Brighton_%26_Hove_Albion_logo.svg.png",
  "brighton and hove albion":
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/fd/Brighton_%26_Hove_Albion_logo.svg/330px-Brighton_%26_Hove_Albion_logo.svg.png",
  chelsea:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/330px-Chelsea_FC.svg.png",
  "crystal palace":
    "https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/Crystal_Palace_FC_logo_%282022%29.svg/330px-Crystal_Palace_FC_logo_%282022%29.svg.png",
  everton:
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/7c/Everton_FC_logo.svg/330px-Everton_FC_logo.svg.png",
  fulham:
    "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Fulham_FC_%28shield%29.svg/330px-Fulham_FC_%28shield%29.svg.png",
  "ipswich town":
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Ipswich_Town.svg/330px-Ipswich_Town.svg.png",
  ipswich:
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Ipswich_Town.svg/330px-Ipswich_Town.svg.png",
  "leicester city":
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2d/Leicester_City_crest.svg/330px-Leicester_City_crest.svg.png",
  leicester:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2d/Leicester_City_crest.svg/330px-Leicester_City_crest.svg.png",
  liverpool:
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/330px-Liverpool_FC.svg.png",
  "manchester city":
    "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/330px-Manchester_City_FC_badge.svg.png",
  "man city":
    "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/330px-Manchester_City_FC_badge.svg.png",
  "manchester united":
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/330px-Manchester_United_FC_crest.svg.png",
  "man united":
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/7a/Manchester_United_FC_crest.svg/330px-Manchester_United_FC_crest.svg.png",
  "newcastle united":
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Newcastle_United_Logo.svg/330px-Newcastle_United_Logo.svg.png",
  newcastle:
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Newcastle_United_Logo.svg/330px-Newcastle_United_Logo.svg.png",
  "nottingham forest":
    "https://upload.wikimedia.org/wikipedia/en/thumb/e/e5/Nottingham_Forest_F.C._logo.svg/330px-Nottingham_Forest_F.C._logo.svg.png",
  southampton:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/c9/FC_Southampton.svg/330px-FC_Southampton.svg.png",
  "tottenham hotspur":
    "https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Tottenham_Hotspur.svg/330px-Tottenham_Hotspur.svg.png",
  tottenham:
    "https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Tottenham_Hotspur.svg/330px-Tottenham_Hotspur.svg.png",
  "west ham united":
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/c2/West_Ham_United_FC_logo.svg/330px-West_Ham_United_FC_logo.svg.png",
  "west ham":
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/c2/West_Ham_United_FC_logo.svg/330px-West_Ham_United_FC_logo.svg.png",
  "wolverhampton wanderers":
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/fc/Wolverhampton_Wanderers.svg/330px-Wolverhampton_Wanderers.svg.png",
  wolves:
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/fc/Wolverhampton_Wanderers.svg/330px-Wolverhampton_Wanderers.svg.png",
  "coventry city":
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/7b/Coventry_City_FC_crest.svg/330px-Coventry_City_FC_crest.svg.png",
  "hull city":
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/54/Hull_City_A.F.C._logo.svg/330px-Hull_City_A.F.C._logo.svg.png",
  "leeds united":
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/54/Leeds_United_F.C._logo.svg/330px-Leeds_United_F.C._logo.svg.png",

  // Spanish La Liga
  "real madrid":
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/330px-Real_Madrid_CF.svg.png",
  barcelona:
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/330px-FC_Barcelona_%28crest%29.svg.png",
  "fc barcelona":
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/330px-FC_Barcelona_%28crest%29.svg.png",
  "atletico madrid":
    "https://r2.thesportsdb.com/images/media/team/badge/0ulh3q1719984315.png",
  "athletic club":
    "https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Club_Athletic_Bilbao_logo.svg/330px-Club_Athletic_Bilbao_logo.svg.png",
  "athletic bilbao":
    "https://upload.wikimedia.org/wikipedia/en/thumb/9/98/Club_Athletic_Bilbao_logo.svg/330px-Club_Athletic_Bilbao_logo.svg.png",
  "real sociedad":
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/Real_Sociedad_logo.svg/330px-Real_Sociedad_logo.svg.png",
  "real betis":
    "https://upload.wikimedia.org/wikipedia/en/thumb/1/13/Real_betis_logo.svg/330px-Real_betis_logo.svg.png",
  villarreal:
    "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Villarreal_CF_logo-en.svg/330px-Villarreal_CF_logo-en.svg.png",
  "villarreal cf":
    "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Villarreal_CF_logo-en.svg/330px-Villarreal_CF_logo-en.svg.png",
  sevilla:
    "https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Sevilla_FC_logo.svg/330px-Sevilla_FC_logo.svg.png",
  "sevilla fc":
    "https://upload.wikimedia.org/wikipedia/en/thumb/3/3b/Sevilla_FC_logo.svg/330px-Sevilla_FC_logo.svg.png",
  valencia:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/Valenciacf.svg/330px-Valenciacf.svg.png",
  "valencia cf":
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/Valenciacf.svg/330px-Valenciacf.svg.png",
  girona:
    "https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Girona_FC_logo.svg/330px-Girona_FC_logo.svg.png",
  "girona fc":
    "https://upload.wikimedia.org/wikipedia/en/thumb/9/90/Girona_FC_logo.svg/330px-Girona_FC_logo.svg.png",
  getafe:
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/46/Getafe_logo.svg/330px-Getafe_logo.svg.png",
  "getafe cf":
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/46/Getafe_logo.svg/330px-Getafe_logo.svg.png",
  "rayo vallecano":
    "https://upload.wikimedia.org/wikipedia/en/thumb/d/d8/Rayo_Vallecano_logo.svg/330px-Rayo_Vallecano_logo.svg.png",
  "celta vigo":
    "https://upload.wikimedia.org/wikipedia/en/thumb/1/12/RC_Celta_de_Vigo_logo.svg/330px-RC_Celta_de_Vigo_logo.svg.png",
  "rc celta de vigo":
    "https://upload.wikimedia.org/wikipedia/en/thumb/1/12/RC_Celta_de_Vigo_logo.svg/330px-RC_Celta_de_Vigo_logo.svg.png",
  espanyol:
    "https://upload.wikimedia.org/wikipedia/en/thumb/9/92/RCD_Espanyol_crest.svg/330px-RCD_Espanyol_crest.svg.png",
  "rcd espanyol":
    "https://upload.wikimedia.org/wikipedia/en/thumb/9/92/RCD_Espanyol_crest.svg/330px-RCD_Espanyol_crest.svg.png",
  mallorca:
    "https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/RCD_Mallorca_logo.svg/330px-RCD_Mallorca_logo.svg.png",
  "rcd mallorca":
    "https://upload.wikimedia.org/wikipedia/en/thumb/e/e0/RCD_Mallorca_logo.svg/330px-RCD_Mallorca_logo.svg.png",
  osasuna:
    "https://upload.wikimedia.org/wikipedia/en/thumb/d/db/CA_Osasuna_logo.svg/330px-CA_Osasuna_logo.svg.png",
  "ca osasuna":
    "https://upload.wikimedia.org/wikipedia/en/thumb/d/db/CA_Osasuna_logo.svg/330px-CA_Osasuna_logo.svg.png",
  alaves:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Deportivo_Alaves_logo.svg/330px-Deportivo_Alaves_logo.svg.png",
  "deportivo alaves":
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Deportivo_Alaves_logo.svg/330px-Deportivo_Alaves_logo.svg.png",
  "las palmas":
    "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/UD_Las_Palmas_logo.svg/330px-UD_Las_Palmas_logo.svg.png",
  "ud las palmas":
    "https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/UD_Las_Palmas_logo.svg/330px-UD_Las_Palmas_logo.svg.png",
  leganes:
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/02/CD_Legan%C3%A9s_logo.svg/330px-CD_Legan%C3%A9s_logo.svg.png",
  "cd leganes":
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/02/CD_Legan%C3%A9s_logo.svg/330px-CD_Legan%C3%A9s_logo.svg.png",
  valladolid:
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/69/Real_Valladolid_logo.svg/330px-Real_Valladolid_logo.svg.png",
  "real valladolid":
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/69/Real_Valladolid_logo.svg/330px-Real_Valladolid_logo.svg.png",

  // German Bundesliga
  "bayern munich":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg/330px-FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg.png",
  "bayern munchen":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg/330px-FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg.png",
  "fc bayern munchen":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg/330px-FC_Bayern_M%C3%BCnchen_logo_%282024%29.svg.png",
  "bayer leverkusen":
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/59/Bayer_04_Leverkusen_logo.svg/330px-Bayer_04_Leverkusen_logo.svg.png",
  "bayer 04 leverkusen":
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/59/Bayer_04_Leverkusen_logo.svg/330px-Bayer_04_Leverkusen_logo.svg.png",
  "borussia dortmund":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/330px-Borussia_Dortmund_logo.svg.png",
  dortmund:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/330px-Borussia_Dortmund_logo.svg.png",
  "rb leipzig":
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/RB_Leipzig_2014_logo.svg/330px-RB_Leipzig_2014_logo.svg.png",
  leipzig:
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/04/RB_Leipzig_2014_logo.svg/330px-RB_Leipzig_2014_logo.svg.png",
  "eintracht frankfurt":
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/7e/Eintracht_Frankfurt_crest.svg/330px-Eintracht_Frankfurt_crest.svg.png",
  frankfurt:
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/7e/Eintracht_Frankfurt_crest.svg/330px-Eintracht_Frankfurt_crest.svg.png",
  "vfb stuttgart":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/VfB_Stuttgart_1893_Logo.svg/330px-VfB_Stuttgart_1893_Logo.svg.png",
  stuttgart:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/VfB_Stuttgart_1893_Logo.svg/330px-VfB_Stuttgart_1893_Logo.svg.png",
  "vfl wolfsburg":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/VfL_Wolfsburg_Logo.svg/330px-VfL_Wolfsburg_Logo.svg.png",
  wolfsburg:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/VfL_Wolfsburg_Logo.svg/330px-VfL_Wolfsburg_Logo.svg.png",
  "sc freiburg":
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/SC_Freiburg_logo.svg/330px-SC_Freiburg_logo.svg.png",
  freiburg:
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/6d/SC_Freiburg_logo.svg/330px-SC_Freiburg_logo.svg.png",
  "werder bremen":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/SV-Werder-Bremen-Logo.svg/330px-SV-Werder-Bremen-Logo.svg.png",
  "union berlin":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/1._FC_Union_Berlin_Logo.svg/330px-1._FC_Union_Berlin_Logo.svg.png",
  "borussia monchengladbach":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Borussia_M%C3%B6nchengladbach_logo.svg/330px-Borussia_M%C3%B6nchengladbach_logo.svg.png",
  "borussia m gladbach":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Borussia_M%C3%B6nchengladbach_logo.svg/330px-Borussia_M%C3%B6nchengladbach_logo.svg.png",
  "borussia mgladbach":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Borussia_M%C3%B6nchengladbach_logo.svg/330px-Borussia_M%C3%B6nchengladbach_logo.svg.png",
  "mainz 05":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/1._FSV_Mainz_05_logo.svg/330px-1._FSV_Mainz_05_logo.svg.png",
  mainz:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/1._FSV_Mainz_05_logo.svg/330px-1._FSV_Mainz_05_logo.svg.png",
  "tsg hoffenheim":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Logo_TSG_Hoffenheim.svg/330px-Logo_TSG_Hoffenheim.svg.png",
  hoffenheim:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Logo_TSG_Hoffenheim.svg/330px-Logo_TSG_Hoffenheim.svg.png",
  "fc augsburg":
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/FC_Augsburg_logo.svg/330px-FC_Augsburg_logo.svg.png",
  augsburg:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/c5/FC_Augsburg_logo.svg/330px-FC_Augsburg_logo.svg.png",
  "fc heidenheim":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/1._FC_Heidenheim_1846.svg/330px-1._FC_Heidenheim_1846.svg.png",
  heidenheim:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/1._FC_Heidenheim_1846.svg/330px-1._FC_Heidenheim_1846.svg.png",
  "fc st pauli":
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/FC_St._Pauli_logo_%282018%29.svg/330px-FC_St._Pauli_logo_%282018%29.svg.png",
  "st pauli":
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/FC_St._Pauli_logo_%282018%29.svg/330px-FC_St._Pauli_logo_%282018%29.svg.png",
  "holstein kiel":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Holstein_Kiel_Logo.svg/330px-Holstein_Kiel_Logo.svg.png",
  kiel:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Holstein_Kiel_Logo.svg/330px-Holstein_Kiel_Logo.svg.png",
  "vfl bochum":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/VfL_Bochum_logo.svg/330px-VfL_Bochum_logo.svg.png",
  bochum:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/VfL_Bochum_logo.svg/330px-VfL_Bochum_logo.svg.png",

  // Italian Serie A
  inter:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/330px-FC_Internazionale_Milano_2021.svg.png",
  "inter milan":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/330px-FC_Internazionale_Milano_2021.svg.png",
  milan:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/330px-Logo_of_AC_Milan.svg.png",
  "ac milan":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Logo_of_AC_Milan.svg/330px-Logo_of_AC_Milan.svg.png",
  juventus:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg/330px-Juventus_FC_-_logo_black_%28Italy%2C_2020%29.svg.png",
  napoli:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/SSC_Napoli_2025_%28white_and_azure%29.svg/330px-SSC_Napoli_2025_%28white_and_azure%29.svg.png",
  "ssc napoli":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/SSC_Napoli_2025_%28white_and_azure%29.svg/330px-SSC_Napoli_2025_%28white_and_azure%29.svg.png",
  roma:
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/AS_Roma_logo_%282017%29.svg/330px-AS_Roma_logo_%282017%29.svg.png",
  "as roma":
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/f7/AS_Roma_logo_%282017%29.svg/330px-AS_Roma_logo_%282017%29.svg.png",
  lazio:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/S.S._Lazio_badge.svg/330px-S.S._Lazio_badge.svg.png",
  "ss lazio":
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/S.S._Lazio_badge.svg/330px-S.S._Lazio_badge.svg.png",
  atalanta:
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/66/AtalantaBC.svg/330px-AtalantaBC.svg.png",
  fiorentina:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/ACF_Fiorentina_2022.svg/330px-ACF_Fiorentina_2022.svg.png",
  bologna:
    "https://upload.wikimedia.org/wikipedia/en/thumb/5/5b/Bologna_F.C._1909_logo.svg/330px-Bologna_F.C._1909_logo.svg.png",
  torino:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Torino_FC_Logo.svg/330px-Torino_FC_Logo.svg.png",
  monza:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/AC_Monza_logo.svg/330px-AC_Monza_logo.svg.png",
  genoa:
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/76/Genoa_CFC_logo.svg/330px-Genoa_CFC_logo.svg.png",
  udinese:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/ce/Udinese_Calcio_logo.svg/330px-Udinese_Calcio_logo.svg.png",
  "hellas verona":
    "https://upload.wikimedia.org/wikipedia/en/thumb/9/92/Hellas_Verona_FC_logo_%282020%29.svg/330px-Hellas_Verona_FC_logo_%282020%29.svg.png",
  cagliari:
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/61/Cagliari_Calcio_1920.svg/330px-Cagliari_Calcio_1920.svg.png",
  empoli:
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/f6/Empoli_FC_logo_%282021%29.svg/330px-Empoli_FC_logo_%282021%29.svg.png",
  parma:
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/09/Parma_Calcio_1913_logo.svg/330px-Parma_Calcio_1913_logo.svg.png",
  como:
    "https://upload.wikimedia.org/wikipedia/en/thumb/1/14/Como_1907_logo.svg/330px-Como_1907_logo.svg.png",
  venezia:
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Venezia_FC_logo_%282022%29.svg/330px-Venezia_FC_logo_%282022%29.svg.png",
  lecce:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/28/US_Lecce_logo.svg/330px-US_Lecce_logo.svg.png",

  // French Ligue 1
  "paris saint germain":
    "https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png",
  "paris sg":
    "https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png",
  psg:
    "https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png",
  marseille:
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Olympique_de_Marseille_2026_logo.svg/330px-Olympique_de_Marseille_2026_logo.svg.png",
  "olympique de marseille":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Olympique_de_Marseille_2026_logo.svg/330px-Olympique_de_Marseille_2026_logo.svg.png",
  monaco:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/LogoASMonacoFC2021.svg/330px-LogoASMonacoFC2021.svg.png",
  "as monaco":
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/LogoASMonacoFC2021.svg/330px-LogoASMonacoFC2021.svg.png",
  lyon:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/c6/Olympique_Lyonnais.svg/330px-Olympique_Lyonnais.svg.png",
  "olympique lyonnais":
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/c6/Olympique_Lyonnais.svg/330px-Olympique_Lyonnais.svg.png",
  lille:
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Lille_OSC_2018_logo.svg/330px-Lille_OSC_2018_logo.svg.png",
  "lille osc":
    "https://upload.wikimedia.org/wikipedia/en/thumb/6/6f/Lille_OSC_2018_logo.svg/330px-Lille_OSC_2018_logo.svg.png",
  lens:
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/RC_Lens_logo.svg/330px-RC_Lens_logo.svg.png",
  "rc lens":
    "https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/RC_Lens_logo.svg/330px-RC_Lens_logo.svg.png",
  rennes:
    "https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/Stade_Rennais_FC.svg/330px-Stade_Rennais_FC.svg.png",
  nice:
    "https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/OGC_Nice_logo.svg/330px-OGC_Nice_logo.svg.png",
  brest:
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/05/Stade_Brestois_29_logo.svg/330px-Stade_Brestois_29_logo.svg.png",
  strasbourg:
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/80/Racing_Club_de_Strasbourg_logo.svg/330px-Racing_Club_de_Strasbourg_logo.svg.png",
  toulouse:
    "https://upload.wikimedia.org/wikipedia/en/thumb/8/8b/Toulouse_FC_logo_%282018%29.svg/330px-Toulouse_FC_logo_%282018%29.svg.png",

  // Eredivisie / Other European Giants
  ajax:
    "https://upload.wikimedia.org/wikipedia/en/thumb/7/79/Ajax_Amsterdam.svg/330px-Ajax_Amsterdam.svg.png",
  psv:
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/05/PSV_Eindhoven.svg/330px-PSV_Eindhoven.svg.png",
  "psv eindhoven":
    "https://upload.wikimedia.org/wikipedia/en/thumb/0/05/PSV_Eindhoven.svg/330px-PSV_Eindhoven.svg.png",
  feyenoord:
    "https://upload.wikimedia.org/wikipedia/en/thumb/e/e3/Feyenoord_logo.svg/330px-Feyenoord_logo.svg.png",
  "sporting cp":
    "https://upload.wikimedia.org/wikipedia/en/thumb/e/e1/Sporting_Clube_de_Portugal_%28Logo%29.svg/330px-Sporting_Clube_de_Portugal_%28Logo%29.svg.png",
  benfica:
    "https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/SL_Benfica_logo.svg/330px-SL_Benfica_logo.svg.png",
  porto:
    "https://upload.wikimedia.org/wikipedia/en/thumb/f/f1/FC_Porto.svg/330px-FC_Porto.svg.png",
  celtic:
    "https://upload.wikimedia.org/wikipedia/en/thumb/3/35/Celtic_FC.svg/330px-Celtic_FC.svg.png",
  rangers:
    "https://upload.wikimedia.org/wikipedia/en/thumb/4/43/Rangers_FC.svg/330px-Rangers_FC.svg.png",
};

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
  const normalized = normalizeTeamName(name);
  if (STATIC_BADGES[normalized]) return STATIC_BADGES[normalized];

  const alias = resolveAlias(name);
  if (alias) {
    const normAlias = normalizeTeamName(alias);
    if (STATIC_BADGES[normAlias]) return STATIC_BADGES[normAlias];
  }

  const simplified = normalizeTeamName(simplifyName(name));
  if (STATIC_BADGES[simplified]) return STATIC_BADGES[simplified];

  return null;
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
        "upload.wikimedia.org",
        "thumb.wikimedia.org",
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

async function searchWikipedia(name: string): Promise<string | null> {
  const alias = resolveAlias(name);
  const clean = simplifyName(name);
  const titles = [
    `${name} F.C.`,
    `${name} FC`,
    name,
    `${name} (football club)`,
    alias ? `${alias} F.C.` : undefined,
    alias ? `${alias} FC` : undefined,
    alias,
    clean !== name ? `${clean} F.C.` : undefined,
    clean !== name ? clean : undefined,
  ].filter(Boolean) as string[];

  for (const title of titles) {
    try {
      const slug = encodeURIComponent(title.replace(/\s+/g, "_"));
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${slug}`,
        {
          headers: {
            "User-Agent": "PredictyFoot/1.0 (football odds and predictions app)",
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(3000),
        },
      );
      if (!res.ok) continue;
      const data = await res.json();
      const rawThumb: string | undefined = data?.thumbnail?.source;
      if (!rawThumb) continue;

      let normalized = rawThumb.split("?")[0];
      normalized = normalized.replace("thumb.wikimedia.org", "upload.wikimedia.org");
      if (isAllowedBadgeUrl(normalized)) {
        return normalized;
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

async function resolveBadge(name: string): Promise<string | null> {
  // Tier 1: Check Static Badges
  const staticBadge = staticBadgeFor(name);
  if (staticBadge) return staticBadge;

  const candidates = candidatesFor(name);

  // Tier 2: Check TheSportsDB
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

  // Tier 3: Wikipedia REST API fallback
  try {
    const wikiBadge = await searchWikipedia(name);
    if (wikiBadge) return wikiBadge;
  } catch {
    // fallback exhausted
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
