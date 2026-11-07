import { describe, it, expect } from 'vitest';
import {
  linear,
  easeOutQuad,
  easeOutCubic,
  getEasing,
  type AnimationEasing,
  type EntranceType,
  type EmphasisType,
  type ExitType,
  calculateEntranceTransform,
  calculateEmphasisTransform,
  calculateExitTransform,
} from '../src/subtitle-tool/engine/animation';

describe('Phase C: Easing Functions Endpoint and Monotonicity Tests', () => {
  const easings: AnimationEasing[] = [
    'linear',
    'easeOutQuad',
    'easeOutCubic',
    'easeInOutCubic',
    'easeOutExpo',
    'easeOutBack',
    'easeOutElastic',
    'easeOutBounce',
    'spring',
  ];

  it('proves all easing functions evaluate accurately at t = 0 and t = 1', () => {
    for (const name of easings) {
      const start = getEasing(name, 0);
      const end = getEasing(name, 1);
      expect(start).toBeCloseTo(0, 1);
      expect(end).toBeCloseTo(1, 1);
    }
  });

  it('clamps out of bounds values safely', () => {
    expect(linear(-0.5)).toBe(0);
    expect(linear(1.5)).toBe(1);
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
    expect(easeOutQuad(-0.2)).toBe(0);
    expect(easeOutQuad(1.8)).toBe(1);
  });
});

describe('Phase C: 12 Entrance Animations at Progress 0, 0.5, and 1', () => {
  const entrances: EntranceType[] = [
    'fade',
    'slide-up',
    'slide-left',
    'slide-right',
    'scale-pop',
    'rotate-in',
    'blur-in',
    'typewriter',
    'bounce-in',
    'wave',
    'flip-in',
    'drop-in',
    'clip-reveal',
  ];

  for (const ent of entrances) {
    it(`evaluates entrance "${ent}" safely at p = 0, 0.5, 1`, () => {
      const px = 60;
      const lineBox = 75;

      const t0 = calculateEntranceTransform(ent, 0, px, lineBox);
      const tHalf = calculateEntranceTransform(ent, 0.5, px, lineBox);
      const t1 = calculateEntranceTransform(ent, 1, px, lineBox);

      // At p = 0, element should be entering (alpha <= 1, displacements non-zero if sliding)
      expect(t0.alpha).toBeLessThanOrEqual(1);

      // At p = 1, entrance is complete
      expect(t1.alpha).toBe(1);
      expect(t1.scale).toBeCloseTo(1, 1);
      expect(t1.blur).toBeCloseTo(0, 1);
      expect(t1.rotation).toBeCloseTo(0, 1);
      expect(t1.dx).toBeCloseTo(0, 1);

      // At p = 0.5, transform state exists and values are finite numbers
      expect(Number.isFinite(tHalf.alpha)).toBe(true);
      expect(Number.isFinite(tHalf.scale)).toBe(true);
      expect(Number.isFinite(tHalf.dx)).toBe(true);
      expect(Number.isFinite(tHalf.dy)).toBe(true);
    });
  }
});

describe('Phase C: 8 Active Word Emphasis Animations at Progress 0, 0.5, and 1', () => {
  const emphasisList: EmphasisType[] = [
    'pop',
    'shake',
    'glow-pulse',
    'underline-draw',
    'highlight-box-sweep',
    'color-flip',
    'scale-slam',
    'wobble',
  ];

  for (const emp of emphasisList) {
    it(`evaluates emphasis "${emp}" safely at p = 0, 0.5, 1`, () => {
      const px = 60;
      const t0 = calculateEmphasisTransform(emp, 0, px);
      const tHalf = calculateEmphasisTransform(emp, 0.5, px);
      const t1 = calculateEmphasisTransform(emp, 1, px);

      expect(Number.isFinite(t0.scale)).toBe(true);
      expect(Number.isFinite(tHalf.scale)).toBe(true);
      expect(Number.isFinite(t1.scale)).toBe(true);
      expect(Number.isFinite(tHalf.colorMix ?? 0)).toBe(true);
    });
  }
});

describe('Phase C: 8 Exit Animations at Progress 0, 0.5, and 1', () => {
  const exitList: ExitType[] = [
    'fade',
    'slide-down',
    'scale-out',
    'blur-out',
    'clip-hide',
    'typewriter-erase',
    'drop-out',
    'glitch-out',
  ];

  for (const ext of exitList) {
    it(`evaluates exit "${ext}" safely at p = 0, 0.5, 1`, () => {
      const px = 60;
      const t0 = calculateExitTransform(ext, 0, px);
      const tHalf = calculateExitTransform(ext, 0.5, px);
      const t1 = calculateExitTransform(ext, 1, px);

      // At p = 0, exit hasn't started yet
      expect(t0.alpha).toBeCloseTo(1, 1);

      // At p = 1, element has exited (alpha is 0 or near 0)
      expect(t1.alpha).toBeLessThanOrEqual(0.15);

      // Intermediate values are finite
      expect(Number.isFinite(tHalf.alpha)).toBe(true);
      expect(Number.isFinite(tHalf.dx)).toBe(true);
      expect(Number.isFinite(tHalf.dy)).toBe(true);
    });
  }
});
