"use client";

// Get-help screen. Always reachable from the header button labeled
// "Get help — not medical advice". Shows tel: buttons only; the app never
// calls by itself.
import {
  EMERGENCY_INDONESIA_GENERAL,
  EMERGENCY_INDONESIA_MEDICAL,
  EMERGENCY_US,
} from "@/lib/links";
import { useLang } from "./Lang";

export default function GetHelp({ onBack }: { onBack: () => void }) {
  const { t } = useLang();
  return (
    <section>
      <h2>{t.getHelp.title}</h2>
      <p className="big-text">{t.getHelp.subtitle}</p>
      <div className="button-column">
        <a className="button-link primary" href={EMERGENCY_US}>
          {t.getHelp.call911}
        </a>
        <a className="button-link" href={EMERGENCY_INDONESIA_GENERAL}>
          {t.getHelp.indonesia112}
        </a>
        <a className="button-link" href={EMERGENCY_INDONESIA_MEDICAL}>
          {t.getHelp.indonesia119}
        </a>
      </div>
      <p className="muted">{t.getHelp.neverCalls}</p>
      <button type="button" onClick={onBack}>
        {t.back}
      </button>
    </section>
  );
}
