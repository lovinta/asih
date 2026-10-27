// Deterministic mock model. Emits the SAME Responses-API-shaped output items
// the live model would (reasoning + function_call items, then a final
// message), so the real agent loop, tools, guards, and trace all run with no
// key and no network. All content comes from src/fixtures/.
import type { FlowName, HistoryItem, ResponseOutputItem } from "../agent/types";
import { FIXED_SCAM_WORDING_EN, FIXED_SCAM_WORDING_ES } from "../safety/scamWording";

export interface MockTurn {
  output: ResponseOutputItem[];
  usage: { input_tokens: number; output_tokens: number };
}

function countCalls(history: HistoryItem[]): number {
  return history.filter((item) => item.type === "function_call").length;
}

function reasoning(step: string): ResponseOutputItem {
  return {
    type: "reasoning",
    encrypted_content: `mock-encrypted-${step}`,
    summary: [],
  };
}

function call(callId: string, name: string, args: unknown): ResponseOutputItem {
  return {
    type: "function_call",
    call_id: callId,
    name,
    arguments: JSON.stringify(args),
  };
}

function finalMessage(text: string): ResponseOutputItem {
  return {
    type: "message",
    role: "assistant",
    content: [{ type: "output_text", text }],
  };
}

// Scripted tool order per flow. runFlow executes read_document (Flow A) and
// read_ad (Flow C) in code first, so those calls are already in history.
export function mockModelTurn(
  flow: FlowName,
  history: HistoryItem[],
  lang: "en" | "es",
): MockTurn {
  const done = countCalls(history);
  if (flow === "A") {
    // read_document already ran in code; the visit summary follows.
    void done;
    return {
      output: [
        reasoning("a-final"),
        finalMessage(
          lang === "es"
            ? "Leí su carta. Confirme cada dato, uno a la vez."
            : "I read your letter. Please confirm each item, one at a time.",
        ),
      ],
      usage: { input_tokens: 120, output_tokens: 20 },
    };
  }
  if (flow === "B") {
    const steps = ["find_activities", "plan_showing_up", "draft_invite"];
    if (done < steps.length) {
      const name = steps[done];
      return {
        output: [
          reasoning(`b-${name}`),
          {
            type: "message",
            role: "assistant",
            phase: "commentary",
            content: [{ type: "output_text", text: `Looking that up: ${name}.` }],
          },
          call(`mock-b-${done}`, name, {}),
        ],
        usage: { input_tokens: 150, output_tokens: 30 },
      };
    }
    return {
      output: [
        reasoning("b-final"),
        finalMessage(
          lang === "es"
            ? "Listo. Revise el plan y la invitación."
            : "Done. Please review the plan and the invitation.",
        ),
      ],
      usage: { input_tokens: 200, output_tokens: 20 },
    };
  }
  // Flow C: read_ad already ran in code.
  if (done === 1) {
    return {
      output: [reasoning("c-cues"), call("mock-c-cues", "scam_cues", {})],
      usage: { input_tokens: 150, output_tokens: 30 },
    };
  }
  if (done === 2) {
    return {
      output: [reasoning("c-explain"), call("mock-c-explain", "explain_ad", {})],
      usage: { input_tokens: 180, output_tokens: 30 },
    };
  }
  const fixed = lang === "es" ? FIXED_SCAM_WORDING_ES : FIXED_SCAM_WORDING_EN;
  return {
    output: [reasoning("c-final"), finalMessage(fixed)],
    usage: { input_tokens: 200, output_tokens: 40 },
  };
}
