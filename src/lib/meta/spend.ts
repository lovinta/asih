// Spend guard: refuse new LIVE calls once today's estimated spend
// (America/New_York date) plus a reservation for the call in flight would
// exceed the cap. In-memory counter is fine for v1.
// Prices: Spark $1.25/M input, $0.15/M cached input, $4.25/M output;
// Voice $0.18/hour. Usage logs contain model IDs and counts/duration only,
// never user content.

export const SPEND_CAP_USD = 10;
export const RESERVATION_USD = 0.3;

const PRICE_INPUT_PER_M = 1.25;
const PRICE_CACHED_INPUT_PER_M = 0.15;
const PRICE_OUTPUT_PER_M = 4.25;
const PRICE_VOICE_PER_HOUR = 0.18;

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cached_input_tokens?: number;
}

export function estimateCost(usage: Usage): number {
  const cached = usage.cached_input_tokens ?? 0;
  const fresh = Math.max(0, usage.input_tokens - cached);
  return (
    (fresh / 1_000_000) * PRICE_INPUT_PER_M +
    (cached / 1_000_000) * PRICE_CACHED_INPUT_PER_M +
    (usage.output_tokens / 1_000_000) * PRICE_OUTPUT_PER_M
  );
}

export function voiceCostForHours(hours: number): number {
  return Math.max(0, hours) * PRICE_VOICE_PER_HOUR;
}

export function todayKeyNY(now: Date = new Date()): string {
  // en-CA gives YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

const spendByDay = new Map<string, number>();

export function getTodaySpend(now: Date = new Date()): number {
  return spendByDay.get(todayKeyNY(now)) ?? 0;
}

export function recordSpend(usage: Usage, now: Date = new Date()): number {
  const key = todayKeyNY(now);
  const total = (spendByDay.get(key) ?? 0) + estimateCost(usage);
  spendByDay.set(key, total);
  return total;
}

export function recordVoiceSpend(hours: number, now: Date = new Date()): number {
  const key = todayKeyNY(now);
  const total = (spendByDay.get(key) ?? 0) + voiceCostForHours(hours);
  spendByDay.set(key, total);
  return total;
}

export class SpendExceededError extends Error {
  constructor(readonly spent: number) {
    super(
      `Daily spend cap of $${SPEND_CAP_USD} would be exceeded (spent $${spent.toFixed(2)}).`,
    );
    this.name = "SpendExceededError";
  }
}

// Throws SpendExceededError when spent + reservation would exceed the cap.
export function checkSpendGuard(
  reservationUsd: number = RESERVATION_USD,
  now: Date = new Date(),
): void {
  const spent = getTodaySpend(now);
  if (spent + reservationUsd > SPEND_CAP_USD) throw new SpendExceededError(spent);
}

// Log model ID and counts only. Never call with prompts, images, or transcripts.
export function logMetaCall(
  flow: string,
  step: string,
  model: string,
  usage: Usage,
): void {
  console.log(
    JSON.stringify({
      flow,
      step,
      model,
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
    }),
  );
}

// Voice calls have duration-based pricing rather than token usage. Keep the
// same content-free server log shape while recording only the model and time.
export function logVoiceCall(
  flow: string,
  step: string,
  model: string,
  audioSeconds: number,
): void {
  console.log(JSON.stringify({ flow, step, model, audio_seconds: audioSeconds }));
}

// Test-only reset for the in-memory counter.
export function resetSpendForTests(): void {
  spendByDay.clear();
}
