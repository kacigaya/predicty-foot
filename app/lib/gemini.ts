import { GoogleGenerativeAI } from "@google/generative-ai";
import type { OddsEvent } from "./odds";
import { averageH2HOdds, impliedProbabilities } from "./odds";

export const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";

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
    rows.push(`- ${bm.title} — ${parts.join(" | ")}`);
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

  let parsed: Partial<AIPrediction>;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiError("Gemini returned non-JSON output. Try again.");
  }

  return normalize(parsed, event);
}

function normalize(raw: Partial<AIPrediction>, event: OddsEvent): AIPrediction {
  const winner = (raw.winner ?? "home") as AIPrediction["winner"];
  const winnerTeam =
    raw.winnerTeam ??
    (winner === "home" ? event.home_team : winner === "away" ? event.away_team : "Draw");

  const score = {
    home: Math.max(0, Math.round(raw.score?.home ?? 1)),
    away: Math.max(0, Math.round(raw.score?.away ?? 1)),
  };

  const probs = raw.aiProbabilities ?? { home: 0.4, draw: 0.3, away: 0.3 };
  const probSum = probs.home + probs.draw + probs.away || 1;
  const aiProbabilities = {
    home: probs.home / probSum,
    draw: probs.draw / probSum,
    away: probs.away / probSum,
  };

  return {
    winner,
    winnerTeam,
    score,
    confidence: Math.max(0, Math.min(100, Math.round(raw.confidence ?? 50))),
    aiProbabilities,
    reasoning: raw.reasoning ?? "Analysis unavailable.",
    keyFactors: Array.isArray(raw.keyFactors) ? raw.keyFactors.slice(0, 6) : [],
    suggestedBet: {
      market: raw.suggestedBet?.market ?? "Match Result",
      pick: raw.suggestedBet?.pick ?? winnerTeam,
      rationale: raw.suggestedBet?.rationale ?? "",
    },
    generatedAt: new Date().toISOString(),
  };
}
