"use client";

// Confirm-one-item-at-a-time step. Large text, read aloud automatically,
// big Confirm and Change buttons (inline edit, then confirm again).
// Unreadable items show "I can't read this part" and require Change before
// they can be confirmed. Backed by src/lib/confirm.ts: nothing is saved,
// exported, or drafted until every item is confirmed.
import { useEffect, useState } from "react";
import type { Lang } from "@/lib/agent/types";
import {
  changeItem,
  confirmItem,
  isAllConfirmed,
  type ConfirmState,
} from "@/lib/confirm";
import { readAloud } from "@/lib/speech";
import { useLang } from "./Lang";

interface ConfirmStepProps {
  initial: ConfirmState;
  lang: Lang;
  unreadableNote: string;
  onDone: (state: ConfirmState) => void;
}

export default function ConfirmStep({ initial, lang, unreadableNote, onDone }: ConfirmStepProps) {
  const { t } = useLang();
  const [state, setState] = useState<ConfirmState>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [fixedIds, setFixedIds] = useState<string[]>([]);

  const current = state.items.find((item) => item.status !== "confirmed") ?? null;
  const done = isAllConfirmed(state);

  // Read the current item aloud automatically, one item at a time.
  useEffect(() => {
    if (!current) return;
    const spoken = current.readable
      ? `${current.field}: ${current.value}`
      : `${current.field}: ${unreadableNote}`;
    readAloud(spoken, lang);
  }, [current, lang, unreadableNote]);

  const confirmCurrent = () => {
    if (!current) return;
    setEditingId(null);
    setState((prev) => confirmItem(prev, current.id));
  };

  const startEdit = () => {
    if (!current) return;
    setEditValue(current.readable ? current.value : "");
    setEditingId(current.id);
  };

  const saveEdit = () => {
    if (!current || editingId !== current.id) return;
    const next = changeItem(state, current.id, editValue.trim());
    // A corrected value is now readable; it still needs a fresh Confirm.
    setState({
      items: next.items.map((item) =>
        item.id === current.id ? { ...item, readable: true } : item,
      ),
    });
    setFixedIds((prev) => (prev.includes(current.id) ? prev : [...prev, current.id]));
    setEditingId(null);
  };

  if (done) {
    return (
      <section aria-live="polite">
        <p className="big-text">{t.confirm.allDone}</p>
        <ul className="confirm-list">
          {state.items.map((item) => (
            <li key={item.id}>
              <strong>{item.field}:</strong> {item.value} — {t.confirm.confirmed}
            </li>
          ))}
        </ul>
        <button type="button" className="primary" onClick={() => onDone(state)}>
          {t.confirm.continueButton}
        </button>
      </section>
    );
  }

  if (!current) return null;

  const needsChange = !current.readable && !fixedIds.includes(current.id);

  return (
    <section aria-live="polite">
      <h2>{t.confirm.title}</h2>
      <p className="big-text">
        <strong>{current.field}:</strong>{" "}
        {current.readable ? current.value : unreadableNote}
      </p>
      {!current.readable && !fixedIds.includes(current.id) && (
        <p className="warning">{unreadableNote}</p>
      )}
      {editingId === current.id ? (
        <div>
          <label className="field-label">
            {t.confirm.editLabel}
            <input
              type="text"
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button type="button" className="primary" onClick={saveEdit}>
              {t.confirm.saveEdit}
            </button>
          </div>
        </div>
      ) : (
        <div className="button-row">
          <button
            type="button"
            className="primary"
            onClick={confirmCurrent}
            disabled={needsChange}
            title={needsChange ? unreadableNote : undefined}
          >
            {t.confirm.confirmButton}
          </button>
          <button type="button" onClick={startEdit}>
            {t.confirm.changeButton}
          </button>
        </div>
      )}
      <p className="muted">
        {t.confirm.waiting} ({state.items.filter((i) => i.status === "confirmed").length}/
        {state.items.length})
      </p>
    </section>
  );
}
