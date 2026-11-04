// The output guard's trace summary must carry the blocked reason in LIVE mode
// without ever including the API key.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createResponse } from "../meta/client";
import { runFlow } from "./runFlow";

vi.mock("../meta/client", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../meta/client")>();
  return { ...mod, createResponse: vi.fn() };
});

const mockedCreate = vi.mocked(createResponse);
const OLD_ENV = { ...process.env };

function messageReply(text: string) {
  return {
    output: [
      {
        type: "message" as const,
        role: "assistant" as const,
        content: [{ type: "output_text" as const, text }],
      },
    ],
    usage: { input_tokens: 10, output_tokens: 5 },
  };
}

function jsonReply(payload: unknown) {
  return messageReply(JSON.stringify(payload));
}

beforeEach(() => {
  process.env.META_API_KEY = "test-key";
  process.env.MOCK_MODE = "0";
  mockedCreate.mockReset();
});

afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe("live output guard trace", () => {
  it("records a rule-block reason in the trace without the key", async () => {
    mockedCreate.mockResolvedValueOnce(messageReply("This cures arthritis."));

    const { trace } = await runFlow("C", { useExample: true }, "en");
    const guard = trace.find((step) => step.tool === "output_guard");

    expect(guard).toMatchObject({ ok: false });
    expect(guard?.summary).toBe("Blocked: cure-claim.");
    expect(guard?.summary).not.toContain("test-key");
  });

  it("records a live-check block reason in the trace without the key", async () => {
    mockedCreate
      .mockResolvedValueOnce(messageReply("I read your letter."))
      .mockResolvedValueOnce(jsonReply({ pass: false }));

    const { trace } = await runFlow("A", { useExample: true }, "en");
    const guard = trace.find((step) => step.tool === "output_guard");

    expect(guard).toMatchObject({ ok: false });
    expect(guard?.summary).toBe("Blocked: live-check.");
    expect(guard?.summary).not.toContain("test-key");
  });
});
