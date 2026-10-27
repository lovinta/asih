import { describe, expect, it } from "vitest";
import { redFlagPrescreen } from "./prescreen";
import { EXAMPLE_AD_TEXT } from "@/fixtures/ad";

describe("red-flag prescreen", () => {
  it("flags explicit immediate-danger phrases (EN)", () => {
    expect(redFlagPrescreen("I can't breathe right now").flagged).toBe(true);
    expect(redFlagPrescreen("I have chest pain").flagged).toBe(true);
    expect(redFlagPrescreen("I want to kill myself").flagged).toBe(true);
  });

  it("flags explicit immediate-danger phrases (ES)", () => {
    expect(redFlagPrescreen("no puedo respirar").flagged).toBe(true);
    expect(redFlagPrescreen("tengo dolor de pecho").flagged).toBe(true);
    expect(redFlagPrescreen("quiero matarme").flagged).toBe(true);
  });

  it("does not trigger on negations", () => {
    expect(redFlagPrescreen("I don't have chest pain").flagged).toBe(false);
    expect(redFlagPrescreen("I do not have chest pain").flagged).toBe(false);
    expect(redFlagPrescreen("No tengo dolor de pecho").flagged).toBe(false);
    expect(redFlagPrescreen("I can breathe fine today").flagged).toBe(false);
  });

  it("does not screen shared ad text as the person's own words", () => {
    expect(redFlagPrescreen(EXAMPLE_AD_TEXT, "shared").flagged).toBe(false);
  });

  it("does not trigger on danger words inside quotes", () => {
    expect(
      redFlagPrescreen('The ad said "cure chest pain fast" and I am worried.').flagged,
    ).toBe(false);
  });

  it("leaves ordinary text alone", () => {
    expect(redFlagPrescreen("I enjoy walking in the park.").flagged).toBe(false);
  });
});
