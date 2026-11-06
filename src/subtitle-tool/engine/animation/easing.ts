// ─── Easing Functions — Epic Hertz Studio Animation Engine ──────────────────
// Pure mathematical easing functions normalized to t ∈ [0, 1].

import type { AnimationEasing } from './types';

export const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

export function linear(t: number): number {
  return clamp01(t);
}

export function easeOutQuad(t: number): number {
  const x = clamp01(t);
  return 1 - (1 - x) * (1 - x);
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutExpo(t: number): number {
  const x = clamp01(t);
  return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

export function easeOutBack(t: number, overshoot = 1.70158): number {
  const x = clamp01(t);
  const s = overshoot;
  return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
}

export function easeOutElastic(t: number): number {
  const x = clamp01(t);
  if (x === 0) return 0;
  if (x === 1) return 1;
  const c4 = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

export function easeOutBounce(t: number): number {
  let x = clamp01(t);
  const n1 = 7.5625;
  const d1 = 2.75;

  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    x -= 1.5 / d1;
    return n1 * x * x + 0.75;
  } else if (x < 2.5 / d1) {
    x -= 2.25 / d1;
    return n1 * x * x + 0.9375;
  } else {
    x -= 2.625 / d1;
    return n1 * x * x + 0.984375;
  }
}

/**
 * Underdamped spring curve matching physical resonance.
 * bounce: 0 -> critically damped; 1 -> ~40% lively overshoot.
 */
export function spring(t: number, bounce = 0.5): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const zeta = 0.9 - 0.62 * clamp01(bounce);
  const w0 = 3.9 / zeta;
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  const env = Math.exp(-zeta * w0 * t);
  return 1 - env * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
}

/**
 * Evaluates any registered easing curve.
 */
export function getEasing(name: AnimationEasing, t: number, param?: number): number {
  switch (name) {
    case 'linear':
      return linear(t);
    case 'easeOutQuad':
      return easeOutQuad(t);
    case 'easeOutCubic':
      return easeOutCubic(t);
    case 'easeInOutCubic':
      return easeInOutCubic(t);
    case 'easeOutExpo':
      return easeOutExpo(t);
    case 'easeOutBack':
      return easeOutBack(t, param);
    case 'easeOutElastic':
      return easeOutElastic(t);
    case 'easeOutBounce':
      return easeOutBounce(t);
    case 'spring':
      return spring(t, param ?? 0.5);
    default:
      return easeOutCubic(t);
  }
}
