// LIVE vision request-shape tests. The meta client is mocked so no key and
// no network are needed; the assertions check the exact Responses-API shape
// the tools send (input_image block, store:false, include, strict
// json_schema) plus the Wonder retry when most fields are unreadable.
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createResponse, SPARK_MODEL, WONDER_MODEL } from "../meta/client";
import { executeTool } from "./tools";

vi.mock("../meta/client", async (importOriginal) => {
  const mod = await importOriginal<typeof import("../meta/client")>();
  return { ...mod, createResponse: vi.fn() };
});

const mockedCreate = vi.mocked(createResponse);

const OLD_ENV = { ...process.env };

function visionReply(payload: unknown) {
  return {
    output: [
      {
        type: "message" as const,
        role: "assistant" as const,
        content: [{ type: "output_text" as const, text: JSON.stringify(payload) }],
      },
    ],
    usage: { input_tokens: 100, output_tokens: 20 },
  };
}

function callParams(index = 0): Record<string, unknown> {
  return mockedCreate.mock.calls[index][0] as unknown as Record<string, unknown>;
}

function contentBlocks(index = 0): Record<string, unknown>[] {
  const input = callParams(index).input as { content: Record<string, unknown>[] }[];
  return input[0].content;
}

beforeEach(() => {
  // LIVE mode: key set, MOCK_MODE off. The OpenAI client itself is mocked.
  process.env.META_API_KEY = "test-key";
  process.env.MOCK_MODE = "0";
  mockedCreate.mockReset();
});

afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe("live read_document vision", () => {
  const LETTER_FIELDS = {
    fields: [
      { kind: "date", value: "Tuesday", readable: true, evidence_quote: "visit on Tuesday" },
      { kind: "time", value: "10:30 AM", readable: true, evidence_quote: "at 10:30 AM" },
    ],
  };

  it("sends an input_image block with strict json_schema on Spark", async () => {
    mockedCreate.mockResolvedValueOnce(visionReply(LETTER_FIELDS));
    const out = (await executeTool(
      "read_document",
      { imageDataUrl: "data:image/png;base64,AAA" },
      "en",
    )) as { fields: unknown[]; source: string };

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    const params = callParams();
    expect(params.model).toBe(SPARK_MODEL);
    expect(params.store).toBe(false);
    expect(params.include).toEqual(["reasoning.encrypted_content"]);
    expect(String(params.instructions)).toContain("English");
    const blocks = contentBlocks();
    expect(blocks).toContainEqual({
      type: "input_image",
      image_url: "data:image/png;base64,AAA",
    });
    expect(blocks[0].type).toBe("input_text");
    expect(String(blocks[0].text)).toContain("<<<DATA>>>");
    const format = (params.text as { format: Record<string, unknown> }).format;
    expect(format.type).toBe("json_schema");
    expect(format.strict).toBe(true);
    const kinds = (
      format.schema as {
        properties: { fields: { items: { properties: { kind: { enum: string[] } } } } };
      }
    ).properties.fields.items.properties.kind.enum;
    expect(kinds).toEqual(
      expect.arrayContaining(["date", "time", "place", "clinic_name", "person_name", "phone", "bring_items"]),
    );
    expect(out.fields).toHaveLength(2);
    expect(out.source).toBe("photo");
  });

  it("retries once on Wonder when more than half the fields are unreadable", async () => {
    mockedCreate.mockResolvedValueOnce(
      visionReply({
        fields: [
          { kind: "date", value: "Tuesday", readable: true, evidence_quote: "Tuesday" },
          { kind: "time", value: "I can't read this part", readable: false, evidence_quote: "??" },
          { kind: "place", value: "I can't read this part", readable: false, evidence_quote: "??" },
        ],
      }),
    );
    mockedCreate.mockResolvedValueOnce(visionReply(LETTER_FIELDS));
    const out = (await executeTool(
      "read_document",
      { imageDataUrl: "data:image/png;base64,AAA" },
      "en",
    )) as { fields: { value: string }[] };

    expect(mockedCreate).toHaveBeenCalledTimes(2);
    expect(callParams(0).model).toBe(SPARK_MODEL);
    expect(callParams(1).model).toBe(WONDER_MODEL);
    expect(out.fields).toHaveLength(2);
  });
});

describe("live read_ad vision", () => {
  it("extracts text, advertiser, and claims from a screenshot", async () => {
    mockedCreate.mockResolvedValueOnce(
      visionReply({ text: "Joint pain gone!", advertiser: "Acme", claims: ["Joint pain gone!"] }),
    );
    const out = (await executeTool(
      "read_ad",
      { imageDataUrl: "data:image/png;base64,BBB" },
      "en",
    )) as { text: string; advertiser: string; claims: string[] };

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    expect(callParams().model).toBe(SPARK_MODEL);
    expect(contentBlocks()).toContainEqual({
      type: "input_image",
      image_url: "data:image/png;base64,BBB",
    });
    expect(out).toEqual({
      text: "Joint pain gone!",
      advertiser: "Acme",
      claims: ["Joint pain gone!"],
    });
  });
});

describe("live typed-letter extraction", () => {
  it("sends pasted text to Spark structured extraction, not the naive parser", async () => {
    mockedCreate.mockResolvedValueOnce(
      visionReply({
        fields: [
          { kind: "date", value: "el martes", readable: true, evidence_quote: "el martes" },
        ],
      }),
    );
    const out = (await executeTool(
      "read_document",
      { text: "Mi visita es el martes, sin números de teléfono ni horas aquí." },
      "es",
    )) as { fields: { value: string }[]; source: string };

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    const params = callParams();
    expect(params.model).toBe(SPARK_MODEL);
    expect(String(params.instructions)).toContain("Spanish");
    expect(String(contentBlocks()[0].text)).toContain("<<<DATA>>>");
    // The naive mock parser would have returned the unreadable note here
    // (no phone/time digits); Spark returns the extracted field instead.
    expect(out.fields).toEqual([
      { kind: "date", value: "el martes", readable: true, evidence_quote: "el martes" },
    ]);
    expect(out.source).toBe("typed-text");
  });
});

describe("live Flow B listing summary", () => {
  it("summarizes a shared listing via Spark structured output", async () => {
    const summary = {
      name: "Garden Club",
      date: "Sunday",
      time: "10:00 AM",
      place: "Library",
      source: "Notice board",
      bring: ["Gloves"],
      startPoint: "Front steps",
    };
    mockedCreate.mockResolvedValueOnce(visionReply(summary));
    const out = (await executeTool(
      "find_activities",
      { sharedListing: "Garden Club meets Sunday 10am at the Library" },
      "en",
    )) as { summary: Record<string, unknown> };

    expect(mockedCreate).toHaveBeenCalledTimes(1);
    const format = (callParams().text as { format: Record<string, unknown> }).format;
    expect(format.type).toBe("json_schema");
    expect(format.strict).toBe(true);
    expect(format.name).toBe("listing_summary");
    expect(out.summary).toMatchObject({ name: "Garden Club", place: "Library" });
  });

  it("draft_invite uses the passed confirmed values, not fixtures", async () => {
    const out = (await executeTool(
      "draft_invite",
      {
        eventName: "Garden Club",
        date: "Sunday",
        time: "10:00 AM",
        place: "Library",
        names: ["Ana"],
      },
      "en",
    )) as { draft: string };
    expect(out.draft).toContain("Garden Club");
    expect(out.draft).toContain("Sunday");
    expect(out.draft).toContain("Library");
    expect(out.draft).toContain("Ana");
    expect(out.draft).not.toContain("Riverside Morning Walkers");
  });
});
