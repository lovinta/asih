import { describe, expect, it } from "vitest";
import { outputGuard, ruleGuard, FIXED_SAFE_REPLY } from "./outputGuard";
import { FIXED_SCAM_WORDING_EN } from "./scamWording";

describe("output guard rules", () => {
  it("blocks diagnosis, dose, and treatment language", () => {
    expect(ruleGuard("You have diabetes, take 2 tablets daily.").pass).toBe(false);
    expect(ruleGuard("Take 500mg every morning.").pass).toBe(false);
    expect(ruleGuard("You should take this for your condition.").pass).toBe(false);
  });

  it('blocks efficacy claims and scam verdicts like "this is safe"', () => {
    expect(ruleGuard("This product works, guaranteed!").pass).toBe(false);
    expect(ruleGuard("This cures arthritis.").pass).toBe(false);
    expect(ruleGuard("Don't worry, this is safe.").pass).toBe(false);
    expect(ruleGuard("This is a scam, stay away.").pass).toBe(false);
  });

  it("passes the fixed scam wording", () => {
    expect(ruleGuard(FIXED_SCAM_WORDING_EN).pass).toBe(true);
  });

  it("fails closed to the fixed safe reply when the live check fails", async () => {
    const res = await outputGuard("A normal event summary.", {
      liveCheck: async () => ({ pass: false }),
    });
    expect(res.pass).toBe(false);
    expect(res.liveChecked).toBe(true);
    // Caller shows the fixed reply instead of model text.
    const shown = res.pass ? "A normal event summary." : FIXED_SAFE_REPLY;
    expect(shown).toBe(FIXED_SAFE_REPLY);
  });

  it("passes clean text with rules only in mock mode", async () => {
    const res = await outputGuard("A normal event summary.");
    expect(res.pass).toBe(true);
    expect(res.liveChecked).toBe(false);
  });
});
