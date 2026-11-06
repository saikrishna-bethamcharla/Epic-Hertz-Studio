// ─── Caption renderer ───────────────────────────────────────────────────────
// A single Canvas 2D renderer used by the live preview, the gallery thumbnails and
// the exported video, so what you design is exactly what you export.
//
//   renderCaptions(ctx, W, H, time, segments, style)
//
// All sizes are derived from the frame (W×H in real pixels) so output is resolution
// independent. Browsers shape Indic scripts natively inside canvas, so Telugu, Hindi,
// Tamil… render with correct conjuncts; those scripts are never split into characters.

import type { Segment } from '../types';
import {
  COMPLEX_SCRIPT,
  type CaptionStyle,
  type GradientPaint,
  type InAnim,
  type Paint,
} from './spec';
import { canvasFont, fontsVersion } from './fonts';
import { clamp01, ease, hash01, lerp, mixColor, spring } from './util';
import { getSpeakerStyle } from '../utils/speakers';

// ─────────────────────────────────────────────────────────────────────────────
// Words & pages
// ─────────────────────────────────────────────────────────────────────────────

export interface WordTiming {
  text: string;
  start: number;
  end: number;
  highlightColor?: string;
  emphasis?: 'none' | 'pop' | 'shake' | 'glow' | 'underline';
}

interface Page {
  words: WordTiming[];
  first: number;
  start: number;
  end: number;
  isLast: boolean;
}

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');

const wordsCache = new WeakMap<
  Segment,
  { text: string; words: WordTiming[]; timedRef?: unknown }
>();

export function segmentWords(seg: Segment): WordTiming[] {
  const hit = wordsCache.get(seg);
  if (hit && hit.text === seg.text && hit.timedRef === seg.words) return hit.words;

  const raw = seg.text.trim().split(/\s+/).filter(Boolean);
  let words: WordTiming[] = [];
  if (raw.length) {
    const timed = seg.words;
    if (
      timed &&
      timed.length === raw.length &&
      timed.every((w, i) => norm(w.word) === norm(raw[i]))
    ) {
      words = timed.map((w, i) => ({
        text: raw[i],
        start: w.start,
        end: Math.max(w.end, w.start + 0.06),
        highlightColor: w.highlightColor,
        emphasis: w.emphasis,
      }));
    } else {
      // Edited text no longer matches model timings → spread evenly over the segment.
      const per = Math.max(0.1, seg.end - seg.start) / raw.length;
      words = raw.map((text, i) => ({
        text,
        start: seg.start + i * per,
        end: seg.start + (i + 1) * per,
      }));
    }
  }
  wordsCache.set(seg, { text: seg.text, words, timedRef: seg.words });
  return words;
}

function buildPages(seg: Segment, words: WordTiming[], wordsPerPage: number): Page[] {
  const n = wordsPerPage > 0 ? wordsPerPage : words.length;
  const pages: Page[] = [];
  for (let i = 0; i < words.length; i += n) {
    const slice = words.slice(i, i + n);
    pages.push({
      words: slice,
      first: i,
      start: i === 0 ? Math.min(seg.start, slice[0].start) : slice[0].start,
      end: slice[slice.length - 1].end,
      isLast: i + n >= words.length,
    });
  }
  return pages;
}

function applyCase(text: string, mode: CaptionStyle['font']['textCase']): string {
  switch (mode) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    default:
      return text;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout (cached)
// ─────────────────────────────────────────────────────────────────────────────

interface CharLayout {
  t: string;
  x: number;
  w: number;
}
interface WordLayout {
  text: string;
  x: number;
  w: number;
  line: number;
  chars?: CharLayout[];
}
interface PageLayout {
  px: number;
  words: WordLayout[];
  lineX: number[];
  lineW: number[];
  w: number;
  h: number;
  lineBox: number;
  baseline: number;
  asc: number;
  desc: number;
  tracking: number;
}

const layoutCache = new Map<string, PageLayout>();
const layoutKeyCache = new WeakMap<CaptionStyle, string>();

function styleLayoutKey(style: CaptionStyle): string {
  let k = layoutKeyCache.get(style);
  if (!k) {
    k = JSON.stringify([
      style.font,
      style.layout.wordsPerPage,
      style.layout.maxLines,
      style.layout.widthPct,
      style.layout.align,
      style.motion.unit,
      style.motion.in,
      style.highlight.scale,
      style.highlight.mode,
      style.highlight.boxPadX,
      style.stroke.width,
    ]);
    layoutKeyCache.set(style, k);
  }
  return k;
}

const hasLetterSpacing = (ctx: CanvasRenderingContext2D) => 'letterSpacing' in ctx;
function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  if (hasLetterSpacing(ctx))
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${px.toFixed(2)}px`;
}

let segmenter: { segment: (s: string) => Iterable<{ segment: string }> } | null | undefined;
function graphemes(text: string): string[] {
  if (segmenter === undefined) {
    const I = (
      Intl as unknown as {
        Segmenter?: new (
          l?: string,
          o?: object,
        ) => { segment: (s: string) => Iterable<{ segment: string }> };
      }
    ).Segmenter;
    segmenter = I ? new I(undefined, { granularity: 'grapheme' }) : null;
  }
  return segmenter ? Array.from(segmenter.segment(text), (x) => x.segment) : Array.from(text);
}

function layoutPage(
  ctx: CanvasRenderingContext2D,
  texts: string[],
  style: CaptionStyle,
  W: number,
  H: number,
): PageLayout {
  const ref = Math.min(W, H);
  const complex = texts.some((t) => COMPLEX_SCRIPT.test(t));
  // Indic glyphs have a smaller x-height and tall matras/subscripts: draw them a touch larger
  // and never squeeze their line spacing the way tight Latin display faces can.
  let px = style.font.size * ref * (complex ? 1.12 : 1);
  const tracking = complex ? 0 : style.font.tracking;
  const maxW = style.layout.widthPct * W;
  const maxLines = Math.max(1, style.layout.maxLines);

  let widths: number[] = [];
  let spaceW = 0;
  let lines: number[][] = [];

  for (let attempt = 0; attempt < 10; attempt++) {
    ctx.font = canvasFont(style, px);
    setSpacing(ctx, tracking * px);
    spaceW =
      (ctx.measureText(' ').width || px * 0.3) + Math.max(0, style.highlight.scale - 1) * px * 0.25;
    // The outline is drawn centred on the glyph edge, so it eats into the space from both sides.
    spaceW += style.stroke.width * px * 1.3;
    // A highlight box pads out past the word on both sides — keep it clear of the neighbours.
    if (style.highlight.mode === 'box')
      spaceW = Math.max(spaceW, style.highlight.boxPadX * px * 1.9);
    widths = texts.map((t) => ctx.measureText(t).width);

    lines = [];
    let cur: number[] = [];
    let curW = 0;
    widths.forEach((w, i) => {
      if (cur.length && curW + spaceW + w > maxW) {
        lines.push(cur);
        cur = [];
        curW = 0;
      }
      curW += (cur.length ? spaceW : 0) + w;
      cur.push(i);
    });
    if (cur.length) lines.push(cur);

    if (lines.length <= maxLines && widths.every((w) => w <= maxW)) break;
    px *= 0.92;
  }

  const m = ctx.measureText('Hg');
  const asc = m.fontBoundingBoxAscent ?? px * 0.8;
  const desc = m.fontBoundingBoxDescent ?? px * 0.2;
  const lineBox = (complex ? Math.max(style.font.lineHeight, 1.42) : style.font.lineHeight) * px;
  const baseline = (lineBox - (asc + desc)) / 2 + asc;

  const lineW = lines.map((idx) => idx.reduce((s, i, k) => s + widths[i] + (k ? spaceW : 0), 0));
  const blockW = Math.max(...lineW, 1);
  const lineX = lineW.map((w) =>
    style.layout.align === 'center'
      ? (blockW - w) / 2
      : style.layout.align === 'right'
        ? blockW - w
        : 0,
  );

  const words: WordLayout[] = new Array(texts.length);
  const charMode = style.motion.unit === 'char' && !complex;
  lines.forEach((idx, li) => {
    let x = lineX[li];
    idx.forEach((i) => {
      const wl: WordLayout = { text: texts[i], x, w: widths[i], line: li };
      if (charMode) {
        const gs = graphemes(texts[i]);
        let prefix = '';
        wl.chars = gs.map((g) => {
          const before = ctx.measureText(prefix).width;
          prefix += g;
          const after = ctx.measureText(prefix).width;
          return { t: g, x: before, w: after - before };
        });
      }
      words[i] = wl;
      x += widths[i] + spaceW;
    });
  });

  return {
    px,
    words,
    lineX,
    lineW,
    w: blockW,
    h: lines.length * lineBox,
    lineBox,
    baseline,
    asc,
    desc,
    tracking,
  };
}

function getLayout(
  ctx: CanvasRenderingContext2D,
  seg: Segment,
  pageIdx: number,
  texts: string[],
  style: CaptionStyle,
  W: number,
  H: number,
): PageLayout {
  const key = `${seg.id}|${seg.text}|${pageIdx}|${W}x${H}|${fontsVersion()}|${styleLayoutKey(style)}`;
  let l = layoutCache.get(key);
  if (!l) {
    if (layoutCache.size > 400) layoutCache.clear();
    l = layoutPage(ctx, texts, style, W, H);
    layoutCache.set(key, l);
  }
  return l;
}

// ─────────────────────────────────────────────────────────────────────────────
// Motion
// ─────────────────────────────────────────────────────────────────────────────

interface Tx {
  alpha: number;
  scale: number;
  dx: number;
  dy: number;
  blur: number;
  glitch: number;
  clipBelow: boolean;
}

function inTransform(
  kind: InAnim,
  p: number,
  px: number,
  lineBox: number,
  style: CaptionStyle,
): Tx {
  const tx: Tx = { alpha: 1, scale: 1, dx: 0, dy: 0, blur: 0, glitch: 0, clipBelow: false };
  if (kind === 'none') return tx;
  const e = ease(style.motion.ease, p, style.motion.bounce);
  const q = 1 - e;
  switch (kind) {
    case 'fade':
      tx.alpha = clamp01(p);
      break;
    case 'pop':
      tx.scale = 0.5 + 0.5 * e;
      tx.alpha = clamp01(p * 4);
      break;
    case 'slide-up':
      tx.dy = q * px * 0.45;
      tx.alpha = clamp01(p * 2.4);
      break;
    case 'slide-down':
      tx.dy = -q * px * 0.45;
      tx.alpha = clamp01(p * 2.4);
      break;
    case 'zoom':
      tx.scale = 1 + q * 0.6;
      tx.alpha = clamp01(p * 3.5);
      break;
    case 'blur':
      tx.blur = q * px * 0.22;
      tx.scale = 1.06 - 0.06 * clamp01(e);
      tx.alpha = clamp01(p * 2);
      break;
    case 'mask-up':
      tx.dy = (1 - clamp01(e)) * lineBox;
      tx.clipBelow = p < 1;
      break;
    case 'drop':
      tx.dy = -q * px * 1.0;
      tx.alpha = clamp01(p * 6);
      break;
    case 'typewriter':
      tx.alpha = p > 0 ? 1 : 0;
      break;
    case 'glitch':
      tx.alpha = clamp01(p * 7);
      tx.glitch = 1 - p;
      break;
  }
  return tx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Paint helpers
// ─────────────────────────────────────────────────────────────────────────────

function isGradient(p: Paint): p is GradientPaint {
  return typeof p !== 'string';
}

function makeFill(
  ctx: CanvasRenderingContext2D,
  paint: Paint,
  x: number,
  y: number,
  w: number,
  h: number,
): string | CanvasGradient {
  if (!isGradient(paint)) return paint;
  const a = (paint.angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = Math.sin(a);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const L = (Math.abs(w * dx) + Math.abs(h * dy)) / 2;
  const g = ctx.createLinearGradient(cx - dx * L, cy - dy * L, cx + dx * L, cy + dy * L);
  paint.stops.forEach(([o, c]) => g.addColorStop(clamp01(o), c));
  return g;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, rr);
  else ctx.rect(x, y, w, h);
}

// ─────────────────────────────────────────────────────────────────────────────
// Text with layered treatments
// ─────────────────────────────────────────────────────────────────────────────

interface DrawOpts {
  fill: string | CanvasGradient;
  /** Optional tint painted over a gradient fill (active-word colour on gradient styles). */
  tint?: { color: string; amount: number };
  glitch: number;
  jitter: number;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  px: number,
  style: CaptionStyle,
  o: DrawOpts,
) {
  const { stroke, shadow, glow, extrude } = style;
  const strokeW = stroke.width * px * 2; // centred stroke; the fill hides the inner half

  const outline = () => {
    if (strokeW > 0.01) {
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.lineWidth = strokeW;
    }
  };

  // 1 · Extrusion (stacked copies → solid 3-D block)
  if (extrude.depth > 0) {
    const n = Math.min(40, Math.max(1, Math.ceil((extrude.depth * px) / 1.5)));
    const step = (extrude.depth * px) / n;
    const a = (extrude.angle * Math.PI) / 180;
    ctx.save();
    outline();
    for (let k = n; k >= 1; k--) {
      const ox = Math.cos(a) * step * k;
      const oy = Math.sin(a) * step * k;
      if (strokeW > 0.01) {
        ctx.strokeStyle = extrude.color;
        ctx.strokeText(text, x + ox, y + oy);
      }
      ctx.fillStyle = extrude.color;
      ctx.fillText(text, x + ox, y + oy);
    }
    ctx.restore();
  }

  // 2 · Soft drop shadow (cast by the stroke silhouette when there is one)
  if (shadow.blur > 0 || shadow.x !== 0 || shadow.y !== 0) {
    ctx.save();
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur * px;
    ctx.shadowOffsetX = shadow.x * px;
    ctx.shadowOffsetY = shadow.y * px;
    if (strokeW > 0.01) {
      outline();
      ctx.strokeStyle = stroke.color;
      ctx.strokeText(text, x, y);
    } else {
      ctx.fillStyle = o.fill;
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  }

  // 3 · Glow (stacked blurred passes)
  if (glow.strength > 0 && glow.blur > 0) {
    ctx.save();
    ctx.shadowColor = glow.color;
    ctx.fillStyle = o.fill;
    for (let k = 0; k < glow.strength; k++) {
      ctx.shadowBlur = glow.blur * px * (1 + k * 0.7);
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  }

  // 4 · RGB split (glitch entrance)
  if (o.glitch > 0.02) {
    const amt = px * 0.07 * o.glitch;
    ctx.save();
    ctx.globalAlpha *= 0.85;
    ctx.fillStyle = '#00E5FF';
    ctx.fillText(text, x - amt * (0.6 + o.jitter), y);
    ctx.fillStyle = '#FF2E7E';
    ctx.fillText(text, x + amt * (0.6 + o.jitter), y + amt * 0.25);
    ctx.restore();
  }

  // 5 · Stroke, 6 · Fill
  if (strokeW > 0.01) {
    ctx.save();
    outline();
    ctx.strokeStyle = stroke.color;
    ctx.strokeText(text, x, y);
    ctx.restore();
  }
  ctx.fillStyle = o.fill;
  ctx.fillText(text, x, y);
  if (o.tint && o.tint.amount > 0.005) {
    ctx.save();
    ctx.globalAlpha *= o.tint.amount;
    ctx.fillStyle = o.tint.color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Frame
// ─────────────────────────────────────────────────────────────────────────────

export interface RenderResult {
  /** Caption block rectangle in canvas pixels (for hit-testing / dragging), or null. */
  bounds: { x: number; y: number; w: number; h: number } | null;
}
const NOTHING: RenderResult = { bounds: null };

export function findSegment(segments: Segment[], t: number): Segment | undefined {
  // Captions linger 0.15s after their end; if the next one has already started, it wins.
  let hit: Segment | undefined;
  for (let i = 0; i < segments.length; i++) {
    const s = segments[i];
    if (t >= s.start && t <= s.end + 0.15 && (!hit || s.start >= hit.start)) hit = s;
  }
  return hit;
}

function supportsFilter(ctx: CanvasRenderingContext2D): boolean {
  try {
    return 'filter' in ctx && typeof (ctx as any).filter === 'string';
  } catch {
    return false;
  }
}

export function renderCaptions(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  time: number,
  segments: Segment[],
  style: CaptionStyle,
): RenderResult {
  const t = time - style.syncOffset;
  const seg = findSegment(segments, t);
  if (!seg) return NOTHING;
  const words = segmentWords(seg);
  if (!words.length) return NOTHING;

  // Merge speaker color and per-segment style overrides if present
  let activeStyle = style;
  const speakerStyle = getSpeakerStyle(seg.speaker);
  if (speakerStyle) {
    activeStyle = {
      ...activeStyle,
      highlight: {
        ...activeStyle.highlight,
        color: speakerStyle.color,
      },
    };
  }

  if (seg.styleOverride) {
    const ov = seg.styleOverride;
    if (ov.customStyle) {
      activeStyle = {
        ...activeStyle,
        ...ov.customStyle,
        font: { ...activeStyle.font, ...(ov.customStyle.font || {}) },
        layout: { ...activeStyle.layout, ...(ov.customStyle.layout || {}) },
        stroke: { ...activeStyle.stroke, ...(ov.customStyle.stroke || {}) },
        shadow: { ...activeStyle.shadow, ...(ov.customStyle.shadow || {}) },
        glow: { ...activeStyle.glow, ...(ov.customStyle.glow || {}) },
        extrude: { ...activeStyle.extrude, ...(ov.customStyle.extrude || {}) },
        plate: { ...activeStyle.plate, ...(ov.customStyle.plate || {}) },
        highlight: { ...activeStyle.highlight, ...(ov.customStyle.highlight || {}) },
        reveal: { ...activeStyle.reveal, ...(ov.customStyle.reveal || {}) },
        motion: { ...activeStyle.motion, ...(ov.customStyle.motion || {}) },
      };
    }
    activeStyle = {
      ...activeStyle,
      layout: {
        ...activeStyle.layout,
        x: ov.positionX !== undefined ? ov.positionX : activeStyle.layout.x,
        y: ov.positionY !== undefined ? ov.positionY : activeStyle.layout.y,
      },
      font: {
        ...activeStyle.font,
        family: ov.fontFamily || activeStyle.font.family,
        weight: ov.fontWeight || activeStyle.font.weight,
        size:
          ov.fontSize !== undefined
            ? ov.fontSize
            : ov.scale !== undefined
              ? activeStyle.font.size * ov.scale
              : activeStyle.font.size,
        underline: ov.underline !== undefined ? ov.underline : activeStyle.font.underline,
        italic: ov.italic !== undefined ? ov.italic : activeStyle.font.italic,
        textCase: ov.textCase !== undefined ? ov.textCase : activeStyle.font.textCase,
      },
      fill: ov.fillColor || activeStyle.fill,
      stroke: ov.strokeColor
        ? { ...activeStyle.stroke, color: ov.strokeColor }
        : activeStyle.stroke,
      highlight: ov.highlightColor
        ? { ...activeStyle.highlight, color: ov.highlightColor }
        : activeStyle.highlight,
    };
  }

  const pages = buildPages(seg, words, activeStyle.layout.wordsPerPage);
  let pageIdx = -1;
  for (let k = pages.length - 1; k >= 0; k--) {
    if (t >= pages[k].start) {
      pageIdx = k;
      break;
    }
  }
  if (pageIdx < 0) return NOTHING;
  const page = pages[pageIdx];
  const visEnd = page.isLast ? seg.end + 0.15 : pages[pageIdx + 1].start;

  const texts = page.words.map((w) => applyCase(w.text, activeStyle.font.textCase));
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const L = getLayout(ctx, seg, pageIdx, texts, activeStyle, W, H);
  const px = L.px;
  ctx.font = canvasFont(activeStyle, px);
  setSpacing(ctx, L.tracking * px);

  // Block origin (centre-anchored, kept inside the frame)
  const margin = Math.min(W, H) * 0.03;
  let bx = W * activeStyle.layout.x - L.w / 2;
  let by = H * activeStyle.layout.y - L.h / 2;
  if (L.w < W - margin * 2) bx = Math.min(Math.max(bx, margin), W - margin - L.w);
  if (L.h < H - margin * 2) by = Math.min(Math.max(by, margin), H - margin - L.h);

  const m = activeStyle.motion;
  const hl = activeStyle.highlight;
  const inDur = Math.max(0.001, m.inMs / 1000);
  const stagger = m.stagger / 1000;
  const charMode = m.unit === 'char' && L.words.some((w) => w.chars);
  const filterOK = supportsFilter(ctx);

  // ── Page-level exit
  let pageAlpha = 1;
  let pageScale = 1;
  let pageDy = 0;
  if (m.out !== 'none') {
    const pOut = ease('out', 1 - clamp01((visEnd - t) / Math.max(0.001, m.outMs / 1000)));
    if (m.out === 'fade') pageAlpha = 1 - pOut;
    if (m.out === 'slide-down') {
      pageDy = pOut * px * 0.3;
      pageAlpha = 1 - pOut;
    }
    if (m.out === 'shrink') {
      pageScale = 1 - 0.14 * pOut;
      pageAlpha = 1 - pOut;
    }
  }
  if (pageAlpha <= 0.002) {
    ctx.restore();
    return NOTHING;
  }
  ctx.globalAlpha = pageAlpha;
  if (pageScale !== 1 || pageDy !== 0) {
    const cx = bx + L.w / 2;
    const cy = by + L.h / 2;
    ctx.translate(cx, cy + pageDy);
    ctx.scale(pageScale, pageScale);
    ctx.translate(-cx, -cy);
  }

  // ── Active word
  let active = -1;
  for (let i = 0; i < page.words.length; i++) if (t >= page.words[i].start) active = i;

  // Emphasis (pop) per word, and the sideways shift that keeps neighbours from colliding with it
  const emph: number[] = page.words.map((w) => {
    if (hl.scale === 1 || t < w.start) return 1;
    const fallP = t > w.end ? ease('out', clamp01((t - w.end) / 0.14)) : 0;
    const popP = spring(clamp01((t - w.start) / 0.3), m.bounce) * (1 - fallP);
    return 1 + (hl.scale - 1) * popP;
  });
  const shift: number[] = new Array(page.words.length).fill(0);
  if (hl.scale !== 1) {
    const lines = new Map<number, number[]>();
    L.words.forEach((wl, i) => lines.set(wl.line, [...(lines.get(wl.line) ?? []), i]));
    lines.forEach((idxs) => {
      const extra = idxs.map((i) => (emph[i] - 1) * (L.words[i].w + 2 * style.stroke.width * px));
      const total = extra.reduce((a, b) => a + b, 0);
      let cum = 0;
      idxs.forEach((i, k) => {
        shift[i] = cum + extra[k] / 2 - total / 2;
        cum += extra[k];
      });
    });
  }

  const lineTop = (li: number) => by + li * L.lineBox;
  const wordRect = (i: number) => {
    const wl = L.words[i];
    return {
      x: bx + wl.x + shift[i] - hl.boxPadX * px,
      y: lineTop(wl.line) + L.baseline - L.asc * 0.92 - hl.boxPadY * px,
      w: wl.w + hl.boxPadX * px * 2,
      h: (L.asc + L.desc) * 0.92 + hl.boxPadY * px * 2,
    };
  };

  // ── Plate behind the text
  const pagePIn = ease('out', clamp01((t - page.start) / Math.max(0.12, inDur)));
  if (style.plate.mode !== 'none') {
    const pl = style.plate;
    ctx.save();
    ctx.globalAlpha *= pagePIn;
    ctx.fillStyle = pl.color;
    const rects =
      pl.mode === 'block'
        ? [
            {
              x: bx - pl.padX * px,
              y: by - pl.padY * px,
              w: L.w + pl.padX * 2 * px,
              h: L.h + pl.padY * 2 * px,
            },
          ]
        : L.lineW.map((lw, li) => ({
            x: bx + L.lineX[li] - pl.padX * px,
            y: lineTop(li) + (L.lineBox - px * 1.18) / 2 - pl.padY * px,
            w: lw + pl.padX * 2 * px,
            h: px * 1.18 + pl.padY * 2 * px,
          }));
    rects.forEach((r) => {
      roundRect(ctx, r.x, r.y, r.w, r.h, pl.radius * px);
      ctx.fill();
    });
    ctx.restore();
  }

  // ── Sliding highlight box (under the text)
  if (hl.mode === 'box' && active >= 0) {
    const cur = wordRect(active);
    const prev = active > 0 ? wordRect(active - 1) : null;
    const slide = ease('out', clamp01((t - page.words[active].start) / 0.11));
    const r = prev
      ? {
          x: lerp(prev.x, cur.x, slide),
          y: lerp(prev.y, cur.y, slide),
          w: lerp(prev.w, cur.w, slide),
          h: lerp(prev.h, cur.h, slide),
        }
      : cur;
    const enter = prev ? 1 : ease('out', clamp01((t - page.words[0].start) / 0.12));
    ctx.save();
    ctx.globalAlpha *= enter;
    const activeColor = page.words[active]?.highlightColor || hl.color;
    ctx.fillStyle = activeColor;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const s = prev ? 1 : 0.85 + 0.15 * enter;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    roundRect(ctx, -r.w / 2, -r.h / 2, r.w, r.h, hl.boxRadius * px);
    ctx.fill();
    ctx.restore();
  }

  // ── Words
  let charCounter = 0;
  for (let i = 0; i < page.words.length; i++) {
    const w = page.words[i];
    const wl = L.words[i];
    const x0 = bx + wl.x + shift[i];
    const y0 = lineTop(wl.line) + L.baseline;

    // Emphasis amounts for this word
    const started = t >= w.start;
    const rise = started ? ease('out', clamp01((t - w.start) / 0.07)) : 0;
    const fall = t > w.end ? ease('out', clamp01((t - w.end) / 0.14)) : 0;
    let colourAmt = hl.keep ? rise : rise * (1 - fall);
    if (hl.mode === 'box') {
      const nextStart = i + 1 < page.words.length ? page.words[i + 1].start : w.end;
      const boxIn = started ? ease('out', clamp01((t - w.start) / 0.11)) : 0;
      const boxOut = t > nextStart ? ease('out', clamp01((t - nextStart) / 0.11)) : 0;
      colourAmt = boxIn * (1 - boxOut);
    }
    const isActive = i === active;
    const wordHlColor = w.highlightColor || hl.color;
    let emphScale = emph[i];
    if (w.emphasis === 'pop' && (isActive || (t >= w.start && t <= w.end))) {
      emphScale *= 1.28;
    }
    const isShake = w.emphasis === 'shake' && (isActive || (t >= w.start && t <= w.end));
    const shakeDx = isShake ? Math.sin(t * 70 + i * 5) * px * 0.08 : 0;
    const shakeDy = isShake ? Math.cos(t * 60 + i * 7) * px * 0.06 : 0;

    let dimAlpha = 1;
    if (activeStyle.reveal.dimUnspoken < 1 && activeStyle.reveal.mode === 'page') {
      dimAlpha = lerp(activeStyle.reveal.dimUnspoken, 1, ease('out', clamp01((t - w.start) / 0.1)));
    }

    // Colour for this word
    let fill: Paint = activeStyle.fill;
    let tint: DrawOpts['tint'];
    const hasWordHl = !!w.highlightColor;
    if (hl.mode === 'color' || (hl.mode === 'sweep' && hl.keep && t > w.end) || hasWordHl) {
      const amt =
        hl.mode === 'sweep'
          ? t > w.end
            ? 1
            : 0
          : hasWordHl
            ? isActive || (hl.keep && t > w.end)
              ? 1
              : colourAmt
            : colourAmt;
      if (!isGradient(activeStyle.fill)) fill = mixColor(activeStyle.fill, wordHlColor, amt);
      else tint = { color: wordHlColor, amount: amt };
    } else if (hl.mode === 'box' && hl.textColor) {
      if (!isGradient(activeStyle.fill)) fill = mixColor(activeStyle.fill, hl.textColor, colourAmt);
      else tint = { color: hl.textColor, amount: colourAmt };
    }

    const units = charMode && wl.chars ? wl.chars : [{ t: wl.text, x: 0, w: wl.w }];
    const pivotX = x0 + wl.w / 2;
    const pivotY = y0 - px * 0.32;
    const wobbleDeg = m.wobble ? (hash01(page.first + i + 1, 3) * 2 - 1) * m.wobble : 0;

    units.forEach((u, k) => {
      // Entrance timing for this unit
      let base: number;
      const idx = charMode ? charCounter + k : m.unit === 'line' ? wl.line : i;
      if (activeStyle.reveal.mode === 'spoken') base = w.start + (charMode ? k * stagger : 0);
      else base = page.start + idx * stagger;
      const local = t - base;
      if (local < 0) return;
      const p = m.in === 'none' ? 1 : clamp01(local / inDur);
      const tx = inTransform(m.in, p, px, L.lineBox, activeStyle);
      if (tx.alpha <= 0.003) return;

      ctx.save();
      ctx.globalAlpha *= tx.alpha * dimAlpha;

      if (tx.clipBelow) {
        const edge = lineTop(wl.line) + L.lineBox + px * 0.05;
        ctx.beginPath();
        ctx.rect(bx - px, by - px * 2, L.w + px * 2, edge - (by - px * 2));
        ctx.clip();
      }

      // word-level emphasis transform (shared by all of a word's characters)
      if (emphScale !== 1 || wobbleDeg || isShake) {
        ctx.translate(pivotX + shakeDx, pivotY + shakeDy);
        if (wobbleDeg) ctx.rotate((wobbleDeg * Math.PI) / 180);
        ctx.scale(emphScale, emphScale);
        ctx.translate(-pivotX, -pivotY);
      }

      const ux = x0 + u.x;
      const upx = ux + u.w / 2;
      ctx.translate(tx.dx, tx.dy);
      if (tx.scale !== 1) {
        ctx.translate(upx, pivotY);
        ctx.scale(tx.scale, tx.scale);
        ctx.translate(-upx, -pivotY);
      }
      if (tx.blur > 0.3) {
        if (filterOK) {
          try {
            ctx.filter = `blur(${tx.blur.toFixed(2)}px)`;
          } catch {
            ctx.shadowBlur = Math.min(20, tx.blur * 2);
            ctx.shadowColor = 'rgba(0,0,0,0.4)';
          }
        } else {
          ctx.shadowBlur = Math.min(20, tx.blur * 2);
          ctx.shadowColor = 'rgba(0,0,0,0.4)';
        }
      }

      // Per-word glow accent
      if (w.emphasis === 'glow' && (isActive || (t >= w.start && t <= w.end))) {
        ctx.save();
        ctx.shadowColor = wordHlColor;
        ctx.shadowBlur = px * 0.55;
        ctx.fillStyle = wordHlColor;
        ctx.fillText(u.t, ux, y0);
        ctx.restore();
      }

      const fillStyle = makeFill(ctx, fill, bx, lineTop(wl.line), L.w, L.lineBox);
      const jitter = hash01(Math.floor(t * 30), i * 7 + k);
      drawText(ctx, u.t, ux, y0, px, activeStyle, {
        fill: fillStyle,
        tint,
        glitch: tx.glitch,
        jitter,
      });

      // Karaoke sweep: re-draw the word in the highlight colour, clipped to its progress
      if (hl.mode === 'sweep' && isActive && p >= 0 && t <= w.end + 0.02) {
        const prog = clamp01((t - w.start) / Math.max(0.08, w.end - w.start));
        ctx.save();
        ctx.beginPath();
        ctx.rect(
          x0 - px * 0.2,
          y0 - L.asc - px * 0.3,
          wl.w * prog + px * 0.2,
          L.asc + L.desc + px * 0.6,
        );
        ctx.clip();
        ctx.fillStyle = wordHlColor;
        ctx.fillText(u.t, ux, y0);
        ctx.restore();
      }
      ctx.restore();
    });
    charCounter += units.length;

    // Underline accent (from font style or highlight mode or word emphasis)
    const hasUnderline =
      activeStyle.font.underline || hl.mode === 'underline' || w.emphasis === 'underline';
    if (
      hasUnderline &&
      started &&
      (isActive || activeStyle.font.underline || (hl.keep && t > w.end))
    ) {
      const prog =
        (hl.keep && t > w.end) || activeStyle.font.underline
          ? 1
          : ease('out', clamp01((t - w.start) / 0.16));
      const thick = Math.max(2, px * 0.085);
      ctx.save();
      ctx.fillStyle = wordHlColor;
      roundRect(ctx, x0, y0 + px * 0.13, wl.w * prog, thick, thick / 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.restore();
  return { bounds: { x: bx, y: by, w: L.w, h: L.h } };
}

/** Drop cached layouts (e.g. when the loaded segment list is replaced). */
export function clearCaptionCaches() {
  layoutCache.clear();
}
