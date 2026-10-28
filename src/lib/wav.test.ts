import { describe, expect, it } from "vitest";
import { encodeWav, resampleMono } from "./wav";
import { validateTranscribeWav } from "./wavValidation";
describe("WAV encoding", () => {
  it("writes RIFF PCM mono 16-bit fields and clips samples", () => {
    const bytes = encodeWav(new Float32Array([-2, 0, 2])); const view = new DataView(bytes.buffer);
    expect(String.fromCharCode(...bytes.subarray(0, 4))).toBe("RIFF"); expect(view.getUint32(24, true)).toBe(16000); expect(view.getUint16(20, true)).toBe(1); expect(view.getUint16(22, true)).toBe(1); expect(view.getUint16(34, true)).toBe(16); expect(view.getInt16(44, true)).toBe(-32768); expect(view.getInt16(48, true)).toBe(32767);
  });
  it("mixes channels and produces the expected resampled length", () => {
    expect(resampleMono([new Float32Array([1, 1, 1, 1]), new Float32Array([0, 0, 0, 0])], 32000)).toHaveLength(2);
  });
  it("validates valid WAV and rejects wrong headers", () => { const valid = encodeWav(new Float32Array([0])); expect(validateTranscribeWav(valid)).toBeNull(); valid[0] = 0; expect(validateTranscribeWav(valid)).toContain("WAV file"); });
});
