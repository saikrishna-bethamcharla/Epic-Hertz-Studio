// ─── Caption style presets ──────────────────────────────────────────────────
// Original designs (no borrowed brand names). Each is a complete CaptionStyle:
// typography, treatment layers and motion. Sizes are fractions of the frame.

import type { CaptionStyle } from './spec';

export type PresetGroup = 'Viral' | 'Kinetic' | 'Glow & colour' | 'Film & clean';

export const BASE_STYLE: CaptionStyle = {
  id: 'base',
  name: 'Base',
  syncOffset: -0.1, // Calibrated -100ms lead offset so visual pop syncs with spoken syllables
  font: {
    family: 'montserrat',
    weight: 800,
    italic: false,
    underline: false,
    size: 0.075,
    tracking: 0,
    lineHeight: 1.15,
    textCase: 'none',
  },
  layout: { wordsPerPage: 3, maxLines: 2, widthPct: 0.86, align: 'center', x: 0.5, y: 0.74 },
  fill: '#FFFFFF',
  stroke: { width: 0, color: '#000000' },
  shadow: { x: 0, y: 0, blur: 0, color: 'rgba(0,0,0,0.5)' },
  glow: { color: '#FFFFFF', blur: 0, strength: 0 },
  extrude: { depth: 0, color: '#000000', angle: 90 },
  plate: { mode: 'none', color: 'rgba(0,0,0,0.6)', padX: 0.35, padY: 0.12, radius: 0.3 },
  highlight: {
    mode: 'none',
    color: '#FFE14D',
    textColor: '',
    scale: 1,
    keep: false,
    boxPadX: 0.22,
    boxPadY: 0.08,
    boxRadius: 0.24,
  },
  reveal: { mode: 'page', dimUnspoken: 1 },
  motion: {
    in: 'pop',
    out: 'none',
    inMs: 260,
    outMs: 140,
    stagger: 45,
    unit: 'word',
    ease: 'spring',
    bounce: 0.55,
    wobble: 0,
  },
};

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K];
};

/** Build a full style from a partial override of BASE_STYLE (one level deep per group). */
export function makeStyle(
  over: DeepPartial<CaptionStyle> & { id: string; name: string },
): CaptionStyle {
  const out = JSON.parse(JSON.stringify(BASE_STYLE)) as CaptionStyle;
  (Object.keys(over) as (keyof CaptionStyle)[]).forEach((k) => {
    const v = over[k] as unknown;
    if (
      v &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      typeof out[k] === 'object' &&
      out[k] !== null &&
      !('stops' in (v as object))
    ) {
      Object.assign(out[k] as object, v);
    } else {
      (out as unknown as Record<string, unknown>)[k] = v;
    }
  });
  return out;
}

export interface PresetDef {
  group: PresetGroup;
  blurb: string;
  style: CaptionStyle;
}

export const PRESETS: PresetDef[] = [
  // ───────────────────────────── Viral ─────────────────────────────
  {
    group: 'Viral',
    blurb: 'Bold, outlined, the active word pops in colour',
    style: makeStyle({
      id: 'pulse',
      name: 'Pulse',
      font: { family: 'montserrat', weight: 900, size: 0.108, textCase: 'upper', lineHeight: 1.12 },
      layout: { wordsPerPage: 3, widthPct: 0.9, y: 0.72 },
      stroke: { width: 0.085, color: '#0B0B0B' },
      shadow: { x: 0, y: 0.05, blur: 0.12, color: 'rgba(0,0,0,0.55)' },
      highlight: { mode: 'color', color: '#FFE14D', scale: 1.14 },
      motion: { in: 'pop', inMs: 300, stagger: 40, ease: 'spring', bounce: 0.6 },
    }),
  },
  {
    group: 'Viral',
    blurb: 'Condensed caps with a highlight block that slides word to word',
    style: makeStyle({
      id: 'block',
      name: 'Block',
      font: {
        family: 'anton',
        weight: 400,
        size: 0.125,
        tracking: 0.012,
        textCase: 'upper',
        lineHeight: 1.1,
      },
      layout: { wordsPerPage: 3, widthPct: 0.9, y: 0.7 },
      shadow: { x: 0, y: 0.04, blur: 0.08, color: 'rgba(0,0,0,0.55)' },
      highlight: {
        mode: 'box',
        color: '#FFD60A',
        textColor: '#0A0A0A',
        boxPadX: 0.2,
        boxPadY: 0.05,
        boxRadius: 0.16,
      },
      motion: { in: 'slide-up', inMs: 220, stagger: 32, ease: 'out' },
    }),
  },
  {
    group: 'Viral',
    blurb: 'Two words at a time, slammed on screen',
    style: makeStyle({
      id: 'slam',
      name: 'Slam',
      font: {
        family: 'oswald',
        weight: 600,
        size: 0.14,
        tracking: 0.01,
        textCase: 'upper',
        lineHeight: 1.05,
      },
      layout: { wordsPerPage: 2, widthPct: 0.92, y: 0.66 },
      stroke: { width: 0.07, color: '#050505' },
      shadow: { x: 0, y: 0.05, blur: 0.1, color: 'rgba(0,0,0,0.6)' },
      highlight: { mode: 'color', color: '#FF4B3E', scale: 1.08 },
      motion: { in: 'zoom', inMs: 230, stagger: 70, ease: 'spring', bounce: 0.3 },
    }),
  },
  {
    group: 'Viral',
    blurb: 'Chunky comic lettering with a solid 3-D edge',
    style: makeStyle({
      id: 'comic',
      name: 'Comic',
      font: {
        family: 'bangers',
        weight: 400,
        size: 0.128,
        tracking: 0.02,
        textCase: 'upper',
        lineHeight: 1.08,
      },
      layout: { wordsPerPage: 3, widthPct: 0.9, y: 0.7 },
      stroke: { width: 0.06, color: '#14110F' },
      extrude: { depth: 0.085, color: '#D7263D', angle: 90 },
      highlight: { mode: 'color', color: '#FFE14D', scale: 1.1 },
      motion: { in: 'pop', inMs: 340, stagger: 55, ease: 'spring', bounce: 0.85, wobble: 2.6 },
    }),
  },

  // ───────────────────────────── Kinetic ─────────────────────────────
  {
    group: 'Kinetic',
    blurb: 'Poster-style stacked lines rising out of a mask',
    style: makeStyle({
      id: 'stack',
      name: 'Stack',
      font: {
        family: 'bebas',
        weight: 400,
        size: 0.17,
        tracking: 0.015,
        textCase: 'upper',
        lineHeight: 0.96,
      },
      layout: { wordsPerPage: 3, maxLines: 3, widthPct: 0.46, align: 'left', y: 0.68 },
      shadow: { x: 0, y: 0.03, blur: 0.08, color: 'rgba(0,0,0,0.5)' },
      highlight: { mode: 'color', color: '#6CFF8F', scale: 1 },
      motion: { in: 'mask-up', inMs: 420, stagger: 90, unit: 'line', ease: 'expo' },
    }),
  },
  {
    group: 'Kinetic',
    blurb: 'Lyric-style colour sweep that fills each word as it is spoken',
    style: makeStyle({
      id: 'karaoke',
      name: 'Karaoke',
      font: { family: 'inter', weight: 800, size: 0.082, tracking: -0.005 },
      layout: { wordsPerPage: 5, widthPct: 0.88, y: 0.72 },
      shadow: { x: 0, y: 0.04, blur: 0.14, color: 'rgba(0,0,0,0.6)' },
      stroke: { width: 0.03, color: 'rgba(0,0,0,0.55)' },
      highlight: { mode: 'sweep', color: '#FFD60A', keep: true },
      reveal: { mode: 'page', dimUnspoken: 0.5 },
      motion: { in: 'slide-up', inMs: 260, stagger: 25, ease: 'out' },
    }),
  },
  {
    group: 'Kinetic',
    blurb: 'Letters type themselves in as the words are said',
    style: makeStyle({
      id: 'typed',
      name: 'Typed',
      font: { family: 'inter', weight: 800, size: 0.068, textCase: 'none' },
      layout: { wordsPerPage: 6, widthPct: 0.86, y: 0.78 },
      plate: { mode: 'block', color: 'rgba(12,12,14,0.8)', padX: 0.5, padY: 0.3, radius: 0.28 },
      highlight: { mode: 'underline', color: '#7AF0C8', keep: false },
      reveal: { mode: 'spoken', dimUnspoken: 1 },
      motion: { in: 'typewriter', inMs: 1, stagger: 24, unit: 'char', ease: 'linear' },
    }),
  },
  {
    group: 'Kinetic',
    blurb: 'RGB-split glitch entrance that locks into place',
    style: makeStyle({
      id: 'glitch',
      name: 'Glitch',
      font: { family: 'archivo', weight: 400, size: 0.092, tracking: 0.02, textCase: 'upper' },
      layout: { wordsPerPage: 3, widthPct: 0.9, y: 0.7 },
      shadow: { x: 0, y: 0.04, blur: 0.1, color: 'rgba(0,0,0,0.6)' },
      highlight: { mode: 'color', color: '#00E5FF', scale: 1 },
      motion: { in: 'glitch', inMs: 380, stagger: 45, ease: 'out' },
    }),
  },

  // ───────────────────────────── Glow & colour ─────────────────────────────
  {
    group: 'Glow & colour',
    blurb: 'Soft neon bloom, words light up as they are spoken',
    style: makeStyle({
      id: 'neon',
      name: 'Neon',
      font: { family: 'poppins', weight: 800, size: 0.088 },
      layout: { wordsPerPage: 4, widthPct: 0.86, y: 0.62 },
      fill: '#F2FDFF',
      glow: { color: '#00E5FF', blur: 0.2, strength: 2 },
      highlight: { mode: 'color', color: '#FF7BE6', scale: 1.05 },
      reveal: { mode: 'page', dimUnspoken: 0.32 },
      motion: { in: 'blur', inMs: 360, stagger: 50, ease: 'out' },
    }),
  },
  {
    group: 'Glow & colour',
    blurb: 'Sunset gradient letters with a dark rim',
    style: makeStyle({
      id: 'ember',
      name: 'Ember',
      font: { family: 'archivo', weight: 400, size: 0.105, textCase: 'upper' },
      layout: { wordsPerPage: 3, widthPct: 0.9, y: 0.7 },
      fill: {
        angle: 90,
        stops: [
          [0, '#FFE259'],
          [0.55, '#FFA14B'],
          [1, '#FF4E50'],
        ],
      },
      stroke: { width: 0.075, color: '#1C0707' },
      shadow: { x: 0, y: 0.05, blur: 0.1, color: 'rgba(0,0,0,0.6)' },
      highlight: { mode: 'none', scale: 1.14 },
      motion: { in: 'zoom', inMs: 280, stagger: 55, ease: 'spring', bounce: 0.5 },
    }),
  },
  {
    group: 'Glow & colour',
    blurb: 'Gold-foil serif that rises through a mask',
    style: makeStyle({
      id: 'gilt',
      name: 'Gilt',
      font: {
        family: 'playfair',
        weight: 700,
        size: 0.085,
        tracking: 0.035,
        textCase: 'title',
        lineHeight: 1.18,
      },
      layout: { wordsPerPage: 4, widthPct: 0.86, y: 0.7 },
      fill: {
        angle: 90,
        stops: [
          [0, '#FFF3C4'],
          [0.5, '#E8C468'],
          [1, '#9C6E1A'],
        ],
      },
      stroke: { width: 0.035, color: 'rgba(48,28,4,0.9)' },
      shadow: { x: 0, y: 0.04, blur: 0.1, color: 'rgba(0,0,0,0.65)' },
      motion: { in: 'mask-up', inMs: 520, stagger: 70, unit: 'line', ease: 'expo' },
    }),
  },

  // ───────────────────────────── Film & clean ─────────────────────────────
  {
    group: 'Film & clean',
    blurb: 'Elegant italic serif for dialogue, soft fade',
    style: makeStyle({
      id: 'cinema',
      name: 'Cinema',
      font: {
        family: 'playfair',
        weight: 700,
        italic: true,
        size: 0.058,
        tracking: 0.008,
        lineHeight: 1.25,
      },
      layout: { wordsPerPage: 0, maxLines: 2, widthPct: 0.8, y: 0.86 },
      fill: '#F6F1E7',
      shadow: { x: 0, y: 0.04, blur: 0.12, color: 'rgba(0,0,0,0.8)' },
      motion: {
        in: 'fade',
        out: 'fade',
        inMs: 380,
        outMs: 220,
        unit: 'line',
        ease: 'out',
        stagger: 0,
      },
    }),
  },
  {
    group: 'Film & clean',
    blurb: 'Broadcast lower-third on a dark plate with an accent underline',
    style: makeStyle({
      id: 'broadcast',
      name: 'Broadcast',
      font: { family: 'inter', weight: 800, size: 0.058, tracking: -0.003 },
      layout: { wordsPerPage: 6, maxLines: 2, widthPct: 0.84, y: 0.84 },
      plate: { mode: 'block', color: 'rgba(10,10,12,0.8)', padX: 0.55, padY: 0.28, radius: 0.22 },
      highlight: { mode: 'underline', color: '#FFD60A', keep: false },
      motion: {
        in: 'slide-up',
        out: 'fade',
        inMs: 280,
        outMs: 160,
        unit: 'line',
        ease: 'out',
        stagger: 0,
      },
    }),
  },
  {
    group: 'Film & clean',
    blurb: 'White pill with a yellow marker that glides between words',
    style: makeStyle({
      id: 'pill',
      name: 'Pill',
      font: { family: 'poppins', weight: 800, size: 0.066 },
      layout: { wordsPerPage: 4, maxLines: 2, widthPct: 0.84, y: 0.74 },
      fill: '#15151A',
      plate: { mode: 'line', color: '#FFFFFF', padX: 0.42, padY: 0.12, radius: 0.6 },
      highlight: {
        mode: 'box',
        color: '#FFE14D',
        textColor: '#15151A',
        boxPadX: 0.16,
        boxPadY: 0.03,
        boxRadius: 0.5,
      },
      motion: { in: 'pop', inMs: 300, unit: 'line', stagger: 60, ease: 'spring', bounce: 0.45 },
    }),
  },
  {
    group: 'Film & clean',
    blurb: 'Quiet and legible. Gentle fade, no decoration',
    style: makeStyle({
      id: 'minimal',
      name: 'Minimal',
      font: { family: 'inter', weight: 600, size: 0.05, tracking: 0.004, lineHeight: 1.3 },
      layout: { wordsPerPage: 7, maxLines: 2, widthPct: 0.82, y: 0.88 },
      shadow: { x: 0, y: 0.04, blur: 0.16, color: 'rgba(0,0,0,0.75)' },
      motion: {
        in: 'fade',
        out: 'fade',
        inMs: 300,
        outMs: 180,
        unit: 'line',
        ease: 'out',
        stagger: 0,
      },
    }),
  },
];

export const DEFAULT_STYLE: CaptionStyle = PRESETS[0].style;

export const presetById = (id: string): PresetDef | undefined =>
  PRESETS.find((p) => p.style.id === id);
