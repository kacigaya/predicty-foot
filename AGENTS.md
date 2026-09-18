# predicty-foot

Football odds and Gemini predictions. Next.js 16 App Router, React 19, Tailwind 4,
Radix dialog and tabs, Bun. Server actions call The Odds API and Gemini; both keys
are runtime-only.

## Commands

```sh
bun install
bun dev             # next dev on :3000
bun run lint
bunx tsc --noEmit
bun run build       # standalone output in .next/standalone
```

Bun 1.3, Node 22. No test suite; the build runs the type check.

## Deployment

- Public URL: `https://pfoot.gayakaci.duckdns.org`. `app/site.ts` holds it as `SITE_URL`.
- Dokploy application `predicty-foot` (project `predicty-foot`), source type git,
  build type dockerfile, branch `main`, auto-deploy on push through the GitHub webhook
  that `dokploy-sync-hooks` registers. Runbook: `~/DOKPLOY.md`.
- Caddy owns TLS for the hostname and proxies to Dokploy's Traefik on `127.0.0.1:8080`.
- Env in Dokploy: `ODDS_API_KEY`, `GEMINI_API_KEY`. Nothing is needed at build time;
  the root layout awaits `connection()`, so every route renders on request.
- `next.config.ts` sets `output: "standalone"`; the Dockerfile runner stage depends on it.

## UI

- Semantic color tokens live in `@theme inline` in `app/globals.css` (`background`,
  `foreground`, `surface`, `elevated`, `line`, `muted`, `dim`, `accent`, `destructive`).
  Use the token classes, not hex literals.
- Dark only. One accent (lime); vermilion is for errors and negative deltas.
- Fonts: Instrument Serif for headings and the wordmark, Geist for text, JetBrains Mono
  for numbers and labels. Loaded through `next/font/google`, so builds need network.
- `PredictionResult` is shared by the fixture dialog and the match page.
- `PredictionModal` takes its trigger as `children` through `DialogTrigger`; that is what
  lets Radix return focus to the button on close.
- Probability bars are native `<meter>` elements styled in `globals.css`, so no inline
  `style` attributes are needed.

## Constraints worth keeping

- `proxy.ts` sets a per-request CSP. `script-src` uses a nonce with `strict-dynamic`;
  `style-src` deliberately has no nonce (it would disable `unsafe-inline`, and
  `next/image` and Radix set `style` attributes).
- `getOddsAction`, `generatePredictionAction` and `/api/odds` validate the league key
  against `LEAGUES` before calling the provider. Keep that when adding leagues.
- Provider error text is logged, never returned to the browser.
- `formatOdds` returns an en dash for missing values; prose never uses an em dash.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Conventions

- Follow the current Next.js docs in `node_modules/next/dist/docs/`; APIs move between
  releases and deprecation notices apply.
- PascalCase for components, camelCase for variables and functions.

## Docs

- [Next.js](https://nextjs.org/docs/llms-full.txt)
- [The Odds API](https://the-odds-api.com/liveapi/guides/v4/)
- [Google AI](https://ai.google.dev/gemini-api/docs?hl=fr#javascript)
