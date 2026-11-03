// runFlow(flow, input, lang, history?) → { trace, result, history }.
// Fixed multi-step agent tool loop (max 8 model steps), not open chat.
// Code (not the model) starts the image path: Flow A always calls
// read_document first in code, Flow C always calls read_ad first in code,
// then the model gets the extracted fields. Stateless replay: the history
// array is resent every turn and returned so the caller keeps it.
import { createResponse, SPARK_MODEL } from "../meta/client";
import { isMockMode } from "../meta/mode";
import { mockModelTurn } from "../meta/mock";
import {
  TOOLS_BY_FLOW,
  executeTool,
  dataBlock,
  langInstructions,
  type ScamCue,
  type SharedEventSummary,
} from "./tools";
import type {
  FlowInput,
  FlowName,
  HistoryItem,
  Lang,
  ResponseOutputItem,
  Step,
} from "./types";
import type { LetterField } from "@/fixtures/letter";
import { EXAMPLE_EVENT } from "@/fixtures/event";
import { EXAMPLE_AD_TEXT, EXAMPLE_ADVERTISER } from "@/fixtures/ad";
import { redFlagPrescreen } from "../safety/prescreen";
import { outputGuard } from "../safety/outputGuard";
import {
  scamMessage,
  FIXED_SCAM_WORDING_EN,
  FIXED_SCAM_WORDING_ES,
  NO_CUES_SUFFIX_EN,
  NO_CUES_SUFFIX_ES,
} from "../safety/scamWording";
import { createConfirmState, saveConfirmed, type ConfirmState } from "../confirm";
import {
  transitDirectionsUrl,
  E211_PHONE,
  E211_URL,
  ELDERCARE_PHONE,
  ELDERCARE_URL,
} from "../links";

export { dataBlock };

export const MAX_MODEL_STEPS = 8;

export interface FlowAResult {
  kind: "A";
  fields: LetterField[];
  // Pending until the person confirms one item at a time in the UI.
  confirm: ConfirmState;
  // Always null here: unconfirmed items are never saved or exported.
  savedVisit: null;
  ics: null;
  transport: { transitUrl: string; tel211: string; url211: string; eldercare: string; eldercarePhone: string };
  questions: string[];
}

export interface FlowBResult {
  kind: "B";
  // The shared/suggested event, or null when LIVE search returned no event.
  // Fixtures only appear here in mock/example mode, never live.
  event: SharedEventSummary | null;
  // The event's date/time/place, pending until the person confirms each one.
  confirm: ConfirmState;
  activities: unknown;
  plan: unknown;
  invite: unknown;
  // Always null here: nothing is exported until every item is confirmed.
  // The UI calls exportConfirmedICS after confirmation.
  ics: null;
}

export interface FlowCResult {
  kind: "C";
  cues: ScamCue[];
  explanation: unknown;
  message: string;
  draft: unknown;
  guardPassed: boolean;
}

export interface HelpResult {
  kind: "help";
  matched?: string;
}

export type FlowResultData = FlowAResult | FlowBResult | FlowCResult | HelpResult;

export interface RunFlowOutput {
  trace: Step[];
  result: FlowResultData;
  history: HistoryItem[];
}

export interface Ctx {
  docFields: LetterField[];
  confirm: ConfirmState | null;
  event: SharedEventSummary | null;
  adText: string;
  advertiser: string;
  questions: string[];
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    // Fall through to empty args.
  }
  return {};
}

// Fill in arguments the mock script omits from what code already knows.
// Confirmed-only rule: build_visit_list and set_reminder receive only values
// the person already confirmed (via saveConfirmed), never raw model output.
export function fillArgs(
  name: string,
  args: Record<string, unknown>,
  input: FlowInput,
  ctx: Ctx,
): Record<string, unknown> {
  if (name === "scam_cues" && !args.adText) return { ...args, adText: ctx.adText };
  if (name === "explain_ad" && !args.advertiser)
    return { ...args, advertiser: ctx.advertiser };
  if (name === "draft_message" && !args.advertiser)
    return { ...args, advertiser: ctx.advertiser };
  if (name === "find_activities") {
    return {
      interest: input.interest ?? "walking",
      ...(input.place ? { place: input.place } : {}),
      ...(input.sharedText ? { sharedListing: input.sharedText } : {}),
      ...(input.imageDataUrl ? { imageDataUrl: input.imageDataUrl } : {}),
      ...args,
    };
  }
  if (name === "build_visit_list" && ctx.confirm) {
    return { fields: saveConfirmed(ctx.confirm) };
  }
  if (name === "set_reminder" && ctx.confirm) {
    const confirmed = saveConfirmed(ctx.confirm);
    const values = Object.values(confirmed);
    const when =
      typeof args.when === "string" && values.includes(args.when)
        ? String(args.when)
        : [confirmed.date, confirmed.time].filter(Boolean).join(" ").trim();
    const title =
      typeof args.title === "string" && args.title
        ? String(args.title)
        : String(confirmed.place ?? confirmed.clinic_name ?? "");
    return { title, when };
  }
  if (name === "plan_showing_up") {
    const fromEvent = ctx.event
      ? {
          eventName: ctx.event.name,
          place: ctx.event.place,
          bring: ctx.event.bring,
          startPoint: ctx.event.startPoint,
        }
      : {};
    // Fixture defaults only in mock mode; live uses the shared listing.
    const mockFallback =
      !ctx.event && isMockMode()
        ? { eventName: EXAMPLE_EVENT.name, place: EXAMPLE_EVENT.place }
        : {};
    return { ...fromEvent, ...mockFallback, ...args };
  }
  if (name === "draft_invite") {
    // Confirmed event values are the defaults; explicitly passed values win.
    const fromEvent = ctx.event
      ? {
          eventName: ctx.event.name,
          date: ctx.event.date,
          time: ctx.event.time,
          place: ctx.event.place,
        }
      : {};
    const mockFallback =
      !ctx.event && isMockMode() ? { eventName: EXAMPLE_EVENT.name } : {};
    return { ...fromEvent, ...mockFallback, ...args };
  }
  return args;
}

function finalTextOf(output: ResponseOutputItem[]): string {
  return output
    .filter((item) => item.type === "message")
    .map((item) =>
      item.type === "message"
        ? item.content.map((part) => part.text).join("")
        : "",
    )
    .join("\n");
}

// Flow C must always end with the fixed wording, even if the model (or an
// injected ad) tried to say otherwise.
// When no cues were found, the "That doesn't mean it's safe." suffix must follow
// the fixed wording too, even if the model already wrote the fixed wording.
function ensureFixedWording(text: string, cues: string[], lang: Lang): string {
  for (const [fixed, suffix] of [
    [FIXED_SCAM_WORDING_EN, NO_CUES_SUFFIX_EN],
    [FIXED_SCAM_WORDING_ES, NO_CUES_SUFFIX_ES],
  ] as const) {
    if (!text.includes(fixed)) continue;
    if (cues.length > 0 || text.includes(`${fixed} ${suffix}`)) return text;
    return text.replace(fixed, `${fixed} ${suffix}`);
  }
  return `${text}\n\n${scamMessage(cues, lang)}`;
}

// Flow C message shown to the person. A guard failure still shows the fixed
// scam wording (with the detected cues) — never the generic safe reply — and
// the quoted cue evidence in `cues` is kept for the UI.
export function resolveFlowCMessage(opts: {
  modelText: string;
  cues: ScamCue[];
  lang: Lang;
  guardPass: boolean;
}): string {
  const cueNames = opts.cues.map((c) => c.cue);
  if (!opts.guardPass) return scamMessage(cueNames, opts.lang);
  return ensureFixedWording(
    opts.modelText || scamMessage(cueNames, opts.lang),
    cueNames,
    opts.lang,
  );
}

async function liveModelTurn(
  flow: FlowName,
  history: HistoryItem[],
  lang: Lang,
): Promise<{ output: ResponseOutputItem[] }> {
  // Language goes in `instructions`, resent every turn. The person's words
  // are a single user message already in history (added once, not per turn).
  const response = await createResponse(
    {
      model: SPARK_MODEL,
      instructions: langInstructions(lang),
      input: history,
      tools: TOOLS_BY_FLOW[flow],
      tool_choice: "auto",
      store: false,
      include: ["reasoning.encrypted_content"],
    },
    { flow: `flow-${flow}`, step: "model-turn" },
  );
  return { output: response.output };
}

// Live second output-guard check via muse-spark-1.3, returning {pass}.
export async function liveGuardCheck(text: string, lang: Lang): Promise<{ pass: boolean }> {
  try {
    const response = await createResponse(
      {
        model: SPARK_MODEL,
        instructions: langInstructions(lang),
        input: [
          {
            type: "message",
            role: "user",
            content:
              `Reply with JSON {"pass": boolean}. Pass means: no diagnosis, treatment, dose, efficacy/cure claim, and no verdict that something is safe or a scam.\n${dataBlock(text)}`,
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "guard",
            schema: {
              type: "object",
              properties: { pass: { type: "boolean" } },
              required: ["pass"],
              additionalProperties: false,
            },
            strict: true,
          },
        },
        store: false,
        include: ["reasoning.encrypted_content"],
      },
      { flow: "guard", step: "live-check" },
    );
    const raw = finalTextOf(response.output);
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "pass" in parsed) {
      return { pass: (parsed as { pass: unknown }).pass === true };
    }
    return { pass: false };
  } catch {
    return { pass: false };
  }
}

function outputGuardSummary(guard: { pass: boolean; reasons: string[] }): string {
  if (!guard.pass) return `Blocked: ${guard.reasons.join(", ") || "unknown"}.`;
  return isMockMode() ? "Rules only (mock mode)." : "Rules plus live check.";
}

function exampleEventSummary(): SharedEventSummary {
  return {
    name: EXAMPLE_EVENT.name,
    date: EXAMPLE_EVENT.date,
    time: EXAMPLE_EVENT.time,
    place: EXAMPLE_EVENT.place,
    source: EXAMPLE_EVENT.source,
    bring: [...EXAMPLE_EVENT.bring],
    startPoint: EXAMPLE_EVENT.startPoint,
  };
}

export async function runFlow(
  flow: FlowName,
  input: FlowInput,
  lang: Lang,
  history: HistoryItem[] = [],
): Promise<RunFlowOutput> {
  const trace: Step[] = [];
  const replay: HistoryItem[] = [...history];
  const ctx: Ctx = {
    docFields: [],
    confirm: null,
    event: null,
    adText: "",
    advertiser: "unknown",
    questions: [],
  };

  // 1. Red-flag prescreen on the person's own words, before the agent.
  if (input.text) {
    const screen = redFlagPrescreen(input.text, "person");
    if (screen.flagged) {
      trace.push({ tool: "prescreen", summary: "Redirected to Get help.", ok: false });
      return { trace, result: { kind: "help", matched: screen.matched }, history: replay };
    }
  }

  // 2. Code starts the image path (tool_choice is auto-only).
  if (flow === "A") {
    const docArgs =
      input.useExample || (!input.imageDataUrl && !input.text)
        ? { example: true }
        : input.imageDataUrl
          ? { imageDataUrl: input.imageDataUrl }
          : { text: input.text ?? "" };
    const doc = (await executeTool("read_document", docArgs, lang)) as {
      fields: LetterField[];
    };
    ctx.docFields = doc.fields;
    ctx.confirm = createConfirmState(
      doc.fields.map((f, i) => ({
        id: `${f.kind}-${i}`,
        field: f.kind,
        value: f.value,
        readable: f.readable,
      })),
    );
    replay.push(
      { type: "function_call", call_id: "code-read-document", name: "read_document", arguments: JSON.stringify(docArgs) },
      { type: "function_call_output", call_id: "code-read-document", output: JSON.stringify(doc) },
    );
    trace.push({ tool: "read_document", summary: "Letter fields extracted.", ok: true });
  }
  if (flow === "C") {
    const adArgs =
      input.useExample || (!input.imageDataUrl && !input.sharedText)
        ? { example: true }
        : input.imageDataUrl
          ? { imageDataUrl: input.imageDataUrl }
          : { adText: input.sharedText ?? "" };
    const ad = (await executeTool("read_ad", adArgs, lang)) as {
      text: string;
      advertiser: string;
    };
    if (isMockMode()) {
      ctx.adText = ad.text || EXAMPLE_AD_TEXT;
      ctx.advertiser = ad.advertiser !== "unknown" ? ad.advertiser : EXAMPLE_ADVERTISER;
    } else {
      ctx.adText = ad.text || input.sharedText || "";
      ctx.advertiser = ad.advertiser || "unknown";
    }
    replay.push(
      { type: "function_call", call_id: "code-read-ad", name: "read_ad", arguments: JSON.stringify({ ...adArgs, adText: "[ad data]" }) },
      { type: "function_call_output", call_id: "code-read-ad", output: JSON.stringify(ad) },
    );
    trace.push({ tool: "read_ad", summary: "Ad text extracted.", ok: true });
  }

  // First-turn user content: person's words + DATA-delimited shared text.
  // Appended once at the start of replay, not re-sent as a new message turn.
  const userContent =
    flow === "B"
      ? [
          input.text ?? `Interest: ${input.interest ?? "walking"}`,
          input.sharedText ? dataBlock(input.sharedText) : "",
        ]
          .filter(Boolean)
          .join("\n")
      : (input.text ?? "");
  if (
    userContent &&
    !replay.some((item) => item.type === "message" && item.role === "user")
  ) {
    replay.push({ type: "message", role: "user", content: userContent });
  }

  const outputs: Record<string, unknown> = {};

  // 3. Model tool loop, max 8 steps.
  for (let step = 0; step < MAX_MODEL_STEPS; step++) {
    const turn = isMockMode()
      ? mockModelTurn(flow, replay, lang)
      : await liveModelTurn(flow, replay, lang);
    const calls = turn.output.filter((item) => item.type === "function_call");
    for (const item of turn.output) {
      if (item.type === "reasoning") replay.push({ type: "reasoning", encrypted_content: item.encrypted_content, summary: [] });
      else if (item.type === "message")
        replay.push({
          type: "message",
          role: "assistant",
          content: item.content.map((part) => ({ type: "output_text" as const, text: part.text })),
          ...(item.phase ? { phase: item.phase } : {}),
        });
      else replay.push({ type: "function_call", call_id: item.call_id, name: item.name, arguments: item.arguments });
    }
    if (calls.length === 0) {
      return finish(flow, lang, replay, trace, outputs, finalTextOf(turn.output), ctx);
    }
    for (const callItem of calls) {
      if (callItem.type !== "function_call") continue;
      const result = await executeTool(
        callItem.name,
        fillArgs(callItem.name, parseArgs(callItem.arguments), input, ctx),
        lang,
      );
      outputs[callItem.name] = result;
      if (callItem.name === "add_question") {
        const stored = (result as { stored?: unknown }).stored;
        if (typeof stored === "string" && stored) ctx.questions.push(stored);
      }
      if (callItem.name === "find_activities") {
        const summary = (result as { summary?: Partial<SharedEventSummary> }).summary;
        if (
          summary &&
          typeof summary.name === "string" && summary.name &&
          typeof summary.date === "string" && summary.date &&
          typeof summary.time === "string" && summary.time &&
          typeof summary.place === "string" && summary.place
        ) {
          ctx.event = {
            name: summary.name,
            date: summary.date,
            time: summary.time,
            place: summary.place,
            source: typeof summary.source === "string" ? summary.source : "",
            bring: Array.isArray(summary.bring)
              ? summary.bring.filter((b): b is string => typeof b === "string")
              : [],
            startPoint: typeof summary.startPoint === "string" ? summary.startPoint : "",
          };
        } else if (isMockMode()) {
          const example = (result as { example?: unknown }).example;
          if (example) ctx.event = exampleEventSummary();
        }
      }
      replay.push({
        type: "function_call_output",
        call_id: callItem.call_id,
        output: JSON.stringify(result),
      });
      trace.push({ tool: callItem.name, summary: `${callItem.name} done.`, ok: true });
    }
  }
  trace.push({ tool: "limit", summary: "Stopped after 8 model steps.", ok: false });
  return finish(flow, lang, replay, trace, outputs, "", ctx);
}

async function finish(
  flow: FlowName,
  lang: Lang,
  replay: HistoryItem[],
  trace: Step[],
  outputs: Record<string, unknown>,
  modelText: string,
  ctx: Ctx,
): Promise<RunFlowOutput> {
  if (flow === "A") {
    const place = ctx.docFields.find((f) => f.kind === "place")?.value ?? "";
    const confirm =
      ctx.confirm ??
      createConfirmState(
        ctx.docFields.map((f, i) => ({
          id: `${f.kind}-${i}`,
          field: f.kind,
          value: f.value,
          readable: f.readable,
        })),
      );
    const guard = await outputGuard(modelText || "Letter read.", {
      liveCheck: isMockMode() ? undefined : (text) => liveGuardCheck(text, lang),
    });
    trace.push({
      tool: "output_guard",
      summary: outputGuardSummary(guard),
      ok: guard.pass,
    });
    return {
      trace,
      result: {
        kind: "A",
        fields: ctx.docFields,
        confirm,
        // Unconfirmed: nothing saved, no .ics yet. The UI confirms first.
        savedVisit: null,
        ics: null,
        transport: {
          transitUrl: transitDirectionsUrl(place),
          tel211: E211_PHONE,
          url211: E211_URL,
          eldercare: ELDERCARE_URL,
          eldercarePhone: ELDERCARE_PHONE,
        },
        questions: ctx.questions,
      },
      history: replay,
    };
  }
  if (flow === "B") {
    const guard = await outputGuard(modelText || "Plan ready.", {
      liveCheck: isMockMode() ? undefined : (text) => liveGuardCheck(text, lang),
    });
    trace.push({
      tool: "output_guard",
      summary: outputGuardSummary(guard),
      ok: guard.pass,
    });
    // Fixture events only in mock mode; live uses the shared listing summary.
    const event = ctx.event ?? (isMockMode() ? exampleEventSummary() : null);
    // The event's date/time/place confirm exactly like Flow A, one at a time.
    const confirm = createConfirmState(
      event
        ? [
            { id: "date-0", field: "date", value: event.date, readable: event.date !== "" },
            { id: "time-0", field: "time", value: event.time, readable: event.time !== "" },
            { id: "place-0", field: "place", value: event.place, readable: event.place !== "" },
          ]
        : [],
    );
    return {
      trace,
      result: {
        kind: "B",
        event,
        confirm,
        activities: outputs.find_activities ?? null,
        plan: outputs.plan_showing_up ?? null,
        invite: outputs.draft_invite ?? null,
        // No .ics before confirmation: the UI calls exportConfirmedICS
        // after every item is confirmed.
        ics: null,
      },
      history: replay,
    };
  }
  // Flow C: offer draft_message in code, then guard everything shown.
  const draft = await executeTool("draft_message", { advertiser: ctx.advertiser }, lang);
  trace.push({ tool: "draft_message", summary: "Note draft ready.", ok: true });
  const cues = (outputs.scam_cues as { cues: ScamCue[] } | undefined)?.cues ?? [];
  const guard = await outputGuard(modelText || scamMessage([], lang), {
    liveCheck: isMockMode() ? undefined : (text) => liveGuardCheck(text, lang),
  });
  trace.push({
    tool: "output_guard",
    summary: outputGuardSummary(guard),
    ok: guard.pass,
  });
  return {
    trace,
    result: {
      kind: "C",
      cues,
      explanation: outputs.explain_ad ?? null,
      message: resolveFlowCMessage({ modelText, cues, lang, guardPass: guard.pass }),
      draft,
      guardPassed: guard.pass,
    },
    history: replay,
  };
}
