// Regression: Flow C with no cues must show the "That doesn't mean it's safe." suffix
// even when the (mock or live) model already wrote the fixed wording. Found by the eval set.
import { describe, expect, it } from "vitest";
import { resolveFlowCMessage, runFlow } from "./runFlow";
import { FIXED_SCAM_WORDING_EN, FIXED_SCAM_WORDING_ES, NO_CUES_SUFFIX_EN, NO_CUES_SUFFIX_ES } from "../safety/scamWording";

describe("Flow C no-cue suffix", () => {
  it("adds the suffix after model-written fixed wording when there are no cues", () => {
    const en = resolveFlowCMessage({ modelText: `Summary.\n\n${FIXED_SCAM_WORDING_EN}`, cues: [], lang: "en", guardPass: true });
    expect(en).toContain(`${FIXED_SCAM_WORDING_EN} ${NO_CUES_SUFFIX_EN}`);
    const es = resolveFlowCMessage({ modelText: FIXED_SCAM_WORDING_ES, cues: [], lang: "es", guardPass: true });
    expect(es).toContain(`${FIXED_SCAM_WORDING_ES} ${NO_CUES_SUFFIX_ES}`);
  });
  it("does not add the suffix when cues were found, and does not duplicate it", () => {
    const withCues = resolveFlowCMessage({ modelText: FIXED_SCAM_WORDING_EN, cues: [{ cue: "urgency", evidence: "Act now" }], lang: "en", guardPass: true });
    expect(withCues).not.toContain(NO_CUES_SUFFIX_EN);
    const once = resolveFlowCMessage({ modelText: `${FIXED_SCAM_WORDING_EN} ${NO_CUES_SUFFIX_EN}`, cues: [], lang: "en", guardPass: true });
    expect(once.split(NO_CUES_SUFFIX_EN).length - 1).toBe(1);
  });
  it("mock Flow C on a benign listing ends with the suffix", async () => {
    process.env.MOCK_MODE = "1";
    const out = await runFlow("C", { sharedText: "Riverton Library book sale. Saturday 10 AM to 2 PM. All ages welcome." }, "en");
    const result = out.result as { kind: string; cues: unknown[]; message: string };
    expect(result.cues).toEqual([]);
    expect(result.message).toContain(`${FIXED_SCAM_WORDING_EN} ${NO_CUES_SUFFIX_EN}`);
  });
});
