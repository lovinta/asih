// Parse the confirmed visit/event date + time strings (e.g. "Tuesday,
// November 10, 2026", "sábado, 7 de noviembre de 2026", and "10:30 AM") into a
// local Date for the .ics download. Pure and React-free: covered by
// visitDate.test.ts. Returns null when the strings do not contain a
// recognizable date and time.
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
  enero: 0,
  febrero: 1,
  marzo: 2,
  abril: 3,
  mayo: 4,
  junio: 5,
  julio: 6,
  agosto: 7,
  septiembre: 8,
  setiembre: 8,
  octubre: 9,
  noviembre: 10,
  diciembre: 11,
};

function normalizeMonth(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function parseVisitDateTime(dateStr: string, timeStr: string): Date | null {
  const normalizedDate = dateStr.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const english = /([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/.exec(normalizedDate);
  const spanish = /(\d{1,2})\s+de\s+([A-Za-z]+)\s+de\s+(\d{4})/.exec(normalizedDate);
  const parsed = english
    ? { month: english[1], day: Number(english[2]), year: Number(english[3]) }
    : spanish
      ? { month: spanish[2], day: Number(spanish[1]), year: Number(spanish[3]) }
      : null;
  if (!parsed) return null;
  const month = MONTHS[normalizeMonth(parsed.month)];
  if (month === undefined) return null;
  const { day, year } = parsed;
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
