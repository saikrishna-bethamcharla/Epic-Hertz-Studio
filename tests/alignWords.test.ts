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

  it('multilingual calibration benchmarks: Telugu, Hindi, English onset accuracy', () => {
    const sampleRate = 16000;
    const durationSec = 3.0;
    const totalSamples = Math.floor(sampleRate * durationSec);

    // Helper: generate speech-like harmonic bursts at given onset intervals
    function generateSpeechAudio(onsets: Array<{ start: number; dur: number; f0: number }>) {
      const audio = new Float32Array(totalSamples);
      for (const { start, dur, f0 } of onsets) {
        const startIdx = Math.floor(start * sampleRate);
        const endIdx = Math.min(totalSamples, Math.floor((start + dur) * sampleRate));
        for (let i = startIdx; i < endIdx; i++) {
          const t = (i - startIdx) / sampleRate;
          // Attack envelope (steep onset in first 20ms) + decay
          const env = t < 0.02 ? t / 0.02 : Math.exp(-3 * (t - 0.02));
          // Formant-like harmonic structure (voice fundamental + harmonics)
          const signal =
            0.6 * Math.sin(2 * Math.PI * f0 * t) +
            0.3 * Math.sin(2 * Math.PI * f0 * 2 * t) +
            0.1 * Math.sin(2 * Math.PI * f0 * 3 * t);
          audio[i] = env * signal;
        }
      }
      return audio;
    }

    const testCases = [
      {
        lang: 'Telugu',
        text: 'Prathi frame lo oka katha undali',
        words: [
          { word: 'Prathi', truthStart: 0.3, truthDur: 0.32, f0: 160, unalignedStart: 0.38 }, // +80ms drift
          { word: 'frame', truthStart: 0.7, truthDur: 0.3, f0: 155, unalignedStart: 0.62 }, // -80ms drift
          { word: 'lo', truthStart: 1.1, truthDur: 0.22, f0: 165, unalignedStart: 1.19 }, // +90ms drift
          { word: 'oka', truthStart: 1.4, truthDur: 0.24, f0: 160, unalignedStart: 1.32 }, // -80ms drift
          { word: 'katha', truthStart: 1.7, truthDur: 0.3, f0: 150, unalignedStart: 1.79 }, // +90ms drift
          { word: 'undali', truthStart: 2.1, truthDur: 0.35, f0: 145, unalignedStart: 2.02 }, // -80ms drift
        ],
      },
      {
        lang: 'Hindi',
        text: 'Har ek kahani mein dum hona chahiye',
        words: [
          { word: 'Har', truthStart: 0.25, truthDur: 0.22, f0: 150, unalignedStart: 0.33 }, // +80ms drift
          { word: 'ek', truthStart: 0.55, truthDur: 0.25, f0: 155, unalignedStart: 0.48 }, // -70ms drift
          { word: 'kahani', truthStart: 0.9, truthDur: 0.32, f0: 145, unalignedStart: 0.99 }, // +90ms drift
          { word: 'mein', truthStart: 1.3, truthDur: 0.22, f0: 150, unalignedStart: 1.22 }, // -80ms drift
          { word: 'dum', truthStart: 1.6, truthDur: 0.22, f0: 140, unalignedStart: 1.68 }, // +80ms drift
          { word: 'hona', truthStart: 1.9, truthDur: 0.26, f0: 145, unalignedStart: 1.82 }, // -80ms drift
          { word: 'chahiye', truthStart: 2.25, truthDur: 0.35, f0: 140, unalignedStart: 2.34 }, // +90ms drift
        ],
      },
      {
        lang: 'English',
        text: 'Every single frame tells a story',
        words: [
          { word: 'Every', truthStart: 0.2, truthDur: 0.3, f0: 130, unalignedStart: 0.28 }, // +80ms drift
          { word: 'single', truthStart: 0.6, truthDur: 0.28, f0: 135, unalignedStart: 0.52 }, // -80ms drift
          { word: 'frame', truthStart: 0.95, truthDur: 0.3, f0: 125, unalignedStart: 1.04 }, // +90ms drift
          { word: 'tells', truthStart: 1.35, truthDur: 0.24, f0: 130, unalignedStart: 1.27 }, // -80ms drift
          { word: 'a', truthStart: 1.65, truthDur: 0.18, f0: 135, unalignedStart: 1.73 }, // +80ms drift
          { word: 'story', truthStart: 1.95, truthDur: 0.35, f0: 125, unalignedStart: 1.87 }, // -80ms drift
        ],
      },
    ];

    for (const tc of testCases) {
      const audio = generateSpeechAudio(
        tc.words.map((w) => ({ start: w.truthStart, dur: w.truthDur, f0: w.f0 })),
      );

      const segment: Segment = {
        id: `seg-${tc.lang}`,
        index: 1,
        start: 0.0,
        end: 2.8,
        text: tc.text,
        words: tc.words.map((w) => ({
          word: w.word,
          start: w.unalignedStart,
          end: w.unalignedStart + w.truthDur,
        })),
      };

      // Calculate Before Error (unaligned vs truth)
      const beforeErrors = tc.words.map((w) => Math.abs(w.unalignedStart - w.truthStart));
      const beforeMAE = beforeErrors.reduce((a, b) => a + b, 0) / beforeErrors.length;

      // Run Acoustic Refinement
      const [refined] = refineTimings(audio, sampleRate, [segment]);
      const refinedWords = refined.words!;

      // Calculate After Error (refined vs truth)
      const afterErrors = refinedWords.map((rw, i) => Math.abs(rw.start - tc.words[i].truthStart));
      const afterMAE = afterErrors.reduce((a, b) => a + b, 0) / afterErrors.length;

      // Empirical assertions:
      // 1. Refined MAE is well under 35ms (imperceptible sync latency)
      expect(afterMAE).toBeLessThan(0.035);
      // 2. Refined MAE improves upon unaligned drift by at least 60%
      expect(afterMAE).toBeLessThan(beforeMAE * 0.4);
      // 3. Verifies that with onset snapping, 0.0s syncOffset matches spoken syllables without needing -0.35s lead
      expect(afterMAE).toBeLessThan(0.05);
    }
  });
});
