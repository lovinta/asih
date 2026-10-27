// Red-flag prescreen (code, runs BEFORE the agent on the person's own words).
// On a match the app opens the Get-help screen instead of running the agent.
// Shared content (ad text, listing text) is the other party's words, so it is
// never screened as the person's own: pass source "shared" for it. Quoted
// spans are stripped too, so quoting someone else's danger words is safe.
// Negations ("I don't have chest pain") do not match.

export type ScreenSource = "person" | "shared";

export interface PrescreenResult {
  flagged: boolean;
  matched?: string;
  lang?: "en" | "es";
}

const EN_PHRASES = [
  "can't breathe",
  "cant breathe",
  "cannot breathe",
  "chest pain",
  "pressure in my chest",
  "want to kill myself",
  "want to die",
  "kill myself",
  "end my life",
  "suicidal",
  "suicide",
  "overdose",
  "heart attack",
  "having a stroke",
];

const ES_PHRASES = [
  "no puedo respirar",
  "me cuesta respirar",
  "dolor de pecho",
  "dolor en el pecho",
  "opresion en el pecho",
  "quiero matarme",
  "quiero morir",
  "quiero suicidarme",
  "quitarme la vida",
  "suicidio",
  "suicida",
  "sobredosis",
  "ataque al corazon",
  "derrame cerebral",
];

const EN_NEGATIONS = new Set([
  "don't",
  "do",
  "doesn't",
  "does",
  "didn't",
  "did",
  "not",
  "no",
  "never",
  "n't",
  "without",
  "deny",
  "denies",
  "denied",
]);

const ES_NEGATIONS = new Set([
  "no",
  "nunca",
  "jamas",
  "tampoco",
  "sin",
  "niego",
  "niega",
  "niego",
]);

// Lowercase + strip accents so "corazón" matches "corazon".
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function stripQuotedSpans(text: string): string {
  return text.replace(/"[^"]*"/g, " ").replace(/'[^']*'/g, " ");
}

function hasNegationBefore(clause: string, phraseIndex: number): boolean {
  const before = clause.slice(0, phraseIndex);
  const words = before.split(/[^a-zñ']+/).filter(Boolean);
  return words.slice(-6).some((w) => EN_NEGATIONS.has(w) || ES_NEGATIONS.has(w));
}

export function redFlagPrescreen(
  text: string,
  source: ScreenSource = "person",
): PrescreenResult {
  if (source === "shared") return { flagged: false };
  const cleaned = normalize(stripQuotedSpans(text));
  const clauses = cleaned.split(/[.!?;\n]+/);
  const check = (phrases: string[], lang: "en" | "es"): PrescreenResult | null => {
    for (const phrase of phrases) {
      for (const clause of clauses) {
        const idx = clause.indexOf(phrase);
        if (idx === -1) continue;
        if (hasNegationBefore(clause, idx)) continue;
        return { flagged: true, matched: phrase, lang };
      }
    }
    return null;
  };
  return (
    check(EN_PHRASES, "en") ?? check(ES_PHRASES, "es") ?? { flagged: false }
  );
}
