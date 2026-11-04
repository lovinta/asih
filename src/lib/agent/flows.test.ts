// End-to-end flow tests in mock mode through runFlow: the real agent loop,
// tools, guards, and trace all run with no key and no network.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { runFlow, fillArgs, resolveFlowCMessage, type Ctx } from "./runFlow";
import type { FlowCResult, FlowAResult, FlowBResult } from "./runFlow";
import { executeTool, findScamCues } from "./tools";
import {
  FIXED_SCAM_WORDING_EN,
  FIXED_SCAM_WORDING_ES,
  NO_CUES_SUFFIX_EN,
} from "../safety/scamWording";
import { PROMPT_INJECTION_AD_TEXT } from "@/fixtures/injectionAd";
import { EXAMPLE_AD_TEXT } from "@/fixtures/ad";
import { EXAMPLE_EVENT_ES } from "@/fixtures/event";
import { createConfirmState, confirmItem } from "../confirm";
import { ACCOUNTS_CENTER_AD_PREFS_URL } from "../links";
import { es as esStrings } from "@/i18n/es";
import { en as enStrings } from "@/i18n/en";
import { isValidReplayOrder } from "./types";

const OLD_ENV = { ...process.env };

beforeEach(() => {
  process.env.MOCK_MODE = "1";
  delete process.env.META_API_KEY;
});

afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe("Flow A (appointment help)", () => {
  it("runs read_document first in code and returns unconfirmed items unsaved", async () => {
    const { trace, result, history } = await runFlow(
      "A",
      { useExample: true },
      "en",
    );
    const tools = trace.map((s) => s.tool);
    expect(tools[0]).toBe("read_document");
    expect(tools).toContain("output_guard");
    const a = result as FlowAResult;
    expect(a.kind).toBe("A");
    expect(a.fields.length).toBeGreaterThan(0);
    // Unconfirmed items are not saved and produce no .ics.
    expect(a.savedVisit).toBeNull();
    expect(a.ics).toBeNull();
    expect(a.confirm.items.every((i) => i.status === "pending")).toBe(true);
    expect(isValidReplayOrder(history)).toBe(true);
  });
});

describe("Flow B (find a group)", () => {
  it("runs find_activities -> plan_showing_up -> draft_invite", async () => {
    const { trace, result } = await runFlow(
      "B",
      { interest: "walking", place: "Riverton" },
      "en",
    );
    const tools = trace.map((s) => s.tool);
    expect(tools).toEqual(
      expect.arrayContaining(["find_activities", "plan_showing_up", "draft_invite"]),
    );
    expect(tools.indexOf("find_activities")).toBeLessThan(
      tools.indexOf("plan_showing_up"),
    );
    expect(tools.indexOf("plan_showing_up")).toBeLessThan(
      tools.indexOf("draft_invite"),
    );
    const b = result as FlowBResult;
    expect(b.kind).toBe("B");
    // No .ics before confirmation: the UI exports after every item confirms.
    expect(b.ics).toBeNull();
    // The event's date/time/place come back as a ConfirmState like Flow A.
    expect(b.event?.name).toContain("Riverside Morning Walkers");
    expect(b.confirm.items.map((i) => i.field)).toEqual(["date", "time", "place"]);
    expect(b.confirm.items.every((i) => i.status === "pending")).toBe(true);
    expect(b.confirm.items.find((i) => i.field === "date")?.value).toBe(
      b.event?.date,
    );
  });

  it("uses the Spanish example event in Spanish mode", async () => {
    const { result } = await runFlow(
      "B",
      { interest: "walking", place: "Riverton" },
      "es",
    );
    const b = result as FlowBResult;
    expect(b.event).toMatchObject({
      name: EXAMPLE_EVENT_ES.name,
      date: EXAMPLE_EVENT_ES.date,
      place: EXAMPLE_EVENT_ES.place,
      source: EXAMPLE_EVENT_ES.source,
    });
    expect(b.event?.name).toContain("EJEMPLO");
    expect(b.event?.date).toBe("sábado, 7 de noviembre de 2026");
    expect(b.confirm.items.find((i) => i.field === "date")?.value).toBe(
      EXAMPLE_EVENT_ES.date,
    );
    const plan = b.plan as { rideNote: string; meetTips: string };
    expect(plan.rideNote).toBe(esStrings.flowB.rideNote);
    expect(plan.meetTips).toBe(esStrings.flowB.meetTips);
    const invite = b.invite as { draft: string };
    expect(invite.draft).toContain("Le invito al grupo");
    expect(invite.draft).toContain(EXAMPLE_EVENT_ES.name);
    expect(invite.draft).toContain(EXAMPLE_EVENT_ES.date);
    expect(invite.draft).toContain("Avíseme si le gustaría venir");
  });

  it("renders Spanish invitation names right after Hola", async () => {
    const invite = (await executeTool(
      "draft_invite",
      {
        eventName: "Riverside Morning Walkers",
        date: "Saturday, November 7, 2026",
        time: "9:00 AM",
        place: "Riverside Park main gate",
        names: ["Ana", "Luis"],
      },
      "es",
    )) as { draft: string };
    expect(invite.draft).toContain(
      "Hola Ana, Luis. Le invito al grupo Riverside Morning Walkers.",
    );
    expect(invite.draft).not.toContain("{names}");
  });
});

describe("Flow C (ad check)", () => {
  it("ends with the fixed wording and reports quoted cues", async () => {
    const { trace, result } = await runFlow(
      "C",
      { useExample: true, sharedText: EXAMPLE_AD_TEXT },
      "en",
    );
    const tools = trace.map((s) => s.tool);
    expect(tools).toEqual(
      expect.arrayContaining(["read_ad", "scam_cues", "explain_ad", "output_guard"]),
    );
    const c = result as FlowCResult;
    expect(c.kind).toBe("C");
    expect(c.message).toContain(FIXED_SCAM_WORDING_EN);
    expect(c.cues.length).toBeGreaterThan(0);
    // Every cue carries the exact quoted text as evidence, no verdict.
    for (const cue of c.cues) expect(cue.evidence.length).toBeGreaterThan(0);
    expect(c.cues.find((cue) => cue.cue === "urgency")?.evidence).toBe("Only 3 left in stock. ACT NOW!");
    expect(c.cues.find((cue) => cue.cue === "too-good-claim")?.evidence).toBe(
      "JOINT PAIN GONE IN 7 DAYS!",
    );
    expect(c.message).not.toMatch(/this is safe/i);
    expect(c.message).not.toMatch(/this is a scam/i);
  });

  it("is not changed by the prompt-injection fixture", async () => {
    const { result } = await runFlow(
      "C",
      { sharedText: PROMPT_INJECTION_AD_TEXT },
      "en",
    );
    const c = result as FlowCResult;
    expect(c.message).toContain(FIXED_SCAM_WORDING_EN);
    expect(c.message).not.toMatch(/this is safe/i);
  });

  it("does not invent an advertiser for a pasted ad in mock mode", async () => {
    const { result } = await runFlow(
      "C",
      {
        sharedText:
          "Only 2 left. Message us on WhatsApp. Guaranteed to cure arthritis. Send your bank details.",
      },
      "en",
    );
    const c = result as FlowCResult;
    expect(c.message).toContain(FIXED_SCAM_WORDING_EN);
    expect(c.cues.map((cue) => cue.cue)).toEqual(
      expect.arrayContaining(["urgency", "too-good-claim", "move-to-private-chat", "asks-personal-details"]),
    );
    // A one-paragraph ad must quote the sentence, not repeat the whole paragraph.
    const evidence = Object.fromEntries(c.cues.map((cue) => [cue.cue, cue.evidence]));
    expect(evidence.urgency).toBe("Only 2 left.");
    expect(evidence["too-good-claim"]).toBe("Guaranteed to cure arthritis.");
    expect(evidence["move-to-private-chat"]).toBe("Message us on WhatsApp.");
    expect(evidence["asks-personal-details"]).toBe(
      "Send your bank details.",
    );
    const explanation = c.explanation as { advertiser: string };
    const draft = c.draft as { draft: string };
    expect(explanation.advertiser).toBe(enStrings.flowC.unknownAdvertiser);
    expect(draft.draft).toContain(enStrings.flowC.unknownAdvertiser);
    expect(draft.draft).not.toContain("EverFlex");
  });

  it("uses the example ad text fallback for a mock photo but keeps the advertiser unknown", async () => {
    const { result } = await runFlow(
      "C",
      { imageDataUrl: "data:image/png;base64,AAAA" },
      "en",
    );
    const c = result as FlowCResult;
    expect(c.cues.length).toBeGreaterThan(0);
    expect(c.message).toContain(FIXED_SCAM_WORDING_EN);
    const explanation = c.explanation as { advertiser: string };
    const draft = c.draft as { draft: string };
    expect(explanation.advertiser).toBe(enStrings.flowC.unknownAdvertiser);
    expect(draft.draft).not.toContain("EverFlex");
  });

  it("keeps abbreviations and decimals inside sentence evidence", () => {
    const text =
      "Dr. Smith says the special price is 9.99 dollars for this miracle tonic, and Mrs. Jones says it works. Only 2 left.";
    const cues = findScamCues(text);
    const evidence = Object.fromEntries(cues.map((cue) => [cue.cue, cue.evidence]));
    expect(evidence["too-good-claim"]).toBe(
      "Dr. Smith says the special price is 9.99 dollars for this miracle tonic, and Mrs. Jones says it works.",
    );
    expect(evidence.urgency).toBe("Only 2 left.");
  });

  it("returns the whole line when the text has no terminal punctuation", () => {
    const text =
      "This miracle tonic costs 9.99 dollars today and has no ending punctuation at all in this deliberately long line";
    const cues = findScamCues(text);
    expect(cues.find((cue) => cue.cue === "too-good-claim")?.evidence).toBe(text);
  });

  it("redirects to Get help on red-flag input instead of running the agent", async () => {
    const { trace, result } = await runFlow(
      "C",
      { text: "I can't breathe", sharedText: EXAMPLE_AD_TEXT },
      "en",
    );
    expect(trace.map((s) => s.tool)).toEqual(["prescreen"]);
    expect(result).toMatchObject({ kind: "help" });
  });

  it("ends Spanish runs with the Spanish fixed wording and drafts", async () => {
    const { result } = await runFlow(
      "C",
      { useExample: true, sharedText: EXAMPLE_AD_TEXT },
      "es",
    );
    const c = result as FlowCResult;
    expect(c.message).toContain(FIXED_SCAM_WORDING_ES);
    const draft = c.draft as { draft: string };
    expect(draft.draft).toContain("segunda opinión");
  });

  it("keeps the fixed wording (not the generic reply) when the guard fails", () => {
    const cues = [
      { cue: "urgency", evidence: '"Only 3 left in stock" (quoted ad text)' },
    ];
    const message = resolveFlowCMessage({
      modelText: "This product works, guaranteed!",
      cues,
      lang: "en",
      guardPass: false,
    });
    expect(message).toContain(FIXED_SCAM_WORDING_EN);
    expect(message).not.toContain("Get help button");
  });

  it("keeps the no-cues suffix when the guard fails with no cues", () => {
    const message = resolveFlowCMessage({
      modelText: "This product works, guaranteed!",
      cues: [],
      lang: "en",
      guardPass: false,
    });
    expect(message).toContain(NO_CUES_SUFFIX_EN);
  });
});

describe("Flow A confirmed-only tools", () => {
  function ctxFor(state: ReturnType<typeof createConfirmState>): Ctx {
    return {
      docFields: [],
      confirm: state,
      event: null,
      adText: "",
      advertiser: "unknown",
      questions: [],
    };
  }

  it("build_visit_list receives only confirmed values", () => {
    const pending = createConfirmState([
      { id: "date-0", field: "date", value: "Tuesday", readable: true },
      { id: "time-0", field: "time", value: "10:30 AM", readable: true },
    ]);
    // Nothing confirmed: the tool gets an empty map, not the model output.
    expect(
      fillArgs(
        "build_visit_list",
        { fields: { date: "Tuesday", time: "10:30 AM", place: "Sneaky" } },
        {},
        ctxFor(pending),
      ),
    ).toEqual({ fields: {} });
    const partial = confirmItem(pending, "date-0");
    expect(
      fillArgs("build_visit_list", { fields: { date: "x", place: "y" } }, {}, ctxFor(partial)),
    ).toEqual({ fields: { date: "Tuesday" } });
  });

  it("set_reminder derives when from confirmed values only", () => {
    const state = confirmItem(
      confirmItem(
        createConfirmState([
          { id: "date-0", field: "date", value: "Tuesday", readable: true },
          { id: "time-0", field: "time", value: "10:30 AM", readable: true },
        ]),
        "date-0",
      ),
      "time-0",
    );
    const filled = fillArgs(
      "set_reminder",
      { title: "Visit", when: "someday" },
      {},
      ctxFor(state),
    ) as { title: string; when: string };
    expect(filled.when).toContain("Tuesday");
    expect(filled.when).toContain("10:30 AM");
  });

  it("add_question stores the person's words verbatim", async () => {
    const words = "Will my bus pass work on Sunday??";
    const out = (await executeTool("add_question", { question: words }, "en")) as {
      stored: string;
    };
    expect(out.stored).toBe(words);
  });

  it("explain_ad steps come from i18n in both languages", async () => {
    const english = (await executeTool("explain_ad", { advertiser: "Acme" }, "en")) as {
      steps: string[];
      adLibraryUrl: string;
      note: string;
    };
    expect(english.steps).toEqual([
      enStrings.flowC.whyStep1,
      enStrings.flowC.whyStep2.replace("{url}", ACCOUNTS_CENTER_AD_PREFS_URL),
      enStrings.flowC.reportHint,
      enStrings.flowC.whyStep4.replace("{url}", english.adLibraryUrl),
    ]);
    expect(english.note).toBe(enStrings.flowC.regionalNote);
    const spanish = (await executeTool("explain_ad", { advertiser: "Acme" }, "es")) as {
      steps: string[];
    };
    expect(spanish.steps[0]).toBe(esStrings.flowC.whyStep1);
  });
});
