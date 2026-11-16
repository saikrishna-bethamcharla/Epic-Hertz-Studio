import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  measureTextCached,
  getFontMetricsCached,
  drawOffsetTextShadow,
  drawMultiStrokeText,
  renderCaptions,
  clearCaptionCaches,
} from '../src/subtitle-tool/engine/render';
import {
  getCachedTextWidth,
  clearTextWidthCache,
  renderLowerThirds,
} from '../src/subtitle-tool/engine/lowerThirds';
import type { CaptionStyle, Segment, LowerThirdSpec } from '../src/subtitle-tool/types';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';

describe('Text Layout Caching & Zero-Software-Blur Engine', () => {
  let mockCtx: any;
  let shadowBlurSets: number[];
  let measureTextCalls: string[];

  beforeEach(() => {
    clearCaptionCaches();
    clearTextWidthCache();
    shadowBlurSets = [];
    measureTextCalls = [];

    mockCtx = {
      font: '',
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      lineJoin: 'miter',
      miterLimit: 10,
      globalAlpha: 1,
      textAlign: 'left',
      textBaseline: 'alphabetic',
      _shadowBlur: 0,
      get shadowBlur() {
        return this._shadowBlur;
      },
      set shadowBlur(v: number) {
        this._shadowBlur = v;
        if (v > 0) shadowBlurSets.push(v);
      },
      save: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      rect: vi.fn(),
      roundRect: vi.fn(),
      arc: vi.fn(),
      clip: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillRect: vi.fn(),
      strokeRect: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      clearRect: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      quadraticCurveTo: vi.fn(),
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn(),
      })),
      measureText: vi.fn((text: string) => {
        measureTextCalls.push(text);
        return {
          width: text.length * 10,
          fontBoundingBoxAscent: 12,
          fontBoundingBoxDescent: 4,
        };
      }),
    };
  });

  it('measureTextCached caches measurements and eliminates repeated ctx.measureText calls', () => {
    const f = 'bold 24px Inter';
    const w1 = measureTextCached(mockCtx, 'EpicHertz', f, 0);
    const w2 = measureTextCached(mockCtx, 'EpicHertz', f, 0);
    const w3 = measureTextCached(mockCtx, 'EpicHertz', f, 0);

    expect(w1).toBe(90);
    expect(w2).toBe(90);
    expect(w3).toBe(90);
    // Only 1 real measurement call on canvas context
    expect(mockCtx.measureText).toHaveBeenCalledTimes(1);
    expect(measureTextCalls).toEqual(['EpicHertz']);
  });

  it('getFontMetricsCached caches font bounding ascent/descent for line boxes', () => {
    const f = 'bold 32px Montserrat';
    const m1 = getFontMetricsCached(mockCtx, f, 32);
    const m2 = getFontMetricsCached(mockCtx, f, 32);

    expect(m1).toEqual({ asc: 12, desc: 4 });
    expect(m2).toEqual({ asc: 12, desc: 4 });
    expect(mockCtx.measureText).toHaveBeenCalledTimes(1);
  });

  it('getCachedTextWidth caches lower-third label widths across frames', () => {
    const font = '700 28px Roboto';
    const w1 = getCachedTextWidth(mockCtx, 'PRODUCT FEATURE', font);
    const w2 = getCachedTextWidth(mockCtx, 'PRODUCT FEATURE', font);

    expect(w1).toBe(150);
    expect(w2).toBe(150);
    expect(mockCtx.measureText).toHaveBeenCalledTimes(1);
  });

  it('drawOffsetTextShadow draws hardware-accelerated offset layers with zero shadowBlur calls', () => {
    drawOffsetTextShadow(
      mockCtx,
      'Cinematic Title',
      100,
      200,
      'rgba(0,0,0,0.5)',
      4,
      4,
      8,
      false,
      0,
    );

    // Multi-pass offset layers were drawn using fillText
    expect(mockCtx.fillText).toHaveBeenCalled();
    // Zero software shadowBlur sets
    expect(shadowBlurSets).toHaveLength(0);
    expect(mockCtx.shadowBlur).toBe(0);
  });

  it('drawMultiStrokeText renders crisp glow/halo outlines with zero shadowBlur calls', () => {
    drawMultiStrokeText(mockCtx, 'Glowing Neon Accent', 150, 300, '#00F0FF', 12, 3);

    // 3 stepped outline passes were rendered using strokeText
    expect(mockCtx.strokeText).toHaveBeenCalledTimes(3);
    // Zero software shadowBlur sets
    expect(shadowBlurSets).toHaveLength(0);
    expect(mockCtx.shadowBlur).toBe(0);
  });

  it('renderCaptions executes with shadow and glow styles with 0% software shadowBlur overhead', () => {
    const styleWithShadowAndGlow: CaptionStyle = {
      ...DEFAULT_STYLE,
      shadow: {
        color: 'rgba(0,0,0,0.8)',
        x: 0.05,
        y: 0.05,
        blur: 0.1,
      },
      glow: {
        color: '#fbbf24',
        blur: 0.08,
        strength: 2,
      },
    };

    const segments: Segment[] = [
      {
        id: 'seg-1',
        start: 0,
        end: 3.5,
        text: 'Zero software shadowBlur high performance captions',
        words: [
          { word: 'Zero', start: 0, end: 0.5 },
          { word: 'software', start: 0.5, end: 1.0 },
          { word: 'shadowBlur', start: 1.0, end: 1.5, emphasis: 'glow' },
          { word: 'high', start: 1.5, end: 2.0 },
          { word: 'performance', start: 2.0, end: 2.5 },
          { word: 'captions', start: 2.5, end: 3.0 },
        ],
      },
    ];

    // Render frame at 1.2s (hitting word with emphasis: 'glow')
    renderCaptions(mockCtx, 1080, 1920, 1.2, segments, styleWithShadowAndGlow);

    // Verify drawing executed successfully
    expect(mockCtx.fillText).toHaveBeenCalled();
    // Verify shadowBlur was NEVER set to any non-zero value
    expect(shadowBlurSets).toHaveLength(0);
    expect(mockCtx.shadowBlur).toBe(0);
  });

  it('renderLowerThirds renders templates with zero software shadowBlur calls', () => {
    const lowerThirds: LowerThirdSpec[] = [
      {
        id: 'lt-callout-1',
        templateId: 'bold-callout-01',
        name: 'PRODUCT FEATURE',
        role: 'Key detail highlighted here',
        start: 0,
        end: 5.0,
        position: { x: 0.55, y: 0.45, align: 'center' },
        scale: 1.0,
        colors: { primary: '#fbbf24', secondary: '#1e293b', textPrimary: '#ffffff' },
        font: { family: 'Montserrat', size: 0.032, weight: 700 },
        introSec: 0.5,
        outroSec: 0.5,
      },
      {
        id: 'lt-yt-1',
        templateId: 'mogrt-youtube-like-bell',
        name: 'SUBSCRIBE',
        role: 'Epic Channel',
        start: 0,
        end: 5.0,
        position: { x: 0.5, y: 0.85, align: 'center' },
        scale: 1.0,
        colors: { primary: '#FF0000', secondary: '#0f0f0f', textPrimary: '#ffffff' },
        font: { family: 'Inter', size: 0.03, weight: 700 },
        introSec: 0.4,
        outroSec: 0.4,
      },
    ];

    renderLowerThirds(mockCtx, 1080, 1920, 1.5, lowerThirds);

    expect(shadowBlurSets).toHaveLength(0);
    expect(mockCtx.shadowBlur).toBe(0);
  });
});
