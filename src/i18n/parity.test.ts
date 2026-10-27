import { describe, expect, it } from "vitest";
import { en } from "./en";
import { es } from "./es";
import { LETTER_KINDS, SCAM_CUE_KINDS } from "@/lib/agent/tools";

function deepKeys(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  return Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
    deepKeys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe("i18n key parity", () => {
  it("en and es have identical keys", () => {
    expect(deepKeys(es).sort()).toEqual(deepKeys(en).sort());
  });

  it("every Spanish leaf is a non-empty string", () => {
    const walk = (value: unknown): void => {
      if (typeof value === "string") {
        expect(value.length).toBeGreaterThan(0);
        return;
      }
      for (const v of Object.values(value as Record<string, unknown>)) walk(v);
    };
    walk(es);
  });

  it("labels every letter field and scam cue kind in both languages", () => {
    for (const kind of LETTER_KINDS) {
      expect(en.fieldKinds[kind]).toBeTruthy();
      expect(es.fieldKinds[kind]).toBeTruthy();
    }
    for (const kind of SCAM_CUE_KINDS) {
      expect((en.cueKinds as Record<string, string>)[kind]).toBeTruthy();
      expect((es.cueKinds as Record<string, string>)[kind]).toBeTruthy();
    }
  });
});
