import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createResponse } from "../meta/client";
import { classifyIntent } from "./intent";
import { liveGuardCheck } from "./runFlow";
import { executeTool, TOOLS_BY_FLOW } from "./tools";

vi.mock("../meta/client", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../meta/client")>();
  return { ...mod, createResponse: vi.fn() };
});

const mockedCreate = vi.mocked(createResponse);
const OLD_ENV = { ...process.env };

function reply(payload: unknown) {
  return {
    output: [{
      type: "message" as const,
      role: "assistant" as const,
      content: [{ type: "output_text" as const, text: JSON.stringify(payload) }],
    }],
    usage: { input_tokens: 10, output_tokens: 5 },
  } as unknown as Awaited<ReturnType<typeof createResponse>>;
}

function expectClosedObjectSchemas(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(expectClosedObjectSchemas);
    return;
  }
  if (!value || typeof value !== "object") return;
  const record = value as Record<string, unknown>;
  if (record.type === "object") expect(record.additionalProperties).toBe(false);
  Object.values(record).forEach(expectClosedObjectSchemas);
}

beforeEach(() => {
  process.env.META_API_KEY = "test-key";
  process.env.MOCK_MODE = "0";
  mockedCreate.mockReset();
});

afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe("strict agent schemas", () => {
  it("requires the guard pass field and rejects additional properties", async () => {
    mockedCreate.mockResolvedValueOnce(reply({ pass: true }));

    expect(await liveGuardCheck("A short, safe reply.", "en")).toEqual({ pass: true });
    expect(mockedCreate).toHaveBeenCalledTimes(1);

    const params = mockedCreate.mock.calls[0][0] as unknown as {
      text: { format: { type: string; strict: boolean; schema: Record<string, unknown> } };
    };
    const format = params.text.format;
    expect(format.type).toBe("json_schema");
    expect(format.strict).toBe(true);
    expect(format.schema).toMatchObject({
      type: "object",
      required: ["pass"],
      additionalProperties: false,
    });
    expectClosedObjectSchemas(format.schema);
  });

  it("keeps every strict JSON schema and function-tool schema closed", async () => {
    const toolDefs = Object.values(TOOLS_BY_FLOW).flat();
    for (const tool of toolDefs) {
      expect(tool.parameters).toMatchObject({
        type: "object",
        additionalProperties: false,
      });
    }

    mockedCreate
      .mockResolvedValueOnce(reply({ intent: "unknown" }))
      .mockResolvedValueOnce(reply({
        fields: [{ kind: "date", value: "Tuesday", readable: true, evidence_quote: "Tuesday" }],
      }))
      .mockResolvedValueOnce(reply({ text: "Example ad", advertiser: "Example", claims: [] }))
      .mockResolvedValueOnce(reply({
        name: "Example Club",
        date: "Tuesday",
        time: "10 AM",
        place: "Library",
        source: "Example listing",
        bring: [],
        startPoint: "Front door",
      }));

    await classifyIntent("Please help me.", "en");
    await executeTool("read_document", { text: "Tuesday" }, "en");
    await executeTool("read_ad", { adText: "Example ad" }, "en");
    await executeTool("find_activities", { sharedListing: "Example Club" }, "en");

    expect(mockedCreate).toHaveBeenCalledTimes(4);
    for (const [params] of mockedCreate.mock.calls) {
      const request = params as unknown as {
        text: { format: { type: string; strict: boolean; schema: unknown } };
      };
      const format = request.text.format;
      expect(format.type).toBe("json_schema");
      expect(format.strict).toBe(true);
      expectClosedObjectSchemas(format.schema);
    }
  });
});
