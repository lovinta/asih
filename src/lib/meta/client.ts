// createResponse is the ONLY path to /v1/responses. Hard rules:
// - ALWAYS sets store:false and include:["reasoning.encrypted_content"],
//   overriding any caller value.
// - THROWS on previous_response_id / conversation (we replay our own
//   history array instead) and on any model id containing "-contributor".
// - Allowlist: muse-spark-1.3 (agent loop, vision, output-guard check) and
//   muse-wonder-1.0 (one retry for unreadable images only).
// In mock mode it returns deterministic Responses-shaped output with no key
// and no network.
import { isMockMode, getApiKey } from "./mode";
import { checkSpendGuard, logMetaCall, recordSpend } from "./spend";
import type { ResponseOutputItem } from "../agent/types";

export const SPARK_MODEL = "muse-spark-1.3";
export const WONDER_MODEL = "muse-wonder-1.0";
export const VOICE_MODEL = "muse-voice-transcribe-1.0";

const MODEL_ALLOWLIST = [SPARK_MODEL, WONDER_MODEL];

export interface CreateResponseParams {
  model: string;
  input: unknown;
  [key: string]: unknown;
}

export interface CreateResponseResult {
  output: ResponseOutputItem[];
  usage: { input_tokens: number; output_tokens: number };
}

// Pure enforcement so tests can check the rules without any network.
export function enforceResponseParams(
  params: CreateResponseParams,
): CreateResponseParams & { store: false; include: string[] } {
  if ("previous_response_id" in params && params.previous_response_id != null) {
    throw new Error("previous_response_id is forbidden: replay history instead.");
  }
  if ("conversation" in params && params.conversation != null) {
    throw new Error("conversation is forbidden: replay history instead.");
  }
  if (params.model.includes("-contributor")) {
    throw new Error(`Model "${params.model}" is not allowed (-contributor).`);
  }
  if (!MODEL_ALLOWLIST.includes(params.model)) {
    throw new Error(
      `Model "${params.model}" is not in the allowlist (${MODEL_ALLOWLIST.join(", ")}).`,
    );
  }
  return {
    ...params,
    store: false,
    include: ["reasoning.encrypted_content"],
  };
}

export async function createResponse(
  params: CreateResponseParams,
  opts?: { flow?: string; step?: string },
): Promise<CreateResponseResult> {
  const safe = enforceResponseParams(params);
  if (isMockMode()) {
    return {
      output: [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "output_text", text: "Mock reply." }],
        },
      ],
      usage: { input_tokens: 10, output_tokens: 5 },
    };
  }
  // Spend guard before the live call: refuse when spent + reservation > cap.
  checkSpendGuard();
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI({
    baseURL: "https://api.meta.ai/v1",
    apiKey: getApiKey(),
  });
  const response = (await client.responses.create(safe as never)) as unknown as {
    output: ResponseOutputItem[];
    usage?: {
      input_tokens: number;
      output_tokens: number;
      input_tokens_details?: { cached_tokens?: number };
    };
  };
  const usage = {
    input_tokens: response.usage?.input_tokens ?? 0,
    output_tokens: response.usage?.output_tokens ?? 0,
    cached_input_tokens: response.usage?.input_tokens_details?.cached_tokens ?? 0,
  };
  recordSpend(usage);
  logMetaCall(opts?.flow ?? "unknown", opts?.step ?? "response", usage);
  return {
    output: response.output,
    usage: {
      input_tokens: usage.input_tokens,
      output_tokens: usage.output_tokens,
    },
  };
}
