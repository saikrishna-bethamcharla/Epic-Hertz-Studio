import { describe, it, expect } from 'vitest';
import { renderCaptions } from '../src/subtitle-tool/engine/render';
import { DEFAULT_STYLE } from '../src/subtitle-tool/constants';
import type { Segment } from '../src/subtitle-tool/types';
import type { CaptionStyle } from '../src/subtitle-tool/engine/spec';

describe('renderCaptions Layout Position & Drag Alignment', () => {
  function createTrackingContext() {
    const textCalls: { text: string; x: number; y: number }[] = [];
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
        textCalls.push({ text, x, y });
      },
      strokeText: () => {},
      measureText: (text: string) => ({
        width: text.length * 16,
        actualBoundingBoxAscent: 14,
        actualBoundingBoxDescent: 4,
        fontBoundingBoxAscent: 16,
        fontBoundingBoxDescent: 6,
      }),
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
      textAlign: 'center',
      textBaseline: 'alphabetic',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D;

    return { ctx, textCalls };
  }

  const sampleSegments: Segment[] = [
    {
      id: 'seg-pos-1',
      index: 1,
      start: 0.0,
      end: 2.0,
      text: 'INDIA LO ENNO CANCER',
      words: [
        { word: 'INDIA', start: 0.0, end: 0.5 },
        { word: 'LO', start: 0.5, end: 1.0 },
        { word: 'ENNO', start: 1.0, end: 1.5 },
        { word: 'CANCER', start: 1.5, end: 2.0 },
      ],
    },
  ];

  it('renders words within the bounding box bounds.y and bounds.y + bounds.h', () => {
    const { ctx, textCalls } = createTrackingContext();
    const W = 1080;
    const H = 1920;
    const style: CaptionStyle = {
      ...DEFAULT_STYLE,
      layout: {
        ...DEFAULT_STYLE.layout,
        x: 0.5,
        y: 0.8,
      },
    };

    const res = renderCaptions(ctx, W, H, 0.5, sampleSegments, style);
    expect(res.bounds).not.toBeNull();
    const bounds = res.bounds!;

    // Bounding box should be near y = 0.8 * 1920 = 1536
    expect(bounds.y).toBeGreaterThan(1400);
    expect(bounds.y).toBeLessThan(1600);

    // All fillText calls should be positioned inside or along the baseline of the bounding box
    expect(textCalls.length).toBeGreaterThan(0);
    for (const call of textCalls) {
      expect(call.y).toBeGreaterThanOrEqual(bounds.y);
      expect(call.y).toBeLessThanOrEqual(bounds.y + bounds.h + 20);
    }
  });

  it('moves the rendered text coordinates when layout.y changes', () => {
    const W = 1080;
    const H = 1920;

    // Render at Top (y = 0.2)
    const topContext = createTrackingContext();
    const topStyle: CaptionStyle = {
      ...DEFAULT_STYLE,
      layout: {
        ...DEFAULT_STYLE.layout,
        x: 0.5,
        y: 0.2,
      },
    };
    const topRes = renderCaptions(topContext.ctx, W, H, 0.5, sampleSegments, topStyle);
    const topY = topContext.textCalls[0].y;

    // Render at Bottom (y = 0.8)
    const botContext = createTrackingContext();
    const botStyle: CaptionStyle = {
      ...DEFAULT_STYLE,
      layout: {
        ...DEFAULT_STYLE.layout,
        x: 0.5,
        y: 0.8,
      },
    };
    const botRes = renderCaptions(botContext.ctx, W, H, 0.5, sampleSegments, botStyle);
    const botY = botContext.textCalls[0].y;

    expect(topRes.bounds).not.toBeNull();
    expect(botRes.bounds).not.toBeNull();

    // The shift in Y must be approximately (0.8 - 0.2) * 1920 = 1152px
    const diffY = botY - topY;
    expect(diffY).toBeGreaterThan(1000);
    expect(diffY).toBeLessThan(1300);

    // Bounding boxes must also differ by the exact same shift
    expect(botRes.bounds!.y - topRes.bounds!.y).toBeCloseTo(diffY, 0);
  });

  it('moves the rendered text when segment styleOverride positionY is set (direct drag / per-caption)', () => {
    const W = 1080;
    const H = 1920;

    const segWithOverride: Segment[] = [
      {
        ...sampleSegments[0],
        styleOverride: {
          positionX: 0.5,
          positionY: 0.35,
        },
      },
    ];

    const { ctx, textCalls } = createTrackingContext();
    const res = renderCaptions(ctx, W, H, 0.5, segWithOverride, DEFAULT_STYLE);

    expect(res.bounds).not.toBeNull();
    // Bounding box should be centered around y = 0.35 * 1920 = 672
    expect(res.bounds!.y).toBeGreaterThan(550);
    expect(res.bounds!.y).toBeLessThan(750);

    // Words should be drawn within this bounding box
    expect(textCalls[0].y).toBeGreaterThanOrEqual(res.bounds!.y);
    expect(textCalls[0].y).toBeLessThanOrEqual(res.bounds!.y + res.bounds!.h + 20);
  });
});
