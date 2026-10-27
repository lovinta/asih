"use client";

// Flow B: find a group and plan to show up. Interest chips (starter chips,
// plus free text), optional ZIP/city, or a pasted listing / event-link text /
// screenshot, or the example listing -> POST /api/agent -> search terms and
// links, calendar types, listing summary with source and date -> confirm
// date/time/place -> showing-up plan (checklist, .ics, transport, tips) ->
// editable invite draft with WhatsApp / Share buttons plus plain steps for
// making a WhatsApp group.
import { useRef, useState } from "react";
import type { FlowInput, Lang, Step } from "@/lib/agent/types";
import type { FlowBResult } from "@/lib/agent/runFlow";
import { exportConfirmedICS, saveConfirmed, type ConfirmState } from "@/lib/confirm";
import { resizeImageFile } from "@/lib/images";
import { downloadTextFile, parseVisitDateTime } from "@/lib/visitDate";
import { whatsappShareUrl } from "@/lib/links";
import ConfirmStep from "./ConfirmStep";
import SpeechControls from "./SpeechControls";
import TracePanel from "./TracePanel";
import TransportLinks from "./TransportLinks";
import { useLang } from "./Lang";
import type { FlowProps } from "./FlowA";

interface Activities {
  terms?: string[];
  searchUrl?: string;
  calendars?: string[];
  summary?: { source?: string; name?: string; date?: string };
}

interface Plan {
  checklist?: { bring?: string[]; startPoint?: string };
  transitUrl?: string;
  meetTips?: string;
}

interface Invite {
  draft?: string;
  whatsappUrl?: string;
}

async function postAgent(flow: "B", input: FlowInput, lang: Lang) {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ flow, input, lang }),
  });
  const data = (await res.json()) as {
    trace?: Step[];
    result?: FlowBResult | { kind: "help" };
    error?: string;
  };
  if (!res.ok) throw new Error(data.error ?? "Request failed.");
  return data;
}

function canShare(): boolean {
  return typeof navigator !== "undefined" && "share" in navigator;
}

export default function FlowB({ lang, needGate, openHelp }: FlowProps) {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<"input" | "loading" | "confirm" | "done">("input");
  const [error, setError] = useState("");
  const [usedExample, setUsedExample] = useState(false);
  const [interest, setInterest] = useState("");
  const [place, setPlace] = useState("");
  const [listing, setListing] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [finalState, setFinalState] = useState<ConfirmState | null>(null);
  const [event, setEvent] = useState<FlowBResult["event"]>(null);
  const [activities, setActivities] = useState<Activities | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [inviteDraft, setInviteDraft] = useState("");
  const [names, setNames] = useState("");
  const [trace, setTrace] = useState<Step[]>([]);

  const run = async (input: FlowInput, example: boolean) => {
    setError("");
    setPhase("loading");
    try {
      const data = await postAgent("B", input, lang);
      if (data.result?.kind === "help") {
        setPhase("input");
        openHelp();
        return;
      }
      const result = data.result as FlowBResult;
      setUsedExample(example);
      setEvent(result.event);
      setConfirm(result.confirm);
      setActivities((result.activities ?? null) as Activities | null);
      setPlan((result.plan ?? null) as Plan | null);
      const invite = (result.invite ?? null) as Invite | null;
      setInviteDraft(invite?.draft ?? "");
      setTrace(data.trace ?? []);
      setPhase("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed.");
      setPhase("input");
    }
  };

  const buildInput = (example: boolean): FlowInput => ({
    text: interest.trim() || listing.trim() || "walking",
    interest: interest.trim() || "walking",
    ...(place.trim() ? { place: place.trim() } : {}),
    ...(listing.trim() ? { sharedText: listing.trim() } : {}),
    ...(screenshot ? { imageDataUrl: screenshot } : {}),
    ...(example ? { useExample: true } : {}),
  });

  const submit = () => needGate(() => void run(buildInput(false), false));
  const useExample = () => needGate(() => void run({ interest: "walking", useExample: true }, true));

  const onScreenshot = async (file: File | undefined) => {
    if (!file) return;
    needGate(() => {
      void (async () => {
        try {
          setScreenshot(await resizeImageFile(file));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not read the photo.");
        }
      })();
    });
  };

  const applyNames = () => {
    const trimmed = names.trim();
    if (!trimmed) return;
    setInviteDraft((prev) => `${prev} (${trimmed})`);
  };

  const openWhatsapp = () => {
    needGate(() => {
      window.open(whatsappShareUrl(inviteDraft), "_blank", "noopener,noreferrer");
    });
  };

  const share = async () => {
    needGate(() => {
      void (async () => {
        try {
          await navigator.share({ text: inviteDraft });
        } catch {
          // The person closed the share sheet; nothing to do.
        }
      })();
    });
  };

  const downloadIcs = () => {
    if (!finalState || !event) return;
    const start = parseVisitDateTime(event.date, event.time);
    if (!start) return;
    const ics = exportConfirmedICS(finalState, {
      title: event.name,
      start,
      end: new Date(start.getTime() + 2 * 60 * 60 * 1000),
      location: event.place,
    });
    downloadTextFile("event.ics", ics, "text/calendar");
  };

  const saved = finalState ? saveConfirmed(finalState) : {};
  const planText = [event?.name, plan?.meetTips ?? ""].filter(Boolean).join(". ");

  return (
    <section>
      <h2>{t.flowB.title}</h2>
      {usedExample && <p className="example-tag">{t.exampleLabel}</p>}
      {error && (
        <p className="warning" role="alert">
          {error}
        </p>
      )}

      {phase === "input" || phase === "loading" ? (
        <div>
          <p className="field-label">{t.flowB.interestLabel}</p>
          <p className="muted">{t.flowB.interestHint}</p>
          <div className="chip-row" role="group" aria-label={t.flowB.interestLabel}>
            {t.flowB.interests.map((chip) => (
              <button
                key={chip}
                type="button"
                className={interest === chip ? "chip selected" : "chip"}
                onClick={() => setInterest(chip)}
              >
                {chip}
              </button>
            ))}
          </div>
          <label className="field-label">
            {t.flowB.interestLabel}
            <input
              type="text"
              value={interest}
              placeholder={t.flowB.interestPlaceholder}
              onChange={(event) => setInterest(event.target.value)}
            />
          </label>
          <label className="field-label">
            {t.flowB.placeLabel}
            <input
              type="text"
              value={place}
              onChange={(event) => setPlace(event.target.value)}
            />
          </label>
          <p className="muted">{t.flowB.placeHint}</p>
          <label className="field-label">
            {t.flowB.listingLabel}
            <textarea
              rows={4}
              value={listing}
              placeholder={t.flowB.listingPlaceholder}
              onChange={(event) => setListing(event.target.value)}
            />
          </label>
          <label className="button-link" htmlFor="listing-photo">
            {t.flowB.uploadScreenshot}
          </label>
          <input
            id="listing-photo"
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="visually-hidden"
            onChange={(event) => void onScreenshot(event.target.files?.[0])}
          />
          {screenshot && <p className="muted">{t.common.savedOnPhone}</p>}
          <div className="button-row">
            <button type="button" className="primary" onClick={submit}>
              {t.flowB.findButton}
            </button>
            <button type="button" onClick={useExample}>
              {t.flowB.useExample}
            </button>
          </div>
          {phase === "loading" && <p className="big-text">{t.loading}</p>}
        </div>
      ) : null}

      {(phase === "confirm" || phase === "done") && (
        <div>
          <h3>{t.flowB.resultsTitle}</h3>
          {activities?.terms && (
            <div>
              <h4>{t.flowB.searchTermsTitle}</h4>
              <ul className="confirm-list">
                {activities.terms.map((term) => (
                  <li key={term}>{term}</li>
                ))}
              </ul>
              {activities.searchUrl && (
                <p>
                  <a href={activities.searchUrl} target="_blank" rel="noopener noreferrer">
                    {t.flowB.openSearch}
                  </a>
                </p>
              )}
              {activities.calendars && (
                <ul className="confirm-list">
                  {activities.calendars.map((cal) => (
                    <li key={cal}>{cal}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {event && (
            <div>
              <h4>{t.flowB.listingSummaryTitle}</h4>
              <p className="big-text">{event.name}</p>
              <p>
                {event.source} — {event.date}
              </p>
            </div>
          )}
        </div>
      )}

      {phase === "confirm" && confirm && (
        <ConfirmStep
          key={`${lang}-${confirm.items.length}`}
          initial={confirm}
          lang={lang}
          unreadableNote={t.flowA.unreadableNote}
          onDone={(state) => {
            setFinalState(state);
            setPhase("done");
          }}
        />
      )}

      {phase === "done" && finalState && event && (
        <div>
          <h3>{t.flowB.planTitle}</h3>
          <h4>{t.flowB.checklistTitle}</h4>
          <ul className="confirm-list">
            {(plan?.checklist?.bring ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
            {plan?.checklist?.startPoint && <li>{plan.checklist.startPoint}</li>}
          </ul>
          <SpeechControls text={planText} lang={lang} />
          {parseVisitDateTime(event.date, event.time) && (
            <div className="button-row">
              <button type="button" className="primary" onClick={downloadIcs}>
                {t.common.downloadIcs}
              </button>
            </div>
          )}
          <TransportLinks
            place={saved.place ?? event.place}
            transitUrl={plan?.transitUrl}
            rideNote={t.flowB.rideNote}
          />
          <h4>{t.flowB.meetTipsTitle}</h4>
          <p className="big-text">{plan?.meetTips ?? t.flowB.meetTips}</p>

          <h3>{t.flowB.inviteTitle}</h3>
          <p className="muted">{t.flowB.inviteHint}</p>
          <label className="field-label">
            {t.flowB.namesLabel}
            <input
              type="text"
              value={names}
              placeholder={t.flowB.namesPlaceholder}
              onChange={(event) => setNames(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button type="button" onClick={applyNames}>
              {t.flowB.namesLabel}
            </button>
          </div>
          <label className="field-label">
            {t.flowB.inviteTitle}
            <textarea
              data-testid="invite-draft"
              rows={5}
              value={inviteDraft}
              onChange={(event) => setInviteDraft(event.target.value)}
            />
          </label>
          <div className="button-row">
            <button type="button" className="primary" onClick={openWhatsapp}>
              {t.flowB.openWhatsapp}
            </button>
            {canShare() && (
              <button type="button" onClick={() => void share()}>
                {t.flowB.shareButton}
              </button>
            )}
          </div>
          <h4>{t.flowB.whatsappGroupTitle}</h4>
          <p className="big-text">{t.flowB.whatsappGroupNote}</p>
        </div>
      )}

      <TracePanel trace={trace} />
    </section>
  );
}
