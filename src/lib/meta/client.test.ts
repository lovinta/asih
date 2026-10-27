// No network: checks the hard createResponse rules via the pure enforcer
// plus a mock-mode call that must work with no key.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createResponse, enforceResponseParams } from "./client";

const OLD_ENV = { ...process.env };

beforeEach(() => {
  process.env.MOCK_MODE = "1";
  delete process.env.META_API_KEY;
});

afterEach(() => {
  process.env = { ...OLD_ENV };
});

describe("enforceResponseParams", () => {
  it("forces store:false and the reasoning include, overriding callers", () => {
    const out = enforceResponseParams({
      model: "muse-spark-1.3",
      input: [],
      store: true,
      include: ["other"],
    } as never);
    expect(out.store).toBe(false);
    expect(out.include).toEqual(["reasoning.encrypted_content"]);
  });

  it("rejects previous_response_id", () => {
    expect(() =>
      enforceResponseParams({ model: "muse-spark-1.3", input: [], previous_response_id: "r1" }),
    ).toThrow(/previous_response_id/);
  });

  it("rejects conversation", () => {
    expect(() =>
      enforceResponseParams({ model: "muse-spark-1.3", input: [], conversation: {} }),
    ).toThrow(/conversation/);
  });

  it("rejects -contributor models", () => {
    expect(() =>
      enforceResponseParams({ model: "muse-spark-1.3-contributor", input: [] }),
    ).toThrow(/contributor/);
  });

  it("rejects models outside the allowlist", () => {
    expect(() =>
      enforceResponseParams({ model: "some-other-model", input: [] }),
    ).toThrow(/allowlist/);
  });

  it("allows spark and wonder", () => {
    expect(enforceResponseParams({ model: "muse-spark-1.3", input: [] }).model).toBe(
      "muse-spark-1.3",
    );
    expect(enforceResponseParams({ model: "muse-wonder-1.0", input: [] }).model).toBe(
      "muse-wonder-1.0",
    );
  });
});

describe("createResponse in mock mode", () => {
  it("works with no key and returns Responses-shaped output", async () => {
    const res = await createResponse({ model: "muse-spark-1.3", input: [] });
    expect(Array.isArray(res.output)).toBe(true);
    expect(res.output[0].type).toBe("message");
    expect(res.usage.input_tokens).toBeGreaterThanOrEqual(0);
  });

  it("still rejects forbidden params in mock mode", async () => {
    await expect(
      createResponse({ model: "muse-spark-1.3", input: [], conversation: {} }),
    ).rejects.toThrow(/conversation/);
  });
});
