import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

function request(flow: string, text?: string, lang = "en") {
  return new Request("http://localhost/api/agent", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ flow, lang, input: text === undefined ? {} : { text } }),
  });
}

describe("/api/agent auto routing", () => {
  afterEach(() => vi.restoreAllMocks());
  it.each([
    ["en", "My visit is on Tuesday, November 10, 2026 at 2:00 PM", "A", "appointment"],
    ["en", "Is this supplement ad real?", "phone_ad", "scam_ad"],
    ["en", "I want a walking group", "B", "activity"],
    ["en", "hello", "unknown", "unknown"],
    ["es", "Tengo una cita en la clínica", "A", "appointment"],
    ["es", "¿Este anuncio de suplemento es una estafa?", "phone_ad", "scam_ad"],
    ["es", "Quiero caminar en grupo", "B", "activity"],
    ["es", "hola", "unknown", "unknown"],
  ] as const)("routes %s transcript to %s", async (lang, text, kind, intent) => {
    vi.stubEnv("MOCK_MODE", "1");
    const response = await POST(request("auto", text, lang));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.result.kind).toBe(kind);
    expect(body.routed).toEqual({ intent, source: "rules" });
    expect(body.trace[0]).toEqual({ tool: "classify_intent", summary: intent, ok: true });
  });
  it("prescreens danger before classification", async () => {
    vi.stubEnv("MOCK_MODE", "1");
    const classifier = vi.spyOn(await import("@/lib/agent/intent"), "classifyIntent");
    const response = await POST(request("auto", "I have chest pain"));
    const body = await response.json();
    expect(body.result.kind).toBe("help");
    expect(body.trace[0].tool).toBe("prescreen");
    expect(body.trace.some((step: { tool: string }) => step.tool === "classify_intent")).toBe(false);
    expect(classifier).not.toHaveBeenCalled();
  });
  it("keeps the Spanish emergency path", async () => {
    vi.stubEnv("MOCK_MODE", "1");
    const body = await (await POST(request("auto", "Tengo dolor de pecho", "es"))).json();
    expect(body.result.kind).toBe("help");
  });
  it("passes spoken appointment details to read_document as data", async () => {
    vi.stubEnv("MOCK_MODE", "1");
    const body = await (await POST(request("auto", "My visit is on Tuesday, November 10, 2026 at 2:00 PM"))).json();
    const readable = body.result.confirm.items.filter((item: { readable: boolean }) => item.readable);
    expect(readable.length).toBeGreaterThan(0);
    expect(body.trace.map((step: { tool: string }) => step.tool)).toContain("read_document");
  });
  it("requires input.text", async () => {
    const response = await POST(request("auto"));
    expect(response.status).toBe(400);
  });
});
