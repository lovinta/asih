// Output guard: code rules first, then (LIVE only) a second muse-spark-1.3
// check returning {pass}. A fail anywhere means the caller shows the fixed
// safe reply instead of the model text. Mock mode runs rules only.

export const FIXED_SAFE_REPLY =
  "I can't help with that. I'm an AI helper, not a doctor. For help right now, use the Get help button or talk with someone you trust. You decide what to do next.";

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

// Quoted spans are ad text quoted as evidence, not the agent's own words, so
// they are stripped before the rules run. Accepts straight quotes, curly
// quotes, and guillemets. The fixed scam wording itself and quoted cue
// evidence shown as quotes always pass; only the agent's own claims and
// verdicts can fail.
function stripQuotedSpans(text: string): string {
  return text
    .replace(/"[^"]*"/g, " ")
    .replace(/“[^”]*”/g, " ")
    .replace(/«[^»]*»/g, " ")
    .replace(/‘[^’]*’/g, " ")
    .replace(/'[^']*'/g, " ");
}

// A flow C reply is supposed to report the ad's claims as warning signs, for
// example "The ad says it cures..." or "El anuncio dice que cura". Remove only
// the attributed claim span before the rules run, so the agent's own claim in
// the same sentence ("...but this cures arthritis") is still checked.
const REPORTED_CLAIM_PATTERNS: RegExp[] = [
  // English: the ad says/claims/promises [that] it cures / this product works.
  /\b(?:the|this|that|an?)\s+(?:ad|advert|advertisement|listing|post)\b[^.!?;,\n]*?\b(?:says?|claims?|promised?|promises?|states?|suggests?|mentions?|advertises?)\b[^.!?;,\n]*?\b(?:cures?|works?|heals?|treats?)\b/gi,
  // English: claims to cure, promises a cure, promise of a cure.
  /\b(?:claims?|promised?|promises?)\s+(?:to\s+|of\s+)?(?:a\s+|the\s+)?(?:miracle\s+)?cure\b/gi,
  // English: "cure claim(s)".
  /\bcure[-\s]+claims?\b/gi,
  // Spanish: el anuncio dice/afirma/promete ... cura/curar/funciona.
  /\b(?:el|este|ese|un)\s+anuncio\b[^.!?;,\n]*?\b(?:dice|afirma|promete|sostiene|indica|menciona|señala)\b[^.!?;,\n]*?\b(?:cura|curan|curar|curación|funciona)\b/gi,
  // Spanish: promete curar.
  /\bpromete\s+(?:que\s+)?(?:cura|curan|curar)\b/gi,
  // Ad-anchored, comma-free gaps: the claim must be attributed to the ad or seller.
  /\b(?:anuncio|vendedor|publicidad)\b[^.!?;,\n]{0,40}?\b(?:dice|dicen|afirma|afirman|asegura|aseguran|promete|prometen|garantiza|sostiene|anuncia|presume)\b[^.!?;,\n]{0,60}?\b(?:cura|curan|curar|curación)\b/gi,
  /\bseg[uú]n\s+(?:el|este|ese)\s+anuncio,?\s+[^.!?;,\n]{0,60}?\b(?:cura|curan|curar)\b/gi,
  /\b(?:ad|advert|advertisement|seller|listing|it)\b[^.!?;,\n]{0,40}?\b(?:says?|claims?|promises?|guarantees?|states?|advertises?)\b[^.!?;,\n]{0,60}?\bcures?\b/gi,
  // Spanish: afirmaciones/promesas de cura.
  /\b(?:afirmaciones?|promesas?)\s+de\s+(?:cura|curar|curación)\b/gi,
];

function stripReportedClaims(text: string): string {
  return REPORTED_CLAIM_PATTERNS.reduce(
    (remaining, pattern) => remaining.replace(pattern, " "),
    text,
  );
}

export function ruleGuard(text: string): GuardResult {
  const ownWords = stripReportedClaims(stripQuotedSpans(text));
  const reasons = BLOCKED.filter((b) => b.pattern.test(ownWords)).map(
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
