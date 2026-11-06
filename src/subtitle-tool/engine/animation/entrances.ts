// ─── Entrance Animations (12) — Epic Hertz Studio Animation Engine ──────────
// Pure transform generators for caption unit entrances parameterized by progress p ∈ [0, 1].

import type { TransformState, EntranceType, AnimationEasing } from './types';
import { getEasing, clamp01 } from './easing';

export function calculateEntranceTransform(
  type: EntranceType,
  p: number,
  px: number,
  lineBox: number,
  easing: AnimationEasing = 'easeOutCubic',
  params: Record<string, any> = {},
): TransformState {
  const normP = clamp01(p);
  const e = getEasing(easing, normP, params.bounce ?? params.overshoot);
  const q = 1 - e;

  const tx: TransformState = {
    alpha: 1,
    dx: 0,
    dy: 0,
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    blur: 0,
    glitch: 0,
  };

  switch (type) {
    case 'fade':
      tx.alpha = normP;
      break;

    case 'slide-up': {
      const dist = (params.distance ?? 0.45) * px;
      tx.dy = q * dist;
      tx.alpha = clamp01(normP * 2.4);
      break;
    }

    case 'slide-left': {
      const dist = (params.distance ?? 0.6) * px;
      tx.dx = q * dist;
      tx.alpha = clamp01(normP * 2.5);
      break;
    }

    case 'slide-right': {
      const dist = (params.distance ?? 0.6) * px;
      tx.dx = -q * dist;
      tx.alpha = clamp01(normP * 2.5);
      break;
    }

    case 'scale-pop': {
      const initialScale = params.initialScale ?? 0.45;
      tx.scale = initialScale + (1 - initialScale) * e;
      tx.alpha = clamp01(normP * 4);
      break;
    }

    case 'rotate-in': {
      const angle = params.angle ?? -14;
      tx.rotation = q * angle;
      tx.scale = 0.8 + 0.2 * e;
      tx.alpha = clamp01(normP * 3);
      break;
    }

    case 'blur-in': {
      const maxBlur = (params.maxBlur ?? 0.22) * px;
      tx.blur = q * maxBlur;
      tx.scale = 1.06 - 0.06 * clamp01(e);
      tx.alpha = clamp01(normP * 2.2);
      break;
    }

    case 'typewriter':
      tx.alpha = normP > 0 ? 1 : 0;
      break;

    case 'bounce-in': {
      const bounceVal = getEasing('easeOutBounce', normP);
      tx.dy = (1 - bounceVal) * -px * 0.8;
      tx.alpha = clamp01(normP * 3);
      break;
    }

    case 'wave': {
      const waveAmp = (params.amplitude ?? 0.35) * px;
      tx.dy = Math.sin((1 - normP) * Math.PI) * waveAmp;
      tx.alpha = clamp01(normP * 2.5);
      break;
    }

    case 'flip-in': {
      tx.scaleY = clamp01(e);
      tx.alpha = clamp01(normP * 3.5);
      break;
    }

    case 'drop-in': {
      const dropHeight = (params.height ?? 1.1) * px;
      tx.dy = -q * dropHeight;
      tx.alpha = clamp01(normP * 5);
      break;
    }

    case 'clip-reveal': {
      tx.dy = (1 - clamp01(e)) * (params.distance ?? lineBox * 0.5);
      tx.alpha = clamp01(normP * 3);
      tx.clip = {
        wipeProgress: clamp01(e),
        rect: normP < 1,
      };
      break;
    }

    default:
      tx.alpha = normP;
      break;
  }

  return tx;
}
