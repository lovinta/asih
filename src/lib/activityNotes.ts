export const ACTIVITY_NOTES_KEY = "oah.activityNotes";
export function clearAppStorage(storage: Pick<Storage, "length" | "key" | "removeItem">): void {
  const owned: string[] = [];
  for (let i = 0; i < storage.length; i++) { const key = storage.key(i); if (key?.startsWith("oah.")) owned.push(key); }
  for (const key of owned) storage.removeItem(key);
}
export interface ActivityNote { id: string; what: string; date: string; how: string; }
export function serializeActivityNotes(notes: ActivityNote[]): string { return JSON.stringify(notes.map(({ id, what, date, how }) => ({ id, what, date, how }))); }
export function listActivityNotes(raw: string | null): ActivityNote[] {
  if (!raw) return [];
  try { const parsed = JSON.parse(raw) as ActivityNote[]; if (!Array.isArray(parsed)) return []; return parsed.filter((n) => typeof n.id === "string" && typeof n.what === "string" && typeof n.date === "string" && typeof n.how === "string").sort((a, b) => b.date.localeCompare(a.date)); } catch { return []; }
}
export function addActivityNote(notes: ActivityNote[], input: { what: string; date: string; how?: string }, id = `${Date.now()}`): ActivityNote[] {
  const what = input.what.trim(); const how = (input.how ?? "").trim();
  if (!what || what.length > 160 || how.length > 240 || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error("Enter an activity and a valid date. Keep the activity under 160 characters.");
  return listActivityNotes(serializeActivityNotes([...notes, { id, what, date: input.date, how }]));
}
export function deleteActivityNote(notes: ActivityNote[], id: string): ActivityNote[] { return notes.filter((note) => note.id !== id); }
export function activityCaption(what: string, date: string, lang: "en" | "es"): string { return lang === "es" ? `Fui a ${what} el ${date}.` : `I went to ${what} on ${date}.`; }
