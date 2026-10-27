import { describe, expect, it } from "vitest";
import { buildICS, escapeIcsText, formatDateTimeUTC } from "./ics";

describe("ics builder", () => {
  it("emits a CRLF VCALENDAR/VEVENT with UID, DTSTAMP, DTSTART, SUMMARY", () => {
    const ics = buildICS({
      title: "Clinic visit",
      start: new Date(Date.UTC(2026, 10, 10, 14, 30, 0)),
      location: "Riverside Health Center",
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("UID:");
    expect(ics).toContain("DTSTAMP:");
    expect(ics).toContain("DTSTART:20261110T143000Z");
    expect(ics).toContain("SUMMARY:Clinic visit");
    expect(ics).toContain("PRODID:-//older-adults-helper//EN");
    expect(ics).toContain("LOCATION:Riverside Health Center");
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
    expect(ics).toContain("\r\n");
    expect(ics).not.toMatch(/[^\r]\n/);
  });

  it("escapes commas, semicolons, and newlines", () => {
    expect(escapeIcsText("a,b;c\nd")).toBe("a\\,b\\;c\\nd");
  });

  it("formats UTC datetimes with zero padding", () => {
    expect(formatDateTimeUTC(new Date(Date.UTC(2026, 0, 2, 3, 4, 5)))).toBe(
      "20260102T030405Z",
    );
  });
});
