import { describe, it, expect } from 'vitest';
import {
  ENTRANCE_PRESETS,
  EXIT_PRESETS,
  HIGHLIGHT_PRESETS,
} from '../src/subtitle-tool/engine/animation/presets';
import {
  calculateEntranceTransform,
  calculateEmphasisTransform,
  calculateExitTransform,
} from '../src/subtitle-tool/engine/animation';

describe('Motion preset library', () => {
  it('keeps every preset id unique and descriptive', () => {
    const ids = [
      ...ENTRANCE_PRESETS.map((p) => p.id),
      ...EXIT_PRESETS.map((p) => p.id),
      ...HIGHLIGHT_PRESETS.map((p) => p.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of [...ENTRANCE_PRESETS, ...EXIT_PRESETS, ...HIGHLIGHT_PRESETS]) {
      expect(p.name.length).toBeGreaterThan(1);
      expect(p.hint.length).toBeGreaterThan(6);
    }
  });

  it('ships editor-facing entrance recipes with their own timing', () => {
    const bounce = ENTRANCE_PRESETS.find((p) => p.id === 'capcut-bounce');
    expect(bounce?.motion.entranceType).toBe('elastic-pop');
    expect(bounce?.motion.inMs).toBeGreaterThan(400);
    const focus = ENTRANCE_PRESETS.find((p) => p.id === 'rack-focus');
    expect(focus?.motion.entranceType).toBe('rack-focus');
    const beast = ENTRANCE_PRESETS.find((p) => p.id === 'beast-pop');
    expect(beast?.motion.stagger).toBeGreaterThan(0);
  });

  it('elastic pop overshoots then settles at full size', () => {
    const px = 60;
    const start = calculateEntranceTransform('elastic-pop', 0, px, 72);
    const peak = [0.15, 0.25, 0.35, 0.45, 0.55].reduce(
      (best, p) => Math.max(best, calculateEntranceTransform('elastic-pop', p, px, 72).scale),
      0,
    );
    const end = calculateEntranceTransform('elastic-pop', 1, px, 72);
    expect(start.scale).toBeLessThan(0.8);
    expect(peak).toBeGreaterThan(1);
    expect(end.scale).toBeCloseTo(1, 2);
    expect(end.alpha).toBe(1);
  });

  it('rack focus clears its blur by the end of the entrance', () => {
    const start = calculateEntranceTransform('rack-focus', 0, 60, 72);
    const end = calculateEntranceTransform('rack-focus', 1, 60, 72);
    expect(start.blur).toBeGreaterThan(10);
    expect(end.blur).toBeCloseTo(0, 2);
  });

  it('hop emphasis lifts the active word and returns it to the baseline', () => {
    const mid = calculateEmphasisTransform('hop', 0.5, 60);
    const end = calculateEmphasisTransform('hop', 1, 60);
    expect(mid.dy).toBeLessThan(0);
    expect(end.dy).toBeCloseTo(0, 5);
    expect(end.scale).toBeCloseTo(1, 5);
  });

  it('slide-up exit lifts the caption out', () => {
    const mid = calculateExitTransform('slide-up', 0.5, 60);
    expect(mid.dy).toBeLessThan(0);
    expect(mid.alpha).toBeLessThan(1);
  });
});
