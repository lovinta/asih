// Pure PCM WAV helpers for voice notes.
export function resampleMono(channels: readonly Float32Array[], sourceRate: number, targetRate = 16000): Float32Array {
  if (!channels.length || channels.some((channel) => channel.length !== channels[0].length)) throw new Error("Audio channels must have matching samples.");
  if (sourceRate <= 0 || targetRate <= 0) throw new Error("Sample rates must be positive.");
  const frames = channels[0].length;
  const mono = new Float32Array(frames);
  for (const channel of channels) for (let i = 0; i < frames; i++) mono[i] += channel[i] / channels.length;
  const length = Math.ceil(frames * targetRate / sourceRate);
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const position = i * sourceRate / targetRate;
    const left = Math.min(Math.floor(position), Math.max(frames - 1, 0));
    const right = Math.min(left + 1, Math.max(frames - 1, 0));
    const fraction = position - left;
    out[i] = (mono[left] ?? 0) * (1 - fraction) + (mono[right] ?? 0) * fraction;
  }
  return out;
}

export function encodeWav(samples: Float32Array, sampleRate = 16000): Uint8Array {
  const bytes = new Uint8Array(44 + samples.length * 2);
  const view = new DataView(bytes.buffer);
  const ascii = (offset: number, value: string) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  ascii(0, "RIFF"); view.setUint32(4, bytes.length - 8, true); ascii(8, "WAVE"); ascii(12, "fmt ");
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  ascii(36, "data"); view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, i) => {
    const clipped = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * 2, clipped < 0 ? Math.round(clipped * 32768) : Math.round(clipped * 32767), true);
  });
  return bytes;
}

export function audioBufferToWav(buffer: AudioBuffer, sampleRate = 16000): Uint8Array {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  return encodeWav(resampleMono(channels, buffer.sampleRate, sampleRate), sampleRate);
}
