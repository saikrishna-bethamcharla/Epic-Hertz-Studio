// ─── Lower Third Animation Primitives Test Suite — Phase C ───────────────────
import { describe, it, expect } from 'vitest';
import {
  evalWipe,
  evalLineDraw,
  evalMaskSlideUp,
  evalScalePop,
  evalFade,
  evalFadeUp,
  evalBlurIn,
  evalLetterStagger,
  evalWordStagger,
  evalPhotoReveal,
  evalShineSweep,
  evalCounterTypewriter,
  evalGlitchCut,
  evalHoldDrift,
  evalIdleAccentPulse,
  evalReverseWipe,
  evalSlideOut,
  evalFadeDown,
  evalCollapseToLine,
  isIndicText,
  getLineHeightMultiplier,
  segmentText,
} from '../src/subtitle-tool/engine/lowerThirdPrimitives';

describe('Phase C: Lower Third Animation Primitives', () => {
  describe('Indic script detection and text rules', () => {
    it('accurately identifies Indic scripts (Telugu, Devanagari, Tamil)', () => {
      expect(isIndicText('John Doe')).toBe(false);
      expect(isIndicText('రామానుజన్')).toBe(true); // Telugu
      expect(isIndicText('श्रीनिवास')).toBe(true); // Devanagari
      expect(isIndicText('இராமானுசன்')).toBe(true); // Tamil
    });

    it('returns +15% line-height bump (1.15) for Indic scripts and 1.0 for Latin', () => {
      expect(getLineHeightMultiplier('Director of Engineering')).toBe(1.0);
      expect(getLineHeightMultiplier('శ్రీనివాస రామానుజన్')).toBe(1.15);
    });

    it('segments Indic words without decomposing conjunct clusters', () => {
      const teluguName = 'శ్రీనివాస రామానుజన్';
      const words = segmentText(teluguName, 'word');
      expect(words).toEqual(['శ్రీనివాస', 'రామానుజన్']);
    });

    it('degrades letter stagger to word stagger when Indic text is provided', () => {
      const teluguName = 'శ్రీనివాస రామానుజన్';
      const result = evalLetterStagger(teluguName, 0.5);
      // Must not split into individual un-voweled consonants
      expect(result.length).toBe(2);
      expect(result[0].char).toBe('శ్రీనివాస');
      expect(result[1].char).toBe('రామానుజన్');
    });

    it('segments Latin text character by character for letter stagger', () => {
      const latin = 'Epic';
      const result = evalLetterStagger(latin, 0.5);
      expect(result.length).toBe(4);
      expect(result.map((r) => r.char).join('')).toBe('Epic');
    });
  });

  describe('15 Pure Animation Primitives', () => {
    const baseRect = { x: 100, y: 800, width: 400, height: 80 };

    it('1. evalWipe: grows clip rectangle from left, right, top, bottom', () => {
      const leftWipe = evalWipe(0.5, baseRect, 'left');
      expect(leftWipe.x).toBe(100);
      expect(leftWipe.width).toBeGreaterThan(0);
      expect(leftWipe.width).toBeLessThanOrEqual(baseRect.width);

      const rightWipe = evalWipe(0.5, baseRect, 'right');
      expect(rightWipe.width).toBeGreaterThan(0);
      expect(rightWipe.x).toBeGreaterThan(baseRect.x);
    });

    it('2. evalLineDraw: grows stroke along length', () => {
      const start = evalLineDraw(0, 300);
      expect(start.currentLength).toBe(0);

      const mid = evalLineDraw(0.5, 300);
      expect(mid.currentLength).toBeGreaterThan(0);
      expect(mid.currentLength).toBeLessThanOrEqual(300);

      const end = evalLineDraw(1, 300);
      expect(end.currentLength).toBe(300);
    });

    it('3. evalMaskSlideUp: translates Y up from behind clipping edge', () => {
      const start = evalMaskSlideUp(0, 40);
      expect(start.translateY).toBe(40);
      expect(start.opacity).toBe(0);

      const end = evalMaskSlideUp(1, 40);
      expect(end.translateY).toBe(0);
      expect(end.opacity).toBe(1);
    });

    it('4. evalScalePop: produces easeOutBack with small overshoot', () => {
      const mid = evalScalePop(0.7, 0.06);
      expect(mid.scale).toBeGreaterThan(1.0); // overshoot
      const settled = evalScalePop(1.0, 0.06);
      expect(settled.scale).toBeCloseTo(1.0, 2);
    });

    it('5. evalFade and evalFadeUp: smooth cubic opacity and rise', () => {
      expect(evalFade(0)).toBe(0);
      expect(evalFade(1)).toBe(1);

      const fadeUp = evalFadeUp(0.5, 20);
      expect(fadeUp.opacity).toBeGreaterThan(0);
      expect(fadeUp.translateY).toBeLessThan(20);
    });

    it('6. evalBlurIn: provides safe opacity + scale without ctx.filter', () => {
      const start = evalBlurIn(0);
      expect(start.opacity).toBe(0);
      expect(start.scale).toBeCloseTo(0.97, 2);

      const end = evalBlurIn(1);
      expect(end.opacity).toBe(1);
      expect(end.scale).toBeCloseTo(1.0, 2);
    });

    it('7. evalLetterStagger & 8. evalWordStagger: staggers elements', () => {
      const words = evalWordStagger('Epic Hertz Studio', 0.4);
      expect(words).toHaveLength(3);
      // Word 1 starts earlier than Word 3
      expect(words[0].opacity).toBeGreaterThan(words[2].opacity);
    });

    it('9. evalPhotoReveal: supports iris, wipe, and scale', () => {
      const iris = evalPhotoReveal(0.5, 'iris');
      expect(iris.irisRadiusFraction).toBeGreaterThan(0);
      expect(iris.opacity).toBeGreaterThan(0);
    });

    it('10. evalShineSweep: sweeps diagonal coordinate across bounds', () => {
      const off = evalShineSweep(0);
      expect(off.active).toBe(false);

      const sweep = evalShineSweep(0.5);
      expect(sweep.active).toBe(true);
      expect(sweep.opacity).toBeGreaterThan(0);
    });

    it('11. evalCounterTypewriter: types characters and counts numbers', () => {
      const type = evalCounterTypewriter('Terminal', 0.5);
      expect(type.visibleText).toBe('Term');

      const count = evalCounterTypewriter('1000', 0.5, 1000);
      expect(count.currentNumber).toBeGreaterThan(0);
      expect(count.currentNumber).toBeLessThan(1000);
    });

    it('12. evalGlitchCut: subtle horizontal jitter on intro frames', () => {
      const normal = evalGlitchCut(0.5, 30);
      expect(normal.active).toBe(false);

      const frame2 = evalGlitchCut(2 / 30, 30);
      expect(frame2.active).toBe(true);
      expect(Math.abs(frame2.offsetX)).toBeLessThanOrEqual(4);
    });

    it('13. evalHoldDrift: bounded slow translate and scale', () => {
      const drift = evalHoldDrift(1.5, 0.02, 3.0);
      expect(drift.scale).toBeGreaterThanOrEqual(0.98);
      expect(drift.scale).toBeLessThanOrEqual(1.02);
    });

    it('14. evalIdleAccentPulse: cycles brightness periodically', () => {
      const peak = evalIdleAccentPulse(0.125, 2.5);
      expect(peak).toBeGreaterThan(1.0);
      const rest = evalIdleAccentPulse(1.5, 2.5);
      expect(rest).toBe(1.0);
    });

    it('15. Outros: reverse wipe, slideOut, fadeDown, collapseToLine', () => {
      const rev = evalReverseWipe(0.5, baseRect, 'left');
      expect(rev.width).toBeLessThan(baseRect.width);

      const slide = evalSlideOut(0.5, 100, 'left');
      expect(slide.translateX).toBeLessThan(0);
      expect(slide.opacity).toBeLessThan(1);

      const fade = evalFadeDown(0.5, 20);
      expect(fade.opacity).toBeLessThan(1);
      expect(fade.translateY).toBeGreaterThan(0);

      const collapse = evalCollapseToLine(0.5, baseRect);
      expect(collapse.height).toBeLessThan(baseRect.height);
    });
  });
});
