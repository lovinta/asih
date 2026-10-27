"use client";

// Flow C: health-scam and ad check. Upload an ad screenshot, paste ad text,
// or use the example ad -> POST /api/agent -> quoted cues list (each cue
// with the quoted evidence), the fixed wording prominently, the "Why am I
// seeing this ad?" / Accounts Center / Report ad / Ad Library steps with
// links, then an editable note to someone trusted with WhatsApp / Share.
import { useRef, useState } from "react";
import type { FlowInput, Lang, Step } from "@/lib/agent/types";
import type { FlowCResult } from "@/lib/agent/runFlow";
import { resizeImageFile } from "@/lib/images";
import { whatsappShareUrl } from "@/lib/links";
import { scamMessage } from "@/lib/safety/scamWording";
import SpeechControls from "./SpeechControls";
import TracePanel from "./TracePanel";
import { useLang } from "./Lang";
import type { FlowProps } from "./FlowA";

interface Explanation {
  steps?: string[];
  adLibraryUrl?: string;
  prefsUrl?: string;
  note?: string;
  advertiser?: string;
}

interface Draft {
  draft?: string;
  whatsappUrl?: string;
}

async function postAgent(flow: "C", input: FlowInput, lang: Lang) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ flow, input, lang }),
  });
  const data = (await res.json()) as {
    trace?: Step[];
    result?: FlowCResult | { kind: "help" };
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

function canShare(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator;
}

export default function FlowC({ lang, needGate, openHelp }: FlowProps) {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"input" | "loading" | "done">("input");
  const [error, setError] = useState("");
  const [usedExample, setUsedExample] = useState(false);
  const [adText, setAdText] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [result, setResult] = useState<FlowCResult | null>(null);
  const [note, setNote] = useState("");
  const [trace, setTrace] = useState<Step[]>([]);

  const run = async (input: FlowInput, example: boolean) => {
    setError("");
    setPhase("loading");
    try {
      const data = await postAgent("C", input, lang);
      if (data.result?.kind === "help") {
        setPhase("input");
        openHelp();
        return;
      }
      const c = data.result as FlowCResult;
      setUsedExample(example);
      setResult(c);
      const draft = (c.draft ?? null) as Draft | null;
      setNote(draft?.draft ?? t.flowC.draftDefault);
      setTrace(data.trace ?? []);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      setPhase("input");
    }
  };

  const submitText = () => {
    const text = adText.trim();
    if (!text && !screenshot) return;
    needGate(() =>
      void run(
        {
          ...(text ? { sharedText: text } : {}),
          ...(screenshot ? { imageDataUrl: screenshot } : {}),
        },
        false,
      ),
    );
  };

  const useExample = () => needGate(() => void run({ useExample: true }, true));

  const onScreenshot = async (file: File | undefined) => {
    if (!file) return;
    needGate(() => {
      void (async () => {
        try {
          const dataUrl = await resizeImageFile(file);
          setScreenshot(dataUrl);
          await run({ imageDataUrl: dataUrl }, false);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not read the photo.");
          setPhase("input");
        }
      })();
    });
  };

  const openWhatsapp = () => {
    needGate(() => {
      window.open(whatsappShareUrl(note), "_blank", "noopener,noreferrer");
    });
  };

  const share = async () => {
    needGate(() => {
      void (async () => {
        try {
          await navigator.share({ text: note });
        } catch {
          // The person closed the share sheet; nothing to do.
        }
      })();
    });
  };

  const explanation = (result?.explanation ?? null) as Explanation | null;

  return (
    <section>
      <h2>{t.flowC.title}</h2>
      {usedExample && <p className="example-tag">{t.exampleLabel}</p>}
      {error && (
        <p className="warning" role="alert">
          {error}
        </p>
      )}

      {phase !== "done" ? (
        <div>
          <p className="big-text">{t.flowC.shareAdHint}</p>
          <label className="button-link" htmlFor="ad-photo">
            {t.flowC.uploadScreenshot}
          </label>
          <input
            id="ad-photo"
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="visually-hidden"
            onChange={(event) => void onScreenshot(event.target.files?.[0])}
          />
          {screenshot && !usedExample && <p className="muted">{t.common.savedOnPhone}</p>}
          <label className="field-label">
            {t.flowC.adTextLabel}
            <textarea
              rows={5}
              value={adText}
              placeholder={t.flowC.adTextPlaceholder}
              onChange={(event) => setAdText(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button type="button" className="primary" onClick={submitText}>
              {t.flowC.title}
            </button>
            <button type="button" data-testid="flow-c-example" onClick={useExample}>
              {t.flowC.useExampleAd}
            </button>
          </div>
          {phase === "loading" && <p className="big-text">{t.loading}</p>}
        </div>
      ) : null}

      {phase === "done" && result && (
        <div>
          <h3>{t.flowC.cuesTitle}</h3>
          {result.cues.length === 0 ? (
            <p className="big-text">{t.safety.noCuesSuffix}</p>
          ) : (
            <ul data-testid="scam-cues" className="confirm-list">
              {result.cues.map((cue, i) => (
                <li key={`${cue.cue}-${i}`}>
                  <strong>{t.cueKinds[cue.cue as keyof typeof t.cueKinds] ?? cue.cue}:</strong> <q>{cue.evidence}</q>
                </li>
              ))}
            </ul>
          )}

          <h3>{t.flowC.importantTitle}</h3>
          <p className="big-text">{t.flowC.adIntro}</p>
          <p data-testid="fixed-scam-wording" className="fixed-wording">
            {scamMessage(result.cues.map((cue) => cue.cue), lang)}
          </p>
          <SpeechControls text={scamMessage(result.cues.map((cue) => cue.cue), lang)} lang={lang} />

          <h3>{t.flowC.whyAdTitle}</h3>
          {explanation?.steps && (
            <ol className="steps-list">
              {explanation.steps.map((step, i) => (
                <li key={i}>
                  {step}{i === 1 && explanation.prefsUrl ? <> <a href={explanation.prefsUrl} target="_blank" rel="noopener noreferrer">{t.flowC.prefsLink}</a></> : null}
                  {i === 3 && explanation.adLibraryUrl ? <> <a href={explanation.adLibraryUrl} target="_blank" rel="noopener noreferrer">{t.flowC.adLibraryLink.replace("{advertiser}", explanation.advertiser ?? t.flowC.unknownAdvertiser)}</a></> : null}
                </li>
              ))}
            </ol>
          )}
          {explanation?.note && <p className="muted">{explanation.note}</p>}

          <h3>{t.flowC.draftTitle}</h3>
          <label className="field-label">
            {t.flowC.draftTitle}
            <textarea
              rows={4}
              value={note}
              placeholder={t.flowC.notePlaceholder}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button type="button" className="primary" onClick={openWhatsapp}>
              {t.flowC.openWhatsapp}
            </button>
            {canShare() && (
              <button type="button" onClick={() => void share()}>
                {t.flowC.shareButton}
              </button>
            )}
          </div>
        </div>
      )}

      <TracePanel trace={trace} />
    </section>
  );
}
