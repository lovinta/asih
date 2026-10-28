"use client";
import { useRef, useState } from "react";
import type { Step } from "@/lib/agent/types";
import type { FlowAResult, FlowBResult } from "@/lib/agent/runFlow";
import { audioBufferToWav, encodeWav, resampleMono } from "@/lib/wav";
import { whatsappShareUrl } from "@/lib/links";
import { redFlagPrescreen } from "@/lib/safety/prescreen";
import { EXAMPLE_VOICE_TRANSCRIPT_EN, EXAMPLE_VOICE_TRANSCRIPT_ES } from "@/fixtures/voiceTranscript";
import ConfirmStep from "./ConfirmStep";
import GetHelp from "./GetHelp";
import SpeechControls from "./SpeechControls";
import TracePanel from "./TracePanel";
import { useLang } from "./Lang";
import type { FlowProps } from "./FlowA";

type Routed = { kind: string; confirm?: FlowAResult["confirm"]; event?: FlowBResult["event"]; activities?: { summary?: { source?: string } }; plan?: { meetTips?: string }; matched?: string };
export default function VoiceNote({ lang, needGate, openHelp, openAdCheck, openAppointment, openGroups }: FlowProps & { openAdCheck: () => void; openAppointment: () => void; openGroups: () => void }) {
  const { t } = useLang();
  const [wav, setWav] = useState<Uint8Array | null>(null);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyOpen, setReplyOpen] = useState(false);
  const [routed, setRouted] = useState<Routed | null>(null);
  const [trace, setTrace] = useState<Step[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const stopTimer = useRef<number | null>(null);
  const recordingRef = useRef(false);
  const transcriptExample = lang === "es" ? EXAMPLE_VOICE_TRANSCRIPT_ES : EXAMPLE_VOICE_TRANSCRIPT_EN;

  const sendAudio = async (bytes: Uint8Array) => {
    setBusy(true); setError("");
    try {
      const form = new FormData(); form.append("audio", new Blob([bytes as unknown as BlobPart], { type: "audio/wav" }), "voice.wav"); form.append("lang", lang);
      const response = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await response.json() as { transcript?: string; error?: string };
      if (!response.ok) throw new Error(data.error ?? t.voice.transcribeError);
      const text = data.transcript ?? ""; setTranscript(text); setWav(bytes); setDraft(""); setRouted(null);
      if (redFlagPrescreen(text, "person").flagged) openHelp();
    } catch (err) { setError(err instanceof Error ? err.message : t.voice.transcribeError); }
    finally { setBusy(false); }
  };
  const upload = (file?: File) => {
    if (!file) return;
    needGate(() => void (async () => {
      try { const context = new AudioContext(); const decoded = await context.decodeAudioData(await file.arrayBuffer()); const bytes = audioBufferToWav(decoded); await context.close(); await sendAudio(bytes); }
      catch { setError(t.voice.decodeError); }
    })());
  };
  const beginRecording = async () => {
    try {
      recordingRef.current = true; setRecording(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); streamRef.current = stream;
      if (!recordingRef.current) { stream.getTracks().forEach((track) => track.stop()); return; }
      const context = new AudioContext(); ctxRef.current = context; const source = context.createMediaStreamSource(stream); sourceRef.current = source;
      const processor = context.createScriptProcessor(4096, 2, 1); processorRef.current = processor; chunksRef.current = [];
      processor.onaudioprocess = (event) => { const channels = Array.from({ length: event.inputBuffer.numberOfChannels }, (_, i) => new Float32Array(event.inputBuffer.getChannelData(i))); chunksRef.current.push(resampleMono(channels, context.sampleRate)); };
      source.connect(processor); processor.connect(context.destination);
      // TODO: confirm Voice Transcribe's max audio length in Meta docs; I could not verify it.
      stopTimer.current = window.setTimeout(() => void stop(), 120000);
    } catch { recordingRef.current = false; setRecording(false); setError(t.voice.micError); }
  };
  const start = () => needGate(() => { void beginRecording(); });
  const stop = async () => {
    if (!recording && !processorRef.current) return;
    recordingRef.current = false;
    if (stopTimer.current) window.clearTimeout(stopTimer.current);
    const processor = processorRef.current; if (processor) { processor.disconnect(); processor.onaudioprocess = null; }
    sourceRef.current?.disconnect(); streamRef.current?.getTracks().forEach((track) => track.stop());
    const context = ctxRef.current; const rate = context?.sampleRate ?? 16000;
    await context?.close(); processorRef.current = null; sourceRef.current = null; ctxRef.current = null; streamRef.current = null; setRecording(false);
    const parts = chunksRef.current; const size = parts.reduce((sum, part) => sum + part.length, 0); const samples = new Float32Array(size); let offset = 0;
    for (const part of parts) { samples.set(part, offset); offset += part.length; }
    if (samples.length) await sendAudio(encodeWav(samples, 16000));
    void rate;
  };
  const useExample = () => needGate(() => {
    setTranscript(transcriptExample); setWav(null); setDraft(""); setRouted(null);
    if (redFlagPrescreen(transcriptExample, "person").flagged) openHelp();
  });
  const ask = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/agent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ flow: "auto", lang, input: { text: transcript } }) });
      const data = await response.json() as { result?: Routed; trace?: Step[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? t.voice.transcribeError);
      if (data.result?.kind === "help") { openHelp(); return; }
      setRouted(data.result ?? null); setTrace(data.trace ?? []);
    } catch (err) { setError(err instanceof Error ? err.message : t.voice.transcribeError); }
    finally { setBusy(false); }
  };
  const share = async () => { if (navigator.share) await navigator.share({ text: draft }); };
  if (routed?.kind === "help") return <GetHelp onBack={() => setRouted(null)} />;
  return <section>
    <h1>{t.voice.title}</h1>
    {!transcript && <>
      <div className="button-column">
        <button type="button" className="primary big-button" disabled={busy} onClick={recording ? () => void stop() : start}>{recording ? t.voice.stopRecording : t.voice.startRecording}</button>
        <label className="button-link" htmlFor="voice-upload">{t.voice.uploadVoice}</label>
        <input id="voice-upload" type="file" accept="audio/*" className="visually-hidden" onChange={(event) => upload(event.target.files?.[0])} />
        <button type="button" onClick={useExample}>{t.voice.useExample}</button>
      </div>
    </>}
    {busy && <p>{t.loading}</p>}{error && <p role="alert" className="warning">{error}</p>}
    {transcript && <>
      {!wav && <p className="example-tag">{t.exampleLabel}</p>}
      <h2>{t.voice.transcriptTitle}</h2><p className="big-text" data-testid="voice-transcript">{transcript}</p><SpeechControls text={transcript} lang={lang} />
      {!routed && <div className="button-column"><button type="button" className="primary big-button" disabled={busy} onClick={() => setReplyOpen(true)}>{t.voice.replyDraftTitle}</button>{replyOpen && <><textarea aria-label={t.voice.replyDraftTitle} data-testid="voice-draft" placeholder={t.voice.replyPlaceholder} value={draft} onChange={(e) => setDraft(e.target.value)} /><button type="button" disabled={!draft.trim()} onClick={() => window.open(whatsappShareUrl(draft), "_blank", "noopener,noreferrer")}>{t.voice.openWhatsapp}</button>{"share" in navigator && <button type="button" disabled={!draft.trim()} onClick={() => void share()}>{t.voice.shareButton}</button>}</>}<button type="button" disabled={busy} onClick={() => void ask()}>{t.voice.askAsih}</button></div>}
      {routed?.kind === "A" && routed.confirm && <ConfirmStep initial={routed.confirm} lang={lang} unreadableNote={t.flowA.unreadableNote} onDone={() => undefined} />}
      {routed?.kind === "B" && <div className="big-text"><p>{routed.event?.name}</p><p>{routed.event?.date} {routed.event?.time} {routed.event?.place}</p><p>{routed.activities?.summary?.source}</p><p>{routed.plan?.meetTips}</p></div>}
      {routed?.kind === "phone_ad" && <><p className="big-text">{t.voice.phoneAd}</p><button type="button" className="big-button" onClick={openAdCheck}>{t.voice.openAdCheck}</button></>}
      {routed?.kind === "unknown" && <><p className="big-text">{t.voice.unknown}</p><div className="button-column"><button type="button" onClick={openAppointment}>{t.voice.openAppointment}</button><button type="button" onClick={openGroups}>{t.voice.openGroups}</button><button type="button" onClick={openAdCheck}>{t.voice.openAdCheck}</button></div></>}
      {routed && <TracePanel trace={trace} />}
    </>}
  </section>;
}
