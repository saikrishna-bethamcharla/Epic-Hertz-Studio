// ─── Font loading for the caption engine ────────────────────────────────────
// Canvas can only draw with fonts that are already loaded, and it fakes bold when a
// requested weight is missing. So we (a) self-host real faces, (b) load them on demand,
// (c) always snap to a weight we actually have, and (d) tell the renderer when something
// finished loading so cached layouts are rebuilt.

import { getAssetUrl } from '../utils/assetUrl';
import {
  fontById,
  SCRIPT_FONTS,
  type CaptionStyle,
  type FontFile,
  type LowerThirdSpec,
} from './spec';

let version = 0;
const listeners = new Set<() => void>();
const inflight = new Map<string, Promise<void>>();

/** Bumps every time a font face finishes loading; part of layout cache keys. */
export const fontsVersion = () => version;

export function onFontsChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function loadFile(css: string, f: FontFile): Promise<void> {
  const key = `${css}|${f.weight}|${f.style}`;
  let p = inflight.get(key);
  if (!p) {
    p = (async () => {
      if (typeof FontFace === 'undefined' || typeof document === 'undefined') return;
      const face = new FontFace(css, `url(${getAssetUrl(`fonts/${f.file}`)}) format('woff2')`, {
        weight: String(f.weight),
        style: f.style,
        display: 'swap',
      });
      await face.load();
      document.fonts.add(face);
      version++;
      listeners.forEach((cb) => cb());
    })().catch((err) => {
      console.warn('[captions] font failed to load:', css, f.file, err);
    });
    inflight.set(key, p);
  }
  return p;
}

function nearestFile(files: FontFile[], weight: number, italic: boolean): FontFile | undefined {
  const style = italic ? 'italic' : 'normal';
  const pool = files.some((f) => f.style === style)
    ? files.filter((f) => f.style === style)
    : files;
  return [...pool].sort((a, b) => Math.abs(a.weight - weight) - Math.abs(b.weight - weight))[0];
}

/** The weight actually used when drawing (never asks for a weight we can't supply). */
export function effectiveWeight(style: CaptionStyle): number {
  return (
    nearestFile(fontById(style.font.family).files, style.font.weight, style.font.italic)?.weight ??
    style.font.weight
  );
}

export function fontStack(style: CaptionStyle): string {
  const fam = fontById(style.font.family);
  const scripts = SCRIPT_FONTS.map((s) => `"${s.css}"`).join(', ');
  return `"${fam.css}", ${scripts}, "Inter", system-ui, sans-serif`;
}

export function canvasFont(style: CaptionStyle, px: number): string {
  const f = style.font;
  const italic = f.italic ? 'italic ' : '';
  return `${italic}${effectiveWeight(style)} ${px.toFixed(2)}px ${fontStack(style)}`;
}

/** Load the family for this style plus any Indic script fonts the text needs. */
export function ensureFonts(style: CaptionStyle, text = ''): Promise<void> {
  const fam = fontById(style.font.family);
  const tasks: Promise<void>[] = [];
  const file = nearestFile(fam.files, style.font.weight, style.font.italic);
  if (file) tasks.push(loadFile(fam.css, file));
  for (const s of SCRIPT_FONTS) {
    if (s.test.test(text)) {
      const sf = nearestFile(s.files, style.font.weight >= 800 ? 900 : 700, false);
      if (sf) tasks.push(loadFile(s.css, sf));
    }
  }
  return Promise.all(tasks).then(() => undefined);
}

/** Preload a family (used by the font picker so every option previews in its own face). */
/** Load families for all lower thirds plus any Indic script fonts their text needs. */
export function ensureLowerThirdFonts(lowerThirds: LowerThirdSpec[] = []): Promise<void> {
  const tasks: Promise<void>[] = [];
  for (const lt of lowerThirds) {
    const fam = fontById(lt.font.family);
    const file = nearestFile(fam.files, lt.font.weight, false);
    if (file) tasks.push(loadFile(fam.css, file));

    const combinedText = `${lt.name} ${lt.role} ${lt.handle || ''}`;
    for (const s of SCRIPT_FONTS) {
      if (s.test.test(combinedText)) {
        const sf = nearestFile(s.files, lt.font.weight >= 800 ? 900 : 700, false);
        if (sf) tasks.push(loadFile(s.css, sf));
      }
    }
  }
  return Promise.all(tasks).then(() => undefined);
}

export function ensureFamily(id: string): Promise<void> {
  const fam = fontById(id);
  return Promise.all(fam.files.map((f) => loadFile(fam.css, f))).then(() => undefined);
}
