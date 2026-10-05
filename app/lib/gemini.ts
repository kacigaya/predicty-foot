import { GoogleGenAI, ThinkingLevel, Type, type Schema } from "@google/genai";
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

// Overall bound for one prediction, retries included. The SDK defaults to five
// attempts with up to 60 s backoff, far longer than anyone waits on a button.
const REQUEST_TIMEOUT_MS = 25_000;

// Enforced by the API, so the reply is JSON of this shape. Field values are
// still checked in normalizePrediction.
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    winner: { type: Type.STRING, enum: ["home", "draw", "away"] },
    winnerTeam: { type: Type.STRING },
    score: {
      type: Type.OBJECT,
      properties: { home: { type: Type.INTEGER }, away: { type: Type.INTEGER } },
      required: ["home", "away"],
    },
    confidence: { type: Type.NUMBER },
    aiProbabilities: {
      type: Type.OBJECT,
      properties: {
        home: { type: Type.NUMBER },
        draw: { type: Type.NUMBER },
        away: { type: Type.NUMBER },
      },
      required: ["home", "draw", "away"],
    },
    reasoning: { type: Type.STRING },
    keyFactors: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedBet: {
      type: Type.OBJECT,
      properties: {
        market: { type: Type.STRING },
        pick: { type: Type.STRING },
        rationale: { type: Type.STRING },
      },
      required: ["market", "pick", "rationale"],
    },
  },
  required: [
    "winner",
    "winnerTeam",
    "score",
    "confidence",
    "aiProbabilities",
    "reasoning",
    "keyFactors",
    "suggestedBet",
  ],
};

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
  const client = new GoogleGenAI({
    apiKey: assertKey(),
    httpOptions: { retryOptions: { attempts: 2 } },
  });

  const avg = averageH2HOdds(event);
  const implied = impliedProbabilities(avg);
  const kickoff = new Date(event.commence_time);

  // The model gets no news, lineups or results, only the odds below. Asking it
  // to weigh form or injuries made it invent them, so the prompt forbids that.
  const prompt = `You are a football (soccer) betting analyst. Read the bookmaker market for the fixture below and give a probabilistic reading of it.

MATCH
- Competition: ${event.sport_title}
- Home team: ${event.home_team}
- Away team: ${event.away_team}
- Kick-off (UTC): ${kickoff.toISOString()}

MARKET CONSENSUS (decimal, averaged across ${avg.bookmakerCount} bookmakers)
- Home win: ${avg.home?.toFixed(2) ?? "n/a"} (implied ${(implied.home * 100).toFixed(1)}%)
- Draw:     ${avg.draw?.toFixed(2) ?? "n/a"} (implied ${(implied.draw * 100).toFixed(1)}%)
- Away win: ${avg.away?.toFixed(2) ?? "n/a"} (implied ${(implied.away * 100).toFixed(1)}%)

BOOKMAKER DETAIL
${summarizeBookmakers(event)}

WHAT YOU KNOW
You have no live data: no recent results, injuries, suspensions, lineups or news. Do not state or imply any. You may use long-standing, general traits of the teams (stature, typical home advantage, playing style) and must present them as general, not current.

INSTRUCTIONS
1. Start from the market-implied probabilities and adjust them only where the market data itself (price spread between bookmakers, margin, draw pricing) or general knowledge justifies it.
2. Compare your probabilities with the market-implied ones and say whether there is any edge. "No clear edge" is a valid answer.
3. Give the most likely scoreline as realistic integers.
4. Recommend ONE bet (e.g. "Home -0.5 AH", "BTTS Yes", "Over 2.5", or a straight 1X2 pick), or the least-bad option if nothing offers value.
5. Confidence is your probability (0-100) that the predicted outcome happens.
6. Reasoning is 3-5 sentences for an informed bettor, grounded in the numbers above.
7. keyFactors are 3-5 short phrases drawn from the same evidence.

aiProbabilities must sum to 1.0 (±0.02).`;

  let text: string | undefined;
  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
        // Thinking tokens count against maxOutputTokens; at the old 1024 cap
        // the JSON could be cut off. Low thinking plus headroom avoids that.
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        maxOutputTokens: 4096,
        abortSignal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      },
    });
    text = response.text;
  } catch (err) {
    throw new GeminiError(err instanceof Error ? err.message : "Gemini request failed");
  }
  if (!text) {
    throw new GeminiError("Gemini returned an empty response.");
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
