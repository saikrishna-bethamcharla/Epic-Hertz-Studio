// ─── Active Word Emphasis Animations (8) — Epic Hertz Studio Engine ────────
// Pure transform generators for highlighting and accenting the spoken active word.

import type { TransformState, EmphasisType, AnimationEasing } from './types';
import { getEasing, clamp01 } from './easing';

export function calculateEmphasisTransform(
  type: EmphasisType,
  p: number, // 0..1 phase progress during spoken word
  px: number,
  _easing: AnimationEasing = 'spring',
  params: Record<string, any> = {},
): TransformState {
  const normP = clamp01(p);
  const tx: TransformState = {
    alpha: 1,
    dx: 0,
    dy: 0,
    scale: 1,
    rotation: 0,
    blur: 0,
    colorMix: 0,
  };

  switch (type) {
    case 'pop': {
      const peakScale = params.scale ?? 1.25;
      // Spring pop rise and decay
      const e = getEasing('spring', normP, params.bounce ?? 0.6);
      tx.scale = 1 + (peakScale - 1) * e;
      tx.colorMix = clamp01(normP * 3);
      break;
    }

    case 'shake': {
      // 50Hz jitter for alert syllables
      const freq = params.frequency ?? 45;
      const amp = (params.amplitude ?? 0.08) * px;
      const decay = 1 - normP * 0.5;
      tx.dx = Math.sin(normP * freq) * amp * decay;
      tx.dy = Math.cos(normP * freq * 0.8) * (amp * 0.6) * decay;
      tx.scale = 1 + 0.08 * Math.sin(normP * Math.PI);
      tx.colorMix = 1;
      break;
    }

    case 'glow-pulse': {
      // Pulse luminosity
      const pulse = Math.sin(normP * Math.PI);
      tx.blur = pulse * px * 0.45;
      tx.scale = 1 + 0.1 * pulse;
      tx.colorMix = clamp01(normP * 2.5);
      break;
    }

    case 'underline-draw': {
      // Draw progress 0..1
      tx.clip = { wipeProgress: getEasing('easeOutCubic', normP) };
      tx.colorMix = 1;
      break;
    }

    case 'highlight-box-sweep': {
      // Sweep expansion
      tx.clip = { wipeProgress: getEasing('easeOutExpo', normP) };
      tx.colorMix = 1;
      break;
    }

    case 'color-flip': {
      // Immediate high-contrast chromatic flip
      const speed = params.speed ?? 4;
      tx.colorMix = clamp01(normP * speed);
      tx.scale =
        1 +
        (params.scale
          ? (params.scale - 1) * Math.sin(normP * Math.PI)
          : 0.08 * Math.sin(normP * Math.PI));
      break;
    }

    case 'scale-slam': {
      // Explosive scale down onto the line
      const initialHit = params.peak ?? 1.38;
      const settle = getEasing('easeOutBounce', normP);
      tx.scale = initialHit - (initialHit - 1) * settle;
      tx.colorMix = 1;
      break;
    }

    case 'wobble': {
      // Harmonic tilt
      const maxAngle = params.angle ?? 7;
      tx.rotation = Math.sin(normP * Math.PI * 3) * (1 - normP) * maxAngle;
      tx.scale = 1 + 0.12 * Math.sin(normP * Math.PI);
      tx.colorMix = clamp01(normP * 2);
      break;
    }

    case 'hop': {
      // Active word hops off the baseline and lands back in place.
      const arc = Math.sin(normP * Math.PI);
      tx.dy = -arc * px * (params.height ?? 0.22);
      tx.scale = 1 + arc * (params.scale ?? 0.08);
      tx.colorMix = clamp01(normP * 2.5);
      break;
    }

    default:
      tx.colorMix = 1;
      break;
  }

  return tx;
}
