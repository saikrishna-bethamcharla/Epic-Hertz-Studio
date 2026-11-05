// ─── Compatibility helpers ──────────────────────────────────────────────────
// Maps a rich CaptionStyle onto a simplified basic styling structure, and
// ensures loaded or legacy project styles are properly migrated to CaptionStyle.

import type { CaptionStyle } from './spec';
import { PRESETS, DEFAULT_STYLE } from './presets';

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

/**
 * Ensures any style object (including legacy SubtitleStyle drafts from v1)
 * is safely normalized to a full, valid CaptionStyle.
 */
export function ensureCaptionStyle(raw: unknown): CaptionStyle {
  if (!raw || typeof raw !== 'object') {
    return structuredClone(DEFAULT_STYLE);
  }
  const s = raw as Record<string, unknown>;

  // If it already has the modern CaptionStyle structure (font, layout, fill, motion)
  if (s.font && s.layout && s.fill && s.motion) {
    return s as unknown as CaptionStyle;
  }

  // Legacy format detected (e.g. { preset: 'hormozi-yellow', ... } or { preset: 'capcut-viral' })
  const presetId = typeof s.preset === 'string' ? s.preset : typeof s.id === 'string' ? s.id : '';
  const match = PRESETS.find(
    (p) =>
      p.style.id.toLowerCase() === presetId.toLowerCase() ||
      p.group.toLowerCase().includes(presetId.toLowerCase()) ||
      p.style.name.toLowerCase().includes(presetId.toLowerCase()),
  );
  if (match) {
    return structuredClone(match.style);
  }

  return structuredClone(DEFAULT_STYLE);
}
