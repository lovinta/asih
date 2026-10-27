"use client";

// Language state shared by the whole UI: switches all UI text (from
// src/i18n), the speech voice language, and the lang sent to /api routes.
// The <html> lang attribute follows the toggle.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import type { Lang } from "@/lib/agent/types";

export const LANG_STORAGE_KEY = "oah.lang";

interface LangContextValue {
  lang: Lang;
  t: typeof en;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextValue>({
  lang: "en",
  t: en,
  setLang: () => {},
});

function readStoredLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    return window.localStorage.getItem(LANG_STORAGE_KEY) === "es" ? "es" : "en";
  } catch {
    return "en";
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  // Lazy initializer reads the remembered language for the first render, so
  // no setState-in-effect is needed. Unknown visitors get "en", matching SSR.
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // Language still switches for this session; it just is not remembered.
    }
  }, [lang]);

  const setLang = useCallback((next: Lang) => setLangState(next), []);

  return (
    <LangContext.Provider value={{ lang, t: lang === "es" ? es : en, setLang }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  return useContext(LangContext);
}
