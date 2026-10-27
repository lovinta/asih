import { describe, expect, it, beforeEach } from "vitest";
import {
  checkSpendGuard,
  estimateCost,
  getTodaySpend,
  recordSpend,
  recordVoiceSpend,
  resetSpendForTests,
  voiceCostForHours,
  SPEND_CAP_USD,
  RESERVATION_USD,
  SpendExceededError,
} from "./spend";

beforeEach(() => resetSpendForTests());

describe("spend guard", () => {
  it("prices Spark input/output per the spec rates", () => {
    // 1M fresh input + 1M output = 1.25 + 4.25.
    expect(
      estimateCost({ input_tokens: 1_000_000, output_tokens: 1_000_000 }),
    ).toBeCloseTo(5.5, 6);
  });

  it("prices cached input lower than fresh input", () => {
    const cached = estimateCost({
      input_tokens: 1_000_000,
      output_tokens: 0,
      cached_input_tokens: 1_000_000,
    });
    expect(cached).toBeCloseTo(0.15, 6);
  });

  it("prices voice per hour", () => {
    expect(voiceCostForHours(1)).toBeCloseTo(0.18, 6);
  });

  it("accumulates spend and refuses past cap minus reservation", () => {
    recordSpend({ input_tokens: 7_000_000, output_tokens: 0 }); // $8.75
    expect(getTodaySpend()).toBeCloseTo(8.75, 6);
    // 8.75 + 0.30 reservation > 10? No -> allowed.
    checkSpendGuard();
    recordVoiceSpend(7); // +$1.26 -> $10.01
    expect(getTodaySpend()).toBeGreaterThan(SPEND_CAP_USD);
    expect(() => checkSpendGuard()).toThrow(SpendExceededError);
  });

  it("counts the $0.30 in-flight reservation", () => {
    // Spend exactly cap - reservation - epsilon is fine...
    recordSpend({ input_tokens: 7_760_000, output_tokens: 0 }); // $9.70
    checkSpendGuard(RESERVATION_USD); // 9.70 + 0.30 = 10.00, not over.
    recordSpend({ input_tokens: 8_000, output_tokens: 0 }); // +$0.01 -> $9.71
    expect(() => checkSpendGuard(RESERVATION_USD)).toThrow(SpendExceededError);
  });
});
