# Predicty Foot

Predicty Foot is a Next.js 16 app that combines live bookmaker odds with AI-generated football predictions. It focuses on Europe’s top leagues and presents averaged head-to-head odds, match insights, and value-driven betting analysis in a clean dark UI.

## Features

- Live odds from The Odds API
- AI-generated match predictions powered by Google Gemini
- League switcher for major European competitions
- Match cards with bookmaker consensus and prediction details
- Match detail page with deeper AI analysis
- Toast notifications and polished loading states

## Tech Stack

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/) 4
- [Radix UI](https://www.radix-ui.com/)
- [Sonner](https://sonner.emilkowal.ski/)
- [date-fns](https://date-fns.org/)
- [Lucide](https://lucide.dev/)
- [Google Generative AI](https://ai.google.dev/)
- [The Odds API](https://the-odds-api.com/)

## Project Structure

- `app/` — App Router pages, server actions, API routes, and app-specific components
- `app/lib/` — Odds, leagues, Gemini, and utility helpers
- `components/` — Shared layout components like the navbar and footer
- `public/` — Static assets

## Getting Started

### Prerequisites

- Node.js 18 or newer
- An Odds API key
- A Google Gemini API key

### Environment Variables

Create a `.env.local` file in the project root:

```env
ODDS_API_KEY=your_odds_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## How It Works

1. The homepage fetches upcoming odds for the default league.
2. Odds are averaged across bookmakers to produce a consensus view.
3. Users can switch leagues to inspect other competitions.
4. A server action sends match data to Gemini for AI prediction generation.
5. Match details are shown in a responsive card and modal-based interface.

## API Notes

### The Odds API

Predicty Foot uses The Odds API to fetch live football odds. Data is cached server-side and revalidated periodically to reduce network usage.

### Google Gemini

AI predictions are generated on the server using match and odds context. If the Gemini key is missing or invalid, the app returns a friendly error state.

## Deployment

The app can be deployed to any platform that supports Next.js, including Vercel.

Before deploying, make sure these environment variables are configured in your hosting provider:

- `ODDS_API_KEY`
- `GEMINI_API_KEY`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [The Odds API Docs](https://the-odds-api.com/liveapi/guides/v4/)
- [Google AI Docs](https://ai.google.dev/gemini-api/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/app/building-your-application/deploying)

## License

This project does not currently declare a license.