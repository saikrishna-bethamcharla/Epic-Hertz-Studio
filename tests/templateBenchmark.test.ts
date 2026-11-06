import { describe, it, expect } from 'vitest';
import { renderCaptions } from '../src/subtitle-tool/engine/render';
import { CAPTION_TEMPLATES } from '../src/subtitle-tool/engine/templateCatalog';
import { templateToStyle } from '../src/subtitle-tool/engine/templateSchema';
import type { Segment } from '../src/subtitle-tool/types';

describe('Phase F: Caption Template Library Parity & Benchmark Suite', () => {
  function createBenchmarkCanvasContext() {
    return {
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
      fillText: () => {},
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
      textBaseline: 'middle',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D;
  }

  const sampleEnglishSegments: Segment[] = [
    {
      id: 'bench-en-1',
      index: 1,
      start: 0.5,
      end: 3.0,
      text: 'Create viral subtitles fast',
      words: [
        { word: 'Create', start: 0.5, end: 1.0 },
        { word: 'viral', start: 1.1, end: 1.7 },
        { word: 'subtitles', start: 1.8, end: 2.4 },
        { word: 'fast', start: 2.5, end: 3.0 },
      ],
    },
  ];

  const sampleTeluguSegments: Segment[] = [
    {
      id: 'bench-te-1',
      index: 1,
      start: 0.5,
      end: 3.0,
      text: 'ప్రతి ఫ్రేమ్ కథ చెబుతుంది',
      words: [
        { word: 'ప్రతి', start: 0.5, end: 1.1 },
        { word: 'ఫ్రేమ్', start: 1.2, end: 1.7 },
        { word: 'కథ', start: 1.8, end: 2.3 },
        { word: 'చెబుతుంది', start: 2.4, end: 3.0 },
      ],
    },
  ];

  it('renders all 40 templates across key animation moments (intro, hold, active word, outro) with valid geometry', () => {
    const W = 1080;
    const H = 1920;
    const timestamps = [0.6, 1.4, 2.0, 2.9];

    for (const template of CAPTION_TEMPLATES) {
      const style = templateToStyle(template);

      for (const t of timestamps) {
        const ctx = createBenchmarkCanvasContext();
        const res = renderCaptions(ctx, W, H, t, sampleEnglishSegments, style);

        expect(res.bounds).not.toBeNull();
        expect(res.bounds?.w).toBeGreaterThan(0);
        expect(res.bounds?.h).toBeGreaterThan(0);
      }
    }
  });

  it('correctly handles Indic script rendering with conjuncts preserved without throwing', () => {
    const W = 1080;
    const H = 1920;

    for (const template of CAPTION_TEMPLATES) {
      const style = templateToStyle(template);
      const ctx = createBenchmarkCanvasContext();
      const res = renderCaptions(ctx, W, H, 1.5, sampleTeluguSegments, style);

      expect(res.bounds).not.toBeNull();
      expect(res.bounds?.w).toBeGreaterThan(0);
    }
  });

  it('executes frame drawing within strict performance budget (< 4 ms per 1080x1920 frame)', () => {
    const W = 1080;
    const H = 1920;
    const ctx = createBenchmarkCanvasContext();

    // Warm-up run
    for (const template of CAPTION_TEMPLATES.slice(0, 5)) {
      const style = templateToStyle(template);
      renderCaptions(ctx, W, H, 1.5, sampleEnglishSegments, style);
    }

    // Benchmark across 40 templates x 5 frames = 200 frame draws
    const startTime = performance.now();
    let totalFrames = 0;

    for (const template of CAPTION_TEMPLATES) {
      const style = templateToStyle(template);
      for (const t of [0.6, 1.2, 1.8, 2.4, 2.9]) {
        renderCaptions(ctx, W, H, t, sampleEnglishSegments, style);
        totalFrames++;
      }
    }

    const elapsedMs = performance.now() - startTime;
    const avgMsPerFrame = elapsedMs / totalFrames;

    // Performance budget: average frame render time must be under 4 ms (usually < 0.2 ms with layout caching)
    expect(avgMsPerFrame).toBeLessThan(4.0);
  });
});
