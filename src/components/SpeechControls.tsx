"use client";

// Speech controls used for every spoken reply: Read aloud, Repeat,
// Pause/Resume, and a speech-rate slider. The text is always shown.
import { useState } from "react";
import type { Lang } from "@/lib/agent/types";
import { DEFAULT_SPEECH_RATE, readAloud } from "@/lib/speech";
import { useLang } from "./Lang";

function canSpeak(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// showText=false when the screen already shows the same text in large type right above the controls.
export default function SpeechControls({ text, lang, showText = true }: { text: string; lang: Lang; showText?: boolean }) {
  const { t } = useLang();
  const [rate, setRate] = useState(DEFAULT_SPEECH_RATE[lang]);
  const [paused, setPaused] = useState(false);

  const read = () => {
    setPaused(false);
    readAloud(text, lang, rate);
  };

  const togglePause = () => {
    if (!canSpeak()) return;
    try {
      if (paused) {
        window.speechSynthesis.resume();
        setPaused(false);
      } else {
        window.speechSynthesis.pause();
        setPaused(true);
      }
    } catch {
      // Speech is best-effort; the text above is always visible.
    }
  };

  return (
    <div className="speech">
      {showText && <p className="speech-text">{text}</p>}
      <div className="button-row">
        <button type="button" onClick={read}>
          {t.readAloud}
        </button>
        <button type="button" onClick={read}>
          {t.repeat}
        </button>
        <button type="button" onClick={togglePause}>
          {paused ? t.resume : t.pause}
        </button>
      </div>
      <label className="slider-label">
        {t.speechRate}: {rate.toFixed(1)}
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.1}
          value={rate}
          onChange={(event) => setRate(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
