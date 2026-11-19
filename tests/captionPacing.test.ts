import { describe, it, expect } from 'vitest';
import {
  rechunkSegments,
  transformTextCase,
  stripSmartPunctuation,
  splitSegmentAtCursor,
  mergeAdjacentSegments,
  autoPairEmojis,
  getCutIntervals,
  toggleWordCut,
  detectLongPauses,
} from '../src/subtitle-tool/utils/captionPacing';
import type { Segment } from '../src/subtitle-tool/types';

describe('Caption Pacing & Formatting Engine', () => {
  const sampleSegments: Segment[] = [
    {
      id: 'seg-1',
      index: 1,
      start: 1.0,
      end: 3.5,
      text: 'This is the most viral video in the world.',
      words: [
        { word: 'This', start: 1.0, end: 1.3 },
        { word: 'is', start: 1.3, end: 1.5 },
        { word: 'the', start: 1.5, end: 1.7 },
        { word: 'most', start: 1.7, end: 2.1 },
        { word: 'viral', start: 2.1, end: 2.6 },
        { word: 'video', start: 2.6, end: 3.0 },
        { word: 'in', start: 3.0, end: 3.1 },
        { word: 'the', start: 3.1, end: 3.2 },
        { word: 'world.', start: 3.2, end: 3.5 },
      ],
    },
  ];

  it('re-chunks captions into 1-word rapid fire kinetic mode', () => {
    const oneWord = rechunkSegments(sampleSegments, '1-word');
    expect(oneWord.length).toBe(9);
    expect(oneWord[0].text).toBe('This');
    expect(oneWord[0].start).toBe(1.0);
    expect(oneWord[8].text).toBe('world.');
    expect(oneWord[8].end).toBeGreaterThanOrEqual(3.5);
  });

  it('re-chunks captions into 2-3 words punchy phrase mode', () => {
    const punchy = rechunkSegments(sampleSegments, '2-3-words');
    expect(punchy.length).toBeGreaterThanOrEqual(3);
    expect(punchy.every((s) => (s.words?.length ?? 0) <= 3)).toBe(true);
    expect(punchy[0].start).toBe(1.0);
  });

  it('transforms text casing to ALL CAPS, Title Case, and lowercase', () => {
    const upper = transformTextCase(sampleSegments, 'upper');
    expect(upper[0].text).toBe('THIS IS THE MOST VIRAL VIDEO IN THE WORLD.');
    expect(upper[0].words?.[0].word).toBe('THIS');

    const title = transformTextCase(sampleSegments, 'title');
    expect(title[0].text).toContain('Viral');

    const lower = transformTextCase(sampleSegments, 'lower');
    expect(lower[0].text).toBe('this is the most viral video in the world.');
  });

  it('strips smart punctuation while keeping words intact', () => {
    const stripped = stripSmartPunctuation(sampleSegments);
    expect(stripped[0].text).toBe('This is the most viral video in the world');
    expect(stripped[0].words?.find((w) => w.word === 'world')).toBeDefined();
  });

  it('splits segment at cursor position accurately', () => {
    const seg = sampleSegments[0];
    // Split at index 11 (after "This is the")
    const [left, right] = splitSegmentAtCursor(seg, 11);
    expect(left.text).toBe('This is the');
    expect(right.text).toBe('most viral video in the world.');
    expect(left.end).toBeLessThanOrEqual(right.start);
  });

  it('merges adjacent segments smoothly', () => {
    const seg1: Segment = {
      id: 'seg-a',
      index: 1,
      start: 1.0,
      end: 2.0,
      text: 'First part',
      words: [
        { word: 'First', start: 1.0, end: 1.5 },
        { word: 'part', start: 1.5, end: 2.0 },
      ],
    };
    const seg2: Segment = {
      id: 'seg-b',
      index: 2,
      start: 2.0,
      end: 3.5,
      text: 'second part',
      words: [
        { word: 'second', start: 2.0, end: 2.7 },
        { word: 'part', start: 2.7, end: 3.5 },
      ],
    };

    const merged = mergeAdjacentSegments(seg1, seg2);
    expect(merged.text).toBe('First part second part');
    expect(merged.start).toBe(1.0);
    expect(merged.end).toBe(3.5);
    expect(merged.words?.length).toBe(4);
  });

  it('auto-pairs high-retention trigger words with kinetic animated emojis', () => {
    const segWithTriggers: Segment[] = [
      {
        id: 'seg-trig',
        index: 1,
        start: 0,
        end: 3,
        text: 'This strategy brought insane growth and money.',
      },
    ];

    const { segments: result, matchedCount } = autoPairEmojis(segWithTriggers);
    expect(matchedCount).toBeGreaterThanOrEqual(2);
    expect(result[0].text).toContain('💰');
    expect(result[0].text).toContain('📈');
  });

  it('toggles word cut and collects merged cut intervals accurately', () => {
    const segs: Segment[] = [
      {
        id: 'seg-cut-test',
        index: 1,
        start: 0,
        end: 4.0,
        text: 'hello um world uh yeah',
        words: [
          { word: 'hello', start: 0, end: 0.5 },
          { word: 'um', start: 0.5, end: 1.2 },
          { word: 'world', start: 1.2, end: 2.0 },
          { word: 'uh', start: 2.0, end: 2.8 },
          { word: 'yeah', start: 2.8, end: 3.5 },
        ],
      },
    ];

    // Cut "um" (index 1) and "uh" (index 3)
    let updated = toggleWordCut(segs, 'seg-cut-test', 1);
    updated = toggleWordCut(updated, 'seg-cut-test', 3);

    expect(updated[0].words?.[1].isCut).toBe(true);
    expect(updated[0].words?.[3].isCut).toBe(true);
    expect(updated[0].words?.[0].isCut).toBeFalsy();

    const cuts = getCutIntervals(updated);
    expect(cuts.length).toBe(2);
    expect(cuts[0]).toEqual({ start: 0.5, end: 1.2 });
    expect(cuts[1]).toEqual({ start: 2.0, end: 2.8 });

    // Un-cut "um"
    const restored = toggleWordCut(updated, 'seg-cut-test', 1);
    expect(restored[0].words?.[1].isCut).toBe(false);
    const cutsRestored = getCutIntervals(restored);
    expect(cutsRestored.length).toBe(1);
    expect(cutsRestored[0]).toEqual({ start: 2.0, end: 2.8 });
  });

  it('detects dead-air pauses between segments exceeding threshold', () => {
    const pausedSegs: Segment[] = [
      { id: 's1', index: 1, start: 1.0, end: 2.0, text: 'Hello' },
      { id: 's2', index: 2, start: 3.2, end: 4.0, text: 'World' }, // gap of 1.2s (> 0.6s)
      { id: 's3', index: 3, start: 4.2, end: 5.0, text: 'Again' }, // gap of 0.2s (< 0.6s)
    ];

    const pauses = detectLongPauses(pausedSegs, 0.6);
    expect(pauses.length).toBe(1);
    expect(pauses[0].start).toBe(2.0);
    expect(pauses[0].end).toBe(3.2);
    expect(pauses[0].duration).toBe(1.2);
  });
});
