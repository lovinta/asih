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

  it("does not block quoted cue evidence (ad text), only the agent's own words", () => {
    expect(
      ruleGuard(
        `${FIXED_SCAM_WORDING_EN} Evidence: "this product cures arthritis pain, guaranteed" and "this is safe, act now".`,
      ).pass,
    ).toBe(true);
    // Unquoted claims from the agent itself still fail.
    expect(ruleGuard("I checked: this product works for joint pain.").pass).toBe(false);
  });

  it("passes English replies that report the ad's cure claims as warning signs", () => {
    expect(ruleGuard("The ad says it cures arthritis.").pass).toBe(true);
    expect(ruleGuard("The ad claims to cure joint pain.").pass).toBe(true);
    expect(ruleGuard("The ad promises a cure.").pass).toBe(true);
    expect(ruleGuard("The ad's cure claims are a warning sign.").pass).toBe(true);
    // Curly quotes and guillemets are ad evidence too.
    expect(ruleGuard("The ad says “it cures arthritis”.").pass).toBe(true);
    expect(ruleGuard("The ad says «it cures arthritis».").pass).toBe(true);
  });

  it("passes Spanish replies that report the ad's cure claims as warning signs", () => {
    expect(ruleGuard("El anuncio dice que cura la diabetes.").pass).toBe(true);
    expect(ruleGuard("El anuncio afirma que cura.").pass).toBe(true);
    expect(ruleGuard("El anuncio promete curar el dolor.").pass).toBe(true);
    expect(ruleGuard("El anuncio dice «que cura la diabetes».").pass).toBe(true);
    expect(ruleGuard("El anuncio dice “que cura la diabetes”.").pass).toBe(true);
  });

  it("still blocks the agent's own cure, efficacy, and medical claims", () => {
    expect(ruleGuard("This cures arthritis.").pass).toBe(false);
    expect(ruleGuard("Esto cura la diabetes.").pass).toBe(false);
    expect(ruleGuard("This product works.").pass).toBe(false);
    // Attribution does not hide the agent's own claim in the same sentence.
    expect(
      ruleGuard("The ad says it cures arthritis, but this cures it too.").pass,
    ).toBe(false);
    expect(
      ruleGuard("El anuncio dice que cura, pero esto cura la diabetes.").pass,
    ).toBe(false);
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

  it("states AI limits and returns the choice to the person in the fixed reply", () => {
    expect(FIXED_SAFE_REPLY).toContain("not a doctor");
    expect(FIXED_SAFE_REPLY).toContain("You decide what to do next");
    expect(FIXED_SAFE_REPLY).not.toMatch(/[!¡]/);
  });
});

describe("attributed cure claims, wider phrasing", () => {
  it.each([
    "El anuncio asegura que su crema lo cura todo; eso es una señal de advertencia.",
    "Según el anuncio, cura la artritis en días. Tenga cuidado.",
    "El anuncio promete una cura rápida: una señal de alerta.",
    "It claims that the cream cures joint pain, which is a warning sign.",
  ])("passes %s", (t) => expect(ruleGuard(t).pass).toBe(true));
  it.each([
    "Esta crema cura la artritis.",
    "This cream cures joint pain.",
    "Your doctor says this cures arthritis.",
    "El médico dice que esto cura la artritis.",
    "The ad says it is great, this cures arthritis.",
    "El anuncio dice que es bueno, esto cura la artritis.",
  ])(
    "blocks %s",
    (t) => expect(ruleGuard(t).pass).toBe(false),
  );
});
