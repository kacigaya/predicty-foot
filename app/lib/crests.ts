import type { OddsEvent } from "./odds";

// Crests served from public/crests. `bun run crests` downloads them from
// TheSportsDB (CREST_SOURCES); commit the PNGs, the app never fetches these
// URLs at runtime. Teams without an entry show their initials.

// Normalized team name (see normalizeTeamName) to crest slug.
export const CREST_SLUGS: Record<string, string> = {
  // English Premier League
  arsenal: "arsenal",
  "aston villa": "aston-villa",
  bournemouth: "bournemouth",
  "afc bournemouth": "bournemouth",
  brentford: "brentford",
  brighton: "brighton-and-hove-albion",
  "brighton and hove albion": "brighton-and-hove-albion",
  chelsea: "chelsea",
  "crystal palace": "crystal-palace",
  everton: "everton",
  fulham: "fulham",
  "ipswich town": "ipswich-town",
  ipswich: "ipswich-town",
  "leicester city": "leicester-city",
  leicester: "leicester-city",
  liverpool: "liverpool",
  "manchester city": "manchester-city",
  "man city": "manchester-city",
  "manchester united": "manchester-united",
  "man united": "manchester-united",
  "newcastle united": "newcastle-united",
  newcastle: "newcastle-united",
  "nottingham forest": "nottingham-forest",
  southampton: "southampton",
  "tottenham hotspur": "tottenham-hotspur",
  tottenham: "tottenham-hotspur",
  "west ham united": "west-ham-united",
  "west ham": "west-ham-united",
  "wolverhampton wanderers": "wolverhampton-wanderers",
  wolves: "wolverhampton-wanderers",
  "coventry city": "coventry-city",
  "hull city": "hull-city",
  "leeds united": "leeds-united",

  // Spanish La Liga
  "real madrid": "real-madrid",
  barcelona: "barcelona",
  "fc barcelona": "barcelona",
  "atletico madrid": "atletico-madrid",
  "athletic club": "athletic-bilbao",
  "athletic bilbao": "athletic-bilbao",
  "real sociedad": "real-sociedad",
  "real betis": "real-betis",
  villarreal: "villarreal",
  "villarreal cf": "villarreal",
  sevilla: "sevilla",
  "sevilla fc": "sevilla",
  valencia: "valencia",
  "valencia cf": "valencia",
  girona: "girona",
  "girona fc": "girona",
  getafe: "getafe",
  "getafe cf": "getafe",
  "rayo vallecano": "rayo-vallecano",
  "celta vigo": "celta-vigo",
  "rc celta de vigo": "celta-vigo",
  espanyol: "espanyol",
  "rcd espanyol": "espanyol",
  mallorca: "mallorca",
  "rcd mallorca": "mallorca",
  osasuna: "osasuna",
  "ca osasuna": "osasuna",
  alaves: "deportivo-alaves",
  "deportivo alaves": "deportivo-alaves",
  "las palmas": "las-palmas",
  "ud las palmas": "las-palmas",
  leganes: "leganes",
  "cd leganes": "leganes",
  valladolid: "real-valladolid",
  "real valladolid": "real-valladolid",

  // German Bundesliga
  "bayern munich": "bayern-munich",
  "bayern munchen": "bayern-munich",
  "fc bayern munchen": "bayern-munich",
  "bayer leverkusen": "bayer-leverkusen",
  "bayer 04 leverkusen": "bayer-leverkusen",
  "borussia dortmund": "borussia-dortmund",
  dortmund: "borussia-dortmund",
  "rb leipzig": "rb-leipzig",
  leipzig: "rb-leipzig",
  "eintracht frankfurt": "eintracht-frankfurt",
  frankfurt: "eintracht-frankfurt",
  "vfb stuttgart": "vfb-stuttgart",
  stuttgart: "vfb-stuttgart",
  "vfl wolfsburg": "vfl-wolfsburg",
  wolfsburg: "vfl-wolfsburg",
  "sc freiburg": "sc-freiburg",
  freiburg: "sc-freiburg",
  "werder bremen": "werder-bremen",
  "union berlin": "union-berlin",
  "borussia monchengladbach": "borussia-monchengladbach",
  "borussia m gladbach": "borussia-monchengladbach",
  "borussia mgladbach": "borussia-monchengladbach",
  "mainz 05": "mainz",
  mainz: "mainz",
  "tsg hoffenheim": "tsg-hoffenheim",
  hoffenheim: "tsg-hoffenheim",
  "fc augsburg": "fc-augsburg",
  augsburg: "fc-augsburg",
  "fc heidenheim": "fc-heidenheim",
  heidenheim: "fc-heidenheim",
  "fc st pauli": "st-pauli",
  "st pauli": "st-pauli",
  "holstein kiel": "holstein-kiel",
  kiel: "holstein-kiel",
  "vfl bochum": "vfl-bochum",
  bochum: "vfl-bochum",

  // Italian Serie A
  inter: "inter-milan",
  "inter milan": "inter-milan",
  milan: "ac-milan",
  "ac milan": "ac-milan",
  juventus: "juventus",
  napoli: "napoli",
  "ssc napoli": "napoli",
  roma: "roma",
  "as roma": "roma",
  lazio: "lazio",
  "ss lazio": "lazio",
  atalanta: "atalanta",
  fiorentina: "fiorentina",
  bologna: "bologna",
  torino: "torino",
  monza: "monza",
  genoa: "genoa",
  udinese: "udinese",
  "hellas verona": "hellas-verona",
  cagliari: "cagliari",
  empoli: "empoli",
  parma: "parma",
  como: "como",
  venezia: "venezia",
  lecce: "lecce",

  // French Ligue 1
  "paris saint germain": "paris-saint-germain",
  "paris sg": "paris-saint-germain",
  psg: "paris-saint-germain",
  marseille: "marseille",
  "olympique de marseille": "marseille",
  monaco: "monaco",
  "as monaco": "monaco",
  lyon: "lyon",
  "olympique lyonnais": "lyon",
  lille: "lille-osc",
  "lille osc": "lille-osc",
  lens: "lens",
  "rc lens": "lens",
  rennes: "rennes",
  nice: "nice",
  brest: "brest",
  strasbourg: "strasbourg",
  toulouse: "toulouse",

  // Eredivisie and other European clubs
  ajax: "ajax",
  psv: "psv",
  "psv eindhoven": "psv",
  feyenoord: "feyenoord",
  "sporting cp": "sporting-cp",
  benfica: "benfica",
  porto: "porto",
  celtic: "celtic",
  rangers: "rangers",

  // Added 2026-10-01 from the live feeds: current league members and European
  // cup opponents. Each source was checked for league, country and men's team.
  sunderland: "sunderland",
  "le havre": "le-havre",
  angers: "angers",
  "le mans fc": "le-mans",
  lorient: "lorient",
  "paris fc": "paris-fc",
  auxerre: "auxerre",
  troyes: "troyes",
  "fsv mainz 05": "mainz",
  elversberg: "elversberg",
  "hamburger sv": "hamburg",
  "sc paderborn": "paderborn",
  "1 fc koln": "koln",
  "fc schalke 04": "schalke-04",
  frosinone: "frosinone",
  sassuolo: "sassuolo",
  "atalanta bc": "atalanta",
  "az alkmaar": "az-alkmaar",
  "nec nijmegen": "nec-nijmegen",
  heerenveen: "heerenveen",
  "go ahead eagles": "go-ahead-eagles",
  "sparta rotterdam": "sparta-rotterdam",
  "fortuna sittard": "fortuna-sittard",
  "fc twente enschede": "twente",
  "fc utrecht": "utrecht",
  "willem ii": "willem-ii",
  "sc telstar": "telstar",
  "ado den haag": "ado-den-haag",
  "fc zwolle": "pec-zwolle",
  "sc cambuur": "cambuur",
  excelsior: "excelsior",
  groningen: "groningen",
  malaga: "malaga",
  "elche cf": "elche",
  "deportivo la coruna": "deportivo-de-a-coruna",
  "real racing club de santander": "racing-de-santander",
  levante: "levante",
  "sabah fk": "sabah-baku",
  "slavia praha": "slavia-prague",
  galatasaray: "galatasaray",
  "viking fk": "viking",
  "club brugge": "club-brugge",
  lask: "lask",
  "shakhtar donetsk": "shakhtar-donetsk",
  "aek athens": "aek-athens",
  fenerbahce: "fenerbahce",
  "bod glimt": "bodo-glimt",
  "sk slovan bratislava": "slovan-bratislava",
  salzburg: "red-bull-salzburg",
  "hapoel be er sheva": "hapoel-beer-sheva",
  "lech poznan": "lech-poznan",
  "sparta prague": "sparta-prague",
  lillestrom: "lillestrom",
  "nk celje": "celje",
  "omonoia fc": "omonia-nicosia",
  "union saint gilloise": "union-saint-gilloise",
  torreense: "torreense",
  "dinamo zagreb": "dinamo-zagreb",
  anderlecht: "anderlecht",
  "besiktas jk": "besiktas",
  "sk sturm graz": "sturm-graz",
  "jagiellonia bia ystok": "jagiellonia-bialystok",
  "fc ararat armenia": "ararat-armenia",
  "ferencvaros tc": "ferencvaros",
  "viktoria plzen": "viktoria-plzen",
  "olympiakos piraeus": "olympiacos",
  "pfc levski sofia": "levski-sofia",
  "ofi crete": "ofi",
};

// Crest slug to TheSportsDB badge, fetched at 200px through its `/small` variant.
export const CREST_SOURCES: Record<string, string> = {
  arsenal:
    "https://r2.thesportsdb.com/images/media/team/badge/uyhbfe1612467038.png",
  "aston-villa":
    "https://r2.thesportsdb.com/images/media/team/badge/uwzw561787679026.png",
  bournemouth:
    "https://r2.thesportsdb.com/images/media/team/badge/y08nak1534071116.png",
  brentford:
    "https://r2.thesportsdb.com/images/media/team/badge/grv1aw1546453779.png",
  "brighton-and-hove-albion":
    "https://r2.thesportsdb.com/images/media/team/badge/ywypts1448810904.png",
  chelsea:
    "https://r2.thesportsdb.com/images/media/team/badge/pbf4ul1782638263.png",
  "crystal-palace":
    "https://r2.thesportsdb.com/images/media/team/badge/ia6i3m1656014992.png",
  everton:
    "https://r2.thesportsdb.com/images/media/team/badge/eqayrf1523184794.png",
  fulham:
    "https://r2.thesportsdb.com/images/media/team/badge/xwwvyt1448811086.png",
  "ipswich-town":
    "https://r2.thesportsdb.com/images/media/team/badge/mdj1ey1634670785.png",
  "leicester-city":
    "https://r2.thesportsdb.com/images/media/team/badge/xtxwtu1448813356.png",
  liverpool:
    "https://r2.thesportsdb.com/images/media/team/badge/kfaher1737969724.png",
  "manchester-city":
    "https://r2.thesportsdb.com/images/media/team/badge/vwpvry1467462651.png",
  "manchester-united":
    "https://r2.thesportsdb.com/images/media/team/badge/xzqdr11517660252.png",
  "newcastle-united":
    "https://r2.thesportsdb.com/images/media/team/badge/lhwuiz1621593302.png",
  "nottingham-forest":
    "https://r2.thesportsdb.com/images/media/team/badge/sar2y41781740886.png",
  southampton:
    "https://r2.thesportsdb.com/images/media/team/badge/ggqtd01621593274.png",
  "tottenham-hotspur":
    "https://r2.thesportsdb.com/images/media/team/badge/dfyfhl1604094109.png",
  "west-ham-united":
    "https://r2.thesportsdb.com/images/media/team/badge/yutyxs1467459956.png",
  "wolverhampton-wanderers":
    "https://r2.thesportsdb.com/images/media/team/badge/u9qr031621593327.png",
  "coventry-city":
    "https://r2.thesportsdb.com/images/media/team/badge/uxyqys1424033798.png",
  "hull-city":
    "https://r2.thesportsdb.com/images/media/team/badge/fbqqda1601726113.png",
  "leeds-united":
    "https://r2.thesportsdb.com/images/media/team/badge/jcgrml1756649030.png",
  "real-madrid":
    "https://r2.thesportsdb.com/images/media/team/badge/vwvwrw1473502969.png",
  barcelona:
    "https://r2.thesportsdb.com/images/media/team/badge/wq9sir1639406443.png",
  "atletico-madrid":
    "https://r2.thesportsdb.com/images/media/team/badge/0ulh3q1719984315.png",
  "athletic-bilbao":
    "https://r2.thesportsdb.com/images/media/team/badge/68w7fe1639408210.png",
  "real-sociedad":
    "https://r2.thesportsdb.com/images/media/team/badge/vptvpr1473502986.png",
  "real-betis":
    "https://r2.thesportsdb.com/images/media/team/badge/2oqulv1663245386.png",
  villarreal:
    "https://r2.thesportsdb.com/images/media/team/badge/vrypqy1473503073.png",
  sevilla:
    "https://r2.thesportsdb.com/images/media/team/badge/vpsqqx1473502977.png",
  valencia:
    "https://r2.thesportsdb.com/images/media/team/badge/dm8l6o1655594864.png",
  girona:
    "https://r2.thesportsdb.com/images/media/team/badge/kfu7zu1659897499.png",
  getafe:
    "https://r2.thesportsdb.com/images/media/team/badge/eyh2891655594452.png",
  "rayo-vallecano":
    "https://r2.thesportsdb.com/images/media/team/badge/nzhu941655595465.png",
  "celta-vigo":
    "https://r2.thesportsdb.com/images/media/team/badge/xfjtku1690436219.png",
  espanyol:
    "https://r2.thesportsdb.com/images/media/team/badge/867nzz1681703222.png",
  mallorca:
    "https://r2.thesportsdb.com/images/media/team/badge/ssptsx1473503730.png",
  osasuna:
    "https://r2.thesportsdb.com/images/media/team/badge/rvspvt1473502960.png",
  "deportivo-alaves":
    "https://r2.thesportsdb.com/images/media/team/badge/mfn99h1734673842.png",
  "las-palmas":
    "https://r2.thesportsdb.com/images/media/team/badge/mmhyb11616443601.png",
  leganes:
    "https://r2.thesportsdb.com/images/media/team/badge/tm0adr1616443898.png",
  "real-valladolid":
    "https://r2.thesportsdb.com/images/media/team/badge/bnhu8b1719983736.png",
  "bayern-munich":
    "https://r2.thesportsdb.com/images/media/team/badge/01ogkh1716960412.png",
  "bayer-leverkusen":
    "https://r2.thesportsdb.com/images/media/team/badge/3x9k851726760113.png",
  "borussia-dortmund":
    "https://r2.thesportsdb.com/images/media/team/badge/tqo8ge1716960353.png",
  "rb-leipzig":
    "https://r2.thesportsdb.com/images/media/team/badge/zjgapo1594244951.png",
  "eintracht-frankfurt":
    "https://r2.thesportsdb.com/images/media/team/badge/rurwpy1473453269.png",
  "vfb-stuttgart":
    "https://r2.thesportsdb.com/images/media/team/badge/yppyux1473454085.png",
  "vfl-wolfsburg":
    "https://r2.thesportsdb.com/images/media/team/badge/ci9trv1778399557.png",
  "sc-freiburg":
    "https://r2.thesportsdb.com/images/media/team/badge/urwtup1473453288.png",
  "werder-bremen":
    "https://r2.thesportsdb.com/images/media/team/badge/tkvqan1716960454.png",
  "union-berlin":
    "https://r2.thesportsdb.com/images/media/team/badge/q0o5001599679795.png",
  "borussia-monchengladbach":
    "https://r2.thesportsdb.com/images/media/team/badge/sysurw1473453380.png",
  mainz:
    "https://r2.thesportsdb.com/images/media/team/badge/fhm9v51552134916.png",
  "tsg-hoffenheim":
    "https://r2.thesportsdb.com/images/media/team/badge/9hwvb21621593919.png",
  "fc-augsburg":
    "https://r2.thesportsdb.com/images/media/team/badge/xqyyvq1473453233.png",
  "fc-heidenheim":
    "https://r2.thesportsdb.com/images/media/team/badge/lbj7g01608236988.png",
  "st-pauli":
    "https://r2.thesportsdb.com/images/media/team/badge/5qupxa1608237013.png",
  "holstein-kiel":
    "https://r2.thesportsdb.com/images/media/team/badge/1fpmgs1514394524.png",
  "vfl-bochum":
    "https://r2.thesportsdb.com/images/media/team/badge/kag3jy1599821108.png",
  "inter-milan":
    "https://r2.thesportsdb.com/images/media/team/badge/ryhu6d1617113103.png",
  "ac-milan":
    "https://r2.thesportsdb.com/images/media/team/badge/wvspur1448806617.png",
  juventus:
    "https://r2.thesportsdb.com/images/media/team/badge/uxf0gr1742983727.png",
  napoli:
    "https://r2.thesportsdb.com/images/media/team/badge/l8qyxv1742982541.png",
  roma:
    "https://r2.thesportsdb.com/images/media/team/badge/jwro2s1760820674.png",
  lazio:
    "https://r2.thesportsdb.com/images/media/team/badge/rwqyvs1448806608.png",
  atalanta:
    "https://r2.thesportsdb.com/images/media/team/badge/qix5ku1780561327.png",
  fiorentina:
    "https://r2.thesportsdb.com/images/media/team/badge/hc8nhu1656098030.png",
  bologna:
    "https://r2.thesportsdb.com/images/media/team/badge/2qi1u31655592366.png",
  torino:
    "https://r2.thesportsdb.com/images/media/team/badge/xxprty1448806802.png",
  monza:
    "https://r2.thesportsdb.com/images/media/team/badge/bxearg1603170113.png",
  genoa:
    "https://r2.thesportsdb.com/images/media/team/badge/52s8dn1655553600.png",
  udinese:
    "https://r2.thesportsdb.com/images/media/team/badge/vwvstr1448806811.png",
  "hellas-verona":
    "https://r2.thesportsdb.com/images/media/team/badge/p6camf1593457737.png",
  cagliari:
    "https://r2.thesportsdb.com/images/media/team/badge/wvsvxt1447534471.png",
  empoli:
    "https://r2.thesportsdb.com/images/media/team/badge/c1ie6b1622561483.png",
  parma:
    "https://r2.thesportsdb.com/images/media/team/badge/6yiaxs1627406063.png",
  como:
    "https://r2.thesportsdb.com/images/media/team/badge/02x81t1627405841.png",
  venezia:
    "https://r2.thesportsdb.com/images/media/team/badge/vbiget1781026964.png",
  lecce:
    "https://r2.thesportsdb.com/images/media/team/badge/j4vznr1567365249.png",
  "paris-saint-germain":
    "https://r2.thesportsdb.com/images/media/team/badge/rwqrrq1473504808.png",
  marseille:
    "https://r2.thesportsdb.com/images/media/team/badge/c6bazh1779212287.png",
  monaco:
    "https://r2.thesportsdb.com/images/media/team/badge/exjf5l1678808044.png",
  lyon:
    "https://r2.thesportsdb.com/images/media/team/badge/blk9771656932845.png",
  "lille-osc":
    "https://r2.thesportsdb.com/images/media/team/badge/2giize1534005340.png",
  lens:
    "https://r2.thesportsdb.com/images/media/team/badge/3pxoum1598797195.png",
  rennes:
    "https://r2.thesportsdb.com/images/media/team/badge/ypturx1473504818.png",
  nice:
    "https://r2.thesportsdb.com/images/media/team/badge/msy7ly1621593859.png",
  brest:
    "https://r2.thesportsdb.com/images/media/team/badge/z69be41598797026.png",
  strasbourg:
    "https://r2.thesportsdb.com/images/media/team/badge/b8k77w1766625501.png",
  toulouse:
    "https://r2.thesportsdb.com/images/media/team/badge/17eqox1688449282.png",
  ajax:
    "https://r2.thesportsdb.com/images/media/team/badge/zg9tii1755495289.png",
  psv:
    "https://r2.thesportsdb.com/images/media/team/badge/xfsz6i1721297428.png",
  feyenoord:
    "https://r2.thesportsdb.com/images/media/team/badge/uturtx1473534803.png",
  "sporting-cp":
    "https://r2.thesportsdb.com/images/media/team/badge/5hiuk71783137875.png",
  benfica:
    "https://r2.thesportsdb.com/images/media/team/badge/hj4kyc1781152436.png",
  porto:
    "https://r2.thesportsdb.com/images/media/team/badge/xu47rb1628855600.png",
  celtic:
    "https://r2.thesportsdb.com/images/media/team/badge/3uv1641758780002.png",
  rangers:
    "https://r2.thesportsdb.com/images/media/team/badge/zgrbl21788969413.png",
  sunderland:
    "https://r2.thesportsdb.com/images/media/team/badge/tprtus1448813498.png",
  "le-havre":
    "https://r2.thesportsdb.com/images/media/team/badge/aikowk1546475003.png",
  angers:
    "https://r2.thesportsdb.com/images/media/team/badge/ix6q4w1678808069.png",
  "le-mans":
    "https://r2.thesportsdb.com/images/media/team/badge/wjhziv1700145026.png",
  lorient:
    "https://r2.thesportsdb.com/images/media/team/badge/sxsttw1473504748.png",
  "paris-fc":
    "https://r2.thesportsdb.com/images/media/team/badge/yuvtsy1447594254.png",
  auxerre:
    "https://r2.thesportsdb.com/images/media/team/badge/lzdtbf1658753355.png",
  troyes:
    "https://r2.thesportsdb.com/images/media/team/badge/sl5kzg1766617559.png",
  elversberg:
    "https://r2.thesportsdb.com/images/media/team/badge/z079go1677573926.png",
  hamburg:
    "https://r2.thesportsdb.com/images/media/team/badge/tvtppt1473453296.png",
  paderborn:
    "https://r2.thesportsdb.com/images/media/team/badge/kddvva1566048058.png",
  koln:
    "https://r2.thesportsdb.com/images/media/team/badge/2j1sc91566049407.png",
  "schalke-04":
    "https://r2.thesportsdb.com/images/media/team/badge/hnci291621593978.png",
  frosinone:
    "https://r2.thesportsdb.com/images/media/team/badge/a7xa151603170120.png",
  sassuolo:
    "https://r2.thesportsdb.com/images/media/team/badge/xystvp1448806138.png",
  "az-alkmaar":
    "https://r2.thesportsdb.com/images/media/team/badge/wtqwvv1473534757.png",
  "nec-nijmegen":
    "https://r2.thesportsdb.com/images/media/team/badge/t5qjle1701019868.png",
  heerenveen:
    "https://r2.thesportsdb.com/images/media/team/badge/surtsx1473534841.png",
  "go-ahead-eagles":
    "https://r2.thesportsdb.com/images/media/team/badge/3hq2cy1685597026.png",
  "sparta-rotterdam":
    "https://r2.thesportsdb.com/images/media/team/badge/upluv31586362224.png",
  "fortuna-sittard":
    "https://r2.thesportsdb.com/images/media/team/badge/aqr7it1685596947.png",
  twente:
    "https://r2.thesportsdb.com/images/media/team/badge/rsrxrt1473534783.png",
  utrecht:
    "https://r2.thesportsdb.com/images/media/team/badge/yuhha71625167104.png",
  "willem-ii":
    "https://r2.thesportsdb.com/images/media/team/badge/ushlnc1666107465.png",
  telstar:
    "https://r2.thesportsdb.com/images/media/team/badge/xg1ss31579463659.png",
  "ado-den-haag":
    "https://r2.thesportsdb.com/images/media/team/badge/vpvtqt1473534732.png",
  "pec-zwolle":
    "https://r2.thesportsdb.com/images/media/team/badge/qpvqwy1473534822.png",
  cambuur:
    "https://r2.thesportsdb.com/images/media/team/badge/b3rap31579463652.png",
  excelsior:
    "https://r2.thesportsdb.com/images/media/team/badge/bmbn9v1625172555.png",
  groningen:
    "https://r2.thesportsdb.com/images/media/team/badge/f36qnp1666107447.png",
  malaga:
    "https://r2.thesportsdb.com/images/media/team/badge/upqyvr1473502952.png",
  elche:
    "https://r2.thesportsdb.com/images/media/team/badge/e4vaw51655594332.png",
  "deportivo-de-a-coruna":
    "https://r2.thesportsdb.com/images/media/team/badge/62bvwv1783013156.png",
  "racing-de-santander":
    "https://r2.thesportsdb.com/images/media/team/badge/97kkiq1536575158.png",
  levante:
    "https://r2.thesportsdb.com/images/media/team/badge/xwtxsx1473503739.png",
  "sabah-baku":
    "https://r2.thesportsdb.com/images/media/team/badge/5cw7q91723051971.png",
  "slavia-prague":
    "https://r2.thesportsdb.com/images/media/team/badge/l7kl4n1759252139.png",
  galatasaray:
    "https://r2.thesportsdb.com/images/media/team/badge/io7jk21767941298.png",
  viking:
    "https://r2.thesportsdb.com/images/media/team/badge/9mzq961590148192.png",
  "club-brugge":
    "https://r2.thesportsdb.com/images/media/team/badge/mz8y0q1771129880.png",
  lask:
    "https://r2.thesportsdb.com/images/media/team/badge/oox26l1683556395.png",
  "shakhtar-donetsk":
    "https://r2.thesportsdb.com/images/media/team/badge/sqrxsr1421791799.png",
  "aek-athens":
    "https://r2.thesportsdb.com/images/media/team/badge/4nogst1602773624.png",
  fenerbahce:
    "https://r2.thesportsdb.com/images/media/team/badge/twxxvs1448199691.png",
  "bodo-glimt":
    "https://r2.thesportsdb.com/images/media/team/badge/uqpwwx1449165943.png",
  "slovan-bratislava":
    "https://r2.thesportsdb.com/images/media/team/badge/uzkg701781199823.png",
  "red-bull-salzburg":
    "https://r2.thesportsdb.com/images/media/team/badge/nc2cua1781541639.png",
  "hapoel-beer-sheva":
    "https://r2.thesportsdb.com/images/media/team/badge/ar5zft1781239007.png",
  "lech-poznan":
    "https://r2.thesportsdb.com/images/media/team/badge/8zfxyx1685597440.png",
  "sparta-prague":
    "https://r2.thesportsdb.com/images/media/team/badge/j00qct1718287150.png",
  lillestrom:
    "https://r2.thesportsdb.com/images/media/team/badge/txpuvv1448823342.png",
  celje:
    "https://r2.thesportsdb.com/images/media/team/badge/amvs371681106952.png",
  "omonia-nicosia":
    "https://r2.thesportsdb.com/images/media/team/badge/nmd7vt1779579017.png",
  "union-saint-gilloise":
    "https://r2.thesportsdb.com/images/media/team/badge/ljszp41654601742.png",
  torreense:
    "https://r2.thesportsdb.com/images/media/team/badge/byn6c21659694982.png",
  "dinamo-zagreb":
    "https://r2.thesportsdb.com/images/media/team/badge/zcb6f61784988620.png",
  anderlecht:
    "https://r2.thesportsdb.com/images/media/team/badge/auindn1771129464.png",
  besiktas:
    "https://r2.thesportsdb.com/images/media/team/badge/svo05k1776827439.png",
  "sturm-graz":
    "https://r2.thesportsdb.com/images/media/team/badge/ppg0j71578585847.png",
  "jagiellonia-bialystok":
    "https://r2.thesportsdb.com/images/media/team/badge/ucze1y1601404699.png",
  "ararat-armenia":
    "https://r2.thesportsdb.com/images/media/team/badge/g396se1596470244.png",
  ferencvaros:
    "https://r2.thesportsdb.com/images/media/team/badge/wk17od1688115265.png",
  "viktoria-plzen":
    "https://r2.thesportsdb.com/images/media/team/badge/at8i2h1679265942.png",
  olympiacos:
    "https://r2.thesportsdb.com/images/media/team/badge/xckasq1721291508.png",
  "levski-sofia":
    "https://r2.thesportsdb.com/images/media/team/badge/9krgx71781149189.png",
  ofi:
    "https://r2.thesportsdb.com/images/media/team/badge/02xrl91602773672.png",
};

// Odds API spellings that differ from the CREST_SLUGS keys.
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
  "Inter Milan": "Inter",
  "AC Milan": "Milan",
  "AS Roma": "Roma",
  "Wolverhampton Wanderers": "Wolves",
  "Brighton and Hove Albion": "Brighton",
  "Tottenham Hotspur": "Tottenham",
  "West Ham United": "West Ham",
  "Newcastle United": "Newcastle",
  "Manchester United": "Man United",
  "Manchester City": "Man City",
  "Leicester City": "Leicester",
  "Ipswich Town": "Ipswich",
  "Sporting Lisbon": "Sporting CP",
  "Sporting Clube de Portugal": "Sporting CP",
  "PSV Eindhoven": "PSV",
};

export function normalizeTeamName(value: string): string {
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

// Drops club-type prefixes and suffixes: "FC Augsburg" and "Augsburg FC" both
// become "Augsburg".
function simplifyName(name: string): string {
  return name
    .replace(/^(fc|ac|as|afc|sc|club|cf|rc|rcd|ca|ud|cd|vfb|vfl|1\.)\s+/i, "")
    .replace(/\s+(fc|ac|as|afc|sc|cf|f\.c\.|c\.f\.)$/i, "")
    .trim();
}

// Path of the bundled crest for a team name from the odds feed, or null.
export function crestFor(name: string): string | null {
  const alias = NORMALIZED_ALIASES[normalizeTeamName(name)];
  const slug =
    CREST_SLUGS[normalizeTeamName(name)] ??
    (alias ? CREST_SLUGS[normalizeTeamName(alias)] : undefined) ??
    CREST_SLUGS[normalizeTeamName(simplifyName(name))];
  return slug ? `/crests/${slug}.png` : null;
}

// An odds event with crests resolved on the server, so the browser never has
// to look them up.
export type Fixture = OddsEvent & { homeCrest: string | null; awayCrest: string | null };

export function withCrests(event: OddsEvent): Fixture {
  return { ...event, homeCrest: crestFor(event.home_team), awayCrest: crestFor(event.away_team) };
}
