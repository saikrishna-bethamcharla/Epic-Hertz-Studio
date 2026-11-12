// ─── Caption Template Schema & Validation — Epic Hertz Studio Engine ─────────
// Complete Zod specification, runtime validation, and bidirectional migration
// between CaptionTemplate and CaptionStyle.

import { z } from 'zod';
import type { CaptionStyle, Paint } from './spec';
import type { EntranceType, EmphasisType, ExitType } from './animation';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Zod Validation Schema
// ─────────────────────────────────────────────────────────────────────────────

export const captionTemplateSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9_-]+$/i, 'Template ID must be alphanumeric'),
  name: z.string().min(1).max(100),
  version: z.number().int().min(1).default(1),
  category: z.string().min(1).max(50),
  description: z.string().max(300).optional(),
  tags: z.array(z.string().max(40)).default([]),
  author: z.string().max(100).optional().default('Epic Hertz Studio'),
  license: z.string().max(100).optional().default('OFL-1.1 / MIT'),

  font: z.object({
    family: z.string().min(1).max(50),
    weight: z.number().int().min(100).max(1000).default(700),
    size: z.number().min(0.02).max(0.3).default(0.08),
    case: z.enum(['none', 'upper', 'lower', 'title']).default('none'),
    letterSpacing: z.number().min(-0.2).max(1.0).default(0),
    lineHeight: z.number().min(0.8).max(3.0).default(1.15),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    fallbacks: z
      .object({
        telugu: z.string().optional(),
        devanagari: z.string().optional(),
        tamil: z.string().optional(),
        kannada: z.string().optional(),
        malayalam: z.string().optional(),
        bengali: z.string().optional(),
      })
      .optional()
      .default({
        telugu: 'Noto Sans Telugu',
        devanagari: 'Noto Sans Devanagari',
        tamil: 'Noto Sans Tamil',
      }),
  }),

  colors: z.object({
    text: z.string().min(1).max(60),
    activeWord: z.string().min(1).max(60),
    activeText: z.string().max(60).optional(),
    /** Optional per-word accent palette; cycles by word index for multi-colour emphasis. */
    activeWordCycle: z.array(z.string().min(1).max(60)).max(8).optional(),
    /** Draw the spoken word in italic for editorial emphasis. */
    activeItalic: z.boolean().optional(),
    outline: z.string().min(1).max(60).default('#000000'),
    outlineWidth: z.number().min(0).max(0.4).default(0),
    shadow: z
      .object({
        x: z.number().min(-0.5).max(0.5).default(0),
        y: z.number().min(-0.5).max(0.5).default(0),
        blur: z.number().min(0).max(0.5).default(0),
        color: z.string().default('rgba(0,0,0,0.5)'),
      })
      .optional(),
    glow: z
      .object({
        color: z.string().default('#FFFFFF'),
        blur: z.number().min(0).max(1).default(0),
        strength: z.number().min(0).max(10).default(0),
      })
      .optional(),
    extrude: z
      .object({
        depth: z.number().min(0).max(0.4).default(0),
        color: z.string().default('#000000'),
        angle: z.number().min(0).max(360).default(90),
      })
      .optional(),
    gradient: z
      .object({
        angle: z.number().min(0).max(360),
        stops: z.array(z.tuple([z.number().min(0).max(1), z.string()])),
      })
      .nullable()
      .optional(),
  }),

  container: z.object({
    mode: z.enum(['none', 'box', 'pill', 'underline', 'bar']).default('none'),
    color: z.string().default('rgba(0,0,0,0.6)'),
    padX: z.number().min(0).max(1).default(0.35),
    padY: z.number().min(0).max(1).default(0.12),
    radius: z.number().min(0).max(1).default(0.25),
  }),

  layout: z.object({
    align: z.enum(['left', 'center', 'right']).default('center'),
    wordsPerPage: z.number().int().min(0).max(50).default(3),
    maxLines: z.number().int().min(1).max(10).default(2),
    widthPct: z.number().min(0.2).max(1.0).default(0.88),
    x: z.number().min(0).max(1).default(0.5),
    y: z.number().min(0).max(1).default(0.74),
    lineBreakRule: z.enum(['auto', 'strict']).optional(),
  }),

  entrance: z.object({
    type: z
      .enum([
        'fade',
        'slide-up',
        'slide-left',
        'slide-right',
        'scale-pop',
        'rotate-in',
        'blur-in',
        'typewriter',
        'bounce-in',
        'wave',
        'flip-in',
        'drop-in',
        'clip-reveal',
        'elastic-pop',
        'rack-focus',
        'tracking-in',
      ])
      .default('scale-pop'),
    duration: z.number().min(0.01).max(2.0).default(0.28), // seconds
    easing: z
      .enum([
        'linear',
        'easeOutQuad',
        'easeOutCubic',
        'easeInOutCubic',
        'easeOutExpo',
        'easeOutBack',
        'easeOutElastic',
        'easeOutBounce',
        'spring',
      ])
      .default('spring'),
    params: z.record(z.string(), z.any()).optional().default({}),
  }),

  emphasis: z.object({
    type: z
      .enum([
        'pop',
        'shake',
        'glow-pulse',
        'underline-draw',
        'highlight-box-sweep',
        'color-flip',
        'scale-slam',
        'wobble',
        'hop',
      ])
      .default('color-flip'),
    duration: z.number().min(0.01).max(2.0).default(0.12), // seconds
    easing: z
      .enum([
        'linear',
        'easeOutQuad',
        'easeOutCubic',
        'easeInOutCubic',
        'easeOutExpo',
        'easeOutBack',
        'easeOutElastic',
        'easeOutBounce',
        'spring',
      ])
      .optional()
      .default('spring'),
    params: z.record(z.string(), z.any()).optional().default({}),
  }),

  exit: z.object({
    type: z
      .enum([
        'fade',
        'slide-down',
        'slide-up',
        'slide-left',
        'slide-right',
        'scale-out',
        'blur-out',
        'clip-hide',
        'typewriter-erase',
        'drop-out',
        'glitch-out',
      ])
      .default('fade'),
    duration: z.number().min(0.01).max(2.0).default(0.15), // seconds
    easing: z
      .enum([
        'linear',
        'easeOutQuad',
        'easeOutCubic',
        'easeInOutCubic',
        'easeOutExpo',
        'easeOutBack',
        'easeOutElastic',
        'easeOutBounce',
        'spring',
      ])
      .optional()
      .default('easeOutCubic'),
    params: z.record(z.string(), z.any()).optional().default({}),
  }),

  stagger: z.object({
    unit: z.enum(['word', 'letter', 'line']).default('word'),
    delay: z.number().min(0).max(0.5).default(0.045), // seconds
  }),

  /** Fixed typography roles: consecutive words get their own font, size and colour. */
  roles: z
    .array(
      z.object({
        words: z.number().int().min(1).max(12).default(1),
        scale: z.number().min(0.2).max(3.0).optional(),
        family: z.string().min(1).max(50).optional(),
        weight: z.number().int().min(100).max(1000).optional(),
        italic: z.boolean().optional(),
        case: z.enum(['none', 'upper', 'lower', 'title']).optional(),
        fill: z.string().min(1).max(60).optional(),
        gradient: z
          .object({
            angle: z.number().min(0).max(360),
            stops: z.array(z.tuple([z.number().min(0).max(1), z.string()])),
          })
          .nullable()
          .optional(),
        stroke: z
          .object({
            width: z.number().min(0).max(0.4).optional(),
            color: z.string().max(60).optional(),
          })
          .optional(),
        glow: z
          .object({
            color: z.string().max(60).optional(),
            blur: z.number().min(0).max(1).optional(),
            strength: z.number().min(0).max(10).optional(),
          })
          .optional(),
        shadow: z
          .object({
            x: z.number().min(-0.5).max(0.5).optional(),
            y: z.number().min(-0.5).max(0.5).optional(),
            blur: z.number().min(0).max(0.5).optional(),
            color: z.string().max(60).optional(),
          })
          .optional(),
        gap: z.number().min(0).max(1).optional(),
      }),
    )
    .max(8)
    .optional(),

  emphasisTrigger: z.enum(['activeWord', 'keyword', 'always']).default('activeWord'),
  syncOffset: z.number().min(-1.0).max(1.0).optional(),
});

export type CaptionTemplate = z.infer<typeof captionTemplateSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// 2. Validation & Pack Parser
// ─────────────────────────────────────────────────────────────────────────────

export function validateCaptionTemplate(
  raw: unknown,
): { success: true; data: CaptionTemplate } | { success: false; errors: string[] } {
  const result = captionTemplateSchema.safeParse(raw);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const issues = (result.error as any).issues || (result.error as any).errors || [];
  const errors = issues.map((e: any) => `${e.path?.join('.') || 'root'}: ${e.message}`);
  return { success: false, errors };
}

export function validateTemplatePack(
  raw: unknown,
): { success: true; data: CaptionTemplate[] } | { success: false; errors: string[] } {
  if (!raw || typeof raw !== 'object') {
    return { success: false, errors: ['Invalid pack: expected a JSON object or array'] };
  }
  const items = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any).templates)
      ? (raw as any).templates
      : null;

  if (!items) {
    return { success: false, errors: ['Pack does not contain a list of templates'] };
  }

  const validated: CaptionTemplate[] = [];
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    const res = validateCaptionTemplate(items[i]);
    if (res.success) {
      validated.push(res.data);
    } else {
      errors.push(
        `Template #${i + 1} (${items[i]?.name || items[i]?.id || 'untitled'}): ${res.errors.join(', ')}`,
      );
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: validated };
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Bidirectional Migration: CaptionTemplate <-> CaptionStyle
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compiles a data-driven CaptionTemplate into a renderable CaptionStyle.
 */
export function templateToStyle(t: CaptionTemplate): CaptionStyle {
  // Map highlight mode
  let hlMode: CaptionStyle['highlight']['mode'];
  switch (t.emphasis.type) {
    case 'pop':
    case 'scale-slam':
    case 'color-flip':
      hlMode = 'color';
      break;
    case 'highlight-box-sweep':
      hlMode = 'box';
      break;
    case 'underline-draw':
      hlMode = 'underline';
      break;
    case 'glow-pulse':
      hlMode = 'color';
      break;
    default:
      hlMode = 'color';
      break;
  }

  // Map plate mode
  let plateMode: CaptionStyle['plate']['mode'] = 'none';
  if (t.container.mode === 'box') plateMode = 'block';
  else if (t.container.mode === 'bar' || t.container.mode === 'pill') plateMode = 'line';

  // Fill paint
  const fill: Paint = t.colors.gradient
    ? {
        angle: t.colors.gradient.angle,
        stops: t.colors.gradient.stops,
      }
    : t.colors.text;

  // Stagger unit mapping
  const staggerUnit = t.stagger.unit === 'letter' ? 'char' : t.stagger.unit;

  // Easing mapping
  let easeName: CaptionStyle['motion']['ease'];
  if (t.entrance.easing === 'linear') easeName = 'linear';
  else if (t.entrance.easing === 'easeOutQuad' || t.entrance.easing === 'easeOutCubic')
    easeName = 'out';
  else if (t.entrance.easing === 'easeInOutCubic') easeName = 'inout';
  else if (t.entrance.easing === 'easeOutExpo') easeName = 'expo';
  else if (t.entrance.easing === 'easeOutBack') easeName = 'back';
  else easeName = 'spring';

  return {
    id: t.id,
    name: t.name,
    syncOffset: t.syncOffset ?? -0.1,
    font: {
      family: t.font.family,
      weight: t.font.weight,
      italic: t.font.italic ?? false,
      underline: t.font.underline ?? false,
      size: t.font.size,
      tracking: t.font.letterSpacing,
      lineHeight: t.font.lineHeight,
      textCase: t.font.case,
    },
    layout: {
      wordsPerPage: t.layout.wordsPerPage,
      maxLines: t.layout.maxLines,
      widthPct: t.layout.widthPct,
      align: t.layout.align,
      x: t.layout.x,
      y: t.layout.y,
    },
    fill,
    stroke: {
      width: t.colors.outlineWidth,
      color: t.colors.outline,
    },
    shadow: {
      x: t.colors.shadow?.x ?? 0,
      y: t.colors.shadow?.y ?? 0,
      blur: t.colors.shadow?.blur ?? 0,
      color: t.colors.shadow?.color ?? 'rgba(0,0,0,0.5)',
    },
    glow: {
      color: t.colors.glow?.color ?? t.colors.activeWord,
      blur: t.colors.glow?.blur ?? 0,
      strength: t.colors.glow?.strength ?? 0,
    },
    extrude: {
      depth: t.colors.extrude?.depth ?? 0,
      color: t.colors.extrude?.color ?? '#000000',
      angle: t.colors.extrude?.angle ?? 90,
    },
    plate: {
      mode: plateMode,
      color: t.container.color,
      padX: t.container.padX,
      padY: t.container.padY,
      radius: t.container.radius,
    },
    highlight: {
      mode: hlMode,
      color: t.colors.activeWord,
      textColor: t.colors.activeText || '',
      scale: (t.emphasis.params as Record<string, any>)?.scale ?? 1.15,
      keep: (t.emphasis.params as Record<string, any>)?.keep ?? false,
      boxPadX: (t.emphasis.params as Record<string, any>)?.boxPadX ?? 0.22,
      boxPadY: (t.emphasis.params as Record<string, any>)?.boxPadY ?? 0.08,
      boxRadius: (t.emphasis.params as Record<string, any>)?.boxRadius ?? 0.24,
      colors: t.colors.activeWordCycle,
      italic: t.colors.activeItalic,
      emphasisType: t.emphasis.type,
      emphasisParams: t.emphasis.params,
    },
    wordRoles: t.roles?.map((r) => ({
      words: r.words,
      scale: r.scale,
      family: r.family,
      weight: r.weight,
      italic: r.italic,
      textCase: r.case,
      fill: r.gradient ? { angle: r.gradient.angle, stops: r.gradient.stops } : r.fill,
      stroke: r.stroke,
      glow: r.glow,
      shadow: r.shadow,
      gap: r.gap,
    })),
    reveal: {
      mode: 'page',
      dimUnspoken: 1,
    },
    motion: {
      in: t.entrance.type,
      out: t.exit.type,
      inMs: Math.round(t.entrance.duration * 1000),
      outMs: Math.round(t.exit.duration * 1000),
      stagger: Math.round(t.stagger.delay * 1000),
      unit: staggerUnit,
      ease: easeName,
      bounce: (t.entrance.params as Record<string, any>)?.bounce ?? 0.55,
      wobble: (t.emphasis.params as Record<string, any>)?.wobble ?? 0,
      entranceType: t.entrance.type,
      exitType: t.exit.type,
      entranceParams: t.entrance.params,
      exitParams: t.exit.params,
      easing: t.entrance.easing,
    },
  };
}

/**
 * Converts any CaptionStyle to a full validated CaptionTemplate.
 */
export function styleToTemplate(
  s: CaptionStyle,
  overrides: Partial<CaptionTemplate> = {},
): CaptionTemplate {
  // Map inAnim to EntranceType
  let entType: EntranceType = 'scale-pop';
  if (s.motion.in === 'fade') entType = 'fade';
  else if (s.motion.in === 'slide-up') entType = 'slide-up';
  else if (s.motion.in === 'slide-down') entType = 'drop-in';
  else if (s.motion.in === 'pop') entType = 'scale-pop';
  else if (s.motion.in === 'blur') entType = 'blur-in';
  else if (s.motion.in === 'typewriter') entType = 'typewriter';
  else if (s.motion.in === 'mask-up') entType = 'clip-reveal';
  else if (s.motion.in === 'drop') entType = 'drop-in';
  else if (s.motion.in === 'glitch') entType = 'clip-reveal';

  // Map outAnim to ExitType
  let exitType: ExitType = 'fade';
  if (s.motion.out === 'fade') exitType = 'fade';
  else if (s.motion.out === 'slide-down') exitType = 'slide-down';
  else if (s.motion.out === 'shrink') exitType = 'scale-out';

  // Map highlight mode to EmphasisType
  let empType: EmphasisType = 'color-flip';
  if (s.highlight.mode === 'color') empType = 'color-flip';
  else if (s.highlight.mode === 'box') empType = 'highlight-box-sweep';
  else if (s.highlight.mode === 'underline') empType = 'underline-draw';
  else if (s.highlight.mode === 'sweep') empType = 'color-flip';

  // Container
  let containerMode: 'none' | 'box' | 'pill' | 'bar' = 'none';
  if (s.plate.mode === 'block') containerMode = 'box';
  else if (s.plate.mode === 'line') containerMode = 'pill';

  const isGrad = typeof s.fill !== 'string';
  const textColor = typeof s.fill === 'string' ? s.fill : s.fill.stops[0][1];

  const template: CaptionTemplate = {
    id: s.id,
    name: s.name,
    version: 1,
    category: overrides.category || 'General',
    tags: overrides.tags || ['custom', 'caption'],
    author: overrides.author || 'Epic Hertz Studio',
    license: 'OFL-1.1 / MIT',
    font: {
      family: s.font.family,
      weight: s.font.weight,
      size: s.font.size,
      case: s.font.textCase,
      letterSpacing: s.font.tracking,
      lineHeight: s.font.lineHeight,
      italic: s.font.italic ?? false,
      underline: s.font.underline ?? false,
      fallbacks: {
        telugu: 'Noto Sans Telugu',
        devanagari: 'Noto Sans Devanagari',
        tamil: 'Noto Sans Tamil',
      },
    },
    colors: {
      text: textColor,
      activeWord: s.highlight.color,
      activeText: s.highlight.textColor || undefined,
      activeWordCycle: s.highlight.colors,
      activeItalic: s.highlight.italic,
      outline: s.stroke.color,
      outlineWidth: s.stroke.width,
      shadow: s.shadow,
      glow: s.glow,
      extrude: s.extrude,
      gradient: isGrad
        ? {
            angle: (s.fill as any).angle,
            stops: (s.fill as any).stops,
          }
        : null,
    },
    container: {
      mode: containerMode,
      color: s.plate.color,
      padX: s.plate.padX,
      padY: s.plate.padY,
      radius: s.plate.radius,
    },
    layout: {
      align: s.layout.align,
      wordsPerPage: s.layout.wordsPerPage,
      maxLines: s.layout.maxLines,
      widthPct: s.layout.widthPct,
      x: s.layout.x,
      y: s.layout.y,
      lineBreakRule: 'auto',
    },
    entrance: {
      type: entType,
      duration: s.motion.inMs / 1000,
      easing: s.motion.ease === 'spring' ? 'spring' : 'easeOutCubic',
      params: { bounce: s.motion.bounce },
    },
    emphasis: {
      type: empType,
      duration: 0.12,
      easing: 'spring',
      params: {
        scale: s.highlight.scale,
        keep: s.highlight.keep,
        boxPadX: s.highlight.boxPadX,
        boxPadY: s.highlight.boxPadY,
        boxRadius: s.highlight.boxRadius,
        wobble: s.motion.wobble,
      },
    },
    exit: {
      type: exitType,
      duration: s.motion.outMs / 1000,
      easing: 'easeOutCubic',
      params: {},
    },
    stagger: {
      unit: s.motion.unit === 'char' ? 'letter' : s.motion.unit,
      delay: s.motion.stagger / 1000,
    },
    roles: s.wordRoles?.map((r) => ({
      words: r.words,
      scale: r.scale,
      family: r.family,
      weight: r.weight,
      italic: r.italic,
      case: r.textCase,
      fill: typeof r.fill === 'string' ? r.fill : undefined,
      gradient:
        r.fill && typeof r.fill !== 'string'
          ? { angle: r.fill.angle, stops: r.fill.stops }
          : undefined,
      stroke: r.stroke,
      glow: r.glow,
      shadow: r.shadow,
      gap: r.gap,
    })),
    emphasisTrigger: 'activeWord',
    syncOffset: s.syncOffset,
    ...overrides,
  };

  return template;
}
