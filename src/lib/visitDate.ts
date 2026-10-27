// Parse the confirmed visit/event date + time strings (e.g. "Tuesday,
// November 10, 2026" and "10:30 AM") into a local Date for the .ics download.
// Pure and React-free: covered by visitDate.test.ts. Returns null when the
// strings do not contain a recognizable date and time.
const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

export function parseVisitDateTime(dateStr: string, timeStr: string): Date | null {
  const dateMatch = /([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/.exec(dateStr);
  if (!dateMatch) return null;
  const month = MONTHS[dateMatch[1].toLowerCase()];
  if (month === undefined) return null;
  const day = Number(dateMatch[2]);
  const year = Number(dateMatch[3]);
  const timeMatch = /(\d{1,2}):(\d{2})\s*([AP]M)/i.exec(timeStr);
  if (!timeMatch) return null;
  let hour = Number(timeMatch[1]) % 12;
  if (/pm/i.test(timeMatch[3])) hour += 12;
  const minute = Number(timeMatch[2]);
  if (day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  return new Date(year, month, day, hour, minute, 0);
}

// Download a text file (the .ics calendar file) via a Blob URL. The person
// taps the button; nothing is sent anywhere.
export function downloadTextFile(filename: string, text: string, mime: string): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
