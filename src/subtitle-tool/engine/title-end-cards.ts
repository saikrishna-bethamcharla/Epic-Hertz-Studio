// ─── Title Cards & End Cards Pack — Epic Hertz Studio ────────────────────────
// Cinematic full-frame title / end cards with movie-style typography.
//
// Uses the same LowerThirdTemplate schema so you can register them with:
//
//   import { TITLE_END_TEMPLATES } from './title-end-cards';
//   registerLowerThirdTemplates(TITLE_END_TEMPLATES);
//
// Recommended usage:
//   - templateId: 'title-cinema-serif' (etc.)
//   - position: { x: 0.5, y: 0.5, align: 'center' }   // center of frame
//   - name  → Main Title
//   - role  → Subtitle / Tagline
//   - extra → Optional third line (year, "The End", studio, etc.)
//   - font.family: prefer 'playfair' for cinematic look
//   - font.size: 0.06–0.12 (much larger than lower thirds)
//   - introDuration / outroDuration: 1.0–1.8s for dramatic fades
//
// Font blending notes:
//   Current renderer uses one family for all lines (size/weight/color differ).
//   For best movie-title look set family to 'playfair' (serif) or 'unbounded'.
//   Pairings that already look great with existing fonts:
//     • playfair (title) + smaller weight for subtitle
//     • unbounded / bebas / oswald for impact titles
//     • inter / montserrat for clean modern end cards

import type { LowerThirdTemplate, LowerThirdPack } from './lowerThirdSchema';

const CANVAS = {
  referenceWidth: 1080,
  referenceHeight: 1920,
  safeZone: { top: 0.12, bottom: 0.12, left: 0.08, right: 0.08 },
} as const;

const TITLE_SLOTS = [
  {
    id: 'primaryColor',
    label: 'Accent Color',
    type: 'color' as const,
    target: 'colors.primary',
    default: '#EAB308',
  },
  {
    id: 'secondaryColor',
    label: 'Plate / BG Color',
    type: 'color' as const,
    target: 'colors.secondary',
    default: 'rgba(0,0,0,0.55)',
  },
  {
    id: 'textColor',
    label: 'Title Color',
    type: 'color' as const,
    target: 'colors.textPrimary',
    default: '#FFFFFF',
  },
  {
    id: 'roleColor',
    label: 'Subtitle Color',
    type: 'color' as const,
    target: 'colors.textSecondary',
    default: '#E4E4E7',
  },
  {
    id: 'fontFamily',
    label: 'Font Family',
    type: 'font' as const,
    target: 'font.family',
    default: 'playfair',
  },
  {
    id: 'scale',
    label: 'Scale',
    type: 'number' as const,
    target: 'scale',
    default: 1.0,
    min: 0.5,
    max: 2.0,
    step: 0.05,
  },
];

const AUTO_FIT = {
  minScale: 0.45,
  maxLines: 3,
  truncate: true,
  overflow: 'shrink' as const,
};

export const TITLE_END_TEMPLATES: LowerThirdTemplate[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // TITLE CARDS — opening / chapter / movie-style
  // ═══════════════════════════════════════════════════════════════════════════

  // 1. Cinema Serif — classic movie title (Playfair + elegant fade)
  {
    id: 'title-cinema-serif',
    packId: 'title-end',
    name: 'Cinema Serif',
    version: 1,
    category: 'Title Card',
    tags: ['cinematic', 'serif', 'movie', 'classic', 'opening'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'title-text',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'blurIn', duration: 1.2, delay: 0.1, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.9, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'divider-line',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0.055, width: 120, height: 2, align: 'center', anchor: 'name' },
        style: { fill: '$colors.primary', radius: 1, opacity: 0.9 },
        animation: {
          in: {
            type: 'lineDraw',
            duration: 0.8,
            delay: 0.45,
            easing: 'easeOutExpo',
            direction: 'left',
          },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.6, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'subtitle-text',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.075,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.9, delay: 0.55, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.7, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#EAB308' },
      { ...TITLE_SLOTS[1], default: 'transparent' },
      { ...TITLE_SLOTS[2], default: '#FAFAF9' },
      { ...TITLE_SLOTS[3], default: '#A8A29E' },
      { ...TITLE_SLOTS[4], default: 'playfair' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },

  // 2. Epic Display — big impact title (Unbounded / Bebas energy)
  {
    id: 'title-epic-display',
    packId: 'title-end',
    name: 'Epic Display',
    version: 1,
    category: 'Title Card',
    tags: ['epic', 'display', 'bold', 'trailer', 'impact'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'title-text',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: {
          fill: '$colors.textPrimary',
          opacity: 1,
          shadow: { x: 0, y: 6, blur: 24, color: 'rgba(0,0,0,0.55)' },
        },
        animation: {
          in: {
            type: 'scalePop',
            duration: 0.9,
            delay: 0.05,
            easing: 'easeOutBack',
            overshoot: 0.08,
          },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.7, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'subtitle-text',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.07,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.7, delay: 0.4, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.55, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#F59E0B' },
      { ...TITLE_SLOTS[1], default: 'transparent' },
      { ...TITLE_SLOTS[2], default: '#FFFFFF' },
      { ...TITLE_SLOTS[3], default: '#FBBF24' },
      { ...TITLE_SLOTS[4], default: 'unbounded' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },

  // 3. Gold Chapter — chapter card with gold line (film chapter style)
  {
    id: 'title-gold-chapter',
    packId: 'title-end',
    name: 'Gold Chapter',
    version: 1,
    category: 'Title Card',
    tags: ['chapter', 'gold', 'film', 'elegant', 'section'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'chapter-label',
        type: 'text',
        role: 'extra',
        geometry: {
          x: 0,
          y: -0.05,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: { fill: '$colors.primary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 0.7, delay: 0, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.5, delay: 0.15, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'title-text',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'blurIn', duration: 1.0, delay: 0.2, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.75, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'gold-line',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0.06, width: 160, height: 2, align: 'center', anchor: 'name' },
        style: { fill: '$colors.primary', radius: 1, opacity: 1 },
        animation: {
          in: {
            type: 'lineDraw',
            duration: 0.85,
            delay: 0.5,
            easing: 'easeOutExpo',
            direction: 'left',
          },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.5, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'subtitle-text',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.085,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.75, delay: 0.65, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.55, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#EAB308' },
      { ...TITLE_SLOTS[1], default: 'transparent' },
      { ...TITLE_SLOTS[2], default: '#FAFAF9' },
      { ...TITLE_SLOTS[3], default: '#D6D3D1' },
      { ...TITLE_SLOTS[4], default: 'playfair' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },

  // 4. Minimal Center — pure centered text, no ornaments
  {
    id: 'title-minimal-center',
    packId: 'title-end',
    name: 'Minimal Center',
    version: 1,
    category: 'Title Card',
    tags: ['minimal', 'clean', 'modern', 'simple'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'title-text',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 1.1, delay: 0.15, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.9, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'subtitle-text',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.065,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 0.9, delay: 0.45, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.7, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#FFFFFF' },
      { ...TITLE_SLOTS[1], default: 'transparent' },
      { ...TITLE_SLOTS[2], default: '#FFFFFF' },
      { ...TITLE_SLOTS[3], default: '#A1A1AA' },
      { ...TITLE_SLOTS[4], default: 'inter' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },

  // 5. Trailer Impact — bold condensed + scale slam (trailer style)
  {
    id: 'title-trailer-impact',
    packId: 'title-end',
    name: 'Trailer Impact',
    version: 1,
    category: 'Title Card',
    tags: ['trailer', 'impact', 'bold', 'condensed', 'action'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'title-text',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: {
          fill: '$colors.textPrimary',
          opacity: 1,
          shadow: { x: 0, y: 4, blur: 18, color: 'rgba(0,0,0,0.7)' },
        },
        animation: {
          in: {
            type: 'scalePop',
            duration: 0.75,
            delay: 0,
            easing: 'easeOutBack',
            overshoot: 0.12,
          },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.55, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'subtitle-text',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.07,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.primary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.55, delay: 0.35, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#EF4444' },
      { ...TITLE_SLOTS[1], default: 'transparent' },
      { ...TITLE_SLOTS[2], default: '#FFFFFF' },
      { ...TITLE_SLOTS[3], default: '#FCA5A5' },
      { ...TITLE_SLOTS[4], default: 'bebas' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },

  // 6. Soft Editorial — gentle fade, refined (documentary / premium)
  {
    id: 'title-soft-editorial',
    packId: 'title-end',
    name: 'Soft Editorial',
    version: 1,
    category: 'Title Card',
    tags: ['editorial', 'soft', 'documentary', 'premium', 'quiet'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'title-text',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'blurIn', duration: 1.4, delay: 0.2, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 1.1, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'subtitle-text',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.06,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 1.0, delay: 0.55, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.85, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#A8A29E' },
      { ...TITLE_SLOTS[1], default: 'transparent' },
      { ...TITLE_SLOTS[2], default: '#FAFAF9' },
      { ...TITLE_SLOTS[3], default: '#A8A29E' },
      { ...TITLE_SLOTS[4], default: 'playfair' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // END CARDS — closing / credits / "thanks for watching"
  // ═══════════════════════════════════════════════════════════════════════════

  // 7. The End Classic — traditional film ending
  {
    id: 'end-the-end-classic',
    packId: 'title-end',
    name: 'The End Classic',
    version: 1,
    category: 'End Card',
    tags: ['the-end', 'classic', 'film', 'closing', 'credits'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'end-text',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 1.3, delay: 0.2, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 1.2, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'line',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0.055, width: 80, height: 1.5, align: 'center', anchor: 'name' },
        style: { fill: '$colors.primary', radius: 1, opacity: 0.85 },
        animation: {
          in: {
            type: 'lineDraw',
            duration: 0.9,
            delay: 0.6,
            easing: 'easeOutExpo',
            direction: 'left',
          },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.7, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'tagline',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.075,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 0.9, delay: 0.75, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.8, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#EAB308' },
      { ...TITLE_SLOTS[1], default: 'transparent' },
      { ...TITLE_SLOTS[2], default: '#FAFAF9' },
      { ...TITLE_SLOTS[3], default: '#A8A29E' },
      { ...TITLE_SLOTS[4], default: 'playfair' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },

  // 8. Thanks Subscribe — social end card (YouTube / Reels)
  {
    id: 'end-thanks-subscribe',
    packId: 'title-end',
    name: 'Thanks & Subscribe',
    version: 1,
    category: 'End Card',
    tags: ['thanks', 'subscribe', 'youtube', 'social', 'cta'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'thanks-text',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: {
          fill: '$colors.textPrimary',
          opacity: 1,
          shadow: { x: 0, y: 4, blur: 16, color: 'rgba(0,0,0,0.5)' },
        },
        animation: {
          in: {
            type: 'scalePop',
            duration: 0.7,
            delay: 0.05,
            easing: 'easeOutBack',
            overshoot: 0.1,
          },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.55, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'cta-text',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.065,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.primary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.55, delay: 0.35, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.45, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#EF4444' },
      { ...TITLE_SLOTS[1], default: 'transparent' },
      { ...TITLE_SLOTS[2], default: '#FFFFFF' },
      { ...TITLE_SLOTS[3], default: '#FCA5A5' },
      { ...TITLE_SLOTS[4], default: 'montserrat' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },

  // 9. Credits Roll Style — name + role stacked (simple credit card)
  {
    id: 'end-credits-card',
    packId: 'title-end',
    name: 'Credits Card',
    version: 1,
    category: 'End Card',
    tags: ['credits', 'cast', 'crew', 'closing'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'role-label',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: -0.04,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 0.7, delay: 0.1, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.55, delay: 0.1, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'name-text',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.85, delay: 0.25, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.7, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#A8A29E' },
      { ...TITLE_SLOTS[1], default: 'transparent' },
      { ...TITLE_SLOTS[2], default: '#FAFAF9' },
      { ...TITLE_SLOTS[3], default: '#A8A29E' },
      { ...TITLE_SLOTS[4], default: 'playfair' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },

  // 10. Dark Glass End — frosted plate end card
  {
    id: 'end-dark-glass',
    packId: 'title-end',
    name: 'Dark Glass End',
    version: 1,
    category: 'End Card',
    tags: ['glass', 'dark', 'premium', 'closing', 'modern'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'glass-plate',
        type: 'shape',
        role: 'container',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: {
          fill: 'rgba(12,12,14,0.78)',
          radius: 16,
          opacity: 1,
          shadow: { x: 0, y: 12, blur: 40, color: 'rgba(0,0,0,0.45)' },
        },
        animation: {
          in: {
            type: 'scalePop',
            duration: 0.75,
            delay: 0,
            easing: 'easeOutBack',
            overshoot: 0.05,
          },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.6, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'title-text',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0.015,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.6, delay: 0.2, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'subtitle-text',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.055,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.55, delay: 0.35, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.4, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#38BDF8' },
      { ...TITLE_SLOTS[1], default: 'rgba(12,12,14,0.78)' },
      { ...TITLE_SLOTS[2], default: '#FFFFFF' },
      { ...TITLE_SLOTS[3], default: '#A1A1AA' },
      { ...TITLE_SLOTS[4], default: 'inter' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },

  // 11. Neon Close — gaming / cyber end card
  {
    id: 'end-neon-close',
    packId: 'title-end',
    name: 'Neon Close',
    version: 1,
    category: 'End Card',
    tags: ['neon', 'gaming', 'cyber', 'glow', 'closing'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'title-text',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: {
          fill: '$colors.textPrimary',
          opacity: 1,
          shadow: { x: 0, y: 0, blur: 28, color: 'rgba(34,211,238,0.45)' },
        },
        animation: {
          in: {
            type: 'scalePop',
            duration: 0.7,
            delay: 0.05,
            easing: 'easeOutBack',
            overshoot: 0.08,
          },
          hold: { type: 'accentPulse', amplitude: 0.03, period: 2.5 },
          out: { type: 'fade', duration: 0.55, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'subtitle-text',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.065,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.primary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.55, delay: 0.3, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.45, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#22D3EE' },
      { ...TITLE_SLOTS[1], default: 'transparent' },
      { ...TITLE_SLOTS[2], default: '#E0F2FE' },
      { ...TITLE_SLOTS[3], default: '#67E8F9' },
      { ...TITLE_SLOTS[4], default: 'unbounded' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },

  // 12. Studio Logo Card — centered title + small studio line
  {
    id: 'end-studio-logo',
    packId: 'title-end',
    name: 'Studio Logo Card',
    version: 1,
    category: 'End Card',
    tags: ['studio', 'logo', 'brand', 'closing', 'production'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...CANVAS },
    elements: [
      {
        id: 'studio-name',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'frame',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'blurIn', duration: 1.1, delay: 0.15, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.9, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'presents-line',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.06,
          width: 'content',
          height: 'content',
          align: 'center',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 0.8, delay: 0.5, easing: 'easeOutCubic' },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.65, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...TITLE_SLOTS[0], default: '#EAB308' },
      { ...TITLE_SLOTS[1], default: 'transparent' },
      { ...TITLE_SLOTS[2], default: '#FAFAF9' },
      { ...TITLE_SLOTS[3], default: '#A8A29E' },
      { ...TITLE_SLOTS[4], default: 'playfair' },
      TITLE_SLOTS[5],
    ],
    autoFit: AUTO_FIT,
  },
];

/** Pack wrapper for pack-based loading. */
export const TITLE_END_PACK: LowerThirdPack = {
  id: 'title-end',
  packId: 'title-end',
  name: 'Title Cards & End Cards',
  description:
    '12 cinematic title and end cards — movie serif, trailer impact, chapter cards, thanks/subscribe, credits, neon close.',
  templates: TITLE_END_TEMPLATES,
};
