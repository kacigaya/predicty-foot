// Downloads the bundled team crests from TheSportsDB into public/crests, one
// 200px PNG per slug in CREST_SOURCES. Run it after adding or changing a crest,
// then commit the PNGs:
//
//   bun run crests
//
// Files are overwritten. Slugs no longer in CREST_SOURCES are reported, not
// deleted.
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { CREST_SOURCES } from "../app/lib/crests";

const OUT_DIR = new URL("../public/crests/", import.meta.url);
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47];

await mkdir(OUT_DIR, { recursive: true });

const failures: string[] = [];
for (const [slug, source] of Object.entries(CREST_SOURCES)) {
  const res = await fetch(`${source}/small`, { signal: AbortSignal.timeout(10_000) });
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!res.ok || !PNG_SIGNATURE.every((b, i) => bytes[i] === b)) {
    failures.push(`${slug}: ${res.status} ${source}`);
    continue;
  }
  await writeFile(new URL(`${slug}.png`, OUT_DIR), bytes);
}

const stale = (await readdir(OUT_DIR)).filter(
  (file) => !(file.replace(/\.png$/, "") in CREST_SOURCES),
);
if (stale.length) console.warn(`Not in CREST_SOURCES: ${stale.join(", ")}`);

if (failures.length) {
  console.error(`Failed:\n${failures.join("\n")}`);
  process.exit(1);
}
console.log(`Wrote ${Object.keys(CREST_SOURCES).length} crests to public/crests`);
