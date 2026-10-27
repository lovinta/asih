// Fixed scam/ad wording. Always ends Flow C. The "no cues" suffix is added
// only when no warning signs were found.
export const FIXED_SCAM_WORDING_EN =
  "I can see these warning signs. I can't tell whether this is real or whether the product works. Check with someone you trust before paying or sharing details.";

export const NO_CUES_SUFFIX_EN = "That doesn't mean it's safe.";

export const FIXED_SCAM_WORDING_ES =
  "Puedo ver estas señales de advertencia. No puedo decir si esto es real o si el producto funciona. Consulte con alguien de su confianza antes de pagar o compartir datos."; // TODO: needs check by a fluent speaker.

export const NO_CUES_SUFFIX_ES = "Eso no significa que sea seguro."; // TODO: needs check by a fluent speaker.

export type SafetyLang = "en" | "es";

// The fixed wording always appears; the suffix is appended when no cues.
// Callers must never substitute a verdict like "this is safe".
export function scamMessage(cues: string[], lang: SafetyLang): string {
  const fixed = lang === "es" ? FIXED_SCAM_WORDING_ES : FIXED_SCAM_WORDING_EN;
  if (cues.length > 0) return fixed;
  const suffix = lang === "es" ? NO_CUES_SUFFIX_ES : NO_CUES_SUFFIX_EN;
  return `${fixed} ${suffix}`;
}
