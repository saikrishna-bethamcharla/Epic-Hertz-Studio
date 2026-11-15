// ─── Lower Third Bounds & Hit-Testing Engine ─────────────────────────────────
// Computes accurate bounding boxes for callouts, youtube templates, social handles,
// kinetic MOGRT titles, and classic lower thirds on the video preview canvas.
// Used for on-screen click-to-select and drag-to-move interactions.

import type { LowerThirdSpec } from '../types';

export interface LowerThirdBounds {
  x: number; // Left coordinate on canvas (in canvas pixels)
  y: number; // Top coordinate on canvas (in canvas pixels)
  w: number; // Width (in canvas pixels)
  h: number; // Height (in canvas pixels)
  cx: number; // Center X (in canvas pixels)
  cy: number; // Center Y (in canvas pixels)
}

/**
 * Returns default normalized { x, y } (0..1) for a given lower-third template if unspecified.
 */
export function getDefaultLowerThirdPosition(spec: LowerThirdSpec): { x: number; y: number } {
  const tId = (spec.templateId || '').toLowerCase();
  if (tId.startsWith('mogrt-callout') || tId === 'bold-callout') {
    return { x: 0.55, y: 0.45 };
  }
  if (tId.startsWith('mogrt-youtube') || tId === 'youtube-subscribe') {
    return { x: 0.50, y: 0.82 };
  }
  if (tId.startsWith('social-handle')) {
    return { x: 0.50, y: 0.84 };
  }
  if (tId.startsWith('mogrt-')) {
    return { x: 0.50, y: 0.50 };
  }
  return { x: 0.08, y: 0.85 };
}

/**
 * Computes the bounding rectangle of a lower-third overlay at canvas dimensions (canvasW, canvasH) at timestamp t.
 * Returns null if the item is not currently active at timestamp t.
 */
export function getLowerThirdBounds(
  spec: LowerThirdSpec,
  canvasW: number,
  canvasH: number,
  t?: number,
): LowerThirdBounds | null {
  if (t !== undefined && (t < spec.start || t > spec.end)) {
    return null;
  }

  const baseDim = Math.min(canvasW, canvasH);
  const scale = (spec.scale || 1.0) * (baseDim / 1080);
  const defaultPos = getDefaultLowerThirdPosition(spec);
  const nx = spec.position?.x !== undefined ? spec.position.x : defaultPos.x;
  const ny = spec.position?.y !== undefined ? spec.position.y : defaultPos.y;

  const tId = (spec.templateId || '').toLowerCase();

  // 1. Call-out Graphics (8 Styles)
  if (tId.startsWith('mogrt-callout') || tId === 'bold-callout') {
    const cx = nx * canvasW;
    const cy = ny * canvasH;
    const bw = Math.max(120, 380 * scale);
    const bh = Math.max(70, 150 * scale);
    return {
      x: cx - bw / 2,
      y: cy - bh / 2,
      w: bw,
      h: bh,
      cx,
      cy,
    };
  }

  // 2. YouTube Graphics Pack (8 Models)
  if (tId.startsWith('mogrt-youtube') || tId === 'youtube-subscribe') {
    const cx = nx * canvasW;
    const cy = ny * canvasH;
    const isLarge = tId.includes('channel-card') || tId.includes('end-screen');
    const bw = isLarge ? Math.max(140, 440 * scale) : Math.max(120, 400 * scale);
    const bh = isLarge ? Math.max(70, 160 * scale) : Math.max(45, 84 * scale);
    return {
      x: cx - bw / 2,
      y: cy - bh / 2,
      w: bw,
      h: bh,
      cx,
      cy,
    };
  }

  // 3. Social Media Handles (18 Platforms)
  if (tId.startsWith('social-handle')) {
    const cx = nx * canvasW;
    const cy = ny * canvasH;
    const bw = Math.max(100, 300 * scale);
    const bh = Math.max(38, 64 * scale);
    return {
      x: cx - bw / 2,
      y: cy - bh / 2,
      w: bw,
      h: bh,
      cx,
      cy,
    };
  }

  // 4. MOGRT Kinetic Titles (Spin & Twist, Mirror Splash, RGB Glitch, etc.)
  if (tId.startsWith('mogrt-')) {
    const cx = nx * canvasW;
    const cy = ny * canvasH;
    const bw = Math.max(140, 460 * scale);
    const bh = Math.max(60, 150 * scale);
    return {
      x: cx - bw / 2,
      y: cy - bh / 2,
      w: bw,
      h: bh,
      cx,
      cy,
    };
  }

  // 5. Classic Lower Thirds (Variants 1-8)
  const bw = Math.max(120, 420 * scale);
  const bh = Math.max(40, 95 * scale);
  let x = nx * canvasW;
  const y = ny * canvasH;
  if (spec.position?.align === 'center') {
    x -= bw / 2;
  } else if (spec.position?.align === 'right') {
    x -= bw;
  }
  return {
    x,
    y,
    w: bw,
    h: bh,
    cx: x + bw / 2,
    cy: y + bh / 2,
  };
}

/**
 * Hit test helper: checks whether (x, y) point on canvas is inside bounds.
 */
export function isPointInBounds(
  point: { x: number; y: number },
  bounds: { x: number; y: number; w: number; h: number },
  padding = 0,
): boolean {
  return (
    point.x >= bounds.x - padding &&
    point.x <= bounds.x + bounds.w + padding &&
    point.y >= bounds.y - padding &&
    point.y <= bounds.y + bounds.h + padding
  );
}
