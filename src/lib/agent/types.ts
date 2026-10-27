// Shared agent-loop types: stateless replay history items (Responses API
// shapes the app resends each turn), trace steps, and model output items.
export type FlowName = "A" | "B" | "C";
export type Lang = "en" | "es";

export type HistoryItem =
  | {
      type: "message";
      role: "user" | "assistant";
      content: string;
      phase?: "commentary";
    }
  | { type: "reasoning"; encrypted_content: string; summary: [] }
  | { type: "function_call"; call_id: string; name: string; arguments: string }
  | { type: "function_call_output"; call_id: string; output: string };

export type ResponseOutputItem =
  | { type: "reasoning"; encrypted_content: string; summary: [] }
  | {
      type: "message";
      role: "assistant";
      content: { type: "output_text"; text: string }[];
      phase?: "commentary";
    }
  | { type: "function_call"; call_id: string; name: string; arguments: string };

export interface Step {
  // Tool or stage name, e.g. "read_document", "prescreen", "output_guard".
  tool: string;
  // Short summary for the "How the agent worked" panel. Never holds personal
  // content beyond what is already shown on screen.
  summary: string;
  ok: boolean;
}

export interface FlowInput {
  // The person's own words (typed or transcribed). Screened, never an ad.
  text?: string;
  useExample?: boolean;
  // Flow B extras.
  interest?: string;
  place?: string;
  // Shared content (ad / listing text): DATA, never instructions.
  sharedText?: string;
  // Photo as a data URL (letter for Flow A, ad screenshot for Flow C).
  imageDataUrl?: string;
}

// A reasoning item must be followed by an assistant message or function_call.
export function isValidReplayOrder(history: HistoryItem[]): boolean {
  for (let i = 0; i < history.length; i++) {
    if (history[i].type !== "reasoning") continue;
    const next = history[i + 1];
    if (!next) return false;
    if (next.type !== "message" && next.type !== "function_call") return false;
  }
  return true;
}
