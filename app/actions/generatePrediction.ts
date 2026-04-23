"use server";

import { findEventAcrossLeagues, fetchEventById } from "@/app/lib/odds";
import { generatePrediction, GeminiError, type AIPrediction } from "@/app/lib/gemini";
import { LEAGUES } from "@/app/lib/leagues";

const ALLOWED_SPORT_KEYS = new Set(LEAGUES.map((l) => l.key));
const EVENT_ID_PATTERN = /^[a-zA-Z0-9:_-]{1,120}$/;

export type PredictionResult =
  | { ok: true; prediction: AIPrediction }
  | { ok: false; error: string };

export async function generatePredictionAction(
  eventId: string,
  sportKey?: string
): Promise<PredictionResult> {
  try {
    if (!EVENT_ID_PATTERN.test(eventId)) {
      return { ok: false, error: "Invalid event id." };
    }

    if (sportKey && !ALLOWED_SPORT_KEYS.has(sportKey)) {
      return { ok: false, error: "Invalid sport key." };
    }

    const event = sportKey
      ? await fetchEventById(sportKey, eventId)
      : (await findEventAcrossLeagues(LEAGUES.map((l) => l.key), eventId))?.event ?? null;

    if (!event) {
      return { ok: false, error: "Match not found or no longer available." };
    }

    const prediction = await generatePrediction(event);
    return { ok: true, prediction };
  } catch (err) {
    if (err instanceof GeminiError) {
      return { ok: false, error: "Prediction service unavailable." };
    }
    console.error("[generatePredictionAction] Unexpected error:", err);
    return {
      ok: false,
      error: "Failed to generate prediction.",
    };
  }
}
