import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("fixture calendar weekdays", () => {
  it("matches the real weekday for every weekday-plus-date string", () => {
    const directory = join(process.cwd(), "src/fixtures");
    const files = readdirSync(directory).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"));
    const fixtureText = files.map((name) => readFileSync(join(directory, name), "utf8")).join("\n");
    const datePattern = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),\s+([A-Z][a-z]+\s+\d{1,2},\s+\d{4})\b/g;
    const matches = [...fixtureText.matchAll(datePattern)];
    expect(matches.length).toBeGreaterThan(0);

    for (const match of matches) {
      const parsed = new Date(`${match[2]} 12:00:00 UTC`);
      expect(Number.isNaN(parsed.getTime()), `Invalid fixture date: ${match[0]}`).toBe(false);
      expect(parsed.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }), match[0]).toBe(match[1]);
    }
  });
});
