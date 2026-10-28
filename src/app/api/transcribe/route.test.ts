import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/meta/transcribe", () => ({ transcribe: vi.fn(async () => ({ transcript: "example", mock: true })) }));
import { POST } from "./route";
import { encodeWav } from "@/lib/wav";
function request(bytes: Uint8Array): Request { const form = new FormData(); form.append("audio", new Blob([bytes.slice().buffer as ArrayBuffer]), "test.wav"); form.append("lang", "en"); return new Request("http://local/api/transcribe", { method: "POST", body: form }); }
describe("transcribe WAV validation", () => {
  it("accepts a supported WAV", async () => { const response = await POST(request(encodeWav(new Float32Array([0])))); expect(response.status).toBe(200); });
  it("returns a plain 400 for invalid audio", async () => { const response = await POST(request(new Uint8Array([1, 2, 3]))); expect(response.status).toBe(400); expect((await response.json()).error).toMatch(/empty|WAV/); });
});
