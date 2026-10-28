import { describe, expect, it } from "vitest";
import { en } from "./en";
import { es } from "./es";
import { LETTER_KINDS, SCAM_CUE_KINDS } from "@/lib/agent/tools";
import { FIXED_SCAM_WORDING_EN, FIXED_SCAM_WORDING_ES } from "@/lib/safety/scamWording";
import { langInstructions } from "@/lib/agent/tools";

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

  it("keeps the data notice and fixed ad wording unchanged in both languages", () => {
    expect(en.dataNotice.body).toBe("Your saved items stay on this phone. To read a photo or voice note, it is sent to Meta's AI service. Meta says it does not use it to train its AI. This app tells Meta not to store its answers. Meta may still keep what is sent as needed to run the service, follow the law, and check for misuse and safety; it does not say for how many days. Delete everything removes what is saved on this phone. It cannot remove what Meta may have kept.");
    expect(es.dataNotice.body).toBe("Sus elementos guardados permanecen en este teléfono. Para leer una foto o nota de voz, se envía al servicio de IA de Meta. Meta dice que no lo usa para entrenar su IA. Esta aplicación le dice a Meta que no guarde sus respuestas. Meta aún puede conservar lo enviado según sea necesario para prestar el servicio, cumplir la ley y controlar el uso indebido y la seguridad; no dice por cuántos días. Borrar todo elimina lo guardado en este teléfono. No puede eliminar lo que Meta haya conservado.");
    expect(FIXED_SCAM_WORDING_EN).toBe("I can see these warning signs. I can't tell whether this is real or whether the product works. Check with someone you trust before paying or sharing details.");
    expect(FIXED_SCAM_WORDING_ES).toBe("Puedo ver estas señales de advertencia. No puedo decir si esto es real o si el producto funciona. Consulte con alguien de su confianza antes de pagar o compartir datos.");
  });

  it("has no exclamation marks in any English or Spanish UI string", () => {
    const leaves = (value: unknown): string[] => typeof value === "string"
      ? [value]
      : Array.isArray(value)
        ? value.flatMap(leaves)
        : Object.values(value as Record<string, unknown>).flatMap(leaves);
    expect(leaves(en).join(" ")).not.toMatch(/[!¡]/);
    expect(leaves(es).join(" ")).not.toMatch(/[!¡]/);
  });

  it("keeps activity note English free of praise and score language", () => {
    expect(JSON.stringify(en.activity).toLowerCase()).not.toMatch(/great job|proud|amazing|well done|streak|score/);
  });

  it("gives live mode the Asih persona rules", () => {
    const instructions = langInstructions("es");
    expect(instructions).toContain("You are Asih, an AI helper");
    expect(instructions).toContain("Say you are an AI if asked");
    expect(instructions).toContain("Never claim to be a person or clinician");
    expect(instructions).toContain("short, plain sentences");
    expect(instructions).toContain("pet names or exclamation marks");
    expect(instructions).toContain("formal usted");
  });
});
