// ─── Caption style model ────────────────────────────────────────────────────
// One serialisable description of how captions look AND move. The same object
// drives the live preview, the gallery thumbnails and the exported video.

import type { EaseName } from './util';
import type { EntranceType, EmphasisType, ExitType, AnimationEasing } from './animation/types';
import type { SegmentStyleOverride } from '../types';

export interface GradientPaint {
  /** Degrees. 90 = top → bottom, 0 = left → right. */
  angle: number;
  stops: Array<[number, string]>;
}
export type Paint = string | GradientPaint;

export type InAnim =
  | 'none'
  | 'fade'
  | 'pop'
  | 'slide-up'
  | 'slide-down'
  | 'zoom'
  | 'blur'
  | 'mask-up'
  | 'drop'
  | 'typewriter'
  | 'glitch'
  | EntranceType;
export type OutAnim = 'none' | 'fade' | 'slide-down' | 'shrink' | ExitType;
export type HighlightMode = 'none' | 'color' | 'box' | 'underline' | 'sweep';
export type TextCase = 'none' | 'upper' | 'lower' | 'title';
export type MotionUnit = 'line' | 'word' | 'char';

/**
 * A fixed typography role for poster-style caption templates. Captions assign
 * consecutive words to roles in order (each role covers `words` words), so a
 * template can put an intro line, a giant keyword and an italic kicker on
 * separate lines with their own font, size, colour and glow.
 */
export interface WordRole {
  /** How many consecutive words use this role before the next role begins. */
  words: number;
  /** Font size multiplier of the caption's base size. */
  scale?: number;
  family?: string;
  weight?: number;
  italic?: boolean;
  textCase?: TextCase;
  fill?: Paint;
  stroke?: { width?: number; color?: string };
  glow?: { color?: string; blur?: number; strength?: number };
  shadow?: { x?: number; y?: number; blur?: number; color?: string };
  /** Extra spacing above this role's line, as a fraction of the base size. */
  gap?: number;
}

export interface CaptionStyle {
  id: string;
  name: string;
  /** Seconds. Negative = captions lead the voice slightly (hides model timestamp lag). */
  syncOffset: number;

  font: {
    family: string; // id from FONT_FAMILIES
    weight: number;
    italic: boolean;
    underline?: boolean;
    /** Fraction of min(frame width, frame height). 0.08 ≈ classic reel caption. */
    size: number;
    /** em */
    tracking: number;
    lineHeight: number;
    textCase: TextCase;
  };

  layout: {
    /** Words shown at once. 0 = whole caption. */
    wordsPerPage: number;
    maxLines: number;
    /** Max block width as a fraction of frame width. */
    widthPct: number;
    align: 'left' | 'center' | 'right';
    /** Block centre, 0..1 of frame. */
    x: number;
    y: number;
  };

  fill: Paint;
  /** em units */
  stroke: { width: number; color: string };
  shadow: { x: number; y: number; blur: number; color: string };
  glow: { color: string; blur: number; strength: number };
  extrude: { depth: number; color: string; angle: number };
  plate: {
    mode: 'none' | 'block' | 'line';
    color: string;
    padX: number;
    padY: number;
    radius: number;
  };

  /** Optional fixed typography roles; when set they override font/size/colour per word. */
  wordRoles?: WordRole[];

  highlight: {
    mode: HighlightMode;
    color: string;
    /** Colour of the active word's text when it sits on a box. */
    textColor: string;
    /** Peak scale of the active word (1 = none). */
    scale: number;
    /** Spoken words keep the highlight colour (karaoke accumulation). */
    keep: boolean;
    boxPadX: number;
    boxPadY: number;
    boxRadius: number;
    /** Optional per-word accent colours, cycled by word index (e.g. orange, lime, red). */
    colors?: string[];
    /** Draw the emphasised (spoken) word in italic, synthesised when the family lacks one. */
    italic?: boolean;
    emphasisType?: EmphasisType;
    emphasisParams?: Record<string, any>;
  };

  reveal: {
    /** page = whole page animates in together · spoken = each word appears as it is said */
    mode: 'page' | 'spoken';
    /** Opacity of words not yet spoken (1 = no dimming). */
    dimUnspoken: number;
  };

  motion: {
    in: InAnim;
    out: OutAnim;
    inMs: number;
    outMs: number;
    /** Delay between successive units, ms. */
    stagger: number;
    unit: MotionUnit;
    ease: EaseName;
    /** 0..1 overshoot for spring / back easing. */
    bounce: number;
    /** Random tilt per word, degrees. */
    wobble: number;
    entranceType?: EntranceType;
    exitType?: ExitType;
    entranceParams?: Record<string, any>;
    exitParams?: Record<string, any>;
    easing?: AnimationEasing;
  };
}

// ── Fonts ────────────────────────────────────────────────────────────────────

export interface FontFile {
  weight: number;
  style: 'normal' | 'italic';
  file: string;
}
export interface FontFamilyDef {
  id: string;
  label: string;
  css: string; // CSS family name
  group: 'Sans' | 'Display' | 'Serif' | 'Comic';
  files: FontFile[];
}

export const FONT_FAMILIES: FontFamilyDef[] = [
  {
    id: 'unbounded',
    label: 'Unbounded',
    css: 'Unbounded',
    group: 'Display',
    files: [
      { weight: 700, style: 'normal', file: 'unbounded-latin-700-normal.woff2' },
      { weight: 900, style: 'normal', file: 'unbounded-latin-900-normal.woff2' },
    ],
  },
  {
    id: 'albert',
    label: 'Albert Sans',
    css: 'Albert Sans',
    group: 'Sans',
    files: [
      { weight: 600, style: 'normal', file: 'albert-sans-latin-600-normal.woff2' },
      { weight: 800, style: 'normal', file: 'albert-sans-latin-800-normal.woff2' },
    ],
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    css: 'Montserrat',
    group: 'Sans',
    files: [
      { weight: 800, style: 'normal', file: 'montserrat-latin-800-normal.woff2' },
      { weight: 900, style: 'normal', file: 'montserrat-latin-900-normal.woff2' },
    ],
  },
  {
    id: 'poppins',
    label: 'Poppins',
    css: 'Poppins',
    group: 'Sans',
    files: [
      { weight: 600, style: 'normal', file: 'poppins-latin-600-normal.woff2' },
      { weight: 800, style: 'normal', file: 'poppins-latin-800-normal.woff2' },
    ],
  },
  {
    id: 'inter',
    label: 'Inter',
    css: 'Inter',
    group: 'Sans',
    files: [
      { weight: 600, style: 'normal', file: 'inter-latin-600-normal.woff2' },
      { weight: 800, style: 'normal', file: 'inter-latin-800-normal.woff2' },
    ],
  },
  {
    id: 'anton',
    label: 'Anton',
    css: 'Anton',
    group: 'Display',
    files: [{ weight: 400, style: 'normal', file: 'anton-latin-400-normal.woff2' }],
  },
  {
    id: 'bebas',
    label: 'Bebas Neue',
    css: 'Bebas Neue',
    group: 'Display',
    files: [{ weight: 400, style: 'normal', file: 'bebas-neue-latin-400-normal.woff2' }],
  },
  {
    id: 'oswald',
    label: 'Oswald',
    css: 'Oswald',
    group: 'Display',
    files: [{ weight: 600, style: 'normal', file: 'oswald-latin-600-normal.woff2' }],
  },
  {
    id: 'archivo',
    label: 'Archivo Black',
    css: 'Archivo Black',
    group: 'Display',
    files: [{ weight: 400, style: 'normal', file: 'archivo-black-latin-400-normal.woff2' }],
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    css: 'Playfair Display',
    group: 'Serif',
    files: [
      { weight: 700, style: 'normal', file: 'playfair-display-latin-700-normal.woff2' },
      { weight: 700, style: 'italic', file: 'playfair-display-latin-700-italic.woff2' },
    ],
  },
  {
    id: 'bangers',
    label: 'Bangers',
    css: 'Bangers',
    group: 'Comic',
    files: [{ weight: 400, style: 'normal', file: 'bangers-latin-400-normal.woff2' }],
  },
];

export const fontById = (id: string): FontFamilyDef =>
  FONT_FAMILIES.find((f) => f.id === id) ?? FONT_FAMILIES[0];

/** Indic scripts: Noto Sans faces, loaded only when the captions contain that script. */
export const SCRIPT_FONTS: Array<{ name: string; css: string; test: RegExp; files: FontFile[] }> = [
  {
    name: 'telugu',
    css: 'Noto Sans Telugu',
    test: /[\u0C00-\u0C7F]/,
    files: [
      { weight: 700, style: 'normal', file: 'noto-sans-telugu-telugu-700-normal.woff2' },
      { weight: 900, style: 'normal', file: 'noto-sans-telugu-telugu-900-normal.woff2' },
    ],
  },
  {
    name: 'devanagari',
    css: 'Noto Sans Devanagari',
    test: /[\u0900-\u097F]/,
    files: [
      { weight: 700, style: 'normal', file: 'noto-sans-devanagari-devanagari-700-normal.woff2' },
      { weight: 900, style: 'normal', file: 'noto-sans-devanagari-devanagari-900-normal.woff2' },
    ],
  },
  {
    name: 'tamil',
    css: 'Noto Sans Tamil',
    test: /[\u0B80-\u0BFF]/,
    files: [
      { weight: 700, style: 'normal', file: 'noto-sans-tamil-tamil-700-normal.woff2' },
      { weight: 900, style: 'normal', file: 'noto-sans-tamil-tamil-900-normal.woff2' },
    ],
  },
  {
    name: 'kannada',
    css: 'Noto Sans Kannada',
    test: /[\u0C80-\u0CFF]/,
    files: [
      { weight: 700, style: 'normal', file: 'noto-sans-kannada-kannada-700-normal.woff2' },
      { weight: 900, style: 'normal', file: 'noto-sans-kannada-kannada-900-normal.woff2' },
    ],
  },
  {
    name: 'malayalam',
    css: 'Noto Sans Malayalam',
    test: /[\u0D00-\u0D7F]/,
    files: [
      { weight: 700, style: 'normal', file: 'noto-sans-malayalam-malayalam-700-normal.woff2' },
      { weight: 900, style: 'normal', file: 'noto-sans-malayalam-malayalam-900-normal.woff2' },
    ],
  },
  {
    name: 'bengali',
    css: 'Noto Sans Bengali',
    test: /[\u0980-\u09FF]/,
    files: [
      { weight: 700, style: 'normal', file: 'noto-sans-bengali-bengali-700-normal.woff2' },
      { weight: 900, style: 'normal', file: 'noto-sans-bengali-bengali-900-normal.woff2' },
    ],
  },
];

/** Any Indic script — these must not be split into characters or tracked out. */
export const COMPLEX_SCRIPT = /[\u0900-\u0DFF]/;

// ─── Lower Thirds overlay model ──────────────────────────────────────────────
export type LowerThirdVariant = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface LowerThirdColors {
  primary: string; // Accent / main shape / underline / highlight color
  secondary?: string; // Secondary badge or background plate
  textPrimary: string; // Name text color
  textSecondary: string; // Role / handle text color
}

export interface LowerThirdPosition {
  x: number; // 0..1 frame width (0 = left margin, 0.5 = center)
  y: number; // 0..1 frame height (0.82 = classic lower third)
  align: 'left' | 'center' | 'right';
}

export interface LowerThirdSpec {
  id: string;
  start: number; // Seconds
  end: number; // Seconds
  variant: LowerThirdVariant;
  templateId?: string; // Reference to LowerThirdTemplate ID (e.g. 'classic-box-highlight')
  name: string;
  role: string;
  extra?: string; // Optional third line (e.g. affiliation, location, date)
  handle?: string;
  photoBlobId?: string;
  photoUrl?: string;
  position: LowerThirdPosition;
  colors: LowerThirdColors;
  font: {
    family: string; // Font id from FONT_FAMILIES
    size: number; // Fraction of frame width/height (e.g. 0.035)
    weight: number;
  };
  scale: number; // Overall multiplier (0.5 .. 2.0)
  introDuration?: number; // Seconds (~0.7)
  outroDuration?: number; // Seconds (~0.6)
  slotOverrides?: Record<string, unknown>; // Custom per-instance slot parameter overrides
}

export const DEFAULT_LOWER_THIRD: Omit<LowerThirdSpec, 'id' | 'start' | 'end'> = {
  variant: 1,
  templateId: 'classic-box-highlight',
  name: 'RAVI TEJA',
  role: 'CREATIVE DIRECTOR',
  handle: '@raviteja',
  position: { x: 0.08, y: 0.82, align: 'left' },
  colors: {
    primary: '#f59e0b',
    secondary: '#18181b',
    textPrimary: '#ffffff',
    textSecondary: '#e4e4e7',
  },
  font: {
    family: 'unbounded',
    size: 0.035,
    weight: 800,
  },
  scale: 1.0,
  introDuration: 0.7,
  outroDuration: 0.6,
};

/**
 * Computes the effective resolved CaptionStyle for a caption by cleanly layering
 * its SegmentStyleOverride (including customStyle and direct shortcut fields)
 * on top of the base global style.
 */
export function getEffectiveCaptionStyle(
  globalStyle: CaptionStyle,
  override?: SegmentStyleOverride | null,
): CaptionStyle {
  if (!globalStyle) return globalStyle;
  if (!override) return globalStyle;
  let s: CaptionStyle = {
    ...globalStyle,
    layout: {
      ...(globalStyle.layout || {
        x: 0.5,
        y: 0.8,
        wordsPerPage: 0,
        maxLines: 2,
        widthPct: 0.88,
        align: 'center',
      }),
    },
    font: { ...globalStyle.font },
    stroke: { ...globalStyle.stroke },
    shadow: { ...globalStyle.shadow },
    glow: { ...globalStyle.glow },
    extrude: { ...globalStyle.extrude },
    plate: { ...globalStyle.plate },
    highlight: { ...globalStyle.highlight },
    reveal: { ...globalStyle.reveal },
    motion: { ...globalStyle.motion },
  };

  if (override.customStyle) {
    s = {
      ...s,
      ...override.customStyle,
      font: { ...s.font, ...(override.customStyle.font || {}) },
      layout: { ...s.layout, ...(override.customStyle.layout || {}) },
      stroke: { ...s.stroke, ...(override.customStyle.stroke || {}) },
      shadow: { ...s.shadow, ...(override.customStyle.shadow || {}) },
      glow: { ...s.glow, ...(override.customStyle.glow || {}) },
      extrude: { ...s.extrude, ...(override.customStyle.extrude || {}) },
      plate: { ...s.plate, ...(override.customStyle.plate || {}) },
      highlight: { ...s.highlight, ...(override.customStyle.highlight || {}) },
      reveal: { ...s.reveal, ...(override.customStyle.reveal || {}) },
      motion: { ...s.motion, ...(override.customStyle.motion || {}) },
    };
  }

  s = {
    ...s,
    layout: {
      ...s.layout,
      x: override.positionX !== undefined ? override.positionX : (s.layout?.x ?? 0.5),
      y: override.positionY !== undefined ? override.positionY : (s.layout?.y ?? 0.8),
    },
    font: {
      ...s.font,
      family: override.fontFamily || s.font.family,
      weight: override.fontWeight || s.font.weight,
      size:
        override.fontSize !== undefined
          ? override.fontSize
          : override.scale !== undefined
            ? s.font.size * override.scale
            : s.font.size,
      underline: override.underline !== undefined ? override.underline : s.font.underline,
      italic: override.italic !== undefined ? override.italic : s.font.italic,
      textCase: override.textCase !== undefined ? override.textCase : s.font.textCase,
    },
    fill: override.fillColor || s.fill,
    stroke: override.strokeColor ? { ...s.stroke, color: override.strokeColor } : s.stroke,
    highlight: override.highlightColor
      ? { ...s.highlight, color: override.highlightColor }
      : s.highlight,
  };

  return s;
}
