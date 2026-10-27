// React-free tests for the .ics date parser used after confirmation.
import { describe, expect, it } from "vitest";
import { parseVisitDateTime } from "./visitDate";

describe("parseVisitDateTime", () => {
  it("parses the example letter visit (Nov 10 2026, 10:30 AM)", () => {
    const date = parseVisitDateTime("Tuesday, November 10, 2026", "10:30 AM");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(10);
    expect(date?.getHours()).toBe(10);
    expect(date?.getMinutes()).toBe(30);
  });

  it("parses the example event (Nov 7 2026, 9:00 AM)", () => {
    const date = parseVisitDateTime("Saturday, November 7, 2026", "9:00 AM");
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(10);
    expect(date?.getDate()).toBe(7);
    expect(date?.getHours()).toBe(9);
  });

  it("handles PM times", () => {
    const date = parseVisitDateTime("November 10, 2026", "2:15 PM");
    expect(date?.getHours()).toBe(14);
    expect(date?.getMinutes()).toBe(15);
  });

  it("returns null for unreadable or empty strings", () => {
    expect(parseVisitDateTime("I can't read this part", "10:30 AM")).toBeNull();
    expect(parseVisitDateTime("Tuesday, November 10, 2026", "")).toBeNull();
    expect(parseVisitDateTime("", "")).toBeNull();
  });
});
