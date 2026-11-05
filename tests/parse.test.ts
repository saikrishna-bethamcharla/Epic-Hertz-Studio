import { describe, it, expect } from 'vitest';
import { parseTime, parseSegmentsFromResponse } from '../api/_lib/parse.js';

describe('api/_lib/parse.js: parseTime', () => {
  it('parses raw numbers and handles non-finite numbers', () => {
    expect(parseTime(1.5)).toBe(1.5);
    expect(parseTime(0)).toBe(0);
    expect(parseTime(NaN)).toBe(0);
    expect(parseTime(Infinity)).toBe(0);
  });

  it('parses simple second strings with or without suffix', () => {
    expect(parseTime('1.5')).toBe(1.5);
    expect(parseTime('1.5s')).toBe(1.5);
    expect(parseTime(' 2.25 S ')).toBe(2.25);
  });

  it('parses mm:ss and hh:mm:ss timestamps with comma or dot decimals', () => {
    expect(parseTime('01:23')).toBe(83);
    expect(parseTime('00:01:23.450')).toBeCloseTo(83.45, 2);
    expect(parseTime('00:00:01,500')).toBe(1.5);
    expect(parseTime('01:00:00')).toBe(3600);
  });

  it('returns 0 for invalid inputs', () => {
    expect(parseTime('')).toBe(0);
    expect(parseTime(null)).toBe(0);
    expect(parseTime(undefined)).toBe(0);
    expect(parseTime('not-a-number')).toBe(0);
  });
});

describe('api/_lib/parse.js: parseSegmentsFromResponse', () => {
  it('parses standard JSON array of segments', () => {
    const raw = JSON.stringify([
      { start: 0, end: 1.5, text: 'Hello' },
      { start: 1.5, end: 3.0, text: 'World' },
    ]);
    const segs = parseSegmentsFromResponse(raw);
    expect(segs.length).toBe(2);
    expect(segs[0].text).toBe('Hello');
    expect(segs[0].start).toBe(0);
    expect(segs[0].end).toBe(1.5);
    expect(segs[1].text).toBe('World');
  });

  it('parses fenced markdown JSON (```json ... ```)', () => {
    const raw = '```json\n[{"start": 1.0, "end": 2.5, "text": "Fenced"}]\n```';
    const segs = parseSegmentsFromResponse(raw);
    expect(segs.length).toBe(1);
    expect(segs[0].text).toBe('Fenced');
    expect(segs[0].start).toBe(1.0);
    expect(segs[0].end).toBe(2.5);
  });

  it('extracts JSON surrounded by AI conversational chatter', () => {
    const raw =
      'Here are your requested captions:\n\n[{"start": "00:01.00", "end": "00:03.50", "text": "Chatter text"}]\n\nHope this helps!';
    const segs = parseSegmentsFromResponse(raw);
    expect(segs.length).toBe(1);
    expect(segs[0].text).toBe('Chatter text');
    expect(segs[0].start).toBe(1.0);
    expect(segs[0].end).toBe(3.5);
  });

  it('supports object wrapper { segments: [...] } or { subtitles: [...] }', () => {
    const raw = JSON.stringify({
      segments: [{ start: 0.5, end: 2.0, text: 'Wrapped segment' }],
    });
    const segs = parseSegmentsFromResponse(raw);
    expect(segs.length).toBe(1);
    expect(segs[0].text).toBe('Wrapped segment');
  });

  it('normalizes word-level timestamps and anchors segment bounds', () => {
    const raw = JSON.stringify([
      {
        text: 'Two words',
        words: [
          { word: 'Two', start: 0.2, end: 0.6 },
          { word: 'words', start: 0.6, end: 1.1 },
        ],
      },
    ]);
    const segs = parseSegmentsFromResponse(raw);
    expect(segs.length).toBe(1);
    expect(segs[0].start).toBe(0.2);
    expect(segs[0].end).toBe(1.1);
    expect(segs[0].words?.length).toBe(2);
  });

  it('removes overlaps between consecutive segments', () => {
    const raw = JSON.stringify([
      { start: 0.0, end: 3.0, text: 'First segment' },
      { start: 2.0, end: 5.0, text: 'Second segment overlapping' },
    ]);
    const segs = parseSegmentsFromResponse(raw);
    expect(segs.length).toBe(2);
    expect(segs[0].end).toBe(2.0); // clamped to curr.start
    expect(segs[1].start).toBe(2.0);
  });

  it('parses fallback SRT-formatted response text', () => {
    const srt = `1\n00:00:01,000 --> 00:00:02,500\nSRT Subtitle 1\n\n2\n00:00:02,500 --> 00:00:04,000\nSRT Subtitle 2`;
    const segs = parseSegmentsFromResponse(srt);
    expect(segs.length).toBe(2);
    expect(segs[0].text).toBe('SRT Subtitle 1');
    expect(segs[0].start).toBe(1.0);
    expect(segs[0].end).toBe(2.5);
  });

  it('returns empty array [] for invalid/unparseable responses without hallucinating timings', () => {
    expect(parseSegmentsFromResponse('')).toEqual([]);
    expect(parseSegmentsFromResponse('Sorry, I cannot transcribe this audio.')).toEqual([]);
    expect(parseSegmentsFromResponse('{ "error": "Quota exceeded" }')).toEqual([]);
  });
});
