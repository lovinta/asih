// Output guard: code rules first, then (LIVE only) a second muse-spark-1.3
// check returning {pass}. A fail anywhere means the caller shows the fixed
// safe reply instead of the model text. Mock mode runs rules only.

export const FIXED_SAFE_REPLY =
  "I can't help with that. If you need help right now, use the Get help button. You can also talk to someone you trust.";

export interface GuardResult {
  pass: boolean;
  reasons: string[];
}

// Never state a verdict about the ad/product and never give medical advice.
// Patterns stay narrow so the fixed scam wording itself always passes.
const BLOCKED: { pattern: RegExp; reason: string }[] = [
  { pattern: /\bthis is safe\b/i, reason: "scam-verdict" },
  { pattern: /\bthis is a scam\b/i, reason: "scam-verdict" },
  { pattern: /\bes una estafa\b/i, reason: "scam-verdict" },
  { pattern: /\bes seguro\b/i, reason: "scam-verdict" },
  { pattern: /\bthis product works\b/i, reason: "efficacy-claim" },
  { pattern: /\beste producto funciona\b/i, reason: "efficacy-claim" },
  { pattern: /\bcures?\b/i, reason: "cure-claim" },
  { pattern: /\bcura\b/i, reason: "cure-claim" },
  { pattern: /\bmiracle cure\b/i, reason: "cure-claim" },
  { pattern: /\byou have (diabetes|cancer|arthritis|hypertension|asthma|covid)\b/i, reason: "diagnosis" },
  { pattern: /\busted tiene\b/i, reason: "diagnosis" },
  { pattern: /\bdiagnos(is|ed|e you)\b/i, reason: "diagnosis" },
  { pattern: /\btake \d+\b/i, reason: "dose" },
  { pattern: /\btome \d+\b/i, reason: "dose" },
  { pattern: /\b\d+\s?(mg|mcg|ml)\b/i, reason: "dose" },
  { pattern: /\bprescrib\w* (you|yourself)\b/i, reason: "treatment" },
  { pattern: /\byou should take\b/i, reason: "treatment" },
  { pattern: /\bdeber[ií]a tomar\b/i, reason: "treatment" },
];

export function ruleGuard(text: string): GuardResult {
  const reasons = BLOCKED.filter((b) => b.pattern.test(text)).map(
    (b) => b.reason,
  );
  return { pass: reasons.length === 0, reasons: [...new Set(reasons)] };
}

export interface OutputGuardResult extends GuardResult {
  // True only when the live second check actually ran.
  liveChecked: boolean;
}

export async function outputGuard(
  text: string,
  opts?: { liveCheck?: (text: string) => Promise<{ pass: boolean }> },
): Promise<OutputGuardResult> {
  const rules = ruleGuard(text);
  if (!rules.pass) return { ...rules, liveChecked: false };
  if (!opts?.liveCheck) return { pass: true, reasons: [], liveChecked: false };
  const live = await opts.liveCheck(text);
  if (!live.pass) {
    return { pass: false, reasons: ["live-check"], liveChecked: true };
  }
  return { pass: true, reasons: [], liveChecked: true };
}
