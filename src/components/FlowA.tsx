"use client";

// Flow A: appointment letter help. Upload a photo (resized client-side) or
// use the example letter -> POST /api/agent -> confirm step, one item at a
// time -> after all confirmed: save the visit to localStorage, download the
// .ics calendar file, keep "My questions for the visit" (stored verbatim),
// and show transport links for the confirmed place.
import { useRef, useState } from "react";
import type { FlowInput, Lang, Step } from "@/lib/agent/types";
import type { FlowAResult } from "@/lib/agent/runFlow";
import { exportConfirmedICS, saveConfirmed, type ConfirmState } from "@/lib/confirm";
import { resizeImageFile } from "@/lib/images";
import { downloadTextFile, parseVisitDateTime } from "@/lib/visitDate";
import ConfirmStep from "./ConfirmStep";
import SpeechControls from "./SpeechControls";
import TracePanel from "./TracePanel";
import TransportLinks from "./TransportLinks";
import { useLang } from "./Lang";

const VISITS_KEY = "oah.visits";
const QUESTIONS_KEY = "oah.questions";

export interface FlowProps {
  lang: Lang;
  needGate: (run: () => void) => void;
  openHelp: () => void;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function postAgent(flow: "A", input: FlowInput, lang: Lang) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ flow, input, lang }),
  });
  const data = (await res.json()) as {
    trace?: Step[];
    result?: FlowAResult | { kind: "help" };
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

export default function FlowA({ lang, needGate, openHelp }: FlowProps) {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"input" | "loading" | "confirm" | "done">("input");
  const [error, setError] = useState("");
  const [usedExample, setUsedExample] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [finalState, setFinalState] = useState<ConfirmState | null>(null);
  const [trace, setTrace] = useState<Step[]>([]);
  const [transport, setTransport] = useState<FlowAResult["transport"] | null>(null);
  const [questions, setQuestions] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readJson<string[]>(QUESTIONS_KEY, []),
  );
  const [questionDraft, setQuestionDraft] = useState("");

  const run = async (input: FlowInput, example: boolean) => {
    setError("");
    setPhase("loading");
    try {
      const data = await postAgent("A", input, lang);
      if (data.result?.kind === "help") {
        setPhase("input");
        openHelp();
        return;
      }
      const result = data.result as FlowAResult;
      setUsedExample(example);
      setConfirm(result.confirm);
      setTransport(result.transport);
      setTrace(data.trace ?? []);
      setPhase("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      setPhase("input");
    }
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file) return;
    needGate(() => {
      void (async () => {
        try {
          const dataUrl = await resizeImageFile(file);
          await run({ imageDataUrl: dataUrl }, false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not read the photo.");
        }
      })();
    });
  };

  const useExample = () => needGate(() => void run({ useExample: true }, true));

  const finishConfirm = (state: ConfirmState) => {
    // Only confirmed items are saved, per src/lib/confirm.ts.
    const saved = saveConfirmed(state);
    try {
      const visits = readJson<Record<string, string>[]>(VISITS_KEY, []);
      window.localStorage.setItem(
        VISITS_KEY,
        JSON.stringify([...visits, { ...saved, savedAt: new Date().toISOString() }]),
      );
    } catch {
      // Saving is best-effort; the confirmed list is still shown.
    }
    setFinalState(state);
    setPhase("done");
  };

  const addQuestion = () => {
    const text = questionDraft.trim();
    if (!text) return;
    // Stored verbatim: no added medical wording, ever.
    const next = [...questions, text];
    setQuestions(next);
    setQuestionDraft("");
    try {
      window.localStorage.setItem(QUESTIONS_KEY, JSON.stringify(next));
    } catch {
      // Kept for this session even if storage is unavailable.
    }
  };

  const downloadIcs = () => {
    if (!finalState) return;
    const saved = saveConfirmed(finalState);
    const start = parseVisitDateTime(saved.date ?? "", saved.time ?? "");
    if (!start) return;
    const title = saved.clinic_name || saved.place || t.flowA.title;
    const ics = exportConfirmedICS(finalState, {
      title,
      start,
      end: new Date(start.getTime() + 60 * 60 * 1000),
      location: saved.place,
      fieldLabels: t.fieldKinds,
    });
    downloadTextFile("visit.ics", ics, "text/calendar");
  };

  const saved = finalState ? saveConfirmed(finalState) : {};
  const visitStart = parseVisitDateTime(saved.date ?? "", saved.time ?? "");
  const summaryText = Object.entries(saved)
    .map(([field, value]) => `${t.fieldKinds[field as keyof typeof t.fieldKinds] ?? field}: ${value}`)
    .join(". ");

  return (
    <section>
      <h2>{t.flowA.title}</h2>
      {usedExample && <p className="example-tag">{t.exampleLabel}</p>}
      {error && (
        <p className="warning" role="alert">
          {error}
        </p>
      )}

      {phase === "input" || phase === "loading" ? (
        <div>
          <label className="button-link" htmlFor="letter-photo">
            {t.flowA.uploadPhoto}
          </label>
          <input
            id="letter-photo"
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="visually-hidden"
            onChange={(event) => void onPhoto(event.target.files?.[0])}
          />
          <p className="muted">{t.flowA.photoHint}</p>
          <div className="button-row">
            <button type="button" onClick={useExample}>
              {t.flowA.useExample}
            </button>
          </div>
          {phase === "loading" && <p className="big-text">{t.loading}</p>}
        </div>
      ) : null}

      {phase === "confirm" && confirm && (
        <ConfirmStep
          key={`${lang}-${confirm.items.length}`}
          initial={confirm}
          lang={lang}
          unreadableNote={t.flowA.unreadableNote}
          onDone={finishConfirm}
        />
      )}

      {phase === "done" && finalState && (
        <div>
          <p className="big-text">{t.flowA.visitSaved}</p>
          <h3>{t.flowA.savedVisitTitle}</h3>
          <ul className="confirm-list">
            {Object.entries(saved).map(([field, value]) => (
              <li key={field}>
                <strong>{t.fieldKinds[field as keyof typeof t.fieldKinds] ?? field}:</strong> {value}
              </li>
            ))}
          </ul>
          <SpeechControls text={summaryText} lang={lang} />
          {visitStart ? (
            <div className="button-row">
              <button type="button" className="primary" onClick={downloadIcs}>
                {t.flowA.downloadIcs}
              </button>
            </div>
          ) : null}
          <h3>{t.flowA.questionsTitle}</h3>
          <p className="muted">{t.flowA.questionsHint}</p>
          {questions.length === 0 ? (
            <p className="muted">{t.flowA.questionsEmpty}</p>
          ) : (
            <ul className="confirm-list">
              {questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ul>
          )}
          <label className="field-label">
            {t.flowA.questionsTitle}
            <input
              type="text"
              value={questionDraft}
              placeholder={t.flowA.questionPlaceholder}
              onChange={(event) => setQuestionDraft(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button type="button" onClick={addQuestion}>
              {t.flowA.addQuestion}
            </button>
          </div>
          {transport && (
            <TransportLinks
              place={saved.place ?? ""}
              transitUrl={transport.transitUrl}
              rideNote={t.flowB.rideNote}
            />
          )}
        </div>
      )}

      <TracePanel trace={trace} />
    </section>
  );
}
