const MAX_BYTES = 8 * 1024 * 1024;
export function validateTranscribeWav(bytes: Uint8Array): string | null {
  if (bytes.length > MAX_BYTES) return "Audio file is too large. Maximum size is 8 MB.";
  if (bytes.length < 46) return "Audio file is empty or too short.";
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset: number, length: number) => String.fromCharCode(...bytes.subarray(offset, offset + length));
  if (text(0, 4) !== "RIFF" || text(8, 4) !== "WAVE") return "Audio must be a WAV file.";
  if (view.getUint16(20, true) !== 1) return "WAV audio must use PCM format.";
  if (view.getUint16(22, true) !== 1) return "WAV audio must be mono.";
  const rate = view.getUint32(24, true);
  if (rate !== 16000 && rate !== 24000) return "WAV audio must use 16000 or 24000 Hz.";
  if (view.getUint16(34, true) !== 16) return "WAV audio must use 16-bit samples.";
  if (view.getUint32(40, true) < 2 || bytes.length <= 44) return "Audio file is empty.";
  return null;
}
