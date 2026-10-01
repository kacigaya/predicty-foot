# predicty-foot

Football odds and Gemini predictions. Next.js 16 App Router, React 19, Tailwind 4,
Coss UI on Base UI, Bun. Server actions call The Odds API and Gemini; both keys
are runtime-only.

## Commands

```sh
bun install
bun dev             # next dev on :3000
bun run lint
bunx tsc --noEmit
bunx tsc --noEmit -p tsconfig.test.json
bun test            # *.test.ts next to the code, Bun's runner
bun run build       # standalone output in .next/standalone
```

Bun 1.4.0 in the Docker image and CI (1.3.14 segfaults in `next build` there), Node 22.
`.github/workflows/ci.yml` runs all of the above on PRs and pushes to `main`.
Tests are excluded from `tsconfig.json` so Bun's globals never type-check in app code,
which runs on Node; `tsconfig.test.json` checks them.

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

- Uses Gaya's Coss UI design system matching muzik, pdfcmprs, portfolio, webskrap/web,
  ghostpwn/web, and noskrap/web. Primitives are stock Coss components on `@base-ui/react`
  in `components/ui` (`bunx shadcn@latest add @coss/<name>`); `cn` lives in `lib/utils.ts`.
  Compose with `render={<Link />}`, never `asChild`.
- Theme follows the OS until toggled (button or `d`); the choice is stored under
  `THEME_STORAGE_KEY` from `app/site.ts`. An inline script in the root layout, carrying
  the CSP nonce, applies it before first paint.
- Semantic tokens live in `@theme inline` in `app/globals.css` (`background`, `foreground`,
  `card`, `popover`, `primary`, `secondary`, `muted`, `muted-foreground`, `accent`,
  `border`, `input`, `ring`, `destructive`, `warning`, `success`).
- Fonts: `Inter` for headings and body (`font-sans`), `Geist Mono` for numbers, labels,
  and odds (`font-mono`). Loaded through `next/font/google`.
- Branding is the typographic wordmark from `Navbar`: "Predicty" in Inter Bold with
  "Foot" italic in `--brand` lime, tucked `-ml-[0.04em]`, same treatment as pdfcmprs.
  No image mark. `public/icon.svg` is the wordmark as SVG (README, light/dark aware).
  `bun run brand` regenerates `app/favicon.ico`, `app/apple-icon.png` ("PF" monogram)
  and `public/og.png` from `scripts/brand.ts` (satori bundled with Next, Inter fetched
  from Google Fonts); never hand-edit the rasters.
- Floating island navigation with `ThemeToggle`, `Badge`, and clean action buttons.
- Cards use the signature Coss inset shadow highlights:
  `dark:before:shadow-[0_-1px_--theme(--color-white/6%)]`.
- `PredictionResult` is shared by the fixture dialog and the match page.
- `PredictionModal` takes its trigger as `children` through `DialogTrigger`; that is what
  lets Base UI return focus to the button on close.
- Probability bars are native `<meter>` elements styled in `globals.css`, so no inline
  `style` attributes are needed.
- Privacy and cookie policies live at `/privacy` and `/cookies` under `app/(legal)`,
  linked from the footer. Privacy contact: `contact@gaya.anonaddy.com`. Keep their
  storage and provider descriptions current when data handling changes.

## Constraints worth keeping

- `proxy.ts` sets a per-request CSP. `script-src` uses a nonce with `strict-dynamic`;
  `style-src` deliberately has no nonce (it would disable `unsafe-inline`, and
  `next/image` and Base UI set `style` attributes).
- `getOddsAction`, `generatePredictionAction` and `/api/odds` validate the league key
  with `isLeagueKey` (`app/lib/leagues.ts`) before calling the provider. Keep that when
  adding leagues or entry points.
- The CSP allows only `'self'` for images, fonts and `connect-src`. The browser never
  calls a provider directly, and crests go through `/_next/image`.
- `normalizePrediction` in `app/lib/gemini.ts` type-checks every field of the Gemini
  JSON; the model output is untrusted and non-strings crash React when rendered.
- Provider error text is logged, never returned to the browser.
- Crests are PNGs in `public/crests`, mapped by `app/lib/crests.ts` (`CREST_SLUGS`
  normalized name to slug, `CREST_SOURCES` slug to TheSportsDB badge). `crestFor` resolves
  them on the server (`withCrests` for whole events); `TeamCrest` takes the result as
  `src` and shows initials when it is null. Nothing looks crests up at runtime.
  When a new team appears in a feed, add it, run `bun run crests` and commit the PNGs.
  TheSportsDB name search often returns the wrong club (women's, youth, B teams,
  namesakes), so check league, country and gender for each source; the league roster
  (`search_all_teams.php?l=`) is the fallback. `crests.test.ts` fails if a slug has no
  source or PNG.
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
