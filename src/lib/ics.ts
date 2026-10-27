// Minimal RFC 5545 .ics builder for the visit / event the person confirmed.
// Plain text calendar file offered as a download; nothing is sent anywhere.

export interface IcsEventInput {
  title: string;
  start: Date;
  end?: Date;
  location?: string;
  description?: string;
}

// Escape commas, semicolons, backslashes, and newlines in TEXT values.
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

// UTC datetime in the form YYYYMMDDTHHMMSSZ.
export function formatDateTimeUTC(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}` +
    `T${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z`
  );
}

function makeUid(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${Date.now()}-${rand}@asih`;
}

export function buildICS(event: IcsEventInput): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//asih//EN",
    "BEGIN:VEVENT",
    `UID:${makeUid()}`,
    `DTSTAMP:${formatDateTimeUTC(new Date())}`,
    `DTSTART:${formatDateTimeUTC(event.start)}`,
  ];
  if (event.end) lines.push(`DTEND:${formatDateTimeUTC(event.end)}`);
  lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  if (event.description)
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  // RFC 5545 requires CRLF line endings.
  return lines.join("\r\n") + "\r\n";
}
