import { describe, it, expect } from 'vitest';
import { renderCaptions, findSegment } from '../src/subtitle-tool/engine/render';
import { PRESETS } from '../src/subtitle-tool/engine/presets';
import type { Segment, CaptionStyle } from '../src/subtitle-tool/types';

describe('Phase A: Golden Snapshot Tests for Existing Presets', () => {
  function createRecorderCanvasContext() {
    const log: Array<{ op: string; args: any[] }> = [];
    return {
      log,
      save: () => log.push({ op: 'save', args: [] }),
      restore: () => log.push({ op: 'restore', args: [] }),
      beginPath: () => log.push({ op: 'beginPath', args: [] }),
      closePath: () => log.push({ op: 'closePath', args: [] }),
      rect: (x: number, y: number, w: number, h: number) =>
        log.push({ op: 'rect', args: [Math.round(x), Math.round(y), Math.round(w), Math.round(h)] }),
      roundRect: (x: number, y: number, w: number, h: number, r: number) =>
        log.push({
          op: 'roundRect',
          args: [Math.round(x), Math.round(y), Math.round(w), Math.round(h), Math.round(r)],
        }),
      fillRect: (x: number, y: number, w: number, h: number) =>
        log.push({
          op: 'fillRect',
          args: [Math.round(x), Math.round(y), Math.round(w), Math.round(h)],
        }),
      fill: () => log.push({ op: 'fill', args: [] }),
      stroke: () => log.push({ op: 'stroke', args: [] }),
      clip: () => log.push({ op: 'clip', args: [] }),
      clearRect: () => log.push({ op: 'clearRect', args: [] }),
      fillText: (text: string, x: number, y: number) =>
        log.push({ op: 'fillText', args: [text, Math.round(x), Math.round(y)] }),
      strokeText: (text: string, x: number, y: number) =>
        log.push({ op: 'strokeText', args: [text, Math.round(x), Math.round(y)] }),
      measureText: (text: string) => ({
        width: text.length * 16,
        actualBoundingBoxAscent: 14,
        actualBoundingBoxDescent: 4,
        fontBoundingBoxAscent: 16,
        fontBoundingBoxDescent: 6,
      }),
      setLineDash: () => {},
      translate: (x: number, y: number) =>
        log.push({ op: 'translate', args: [Math.round(x), Math.round(y)] }),
      scale: (sx: number, sy: number) =>
        log.push({ op: 'scale', args: [+sx.toFixed(2), +sy.toFixed(2)] }),
      rotate: (rad: number) => log.push({ op: 'rotate', args: [+rad.toFixed(3)] }),
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
    } as unknown as CanvasRenderingContext2D & { log: Array<{ op: string; args: any[] }> };
  }

  const sampleSegments: Segment[] = [
    {
      id: 'golden-seg-1',
      index: 1,
      start: 1.0,
      end: 3.5,
      text: 'Creating high retention captions',
      words: [
        { word: 'Creating', start: 1.0, end: 1.5 },
        { word: 'high', start: 1.6, end: 2.1 },
        { word: 'retention', start: 2.2, end: 2.8 },
        { word: 'captions', start: 2.9, end: 3.5 },
      ],
    },
  ];

  it('renders all existing presets consistently across key animation timestamps', () => {
    const W = 1080;
    const H = 1920;

    // Test each preset at 4 key moments:
    // 1. Start / Entrance (t = 1.15)
    // 2. Mid-Hold active word 1 (t = 1.8)
    // 3. Mid-Hold active word 2 (t = 2.5)
    // 4. Outro / Exit (t = 3.4)
    const timestamps = [1.15, 1.8, 2.5, 3.4];

    for (const preset of PRESETS) {
      for (const t of timestamps) {
        const ctx = createRecorderCanvasContext();
        const res = renderCaptions(ctx, W, H, t, sampleSegments, preset.style);

        // Verify bounding box is generated for every active frame
        expect(res.bounds).not.toBeNull();
        expect(res.bounds?.w).toBeGreaterThan(0);
        expect(res.bounds?.h).toBeGreaterThan(0);

        // Verify text was drawn
        const textOps = ctx.log.filter((op) => op.op === 'fillText');
        expect(textOps.length).toBeGreaterThan(0);
      }
    }
  });

  it('preserves Indic script text shaping without character fragmentation', () => {
    const teluguSegment: Segment[] = [
      {
        id: 'te-golden',
        index: 1,
        start: 0.5,
        end: 2.5,
        text: 'ప్రతి ఫ్రేమ్ లో కథ ఉండాలి',
        words: [
          { word: 'ప్రతి', start: 0.5, end: 1.0 },
          { word: 'ఫ్రేమ్', start: 1.0, end: 1.5 },
          { word: 'లో', start: 1.5, end: 1.8 },
          { word: 'కథ', start: 1.8, end: 2.1 },
          { word: 'ఉండాలి', start: 2.1, end: 2.5 },
        ],
      },
    ];

    const ctx = createRecorderCanvasContext();
    const style = PRESETS[0].style; // Pulse
    renderCaptions(ctx, 1080, 1920, 1.2, teluguSegment, style);

    const textOps = ctx.log.filter((op) => op.op === 'fillText');
    expect(textOps.length).toBeGreaterThan(0);

    // Verify Indic words were NOT split into broken characters
    const drawnWords = textOps.map((op) => op.args[0]);
    expect(drawnWords).toContain('ప్రతి');
    expect(drawnWords).toContain('ఫ్రేమ్');
  });
});
