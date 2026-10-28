import { describe, expect, it, vi } from "vitest";
import { ACTIVITY_NOTES_KEY, addActivityNote, clearAppStorage, listActivityNotes, serializeActivityNotes } from "./activityNotes";
describe("private activity notes", () => {
  it("validates, serializes and sorts without scores or streaks", () => {
    const notes = addActivityNote(addActivityNote([], { what: "Walk", date: "2026-10-01" }, "1"), { what: "Garden", date: "2026-10-02" }, "2");
    expect(listActivityNotes(serializeActivityNotes(notes))[0].what).toBe("Garden");
    expect(serializeActivityNotes(notes)).not.toMatch(/score|streak|count/i);
    expect(() => addActivityNote([], { what: " ", date: "2026-10-01" })).toThrow();
  });
  it("clear everything removes the owned note key and does not call fetch", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch"); const map = new Map([[ACTIVITY_NOTES_KEY, "[]"], ["other", "keep"]]);
    const storage = { get length() { return map.size; }, key: (i: number) => [...map.keys()][i] ?? null, removeItem: (key: string) => { map.delete(key); } };
    clearAppStorage(storage); expect(map.has(ACTIVITY_NOTES_KEY)).toBe(false); expect(map.has("other")).toBe(true); expect(fetchSpy).not.toHaveBeenCalled(); fetchSpy.mockRestore();
  });
});
