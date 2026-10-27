// End-to-end flow tests in mock mode through runFlow: the real agent loop,
// tools, guards, and trace all run with no key and no network.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { runFlow } from "./runFlow";
import type { FlowCResult, FlowAResult, FlowBResult } from "./runFlow";
import { FIXED_SCAM_WORDING_EN } from "../safety/scamWording";
import { PROMPT_INJECTION_AD_TEXT } from "@/fixtures/injectionAd";
import { EXAMPLE_AD_TEXT } from "@/fixtures/ad";
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
    expect(b.ics).toContain("BEGIN:VEVENT");
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

  it("redirects to Get help on red-flag input instead of running the agent", async () => {
    const { trace, result } = await runFlow(
      "C",
      { text: "I can't breathe", sharedText: EXAMPLE_AD_TEXT },
      "en",
    );
    expect(trace.map((s) => s.tool)).toEqual(["prescreen"]);
    expect(result).toMatchObject({ kind: "help" });
  });
});
