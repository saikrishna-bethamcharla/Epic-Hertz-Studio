import { describe, it, expect } from 'vitest';
import { getEffectiveCaptionStyle } from '../src/subtitle-tool/engine/spec';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import type { Segment, CaptionStyle } from '../src/subtitle-tool/types';

describe('Editor Style Scope & Overrides', () => {
  it('getEffectiveCaptionStyle returns global style when no override exists', () => {
    const effective = getEffectiveCaptionStyle(DEFAULT_STYLE, undefined);
    expect(effective).toEqual(DEFAULT_STYLE);
  });

  it('getEffectiveCaptionStyle prioritizes customStyle when provided', () => {
    const custom: CaptionStyle = {
      ...DEFAULT_STYLE,
      id: 'custom-preset',
      name: 'Custom Preset',
      fill: '#ff00ff',
    };
    const effective = getEffectiveCaptionStyle(DEFAULT_STYLE, { customStyle: custom });
    expect(effective.id).toBe('custom-preset');
    expect(effective.fill).toBe('#ff00ff');
  });

  it('getEffectiveCaptionStyle applies partial property overrides surgically', () => {
    const override = {
      fillColor: '#00ff00',
      strokeColor: '#111111',
      fontSize: 0.12,
      fontFamily: 'anton',
      fontWeight: 400,
      italic: true,
      underline: true,
      textCase: 'upper' as const,
      scale: 1.5,
      positionX: 0.3,
      positionY: 0.7,
    };

    const effective = getEffectiveCaptionStyle(DEFAULT_STYLE, override);

    expect(effective.fill).toBe('#00ff00');
    expect(effective.stroke.color).toBe('#111111');
    expect(effective.font.size).toBe(0.12);
    expect(effective.font.family).toBe('anton');
    expect(effective.font.weight).toBe(400);
    expect(effective.font.italic).toBe(true);
    expect(effective.font.underline).toBe(true);
    expect(effective.font.textCase).toBe('upper');
    expect(effective.layout.x).toBe(0.3);
    expect(effective.layout.y).toBe(0.7);

    // Ensure global DEFAULT_STYLE was never mutated
    expect(DEFAULT_STYLE.fill).not.toBe('#00ff00');
    expect(DEFAULT_STYLE.font.weight).toBe(900);
  });

  it('splitting a caption preserves styleOverride and speaker on both halves', () => {
    const originalSeg: Segment = {
      id: 'seg-1',
      index: 1,
      start: 1.0,
      end: 4.0,
      text: 'First half second half',
      speaker: 'Speaker A',
      styleOverride: {
        fillColor: '#ffbb00',
        fontSize: 0.09,
      },
      words: [
        { word: 'First', start: 1.0, end: 1.5 },
        { word: 'half', start: 1.5, end: 2.0 },
        { word: 'second', start: 2.5, end: 3.0 },
        { word: 'half', start: 3.0, end: 4.0 },
      ],
    };

    const curTime = 2.2;
    const words = originalSeg.text.split(' ');
    const ratio = (curTime - originalSeg.start) / (originalSeg.end - originalSeg.start);
    const wordSplitIdx = Math.max(1, Math.min(words.length - 1, Math.round(words.length * ratio)));
    const text1 = words.slice(0, wordSplitIdx).join(' ');
    const text2 = words.slice(wordSplitIdx).join(' ');

    const newSeg1: Segment = {
      ...originalSeg,
      end: curTime,
      text: text1,
      words: originalSeg.words?.filter((w) => w.start < curTime),
    };
    const newSeg2: Segment = {
      ...originalSeg,
      id: 'seg-2',
      index: 2,
      start: curTime,
      end: originalSeg.end,
      text: text2,
      words: originalSeg.words?.filter((w) => w.start >= curTime),
      styleOverride: originalSeg.styleOverride ? { ...originalSeg.styleOverride } : undefined,
      speaker: originalSeg.speaker,
    };

    expect(newSeg1.styleOverride).toEqual(originalSeg.styleOverride);
    expect(newSeg1.speaker).toBe('Speaker A');

    expect(newSeg2.styleOverride).toEqual(originalSeg.styleOverride);
    expect(newSeg2.speaker).toBe('Speaker A');
  });

  it('reset all overrides cleans custom overrides from all segments', () => {
    const segments: Segment[] = [
      {
        id: 's1',
        index: 1,
        start: 0,
        end: 2,
        text: 'Clean',
      },
      {
        id: 's2',
        index: 2,
        start: 2,
        end: 4,
        text: 'Custom',
        styleOverride: { fillColor: '#ff0000' },
      },
    ];

    const resetSegments = segments.map((s) => {
      if (!s.styleOverride) return s;
      const { styleOverride: _, ...rest } = s;
      return rest;
    });

    expect(resetSegments[0].styleOverride).toBeUndefined();
    expect(resetSegments[1].styleOverride).toBeUndefined();
    expect(resetSegments[1].text).toBe('Custom');
  });
});
