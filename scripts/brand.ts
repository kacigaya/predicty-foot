// Renders the brand assets from the typeface the navbar wordmark uses
// (Inter Bold, tight tracking), so the logo is the type, not a drawn glyph.
// Uses the satori/resvg renderer bundled with Next; no extra dependency.
//
//   bun run brand
//
// Writes public/icon.png (square mark, also the apple icon), app/favicon.ico
// (256px PNG-in-ICO) and public/og.png (1200x630 mark plus wordmark).
import { writeFile } from "node:fs/promises";
import { createElement as h, type CSSProperties, type ReactElement } from "react";
import { ImageResponse } from "next/dist/compiled/@vercel/og/index.node.js";

const LIME = "#d8ff3e";
const INK = "#0d0d0e";
const FONT_CSS =
  "https://fonts.googleapis.com/css2?family=Inter:wght@700&text=PredictyFoot";

// Google Fonts serves WOFF (satori cannot read woff2) to a pre-woff2 user agent.
async function loadInterBold(): Promise<ArrayBuffer> {
  const css = await fetch(FONT_CSS, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1; rv:12.0) Gecko/20100101 Firefox/12.0" },
  }).then((r) => r.text());
  const url = css.match(/src: url\((https:[^)]+)\)/)?.[1];
  if (!url) throw new Error("Inter Bold url not found in Google Fonts CSS");
  return fetch(url).then((r) => r.arrayBuffer());
}

const type = (size: number): CSSProperties => ({
  fontFamily: "Inter",
  fontWeight: 700,
  fontSize: size,
  letterSpacing: `${-size * 0.025}px`, // tracking-tight
  lineHeight: 1,
});

// Circular mark: ink disc, inset lime ring, bold "P" in the wordmark type.
function mark(size: number): ReactElement {
  return h(
    "div",
    {
      style: {
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "50%",
        backgroundColor: INK,
        boxShadow: `inset 0 0 0 ${size * 0.045}px ${INK}, inset 0 0 0 ${size * 0.055}px ${LIME}`,
        color: LIME,
        ...type(size * 0.62),
      },
    },
    h("span", { style: { display: "flex", marginTop: -size * 0.035 } }, "P"),
  );
}

// Open Graph card: mark plus the two-tone wordmark from the navbar.
function card(): ReactElement {
  return h(
    "div",
    {
      style: {
        width: 1200,
        height: 630,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 56,
        backgroundColor: INK,
        color: "#f5f5f5",
        ...type(132),
      },
    },
    mark(220),
    h(
      "div",
      { style: { display: "flex", gap: 34 } },
      h("span", { style: { display: "flex" } }, "Predicty"),
      h("span", { style: { display: "flex", color: LIME } }, "Foot"),
    ),
  );
}

async function render(node: ReactElement, width: number, height: number, font: ArrayBuffer) {
  const res = new ImageResponse(node, {
    width,
    height,
    fonts: [{ name: "Inter", data: font, weight: 700, style: "normal" }],
  });
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

const font = await loadInterBold();
await writeFile("public/icon.png", await render(mark(1024), 1024, 1024, font));
await writeFile("app/favicon.ico", ico(await render(mark(256), 256, 256, font), 256));
await writeFile("public/og.png", await render(card(), 1200, 630, font));
console.log("wrote public/icon.png, app/favicon.ico, public/og.png");
