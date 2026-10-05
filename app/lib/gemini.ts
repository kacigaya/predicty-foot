import { GoogleGenAI, ThinkingLevel, Type, type Schema } from "@google/genai";
import type { OddsEvent, ScorerOdds } from "./odds";
import {
  averageH2HOdds,
  CARDS_LINE,
  CORNERS_LINE,
  GOALS_LINE,
  impliedProbabilities,
  marketProbability,
  scorerOdds,
} from "./odds";

export const GEMINI_MODEL = "gemini-3.1-flash-lite";

type Score = { home: number; away: number };
type Probabilities = { home: number; draw: number; away: number };

// Market is the margin-free bookmaker probability, null when not priced.
export type ProbPair = { ai: number; market: number | null };

// Only players from the bookmakers' anytime-scorer market; odds are theirs.
export type Scorer = { player: string; side: "home" | "away"; ai: number; odds: number };

export type AIPrediction = {
  winner: "home" | "draw" | "away";
  winnerTeam: string;
  score: Score;
  confidence: number;
  aiProbabilities: Probabilities;
  halfTime: { score: Score; probabilities: Probabilities };
  goals: { over25: ProbPair; btts: ProbPair };
  scorers: Scorer[];
  corners: { expected: number; over: ProbPair };
  cards: { expected: number; over: ProbPair };
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
    halfTimeScore: {
      type: Type.OBJECT,
      properties: { home: { type: Type.INTEGER }, away: { type: Type.INTEGER } },
      required: ["home", "away"],
    },
    halfTimeProbabilities: {
      type: Type.OBJECT,
      properties: {
        home: { type: Type.NUMBER },
        draw: { type: Type.NUMBER },
        away: { type: Type.NUMBER },
      },
      required: ["home", "draw", "away"],
    },
    over25Probability: { type: Type.NUMBER },
    bttsProbability: { type: Type.NUMBER },
    scorers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          player: { type: Type.STRING },
          side: { type: Type.STRING, enum: ["home", "away"] },
          probability: { type: Type.NUMBER },
        },
        required: ["player", "side", "probability"],
      },
    },
    expectedCorners: { type: Type.NUMBER },
    cornersOverProbability: { type: Type.NUMBER },
    expectedCards: { type: Type.NUMBER },
    cardsOverProbability: { type: Type.NUMBER },
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
    "halfTimeScore",
    "halfTimeProbabilities",
    "over25Probability",
    "bttsProbability",
    "scorers",
    "expectedCorners",
    "cornersOverProbability",
    "expectedCards",
    "cardsOverProbability",
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

function pct(value: number | null): string {
  return value === null ? "n/a" : `implied ${(value * 100).toFixed(1)}%`;
}

// Margin-free market reads, the inputs normalizePrediction compares against.
function marketReads(markets: OddsEvent | null) {
  return {
    over25: marketProbability(markets, "totals", "Over", "Under", GOALS_LINE),
    btts: marketProbability(markets, "btts", "Yes", "No"),
    corners: marketProbability(markets, "alternate_totals_corners", "Over", "Under", CORNERS_LINE),
    cards: marketProbability(markets, "alternate_totals_cards", "Over", "Under", CARDS_LINE),
  };
}

function summarizeScorers(scorers: ScorerOdds[]): string {
  if (scorers.length === 0) return "Not published for this fixture.";
  return scorers
    .slice(0, 20)
    .map((s) => `- ${s.player}: ${s.price.toFixed(2)}`)
    .join("\n");
}

export async function generatePrediction(
  event: OddsEvent,
  markets: OddsEvent | null = null,
): Promise<AIPrediction> {
  const client = new GoogleGenAI({
    apiKey: assertKey(),
    httpOptions: { retryOptions: { attempts: 2 } },
  });

  const avg = averageH2HOdds(event);
  const implied = impliedProbabilities(avg);
  const kickoff = new Date(event.commence_time);
  const reads = marketReads(markets);

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

EXTRA MARKETS (US bookmakers, margin removed)
- Over ${GOALS_LINE} goals: ${pct(reads.over25)}
- Both teams to score: ${pct(reads.btts)}
- Over ${CORNERS_LINE} corners: ${pct(reads.corners)}
- Over ${CARDS_LINE} cards: ${pct(reads.cards)}

ANYTIME GOALSCORER ODDS (decimal, averaged, shortest first)
${summarizeScorers(scorerOdds(markets))}

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
8. Half-time: the most likely half-time score (never above your full-time score) and half-time home/draw/away probabilities.
9. over25Probability (over ${GOALS_LINE} goals) and bttsProbability (both teams score) are 0-1, consistent with your scoreline and with the market where it is priced.
10. scorers: up to 3 players per side, chosen ONLY from the goalscorer list above and spelled exactly as listed. side is the team the player plays for; leave out anyone whose team you are unsure of. probability is your 0-1 chance the player scores. Return [] when the list is not published.
11. expectedCorners and expectedCards are match totals; cornersOverProbability is the 0-1 chance of over ${CORNERS_LINE} corners, cardsOverProbability of over ${CARDS_LINE} cards. These are low-confidence: follow the market where it is priced, otherwise general team traits.

aiProbabilities and halfTimeProbabilities must each sum to 1.0 (±0.02).`;

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

  return normalizePrediction(parsed, event, markets);
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
const FALLBACK_HALF_TIME = { home: 0.3, draw: 0.45, away: 0.25 };

// Normalized to sum to 1, which also accepts percentages.
function probabilities(raw: unknown, fallback: Probabilities): Probabilities {
  const r = isRecord(raw) ? raw : {};
  const home = finite(r.home);
  const draw = finite(r.draw);
  const away = finite(r.away);
  if (home === undefined || draw === undefined || away === undefined) return fallback;
  const sum = home + draw + away;
  if (home < 0 || draw < 0 || away < 0 || sum <= 0) return fallback;
  return { home: home / sum, draw: draw / sum, away: away / sum };
}

// One probability, 0-1 or a percentage, clamped.
function probability(value: unknown, fallback: number): number {
  const n = finite(value);
  if (n === undefined || n < 0) return fallback;
  return Math.min(1, n > 1 ? n / 100 : n);
}

function pair(value: unknown, market: number | null): ProbPair {
  return { ai: probability(value, market ?? 0.5), market };
}

function total(value: unknown, max: number, fallback: number): number {
  const n = finite(value);
  if (n === undefined || n < 0) return fallback;
  return Math.round(Math.min(max, n) * 10) / 10;
}

const MAX_SCORERS_PER_SIDE = 3;

// Names the books do not price are dropped, which also rejects invented or
// stale players. Odds always come from the market, never from the model.
function scorers(raw: unknown, markets: OddsEvent | null): Scorer[] {
  if (!Array.isArray(raw)) return [];
  const known = new Map(scorerOdds(markets).map((s) => [s.player.toLowerCase(), s]));
  const seen = new Set<string>();
  const perSide = { home: 0, away: 0 };
  return raw.flatMap((item): Scorer[] => {
    if (!isRecord(item)) return [];
    const match = known.get(str(item.player)?.toLowerCase() ?? "");
    const side = item.side === "home" || item.side === "away" ? item.side : undefined;
    if (!match || !side || seen.has(match.player) || perSide[side] >= MAX_SCORERS_PER_SIDE) return [];
    seen.add(match.player);
    perSide[side] += 1;
    return [{ player: match.player, side, ai: probability(item.probability, 1 / match.price), odds: match.price }];
  });
}

// The model's JSON is untrusted: any field can be missing or of the wrong type,
// and rendering a non-string (e.g. an object in keyFactors) would crash React.
export function normalizePrediction(
  raw: unknown,
  event: OddsEvent,
  markets: OddsEvent | null = null,
): AIPrediction {
  const r = isRecord(raw) ? raw : {};
  const rawScore = isRecord(r.score) ? r.score : {};
  const rawHalfTime = isRecord(r.halfTimeScore) ? r.halfTimeScore : {};
  const rawBet = isRecord(r.suggestedBet) ? r.suggestedBet : {};

  const aiProbabilities = probabilities(r.aiProbabilities, FALLBACK_PROBABILITIES);
  const reads = marketReads(markets);

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

  const goals = (value: unknown, fallback: number) => Math.max(0, Math.round(finite(value) ?? fallback));
  const score = { home: goals(rawScore.home, 1), away: goals(rawScore.away, 1) };

  return {
    winner,
    winnerTeam,
    score,
    confidence: Math.max(0, Math.min(100, Math.round(finite(r.confidence) ?? 50))),
    aiProbabilities,
    halfTime: {
      // A team cannot have scored more by half-time than at full time.
      score: {
        home: Math.min(score.home, goals(rawHalfTime.home, 0)),
        away: Math.min(score.away, goals(rawHalfTime.away, 0)),
      },
      probabilities: probabilities(r.halfTimeProbabilities, FALLBACK_HALF_TIME),
    },
    goals: {
      over25: pair(r.over25Probability, reads.over25),
      btts: pair(r.bttsProbability, reads.btts),
    },
    scorers: scorers(r.scorers, markets),
    corners: { expected: total(r.expectedCorners, 25, 10), over: pair(r.cornersOverProbability, reads.corners) },
    cards: { expected: total(r.expectedCards, 12, 4), over: pair(r.cardsOverProbability, reads.cards) },
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
