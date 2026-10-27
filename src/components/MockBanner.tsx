"use client";

// Offline demo banner. Shown when GET /api/mode reports mock mode. The
// endpoint returns {mock:boolean} only, never the API key.
import { useEffect, useState } from "react";
import { useLang } from "./Lang";

export default function MockBanner() {
  const { t } = useLang();
  const [mock, setMock] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/mode")
      .then((res) => res.json())
      .then((data: unknown) => {
        if (cancelled) return;
        const value =
          typeof data === "object" && data !== null && "mock" in data
            ? (data as { mock: unknown }).mock === true
            : false;
        setMock(value);
      })
      .catch(() => {
        if (!cancelled) setMock(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (mock !== true) return null;
  return (
    <p className="banner" role="status">
      {t.offlineBanner}
    </p>
  );
}
