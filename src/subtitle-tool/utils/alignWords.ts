// ─── Word Timing & Audio Energy Alignment ────────────────────────────────────
// Refines word-level timestamps by snapping onsets to the short-time acoustic energy
// envelope of the 16 kHz mono audio track. Enforces strict monotonicity and duration bounds.

import type { Segment, WordTimestamp } from '../types';
import { parseWav } from './splitAudio';

export interface AlignmentOptions {
  /** Search window around target timestamp in seconds (default: 0.12s / 120ms). */
  searchWindowSec?: number;
  /** Minimum allowed word duration in seconds (default: 0.06s / 60ms). */
  minWordDurationSec?: number;
  /** Minimum allowed segment duration in seconds (default: 0.35s). */
  minSegmentDurationSec?: number;
}

export interface WordTimingIssue {
  hasIssues: boolean;
  collapsedCount: number;
  overlyLongCount: number;
  overlapCount: number;
}

/**
 * Checks for word-level timing anomalies (< 60ms, > 2.5s, or non-monotonic overlaps).
 */
export function checkWordTimings(words?: WordTimestamp[]): WordTimingIssue {
  if (!words || words.length === 0) {
    return { hasIssues: false, collapsedCount: 0, overlyLongCount: 0, overlapCount: 0 };
  }

  let collapsedCount = 0;
  let overlyLongCount = 0;
  let overlapCount = 0;

  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const dur = w.end - w.start;
    if (dur < 0.06) collapsedCount++;
    if (dur > 2.5) overlyLongCount++;
    if (i > 0 && w.start < words[i - 1].end - 0.01) overlapCount++;
  }

  const hasIssues = collapsedCount > 0 || overlyLongCount > 0 || overlapCount > 0;
  return { hasIssues, collapsedCount, overlyLongCount, overlapCount };
}

/**
 * Heuristically redistributes word timings inside a segment based on character counts.
 * Useful as a 1-click fix when model timestamps drift or collapse into zero duration.
 */
export function fixTimings(segment: Segment): Segment {
  if (!segment.words || segment.words.length === 0) return segment;

  const totalDuration = Math.max(0.4, segment.end - segment.start);
  const words = segment.words;
  const numWords = words.length;

  // Total characters across all words (minimum 1 char per word)
  const charWeights = words.map((w) => Math.max(1, w.word.trim().length));
  const totalChars = charWeights.reduce((a, b) => a + b, 0);

  // Reserve small pauses between words (20ms each)
  const totalPause = Math.min(totalDuration * 0.15, (numWords - 1) * 0.02);
  const speechBudget = totalDuration - totalPause;
  const pausePerWord = numWords > 1 ? totalPause / (numWords - 1) : 0;

  let cursor = segment.start;
  const newWords: WordTimestamp[] = [];

  for (let i = 0; i < numWords; i++) {
    const wordDur = Math.max(0.06, (charWeights[i] / totalChars) * speechBudget);
    const start = +cursor.toFixed(2);
    const end = +(cursor + wordDur).toFixed(2);
    newWords.push({
      word: words[i].word,
      start,
      end,
    });
    cursor += wordDur + pausePerWord;
  }

  return {
    ...segment,
    start: newWords[0].start,
    end: Math.max(segment.end, newWords[newWords.length - 1].end),
    words: newWords,
  };
}

/**
 * Snaps word onsets to audio energy peaks (10 ms hop envelope) within searchWindowSec.
 */
export function refineTimings(
  samples: Float32Array | Int16Array,
  sampleRate: number,
  segments: Segment[],
  options: AlignmentOptions = {},
): Segment[] {
  if (!samples || samples.length === 0 || sampleRate <= 0) return segments;

  const searchWindowSec = options.searchWindowSec ?? 0.12;
  const minWordDuration = options.minWordDurationSec ?? 0.06;
  const minSegDuration = options.minSegmentDurationSec ?? 0.35;

  const hopSize = Math.max(1, Math.floor(sampleRate * 0.01)); // 10 ms hop
  const winSize = hopSize * 2; // 20 ms window
  const numHops = Math.floor((samples.length - winSize) / hopSize);

  if (numHops <= 0) return segments;

  // 1. Calculate RMS energy envelope
  const isInt16 = samples instanceof Int16Array;
  const normFactor = isInt16 ? 32768 : 1;
  const energy = new Float32Array(numHops);

  for (let h = 0; h < numHops; h++) {
    const offset = h * hopSize;
    let sum = 0;
    for (let i = 0; i < winSize; i++) {
      const v = samples[offset + i] / normFactor;
      sum += v * v;
    }
    energy[h] = Math.sqrt(sum / winSize);
  }

  // 2. Compute half-wave rectified onset flux (positive energy derivative)
  const onsetFlux = new Float32Array(numHops);
  let avgFlux = 0;
  for (let h = 1; h < numHops; h++) {
    const diff = energy[h] - energy[h - 1];
    onsetFlux[h] = diff > 0 ? diff : 0;
    avgFlux += onsetFlux[h];
  }
  avgFlux /= numHops;
  const onsetThreshold = avgFlux * 0.4;

  const searchHops = Math.round((searchWindowSec * sampleRate) / hopSize);

  // 3. Refine word timestamps
  return segments.map((seg) => {
    if (!seg.words || seg.words.length === 0) return seg;

    let prevEnd = seg.start;
    const refinedWords: WordTimestamp[] = [];

    for (let i = 0; i < seg.words.length; i++) {
      const w = seg.words[i];
      const targetHop = Math.round((w.start * sampleRate) / hopSize);
      const startHop = Math.max(0, targetHop - searchHops);
      const endHop = Math.min(numHops - 1, targetHop + searchHops);

      let bestHop = targetHop;
      let maxStrength = -1;

      for (let h = startHop; h <= endHop; h++) {
        if (onsetFlux[h] > maxStrength && onsetFlux[h] >= onsetThreshold) {
          maxStrength = onsetFlux[h];
          bestHop = h;
        }
      }

      let refinedStart = (bestHop * hopSize) / sampleRate;

      // Maintain strict monotonicity: cannot start before previous word ends
      if (refinedStart < prevEnd) {
        refinedStart = prevEnd;
      }

      // Word duration must satisfy minWordDuration
      let refinedEnd = Math.max(refinedStart + minWordDuration, w.end);
      if (refinedEnd < refinedStart + minWordDuration) {
        refinedEnd = refinedStart + minWordDuration;
      }

      prevEnd = refinedEnd;

      refinedWords.push({
        word: w.word,
        start: +refinedStart.toFixed(2),
        end: +refinedEnd.toFixed(2),
      });
    }

    const segStart = refinedWords[0].start;
    const segEnd = Math.max(refinedWords[refinedWords.length - 1].end, segStart + minSegDuration);

    return {
      ...seg,
      start: +segStart.toFixed(2),
      end: +segEnd.toFixed(2),
      words: refinedWords,
    };
  });
}

/**
 * Helper to refine segments directly from a 16kHz mono WAV Blob or ArrayBuffer.
 */
export async function refineSegmentsFromAudio(
  audio: Blob | ArrayBuffer,
  segments: Segment[],
): Promise<Segment[]> {
  try {
    const buf = audio instanceof Blob ? await audio.arrayBuffer() : audio;
    const info = parseWav(buf);
    if (!info) return segments;

    const samples = new Int16Array(buf, info.dataOffset, Math.floor(info.dataSize / 2));
    return refineTimings(samples, info.sampleRate, segments);
  } catch (err) {
    console.warn('Audio timing alignment skipped:', err);
    return segments;
  }
}
