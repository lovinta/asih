import { describe, expect, it } from "vitest";
import { validateCases, evaluate, main } from "./runner";
import { readFileSync } from "node:fs";

const { cases } = JSON.parse(readFileSync("eval/cases.json", "utf8")) as { cases: Parameters<typeof validateCases>[0] };

describe("synthetic evaluation set", () => {
  it("validates dataset schema and coverage", () => { expect(() => validateCases(cases)).not.toThrow(); });
  it("rejects unknown expectation check types", () => {
    const invalid = structuredClone(cases); invalid[0].expect[0].check = "madeUp";
    expect(() => validateCases(invalid)).toThrow(/Unknown check type/);
  });
  it("runs dev split in mock mode", async () => {
    const result = await evaluate({ split: "dev", runs: 1 });
    expect(result.mode).toContain("MOCK"); expect(result.outcomes.length).toBeGreaterThan(0);
    expect(result.outcomes.every(x => ["pass", "fail", "skip"].includes(x.status))).toBe(true);
  });
  it("refuses live runs because live evaluation is not implemented", async () => {
    await expect(main(["--live"])).rejects.toThrow("NOT implemented yet");
  });
});
