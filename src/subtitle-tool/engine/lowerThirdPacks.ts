// ─── Lower Third Packs & 48 Templates Catalog — Epic Hertz Studio Engine ─────
// 6 curated packs with 8 templates each (48 templates total).
// Restrained, unslop professional look. No emojis, no sparkle icons, no neon/rainbow gradients.
// OFL fonts and generic Lucide icons only.

import {
  type LowerThirdPack,
  type LowerThirdTemplate,
  CLASSIC_TEMPLATES,
} from './lowerThirdSchema';

// ─────────────────────────────────────────────────────────────────────────────
// PACK 1: CLEAN CORPORATE (sans, calm, solid colors)
// ─────────────────────────────────────────────────────────────────────────────
export const CLEAN_CORPORATE_TEMPLATES: LowerThirdTemplate[] = [
  // 1. Bar Slide
  {
    id: 'corp-bar-slide',
    packId: 'clean-corporate',
    name: 'Bar Slide',
    version: 1,
    category: 'Clean Corporate',
    tags: ['corporate', 'minimal', 'accent-bar', 'executive'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'bar',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 6, height: 'content' },
        style: { fill: '#2563eb', stroke: '#2563eb', strokeWidth: 5 },
        animation: {
          in: { type: 'lineDraw', duration: 0.5, delay: 0 },
          hold: { type: 'static' },
          out: { type: 'collapseToLine', duration: 0.4 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 0 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.6, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.4, direction: 'left' },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 16, y: 36 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fadeUp', duration: 0.5, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fadeDown', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'primaryColor',
        label: 'Bar Color',
        type: 'color',
        target: 'colors.primary',
        default: '#2563eb',
      },
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Inter',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 2. Underline Draw
  {
    id: 'corp-underline-draw',
    packId: 'clean-corporate',
    name: 'Underline Draw',
    version: 1,
    category: 'Clean Corporate',
    tags: ['line', 'editorial', 'modern', 'understated'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 0 },
        style: { fill: '#f8fafc' },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.6, delay: 0 },
          hold: { type: 'static' },
          out: { type: 'fadeDown', duration: 0.4 },
        },
      },
      {
        id: 'underline',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 44, width: 'content', height: 2 },
        style: { fill: '#0ea5e9', stroke: '#0ea5e9', strokeWidth: 2 },
        animation: {
          in: { type: 'lineDraw', duration: 0.6, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.4 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 0, y: 52 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fadeUp', duration: 0.5, delay: 0.3 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'lineColor',
        label: 'Underline Color',
        type: 'color',
        target: 'colors.primary',
        default: '#0ea5e9',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 3. Box Tag
  {
    id: 'corp-box-tag',
    packId: 'clean-corporate',
    name: 'Box Tag',
    version: 1,
    category: 'Clean Corporate',
    tags: ['box', 'badge', 'solid', 'structured'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'nameBox',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: '#1e293b', radius: 4 },
        animation: {
          in: { type: 'wipe', duration: 0.6, direction: 'left' },
          hold: { type: 'static' },
          out: { type: 'wipe', duration: 0.4, direction: 'left' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 10 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fadeUp', duration: 0.5, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'roleTag',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 54 },
        style: { fill: '#3b82f6', radius: 3 },
        animation: {
          in: { type: 'scalePop', duration: 0.4, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 12, y: 60 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'primaryColor',
        label: 'Tag Color',
        type: 'color',
        target: 'colors.primary',
        default: '#3b82f6',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 4. Split Panel
  {
    id: 'corp-split-panel',
    packId: 'clean-corporate',
    name: 'Split Panel',
    version: 1,
    category: 'Clean Corporate',
    tags: ['split', 'dual-tone', 'panel', 'contrast'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'leftPanel',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: '#0f172a', radius: [4, 0, 0, 4] },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.6 },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.4, direction: 'left' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 12 },
        style: { fill: '#f8fafc' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'rightPanel',
        type: 'shape',
        role: 'decor',
        geometry: { x: 260, y: 0 },
        style: { fill: '#2563eb', radius: [0, 4, 4, 0] },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.6, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.4, direction: 'right' },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 276, y: 12 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.25 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'panelColor',
        label: 'Accent Panel',
        type: 'color',
        target: 'colors.primary',
        default: '#2563eb',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 5. Minimal Line
  {
    id: 'corp-minimal-line',
    packId: 'clean-corporate',
    name: 'Minimal Line',
    version: 1,
    category: 'Clean Corporate',
    tags: ['minimal', 'clean', 'simple', 'transparent'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'line',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 3, height: 48 },
        style: { fill: '#64748b', stroke: '#64748b', strokeWidth: 3 },
        animation: {
          in: { type: 'lineDraw', duration: 0.4 },
          hold: { type: 'static' },
          out: { type: 'fadeDown', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 2 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fadeUp', duration: 0.5, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fadeDown', duration: 0.3 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 16, y: 32 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fadeUp', duration: 0.5, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fadeDown', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Inter',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 6. Corner Bracket
  {
    id: 'corp-corner-bracket',
    packId: 'clean-corporate',
    name: 'Corner Bracket',
    version: 1,
    category: 'Clean Corporate',
    tags: ['bracket', 'framing', 'architectural', 'clean'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'bracketLeft',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 2, height: 40 },
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        animation: {
          in: { type: 'lineDraw', duration: 0.5 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 14, y: 4 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.5, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 14, y: 32 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.25 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'bracketColor',
        label: 'Bracket Color',
        type: 'color',
        target: 'colors.primary',
        default: '#3b82f6',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 7. Stacked Caps
  {
    id: 'corp-stacked-caps',
    packId: 'clean-corporate',
    name: 'Stacked Caps',
    version: 1,
    category: 'Clean Corporate',
    tags: ['caps', 'typography', 'bold', 'stagger'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 0 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'wordStagger', duration: 0.7 },
          hold: { type: 'static' },
          out: { type: 'fadeDown', duration: 0.4 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 0, y: 42 },
        style: { fill: '#60a5fa' },
        animation: {
          in: { type: 'fadeUp', duration: 0.5, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fadeDown', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Inter',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 8. Soft Card
  {
    id: 'corp-soft-card',
    packId: 'clean-corporate',
    name: 'Soft Card',
    version: 1,
    category: 'Clean Corporate',
    tags: ['card', 'translucent', 'glass', 'rounded'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'card',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: {
          fill: 'rgba(15, 23, 42, 0.85)',
          radius: 8,
          stroke: 'rgba(255,255,255,0.1)',
          strokeWidth: 1,
        },
        animation: {
          in: { type: 'blurIn', duration: 0.6 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.4 },
        },
      },
      {
        id: 'accentLine',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 'content', height: 2 },
        style: { fill: '#3b82f6', stroke: '#3b82f6', strokeWidth: 2 },
        animation: {
          in: { type: 'lineDraw', duration: 0.5, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 20, y: 16 },
        style: { fill: '#f8fafc' },
        animation: {
          in: { type: 'fadeUp', duration: 0.5, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 20, y: 46 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fadeUp', duration: 0.4, delay: 0.25 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'accentColor',
        label: 'Top Accent',
        type: 'color',
        target: 'colors.primary',
        default: '#3b82f6',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PACK 2: CREATOR AND REELS (vertical-video friendly, larger type)
// ─────────────────────────────────────────────────────────────────────────────
export const CREATOR_REELS_TEMPLATES: LowerThirdTemplate[] = [
  // 1. Pill Capsule
  {
    id: 'creator-pill-capsule',
    packId: 'creator-reels',
    name: 'Pill Capsule',
    version: 1,
    category: 'Creator & Reels',
    tags: ['pill', 'avatar', 'capsule', 'reels', 'tiktok'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'avatar',
        type: 'image',
        role: 'photo',
        geometry: { x: 0, y: 0, width: 56, height: 56 },
        style: { fill: '#27272a', radius: 28 },
        animation: {
          in: { type: 'photoReveal', duration: 0.5 },
          hold: { type: 'static' },
          out: { type: 'scalePop', duration: 0.3 },
        },
      },
      {
        id: 'pill',
        type: 'shape',
        role: 'container',
        geometry: { x: 28, y: 4, width: 'content', height: 48 },
        style: { fill: 'rgba(24, 24, 27, 0.92)', radius: 24 },
        animation: {
          in: { type: 'wipe', duration: 0.6, direction: 'left', delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'wipe', duration: 0.3, direction: 'left' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 72, y: 14 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.25 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'pillBg',
        label: 'Pill Color',
        type: 'color',
        target: 'colors.secondary',
        default: '#18181b',
      },
    ],
    autoFit: { minScale: 0.65, maxLines: 1, truncate: true, overflow: 'ellipsis' },
  },
  // 2. Handle Pop
  {
    id: 'creator-handle-pop',
    packId: 'creator-reels',
    name: 'Handle Pop',
    version: 1,
    category: 'Creator & Reels',
    tags: ['handle', 'social', 'at-sign', 'pop'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 0 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.5 },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.3, direction: 'bottom' },
        },
      },
      {
        id: 'handleChip',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 44, width: 'content', height: 28 },
        style: { fill: '#3b82f6', radius: 14 },
        animation: {
          in: { type: 'scalePop', duration: 0.4, delay: 0.15, overshoot: 0.08 },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.3, direction: 'bottom' },
        },
      },
      {
        id: 'handle',
        type: 'text',
        role: 'handle',
        geometry: { x: 12, y: 48 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.3, delay: 0.25 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'chipColor',
        label: 'Chip Color',
        type: 'color',
        target: 'colors.primary',
        default: '#3b82f6',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 3. Sticker Tag
  {
    id: 'creator-sticker-tag',
    packId: 'creator-reels',
    name: 'Sticker Tag',
    version: 1,
    category: 'Creator & Reels',
    tags: ['sticker', 'rotated', 'bold', 'angle'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'tagShape',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: '#e11d48', radius: 6, skew: -3 },
        animation: {
          in: { type: 'scalePop', duration: 0.5, overshoot: 0.08 },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.4, direction: 'left' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 18, y: 12 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'stickerColor',
        label: 'Tag Color',
        type: 'color',
        target: 'colors.primary',
        default: '#e11d48',
      },
    ],
    autoFit: { minScale: 0.65, maxLines: 1, truncate: true, overflow: 'shrink' },
  },
  // 4. Bounce Card
  {
    id: 'creator-bounce-card',
    packId: 'creator-reels',
    name: 'Bounce Card',
    version: 1,
    category: 'Creator & Reels',
    tags: ['bounce', 'spring', 'card', 'lively'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'card',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: '#18181b', radius: 12, stroke: '#27272a', strokeWidth: 2 },
        animation: {
          in: { type: 'scalePop', duration: 0.55, overshoot: 0.08 },
          hold: { type: 'static' },
          out: { type: 'scalePop', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 20, y: 14 },
        style: { fill: '#f4f4f5' },
        animation: {
          in: { type: 'fadeUp', duration: 0.4, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Montserrat',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 5. Underline Marker
  {
    id: 'creator-underline-marker',
    packId: 'creator-reels',
    name: 'Underline Marker',
    version: 1,
    category: 'Creator & Reels',
    tags: ['marker', 'highlight', 'creator', 'brush'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'markerBar',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 24, width: 'content', height: 16 },
        style: { fill: 'rgba(234, 179, 8, 0.4)', radius: 3 },
        animation: {
          in: { type: 'wipe', duration: 0.5, direction: 'left' },
          hold: { type: 'static' },
          out: { type: 'wipe', duration: 0.3, direction: 'left' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 4, y: 4 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'markerColor',
        label: 'Marker Color',
        type: 'color',
        target: 'colors.primary',
        default: '#eab308',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 1, truncate: true, overflow: 'shrink' },
  },
  // 6. Photo Bubble
  {
    id: 'creator-photo-bubble',
    packId: 'creator-reels',
    name: 'Photo Bubble',
    version: 1,
    category: 'Creator & Reels',
    tags: ['photo', 'bubble', 'iris', 'round'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'photo',
        type: 'image',
        role: 'photo',
        geometry: { x: 0, y: 0, width: 72, height: 72 },
        style: { fill: '#27272a', radius: 36, stroke: '#ffffff', strokeWidth: 3 },
        animation: {
          in: { type: 'photoReveal', duration: 0.55 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.35 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 86, y: 12 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.5, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.3, direction: 'left' },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 86, y: 44 },
        style: { fill: '#a1a1aa' },
        animation: {
          in: { type: 'fadeUp', duration: 0.4, delay: 0.25 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.25 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Inter',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 7. Swipe Tag
  {
    id: 'creator-swipe-tag',
    packId: 'creator-reels',
    name: 'Swipe Tag',
    version: 1,
    category: 'Creator & Reels',
    tags: ['swipe', 'stacked', 'motion', 'bold'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'tag1',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: '#0284c7', radius: 4 },
        animation: {
          in: { type: 'wipe', duration: 0.5, direction: 'left' },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.3, direction: 'right' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 8 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
      {
        id: 'tag2',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 48 },
        style: { fill: '#0f172a', radius: 4 },
        animation: {
          in: { type: 'wipe', duration: 0.5, direction: 'left', delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.3, direction: 'right', delay: 0.08 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 16, y: 56 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fade', duration: 0.3, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'primaryColor',
        label: 'Primary Tag',
        type: 'color',
        target: 'colors.primary',
        default: '#0284c7',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 8. Caption Banner
  {
    id: 'creator-caption-banner',
    packId: 'creator-reels',
    name: 'Caption Banner',
    version: 1,
    category: 'Creator & Reels',
    tags: ['banner', 'wide', 'full-width', 'bottom'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'banner',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'full', height: 64 },
        style: { fill: 'rgba(9, 9, 11, 0.92)' },
        animation: {
          in: { type: 'wipe', duration: 0.6, direction: 'bottom' },
          hold: { type: 'static' },
          out: { type: 'wipe', duration: 0.4, direction: 'bottom' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 24, y: 18 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'bannerBg',
        label: 'Banner Fill',
        type: 'color',
        target: 'colors.secondary',
        default: '#09090b',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 1, truncate: true, overflow: 'shrink' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PACK 3: NEWS AND BROADCAST
// ─────────────────────────────────────────────────────────────────────────────
export const NEWS_BROADCAST_TEMPLATES: LowerThirdTemplate[] = [
  // 1. Ticker Strip
  {
    id: 'news-ticker-strip',
    packId: 'news-broadcast',
    name: 'Ticker Strip',
    version: 1,
    category: 'News & Broadcast',
    tags: ['ticker', 'broadcast', 'strip', 'full-width'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'labelBlock',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 140, height: 52 },
        style: { fill: '#dc2626' },
        animation: {
          in: { type: 'wipe', duration: 0.4, direction: 'left' },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.3 },
        },
      },
      {
        id: 'strip',
        type: 'shape',
        role: 'container',
        geometry: { x: 140, y: 0, width: 'full', height: 52 },
        style: { fill: '#0f172a' },
        animation: {
          in: { type: 'wipe', duration: 0.6, direction: 'left', delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'collapseToLine', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 160, y: 14 },
        style: { fill: '#f8fafc' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.25 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'labelColor',
        label: 'Label Color',
        type: 'color',
        target: 'colors.primary',
        default: '#dc2626',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 1, truncate: true, overflow: 'shrink' },
  },
  // 2. Breaking Label
  {
    id: 'news-breaking-label',
    packId: 'news-broadcast',
    name: 'Breaking Label',
    version: 1,
    category: 'News & Broadcast',
    tags: ['breaking', 'news', 'urgent', 'headline'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'label',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 120, height: 32 },
        style: { fill: '#b91c1c' },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.4 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.3 },
        },
      },
      {
        id: 'bar',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 32 },
        style: { fill: '#18181b' },
        animation: {
          in: { type: 'wipe', duration: 0.5, direction: 'left', delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 42 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fadeUp', duration: 0.4, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'newsColor',
        label: 'Banner Color',
        type: 'color',
        target: 'colors.primary',
        default: '#b91c1c',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 3. Two-Line Bar
  {
    id: 'news-two-line-bar',
    packId: 'news-broadcast',
    name: 'Two-Line Bar',
    version: 1,
    category: 'News & Broadcast',
    tags: ['bar', 'staggered', 'stacked', 'clean'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'bar1',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: '#1d4ed8' },
        animation: {
          in: { type: 'wipe', duration: 0.5, direction: 'left' },
          hold: { type: 'static' },
          out: { type: 'wipe', duration: 0.3, direction: 'left' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 10 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
      {
        id: 'bar2',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 46 },
        style: { fill: '#0f172a' },
        animation: {
          in: { type: 'wipe', duration: 0.5, direction: 'left', delay: 0.08 },
          hold: { type: 'static' },
          out: { type: 'wipe', duration: 0.3, direction: 'left' },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 16, y: 54 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.22 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'primaryBar',
        label: 'Primary Bar',
        type: 'color',
        target: 'colors.primary',
        default: '#1d4ed8',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 4. Location Tag
  {
    id: 'news-location-tag',
    packId: 'news-broadcast',
    name: 'Location Tag',
    version: 1,
    category: 'News & Broadcast',
    tags: ['location', 'pin', 'map', 'broadcast'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'icon',
        type: 'icon',
        role: 'decor',
        content: 'map-pin',
        geometry: { x: 0, y: 4, width: 24, height: 24 },
        style: { fill: '#ef4444' },
        animation: {
          in: { type: 'scalePop', duration: 0.4, overshoot: 0.06 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 32, y: 2 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'wipe', duration: 0.5, direction: 'left', delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'pinColor',
        label: 'Pin Color',
        type: 'color',
        target: 'colors.primary',
        default: '#ef4444',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 1, truncate: true, overflow: 'shrink' },
  },
  // 5. Dateline
  {
    id: 'news-dateline',
    packId: 'news-broadcast',
    name: 'Dateline',
    version: 1,
    category: 'News & Broadcast',
    tags: ['dateline', 'date', 'place', 'report'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'dateLine',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 26, width: 'content', height: 2 },
        style: { fill: '#64748b', stroke: '#64748b', strokeWidth: 2 },
        animation: {
          in: { type: 'lineDraw', duration: 0.5 },
          hold: { type: 'static' },
          out: { type: 'fadeDown', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 32 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.5, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fadeDown', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Inter',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 6. Quote Card
  {
    id: 'news-quote-card',
    packId: 'news-broadcast',
    name: 'Quote Card',
    version: 1,
    category: 'News & Broadcast',
    tags: ['quote', 'statement', 'card', 'interview'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'card',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: 'rgba(15, 23, 42, 0.92)', radius: 6 },
        animation: {
          in: { type: 'fadeUp', duration: 0.6 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.4 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 20, y: 16 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 20, y: 52 },
        style: { fill: '#38bdf8' },
        animation: {
          in: { type: 'lineDraw', duration: 0.4, delay: 0.25 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'sourceColor',
        label: 'Source Color',
        type: 'color',
        target: 'colors.primary',
        default: '#38bdf8',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 3, truncate: true, overflow: 'shrink' },
  },
  // 7. Anchor Panel
  {
    id: 'news-anchor-panel',
    packId: 'news-broadcast',
    name: 'Anchor Panel',
    version: 1,
    category: 'News & Broadcast',
    tags: ['anchor', 'photo', 'panel', 'studio'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'panel',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: '#09090b', radius: 4 },
        animation: {
          in: { type: 'wipe', duration: 0.6, direction: 'left' },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.4 },
        },
      },
      {
        id: 'photo',
        type: 'image',
        role: 'photo',
        geometry: { x: 12, y: 12, width: 60, height: 60 },
        style: { fill: '#27272a', radius: 6 },
        animation: {
          in: { type: 'photoReveal', duration: 0.5, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 84, y: 18 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 84, y: 48 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.28 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'panelFill',
        label: 'Panel Fill',
        type: 'color',
        target: 'colors.secondary',
        default: '#09090b',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 8. Info Strip
  {
    id: 'news-info-strip',
    packId: 'news-broadcast',
    name: 'Info Strip',
    version: 1,
    category: 'News & Broadcast',
    tags: ['strip', 'segments', 'info', 'clean'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'seg1',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 80, height: 40 },
        style: { fill: '#1e3a8a', radius: [4, 0, 0, 4] },
        animation: {
          in: { type: 'wipe', duration: 0.4, direction: 'left' },
          hold: { type: 'static' },
          out: { type: 'collapseToLine', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 92, y: 10 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fadeUp', duration: 0.5, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'collapseToLine', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'stripColor',
        label: 'Strip Color',
        type: 'color',
        target: 'colors.primary',
        default: '#1e3a8a',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 1, truncate: true, overflow: 'shrink' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PACK 4: CINEMATIC AND DOCUMENTARY (serif, wide tracking, slow)
// ─────────────────────────────────────────────────────────────────────────────
export const CINEMATIC_DOC_TEMPLATES: LowerThirdTemplate[] = [
  // 1. Thin Line Reveal
  {
    id: 'cine-thin-line-reveal',
    packId: 'cinematic-doc',
    name: 'Thin Line Reveal',
    version: 1,
    category: 'Cinematic & Documentary',
    tags: ['cinematic', 'hairline', 'film', 'minimal'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'topLine',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 'content', height: 1 },
        style: { stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1 },
        animation: {
          in: { type: 'lineDraw', duration: 0.9 },
          hold: { type: 'drift', amplitude: 0.015 },
          out: { type: 'reverse', duration: 0.5 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 12 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.8, delay: 0.2 },
          hold: { type: 'drift', amplitude: 0.015 },
          out: { type: 'fade', duration: 0.5 },
        },
      },
      {
        id: 'bottomLine',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 52, width: 'content', height: 1 },
        style: { stroke: 'rgba(255,255,255,0.4)', strokeWidth: 1 },
        animation: {
          in: { type: 'lineDraw', duration: 0.9, delay: 0.1 },
          hold: { type: 'drift', amplitude: 0.015 },
          out: { type: 'reverse', duration: 0.5 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Playfair Display',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 2. Serif Title
  {
    id: 'cine-serif-title',
    packId: 'cinematic-doc',
    name: 'Serif Title',
    version: 1,
    category: 'Cinematic & Documentary',
    tags: ['serif', 'classic', 'title', 'slow'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 0 },
        style: { fill: '#f8fafc' },
        animation: {
          in: { type: 'fadeUp', duration: 1.1 },
          hold: { type: 'drift', amplitude: 0.01 },
          out: { type: 'fade', duration: 0.6 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 0, y: 44 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fadeUp', duration: 0.8, delay: 0.3 },
          hold: { type: 'drift', amplitude: 0.01 },
          out: { type: 'fade', duration: 0.5 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Playfair Display',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 3. Letterbox Caption
  {
    id: 'cine-letterbox-caption',
    packId: 'cinematic-doc',
    name: 'Letterbox Caption',
    version: 1,
    category: 'Cinematic & Documentary',
    tags: ['letterbox', 'subtle', 'fade', 'documentary'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 0 },
        style: { fill: '#f1f5f9' },
        animation: {
          in: { type: 'fade', duration: 0.9 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.6 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Inter',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 4. Fade Stack
  {
    id: 'cine-fade-stack',
    packId: 'cinematic-doc',
    name: 'Fade Stack',
    version: 1,
    category: 'Cinematic & Documentary',
    tags: ['fade', 'stack', 'staggered', 'slow'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 0 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.7, delay: 0 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.5, delay: 0.2 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 0, y: 38 },
        style: { fill: '#cbd5e1' },
        animation: {
          in: { type: 'fade', duration: 0.7, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.5, delay: 0 },
        },
      },
      {
        id: 'extra',
        type: 'text',
        role: 'extra',
        geometry: { x: 0, y: 72 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fade', duration: 0.7, delay: 0.4 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.5, delay: 0 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Playfair Display',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 5. Corner Frame
  {
    id: 'cine-corner-frame',
    packId: 'cinematic-doc',
    name: 'Corner Frame',
    version: 1,
    category: 'Cinematic & Documentary',
    tags: ['frame', 'corners', 'fine', 'film'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'frameTop',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 30, height: 1 },
        style: { stroke: '#d97706', strokeWidth: 1 },
        animation: {
          in: { type: 'lineDraw', duration: 0.6 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.4 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 8, y: 8 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.6, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.4 },
        },
      },
    ],
    slots: [
      {
        id: 'frameColor',
        label: 'Accent Frame',
        type: 'color',
        target: 'colors.primary',
        default: '#d97706',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 6. Credit Roll
  {
    id: 'cine-credit-roll',
    packId: 'cinematic-doc',
    name: 'Credit Roll',
    version: 1,
    category: 'Cinematic & Documentary',
    tags: ['credit', 'divider', 'film', 'wide'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'divider',
        type: 'line',
        role: 'decor',
        geometry: { x: 180, y: 0, width: 1, height: 44 },
        style: { stroke: '#475569', strokeWidth: 1 },
        animation: {
          in: { type: 'lineDraw', duration: 0.7 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.4 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 0, y: 12 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fade', duration: 0.6, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.4 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 196, y: 12 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.6, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.4 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Inter',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 7. Film Slate
  {
    id: 'cine-film-slate',
    packId: 'cinematic-doc',
    name: 'Film Slate',
    version: 1,
    category: 'Cinematic & Documentary',
    tags: ['slate', 'cinema', 'boxed', 'scene'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'labelBox',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 100, height: 24 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'wipe', duration: 0.4, direction: 'left' },
          hold: { type: 'static' },
          out: { type: 'wipe', duration: 0.3, direction: 'left' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 32 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.6, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'fadeDown', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Oswald',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 8. Place and Date
  {
    id: 'cine-place-and-date',
    packId: 'cinematic-doc',
    name: 'Place and Date',
    version: 1,
    category: 'Cinematic & Documentary',
    tags: ['archive', 'documentary', 'date', 'drift'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'pin',
        type: 'icon',
        role: 'decor',
        content: 'map-pin',
        geometry: { x: 0, y: 2, width: 22, height: 22 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fade', duration: 0.6 },
          hold: { type: 'drift', amplitude: 0.01 },
          out: { type: 'fade', duration: 0.4 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 28, y: 0 },
        style: { fill: '#f8fafc' },
        animation: {
          in: { type: 'fade', duration: 0.9, delay: 0.1 },
          hold: { type: 'drift', amplitude: 0.01 },
          out: { type: 'fade', duration: 0.5 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 0, y: 36 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fade', duration: 0.8, delay: 0.2 },
          hold: { type: 'drift', amplitude: 0.01 },
          out: { type: 'fade', duration: 0.5 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Playfair Display',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PACK 5: GAMING AND TECH (angular, precise, no neon glow)
// ─────────────────────────────────────────────────────────────────────────────
export const GAMING_TECH_TEMPLATES: LowerThirdTemplate[] = [
  // 1. HUD Frame
  {
    id: 'tech-hud-frame',
    packId: 'gaming-tech',
    name: 'HUD Frame',
    version: 1,
    category: 'Gaming & Tech',
    tags: ['hud', 'brackets', 'tech', 'angular'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'cornerTop',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 24, height: 2 },
        style: { stroke: '#06b6d4', strokeWidth: 2 },
        animation: {
          in: { type: 'lineDraw', duration: 0.4 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 8, y: 6 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.3, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'hudColor',
        label: 'HUD Color',
        type: 'color',
        target: 'colors.primary',
        default: '#06b6d4',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 2. Angular Tag
  {
    id: 'tech-angular-tag',
    packId: 'gaming-tech',
    name: 'Angular Tag',
    version: 1,
    category: 'Gaming & Tech',
    tags: ['angular', 'chamfer', 'tech', 'esports'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'box',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: '#0f172a', skew: -12 },
        animation: {
          in: { type: 'wipe', duration: 0.5, direction: 'left' },
          hold: { type: 'static' },
          out: { type: 'wipe', duration: 0.3, direction: 'left' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 10 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Unbounded',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 3. Scanline Reveal
  {
    id: 'tech-scanline-reveal',
    packId: 'gaming-tech',
    name: 'Scanline Reveal',
    version: 1,
    category: 'Gaming & Tech',
    tags: ['scanline', 'sweep', 'tech', 'cyber'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'scanBar',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 2, height: 48 },
        style: { stroke: '#06b6d4', strokeWidth: 2 },
        animation: {
          in: { type: 'shineSweep', duration: 0.6 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 8, y: 4 },
        style: { fill: '#f8fafc' },
        animation: {
          in: { type: 'shineSweep', duration: 0.6, delay: 0.05 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Inter',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 4. Glitch Cut
  {
    id: 'tech-glitch-cut',
    packId: 'gaming-tech',
    name: 'Glitch Cut',
    version: 1,
    category: 'Gaming & Tech',
    tags: ['glitch', 'flicker', 'tech', 'digital'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 0 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'glitchCut', duration: 0.4 },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.25, direction: 'left' },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 0, y: 38 },
        style: { fill: '#f43f5e' },
        animation: {
          in: { type: 'glitchCut', duration: 0.4, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.25, direction: 'left' },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Unbounded',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 5. Stat Bar
  {
    id: 'tech-stat-bar',
    packId: 'gaming-tech',
    name: 'Stat Bar',
    version: 1,
    category: 'Gaming & Tech',
    tags: ['stat', 'progress', 'meter', 'gaming'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 0 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'progressBar',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 36, width: 200, height: 4 },
        style: { fill: '#10b981', stroke: '#10b981', strokeWidth: 4 },
        animation: {
          in: { type: 'lineDraw', duration: 0.7, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'collapseToLine', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'statColor',
        label: 'Meter Color',
        type: 'color',
        target: 'colors.primary',
        default: '#10b981',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 6. Terminal Type
  {
    id: 'tech-terminal-type',
    packId: 'gaming-tech',
    name: 'Terminal Type',
    version: 1,
    category: 'Gaming & Tech',
    tags: ['terminal', 'code', 'typewriter', 'monospace'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 0 },
        style: { fill: '#22c55e' },
        animation: {
          in: { type: 'counterTypewriter', duration: 0.8 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'terminalColor',
        label: 'Terminal Color',
        type: 'color',
        target: 'colors.primary',
        default: '#22c55e',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 1, truncate: true, overflow: 'shrink' },
  },
  // 7. Chamfer Box
  {
    id: 'tech-chamfer-box',
    packId: 'gaming-tech',
    name: 'Chamfer Box',
    version: 1,
    category: 'Gaming & Tech',
    tags: ['chamfer', 'box', 'tech', 'esports'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'box',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: '#1e293b', radius: [8, 0, 8, 0] },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.5 },
          hold: { type: 'static' },
          out: { type: 'slideOut', duration: 0.3, direction: 'left' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 10 },
        style: { fill: '#38bdf8' },
        animation: {
          in: { type: 'fadeUp', duration: 0.4, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'boxFill',
        label: 'Box Color',
        type: 'color',
        target: 'colors.secondary',
        default: '#1e293b',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 8. Level Badge
  {
    id: 'tech-level-badge',
    packId: 'gaming-tech',
    name: 'Level Badge',
    version: 1,
    category: 'Gaming & Tech',
    tags: ['badge', 'level', 'gaming', 'rank'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'badge',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 44, height: 44 },
        style: { fill: '#f59e0b', radius: 4 },
        animation: {
          in: { type: 'scalePop', duration: 0.45, overshoot: 0.08 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 56, y: 10 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'wipe', duration: 0.5, direction: 'left', delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.25 },
        },
      },
    ],
    slots: [
      {
        id: 'badgeColor',
        label: 'Badge Color',
        type: 'color',
        target: 'colors.primary',
        default: '#f59e0b',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PACK 6: INDIC PACK (Telugu, Hindi, Tamil, English)
// All styles use Noto Sans Indic families, word-level animation only, +15% line-height.
// ─────────────────────────────────────────────────────────────────────────────
export const INDIC_PACK_TEMPLATES: LowerThirdTemplate[] = [
  // 1. Native Name Card
  {
    id: 'indic-native-name-card',
    packId: 'indic-pack',
    name: 'Native Name Card',
    version: 1,
    category: 'Indic Pack',
    tags: ['indic', 'telugu', 'hindi', 'tamil', 'native', 'bilingual'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'card',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: 'rgba(24, 24, 27, 0.95)', radius: 6 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.6 },
          hold: { type: 'static' },
          out: { type: 'fadeDown', duration: 0.4 },
        },
      },
      {
        id: 'line',
        type: 'line',
        role: 'decor',
        geometry: { x: 16, y: 44, width: 'content', height: 2 },
        style: { fill: '#eab308', stroke: '#eab308', strokeWidth: 2 },
        animation: {
          in: { type: 'lineDraw', duration: 0.5, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 12 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'wordStagger', duration: 0.6, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 16, y: 52 },
        style: { fill: '#cbd5e1' },
        animation: {
          in: { type: 'wordStagger', duration: 0.5, delay: 0.25 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'goldLine',
        label: 'Accent Line',
        type: 'color',
        target: 'colors.primary',
        default: '#eab308',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 2. Heritage Bar
  {
    id: 'indic-heritage-bar',
    packId: 'indic-pack',
    name: 'Heritage Bar',
    version: 1,
    category: 'Indic Pack',
    tags: ['heritage', 'gold', 'bar', 'cultural'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'goldBar',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: '#451a03', radius: 4, stroke: '#d97706', strokeWidth: 2 },
        animation: {
          in: { type: 'wipe', duration: 0.6, direction: 'left' },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.4 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 10 },
        style: { fill: '#fef3c7' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'barStroke',
        label: 'Gold Accent',
        type: 'color',
        target: 'colors.primary',
        default: '#d97706',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 3. Guest Intro
  {
    id: 'indic-guest-intro',
    packId: 'indic-pack',
    name: 'Guest Intro',
    version: 1,
    category: 'Indic Pack',
    tags: ['guest', 'photo', 'bilingual', 'interview'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'photo',
        type: 'image',
        role: 'photo',
        geometry: { x: 0, y: 0, width: 68, height: 68 },
        style: { fill: '#1f2937', radius: 34, stroke: '#eab308', strokeWidth: 2 },
        animation: {
          in: { type: 'photoReveal', duration: 0.55 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.35 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 80, y: 4 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.5, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.3 },
        },
      },
      {
        id: 'latinName',
        type: 'text',
        role: 'extra',
        geometry: { x: 80, y: 34 },
        style: { fill: '#fbbf24' },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.5, delay: 0.22 },
          hold: { type: 'static' },
          out: { type: 'reverse', duration: 0.3 },
        },
      },
      {
        id: 'role',
        type: 'text',
        role: 'role',
        geometry: { x: 80, y: 58 },
        style: { fill: '#94a3b8' },
        animation: {
          in: { type: 'fadeUp', duration: 0.4, delay: 0.3 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.25 },
        },
      },
    ],
    slots: [
      {
        id: 'ringColor',
        label: 'Ring Accent',
        type: 'color',
        target: 'colors.primary',
        default: '#eab308',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 4. Speaker Card
  {
    id: 'indic-speaker-card',
    packId: 'indic-pack',
    name: 'Speaker Card',
    version: 1,
    category: 'Indic Pack',
    tags: ['speaker', 'mic', 'conference', 'podium'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'micIcon',
        type: 'icon',
        role: 'decor',
        content: 'mic',
        geometry: { x: 0, y: 4, width: 24, height: 24 },
        style: { fill: '#f59e0b' },
        animation: {
          in: { type: 'scalePop', duration: 0.4, overshoot: 0.06 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 32, y: 2 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'wipe', duration: 0.5, direction: 'left', delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'iconColor',
        label: 'Mic Accent',
        type: 'color',
        target: 'colors.primary',
        default: '#f59e0b',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 5. Chapter Title
  {
    id: 'indic-chapter-title',
    packId: 'indic-pack',
    name: 'Chapter Title',
    version: 1,
    category: 'Indic Pack',
    tags: ['chapter', 'title', 'section', 'grand'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'number',
        type: 'text',
        role: 'extra',
        geometry: { x: 0, y: 0 },
        style: { fill: '#d97706' },
        animation: {
          in: { type: 'fade', duration: 0.5 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 32 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.6, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.4 },
        },
      },
    ],
    slots: [
      {
        id: 'numColor',
        label: 'Number Color',
        type: 'color',
        target: 'colors.primary',
        default: '#d97706',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
  // 6. Subtitle Tag
  {
    id: 'indic-subtitle-tag',
    packId: 'indic-pack',
    name: 'Subtitle Tag',
    version: 1,
    category: 'Indic Pack',
    tags: ['subtitle', 'tag', 'compact', 'native'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'tag',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0 },
        style: { fill: 'rgba(15, 23, 42, 0.9)', radius: 4 },
        animation: {
          in: { type: 'wipe', duration: 0.5, direction: 'left' },
          hold: { type: 'static' },
          out: { type: 'wipe', duration: 0.3, direction: 'left' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 14, y: 8 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.1 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.2 },
        },
      },
    ],
    slots: [
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'Noto Sans Telugu',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 1, truncate: true, overflow: 'shrink' },
  },
  // 7. Event Banner
  {
    id: 'indic-event-banner',
    packId: 'indic-pack',
    name: 'Event Banner',
    version: 1,
    category: 'Indic Pack',
    tags: ['event', 'banner', 'festival', 'celebration'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'band',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'full', height: 68 },
        style: { fill: '#78350f' },
        animation: {
          in: { type: 'wipe', duration: 0.6, direction: 'bottom' },
          hold: { type: 'static' },
          out: { type: 'wipe', duration: 0.4, direction: 'bottom' },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 24, y: 20 },
        style: { fill: '#fef3c7' },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.2 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.3 },
        },
      },
    ],
    slots: [
      {
        id: 'bandFill',
        label: 'Band Fill',
        type: 'color',
        target: 'colors.primary',
        default: '#78350f',
      },
    ],
    autoFit: { minScale: 0.6, maxLines: 1, truncate: true, overflow: 'shrink' },
  },
  // 8. Quote in Native Script
  {
    id: 'indic-quote-native',
    packId: 'indic-pack',
    name: 'Quote in Native Script',
    version: 1,
    category: 'Indic Pack',
    tags: ['quote', 'literature', 'poetry', 'native'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'sideBar',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 4, height: 'content' },
        style: { fill: '#f59e0b', stroke: '#f59e0b', strokeWidth: 4 },
        animation: {
          in: { type: 'lineDraw', duration: 0.6 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.4 },
        },
      },
      {
        id: 'name',
        type: 'text',
        role: 'name',
        geometry: { x: 16, y: 4 },
        style: { fill: '#ffffff' },
        animation: {
          in: { type: 'wordStagger', duration: 0.7, delay: 0.15 },
          hold: { type: 'static' },
          out: { type: 'fade', duration: 0.4 },
        },
      },
    ],
    slots: [
      {
        id: 'barColor',
        label: 'Accent Bar',
        type: 'color',
        target: 'colors.primary',
        default: '#f59e0b',
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 3, truncate: true, overflow: 'shrink' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PACK 7: MODERN LOWER THIRDS (contemporary creator, podcast, and broadcast)
// ─────────────────────────────────────────────────────────────────────────────

const MODERN_CANVAS = {
  referenceWidth: 1080,
  referenceHeight: 1920,
  safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
} as const;

const MODERN_COMMON_SLOTS = [
  {
    id: 'primaryColor',
    label: 'Accent Color',
    type: 'color' as const,
    target: 'colors.primary',
    default: '#38BDF8',
  },
  {
    id: 'secondaryColor',
    label: 'Plate Color',
    type: 'color' as const,
    target: 'colors.secondary',
    default: '#18181B',
  },
  {
    id: 'textColor',
    label: 'Name Color',
    type: 'color' as const,
    target: 'colors.textPrimary',
    default: '#FFFFFF',
  },
  {
    id: 'roleColor',
    label: 'Role Color',
    type: 'color' as const,
    target: 'colors.textSecondary',
    default: '#A1A1AA',
  },
  {
    id: 'fontFamily',
    label: 'Font Family',
    type: 'font' as const,
    target: 'font.family',
    default: 'inter',
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

const MODERN_AUTO_FIT = {
  minScale: 0.55,
  maxLines: 2,
  truncate: true,
  overflow: 'shrink' as const,
};

export const MODERN_TEMPLATES: LowerThirdTemplate[] = [
  // 1. Minimal Bar
  {
    id: 'modern-minimal-bar',
    packId: 'modern',
    name: 'Minimal Bar',
    version: 1,
    category: 'Modern',
    tags: ['minimal', 'bar', 'clean', 'podcast', 'documentary'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'accent-bar',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 6, height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', radius: 3, opacity: 1 },
        animation: {
          in: { type: 'lineDraw', duration: 0.55, delay: 0, easing: 'easeOutExpo', direction: 'top' },
          out: { type: 'fade', duration: 0.35, delay: 0.1, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 0.02, y: 0, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.5, delay: 0.1, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.35, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 0.02, y: 0.032, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.45, delay: 0.16, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#38BDF8' },
      { ...MODERN_COMMON_SLOTS[1], default: 'transparent' },
      { ...MODERN_COMMON_SLOTS[2], default: '#FFFFFF' },
      { ...MODERN_COMMON_SLOTS[3], default: '#A1A1AA' },
      { ...MODERN_COMMON_SLOTS[4], default: 'inter' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },

  // 2. Glass Card
  {
    id: 'modern-glass-card',
    packId: 'modern',
    name: 'Glass Card',
    version: 1,
    category: 'Modern',
    tags: ['glass', 'frosted', 'premium', 'creator', 'soft'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'glass-plate',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: {
          fill: 'rgba(24,24,27,0.72)',
          radius: 14,
          opacity: 1,
          shadow: { x: 0, y: 8, blur: 24, color: 'rgba(0,0,0,0.35)' },
        },
        animation: {
          in: { type: 'scalePop', duration: 0.55, delay: 0, easing: 'easeOutBack', overshoot: 0.06 },
          out: { type: 'fade', duration: 0.4, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 0.025, y: 0.012, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.45, delay: 0.12, easing: 'easeOutCubic' },
          out: { type: 'fade', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 0.025, y: 0.042, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.4, delay: 0.18, easing: 'easeOutCubic' },
          out: { type: 'fade', duration: 0.28, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#38BDF8' },
      { ...MODERN_COMMON_SLOTS[1], default: 'rgba(24,24,27,0.72)' },
      { ...MODERN_COMMON_SLOTS[2], default: '#FFFFFF' },
      { ...MODERN_COMMON_SLOTS[3], default: '#A1A1AA' },
      { ...MODERN_COMMON_SLOTS[4], default: 'inter' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },

  // 3. Gradient Pill
  {
    id: 'modern-gradient-pill',
    packId: 'modern',
    name: 'Gradient Pill',
    version: 1,
    category: 'Modern',
    tags: ['pill', 'rounded', 'social', 'reels', 'soft'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'pill-bg',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'content', height: 72, align: 'left', anchor: 'frame' },
        style: { fill: '$colors.secondary', radius: 36, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.6, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: { type: 'wipe', duration: 0.45, delay: 0.08, easing: 'easeOutExpo', direction: 'left' },
        },
      },
      {
        id: 'accent-dot',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0.018, y: 0.018, width: 12, height: 12, align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', radius: 6, opacity: 1 },
        animation: {
          in: { type: 'scalePop', duration: 0.45, delay: 0.15, easing: 'easeOutBack', overshoot: 0.12 },
          out: { type: 'fade', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 0.04, y: 0.008, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.5, delay: 0.12, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.35, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 0.04, y: 0.032, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.45, delay: 0.18, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#22D3EE' },
      { ...MODERN_COMMON_SLOTS[1], default: '#0F172A' },
      { ...MODERN_COMMON_SLOTS[2], default: '#F8FAFC' },
      { ...MODERN_COMMON_SLOTS[3], default: '#94A3B8' },
      { ...MODERN_COMMON_SLOTS[4], default: 'montserrat' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },

  // 4. Side Accent
  {
    id: 'modern-side-accent',
    packId: 'modern',
    name: 'Side Accent',
    version: 1,
    category: 'Modern',
    tags: ['side', 'accent', 'broadcast', 'news', 'bold'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'side-bar',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 10, height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', radius: 0, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.5, delay: 0, easing: 'easeOutExpo', direction: 'top' },
          out: { type: 'wipe', duration: 0.35, delay: 0.1, easing: 'easeOutExpo', direction: 'bottom' },
        },
      },
      {
        id: 'plate',
        type: 'shape',
        role: 'container',
        geometry: { x: 0.012, y: 0, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.secondary', radius: 0, opacity: 0.92 },
        animation: {
          in: { type: 'wipe', duration: 0.55, delay: 0.05, easing: 'easeOutExpo', direction: 'left' },
          out: { type: 'wipe', duration: 0.4, delay: 0, easing: 'easeOutExpo', direction: 'left' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 0.03, y: 0.01, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.45, delay: 0.15, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 0.03, y: 0.038, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.4, delay: 0.2, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.28, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#F59E0B' },
      { ...MODERN_COMMON_SLOTS[1], default: '#111113' },
      { ...MODERN_COMMON_SLOTS[2], default: '#FFFFFF' },
      { ...MODERN_COMMON_SLOTS[3], default: '#FBBF24' },
      { ...MODERN_COMMON_SLOTS[4], default: 'oswald' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },

  // 5. Underline Name
  {
    id: 'modern-underline-name',
    packId: 'modern',
    name: 'Underline Name',
    version: 1,
    category: 'Modern',
    tags: ['underline', 'editorial', 'minimal', 'clean'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 0, y: 0, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.5, delay: 0, easing: 'easeOutCubic' },
          out: { type: 'fade', duration: 0.35, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'underline',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0.038, width: 'content', height: 3, align: 'left', anchor: 'name' },
        style: { fill: '$colors.primary', radius: 1.5, opacity: 1 },
        animation: {
          in: { type: 'lineDraw', duration: 0.55, delay: 0.15, easing: 'easeOutExpo', direction: 'left' },
          out: { type: 'fade', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 0, y: 0.05, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.25, easing: 'easeOutCubic' },
          out: { type: 'fade', duration: 0.28, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#38BDF8' },
      { ...MODERN_COMMON_SLOTS[1], default: 'transparent' },
      { ...MODERN_COMMON_SLOTS[2], default: '#FFFFFF' },
      { ...MODERN_COMMON_SLOTS[3], default: '#A1A1AA' },
      { ...MODERN_COMMON_SLOTS[4], default: 'inter' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },

  // 6. Stacked Cards
  {
    id: 'modern-stacked-cards',
    packId: 'modern',
    name: 'Stacked Cards',
    version: 1,
    category: 'Modern',
    tags: ['stacked', 'layered', 'bold', 'name-tag'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'card-name',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', radius: 6, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.55, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: { type: 'wipe', duration: 0.4, delay: 0.1, easing: 'easeOutExpo', direction: 'left' },
        },
      },
      {
        id: 'card-role',
        type: 'shape',
        role: 'container',
        geometry: { x: 0.012, y: 0.038, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.secondary', radius: 6, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.5, delay: 0.1, easing: 'easeOutExpo', direction: 'left' },
          out: { type: 'wipe', duration: 0.35, delay: 0, easing: 'easeOutExpo', direction: 'left' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 0.02, y: 0.006, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.45, delay: 0.12, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 0.03, y: 0.044, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.4, delay: 0.2, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.28, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#F59E0B' },
      { ...MODERN_COMMON_SLOTS[1], default: '#18181B' },
      { ...MODERN_COMMON_SLOTS[2], default: '#18181B' },
      { ...MODERN_COMMON_SLOTS[3], default: '#E4E4E7' },
      { ...MODERN_COMMON_SLOTS[4], default: 'montserrat' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },

  // 7. Neon Edge
  {
    id: 'modern-neon-edge',
    packId: 'modern',
    name: 'Neon Edge',
    version: 1,
    category: 'Modern',
    tags: ['neon', 'glow', 'gaming', 'night', 'cyber'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'plate',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: {
          fill: 'rgba(10,10,15,0.88)',
          radius: 4,
          opacity: 1,
          shadow: { x: 0, y: 0, blur: 20, color: 'rgba(56,189,248,0.25)' },
        },
        animation: {
          in: { type: 'wipe', duration: 0.55, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: { type: 'wipe', duration: 0.4, delay: 0.08, easing: 'easeOutExpo', direction: 'left' },
        },
      },
      {
        id: 'neon-bar',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 4, height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', radius: 2, opacity: 1 },
        animation: {
          in: { type: 'lineDraw', duration: 0.5, delay: 0.05, easing: 'easeOutExpo', direction: 'top' },
          out: { type: 'fade', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 0.025, y: 0.01, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.45, delay: 0.12, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 0.025, y: 0.04, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.4, delay: 0.18, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.28, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#22D3EE' },
      { ...MODERN_COMMON_SLOTS[1], default: 'rgba(10,10,15,0.88)' },
      { ...MODERN_COMMON_SLOTS[2], default: '#E0F2FE' },
      { ...MODERN_COMMON_SLOTS[3], default: '#67E8F9' },
      { ...MODERN_COMMON_SLOTS[4], default: 'unbounded' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },

  // 8. Creator Handle
  {
    id: 'modern-creator-handle',
    packId: 'modern',
    name: 'Creator Handle',
    version: 1,
    category: 'Modern',
    tags: ['handle', 'creator', 'youtube', 'instagram', 'social'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'plate',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.secondary', radius: 10, opacity: 0.9 },
        animation: {
          in: { type: 'scalePop', duration: 0.5, delay: 0, easing: 'easeOutBack', overshoot: 0.05 },
          out: { type: 'fade', duration: 0.35, delay: 0.05, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 0.022, y: 0.01, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.4, delay: 0.1, easing: 'easeOutCubic' },
          out: { type: 'fade', duration: 0.28, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 0.022, y: 0.038, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.primary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.35, delay: 0.16, easing: 'easeOutCubic' },
          out: { type: 'fade', duration: 0.25, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#A78BFA' },
      { ...MODERN_COMMON_SLOTS[1], default: '#18181B' },
      { ...MODERN_COMMON_SLOTS[2], default: '#FFFFFF' },
      { ...MODERN_COMMON_SLOTS[3], default: '#A78BFA' },
      { ...MODERN_COMMON_SLOTS[4], default: 'inter' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },

  // 9. Broadcast Strip
  {
    id: 'modern-broadcast-strip',
    packId: 'modern',
    name: 'Broadcast Strip',
    version: 1,
    category: 'Modern',
    tags: ['broadcast', 'strip', 'news', 'live', 'wide'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'strip',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'full', height: 56, align: 'left', anchor: 'frame' },
        style: { fill: '$colors.secondary', radius: 0, opacity: 0.95 },
        animation: {
          in: { type: 'wipe', duration: 0.5, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: { type: 'wipe', duration: 0.4, delay: 0.05, easing: 'easeOutExpo', direction: 'right' },
        },
      },
      {
        id: 'accent-left',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 8, height: 56, align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', radius: 0, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.45, delay: 0.05, easing: 'easeOutExpo', direction: 'top' },
          out: { type: 'fade', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 0.03, y: 0.006, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.4, delay: 0.12, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 0.03, y: 0.028, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.35, delay: 0.18, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.28, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#EF4444' },
      { ...MODERN_COMMON_SLOTS[1], default: '#0C0A09' },
      { ...MODERN_COMMON_SLOTS[2], default: '#FFFFFF' },
      { ...MODERN_COMMON_SLOTS[3], default: '#FCA5A5' },
      { ...MODERN_COMMON_SLOTS[4], default: 'oswald' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },

  // 10. Angled Cut
  {
    id: 'modern-angled-cut',
    packId: 'modern',
    name: 'Angled Cut',
    version: 1,
    category: 'Modern',
    tags: ['angled', 'skew', 'geometric', 'kinetic'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'angled-plate',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.secondary', radius: 2, skew: -12, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.55, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: { type: 'slideOut', duration: 0.4, delay: 0.08, easing: 'easeOutExpo', direction: 'left' },
        },
      },
      {
        id: 'accent-strip',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 8, height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', radius: 0, skew: -12, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.5, delay: 0.05, easing: 'easeOutExpo', direction: 'top' },
          out: { type: 'fade', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 0.03, y: 0.008, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 0.45, delay: 0.12, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 0.035, y: 0.038, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 0.4, delay: 0.18, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.28, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#F97316' },
      { ...MODERN_COMMON_SLOTS[1], default: '#1C1917' },
      { ...MODERN_COMMON_SLOTS[2], default: '#FFF7ED' },
      { ...MODERN_COMMON_SLOTS[3], default: '#FDBA74' },
      { ...MODERN_COMMON_SLOTS[4], default: 'oswald' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },

  // 11. Photo Ring
  {
    id: 'modern-photo-ring',
    packId: 'modern',
    name: 'Photo Ring',
    version: 1,
    category: 'Modern',
    tags: ['photo', 'avatar', 'ring', 'creator', 'interview'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'avatar',
        type: 'image',
        role: 'photo',
        geometry: { x: 0, y: 0, width: 72, height: 72, align: 'left', anchor: 'frame' },
        style: {
          fill: '#18181B',
          stroke: '$colors.primary',
          strokeWidth: 3,
          radius: 36,
          opacity: 1,
        },
        animation: {
          in: {
            type: 'photoReveal',
            duration: 0.65,
            delay: 0,
            easing: 'easeOutBack',
            overshoot: 0.08,
          },
          out: { type: 'scalePop', duration: 0.4, delay: 0.1, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 90, y: 0.008, width: 'content', height: 'content', align: 'left', anchor: 'photo' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.5, delay: 0.15, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.35, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 90, y: 0.036, width: 'content', height: 'content', align: 'left', anchor: 'photo' },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.45, delay: 0.22, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#38BDF8' },
      { ...MODERN_COMMON_SLOTS[1], default: 'transparent' },
      { ...MODERN_COMMON_SLOTS[2], default: '#FFFFFF' },
      { ...MODERN_COMMON_SLOTS[3], default: '#94A3B8' },
      { ...MODERN_COMMON_SLOTS[4], default: 'inter' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },

  // 12. Dual Line
  {
    id: 'modern-dual-line',
    packId: 'modern',
    name: 'Dual Line',
    version: 1,
    category: 'Modern',
    tags: ['dual', 'hierarchy', 'clean', 'editorial'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: { ...MODERN_CANVAS },
    elements: [
      {
        id: 'name-plate',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'content', height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', radius: 4, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.5, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: { type: 'wipe', duration: 0.35, delay: 0.1, easing: 'easeOutExpo', direction: 'left' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: { x: 0.018, y: 0.006, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.45, delay: 0.12, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.3, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: { x: 0.005, y: 0.042, width: 'content', height: 'content', align: 'left', anchor: 'name' },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.4, delay: 0.2, easing: 'easeOutCubic' },
          out: { type: 'fade', duration: 0.28, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      { ...MODERN_COMMON_SLOTS[0], default: '#FFFFFF' },
      { ...MODERN_COMMON_SLOTS[1], default: 'transparent' },
      { ...MODERN_COMMON_SLOTS[2], default: '#0A0A0A' },
      { ...MODERN_COMMON_SLOTS[3], default: '#E4E4E7' },
      { ...MODERN_COMMON_SLOTS[4], default: 'montserrat' },
      MODERN_COMMON_SLOTS[5],
    ],
    autoFit: MODERN_AUTO_FIT,
  },
];

export const MODERN_PACK: LowerThirdPack = {
  id: 'modern',
  packId: 'modern',
  name: 'Modern Lower Thirds',
  description:
    '12 contemporary lower-third styles for creators, podcasts, broadcast, and social content.',
  templates: MODERN_TEMPLATES,
};

// ─────────────────────────────────────────────────────────────────────────────
// Complete 7 Packs Definition
// ─────────────────────────────────────────────────────────────────────────────

export const ALL_PACK_TEMPLATES: LowerThirdTemplate[] = [
  ...CLEAN_CORPORATE_TEMPLATES,
  ...CREATOR_REELS_TEMPLATES,
  ...NEWS_BROADCAST_TEMPLATES,
  ...CINEMATIC_DOC_TEMPLATES,
  ...GAMING_TECH_TEMPLATES,
  ...INDIC_PACK_TEMPLATES,
  ...MODERN_TEMPLATES,
];

export const LOWER_THIRD_PACKS: LowerThirdPack[] = [
  {
    id: 'clean-corporate',
    packId: 'clean-corporate',
    name: 'Clean Corporate',
    description: 'Sans, calm, solid colors and executive lower thirds',
    templates: CLEAN_CORPORATE_TEMPLATES,
  },
  {
    id: 'creator-reels',
    packId: 'creator-reels',
    name: 'Creator and Reels',
    description: 'Vertical-video friendly, larger type, vibrant tags and capsules',
    templates: CREATOR_REELS_TEMPLATES,
  },
  {
    id: 'news-broadcast',
    packId: 'news-broadcast',
    name: 'News and Broadcast',
    description: 'Ticker strips, breaking banners, datelines, and anchor cards',
    templates: NEWS_BROADCAST_TEMPLATES,
  },
  {
    id: 'cinematic-doc',
    packId: 'cinematic-doc',
    name: 'Cinematic and Documentary',
    description: 'Serif, wide tracking, subtle slow-pacing, and letterbox styles',
    templates: CINEMATIC_DOC_TEMPLATES,
  },
  {
    id: 'gaming-tech',
    packId: 'gaming-tech',
    name: 'Gaming and Tech',
    description: 'Angular chamfers, HUD frames, scanlines, and terminal lines without neon glare',
    templates: GAMING_TECH_TEMPLATES,
  },
  {
    id: 'indic-pack',
    packId: 'indic-pack',
    name: 'Indic Pack',
    description: 'Telugu, Hindi, Tamil, and English native cards with conjunct-safe word motion',
    templates: INDIC_PACK_TEMPLATES,
  },
  MODERN_PACK,
];

export function getLowerThirdTemplateById(id: string): LowerThirdTemplate | undefined {
  return ALL_PACK_TEMPLATES.find((t) => t.id === id) || CLASSIC_TEMPLATES.find((t) => t.id === id);
}
