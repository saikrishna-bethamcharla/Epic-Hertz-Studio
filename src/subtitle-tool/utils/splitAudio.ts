// ─── Audio chunking ─────────────────────────────────────────────────────────
// The transcription endpoint runs on a serverless function whose request body
// is capped (~4.5 MB on Vercel). 16 kHz mono WAV is ~1.9 MB per minute, so any
// video longer than ~2 minutes must be sent in pieces.
//
// This splits a PCM WAV into chunks that each fit under `maxChunkBytes`,
// choosing every cut at the quietest moment near the target length so words
// are not sliced in half. Each chunk is a standalone WAV plus its offset (in
// seconds) so caption timestamps can be shifted back onto the full timeline.

import type { Segment } from '../types';

export interface AudioChunk {
  blob: Blob;
  /** Start of this chunk on the original timeline, in seconds. */
  offsetSec: number;
  durationSec: number;
}

export interface SplitOptions {
  /** Hard ceiling for one chunk, header included. Keep below the server's cap. */
  maxChunkBytes?: number;
  /** How far either side of the ideal cut point we look for silence (seconds). */
  searchWindowSec?: number;
  /** Never leave a trailing chunk shorter than this (seconds). */
  minTailSec?: number;
}

interface WavInfo {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  dataOffset: number;
  dataSize: number;
}

const DEFAULTS: Required<SplitOptions> = {
  maxChunkBytes: 3_800_000,
  searchWindowSec: 6,
  minTailSec: 10,
};

/** Minimal RIFF parser. Returns null for anything that is not 16-bit PCM WAV. */
export function parseWav(buf: ArrayBuffer): WavInfo | null {
  if (buf.byteLength < 44) return null;
  const v = new DataView(buf);
  const tag = (o: number) =>
    String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') return null;

  let sampleRate = 0;
  let channels = 0;
  let bitsPerSample = 0;
  let format = 0;
  let pos = 12;
  while (pos + 8 <= buf.byteLength) {
    const id = tag(pos);
    const size = v.getUint32(pos + 4, true);
    const body = pos + 8;
    if (id === 'fmt ') {
      format = v.getUint16(body, true);
      channels = v.getUint16(body + 2, true);
      sampleRate = v.getUint32(body + 4, true);
      bitsPerSample = v.getUint16(body + 14, true);
    } else if (id === 'data') {
      if (format !== 1 || bitsPerSample !== 16 || channels < 1 || sampleRate < 1) return null;
      // Some encoders leave the size as 0 / 0xFFFFFFFF when streaming; clamp to the file.
      const available = buf.byteLength - body;
      const dataSize = size === 0 || size > available ? available : size;
      return { sampleRate, channels, bitsPerSample, dataOffset: body, dataSize };
    }
    pos = body + size + (size % 2); // chunks are word-aligned
  }
  return null;
}

function buildWav(pcm: ArrayBuffer, info: Pick<WavInfo, 'sampleRate' | 'channels'>): Blob {
  const header = new ArrayBuffer(44);
  const v = new DataView(header);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  const blockAlign = info.channels * 2;
  w(0, 'RIFF');
  v.setUint32(4, 36 + pcm.byteLength, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, info.channels, true);
  v.setUint32(24, info.sampleRate, true);
  v.setUint32(28, info.sampleRate * blockAlign, true);
  v.setUint16(32, blockAlign, true);
  v.setUint16(34, 16, true);
  w(36, 'data');
  v.setUint32(40, pcm.byteLength, true);
  return new Blob([header, pcm], { type: 'audio/wav' });
}

/** Index (in frames) of the quietest 50 ms window within [from, to). */
function quietestFrame(
  samples: Int16Array,
  channels: number,
  sampleRate: number,
  from: number,
  to: number,
): number {
  const win = Math.max(1, Math.floor(sampleRate * 0.05)); // 50 ms in frames
  let bestPos = Math.floor((from + to) / 2);
  let bestEnergy = Infinity;
  for (let start = from; start + win <= to; start += win) {
    let sum = 0;
    for (let f = start; f < start + win; f++) {
      const s = samples[f * channels]; // first channel is enough to find a pause
      sum += s * s;
    }
    if (sum < bestEnergy) {
      bestEnergy = sum;
      bestPos = start + (win >> 1);
    }
  }
  return bestPos;
}

/**
 * Split a WAV blob into upload-sized chunks. Returns a single chunk (the
 * original blob) when it already fits, or when the input is not 16-bit PCM WAV.
 */
export async function splitWavForUpload(
  wav: Blob,
  options: SplitOptions = {},
): Promise<AudioChunk[]> {
  const opt = { ...DEFAULTS, ...options };
  const buf = await wav.arrayBuffer();
  const info = parseWav(buf);

  if (!info) {
    return [{ blob: wav, offsetSec: 0, durationSec: 0 }];
  }

  const frameBytes = info.channels * 2;
  const totalFrames = Math.floor(info.dataSize / frameBytes);
  const totalSec = totalFrames / info.sampleRate;

  if (buf.byteLength <= opt.maxChunkBytes) {
    return [{ blob: wav, offsetSec: 0, durationSec: totalSec }];
  }

  const bytesPerSec = info.sampleRate * frameBytes;
  const maxChunkSec = Math.floor((opt.maxChunkBytes - 44) / bytesPerSec);
  const winSec = Math.min(opt.searchWindowSec, Math.max(1, Math.floor(maxChunkSec / 6)));
  const tailSec = Math.min(opt.minTailSec, Math.max(1, Math.floor(maxChunkSec / 6)));
  const targetSec = Math.max(5, maxChunkSec - winSec - tailSec);

  // Interpret PCM as Int16 (little-endian). Copy so alignment is guaranteed.
  const pcmBytes = buf.slice(info.dataOffset, info.dataOffset + totalFrames * frameBytes);
  const samples = new Int16Array(pcmBytes);

  const chunks: AudioChunk[] = [];
  let startFrame = 0;

  while ((totalFrames - startFrame) / info.sampleRate > targetSec + winSec + tailSec) {
    const centre = startFrame + Math.floor(targetSec * info.sampleRate);
    const lo = Math.max(
      startFrame + Math.floor(info.sampleRate * 5),
      centre - Math.floor(winSec * info.sampleRate),
    );
    const hi = Math.min(totalFrames, centre + Math.floor(winSec * info.sampleRate));
    const cut = quietestFrame(samples, info.channels, info.sampleRate, lo, hi);

    chunks.push(makeChunk(pcmBytes, info, startFrame, cut));
    startFrame = cut;
  }
  chunks.push(makeChunk(pcmBytes, info, startFrame, totalFrames));
  return chunks;
}

function makeChunk(
  pcm: ArrayBuffer,
  info: WavInfo,
  startFrame: number,
  endFrame: number,
): AudioChunk {
  const frameBytes = info.channels * 2;
  const slice = pcm.slice(startFrame * frameBytes, endFrame * frameBytes);
  return {
    blob: buildWav(slice, info),
    offsetSec: startFrame / info.sampleRate,
    durationSec: (endFrame - startFrame) / info.sampleRate,
  };
}

/** Shift one chunk's captions (and their per-word timings) onto the full timeline. */
export function shiftSegments(segments: Segment[], offsetSec: number): Segment[] {
  if (!offsetSec) return segments;
  return segments.map((s) => ({
    ...s,
    start: s.start + offsetSec,
    end: s.end + offsetSec,
    words: s.words?.map((w) => ({ ...w, start: w.start + offsetSec, end: w.end + offsetSec })),
  }));
}

/** Sort, de-overlap, and renumber segments gathered from several chunks. */
export function mergeSegments(parts: Segment[][]): Segment[] {
  const stamp = Date.now();
  const all = parts.flat().sort((a, b) => a.start - b.start);
  for (let i = 1; i < all.length; i++) {
    if (all[i].start < all[i - 1].end && all[i].start > all[i - 1].start) {
      all[i - 1] = { ...all[i - 1], end: all[i].start };
    }
  }
  return all.map((s, i) => ({ ...s, id: `seg-${i + 1}-${stamp}`, index: i + 1 }));
}
