// ─── Lower Third Animation Primitives — Epic Hertz Studio Engine ─────────────
// 15 Pure mathematical animation primitives for lower thirds.
// Evaluates timing t into normalized progress [0, 1], geometric transforms,
// and clipping regions. Reuses engine/animation/easing curves.

import {
  clamp01,
  easeOutCubic,
  easeOutExpo,
  easeOutBack,
  easeInOutCubic,
} from './animation/easing';

export { clamp01 };

// ─────────────────────────────────────────────────────────────────────────────
// 1. Script & Language Utilities (Indic & Latin rules)
// ─────────────────────────────────────────────────────────────────────────────

export function isIndicText(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // Devanagari (0x0900-0x097F), Bengali (0x0980-0x09FF), Tamil (0x0B80-0x0BFF),
    // Telugu (0x0C00-0x0C7F), Kannada (0x0C80-0x0CFF), Malayalam (0x0D00-0x0D7F)
    if (
      (code >= 0x0900 && code <= 0x097f) ||
      (code >= 0x0980 && code <= 0x09ff) ||
      (code >= 0x0b80 && code <= 0x0bff) ||
      (code >= 0x0c00 && code <= 0x0c7f) ||
      (code >= 0x0c80 && code <= 0x0cff) ||
      (code >= 0x0d00 && code <= 0x0d7f)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Returns line height multiplier: 1.15 (+15%) for Indic scripts to prevent
 * matra/vowel mark clipping; 1.0 for Latin.
 */
export function getLineHeightMultiplier(text: string): number {
  return isIndicText(text) ? 1.15 : 1.0;
}

/**
 * Splits text safely using Intl.Segmenter.
 * For Indic scripts: never splits per letter (always grapheme cluster or word)
 * to avoid decomposing conjunct consonants (e.g. 'శ్రీ').
 */
export function segmentText(text: string, granularity: 'word' | 'grapheme' = 'word'): string[] {
  if (!text) return [];

  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const segmenter = new Intl.Segmenter(undefined, { granularity });
      const segments: string[] = [];
      for (const seg of segmenter.segment(text)) {
        if (granularity === 'word') {
          if (seg.isWordLike) segments.push(seg.segment);
        } else {
          segments.push(seg.segment);
        }
      }
      return segments;
    } catch {
      // Fallback below
    }
  }

  // Fallback if Intl.Segmenter is unavailable
  if (granularity === 'word') {
    return text
      .trim()
      .split(/\s+/)
      .filter((s) => s.length > 0);
  }
  return Array.from(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Pure Animation Primitives (Progress 0 to 1 in, transform out)
// ─────────────────────────────────────────────────────────────────────────────

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type WipeDirection = 'left' | 'right' | 'top' | 'bottom';

/**
 * 1. Wipe reveal from left, right, top or bottom (clip rectangle, easeOutExpo).
 */
export function evalWipe(progress: number, rect: Rect, direction: WipeDirection = 'left'): Rect {
  const p = easeOutExpo(progress);
  switch (direction) {
    case 'left':
      // Grows from left to right
      return { x: rect.x, y: rect.y, width: rect.width * p, height: rect.height };
    case 'right':
      // Grows from right to left
      return {
        x: rect.x + rect.width * (1 - p),
        y: rect.y,
        width: rect.width * p,
        height: rect.height,
      };
    case 'top':
      // Grows from top to bottom
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height * p };
    case 'bottom':
      // Grows from bottom to top
      return {
        x: rect.x,
        y: rect.y + rect.height * (1 - p),
        width: rect.width,
        height: rect.height * p,
      };
  }
}

/**
 * 2. Line draw (a stroke grows along its length).
 */
export function evalLineDraw(
  progress: number,
  length: number,
): { currentLength: number; alpha: number } {
  const p = easeOutExpo(progress);
  return {
    currentLength: length * p,
    alpha: clamp01(p * 1.5),
  };
}

/**
 * 3. Mask slide-up (text rises from behind a clipping edge).
 */
export function evalMaskSlideUp(
  progress: number,
  distance: number,
): { translateY: number; opacity: number } {
  const p = easeOutCubic(progress);
  return {
    translateY: distance * (1 - p),
    opacity: clamp01(p * 1.3),
  };
}

/**
 * 4. Scale pop (easeOutBack, small overshoot of 4 to 8 percent).
 */
export function evalScalePop(
  progress: number,
  overshoot = 0.06,
): { scale: number; opacity: number } {
  const p = clamp01(progress);
  // EaseOutBack formula with configurable overshoot factor
  const s = overshoot * 12; // maps 0.06 -> ~0.72 overshoot constant
  const scale = 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
  return {
    scale: Math.max(0, scale),
    opacity: clamp01(p * 2),
  };
}

/**
 * 5. Fade and fade-up (easeOutCubic).
 */
export function evalFade(progress: number): number {
  return easeOutCubic(progress);
}

export function evalFadeUp(
  progress: number,
  distance = 18,
): { opacity: number; translateY: number } {
  const p = easeOutCubic(progress);
  return {
    opacity: clamp01(p),
    translateY: distance * (1 - p),
  };
}

/**
 * 6. Blur-in (canvas-safe fallback without relying on unportable ctx.filter).
 * Combines smooth opacity with micro-scale adjustment.
 */
export function evalBlurIn(progress: number): { opacity: number; scale: number } {
  const p = easeOutCubic(progress);
  return {
    opacity: clamp01(p),
    scale: 0.97 + 0.03 * p,
  };
}

/**
 * 7. Letter stagger (Latin scripts only).
 * If Indic text is passed, automatically degrades to word stagger to avoid
 * breaking composite glyphs / conjuncts.
 */
export function evalLetterStagger(
  text: string,
  progress: number,
  staggerPerChar = 0.035,
): Array<{ char: string; opacity: number; translateY: number }> {
  if (isIndicText(text)) {
    // Fallback: segment by words instead of letters
    const words = segmentText(text, 'word');
    return words.map((w, i) => {
      const startT = i * (staggerPerChar * 2);
      const p = clamp01((progress - startT) / Math.max(0.01, 1 - startT));
      const val = evalMaskSlideUp(p, 14);
      return { char: w, opacity: val.opacity, translateY: val.translateY };
    });
  }

  const chars = Array.from(text);
  const totalChars = Math.max(1, chars.length);
  const maxDelay = 0.5;
  const step = Math.min(staggerPerChar, maxDelay / totalChars);

  return chars.map((char, i) => {
    const startT = i * step;
    const p = clamp01((progress - startT) / Math.max(0.01, 1 - maxDelay));
    const val = evalMaskSlideUp(p, 12);
    return { char, opacity: val.opacity, translateY: val.translateY };
  });
}

/**
 * 8. Word stagger (all scripts).
 */
export function evalWordStagger(
  text: string,
  progress: number,
  staggerPerWord = 0.08,
): Array<{ word: string; opacity: number; translateY: number }> {
  const words = segmentText(text, 'word');
  const totalWords = Math.max(1, words.length);
  const maxDelay = 0.45;
  const step = Math.min(staggerPerWord, maxDelay / totalWords);

  return words.map((word, i) => {
    const startT = i * step;
    const p = clamp01((progress - startT) / Math.max(0.01, 1 - maxDelay));
    const val = evalFadeUp(p, 14);
    return { word, opacity: val.opacity, translateY: val.translateY };
  });
}

/**
 * 9. Photo reveal (circle iris, square wipe or soft scale).
 */
export function evalPhotoReveal(
  progress: number,
  style: 'iris' | 'wipe' | 'scale' = 'iris',
): { irisRadiusFraction: number; scale: number; opacity: number } {
  const p = easeOutBack(progress, 1.2);
  const pExp = easeOutExpo(progress);

  return {
    irisRadiusFraction: style === 'iris' ? pExp : 1.0,
    scale: style === 'scale' ? Math.max(0, p) : 1.0,
    opacity: clamp01(progress * 1.5),
  };
}

/**
 * 10. Shine sweep (a thin, low-opacity diagonal band crossing the shape once).
 * Returns normalized X coordinate offset relative to bounding width [-0.5, 1.5].
 */
export function evalShineSweep(progress: number): {
  active: boolean;
  xOffsetFraction: number;
  opacity: number;
} {
  if (progress <= 0 || progress >= 1) {
    return { active: false, xOffsetFraction: -0.5, opacity: 0 };
  }
  const p = easeInOutCubic(progress);
  const x = -0.3 + p * 1.6;
  const alpha = Math.sin(progress * Math.PI) * 0.28;
  return {
    active: true,
    xOffsetFraction: x,
    opacity: alpha,
  };
}

/**
 * 11. Counter and typewriter (for terminal and stat styles).
 */
export function evalCounterTypewriter(
  fullText: string,
  progress: number,
  targetNumber?: number,
): { visibleText: string; currentNumber?: number; showCursor: boolean } {
  const p = clamp01(progress);

  if (targetNumber !== undefined && !isNaN(targetNumber)) {
    const curNum = Math.round(targetNumber * easeOutCubic(p));
    return {
      visibleText: curNum.toString(),
      currentNumber: curNum,
      showCursor: false,
    };
  }

  const chars = Array.from(fullText);
  const visibleCount = Math.floor(chars.length * p);
  const visibleText = chars.slice(0, visibleCount).join('');
  const showCursor = p < 1.0 && Math.floor(progress * 16) % 2 === 0;

  return { visibleText, showCursor };
}

/**
 * 12. Glitch cut (two to three frames of subtle horizontal offset, 0 to 4 px).
 */
export function evalGlitchCut(
  t: number,
  fps = 30,
): { offsetX: number; offsetY: number; active: boolean } {
  const frame = Math.floor(t * fps);
  // Trigger on frames 2 and 4 of intro
  if (frame === 2) return { offsetX: 3.5, offsetY: 0, active: true };
  if (frame === 3) return { offsetX: -2.5, offsetY: 0.5, active: true };
  if (frame === 4) return { offsetX: 1.5, offsetY: -0.5, active: true };
  return { offsetX: 0, offsetY: 0, active: false };
}

/**
 * 13. Hold drift (1 to 3 percent slow translate or scale).
 */
export function evalHoldDrift(
  t: number,
  amplitude = 0.02,
  period = 3.0,
): { scale: number; translateY: number } {
  const cycle = (t % period) / period;
  const sinVal = Math.sin(cycle * Math.PI * 2);
  return {
    scale: 1.0 + sinVal * (amplitude * 0.5),
    translateY: sinVal * (amplitude * 10),
  };
}

/**
 * 14. Idle accent pulse (an accent line or dot brightens every 2 to 3 seconds).
 */
export function evalIdleAccentPulse(t: number, period = 2.5): number {
  const cycle = (t % period) / period;
  if (cycle < 0.25) {
    // Smooth brightening pulse
    return 1.0 + Math.sin((cycle / 0.25) * Math.PI) * 0.45;
  }
  return 1.0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Outro Primitives (Exits)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 15. Outros:
 * - reverse wipe
 * - slide out
 * - fade down
 * - collapse to line
 */
export function evalReverseWipe(
  progress: number,
  rect: Rect,
  direction: WipeDirection = 'left',
): Rect {
  const p = 1 - easeOutCubic(progress);
  return evalWipe(p, rect, direction);
}

export function evalSlideOut(
  progress: number,
  distance: number,
  direction: 'left' | 'right' | 'bottom' = 'left',
): { translateX: number; translateY: number; opacity: number } {
  const p = easeOutCubic(progress);
  let tx = 0;
  let ty = 0;
  if (direction === 'left') tx = -distance * p;
  else if (direction === 'right') tx = distance * p;
  else if (direction === 'bottom') ty = distance * p;

  return {
    translateX: tx,
    translateY: ty,
    opacity: clamp01(1 - p * 1.2),
  };
}

export function evalFadeDown(
  progress: number,
  distance = 16,
): { opacity: number; translateY: number } {
  const p = easeOutCubic(progress);
  return {
    opacity: clamp01(1 - p),
    translateY: distance * p,
  };
}

export function evalCollapseToLine(
  progress: number,
  rect: Rect,
): { height: number; translateY: number; opacity: number } {
  const p = easeOutCubic(progress);
  const targetH = Math.max(2, rect.height * (1 - p));
  const ty = (rect.height - targetH) / 2;
  return {
    height: targetH,
    translateY: ty,
    opacity: clamp01(1 - p * 1.5),
  };
}
