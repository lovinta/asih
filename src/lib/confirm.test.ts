import { describe, expect, it } from "vitest";
import {
  changeItem,
  confirmItem,
  createConfirmState,
  exportConfirmedICS,
  isAllConfirmed,
  saveConfirmed,
} from "./confirm";

const ITEMS = [
  { id: "date-0", field: "date", value: "Tuesday, November 4, 2026", readable: true },
  { id: "time-1", field: "time", value: "10:30 AM", readable: true },
];

describe("confirm state machine", () => {
  it("starts with everything pending", () => {
    const state = createConfirmState(ITEMS);
    expect(isAllConfirmed(state)).toBe(false);
    expect(saveConfirmed(state)).toEqual({});
  });

  it("confirms one item at a time", () => {
    let state = createConfirmState(ITEMS);
    state = confirmItem(state, "date-0");
    expect(isAllConfirmed(state)).toBe(false);
    expect(saveConfirmed(state)).toEqual({ date: "Tuesday, November 4, 2026" });
    state = confirmItem(state, "time-1");
    expect(isAllConfirmed(state)).toBe(true);
  });

  it("never saves unconfirmed items", () => {
    const state = confirmItem(createConfirmState(ITEMS), "time-1");
    const saved = saveConfirmed(state);
    expect(saved).not.toHaveProperty("date");
    expect(saved).toEqual({ time: "10:30 AM" });
  });

  it("change sends the item back to pending with the new value", () => {
    let state = confirmItem(createConfirmState(ITEMS), "date-0");
    state = changeItem(state, "date-0", "Wednesday, November 5, 2026");
    expect(saveConfirmed(state)).toEqual({});
    state = confirmItem(state, "date-0");
    expect(saveConfirmed(state).date).toBe("Wednesday, November 5, 2026");
  });

  it("refuses .ics export until every item is confirmed", () => {
    const partial = confirmItem(createConfirmState(ITEMS), "date-0");
    expect(() =>
      exportConfirmedICS(partial, { title: "Visit", start: new Date(2026, 10, 4, 10, 30, 0) }),
    ).toThrow(/unconfirmed/);
    const full = confirmItem(partial, "time-1");
    const ics = exportConfirmedICS(full, { title: "Visit", start: new Date(2026, 10, 4, 10, 30, 0) });
    expect(ics).toContain("BEGIN:VEVENT");
  });
});
