"use client";

// Home screen and navigation: header with EN | ES toggle and the
// always-visible Get-help button, offline demo banner, three big flow
// buttons, "Delete everything" (with a confirm), and the data-notice gate
// that runs before the first upload/share/send.
import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import FlowA from "@/components/FlowA";
import FlowB from "@/components/FlowB";
import FlowC from "@/components/FlowC";
import GetHelp from "@/components/GetHelp";
import MockBanner from "@/components/MockBanner";
import SpeechControls from "@/components/SpeechControls";
import DataNoticeDialog, { isNoticeAccepted } from "@/components/DataNotice";
import VoiceNote from "@/components/VoiceNote";
import ActivityNotes from "@/components/ActivityNotes";
import { clearAppStorage } from "@/lib/activityNotes";
import { LangProvider, useLang } from "@/components/Lang";

type Screen = "home" | "help" | "A" | "B" | "C" | "voice" | "activity";

function App() {
  const { lang, t, setLang } = useLang();
  const [screen, setScreen] = useState<Screen>("home");
  const [noticeOpen, setNoticeOpen] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  // Gate every upload/share/send: continue only after "I understand".
  const needGate = useCallback((run: () => void) => {
    if (isNoticeAccepted()) {
      run();
    } else {
      pending.current = run;
      setNoticeOpen(true);
    }
  }, []);

  const acknowledgeNotice = useCallback(() => {
    setNoticeOpen(false);
    const run = pending.current;
    pending.current = null;
    if (run) run();
  }, []);

  const openHelp = useCallback(() => setScreen("help"), []);

  const deleteEverything = useCallback(() => {
    if (!window.confirm(t.home.deleteConfirm)) return;
    clearAppStorage(window.localStorage);
    // Keep the current language active after clearing.
    setLang(lang);
    setScreen("home");
  }, [lang, setLang, t.home.deleteConfirm]);

  return (
    <div>
      <header className="topbar">
        <div className="brand">
          <Image className="brand-avatar" src="/asih-avatar.svg" alt={t.avatarAlt} width={48} height={48} priority />
          <p className="app-title">{t.appTitle}</p>
        </div>
        <div
          className="lang-toggle"
          role="group"
          aria-label={t.languageToggle}
        >
          <button
            type="button"
            aria-pressed={lang === "en"}
            className={lang === "en" ? "selected" : ""}
            onClick={() => setLang("en")}
          >
            EN
          </button>
          <button
            type="button"
            aria-pressed={lang === "es"}
            className={lang === "es" ? "selected" : ""}
            onClick={() => setLang("es")}
          >
            ES
          </button>
        </div>
        <button type="button" data-testid="get-help" className="help-button" onClick={openHelp}>
          {t.getHelpButton}
        </button>
      </header>

      <MockBanner />

      <main className="container">
        {screen === "home" && (
          <section>
            <p className="big-text intro-text">{t.intro}</p>
            <SpeechControls text={t.intro} lang={lang} />
            <p className="big-text">{t.home.subtitle}</p>
            <div className="button-column">
              <button
                type="button"
                data-testid="flow-a"
                className="primary big-button"
                onClick={() => setScreen("A")}
              >
                {t.home.appointmentLetter}
              </button>
              <button type="button" data-testid="voice-note" className="primary big-button" onClick={() => setScreen("voice")}>
                {t.home.voiceNote}
              </button>
              <button type="button" data-testid="activity-notes" className="primary big-button" onClick={() => setScreen("activity")}>{t.home.activityNotes}</button>
              <button
                type="button"
                data-testid="flow-b"
                className="primary big-button"
                onClick={() => setScreen("B")}
              >
                {t.home.findGroup}
              </button>
              <button
                type="button"
                data-testid="flow-c"
                className="primary big-button"
                onClick={() => setScreen("C")}
              >
                {t.home.checkAd}
              </button>
            </div>
            <div className="button-column">
              <button type="button" onClick={() => setNoticeOpen(true)}>
                {t.home.readNoticeAgain}
              </button>
              <button type="button" className="danger" onClick={deleteEverything}>
                {t.deleteEverything}
              </button>
            </div>
          </section>
        )}

        {screen === "help" && <GetHelp onBack={() => setScreen("home")} />}

        {screen === "voice" && <div><button type="button" data-testid="screen-back" onClick={() => setScreen("home")}>{t.back}</button><VoiceNote lang={lang} needGate={needGate} openHelp={openHelp} openAdCheck={() => setScreen("C")} openAppointment={() => setScreen("A")} openGroups={() => setScreen("B")} /></div>}
        {screen === "activity" && <div><button type="button" data-testid="screen-back" onClick={() => setScreen("home")}>{t.back}</button><ActivityNotes /></div>}

        {(screen === "A" || screen === "B" || screen === "C") && (
          <div>
            <button type="button" data-testid="screen-back" onClick={() => setScreen("home")}>
              {t.back}
            </button>
            {screen === "A" && (
              <FlowA lang={lang} needGate={needGate} openHelp={openHelp} />
            )}
            {screen === "B" && (
              <FlowB lang={lang} needGate={needGate} openHelp={openHelp} />
            )}
            {screen === "C" && (
              <FlowC lang={lang} needGate={needGate} openHelp={openHelp} />
            )}
          </div>
        )}
      </main>

      {noticeOpen && (
        <DataNoticeDialog lang={lang} onAcknowledge={acknowledgeNotice} />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <LangProvider>
      <App />
    </LangProvider>
  );
}
