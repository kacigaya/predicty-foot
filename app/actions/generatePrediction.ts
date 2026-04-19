"use server";

import { findEventAcrossLeagues, fetchEventById } from "@/app/lib/odds";
import { generatePrediction, GeminiError, type AIPrediction } from "@/app/lib/gemini";
import { LEAGUES } from "@/app/lib/leagues";

export type PredictionResult =
  | { ok: true; prediction: AIPrediction }
  | { ok: false; error: string };

export async function generatePredictionAction(
  eventId: string,
  sportKey?: string
): Promise<PredictionResult> {
  try {
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
      return { ok: false, error: err.message };
    }
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to generate prediction.",
    };
  }
}
