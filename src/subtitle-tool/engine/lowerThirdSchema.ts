// ─── Lower Third Template Schema & Validation — Epic Hertz Studio Engine ────
// Complete Zod specification, runtime validation, slot definitions,
// and bidirectional conversion between LowerThirdTemplate and LowerThirdSpec.

import { z } from 'zod';
import type { LowerThirdSpec, LowerThirdVariant } from './spec';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Zod Validation Schemas
// ─────────────────────────────────────────────────────────────────────────────

export const lowerThirdEasingSchema = z
  .enum(['easeOutExpo', 'easeOutCubic', 'easeInOutCubic', 'easeOutBack', 'linear'])
  .default('easeOutCubic');

export const lowerThirdInAnimationSchema = z.object({
  type: z.enum([
    'wipe',
    'lineDraw',
    'maskSlideUp',
    'scalePop',
    'fade',
    'fadeUp',
    'blurIn',
    'letterStagger',
    'wordStagger',
    'photoReveal',
    'shineSweep',
    'counterTypewriter',
    'glitchCut',
  ]),
  duration: z.number().min(0.05).max(3.0).default(0.7),
  delay: z.number().min(0).max(2.0).optional().default(0),
  easing: lowerThirdEasingSchema.optional(),
  direction: z.enum(['left', 'right', 'top', 'bottom']).optional(),
  overshoot: z.number().min(0).max(0.3).optional(), // for scalePop
});

export const lowerThirdHoldAnimationSchema = z
  .object({
    type: z.enum(['static', 'drift', 'accentPulse']).default('static'),
    amplitude: z.number().min(0).max(0.1).optional().default(0.02),
    period: z.number().min(0.5).max(10).optional().default(3.0),
  })
  .optional();

export const lowerThirdOutAnimationSchema = z.object({
  type: z.enum([
    'wipe',
    'lineDraw',
    'slideOut',
    'scalePop',
    'fade',
    'fadeDown',
    'collapseToLine',
    'reverse',
  ]),
  duration: z.number().min(0.05).max(3.0).default(0.6),
  delay: z.number().min(0).max(2.0).optional().default(0),
  easing: lowerThirdEasingSchema.optional(),
  direction: z.enum(['left', 'right', 'top', 'bottom']).optional(),
});

export const lowerThirdAnimationBlockSchema = z.object({
  in: lowerThirdInAnimationSchema,
  hold: lowerThirdHoldAnimationSchema,
  out: lowerThirdOutAnimationSchema,
});

export const lowerThirdGeometrySchema = z.object({
  x: z.number().optional().default(0),
  y: z.number().optional().default(0),
  width: z
    .union([z.number(), z.literal('content'), z.literal('full')])
    .optional()
    .default('content'),
  height: z
    .union([z.number(), z.literal('content'), z.literal('auto')])
    .optional()
    .default('content'),
  align: z.enum(['left', 'center', 'right']).optional().default('left'),
  anchor: z.enum(['frame', 'name', 'photo', 'parent']).optional().default('frame'),
});

export const lowerThirdStyleSchema = z.object({
  fill: z.string().min(1).default('#ffffff'),
  stroke: z.string().optional(),
  strokeWidth: z.number().min(0).max(20).optional(),
  radius: z
    .union([z.number(), z.tuple([z.number(), z.number(), z.number(), z.number()])])
    .optional(),
  opacity: z.number().min(0).max(1).optional(),
  shadow: z
    .object({
      x: z.number().default(0),
      y: z.number().default(0),
      blur: z.number().default(0),
      color: z.string().default('rgba(0,0,0,0.5)'),
    })
    .optional(),
  skew: z.number().min(-45).max(45).optional(), // angle in degrees
});

export const lowerThirdElementSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum(['shape', 'line', 'text', 'image', 'icon', 'mask']),
  role: z.enum(['name', 'role', 'extra', 'handle', 'photo', 'decor', 'container']),
  geometry: lowerThirdGeometrySchema,
  style: lowerThirdStyleSchema,
  animation: lowerThirdAnimationBlockSchema,
  content: z.string().optional(), // template literal or static text/icon name
});

export const lowerThirdSlotSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().min(1).max(100),
  type: z.enum(['color', 'font', 'size', 'text', 'number', 'boolean', 'select']),
  target: z.string().min(1), // dot-path or identifier e.g. "colors.primary"
  default: z.union([z.string(), z.number(), z.boolean()]),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  options: z.array(z.string()).optional(),
});

export const lowerThirdAutoFitSchema = z.object({
  minScale: z.number().min(0.2).max(1.0).default(0.55),
  maxLines: z.number().int().min(1).max(4).default(2),
  truncate: z.boolean().default(true),
  overflow: z.enum(['shrink', 'wrap', 'ellipsis']).default('shrink'),
});

export const lowerThirdTemplateSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_-]+$/i, 'Template ID must be alphanumeric with hyphens/underscores'),
  packId: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  version: z.number().int().min(1).default(1),
  category: z.string().min(1).max(64),
  tags: z.array(z.string().max(40)).default([]),
  author: z.string().max(100).default('Epic Hertz Studio'),
  license: z.string().max(100).default('OFL-1.1 / MIT'),

  canvas: z.object({
    referenceWidth: z.number().int().positive().default(1080),
    referenceHeight: z.number().int().positive().default(1920),
    safeZone: z.object({
      top: z.number().min(0).max(0.5).default(0.05),
      bottom: z.number().min(0).max(0.5).default(0.08),
      left: z.number().min(0).max(0.5).default(0.06),
      right: z.number().min(0).max(0.5).default(0.06),
    }),
  }),

  elements: z.array(lowerThirdElementSchema),
  slots: z.array(lowerThirdSlotSchema),
  autoFit: lowerThirdAutoFitSchema,
});

export const lowerThirdPackSchema = z.object({
  packId: z.string().min(1).max(64),
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  templates: z.array(lowerThirdTemplateSchema),
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. TypeScript Types
// ─────────────────────────────────────────────────────────────────────────────

export type LowerThirdEasing = z.infer<typeof lowerThirdEasingSchema>;
export type LowerThirdInAnimation = z.infer<typeof lowerThirdInAnimationSchema>;
export type LowerThirdHoldAnimation = z.infer<typeof lowerThirdHoldAnimationSchema>;
export type LowerThirdOutAnimation = z.infer<typeof lowerThirdOutAnimationSchema>;
export type LowerThirdAnimationBlock = z.infer<typeof lowerThirdAnimationBlockSchema>;
export type LowerThirdGeometry = z.infer<typeof lowerThirdGeometrySchema>;
export type LowerThirdStyle = z.infer<typeof lowerThirdStyleSchema>;
export type LowerThirdElement = z.infer<typeof lowerThirdElementSchema>;
export type LowerThirdSlot = z.infer<typeof lowerThirdSlotSchema>;
export type LowerThirdAutoFit = z.infer<typeof lowerThirdAutoFitSchema>;
export type LowerThirdTemplate = z.infer<typeof lowerThirdTemplateSchema>;
export type LowerThirdPack = z.infer<typeof lowerThirdPackSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// 3. Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function validateLowerThirdTemplate(raw: unknown): LowerThirdTemplate {
  return lowerThirdTemplateSchema.parse(raw);
}

export function validateLowerThirdPack(raw: unknown): LowerThirdPack {
  // Max size guard: 2 MB and 100 templates cap
  const jsonStr = JSON.stringify(raw);
  if (jsonStr.length > 2 * 1024 * 1024) {
    throw new Error('Template pack exceeds maximum allowed size of 2 MB');
  }

  // Prototype pollution defense
  if (
    jsonStr.includes('__proto__') ||
    jsonStr.includes('constructor') ||
    jsonStr.includes('prototype')
  ) {
    const parsed = JSON.parse(jsonStr);
    if ('__proto__' in parsed || 'prototype' in parsed) {
      throw new Error('Malformed template pack: prototype pollution attempt detected');
    }
  }

  const pack = lowerThirdPackSchema.parse(raw);
  if (pack.templates.length > 100) {
    throw new Error('Template pack exceeds limit of 100 templates');
  }
  return pack;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Classic Pack Definitions (Variants 1 to 8)
// ─────────────────────────────────────────────────────────────────────────────

export const CLASSIC_VARIANT_MAP: Record<LowerThirdVariant, string> = {
  1: 'classic-box-highlight',
  2: 'classic-clean-underline',
  3: 'classic-photo-creator',
  4: 'classic-vertical-divider',
  5: 'classic-slanted-ribbon',
  6: 'classic-framed-tech',
  7: 'classic-dual-tone-pill',
  8: 'classic-cinematic-glass',
};

export const TEMPLATE_TO_VARIANT_MAP: Record<string, LowerThirdVariant> = {
  'classic-box-highlight': 1,
  'classic-clean-underline': 2,
  'classic-photo-creator': 3,
  'classic-vertical-divider': 4,
  'classic-slanted-ribbon': 5,
  'classic-framed-tech': 6,
  'classic-dual-tone-pill': 7,
  'classic-cinematic-glass': 8,
};

export function variantToTemplateId(v: LowerThirdVariant): string {
  return CLASSIC_VARIANT_MAP[v] || 'classic-box-highlight';
}

export function templateIdToVariant(id: string): LowerThirdVariant {
  return TEMPLATE_TO_VARIANT_MAP[id] || 1;
}

/**
 * The 8 baseline Classic pack templates matching existing Variants 1 to 8.
 */
export const CLASSIC_TEMPLATES: LowerThirdTemplate[] = [
  // 1. Box Highlight
  {
    id: 'classic-box-highlight',
    packId: 'classic',
    name: 'Box Highlight',
    version: 1,
    category: 'Classic',
    tags: ['box', 'accent', 'name-tag', 'broadcast'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'box-name',
        type: 'shape',
        role: 'container',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'frame',
        },
        style: { fill: '$colors.primary', radius: 4, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.7, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: {
            type: 'wipe',
            duration: 0.6,
            delay: 0.1,
            easing: 'easeOutExpo',
            direction: 'left',
          },
        },
      },
      {
        id: 'box-role',
        type: 'shape',
        role: 'container',
        geometry: {
          x: 0,
          y: 0.03,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'frame',
        },
        style: { fill: '$colors.secondary', radius: 4, opacity: 1 },
        animation: {
          in: {
            type: 'wipe',
            duration: 0.65,
            delay: 0.07,
            easing: 'easeOutExpo',
            direction: 'left',
          },
          out: { type: 'wipe', duration: 0.55, delay: 0, easing: 'easeOutExpo', direction: 'left' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0.01,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.55, delay: 0.14, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0.01,
          y: 0.03,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.55, delay: 0.18, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      {
        id: 'primaryColor',
        label: 'Accent Color',
        type: 'color',
        target: 'colors.primary',
        default: '#f59e0b',
      },
      {
        id: 'secondaryColor',
        label: 'Plate Color',
        type: 'color',
        target: 'colors.secondary',
        default: '#18181b',
      },
      {
        id: 'textColor',
        label: 'Name Color',
        type: 'color',
        target: 'colors.textPrimary',
        default: '#ffffff',
      },
      {
        id: 'roleColor',
        label: 'Role Color',
        type: 'color',
        target: 'colors.textSecondary',
        default: '#e4e4e7',
      },
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'unbounded',
      },
      {
        id: 'scale',
        label: 'Scale',
        type: 'number',
        target: 'scale',
        default: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.05,
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },

  // 2. Clean Underline
  {
    id: 'classic-clean-underline',
    packId: 'classic',
    name: 'Clean Underline',
    version: 1,
    category: 'Classic',
    tags: ['underline', 'minimal', 'modern', 'clean'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'underline-bar',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 'content', height: 4, align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', opacity: 1 },
        animation: {
          in: {
            type: 'lineDraw',
            duration: 0.7,
            delay: 0,
            easing: 'easeOutExpo',
            direction: 'left',
          },
          out: {
            type: 'lineDraw',
            duration: 0.5,
            delay: 0.1,
            easing: 'easeOutExpo',
            direction: 'left',
          },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0,
          y: -0.02,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.6, delay: 0.1, easing: 'easeOutCubic' },
          out: { type: 'fadeDown', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0,
          y: 0.02,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.55, delay: 0.2, easing: 'easeOutCubic' },
          out: { type: 'fadeDown', duration: 0.4, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      {
        id: 'primaryColor',
        label: 'Line Color',
        type: 'color',
        target: 'colors.primary',
        default: '#f59e0b',
      },
      {
        id: 'textColor',
        label: 'Name Color',
        type: 'color',
        target: 'colors.textPrimary',
        default: '#ffffff',
      },
      {
        id: 'roleColor',
        label: 'Role Color',
        type: 'color',
        target: 'colors.textSecondary',
        default: '#cbd5e1',
      },
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'albert-sans',
      },
      {
        id: 'scale',
        label: 'Scale',
        type: 'number',
        target: 'scale',
        default: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.05,
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },

  // 3. Photo Creator
  {
    id: 'classic-photo-creator',
    packId: 'classic',
    name: 'Photo Creator',
    version: 1,
    category: 'Classic',
    tags: ['photo', 'avatar', 'creator', 'reels'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'avatar-photo',
        type: 'image',
        role: 'photo',
        geometry: { x: 0, y: 0, width: 80, height: 80, align: 'left', anchor: 'frame' },
        style: {
          fill: '#18181b',
          stroke: '$colors.primary',
          strokeWidth: 3,
          radius: 40,
          opacity: 1,
        },
        animation: {
          in: {
            type: 'photoReveal',
            duration: 0.7,
            delay: 0,
            easing: 'easeOutBack',
            overshoot: 0.08,
          },
          out: { type: 'scalePop', duration: 0.45, delay: 0.15, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'pill-container',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'content', height: 80, align: 'left', anchor: 'frame' },
        style: { fill: '$colors.secondary', radius: 40, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.7, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: {
            type: 'wipe',
            duration: 0.5,
            delay: 0.1,
            easing: 'easeOutExpo',
            direction: 'left',
          },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: {
          x: 96,
          y: 0.01,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'photo',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.55, delay: 0.15, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: {
          x: 96,
          y: 0.04,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'photo',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.55, delay: 0.2, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      {
        id: 'primaryColor',
        label: 'Avatar Ring',
        type: 'color',
        target: 'colors.primary',
        default: '#f59e0b',
      },
      {
        id: 'secondaryColor',
        label: 'Card Color',
        type: 'color',
        target: 'colors.secondary',
        default: '#121216',
      },
      {
        id: 'textColor',
        label: 'Name Color',
        type: 'color',
        target: 'colors.textPrimary',
        default: '#ffffff',
      },
      {
        id: 'roleColor',
        label: 'Role Color',
        type: 'color',
        target: 'colors.textSecondary',
        default: '#f59e0b',
      },
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'inter',
      },
      {
        id: 'scale',
        label: 'Scale',
        type: 'number',
        target: 'scale',
        default: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.05,
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },

  // 4. Vertical Divider
  {
    id: 'classic-vertical-divider',
    packId: 'classic',
    name: 'Vertical Divider',
    version: 1,
    category: 'Classic',
    tags: ['divider', 'editorial', 'broadcast', 'split'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'divider-bar',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 5, height: 'content', align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', radius: 2.5, opacity: 1 },
        animation: {
          in: {
            type: 'lineDraw',
            duration: 0.7,
            delay: 0,
            easing: 'easeOutExpo',
            direction: 'top',
          },
          out: {
            type: 'collapseToLine',
            duration: 0.5,
            delay: 0.1,
            easing: 'easeOutExpo',
            direction: 'top',
          },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0.02,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.55, delay: 0.1, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0.02,
          y: 0.03,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.55, delay: 0.16, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      {
        id: 'primaryColor',
        label: 'Bar Color',
        type: 'color',
        target: 'colors.primary',
        default: '#f59e0b',
      },
      {
        id: 'textColor',
        label: 'Name Color',
        type: 'color',
        target: 'colors.textPrimary',
        default: '#ffffff',
      },
      {
        id: 'roleColor',
        label: 'Role Color',
        type: 'color',
        target: 'colors.textSecondary',
        default: '#cbd5e1',
      },
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'montserrat',
      },
      {
        id: 'scale',
        label: 'Scale',
        type: 'number',
        target: 'scale',
        default: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.05,
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },

  // 5. Slanted Ribbon
  {
    id: 'classic-slanted-ribbon',
    packId: 'classic',
    name: 'Slanted Ribbon',
    version: 1,
    category: 'Classic',
    tags: ['slanted', 'ribbon', 'diagonal', 'kinetic'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'ribbon-name',
        type: 'shape',
        role: 'container',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'frame',
        },
        style: { fill: '$colors.primary', radius: 3, skew: -14, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.7, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: {
            type: 'slideOut',
            duration: 0.5,
            delay: 0.1,
            easing: 'easeOutExpo',
            direction: 'left',
          },
        },
      },
      {
        id: 'ribbon-role',
        type: 'shape',
        role: 'container',
        geometry: {
          x: 0.02,
          y: 0.035,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'frame',
        },
        style: { fill: '$colors.secondary', radius: 3, skew: -14, opacity: 1 },
        animation: {
          in: {
            type: 'wipe',
            duration: 0.65,
            delay: 0.08,
            easing: 'easeOutExpo',
            direction: 'left',
          },
          out: {
            type: 'slideOut',
            duration: 0.5,
            delay: 0,
            easing: 'easeOutExpo',
            direction: 'left',
          },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0.02,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 0.55, delay: 0.1, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0.03,
          y: 0.035,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fade', duration: 0.55, delay: 0.15, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      {
        id: 'primaryColor',
        label: 'Primary Ribbon',
        type: 'color',
        target: 'colors.primary',
        default: '#f59e0b',
      },
      {
        id: 'secondaryColor',
        label: 'Secondary Ribbon',
        type: 'color',
        target: 'colors.secondary',
        default: '#18181b',
      },
      {
        id: 'textColor',
        label: 'Name Color',
        type: 'color',
        target: 'colors.textPrimary',
        default: '#000000',
      },
      {
        id: 'roleColor',
        label: 'Role Color',
        type: 'color',
        target: 'colors.textSecondary',
        default: '#ffffff',
      },
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'oswald',
      },
      {
        id: 'scale',
        label: 'Scale',
        type: 'number',
        target: 'scale',
        default: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.05,
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },

  // 6. Framed Tech
  {
    id: 'classic-framed-tech',
    packId: 'classic',
    name: 'Framed Tech',
    version: 1,
    category: 'Classic',
    tags: ['wireframe', 'tech', 'brackets', 'documentary'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'tech-frame',
        type: 'shape',
        role: 'container',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'frame',
        },
        style: { fill: 'rgba(12,12,14,0.85)', radius: 0, opacity: 1 },
        animation: {
          in: { type: 'wipe', duration: 0.7, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: {
            type: 'wipe',
            duration: 0.5,
            delay: 0.1,
            easing: 'easeOutExpo',
            direction: 'left',
          },
        },
      },
      {
        id: 'corner-brackets',
        type: 'line',
        role: 'decor',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'frame',
        },
        style: { stroke: '$colors.primary', strokeWidth: 2.5, fill: 'transparent', opacity: 1 },
        animation: {
          in: { type: 'lineDraw', duration: 0.6, delay: 0.1, easing: 'easeOutCubic' },
          out: { type: 'lineDraw', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0.015,
          y: 0.01,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.55, delay: 0.12, easing: 'easeOutCubic' },
          out: { type: 'fadeDown', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0.015,
          y: 0.035,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'fadeUp', duration: 0.55, delay: 0.18, easing: 'easeOutCubic' },
          out: { type: 'fadeDown', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      {
        id: 'primaryColor',
        label: 'Bracket Color',
        type: 'color',
        target: 'colors.primary',
        default: '#f59e0b',
      },
      {
        id: 'textColor',
        label: 'Name Color',
        type: 'color',
        target: 'colors.textPrimary',
        default: '#ffffff',
      },
      {
        id: 'roleColor',
        label: 'Role Color',
        type: 'color',
        target: 'colors.textSecondary',
        default: '#f59e0b',
      },
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'albert-sans',
      },
      {
        id: 'scale',
        label: 'Scale',
        type: 'number',
        target: 'scale',
        default: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.05,
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },

  // 7. Dual-Tone Pill
  {
    id: 'classic-dual-tone-pill',
    packId: 'classic',
    name: 'Dual-Tone Pill',
    version: 1,
    category: 'Classic',
    tags: ['pill', 'capsule', 'monogram', 'badge'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'capsule-body',
        type: 'shape',
        role: 'container',
        geometry: { x: 0, y: 0, width: 'content', height: 48, align: 'left', anchor: 'frame' },
        style: {
          fill: '$colors.secondary',
          radius: 24,
          stroke: 'rgba(255,255,255,0.15)',
          strokeWidth: 1,
          opacity: 1,
        },
        animation: {
          in: { type: 'wipe', duration: 0.7, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: {
            type: 'wipe',
            duration: 0.5,
            delay: 0.1,
            easing: 'easeOutExpo',
            direction: 'left',
          },
        },
      },
      {
        id: 'badge-circle',
        type: 'shape',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 36, height: 36, align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', radius: 18, opacity: 1 },
        animation: {
          in: {
            type: 'scalePop',
            duration: 0.5,
            delay: 0.08,
            easing: 'easeOutBack',
            overshoot: 0.06,
          },
          out: { type: 'scalePop', duration: 0.4, delay: 0.15, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0.04,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.55, delay: 0.12, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0.05,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.55, delay: 0.16, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      {
        id: 'primaryColor',
        label: 'Badge Color',
        type: 'color',
        target: 'colors.primary',
        default: '#f59e0b',
      },
      {
        id: 'secondaryColor',
        label: 'Pill Color',
        type: 'color',
        target: 'colors.secondary',
        default: '#141418',
      },
      {
        id: 'textColor',
        label: 'Name Color',
        type: 'color',
        target: 'colors.textPrimary',
        default: '#ffffff',
      },
      {
        id: 'roleColor',
        label: 'Role Color',
        type: 'color',
        target: 'colors.textSecondary',
        default: '#f59e0b',
      },
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'poppins',
      },
      {
        id: 'scale',
        label: 'Scale',
        type: 'number',
        target: 'scale',
        default: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.05,
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },

  // 8. Cinematic Glass
  {
    id: 'classic-cinematic-glass',
    packId: 'classic',
    name: 'Cinematic Glass',
    version: 1,
    category: 'Classic',
    tags: ['glass', 'frosted', 'translucent', 'cinematic'],
    author: 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    canvas: {
      referenceWidth: 1080,
      referenceHeight: 1920,
      safeZone: { top: 0.05, bottom: 0.08, left: 0.06, right: 0.06 },
    },
    elements: [
      {
        id: 'glass-card',
        type: 'shape',
        role: 'container',
        geometry: {
          x: 0,
          y: 0,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'frame',
        },
        style: {
          fill: '$colors.secondary',
          radius: 8,
          stroke: 'rgba(255,255,255,0.14)',
          strokeWidth: 1,
          opacity: 1,
        },
        animation: {
          in: { type: 'wipe', duration: 0.7, delay: 0, easing: 'easeOutExpo', direction: 'left' },
          out: {
            type: 'wipe',
            duration: 0.5,
            delay: 0.1,
            easing: 'easeOutExpo',
            direction: 'left',
          },
        },
      },
      {
        id: 'top-accent-sweep',
        type: 'line',
        role: 'decor',
        geometry: { x: 0, y: 0, width: 'content', height: 3, align: 'left', anchor: 'frame' },
        style: { fill: '$colors.primary', radius: [8, 8, 0, 0], opacity: 1 },
        animation: {
          in: {
            type: 'shineSweep',
            duration: 0.7,
            delay: 0.05,
            easing: 'easeOutExpo',
            direction: 'left',
          },
          out: {
            type: 'lineDraw',
            duration: 0.45,
            delay: 0,
            easing: 'easeOutExpo',
            direction: 'left',
          },
        },
      },
      {
        id: 'text-name',
        type: 'text',
        role: 'name',
        geometry: {
          x: 0.015,
          y: 0.01,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textPrimary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.55, delay: 0.12, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
      {
        id: 'text-role',
        type: 'text',
        role: 'role',
        geometry: {
          x: 0.015,
          y: 0.035,
          width: 'content',
          height: 'content',
          align: 'left',
          anchor: 'name',
        },
        style: { fill: '$colors.textSecondary', opacity: 1 },
        animation: {
          in: { type: 'maskSlideUp', duration: 0.55, delay: 0.16, easing: 'easeOutCubic' },
          out: { type: 'slideOut', duration: 0.45, delay: 0, easing: 'easeOutCubic' },
        },
      },
    ],
    slots: [
      {
        id: 'primaryColor',
        label: 'Top Accent',
        type: 'color',
        target: 'colors.primary',
        default: '#f59e0b',
      },
      {
        id: 'secondaryColor',
        label: 'Glass Tint',
        type: 'color',
        target: 'colors.secondary',
        default: '#0f0f12',
      },
      {
        id: 'textColor',
        label: 'Name Color',
        type: 'color',
        target: 'colors.textPrimary',
        default: '#ffffff',
      },
      {
        id: 'roleColor',
        label: 'Role Color',
        type: 'color',
        target: 'colors.textSecondary',
        default: '#cbd5e1',
      },
      {
        id: 'fontFamily',
        label: 'Font Family',
        type: 'font',
        target: 'font.family',
        default: 'playfair-display',
      },
      {
        id: 'scale',
        label: 'Scale',
        type: 'number',
        target: 'scale',
        default: 1.0,
        min: 0.5,
        max: 2.0,
        step: 0.05,
      },
    ],
    autoFit: { minScale: 0.55, maxLines: 2, truncate: true, overflow: 'shrink' },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 5. Migration Helper: Spec ↔ Template
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes any legacy or versioned LowerThirdSpec into a valid instance,
 * mapping `variant` (1..8) to `templateId` and vice versa.
 */
export function normalizeLowerThirdSpec(raw: unknown): LowerThirdSpec {
  const item = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const variantNum =
    typeof item.variant === 'number' && item.variant >= 1 && item.variant <= 8
      ? (item.variant as LowerThirdVariant)
      : undefined;

  let templateId =
    typeof item.templateId === 'string' && item.templateId.length > 0 ? item.templateId : undefined;

  if (!templateId && variantNum) {
    templateId = variantToTemplateId(variantNum);
  } else if (!templateId) {
    templateId = 'classic-box-highlight';
  }

  const effectiveVariant = variantNum ?? templateIdToVariant(templateId);

  return {
    id: typeof item.id === 'string' && item.id.length > 0 ? item.id : `lt-${Date.now()}`,
    templateId,
    variant: effectiveVariant,
    name: typeof item.name === 'string' ? item.name : 'NAME',
    role: typeof item.role === 'string' ? item.role : 'ROLE',
    extra: typeof item.extra === 'string' ? item.extra : undefined,
    handle: typeof item.handle === 'string' ? item.handle : undefined,
    photoBlobId: typeof item.photoBlobId === 'string' ? item.photoBlobId : undefined,
    photoUrl: typeof item.photoUrl === 'string' ? item.photoUrl : undefined,
    start: typeof item.start === 'number' && Number.isFinite(item.start) ? item.start : 0,
    end: typeof item.end === 'number' && Number.isFinite(item.end) ? item.end : 4,
    position:
      item.position && typeof item.position === 'object'
        ? {
            x: Number((item.position as any).x) || 0.08,
            y: Number((item.position as any).y) || 0.82,
            align:
              (item.position as any).align === 'right'
                ? 'right'
                : (item.position as any).align === 'center'
                  ? 'center'
                  : 'left',
          }
        : { x: 0.08, y: 0.82, align: 'left' },
    colors:
      item.colors && typeof item.colors === 'object'
        ? {
            primary: String((item.colors as any).primary || '#f59e0b'),
            secondary: (item.colors as any).secondary
              ? String((item.colors as any).secondary)
              : undefined,
            textPrimary: String((item.colors as any).textPrimary || '#ffffff'),
            textSecondary: String((item.colors as any).textSecondary || '#e4e4e7'),
          }
        : {
            primary: '#f59e0b',
            secondary: '#18181b',
            textPrimary: '#ffffff',
            textSecondary: '#e4e4e7',
          },
    font:
      item.font && typeof item.font === 'object'
        ? {
            family: String((item.font as any).family || 'unbounded'),
            size: Number((item.font as any).size) || 0.035,
            weight: Number((item.font as any).weight) || 800,
          }
        : { family: 'unbounded', size: 0.035, weight: 800 },
    scale: typeof item.scale === 'number' && Number.isFinite(item.scale) ? item.scale : 1.0,
    introDuration: typeof item.introDuration === 'number' ? item.introDuration : 0.7,
    outroDuration: typeof item.outroDuration === 'number' ? item.outroDuration : 0.6,
    slotOverrides:
      item.slotOverrides && typeof item.slotOverrides === 'object'
        ? (item.slotOverrides as Record<string, unknown>)
        : undefined,
  };
}
