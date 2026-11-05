import { describe, it, expect } from 'vitest';
import {
  toSRTTime,
  toVTTTime,
  parseTimestamp,
  toSRT,
  toVTT,
  toTXT,
  buildSegments,
} from '../src/subtitle-tool/utils/srt';
import type { Segment, WordTimestamp } from '../src/subtitle-tool/types';

describe('SRT & VTT Utilities', () => {
  it('formats seconds to SRT timestamp with comma delimiter', () => {
    expect(toSRTTime(0)).toBe('00:00:00,000');
    expect(toSRTTime(1.5)).toBe('00:00:01,500');
    expect(toSRTTime(65.123)).toBe('00:01:05,123');
    expect(toSRTTime(3661.045)).toBe('01:01:01,045');
  });

  it('formats seconds to VTT timestamp with dot delimiter', () => {
    expect(toVTTTime(0)).toBe('00:00:00.000');
    expect(toVTTTime(1.5)).toBe('00:00:01.500');
    expect(toVTTTime(65.123)).toBe('00:01:05.123');
  });

  it('parses timestamps back into seconds (round-trip)', () => {
    const times = [0, 1.5, 65.123, 3600.5];
    for (const t of times) {
      const srt = toSRTTime(t);
      const parsed = parseTimestamp(srt);
      expect(Math.abs(parsed - t)).toBeLessThan(0.002);
    }
  });

  it('serializes segments to SRT format correctly', () => {
    const segments: Segment[] = [
      { id: '1', index: 1, start: 0, end: 1.5, text: 'Hello world' },
      { id: '2', index: 2, start: 1.5, end: 3.0, text: 'Second line' },
    ];
    const srt = toSRT(segments);
    expect(srt).toContain('1\n00:00:00,000 --> 00:00:01,500\nHello world');
    expect(srt).toContain('2\n00:00:01,500 --> 00:00:03,000\nSecond line');
  });

  it('serializes segments to VTT format with WEBVTT header', () => {
    const segments: Segment[] = [{ id: '1', index: 1, start: 0, end: 1.5, text: 'Hello world' }];
    const vtt = toVTT(segments);
    expect(vtt.startsWith('WEBVTT\n\n')).toBe(true);
    expect(vtt).toContain('00:00:00.000 --> 00:00:01.500\nHello world');
  });

  it('serializes segments to plain text without timestamps', () => {
    const segments: Segment[] = [
      { id: '1', index: 1, start: 0, end: 1.5, text: 'First line.' },
      { id: '2', index: 2, start: 1.5, end: 3.0, text: 'Second line.' },
    ];
    const txt = toTXT(segments);
    expect(txt).toBe('First line.\nSecond line.');
  });

  it('groups words into segments respecting max words and duration', () => {
    const words: WordTimestamp[] = [
      { word: 'One', start: 0, end: 0.5 },
      { word: 'two', start: 0.5, end: 1.0 },
      { word: 'three', start: 1.0, end: 1.5 },
    ];
    const segs = buildSegments(words);
    expect(segs.length).toBe(1);
    expect(segs[0].text).toBe('One two three');
    expect(segs[0].start).toBe(0);
    expect(segs[0].end).toBe(1.5);
  });
});
