// Confirm-one-item-at-a-time state machine (pure, no storage, no UI).
// Every date, time, place, or name the agent reads stays "pending" until the
// person taps Confirm for that item. Nothing may be saved to localStorage,
// added to a .ics, or used in a draft until it is confirmed.

import { buildICS } from "./ics";

export type ConfirmStatus = "pending" | "confirmed";

export interface ConfirmItem {
  id: string;
  field: string;
  value: string;
  readable: boolean;
}

export interface ConfirmItemState extends ConfirmItem {
  status: ConfirmStatus;
}

export interface ConfirmState {
  items: ConfirmItemState[];
}

export function createConfirmState(items: ConfirmItem[]): ConfirmState {
  return { items: items.map((item) => ({ ...item, status: "pending" as const })) };
}

// Confirm a single item; other items are untouched.
export function confirmItem(state: ConfirmState, id: string): ConfirmState {
  return {
    items: state.items.map((item) =>
      item.id === id ? { ...item, status: "confirmed" as const } : item,
    ),
  };
}

// Correct a value with the Change button: the item goes back to pending and
// must be confirmed again before it can be saved or exported.
export function changeItem(
  state: ConfirmState,
  id: string,
  newValue: string,
): ConfirmState {
  return {
    items: state.items.map((item) =>
      item.id === id
        ? { ...item, value: newValue, status: "pending" as const }
        : item,
    ),
  };
}

export function confirmedItems(state: ConfirmState): ConfirmItemState[] {
  return state.items.filter((item) => item.status === "confirmed");
}

export function isAllConfirmed(state: ConfirmState): boolean {
  return state.items.length > 0 && state.items.every((item) => item.status === "confirmed");
}

// Save payload: only confirmed items. Unconfirmed items are never included.
export function saveConfirmed(state: ConfirmState): Record<string, string> {
  const saved: Record<string, string> = {};
  for (const item of confirmedItems(state)) saved[item.field] = item.value;
  return saved;
}

// .ics export: refused unless EVERY item is confirmed. Unconfirmed items
// cannot leak into a download through this path.
export function exportConfirmedICS(
  state: ConfirmState,
  opts: { title: string; start: Date; end?: Date; location?: string },
): string {
  const pending = state.items.filter((item) => item.status !== "confirmed");
  if (pending.length > 0) {
    throw new Error(
      `Cannot export: ${pending.length} item(s) still unconfirmed (${pending
        .map((item) => item.field)
        .join(", ")}).`,
    );
  }
  const description = state.items
    .map((item) => `${item.field}: ${item.value}`)
    .join("\n");
  return buildICS({ ...opts, description });
}
