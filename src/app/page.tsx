"use client";

// Home screen and navigation: header with EN | ES toggle and the
// always-visible Get-help button, offline demo banner, three big flow
// buttons, "Delete everything" (with a confirm), and the data-notice gate
// that runs before the first upload/share/send.
import { useCallback, useRef, useState } from "react";
import FlowA from "@/components/FlowA";
import FlowB from "@/components/FlowB";
import FlowC from "@/components/FlowC";
import GetHelp from "@/components/GetHelp";
import MockBanner from "@/components/MockBanner";
import DataNoticeDialog, { isNoticeAccepted } from "@/components/DataNotice";
import { LangProvider, useLang } from "@/components/Lang";

type Screen = "home" | "help" | "A" | "B" | "C";

const OWNED_PREFIX = "oah.";

function clearAppStorage(): void {
  const owned: string[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (key && key.startsWith(OWNED_PREFIX)) owned.push(key);
  }
  for (const key of owned) window.localStorage.removeItem(key);
}

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
    clearAppStorage();
    // Keep the current language active after clearing.
    setLang(lang);
    setScreen("home");
  }, [lang, setLang, t.home.deleteConfirm]);

  return (
    <div>
      <header className="topbar">
        <p className="app-title">{t.appTitle}</p>
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
        <button type="button" className="help-button" onClick={openHelp}>
          {t.getHelpButton}
        </button>
      </header>

      <MockBanner />

      <main className="container">
        {screen === "home" && (
          <section>
            <p className="big-text">{t.home.subtitle}</p>
            <div className="button-column">
              <button
                type="button"
                className="primary big-button"
                onClick={() => setScreen("A")}
              >
                {t.home.appointmentLetter}
              </button>
              <button
                type="button"
                className="primary big-button"
                onClick={() => setScreen("B")}
              >
                {t.home.findGroup}
              </button>
              <button
                type="button"
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

        {(screen === "A" || screen === "B" || screen === "C") && (
          <div>
            <button type="button" onClick={() => setScreen("home")}>
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
