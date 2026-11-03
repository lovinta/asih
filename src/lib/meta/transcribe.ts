// transcribe(wavBuffer, lang): speech to text for a mono 16-bit PCM WAV
// (16/24 kHz) voice note. Live mode POSTs multipart to
// https://api.meta.ai/v1/asr/transcribe with parts `request` (JSON) and
// `audio`. Mock mode returns a fixture transcript: no key, no network.
import { isMockMode, getApiKey } from "./mode";
import { VOICE_MODEL } from "./client";
import { checkSpendGuard, logVoiceCall, recordVoiceSpend } from "./spend";
import {
  EXAMPLE_VOICE_TRANSCRIPT_EN,
  EXAMPLE_VOICE_TRANSCRIPT_ES,
} from "@/fixtures/voiceTranscript";
import type { Lang } from "../agent/types";

export function languageBias(lang: Lang): string[] {
  return lang === "es" ? ["Spanish", "English"] : ["English"];
}

export interface TranscribeResult {
  transcript: string;
  mock: boolean;
}

export async function transcribe(
  wavBuffer: Uint8Array,
  lang: Lang,
): Promise<TranscribeResult> {
  if (isMockMode()) {
    return {
      transcript:
        lang === "es" ? EXAMPLE_VOICE_TRANSCRIPT_ES : EXAMPLE_VOICE_TRANSCRIPT_EN,
      mock: true,
    };
  }
  checkSpendGuard();
  // Rough duration estimate for 16 kHz mono 16-bit PCM (minus WAV header).
  const seconds = Math.max(1, (wavBuffer.byteLength - 44) / 32000);
  const requestPart = JSON.stringify({
    model: VOICE_MODEL,
    mode: "PUSH_TO_TALK",
    audioEncoding: "WAV",
    languageBias: languageBias(lang),
  });
  const form = new FormData();
  form.append(
    "request",
    new Blob([requestPart], { type: "application/json" }),
  );
  form.append(
    "audio",
    new Blob([wavBuffer as unknown as BlobPart], { type: "audio/wav" }),
    "note.wav",
  );
  const res = await fetch("https://api.meta.ai/v1/asr/transcribe", {
    method: "POST",
    headers: { Authorization: `Bearer ${getApiKey()}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Transcribe failed with status ${res.status}.`);
  const data = (await res.json()) as { transcript?: string; text?: string };
  recordVoiceSpend(seconds / 3600);
  logVoiceCall("transcribe", "audio-transcription", VOICE_MODEL, seconds);
  return { transcript: data.transcript ?? data.text ?? "", mock: false };
}
