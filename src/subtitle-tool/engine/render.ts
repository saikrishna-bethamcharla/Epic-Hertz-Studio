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
  calculateEntranceTransform,
  calculateEmphasisTransform,
  calculateExitTransform,
  type TransformState,
  type EntranceType,
  type EmphasisType,
  type ExitType,
} from './animation';
import {
  COMPLEX_SCRIPT,
  getEffectiveCaptionStyle,
  type CaptionStyle,
  type GradientPaint,
  type InAnim,
  type Paint,
  type WordRole,
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
  emphasis?: 'none' | 'pop' | 'shake' | 'glow' | 'underline' | 'slam' | 'wobble' | 'color-flip';
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
  /** Font size in px for this word (role-based templates vary it per word). */
  px?: number;
  baseline?: number;
  asc?: number;
  desc?: number;
  /** Index into style.wordRoles when the style uses fixed typography roles. */
  role?: number;
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
  /** Top edge of each rendered line, in block-local px. */
  lineTops: number[];
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
      style.wordRoles,
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

function roleStyleFor(style: CaptionStyle, role: WordRole): CaptionStyle {
  return {
    ...style,
    font: {
      ...style.font,
      family: role.family ?? style.font.family,
      weight: role.weight ?? style.font.weight,
      italic: role.italic ?? style.font.italic,
      textCase: role.textCase ?? style.font.textCase,
    },
    fill: role.fill ?? style.fill,
    stroke: { ...style.stroke, ...(role.stroke ?? {}) },
    glow: { ...style.glow, ...(role.glow ?? {}) },
    shadow: { ...style.shadow, ...(role.shadow ?? {}) },
  };
}

/** Assign a role index to each word, repeating the role list when needed. */
function roleIndexesFor(roles: WordRole[], count: number): number[] {
  const out: number[] = [];
  let r = 0;
  while (out.length < count) {
    const n = Math.max(1, Math.floor(roles[r % roles.length].words) || 1);
    for (let k = 0; k < n && out.length < count; k++) out.push(r % roles.length);
    r++;
  }
  return out;
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
  const baseTracking = complex ? 0 : style.font.tracking;
  const maxW = style.layout.widthPct * W;
  const maxLines = Math.max(1, style.layout.maxLines);

  const roles = style.wordRoles && style.wordRoles.length > 0 ? style.wordRoles : null;
  const roleIdx = roles ? roleIndexesFor(roles, texts.length) : [];
  const roleStyles = roles ? roles.map((r) => roleStyleFor(style, r)) : [];
  const rolePx = (i: number) =>
    px * (roles && roleIdx[i] !== undefined ? (roles[roleIdx[i]].scale ?? 1) : 1);

  let widths: number[] = [];
  let lines: number[][] = [];
  let lineSpace: number[] = [];

  for (let attempt = 0; attempt < 10; attempt++) {
    if (roles) {
      widths = texts.map((t, i) => {
        const rs = roleStyles[roleIdx[i]];
        const rpx = rolePx(i);
        ctx.font = canvasFont(rs, rpx);
        setSpacing(ctx, (rs.font.tracking ?? 0) * rpx);
        return ctx.measureText(t).width + (rs.stroke.width ?? 0) * rpx * 1.3;
      });
      // Each role group is its own line: intro line, keyword line, kicker line…
      lines = [];
      texts.forEach((_, i) => {
        const last = lines[lines.length - 1];
        if (!last || roleIdx[last[0]] !== roleIdx[i]) lines.push([i]);
        else last.push(i);
      });
      lineSpace = lines.map((idx) => {
        const rpx = rolePx(idx[0]);
        return rpx * 0.3 + (roleStyles[roleIdx[idx[0]]].stroke.width ?? 0) * rpx * 1.3;
      });
    } else {
      ctx.font = canvasFont(style, px);
      setSpacing(ctx, baseTracking * px);
      let spaceW =
        (ctx.measureText(' ').width || px * 0.3) +
        Math.max(0, style.highlight.scale - 1) * px * 0.25;
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
      lineSpace = lines.map(() => spaceW);

      // Dedicated Mixkit 28 structure: enforce exactly 2 balanced lines for mirror-splash
      if (
        (style.id === 'mirror-splash' || style.id === 'title-mirror-splash') &&
        texts.length >= 2
      ) {
        const mid = Math.ceil(texts.length / 2);
        lines = [
          Array.from({ length: mid }, (_, i) => i),
          Array.from({ length: texts.length - mid }, (_, i) => i + mid),
        ];
        lineSpace = [spaceW, spaceW];
      }
    }

    const lineWidths = lines.map((idx, li) =>
      idx.reduce((sum, i, k) => sum + widths[i] + (k ? lineSpace[li] : 0), 0),
    );
    if (lineWidths.length <= maxLines && lineWidths.every((w) => w <= maxW)) break;
    px *= 0.92;
  }

  const linePx = lines.map((idx) => Math.max(...idx.map((i) => rolePx(i))));
  const ascArr: number[] = [];
  const descArr: number[] = [];
  lines.forEach((idx, li) => {
    if (roles) {
      ctx.font = canvasFont(roleStyles[roleIdx[idx[0]]], linePx[li]);
    } else {
      ctx.font = canvasFont(style, px);
    }
    const m = ctx.measureText('Hg');
    ascArr.push(m.fontBoundingBoxAscent ?? linePx[li] * 0.8);
    descArr.push(m.fontBoundingBoxDescent ?? linePx[li] * 0.2);
  });

  const lineBoxes = lines.map(
    (_, li) =>
      (complex ? Math.max(style.font.lineHeight, 1.42) : style.font.lineHeight) * linePx[li],
  );
  const gaps = lines.map((idx, li) =>
    li === 0 ? 0 : (roles ? (roles[roleIdx[idx[0]]].gap ?? 0) : 0) * px,
  );
  const lineTops: number[] = [];
  let cursorY = 0;
  lines.forEach((_, li) => {
    cursorY += gaps[li];
    lineTops.push(cursorY);
    cursorY += lineBoxes[li];
  });
  const blockH = Math.max(cursorY, 1);

  const lineW = lines.map((idx, li) =>
    idx.reduce((sum, i, k) => sum + widths[i] + (k ? lineSpace[li] : 0), 0),
  );
  const blockW = Math.max(...lineW, 1);
  const lineX = lineW.map((w) =>
    style.layout.align === 'center'
      ? (blockW - w) / 2
      : style.layout.align === 'right'
        ? blockW - w
        : 0,
  );

  const words: WordLayout[] = new Array(texts.length);
  const charMode = style.motion.unit === 'char';
  lines.forEach((idx, li) => {
    let x = lineX[li];
    idx.forEach((i) => {
      const wpx = linePx[li];
      const wl: WordLayout = {
        text: texts[i],
        x,
        w: widths[i],
        line: li,
        px: wpx,
        asc: ascArr[li],
        desc: descArr[li],
        baseline: lineTops[li] + (lineBoxes[li] - (ascArr[li] + descArr[li])) / 2 + ascArr[li],
        role: roles ? roleIdx[i] : undefined,
      };
      if (charMode) {
        if (roles) ctx.font = canvasFont(roleStyles[roleIdx[i]], wpx);
        setSpacing(ctx, (roles ? 0 : baseTracking) * wpx);
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
      x += widths[i] + lineSpace[li];
    });
  });

  return {
    px,
    words,
    lineX,
    lineW,
    w: blockW,
    h: blockH,
    lineBox: Math.max(...lineBoxes),
    baseline: words[0]?.baseline ?? 0,
    asc: ascArr[0] ?? px * 0.8,
    desc: descArr[0] ?? px * 0.2,
    tracking: baseTracking,
    lineTops,
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
  scaleX?: number;
  scaleY?: number;
  dx: number;
  dy: number;
  rotation?: number;
  blur: number;
  glitch: number;
  clipBelow: boolean;
  clip?: TransformState['clip'];
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

  // Dedicated Mixkit 28 Watercolor Typography: clean pastel fill with soft depth shadow
  if (style.id === 'mirror-splash' || style.id === 'title-mirror-splash') {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;

    const shadowDist = Math.max(2, px * 0.035);
    const shadowBlur = Math.max(3, px * 0.05);
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowDist;
    ctx.shadowOffsetY = shadowDist;

    ctx.fillStyle = o.fill;
    if (typeof ctx.fillText === 'function') {
      ctx.fillText(text, x, y);
    }
    ctx.restore();
    return;
  }

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

/** Italiased font string for emphasis; synthesised when the family has no italic face. */
function emphasisItalicFont(style: CaptionStyle, px: number): string {
  const f = canvasFont(style, px);
  return f.startsWith('italic') ? f : `italic ${f}`;
}

/** Accent colour for a word: explicit override, then the template cycle, then the style colour. */
function accentColorAt(hl: CaptionStyle['highlight'], wordIndex: number): string {
  if (hl.colors && hl.colors.length > 0) {
    return hl.colors[Math.abs(wordIndex) % hl.colors.length];
  }
  return hl.color;
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
    activeStyle = getEffectiveCaptionStyle(activeStyle, seg.styleOverride);
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

  const pageRoles =
    activeStyle.wordRoles && activeStyle.wordRoles.length > 0 ? activeStyle.wordRoles : null;
  const pageRoleIdx = pageRoles ? roleIndexesFor(pageRoles, page.words.length) : [];
  const texts = page.words.map((w, i) =>
    applyCase(
      w.text,
      pageRoleIdx.length
        ? (pageRoles![pageRoleIdx[i]].textCase ?? activeStyle.font.textCase)
        : activeStyle.font.textCase,
    ),
  );
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
  let pageDx = 0;
  let pageRotation = 0;
  let pageBlur = 0;
  let pageClip: TransformState['clip'] | undefined;

  const exitType = m.exitType ?? (m.out === 'shrink' ? 'scale-out' : (m.out as ExitType));
  const isCustomExit =
    m.exitType !== undefined ||
    [
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
      'shrink',
    ].includes(m.out as string);

  if (m.out !== 'none') {
    const pOutRaw = 1 - clamp01((visEnd - t) / Math.max(0.001, m.outMs / 1000));
    if (isCustomExit && exitType) {
      const exitTx = calculateExitTransform(
        exitType,
        pOutRaw,
        px,
        m.easing ?? 'easeOutCubic',
        m.exitParams,
      );
      pageAlpha = exitTx.alpha;
      pageScale = exitTx.scale;
      pageDx = exitTx.dx;
      pageDy = exitTx.dy;
      pageRotation = exitTx.rotation ?? 0;
      pageBlur = exitTx.blur ?? 0;
      pageClip = exitTx.clip;
    } else {
      const pOut = ease('out', pOutRaw);
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
  }
  if (pageAlpha <= 0.002) {
    ctx.restore();
    return NOTHING;
  }
  ctx.globalAlpha = pageAlpha;
  if (pageScale !== 1 || pageDy !== 0 || pageDx !== 0 || pageRotation !== 0) {
    const cx = bx + L.w / 2;
    const cy = by + L.h / 2;
    ctx.translate(cx + pageDx, cy + pageDy);
    if (pageRotation) ctx.rotate((pageRotation * Math.PI) / 180);
    ctx.scale(pageScale, pageScale);
    ctx.translate(-cx, -cy);
  }
  if (pageClip?.rect) {
    const wipe = pageClip.wipeProgress ?? 1;
    ctx.beginPath();
    ctx.rect(bx - px, by - px, (L.w + px * 2) * wipe, L.h + px * 2);
    ctx.clip();
  }
  if (pageBlur > 0.3 && filterOK) {
    try {
      ctx.filter = `blur(${pageBlur.toFixed(2)}px)`;
    } catch {
      // safe fallback
    }
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

  const lineTop = (li: number) => by + (L.lineTops ? L.lineTops[li] : li * L.lineBox);
  const wordRect = (i: number) => {
    const wl = L.words[i];
    const asc = wl.asc ?? L.asc;
    const desc = wl.desc ?? L.desc;
    const baseline = wl.baseline !== undefined ? by + wl.baseline : lineTop(wl.line) + L.baseline;
    return {
      x: bx + wl.x + shift[i] - hl.boxPadX * px,
      y: baseline - asc * 0.92 - hl.boxPadY * px,
      w: wl.w + hl.boxPadX * px * 2,
      h: (asc + desc) * 0.92 + hl.boxPadY * px * 2,
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

  // ── Background Splash Burst for Mirror Splash (behind text)
  if (activeStyle.id === 'mirror-splash' || activeStyle.id === 'title-mirror-splash') {
    drawCaptionMirrorSplashBackground(ctx, bx, by, L.w, L.h, px, t, page.start, visEnd, inDur);
  }

  // ── Sliding highlight box (under the text)
  if ((hl.mode === 'box' || hl.emphasisType === 'highlight-box-sweep') && active >= 0) {
    const cur = wordRect(active);
    const prev = active > 0 ? wordRect(active - 1) : null;
    const wordProg = clamp01(
      (t - page.words[active].start) /
        Math.max(0.06, page.words[active].end - page.words[active].start),
    );
    let sweepProgress = 1;
    if (hl.emphasisType === 'highlight-box-sweep') {
      const sweepTx = calculateEmphasisTransform(
        'highlight-box-sweep',
        wordProg,
        px,
        'spring',
        hl.emphasisParams,
      );
      sweepProgress = sweepTx.clip?.wipeProgress ?? 1;
    }
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
    const activeColor =
      page.words[active]?.highlightColor || accentColorAt(hl, page.first + active);
    ctx.fillStyle = activeColor;
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const s = prev ? 1 : 0.85 + 0.15 * enter;
    ctx.translate(cx, cy);
    ctx.scale(s, s);
    if (!prev && sweepProgress < 1) {
      roundRect(ctx, -r.w / 2, -r.h / 2, r.w * sweepProgress, r.h, hl.boxRadius * px);
    } else {
      roundRect(ctx, -r.w / 2, -r.h / 2, r.w, r.h, hl.boxRadius * px);
    }
    ctx.fill();
    ctx.restore();
  }

  // ── Words
  let charCounter = 0;
  for (let i = 0; i < page.words.length; i++) {
    const w = page.words[i];
    const wl = L.words[i];
    const role =
      wl.role !== undefined && activeStyle.wordRoles ? activeStyle.wordRoles[wl.role] : undefined;
    const wordStyle = role ? roleStyleFor(activeStyle, role) : activeStyle;
    const wpx = wl.px ?? px;
    const x0 = bx + wl.x + shift[i];
    const y0 = wl.baseline !== undefined ? by + wl.baseline : lineTop(wl.line) + L.baseline;

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
    const wordHlColor = w.highlightColor || accentColorAt(hl, page.first + i);
    let emphScale = emph[i];
    let emphDx = 0;
    let emphDy = 0;
    let emphRotation = 0;
    let emphBlur = 0;
    let emphColorMix = colourAmt;

    let activeEmphasisType: EmphasisType | undefined = hl.emphasisType;
    if (!activeEmphasisType && w.emphasis) {
      if (w.emphasis === 'pop') activeEmphasisType = 'pop';
      else if (w.emphasis === 'shake') activeEmphasisType = 'shake';
      else if (w.emphasis === 'glow') activeEmphasisType = 'glow-pulse';
      else if (w.emphasis === 'slam') activeEmphasisType = 'scale-slam';
      else if (w.emphasis === 'wobble') activeEmphasisType = 'wobble';
      else if (w.emphasis === 'color-flip') activeEmphasisType = 'color-flip';
    }

    if (activeEmphasisType && (isActive || (t >= w.start && t <= w.end))) {
      const wordProg = clamp01((t - w.start) / Math.max(0.06, w.end - w.start));
      const emphTx = calculateEmphasisTransform(
        activeEmphasisType,
        wordProg,
        wpx,
        'spring',
        hl.emphasisParams,
      );
      emphScale = emphTx.scale;
      emphDx = emphTx.dx;
      emphDy = emphTx.dy;
      emphRotation = emphTx.rotation ?? 0;
      emphBlur = emphTx.blur ?? 0;
      emphColorMix = Math.max(colourAmt, emphTx.colorMix ?? 0);
    } else {
      if (w.emphasis === 'pop' && (isActive || (t >= w.start && t <= w.end))) {
        emphScale *= 1.28;
      }
      const isShake = w.emphasis === 'shake' && (isActive || (t >= w.start && t <= w.end));
      if (isShake) {
        emphDx = Math.sin(t * 70 + i * 5) * wpx * 0.08;
        emphDy = Math.cos(t * 60 + i * 7) * wpx * 0.06;
      }
    }

    let dimAlpha = 1;
    if (activeStyle.reveal.dimUnspoken < 1 && activeStyle.reveal.mode === 'page') {
      dimAlpha = lerp(activeStyle.reveal.dimUnspoken, 1, ease('out', clamp01((t - w.start) / 0.1)));
    }

    // Colour for this word
    let fill: Paint = wordStyle.fill;
    let tint: DrawOpts['tint'];
    const hasWordHl = !!w.highlightColor;
    const isMirrorSplash =
      activeStyle.id === 'mirror-splash' || activeStyle.id === 'title-mirror-splash';

    if (isMirrorSplash) {
      // Authentic Mixkit 28: 2 lines with top line ONE colour (Cyan #A7F7FF) and bottom line ONE colour (Yellow #FFFA6F)
      const isTopLine = L.lineW.length > 1 ? wl.line === 0 : i < Math.ceil(page.words.length / 2);
      fill = isTopLine ? '#A7F7FF' : '#FFFA6F';
    } else if (
      hl.mode === 'color' ||
      (hl.mode === 'sweep' && hl.keep && t > w.end) ||
      hasWordHl ||
      hl.emphasisType
    ) {
      const amt =
        hl.mode === 'sweep'
          ? t > w.end
            ? 1
            : 0
          : hasWordHl
            ? isActive || (hl.keep && t > w.end)
              ? 1
              : emphColorMix
            : emphColorMix;
      if (!isGradient(wordStyle.fill)) fill = mixColor(wordStyle.fill, wordHlColor, amt);
      else tint = { color: wordHlColor, amount: amt };
    } else if (hl.mode === 'box' && hl.textColor) {
      if (!isGradient(wordStyle.fill)) fill = mixColor(wordStyle.fill, hl.textColor, colourAmt);
      else tint = { color: hl.textColor, amount: colourAmt };
    }

    // Italic accent on the spoken word (opt-in, synthesised when no italic face exists)
    const wordItalic = !!hl.italic && (isActive || emphColorMix > 0.5);
    ctx.font = wordItalic ? emphasisItalicFont(wordStyle, wpx) : canvasFont(wordStyle, wpx);

    const units = charMode && wl.chars ? wl.chars : [{ t: wl.text, x: 0, w: wl.w }];
    const pivotX = x0 + wl.w / 2;
    const pivotY = y0 - wpx * 0.32;
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
      let resolvedEntranceType: EntranceType;
      if (m.entranceType) {
        resolvedEntranceType = m.entranceType;
      } else {
        const inStr = (m.in as string) || 'none';
        if (inStr === 'pop' || inStr === 'zoom') resolvedEntranceType = 'scale-pop';
        else if (inStr === 'slide-up') resolvedEntranceType = 'slide-up';
        else if (inStr === 'slide-down' || inStr === 'drop') resolvedEntranceType = 'drop-in';
        else if (inStr === 'bounce') resolvedEntranceType = 'bounce-in';
        else if (inStr === 'blur') resolvedEntranceType = 'blur-in';
        else if (inStr === 'mask-up') resolvedEntranceType = 'clip-reveal';
        else if (inStr === 'typewriter') resolvedEntranceType = 'typewriter';
        else if (inStr === 'fade') resolvedEntranceType = 'fade';
        else resolvedEntranceType = inStr as EntranceType;
      }

      const isCustomEntrance =
        m.entranceType !== undefined ||
        [
          'scale-pop',
          'rotate-in',
          'blur-in',
          'bounce-in',
          'wave',
          'flip-in',
          'drop-in',
          'clip-reveal',
          'elastic-pop',
          'rack-focus',
          'tracking-in',
          'slide-left',
          'slide-right',
          'slide-up',
          'typewriter',
          'fade',
          'pop',
          'zoom',
          'bounce',
          'blur',
          'drop',
          'mask-up',
        ].includes(m.in as string);

      let tx: {
        alpha: number;
        scale: number;
        scaleX?: number;
        scaleY?: number;
        dx: number;
        dy: number;
        rotation?: number;
        blur: number;
        glitch: number;
        clipBelow?: boolean;
        clip?: TransformState['clip'];
      };

      if (isCustomEntrance && resolvedEntranceType) {
        const entTx = calculateEntranceTransform(
          resolvedEntranceType,
          p,
          px,
          L.lineBox,
          m.easing ?? 'easeOutCubic',
          m.entranceParams ?? { bounce: m.bounce },
        );
        tx = {
          alpha: entTx.alpha,
          scale: entTx.scale,
          scaleX: entTx.scaleX,
          scaleY: entTx.scaleY,
          dx: entTx.dx,
          dy: entTx.dy,
          rotation: entTx.rotation ?? 0,
          blur: entTx.blur ?? 0,
          glitch: entTx.glitch ?? 0,
          clip: entTx.clip,
        };
      } else {
        tx = inTransform(m.in as InAnim, p, px, L.lineBox, activeStyle);
      }
      if (emphBlur > 0) {
        tx.blur = Math.max(tx.blur, emphBlur);
      }

      if (tx.alpha <= 0.003) return;

      ctx.save();
      ctx.globalAlpha *= tx.alpha * dimAlpha;

      const ux = x0 + u.x;
      const upx = ux + u.w / 2;

      if (tx.clip?.rect) {
        const wipe = tx.clip.wipeProgress ?? 1;
        ctx.beginPath();
        ctx.rect(
          ux - wpx * 0.1,
          y0 - (wl.asc ?? L.asc) - wpx * 0.2,
          (u.w + wpx * 0.2) * wipe,
          (wl.asc ?? L.asc) + (wl.desc ?? L.desc) + wpx * 0.4,
        );
        ctx.clip();
      } else if (tx.clipBelow) {
        const edge = y0 + (wl.desc ?? L.desc) + wpx * 0.05;
        ctx.beginPath();
        ctx.rect(bx - px, by - px * 2, L.w + px * 2, edge - (by - px * 2));
        ctx.clip();
      }

      // word-level emphasis transform (shared by all of a word's characters)
      if (emphScale !== 1 || wobbleDeg || emphRotation !== 0 || emphDx !== 0 || emphDy !== 0) {
        ctx.translate(pivotX + emphDx, pivotY + emphDy);
        if (wobbleDeg || emphRotation) ctx.rotate(((wobbleDeg + emphRotation) * Math.PI) / 180);
        ctx.scale(emphScale, emphScale);
        ctx.translate(-pivotX, -pivotY);
      }

      ctx.translate(tx.dx, tx.dy);

      if (tx.rotation) {
        ctx.translate(upx, pivotY);
        ctx.rotate((tx.rotation * Math.PI) / 180);
        ctx.translate(-upx, -pivotY);
      }

      const sx = (tx.scaleX ?? 1) * tx.scale;
      const sy = (tx.scaleY ?? 1) * tx.scale;
      if (sx !== 1 || sy !== 1) {
        ctx.translate(upx, pivotY);
        ctx.scale(sx, sy);
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
        ctx.shadowBlur = wpx * 0.55;
        ctx.fillStyle = wordHlColor;
        ctx.fillText(u.t, ux, y0);
        ctx.restore();
      }

      const fillStyle = makeFill(
        ctx,
        fill,
        bx,
        y0 - (wl.asc ?? L.asc),
        L.w,
        (wl.asc ?? L.asc) + (wl.desc ?? L.desc),
      );
      const jitter = hash01(Math.floor(t * 30), i * 7 + k);
      drawText(ctx, u.t, ux, y0, wpx, wordStyle, {
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
          x0 - wpx * 0.2,
          y0 - (wl.asc ?? L.asc) - wpx * 0.3,
          wl.w * prog + wpx * 0.2,
          (wl.asc ?? L.asc) + (wl.desc ?? L.desc) + wpx * 0.6,
        );
        ctx.clip();
        ctx.fillStyle = wordHlColor;
        ctx.fillText(u.t, ux, y0);
        ctx.restore();
      }
      ctx.restore();
    });
    charCounter += units.length;
    ctx.font = canvasFont(activeStyle, px);

    // Underline accent (from font style or highlight mode or word emphasis)
    const hasUnderline =
      activeStyle.font.underline ||
      hl.mode === 'underline' ||
      w.emphasis === 'underline' ||
      hl.emphasisType === 'underline-draw';
    if (
      hasUnderline &&
      started &&
      (isActive || activeStyle.font.underline || (hl.keep && t > w.end))
    ) {
      const prog =
        (hl.keep && t > w.end) || activeStyle.font.underline
          ? 1
          : ease('out', clamp01((t - w.start) / 0.16));
      const thick = Math.max(2, wpx * 0.085);
      ctx.save();
      ctx.fillStyle = wordHlColor;
      roundRect(ctx, x0, y0 + px * 0.13, wl.w * prog, thick, thick / 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // ── Dedicated Graphic Overlays for MOGRT Caption Styles
  if (activeStyle.id === 'spin-and-twist' || activeStyle.id === 'title-spin-twist') {
    drawCaptionSpinTwistBrackets(ctx, bx, by, L.w, L.h, px, t, page.start, inDur, activeStyle);
  }
  if (activeStyle.id === 'mirror-splash' || activeStyle.id === 'title-mirror-splash') {
    drawCaptionMirrorSplashForeground(ctx, bx, by, L.w, L.h, px, t, page.start, visEnd, inDur);
  }

  ctx.restore();
  return { bounds: { x: bx, y: by, w: L.w, h: L.h } };
}

function drawCaptionSpinTwistBrackets(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  w: number,
  h: number,
  px: number,
  t: number,
  pageStart: number,
  inDur: number,
  style: CaptionStyle,
) {
  if (
    typeof ctx.beginPath !== 'function' ||
    typeof ctx.moveTo !== 'function' ||
    typeof ctx.lineTo !== 'function' ||
    typeof ctx.stroke !== 'function'
  ) {
    return;
  }

  const pIn = clamp01((t - pageStart) / Math.max(0.001, inDur));
  const spinP = clamp01(pIn / 0.45);
  const expandP = clamp01((pIn - 0.2) / 0.8);

  const cx = bx + w / 2;
  const cy = by + h / 2;
  const padX = Math.max(16, px * 0.4);
  const padY = Math.max(8, px * 0.2);
  const targetW = w + padX * 2;
  const targetH = h + padY * 2;

  const bracketArm = Math.min(px * 0.6, targetW * 0.18);
  const lineWidth = Math.max(2, px * 0.06);
  const bracketColor = style.highlight.color || '#00D2C4';

  ctx.save();
  // 1. Initial rotating line
  if (spinP < 0.999) {
    const rot = spinP * Math.PI;
    const lineH = Math.min(targetH, targetH * Math.sin(spinP * Math.PI * 0.5));
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.strokeStyle = bracketColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(0, -lineH / 2);
    ctx.lineTo(0, lineH / 2);
    ctx.stroke();
    ctx.restore();
  }

  // 2. Expanding framing brackets [ and ]
  if (expandP > 0.05) {
    const easedExpand = 1 - Math.pow(1 - expandP, 3);
    const curW = targetW * (0.3 + 0.7 * easedExpand);
    const halfW = curW / 2;
    const halfH = targetH / 2;

    ctx.strokeStyle = bracketColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'square';
    ctx.lineJoin = 'miter';

    // Left Bracket [
    ctx.beginPath();
    ctx.moveTo(cx - halfW + bracketArm, cy - halfH);
    ctx.lineTo(cx - halfW, cy - halfH);
    ctx.lineTo(cx - halfW, cy + halfH);
    ctx.lineTo(cx - halfW + bracketArm, cy + halfH);
    ctx.stroke();

    // Right Bracket ]
    ctx.beginPath();
    ctx.moveTo(cx + halfW - bracketArm, cy - halfH);
    ctx.lineTo(cx + halfW, cy - halfH);
    ctx.lineTo(cx + halfW, cy + halfH);
    ctx.lineTo(cx + halfW - bracketArm, cy + halfH);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCaptionMirrorSplashBackground(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  w: number,
  h: number,
  px: number,
  t: number,
  pageStart: number,
  visEnd: number,
  inDur: number,
) {
  if (
    typeof ctx.beginPath !== 'function' ||
    typeof ctx.fill !== 'function' ||
    typeof ctx.save !== 'function' ||
    typeof ctx.restore !== 'function'
  ) {
    return;
  }

  const cx = bx + w / 2;
  const cy = by + h / 2;
  const elapsed = Math.max(0, t - pageStart);
  const remain = Math.max(0, visEnd - t);

  const introP = clamp01(elapsed / Math.max(0.001, inDur));
  const streamP = clamp01(elapsed / (inDur * 0.65));
  const outroP = remain < 0.25 ? clamp01((0.25 - remain) / 0.25) : 0;

  ctx.save();

  // 1. Dual Inward Watercolor Fluid Streams (0s to ~0.4s)
  if (streamP < 0.98) {
    [-1, 1].forEach((dir) => {
      const startX = cx - dir * (w * 1.2 + px * 5);
      const targetX = cx - dir * (px * 0.15);
      const headX = lerp(startX, targetX, Math.pow(streamP, 0.72));
      const wavePhase = streamP * Math.PI * 2.5;
      const headY = cy + Math.sin(wavePhase) * px * 0.22;

      ctx.save();
      ctx.fillStyle = '#A7F7FF';

      const streamLen = Math.min(Math.abs(headX - startX), px * 4.2);
      const tailX = headX - dir * streamLen;
      const headR = px * (0.32 + 0.12 * Math.sin(streamP * Math.PI));

      // Fluid wavy stream body
      if (typeof ctx.moveTo === 'function' && typeof ctx.bezierCurveTo === 'function') {
        ctx.beginPath();
        ctx.moveTo(headX, headY - headR);
        ctx.bezierCurveTo(
          headX + dir * headR * 1.3,
          headY - headR * 0.8,
          headX + dir * headR * 1.3,
          headY + headR * 0.8,
          headX,
          headY + headR,
        );
        ctx.bezierCurveTo(
          headX - dir * streamLen * 0.45,
          headY + headR * 0.55 + Math.cos(wavePhase) * px * 0.15,
          tailX + dir * streamLen * 0.2,
          cy + px * 0.08,
          tailX,
          cy,
        );
        ctx.bezierCurveTo(
          tailX + dir * streamLen * 0.2,
          cy - px * 0.08,
          headX - dir * streamLen * 0.45,
          headY - headR * 0.55 + Math.sin(wavePhase) * px * 0.15,
          headX,
          headY - headR,
        );
        ctx.fill();

        // Watercolor splash fingers branching from head just before impact
        if (streamP > 0.45) {
          const fingerP = (streamP - 0.45) / 0.55;
          const FINGERS = [
            { angle: -0.62, lenMul: 0.85, r: px * 0.12 },
            { angle: -0.22, lenMul: 1.25, r: px * 0.16 },
            { angle: 0.18, lenMul: 1.15, r: px * 0.15 },
            { angle: 0.58, lenMul: 0.8, r: px * 0.11 },
          ];
          FINGERS.forEach((f) => {
            const fLen = px * 0.55 * f.lenMul * fingerP;
            const fx = headX + Math.cos(f.angle) * dir * fLen;
            const fy = headY + Math.sin(f.angle) * fLen;
            ctx.beginPath();
            if (typeof ctx.arc === 'function') {
              ctx.arc(fx, fy, Math.max(2, f.r * fingerP), 0, Math.PI * 2);
            } else {
              ctx.rect(fx - f.r, fy - f.r, f.r * 2, f.r * 2);
            }
            ctx.fill();
          });
        }
      }

      // Trailing watercolor droplet beads
      const BEADS = [
        { distMul: 0.35, offY: -px * 0.16, r: px * 0.085 },
        { distMul: 0.58, offY: px * 0.2, r: px * 0.07 },
        { distMul: 0.78, offY: -px * 0.1, r: px * 0.055 },
        { distMul: 0.98, offY: px * 0.12, r: px * 0.04 },
      ];
      BEADS.forEach((b) => {
        const bxPos = headX - dir * (streamLen * b.distMul);
        const byPos = cy + b.offY + Math.sin(wavePhase + b.distMul * 3.2) * px * 0.08;
        ctx.beginPath();
        if (typeof ctx.arc === 'function') {
          ctx.arc(bxPos, byPos, Math.max(1.5, b.r), 0, Math.PI * 2);
        } else {
          ctx.rect(bxPos - b.r, byPos - b.r, b.r * 2, b.r * 2);
        }
        ctx.fill();
      });

      ctx.restore();
    });
  }

  // 2. Central Watercolor Impact Splatter Bloom (collision eruption)
  if (streamP > 0.4 && streamP < 0.95) {
    const pSplatter = (streamP - 0.4) / 0.55;
    const pEased = Math.sin(pSplatter * Math.PI);
    const R = px * 1.5 * pEased;
    const alpha = Math.max(0, 1 - pSplatter * 0.85);

    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = '#A7F7FF';

    if (typeof ctx.moveTo === 'function' && typeof ctx.quadraticCurveTo === 'function') {
      ctx.beginPath();
      const count = 12;
      for (let i = 0; i <= count; i++) {
        const a = (i / count) * Math.PI * 2;
        const mod = 1 + 0.32 * Math.sin(i * 2.3) + 0.22 * Math.cos(i * 3.7);
        const r = R * mod;
        const sx = cx + Math.cos(a) * r;
        const sy = cy + Math.sin(a) * r * 0.72;
        if (i === 0) ctx.moveTo(sx, sy);
        else {
          const prevA = ((i - 0.5) / count) * Math.PI * 2;
          const prevMod = 1 + 0.38 * Math.sin((i - 0.5) * 2.3);
          const cpx = cx + Math.cos(prevA) * R * prevMod * 1.15;
          const cpy = cy + Math.sin(prevA) * R * prevMod * 0.85;
          ctx.quadraticCurveTo(cpx, cpy, sx, sy);
        }
      }
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Radial Yellow & Cyan Watercolor Teardrop Droplets (framing the 2-line title)
  if (introP > 0.15) {
    const burstP = clamp01((introP - 0.15) / 0.85);
    const easedBurst = 1 - Math.pow(1 - burstP, 3);
    const scaleFactor = (0.35 + 0.65 * easedBurst) * (1 - outroP * 0.85);

    // 18 radial yellow splash teardrop rays replicating Mixkit 28 (thumb.png & definition.json)
    const SPLASH_RAYS = [
      { angle: 0.12, distMul: 1.16, len: px * 0.26, w: px * 0.08, col: '#FFFA6F' },
      { angle: 0.46, distMul: 1.34, len: px * 0.3, w: px * 0.09, col: '#FFFA6F' },
      { angle: 0.78, distMul: 1.08, len: px * 0.18, w: px * 0.06, col: '#A7F7FF' },
      { angle: 1.14, distMul: 1.26, len: px * 0.28, w: px * 0.085, col: '#FFFA6F' },
      { angle: 1.57, distMul: 1.4, len: px * 0.32, w: px * 0.095, col: '#FFFA6F' },
      { angle: 1.94, distMul: 1.12, len: px * 0.2, w: px * 0.065, col: '#A7F7FF' },
      { angle: 2.28, distMul: 1.3, len: px * 0.29, w: px * 0.085, col: '#FFFA6F' },
      { angle: 2.66, distMul: 1.14, len: px * 0.22, w: px * 0.07, col: '#FFFA6F' },
      { angle: 3.14, distMul: 1.32, len: px * 0.31, w: px * 0.09, col: '#FFFA6F' },
      { angle: 3.52, distMul: 1.12, len: px * 0.19, w: px * 0.065, col: '#A7F7FF' },
      { angle: 3.88, distMul: 1.36, len: px * 0.3, w: px * 0.088, col: '#FFFA6F' },
      { angle: 4.24, distMul: 1.1, len: px * 0.21, w: px * 0.07, col: '#FFFA6F' },
      { angle: 4.71, distMul: 1.42, len: px * 0.33, w: px * 0.095, col: '#FFFA6F' },
      { angle: 5.08, distMul: 1.14, len: px * 0.19, w: px * 0.065, col: '#A7F7FF' },
      { angle: 5.48, distMul: 1.33, len: px * 0.29, w: px * 0.085, col: '#FFFA6F' },
      { angle: 5.88, distMul: 1.12, len: px * 0.22, w: px * 0.07, col: '#FFFA6F' },
    ];

    SPLASH_RAYS.forEach((ray) => {
      // Soft breathing hover wave during hold phase
      const breathe = 1 + 0.03 * Math.sin(t * 3.2 + ray.angle * 2);
      const radiusX = (w / 2 + px * 0.72) * scaleFactor * breathe;
      const radiusY = (h / 2 + px * 0.62) * scaleFactor * breathe;

      const rx = cx + Math.cos(ray.angle) * radiusX * ray.distMul;
      const ry = cy + Math.sin(ray.angle) * radiusY * ray.distMul;
      const dropLen = ray.len * scaleFactor;
      const dropW = ray.w * scaleFactor;

      ctx.save();
      ctx.translate(rx, ry);
      if (typeof ctx.rotate === 'function') ctx.rotate(ray.angle);
      ctx.fillStyle = ray.col;

      // Authentic watercolor droplet: inner pointed tail facing center, outer rounded head pointing away
      if (typeof ctx.moveTo === 'function' && typeof ctx.bezierCurveTo === 'function') {
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(dropLen * 0.35, dropW * 0.7, dropLen * 0.75, dropW, dropLen, 0);
        ctx.bezierCurveTo(dropLen * 0.75, -dropW, dropLen * 0.35, -dropW * 0.7, 0, 0);
        ctx.fill();
      } else if (typeof ctx.arc === 'function') {
        ctx.beginPath();
        ctx.arc(dropLen * 0.6, 0, Math.max(1.5, dropW), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(0, -dropW, dropLen, dropW * 2);
      }
      ctx.restore();
    });
  }

  ctx.restore();
}

function drawCaptionMirrorSplashForeground(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  w: number,
  h: number,
  px: number,
  t: number,
  pageStart: number,
  visEnd: number,
  inDur: number,
) {
  if (
    typeof ctx.beginPath !== 'function' ||
    typeof ctx.fill !== 'function' ||
    typeof ctx.save !== 'function' ||
    typeof ctx.restore !== 'function'
  ) {
    return;
  }

  const cx = bx + w / 2;
  const cy = by + h / 2;
  const elapsed = Math.max(0, t - pageStart);
  const remain = Math.max(0, visEnd - t);

  const introP = clamp01(elapsed / Math.max(0.001, inDur));
  const outroP = remain < 0.25 ? clamp01((0.25 - remain) / 0.25) : 0;
  if (introP < 0.2) return;

  ctx.save();
  const popScale = clamp01((introP - 0.2) / 0.8) * (1 - outroP);

  // 4-point cartoon sparkle stars placed around the four corners
  const SPARKLES = [
    {
      offX: -w * 0.52 - px * 0.25,
      offY: -h * 0.45 - px * 0.2,
      baseSize: px * 0.16,
      col: '#FFFFFF',
      speed: 2.5,
    },
    {
      offX: w * 0.52 + px * 0.2,
      offY: -h * 0.4 - px * 0.25,
      baseSize: px * 0.2,
      col: '#FFFA6F',
      speed: 3.2,
    },
    {
      offX: -w * 0.48 - px * 0.18,
      offY: h * 0.45 + px * 0.2,
      baseSize: px * 0.18,
      col: '#A7F7FF',
      speed: 2.8,
    },
    {
      offX: w * 0.5 + px * 0.22,
      offY: h * 0.48 + px * 0.18,
      baseSize: px * 0.15,
      col: '#FFFFFF',
      speed: 3.5,
    },
  ];

  SPARKLES.forEach((sp, idx) => {
    const size = sp.baseSize * popScale * (0.8 + 0.3 * Math.sin(t * sp.speed + idx));
    const rot = t * 1.5 + idx * 1.2;

    ctx.save();
    ctx.translate(cx + sp.offX, cy + sp.offY);
    if (typeof ctx.rotate === 'function') ctx.rotate(rot);
    ctx.fillStyle = sp.col;

    if (typeof ctx.moveTo === 'function' && typeof ctx.quadraticCurveTo === 'function') {
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.quadraticCurveTo(0, 0, size, 0);
      ctx.quadraticCurveTo(0, 0, 0, size);
      ctx.quadraticCurveTo(0, 0, -size, 0);
      ctx.quadraticCurveTo(0, 0, 0, -size);
      ctx.fill();
    } else if (typeof ctx.arc === 'function') {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(2, size), 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(-size, -size, size * 2, size * 2);
    }

    ctx.restore();
  });

  ctx.restore();
}

/** Drop cached layouts (e.g. when the loaded segment list is replaced). */
export function clearCaptionCaches() {
  layoutCache.clear();
}
