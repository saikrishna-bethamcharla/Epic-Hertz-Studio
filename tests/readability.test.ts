import { describe, it, expect } from 'vitest';
import { getCPS, getWPM, checkReadability } from '../src/subtitle-tool/utils/readability';
import type { Segment } from '../src/subtitle-tool/types';

describe('readability: getCPS & getWPM', () => {
  it('calculates characters per second correctly normalizing excess whitespace', () => {
    const seg: Segment = {
      id: '1',
      index: 1,
      start: 0,
      end: 2.0,
      text: 'Hello    world!   ', // 12 chars normalized ('Hello world!')
    };
    expect(getCPS(seg)).toBe(6.0);
  });

  it('calculates words per minute correctly', () => {
    const seg: Segment = {
      id: '1',
      index: 1,
      start: 0,
      end: 2.0,
      text: 'One two three four', // 4 words in 2 seconds = 120 WPM
    };
    expect(getWPM(seg)).toBe(120);
  });
});

describe('readability: checkReadability', () => {
  it('returns no issues for optimal captions', () => {
    const seg: Segment = {
      id: '1',
      index: 1,
      start: 0,
      end: 2.5,
      text: 'This is a well-paced subtitle line.',
    };
    const issues = checkReadability(seg);
    expect(issues.length).toBe(0);
  });

  it('flags warning for high reading speed (> 21 CPS)', () => {
    const seg: Segment = {
      id: '1',
      index: 1,
      start: 0,
      end: 1.0,
      text: 'This is quite fast paced text here', // 34 chars / 1s = 34 CPS (> 26 is error)
    };
    const issues = checkReadability(seg);
    expect(issues.some((i) => i.type === 'speed' && i.severity === 'error')).toBe(true);
  });

  it('flags warning for very brief duration (< 0.45s)', () => {
    const seg: Segment = {
      id: '1',
      index: 1,
      start: 0,
      end: 0.3,
      text: 'Quick words',
    };
    const issues = checkReadability(seg);
    expect(issues.some((i) => i.type === 'duration' && i.severity === 'warning')).toBe(true);
  });

  it('flags warning for excessive duration (> 6.5s)', () => {
    const seg: Segment = {
      id: '1',
      index: 1,
      start: 0,
      end: 8.0,
      text: 'A very long time on screen',
    };
    const issues = checkReadability(seg);
    expect(issues.some((i) => i.type === 'duration' && i.severity === 'warning')).toBe(true);
  });

  it('flags error for overlap with previous or next segment', () => {
    const prev: Segment = { id: '0', index: 0, start: 0, end: 2.0, text: 'Previous' };
    const curr: Segment = { id: '1', index: 1, start: 1.8, end: 3.5, text: 'Current' }; // overlaps prev by 200ms
    const next: Segment = { id: '2', index: 2, start: 3.2, end: 5.0, text: 'Next' }; // overlaps curr by 300ms

    const issues = checkReadability(curr, prev, next);
    const overlapIssues = issues.filter((i) => i.type === 'overlap');
    expect(overlapIssues.length).toBe(2);
    expect(overlapIssues[0].message).toContain('Overlaps previous caption by 200ms');
    expect(overlapIssues[1].message).toContain('Overlaps next caption by 300ms');
  });

  it('flags warning for lines exceeding length limits (> 60 chars)', () => {
    const seg: Segment = {
      id: '1',
      index: 1,
      start: 0,
      end: 5.0,
      text: 'This is an exceedingly long caption line that will certainly overflow mobile screens in portrait mode.',
    };
    const issues = checkReadability(seg);
    expect(issues.some((i) => i.type === 'length' && i.severity === 'warning')).toBe(true);
  });
});
