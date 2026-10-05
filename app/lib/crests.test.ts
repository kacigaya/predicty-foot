import { existsSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import { CREST_SLUGS, CREST_SOURCES, crestFor, normalizeTeamName } from "./crests";

describe("crest tables", () => {
  test("every slug has a source and a committed PNG", () => {
    for (const slug of new Set(Object.values(CREST_SLUGS))) {
      expect(CREST_SOURCES[slug], slug).toBeString();
      expect(existsSync(new URL(`../../public/crests/${slug}.png`, import.meta.url)), slug).toBe(true);
    }
  });

  test("CREST_SLUGS keys are already normalized", () => {
    for (const key of Object.keys(CREST_SLUGS)) expect(normalizeTeamName(key)).toBe(key);
  });
});

describe("crestFor", () => {
  test.each([
    ["Arsenal", "arsenal"],
    ["Paris Saint Germain", "paris-saint-germain"],
    ["Atlético Madrid", "atletico-madrid"],
    ["Bayern Munich", "bayern-munich"],
    ["FC Augsburg", "fc-augsburg"],
    ["1. FC Köln", "koln"],
    ["Bodø/Glimt", "bodo-glimt"],
    ["Salzburg", "red-bull-salzburg"],
    ["Bosnia & Herzegovina", "bosnia-and-herzegovina"],
    ["Czech Republic", "czech-republic"],
  ])("%s resolves to %s", (name, slug) => {
    expect(crestFor(name)).toBe(`/crests/${slug}.png`);
  });

  test("unknown teams get no crest", () => {
    expect(crestFor("Nowhere United Reserves")).toBeNull();
  });
});
