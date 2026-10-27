// No network: mock transcribe returns fixture transcripts with no key.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { transcribe, languageBias } from "./transcribe";
import {
  EXAMPLE_VOICE_TRANSCRIPT_EN,
  EXAMPLE_VOICE_TRANSCRIPT_ES,
} from "@/fixtures/voiceTranscript";

const OLD_ENV = { ...process.env };

beforeEach(() => {
  process.env.MOCK_MODE = "1";
  delete process.env.META_API_KEY;
});

afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe("transcribe", () => {
  it("returns the English fixture in mock mode", async () => {
    const res = await transcribe(new Uint8Array([1, 2, 3]), "en");
    expect(res.mock).toBe(true);
    expect(res.transcript).toBe(EXAMPLE_VOICE_TRANSCRIPT_EN);
  });

  it("returns the Spanish fixture in mock mode", async () => {
    const res = await transcribe(new Uint8Array([1, 2, 3]), "es");
    expect(res.transcript).toBe(EXAMPLE_VOICE_TRANSCRIPT_ES);
  });

  it("builds the right languageBias per language", () => {
    expect(languageBias("en")).toEqual(["English"]);
    expect(languageBias("es")).toEqual(["Spanish", "English"]);
  });
});
