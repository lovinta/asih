import { describe, expect, it } from "vitest";
import { validateCases, evaluate, main } from "./runner";
import { readFileSync } from "node:fs";

const { cases } = JSON.parse(readFileSync("eval/cases.json", "utf8")) as { cases: Parameters<typeof validateCases>[0] };

describe("synthetic evaluation set", () => {
  it("validates dataset schema and coverage", () => { expect(() => validateCases(cases)).not.toThrow(); });
  it("runs the dev split through mock core and returns real outcomes", async () => {
    const result = await evaluate({ split: "dev", runs: 1 });
    expect(result.mode).toContain("MOCK");
    expect(result.outcomes.length).toBeGreaterThan(0);
    expect(result.outcomes.every(x => ["pass", "fail", "skip"].includes(x.status))).toBe(true);
  });
  it("rejects live runs without a key", async () => {
    const previous = process.env.META_API_KEY;
    delete process.env.META_API_KEY;
    await expect(main(["--live"])).rejects.toThrow("requires META_API_KEY");
    if (previous) process.env.META_API_KEY = previous;
  });
});
