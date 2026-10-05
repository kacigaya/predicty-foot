// Builds the league logos in public/leagues from the official badges: one
// 80px PNG per league, cropped to the symbol (the wordmarks are unreadable at
// tab size). Uses the sharp copy bundled with Next; no extra dependency.
// Run it after adding a league, then commit the PNGs:
//
//   bun run leagues
//
// Marks published in white for dark backgrounds also get a light-theme copy
// with their neutral pixels inverted (`<slug>.png`); the original is written
// as `<slug>-dark.png`. Coloured pixels keep their colour.
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const OUT_DIR = new URL("../public/leagues/", import.meta.url);
const SIZE = 80;
const BADGE = "https://r2.thesportsdb.com/images/media/league/badge";

type Source = {
  url: string;
  // Keep only the top of the image, as a fraction of its height, which drops
  // the wordmark under the symbol.
  top?: number;
  // The SVG background panels to drop before rendering.
  stripRects?: boolean;
  white?: boolean;
};

const SOURCES: Record<string, Source> = {
  "premier-league": { url: `${BADGE}/gasy9d1737743125.png/small` },
  "la-liga": { url: `${BADGE}/ja4it51687628717.png/small`, top: 0.7 },
  bundesliga: { url: `${BADGE}/teqh1b1679952008.png/small`, top: 0.82 },
  // TheSportsDB's Serie A badge sits on an opaque white panel; the Wikimedia
  // vector has the panels as separate rects.
  "serie-a": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/e9/Serie_A_logo_2022.svg",
    top: 0.52,
    stripRects: true,
  },
  "ligue-1": { url: `${BADGE}/9f7z9d1742983155.png/small`, top: 0.7 },
  "champions-league": { url: `${BADGE}/facv1u1742998896.png/small`, top: 0.52, white: true },
  "europa-league": { url: `${BADGE}/mlsr7d1718774547.png/small`, top: 0.55, white: true },
  eredivisie: { url: `${BADGE}/5cdsu21725984946.png/small`, top: 0.8, white: true },
  "nations-league": { url: `${BADGE}/cwsp321698386224.png/small`, top: 0.62 },
};

async function download(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "predicty-foot league logos (contact@gaya.anonaddy.com)" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

async function symbol({ url, top = 1, stripRects }: Source): Promise<Buffer> {
  let input = await download(url);
  if (stripRects) input = Buffer.from(input.toString("utf8").replace(/<rect[\s\S]*?\/>/g, ""));
  const image = sharp(input, { density: 300 });
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error(`no dimensions for ${url}`);
  const cropped = await image
    .extract({ left: 0, top: 0, width, height: Math.round(height * top) })
    .png()
    .toBuffer();
  return sharp(cropped)
    .trim()
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

// Inverts grey pixels and leaves saturated ones alone, so a white mark reads
// on a light background without losing its accent colour.
async function invertNeutrals(png: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const max = Math.max(data[i], data[i + 1], data[i + 2]);
    const min = Math.min(data[i], data[i + 1], data[i + 2]);
    if (max - min > 40) continue;
    for (let c = 0; c < 3; c++) data[i + c] = 255 - data[i + c];
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

await mkdir(OUT_DIR, { recursive: true });

for (const [slug, source] of Object.entries(SOURCES)) {
  const png = await symbol(source);
  if (source.white) {
    await writeFile(new URL(`${slug}-dark.png`, OUT_DIR), png);
    await writeFile(new URL(`${slug}.png`, OUT_DIR), await invertNeutrals(png));
  } else {
    await writeFile(new URL(`${slug}.png`, OUT_DIR), png);
  }
}
console.log(`Wrote ${Object.keys(SOURCES).length} league logos to public/leagues`);
