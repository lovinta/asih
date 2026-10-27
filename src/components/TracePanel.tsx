"use client";

// Collapsible "How the agent worked" panel, shown on every flow result
// screen. Rendered from result.trace: {tool, summary, ok} steps only.
import type { Step } from "@/lib/agent/types";
import { useLang } from "./Lang";

export default function TracePanel({ trace }: { trace: Step[] }) {
  const { t } = useLang();
  if (trace.length === 0) return null;
  return (
    <details className="trace">
      <summary>{t.common.traceTitle}</summary>
      <ol>
        {trace.map((step, index) => (
          <li key={`${step.tool}-${index}`}>
            <strong>{step.tool}</strong>: {step.summary}{" "}
            <span className={step.ok ? "ok" : "not-ok"}>
              ({step.ok ? "ok" : "attention"})
            </span>
          </li>
        ))}
      </ol>
    </details>
  );
}
