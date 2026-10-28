// POST {flow, input, lang, history?} -> runFlow result.
// Server-only: the META_API_KEY never leaves this route (it is only read by
// the server-side model client, and never included in any response).
import { runFlow } from "@/lib/agent/runFlow";
import { classifyIntent } from "@/lib/agent/intent";
import { redFlagPrescreen } from "@/lib/safety/prescreen";
import type { FlowInput, FlowName, HistoryItem, Lang } from "@/lib/agent/types";

function isFlow(value: unknown): value is FlowName {
  return value === "A" || value === "B" || value === "C";
}

function isRouteFlow(value: unknown): value is FlowName | "auto" {
  return value === "auto" || isFlow(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { flow, input, lang, history } = (body ?? {}) as {
    flow?: unknown;
    input?: unknown;
    lang?: unknown;
    history?: unknown;
  };
  if (!isRouteFlow(flow)) {
    return Response.json({ error: 'flow must be "A", "B", "C", or "auto".' }, { status: 400 });
  }
  if (lang !== "en" && lang !== "es") {
    return Response.json({ error: 'lang must be "en" or "es".' }, { status: 400 });
  }
  if (typeof input !== "object" || input === null) {
    return Response.json({ error: "input must be an object." }, { status: 400 });
  }
  if (flow === "auto" && typeof (input as { text?: unknown }).text !== "string") {
    return Response.json({ error: 'input.text is required when flow is "auto".' }, { status: 400 });
  }
  try {
    if (flow === "auto") {
      const text = (input as { text: string }).text;
      const screen = redFlagPrescreen(text, "person");
      if (screen.flagged) {
        return Response.json({ trace: [{ tool: "prescreen", summary: "Redirected to Get help.", ok: false }], result: { kind: "help", matched: screen.matched }, history: [], routed: null });
      }
      const routed = await classifyIntent(text, lang as Lang);
      const trace = [{ tool: "classify_intent", summary: routed.intent, ok: true }];
      if (routed.intent === "scam_ad") return Response.json({ trace, result: { kind: "phone_ad" }, history: [], routed });
      if (routed.intent === "unknown") return Response.json({ trace, result: { kind: "unknown" }, history: [], routed });
      const selected: FlowName = routed.intent === "appointment" ? "A" : "B";
      const output = await runFlow(selected, input as FlowInput, lang as Lang, Array.isArray(history) ? history as HistoryItem[] : []);
      return Response.json({ ...output, trace: [...trace, ...output.trace], routed });
    }
    const { trace, result, history: next } = await runFlow(
      flow,
      input as FlowInput,
      lang as Lang,
      Array.isArray(history) ? (history as HistoryItem[]) : [],
    );
    return Response.json({ trace, result, history: next });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent failed.";
    const status = message.includes("spend cap") ? 429 : 500;
    return Response.json({ error: message }, { status });
  }
}
