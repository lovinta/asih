"use client";

// Data notice gate: before the first upload/share/send, the exact SPEC
// notice is shown in large text and read aloud (speechSynthesis, current
// language). The flow continues only after the person taps "I understand".
// Acceptance is remembered in localStorage and the notice stays re-readable
// from home.
import { useEffect } from "react";
import type { Lang } from "@/lib/agent/types";
import { readAloud } from "@/lib/speech";
import { useLang } from "./Lang";

export const NOTICE_STORAGE_KEY = "oah.noticeAccepted.v1";

export function isNoticeAccepted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(NOTICE_STORAGE_KEY) === "yes";
  } catch {
    return false;
  }
}

export function rememberNoticeAccepted(): void {
  try {
    window.localStorage.setItem(NOTICE_STORAGE_KEY, "yes");
  } catch {
    // The flow still continues for this session.
  }
}

export default function DataNoticeDialog({
  lang,
  onAcknowledge,
}: {
  lang: Lang;
  onAcknowledge: () => void;
}) {
  const { t } = useLang();
  const body = t.dataNotice.body;

  // Read the notice aloud as soon as it is shown, in the current language.
  useEffect(() => {
    readAloud(`${t.dataNotice.title}. ${body}`, lang);
  }, [body, lang, t.dataNotice.title]);

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-labelledby="notice-title">
      <div className="dialog">
        <h2 id="notice-title">{t.dataNotice.title}</h2>
        <p className="big-text">{body}</p>
        <button
          type="button"
          className="primary"
          onClick={() => {
            rememberNoticeAccepted();
            onAcknowledge();
          }}
        >
          {t.dataNotice.acknowledge}
        </button>
      </div>
    </div>
  );
}
