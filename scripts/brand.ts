// Renders the raster brand assets from the navbar wordmark: "Predicty" in the
// heading type (Inter Bold, tight tracking) with "Foot" italic in brand lime,
// tucked into the preceding letter. Uses the satori/resvg renderer bundled
// with Next; no extra dependency. `public/icon.svg` is the same wordmark as
// hand-written SVG and is not touched here.
//
//   bun run brand
//
// Writes app/favicon.ico (256px PNG-in-ICO) and app/apple-icon.png (180px),
// both the "PF" monogram, and public/og.png (1200x630 wordmark banner).
import { writeFile } from "node:fs/promises";
import { createElement as h, type CSSProperties, type ReactElement } from "react";
import { ImageResponse } from "next/dist/compiled/@vercel/og/index.node.js";

const LIME = "#d8ff3e";
const INK = "#0d0d0e";
const FOREGROUND = "#f5f5f5";
const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,700;1,700&text=PredictyFoot";

type Font = { name: string; data: ArrayBuffer; weight: 700; style: "normal" | "italic" };

// Google Fonts serves WOFF (satori cannot read woff2) to a pre-woff2 user agent.
async function loadInterBold(): Promise<Font[]> {
  const css = await fetch(FONT_CSS, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:12.0) Gecko/20100101 Firefox/12.0" },
  }).then((r) => r.text());
  const faces = [...css.matchAll(/font-style: (normal|italic);[\s\S]*?src: url\((https:[^)]+)\)/g)];
  if (faces.length !== 2) throw new Error("expected normal and italic Inter faces in Google Fonts CSS");
  return Promise.all(
    faces.map(async ([, style, url]) => ({
      name: "Inter",
      data: await fetch(url).then((r) => r.arrayBuffer()),
      weight: 700 as const,
      style: style as Font["style"],
    })),
  );
}

const type = (size: number): CSSProperties => ({
  fontFamily: "Inter",
  fontWeight: 700,
  fontSize: size,
  letterSpacing: `${-size * 0.025}px`, // tracking-tight
  lineHeight: 1,
});

const accent = (size: number, text: string): ReactElement =>
  h(
    "span",
    { style: { display: "flex", fontStyle: "italic", color: LIME, marginLeft: -size * 0.04 } },
    text,
  );

function wordmark(size: number): ReactElement {
  return h(
    "div",
    { style: { display: "flex", color: FOREGROUND, ...type(size) } },
    h("span", { style: { display: "flex" } }, "Predicty"),
    accent(size, "Foot"),
  );
}

// Square monogram for icons: initials in the wordmark treatment on ink.
function monogram(size: number): ReactElement {
  const fs = size * 0.6;
  return h(
    "div",
    {
      style: {
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: INK,
        color: FOREGROUND,
        ...type(fs),
      },
    },
    h("span", { style: { display: "flex" } }, "P"),
    accent(fs, "F"),
  );
}

function banner(): ReactElement {
  return h(
    "div",
    {
      style: {
        width: 1200,
        height: 630,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: INK,
      },
    },
    wordmark(150),
  );
}

async function render(node: ReactElement, width: number, height: number, fonts: Font[]) {
  const res = new ImageResponse(node, { width, height, fonts });
  return Buffer.from(await res.arrayBuffer());
}

// Single-entry ICO wrapping a PNG; every current browser reads this form.
function ico(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type
  header.writeUInt16LE(1, 4); // one image
  header.writeUInt8(size === 256 ? 0 : size, 6);
  header.writeUInt8(size === 256 ? 0 : size, 7);
  header.writeUInt8(0, 8); // palette
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // planes
  header.writeUInt16LE(32, 12); // bpp
  header.writeUInt32LE(png.length, 14);
  header.writeUInt32LE(22, 18); // offset
  return Buffer.concat([header, png]);
}

const fonts = await loadInterBold();
await writeFile("app/favicon.ico", ico(await render(monogram(256), 256, 256, fonts), 256));
await writeFile("app/apple-icon.png", await render(monogram(180), 180, 180, fonts));
await writeFile("public/og.png", await render(banner(), 1200, 630, fonts));
console.log("wrote app/favicon.ico, app/apple-icon.png, public/og.png");
