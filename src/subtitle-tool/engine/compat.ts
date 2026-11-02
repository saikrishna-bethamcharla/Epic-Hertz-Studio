// ─── Compatibility helpers ──────────────────────────────────────────────────
// The static ffmpeg/ASS hard-sub path (used only as a fallback) understands a handful of basic
// fields. This maps a rich CaptionStyle onto them.

import type { CaptionStyle } from './spec';

export interface BasicStyle {
  position?: 'top' | 'middle' | 'bottom';
  textColor?: string;
  outlineColor?: string;
  outlineWidth?: number;
  fontSize?: number;
  uppercase?: boolean;
}

export function toBasicStyle(s: CaptionStyle): BasicStyle {
  const fill = typeof s.fill === 'string' ? s.fill : s.fill.stops[0]?.[1] ?? '#FFFFFF';
  const hex = (c: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(c) ? c : fallback);
  return {
    position: s.layout.y < 0.34 ? 'top' : s.layout.y < 0.62 ? 'middle' : 'bottom',
    textColor: hex(fill, '#FFFFFF'),
    outlineColor: hex(s.stroke.color, '#000000'),
    outlineWidth: Math.max(2, Math.min(6, Math.round(s.stroke.width * 40))),
    fontSize: Math.round(s.font.size * 260),
    uppercase: s.font.textCase === 'upper',
  };
}
