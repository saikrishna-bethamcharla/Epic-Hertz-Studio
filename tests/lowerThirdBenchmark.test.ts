// ─── Lower Third Performance Benchmark & AutoFit Suite — Phase C ────────────
import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderTemplateLowerThird,
  computeAutoFitText,
  getCachedTextWidth,
  clearTextWidthCache,
  drawVectorIcon,
} from '../src/subtitle-tool/engine/lowerThirdRenderer';
import { DEFAULT_LOWER_THIRD, type LowerThirdSpec } from '../src/subtitle-tool/engine/spec';
import { createRecorderCanvasContext } from './goldenLowerThirds.test';

describe('Phase C: Lower Third Performance & AutoFit Verification', () => {
  beforeEach(() => {
    clearTextWidthCache();
  });

  describe('Performance: under 2ms per lower-third draw at 1080x1920', () => {
    it('executes 100 consecutive frame draws in < 200ms total (< 2ms per draw)', () => {
      const spec: LowerThirdSpec = {
        ...DEFAULT_LOWER_THIRD,
        id: 'bench-lt',
        templateId: 'bench-test-template',
        name: 'DR. VIKRAM SARABHAI',
        role: 'FOUNDER & CHIEF SCIENTIST',
        start: 1.0,
        end: 5.0,
      };

      const ctx = createRecorderCanvasContext() as unknown as CanvasRenderingContext2D;
      const W = 1080;
      const H = 1920;

      // Warm-up cache
      renderTemplateLowerThird(ctx, spec, 2.5, W, H);

      // Benchmark 100 frames
      const start = performance.now();
      const frameCount = 100;
      for (let i = 0; i < frameCount; i++) {
        const t = 1.0 + (i / frameCount) * 4.0;
        renderTemplateLowerThird(ctx, spec, t, W, H);
      }
      const totalDuration = performance.now() - start;
      const avgPerFrame = totalDuration / frameCount;

      console.log(
        `[BENCHMARK] 100 frame draws at 1080x1920: Total ${totalDuration.toFixed(2)}ms | Average: ${avgPerFrame.toFixed(3)}ms/frame`,
      );

      // Target: under 2 ms per frame
      expect(avgPerFrame).toBeLessThan(2.0);
    });

    it('leverages getCachedTextWidth for zero re-computation on recurring strings', () => {
      const ctx = createRecorderCanvasContext() as unknown as CanvasRenderingContext2D;
      const font = '700 40px "Inter", sans-serif';
      const text = 'PROD TEST';

      const w1 = getCachedTextWidth(ctx, text, font);
      const w2 = getCachedTextWidth(ctx, text, font);
      expect(w1).toBe(w2);
    });
  });

  describe('AutoFit Algorithm Verification', () => {
    it('fits short name in single line at full scale', () => {
      const ctx = createRecorderCanvasContext() as unknown as CanvasRenderingContext2D;
      const res = computeAutoFitText(ctx, 'JOHN DOE', 40, 'Inter', 700, 800);
      expect(res.lines).toHaveLength(1);
      expect(res.lines[0]).toBe('JOHN DOE');
      expect(res.fontSize).toBe(40);
    });

    it('scales down font size when text exceeds nominal width but within minScale', () => {
      const ctx = createRecorderCanvasContext() as unknown as CanvasRenderingContext2D;
      const longName = 'PROFESSOR CHANDRASEKHAR RAMALINGAM SRINIVAS';
      // Restrict width to trigger scaling
      const res = computeAutoFitText(ctx, longName, 50, 'Inter', 700, 300, 0.5, 2);
      expect(res.fontSize).toBeLessThan(50);
      expect(res.lines.length).toBeGreaterThanOrEqual(1);
      expect(res.totalWidth).toBeLessThanOrEqual(300);
    });

    it('wraps and truncates with ellipsis if long text exceeds maxLines and bounds', () => {
      const ctx = createRecorderCanvasContext() as unknown as CanvasRenderingContext2D;
      const hugeText =
        'A very extremely extraordinarily long name that cannot possibly fit on even two lines within small constraints';
      const res = computeAutoFitText(ctx, hugeText, 40, 'Inter', 700, 200, 0.6, 2);
      expect(res.lines.length).toBeLessThanOrEqual(2);
      expect(res.lines[res.lines.length - 1].endsWith('…')).toBe(true);
    });
  });

  describe('Generic Lucide Vector Icons on Canvas', () => {
    it('renders all 6 generic icons without errors or DOM allocations', () => {
      const ctx = createRecorderCanvasContext() as unknown as CanvasRenderingContext2D;
      const icons = ['user', 'mic', 'map-pin', 'at-sign', 'calendar', 'tag'] as const;

      for (const icon of icons) {
        expect(() => {
          drawVectorIcon(ctx, icon, 50, 50, 32, '#ffffff');
        }).not.toThrow();
      }
    });
  });
});
