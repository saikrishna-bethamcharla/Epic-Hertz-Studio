// ─── Exit Animations (8) — Epic Hertz Studio Animation Engine ───────────────
// Pure transform generators for caption page/unit exits parameterized by progress p ∈ [0, 1].

import type { TransformState, ExitType, AnimationEasing } from './types';
import { getEasing, clamp01 } from './easing';

export function calculateExitTransform(
  type: ExitType,
  p: number, // 0..1 exit progress
  px: number,
  easing: AnimationEasing = 'easeOutCubic',
  params: Record<string, any> = {},
): TransformState {
  const normP = clamp01(p);
  const e = getEasing(easing, normP, params.bounce);

  const tx: TransformState = {
    alpha: 1,
    dx: 0,
    dy: 0,
    scale: 1,
    rotation: 0,
    blur: 0,
    glitch: 0,
  };

  switch (type) {
    case 'fade':
      tx.alpha = 1 - e;
      break;

    case 'slide-down': {
      const dist = (params.distance ?? 0.35) * px;
      tx.dy = e * dist;
      tx.alpha = 1 - e;
      break;
    }

    case 'slide-left': {
      const dist = (params.distance ?? 0.6) * px;
      tx.dx = -e * dist;
      tx.alpha = 1 - e;
      break;
    }

    case 'slide-right': {
      const dist = (params.distance ?? 0.6) * px;
      tx.dx = e * dist;
      tx.alpha = 1 - e;
      break;
    }

    case 'scale-out': {
      tx.scale = Math.max(0, 1 - 0.45 * e);
      tx.alpha = 1 - e;
      break;
    }

    case 'blur-out': {
      const maxBlur = (params.maxBlur ?? 0.28) * px;
      tx.blur = e * maxBlur;
      tx.scale = 1 + 0.05 * e;
      tx.alpha = 1 - e;
      break;
    }

    case 'clip-hide': {
      tx.clip = {
        wipeProgress: 1 - e,
        rect: true,
      };
      tx.alpha = 1 - e;
      break;
    }

    case 'typewriter-erase':
      tx.alpha = normP >= 1 ? 0 : 1 - normP;
      break;

    case 'drop-out': {
      const dropDist = (params.distance ?? 1.4) * px;
      tx.dy = Math.pow(normP, 2) * dropDist; // Quadratic gravity fall
      tx.alpha = clamp01(1 - normP * 1.5);
      break;
    }

    case 'glitch-out': {
      tx.glitch = normP;
      tx.dx = (Math.sin(normP * 30) - 0.5) * px * 0.15;
      tx.alpha = normP > 0.8 ? 0 : 1 - normP * 0.9;
      break;
    }

    default:
      tx.alpha = 1 - e;
      break;
  }

  return tx;
}
