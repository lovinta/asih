import { describe, expect, it } from "vitest";
import { DEFAULT_SPEECH_RATE, speechVoiceLang } from "./speech";

describe("speech defaults", () => {
  it("Asih reads English slower than the browser default", () => {
    expect(DEFAULT_SPEECH_RATE.en).toBeLessThan(1);
  });
  it("uses US voices per language", () => {
    expect(speechVoiceLang("en")).toBe("en-US");
    expect(speechVoiceLang("es")).toBe("es-US");
  });
});
