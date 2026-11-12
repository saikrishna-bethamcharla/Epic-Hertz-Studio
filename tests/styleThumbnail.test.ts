import { describe, it, expect } from 'vitest';
import { renderCaptions } from '../src/subtitle-tool/engine/render';
import { CAPTION_TEMPLATES } from '../src/subtitle-tool/engine/templateCatalog';
import { templateToStyle } from '../src/subtitle-tool/engine/templateSchema';
import type { Segment } from '../src/subtitle-tool/types';
import type { CaptionStyle } from '../src/subtitle-tool/engine/spec';

describe('StyleThumbnail for All 40 Templates', () => {
  function createCaptureContext() {
    const fillTextCalls: { text: string; x: number; y: number }[] = [];
    const ctx = {
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
      fillText: (text: string, x: number, y: number) => {
        fillTextCalls.push({ text, x, y });
      },
      strokeText: () => {},
      measureText: (text: string) => ({
        width: text.length * 8,
        actualBoundingBoxAscent: 10,
        actualBoundingBoxDescent: 3,
        fontBoundingBoxAscent: 12,
        fontBoundingBoxDescent: 4,
      }),
      setLineDash: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'center',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D;

    return { ctx, fillTextCalls };
  }

  function peakTime(style: CaptionStyle, sample: Segment): number {
    const words = sample.words ?? [];
    const count = words.length;
    if (!count) return sample.start + 0.35;
    const target = Math.min(Math.max(1, (style.layout.wordsPerPage || count) - 1), count - 1);
    return (words[target].start + words[target].end) / 2;
  }

  const sampleSegment: Segment = {
    id: 'preview-sample',
    index: 1,
    start: 0,
    end: 2.2,
    text: "That's it, you",
    words: [
      { word: "That's", start: 0.0, end: 0.7 },
      { word: 'it,', start: 0.7, end: 1.4 },
      { word: 'you', start: 1.4, end: 2.2 },
    ],
  };

  const VW = 270;
  const VH = 480;
  const CROP_H = 168;
  const cropTop = (VH - CROP_H) / 2; // 156
  const cropBottom = cropTop + CROP_H; // 324

  for (const template of CAPTION_TEMPLATES) {
    it(`template "${template.name}" draws text within crop area at peakTime`, () => {
      const style = templateToStyle(template);
      const st: CaptionStyle = {
        ...style,
        syncOffset: 0,
        layout: { ...style.layout, x: 0.5, y: 0.5 },
      };

      const { ctx, fillTextCalls } = createCaptureContext();
      const stillTime = peakTime(st, sampleSegment);
      const res = renderCaptions(ctx, VW, VH, stillTime, [sampleSegment], st);

      expect(res.bounds).not.toBeNull();
      expect(fillTextCalls.length).toBeGreaterThan(0);
      for (const call of fillTextCalls) {
        expect(call.y).toBeGreaterThanOrEqual(cropTop);
        expect(call.y).toBeLessThanOrEqual(cropBottom);
      }
    });
  }
});
