import { describe, it, expect } from 'vitest';
import { checkWordTimings, fixTimings, refineTimings } from '../src/subtitle-tool/utils/alignWords';
import type { Segment, WordTimestamp } from '../src/subtitle-tool/types';

describe('alignWords: checkWordTimings', () => {
  it('detects healthy word timings', () => {
    const words: WordTimestamp[] = [
      { word: 'Hello', start: 0.0, end: 0.5 },
      { word: 'world', start: 0.5, end: 1.0 },
    ];
    const check = checkWordTimings(words);
    expect(check.hasIssues).toBe(false);
    expect(check.collapsedCount).toBe(0);
  });

  it('detects collapsed words shorter than 60ms', () => {
    const words: WordTimestamp[] = [
      { word: 'Zero', start: 0.0, end: 0.02 }, // 20ms
      { word: 'normal', start: 0.02, end: 0.5 },
    ];
    const check = checkWordTimings(words);
    expect(check.hasIssues).toBe(true);
    expect(check.collapsedCount).toBe(1);
  });

  it('detects overly long words (> 2.5s) and overlaps', () => {
    const words: WordTimestamp[] = [
      { word: 'First', start: 0.0, end: 3.0 }, // 3.0s
      { word: 'Overlap', start: 2.0, end: 3.5 }, // starts before First ends
    ];
    const check = checkWordTimings(words);
    expect(check.hasIssues).toBe(true);
    expect(check.overlyLongCount).toBe(1);
    expect(check.overlapCount).toBe(1);
  });
});

describe('alignWords: fixTimings', () => {
  it('proportionally redistributes word durations based on character count', () => {
    const segment: Segment = {
      id: 's1',
      index: 1,
      start: 1.0,
      end: 3.0, // 2.0s duration
      text: 'Hi incredible world',
      words: [
        { word: 'Hi', start: 1.0, end: 1.01 }, // collapsed
        { word: 'incredible', start: 1.01, end: 1.02 }, // collapsed
        { word: 'world', start: 1.02, end: 1.03 }, // collapsed
      ],
    };

    const fixed = fixTimings(segment);
    expect(fixed.words?.length).toBe(3);

    const w0 = fixed.words![0];
    const w1 = fixed.words![1];
    const w2 = fixed.words![2];

    // 'incredible' (10 chars) should get significantly more duration than 'Hi' (2 chars)
    const durHi = w0.end - w0.start;
    const durIncredible = w1.end - w1.start;
    expect(durIncredible).toBeGreaterThan(durHi * 2);

    // Monotonic
    expect(w1.start).toBeGreaterThanOrEqual(w0.end);
    expect(w2.start).toBeGreaterThanOrEqual(w1.end);

    // Min duration respected
    expect(durHi).toBeGreaterThanOrEqual(0.06);
  });
});

describe('alignWords: refineTimings with synthetic audio', () => {
  it('snaps word start to energy burst', () => {
    const sampleRate = 16000;
    // 1 second of audio: silence from 0 to 0.4s, tone burst at 0.5s
    const totalSamples = sampleRate * 1;
    const samples = new Float32Array(totalSamples);

    // Create a 440Hz sine wave tone burst between 0.50s and 0.80s
    const burstStart = Math.floor(sampleRate * 0.5);
    const burstEnd = Math.floor(sampleRate * 0.8);
    for (let i = burstStart; i < burstEnd; i++) {
      samples[i] = 0.8 * Math.sin((2 * Math.PI * 440 * i) / sampleRate);
    }

    // Word originally estimated at 0.45s (drifted 50ms early before tone burst)
    const segments: Segment[] = [
      {
        id: 's1',
        index: 1,
        start: 0.4,
        end: 0.9,
        text: 'Tone',
        words: [{ word: 'Tone', start: 0.45, end: 0.85 }],
      },
    ];

    const refined = refineTimings(samples, sampleRate, segments);
    const refinedWord = refined[0].words![0];

    // Should snap close to 0.50s (within 0.02s accuracy)
    expect(Math.abs(refinedWord.start - 0.5)).toBeLessThanOrEqual(0.03);
    expect(refinedWord.end).toBeGreaterThan(refinedWord.start);
  });
});
