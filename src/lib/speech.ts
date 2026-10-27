// Browser speech helper (speechSynthesis). No React: components and the data
// notice gate share these. Every function is a no-op outside a browser.
import type { Lang } from "./agent/types";

// Asih speaks English a little slower than the browser default (persona rule).
// TODO(Vinta): Spanish keeps the default 1.0 until you decide; the person can always change it with the slider.
export const DEFAULT_SPEECH_RATE: Record<Lang, number> = { en: 0.9, es: 1 };

export function speechVoiceLang(lang: Lang): string {
  return lang === "es" ? "es-US" : "en-US";
}

function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const want = speechVoiceLang(lang).toLowerCase();
  const prefix = lang === "es" ? "es" : "en";
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase() === want) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
    null
  );
}

// Speak text aloud in the current UI language. Returns false when speech is
// unavailable (server render, no voices); callers still show the text.
export function readAloud(text: string, lang: Lang, rate = DEFAULT_SPEECH_RATE[lang]): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechVoiceLang(lang);
    utterance.rate = rate;
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeech(): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Speech is best-effort; the text is always shown.
  }
}
