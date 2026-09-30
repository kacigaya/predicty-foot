import { GoogleGenerativeAI } from "@google/generative-ai";
import type { OddsEvent } from "./odds";
import { averageH2HOdds, impliedProbabilities } from "./odds";

export const GEMINI_MODEL = "gemini-3.1-flash-lite";

export type AIPrediction = {
  winner: "home" | "draw" | "away";
  winnerTeam: string;
  score: { home: number; away: number };
  confidence: number;
  aiProbabilities: { home: number; draw: number; away: number };
  reasoning: string;
  keyFactors: string[];
  suggestedBet: {
    market: string;
    pick: string;
    rationale: string;
  };
  generatedAt: string;
};

export class GeminiError extends Error {}

function assertKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new GeminiError(
      "Missing GEMINI_API_KEY. Add it to .env.local to generate predictions."
    );
  }
  return key;
}

function summarizeBookmakers(event: OddsEvent): string {
  const rows: string[] = [];
  for (const bm of event.bookmakers.slice(0, 8)) {
    const h2h = bm.markets.find((m) => m.key === "h2h");
    if (!h2h) continue;
    const parts = h2h.outcomes.map((o) => `${o.name}: ${o.price.toFixed(2)}`);
    rows.push(`- ${bm.title}: ${parts.join(" | ")}`);
  }
  return rows.join("\n") || "No bookmaker data available.";
}

export async function generatePrediction(event: OddsEvent): Promise<AIPrediction> {
  const apiKey = assertKey();
  const client = new GoogleGenerativeAI(apiKey);

  const avg = averageH2HOdds(event);
  const implied = impliedProbabilities(avg);
  const kickoff = new Date(event.commence_time);

  const prompt = `You are a world-class football (soccer) analyst AI. Analyze the following fixture and produce a data-driven prediction.

MATCH
- Competition: ${event.sport_title}
- Home team: ${event.home_team}
- Away team: ${event.away_team}
- Kick-off (UTC): ${kickoff.toISOString()}
- Event ID: ${event.id}

MARKET CONSENSUS (decimal, averaged across ${avg.bookmakerCount} bookmakers)
- Home win: ${avg.home?.toFixed(2) ?? "n/a"} (implied ${(implied.home * 100).toFixed(1)}%)
- Draw:     ${avg.draw?.toFixed(2) ?? "n/a"} (implied ${(implied.draw * 100).toFixed(1)}%)
- Away win: ${avg.away?.toFixed(2) ?? "n/a"} (implied ${(implied.away * 100).toFixed(1)}%)

BOOKMAKER DETAIL
${summarizeBookmakers(event)}

INSTRUCTIONS
1. Weigh recent form, head-to-head history, home advantage, injuries, tactical matchups, and motivation.
2. Compare your own probabilities to the market-implied ones and flag any genuine edge.
3. Propose the most likely scoreline (realistic integers, not blowouts unless warranted).
4. Recommend ONE concrete bet that offers value (e.g. "Home -0.5 AH", "BTTS Yes", "Over 2.5", or a straight 1X2 pick).
5. Confidence is your probability (0-100) that your predicted outcome is correct.
6. Reasoning must be 3-5 sentences, written for an informed bettor. No filler.

Return ONLY JSON matching this schema:
{
  "winner": "home" | "draw" | "away",
  "winnerTeam": string,
  "score": { "home": number, "away": number },
  "confidence": number,
  "aiProbabilities": { "home": number, "draw": number, "away": number },
  "reasoning": string,
  "keyFactors": string[],
  "suggestedBet": { "market": string, "pick": string, "rationale": string }
}
aiProbabilities must sum to 1.0 (±0.02).`;

  const model = client.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  });

  let text: string;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch (err) {
    throw new GeminiError(
      err instanceof Error ? err.message : "Gemini request failed"
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiError("Gemini returned non-JSON output. Try again.");
  }

  return normalizePrediction(parsed, event);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function str(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

const FALLBACK_PROBABILITIES = { home: 0.4, draw: 0.3, away: 0.3 };

// Normalized to sum to 1, which also accepts percentages.
function probabilities(raw: Record<string, unknown>): AIPrediction["aiProbabilities"] {
  const home = finite(raw.home);
  const draw = finite(raw.draw);
  const away = finite(raw.away);
  if (home === undefined || draw === undefined || away === undefined) return FALLBACK_PROBABILITIES;
  const sum = home + draw + away;
  if (home < 0 || draw < 0 || away < 0 || sum <= 0) return FALLBACK_PROBABILITIES;
  return { home: home / sum, draw: draw / sum, away: away / sum };
}

// The model's JSON is untrusted: any field can be missing or of the wrong type,
// and rendering a non-string (e.g. an object in keyFactors) would crash React.
export function normalizePrediction(raw: unknown, event: OddsEvent): AIPrediction {
  const r = isRecord(raw) ? raw : {};
  const rawScore = isRecord(r.score) ? r.score : {};
  const rawProbs = isRecord(r.aiProbabilities) ? r.aiProbabilities : {};
  const rawBet = isRecord(r.suggestedBet) ? r.suggestedBet : {};

  const aiProbabilities = probabilities(rawProbs);

  // An unknown winner falls back to the outcome the model rated most likely.
  const winner: AIPrediction["winner"] =
    r.winner === "home" || r.winner === "draw" || r.winner === "away"
      ? r.winner
      : aiProbabilities.home >= aiProbabilities.draw && aiProbabilities.home >= aiProbabilities.away
        ? "home"
        : aiProbabilities.away >= aiProbabilities.draw
          ? "away"
          : "draw";
  const winnerTeam =
    str(r.winnerTeam) ??
    (winner === "home" ? event.home_team : winner === "away" ? event.away_team : "Draw");

  const goals = (value: unknown) => Math.max(0, Math.round(finite(value) ?? 1));

  return {
    winner,
    winnerTeam,
    score: { home: goals(rawScore.home), away: goals(rawScore.away) },
    confidence: Math.max(0, Math.min(100, Math.round(finite(r.confidence) ?? 50))),
    aiProbabilities,
    reasoning: str(r.reasoning) ?? "Analysis unavailable.",
    keyFactors: Array.isArray(r.keyFactors)
      ? r.keyFactors.flatMap((f) => str(f) ?? []).slice(0, 6)
      : [],
    suggestedBet: {
      market: str(rawBet.market) ?? "Match Result",
      pick: str(rawBet.pick) ?? winnerTeam,
      rationale: str(rawBet.rationale) ?? "",
    },
    generatedAt: new Date().toISOString(),
  };
}
