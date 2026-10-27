// POST {flow, input, lang, history?} -> runFlow result.
// Server-only: the META_API_KEY never leaves this route (it is only read by
// the server-side model client, and never included in any response).
import { runFlow } from "@/lib/agent/runFlow";
import type { FlowInput, FlowName, HistoryItem, Lang } from "@/lib/agent/types";

function isFlow(value: unknown): value is FlowName {
  return value === "A" || value === "B" || value === "C";
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
  if (!isFlow(flow)) {
    return Response.json({ error: 'flow must be "A", "B", or "C".' }, { status: 400 });
  }
  if (lang !== "en" && lang !== "es") {
    return Response.json({ error: 'lang must be "en" or "es".' }, { status: 400 });
  }
  if (typeof input !== "object" || input === null) {
    return Response.json({ error: "input must be an object." }, { status: 400 });
  }
  try {
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
