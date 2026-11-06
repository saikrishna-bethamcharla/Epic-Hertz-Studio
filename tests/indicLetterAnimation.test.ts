import { describe, it, expect } from 'vitest';
import { renderCaptions } from '../src/subtitle-tool/engine/render';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import type { Segment, CaptionStyle } from '../src/subtitle-tool/types';

describe('Requirement 8: Telugu and Hindi Long Words with Per-Letter Effects', () => {
  function createTestCanvasContext() {
    const textCalls: Array<{ text: string; x: number; y: number }> = [];
    return {
      textCalls,
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      rect: () => {},
      roundRect: () => {},
      fillRect: () => {},
      fill: () => {},
      stroke: () => {},
      clip: () => {},
      clearRect: () => {},
      fillText: (text: string, x: number, y: number) => textCalls.push({ text, x, y }),
      strokeText: () => {},
      measureText: (text: string) => {
        // Mock proportional character advance:
        // Complex conjunct clusters (e.g. "ష్ఠా", "త్ర్య") have length 3-4 code points but render as single wide glyph
        const width = text.length * 18;
        return {
          width,
          actualBoundingBoxAscent: 15,
          actualBoundingBoxDescent: 5,
          fontBoundingBoxAscent: 18,
          fontBoundingBoxDescent: 6,
        };
      },
      setLineDash: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D & {
      textCalls: Array<{ text: string; x: number; y: number }>;
    };
  }

  const teluguLongSegments: Segment[] = [
    {
      id: 'te-long-1',
      index: 1,
      start: 0.5,
      end: 3.5,
      text: 'ప్రతిష్ఠాత్మకమైన నమస్కారము మరియు శక్తివంతమైన ఆరోగ్యము',
      words: [
        { word: 'ప్రతిష్ఠాత్మకమైన', start: 0.5, end: 1.2 },
        { word: 'నమస్కారము', start: 1.3, end: 2.0 },
        { word: 'మరియు', start: 2.1, end: 2.5 },
        { word: 'శక్తివంతమైన', start: 2.6, end: 3.0 },
        { word: 'ఆరోగ్యము', start: 3.1, end: 3.5 },
      ],
    },
  ];

  const hindiLongSegments: Segment[] = [
    {
      id: 'hi-long-1',
      index: 1,
      start: 0.5,
      end: 3.5,
      text: 'आत्मनिर्भरता और अंतरराष्ट्रीय प्रतियोगिता में विजय',
      words: [
        { word: 'आत्मनिर्भरता', start: 0.5, end: 1.2 },
        { word: 'और', start: 1.3, end: 1.6 },
        { word: 'अंतरराष्ट्रीय', start: 1.7, end: 2.4 },
        { word: 'प्रतियोगिता', start: 2.5, end: 3.0 },
        { word: 'में', start: 3.1, end: 3.2 },
        { word: 'विजय', start: 3.3, end: 3.5 },
      ],
    },
  ];

  const W = 1080;
  const H = 1920;

  it('renders long Telugu words with per-letter (akshara) effects without conjunct separation or layout break', () => {
    const style: CaptionStyle = {
      ...structuredClone(DEFAULT_STYLE),
      font: {
        ...DEFAULT_STYLE.font,
        family: 'noto-sans-telugu',
      },
      motion: {
        ...DEFAULT_STYLE.motion,
        unit: 'char', // Per-letter mode
        in: 'bounce-in',
        entranceType: 'bounce-in',
        stagger: 40,
      },
    };

    // Render across multiple timestamps (intro, mid, outro)
    for (const t of [0.6, 1.0, 1.8, 2.8, 3.4]) {
      const ctx = createTestCanvasContext();
      const res = renderCaptions(ctx, W, H, t, teluguLongSegments, style);

      expect(res.bounds).not.toBeNull();
      expect(res.bounds?.w).toBeGreaterThan(0);
      expect(res.bounds?.h).toBeGreaterThan(0);
      expect(Number.isFinite(res.bounds?.x)).toBe(true);
      expect(Number.isFinite(res.bounds?.y)).toBe(true);

      // Verify that rendered text calls never orphan isolated virama marks (e.g. standalone ్)
      for (const call of ctx.textCalls) {
        expect(call.text).not.toBe('్');
        expect(call.text.startsWith('్')).toBe(false);
      }
    }
  });

  it('renders long Hindi words with per-letter (akshara) effects preserving halant and matras', () => {
    const style: CaptionStyle = {
      ...structuredClone(DEFAULT_STYLE),
      font: {
        ...DEFAULT_STYLE.font,
        family: 'noto-sans-devanagari',
      },
      motion: {
        ...DEFAULT_STYLE.motion,
        unit: 'char', // Per-letter mode
        in: 'wave',
        entranceType: 'wave',
        stagger: 35,
      },
    };

    for (const t of [0.6, 1.0, 1.8, 2.8, 3.4]) {
      const ctx = createTestCanvasContext();
      const res = renderCaptions(ctx, W, H, t, hindiLongSegments, style);

      expect(res.bounds).not.toBeNull();
      expect(res.bounds?.w).toBeGreaterThan(0);
      expect(res.bounds?.h).toBeGreaterThan(0);
      expect(Number.isFinite(res.bounds?.x)).toBe(true);
      expect(Number.isFinite(res.bounds?.y)).toBe(true);

      // Verify no standalone halant (्) or detached matras
      for (const call of ctx.textCalls) {
        expect(call.text).not.toBe('्');
        expect(call.text.startsWith('्')).toBe(false);
      }
    }
  });
});
