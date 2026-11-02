// ─── TemplateDrawer ─────────────────────────────────────────────────────────
// Right-hand style panel.
//   Presets    – live, animated previews drawn by the real caption engine, using YOUR words.
//   Customize  – typography, fill, highlight, effects, motion and position controls.

import { memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { CaptionStyle, Segment } from './types';
import { PRESETS, type PresetDef, type PresetGroup } from './engine/presets';
import { FONT_FAMILIES, fontById, type Paint } from './engine/spec';
import { ensureFamily, ensureFonts, onFontsChange } from './engine/fonts';
import { renderCaptions } from './engine/render';
import { parseColor } from './engine/util';

interface TemplateDrawerProps {
  style: CaptionStyle;
  onChange: (style: CaptionStyle) => void;
  /** Project captions — presets preview with the user's own words. */
  segments?: Segment[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sample text for thumbnails (the user's own first caption when available)
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_SAMPLE: Segment = {
  id: 'sample',
  index: 1,
  start: 0,
  end: 3,
  text: 'Make every word count',
  words: [
    { word: 'Make', start: 0.1, end: 0.5 },
    { word: 'every', start: 0.5, end: 1.0 },
    { word: 'word', start: 1.0, end: 1.45 },
    { word: 'count', start: 1.45, end: 2.1 },
  ],
};

function buildSample(segments?: Segment[]): Segment {
  const src = segments?.find((s) => s.text.trim().split(/\s+/).length >= 3) ?? segments?.[0];
  if (!src) return FALLBACK_SAMPLE;
  const words = src.text.trim().split(/\s+/).slice(0, 5);
  const timed = src.words && src.words.length >= words.length ? src.words.slice(0, words.length) : null;
  const t0 = timed ? timed[0].start : 0;
  const list = words.map((w, i) => {
    if (timed) return { word: w, start: 0.1 + (timed[i].start - t0), end: 0.1 + (timed[i].end - t0) };
    return { word: w, start: 0.1 + i * 0.45, end: 0.1 + (i + 1) * 0.45 };
  });
  return { id: 'sample', index: 1, start: 0, end: list[list.length - 1].end + 0.5, text: words.join(' '), words: list };
}

// ─────────────────────────────────────────────────────────────────────────────
// Live preset thumbnail
// ─────────────────────────────────────────────────────────────────────────────

const VW = 270;
const VH = 480;
const CROP_H = 168;
let offscreen: HTMLCanvasElement | null = null;

function drawThumb(canvas: HTMLCanvasElement, preset: CaptionStyle, sample: Segment, t: number) {
  if (!offscreen) {
    offscreen = document.createElement('canvas');
    offscreen.width = VW;
    offscreen.height = VH;
  }
  const o = offscreen.getContext('2d');
  const c = canvas.getContext('2d');
  if (!o || !c) return;

  // A neutral stand-in for footage so contrast and shadows are judged honestly
  const g = o.createLinearGradient(0, 0, VW, VH);
  g.addColorStop(0, '#3a4256');
  g.addColorStop(0.55, '#262a36');
  g.addColorStop(1, '#14161d');
  o.fillStyle = g;
  o.fillRect(0, 0, VW, VH);
  const r = o.createRadialGradient(VW * 0.7, VH * 0.35, 10, VW * 0.7, VH * 0.35, VW * 0.9);
  r.addColorStop(0, 'rgba(255,196,120,0.28)');
  r.addColorStop(1, 'rgba(255,196,120,0)');
  o.fillStyle = r;
  o.fillRect(0, 0, VW, VH);

  const st: CaptionStyle = { ...preset, syncOffset: 0, layout: { ...preset.layout, x: 0.5, y: 0.5 } };
  renderCaptions(o, VW, VH, t, [sample], st);

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth || 130;
  const cssH = Math.round((cssW * CROP_H) / VW);
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  c.clearRect(0, 0, canvas.width, canvas.height);
  c.drawImage(offscreen, 0, (VH - CROP_H) / 2, VW, CROP_H, 0, 0, canvas.width, canvas.height);
}

/** A representative still: the first page fully on screen, its last word active. */
function peakTime(style: CaptionStyle, sample: Segment): number {
  const words = sample.words ?? [];
  if (!words.length) return 0.6;
  const wpp = style.layout.wordsPerPage > 0 ? style.layout.wordsPerPage : words.length;
  const idx = Math.min(wpp, words.length) - 1;
  const t = words[idx].start + 0.3;
  const nextPage = words[wpp]?.start;
  return nextPage !== undefined ? Math.min(t, nextPage - 0.03) : t;
}

const PresetCard = memo(function PresetCard({
  def,
  sample,
  selected,
  onSelect,
}: {
  def: PresetDef;
  sample: Segment;
  selected: boolean;
  onSelect: () => void;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hot, setHot] = useState(false);
  const animate = hot || selected;

  // Static frame (and redraw once fonts arrive)
  useEffect(() => {
    let cancelled = false;
    const paint = () => {
      if (!cancelled && ref.current && !animate) drawThumb(ref.current, def.style, sample, peakTime(def.style, sample));
    };
    void ensureFonts(def.style, sample.text).then(paint);
    paint();
    const off = onFontsChange(paint);
    return () => {
      cancelled = true;
      off();
    };
  }, [def.style, sample, animate]);

  // Looping animation on hover / when selected
  useEffect(() => {
    if (!animate) return;
    let raf = 0;
    const t0 = performance.now();
    const cycle = sample.end + 0.3;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const t = ((now - t0) / 1000) % cycle;
      if (ref.current) drawThumb(ref.current, def.style, sample, t);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animate, def.style, sample]);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
      onFocus={() => setHot(true)}
      onBlur={() => setHot(false)}
      aria-pressed={selected}
      title={def.blurb}
      className={`group text-left rounded-xl overflow-hidden border transition-all ${
        selected ? 'border-amber-400 ring-1 ring-amber-400/60 bg-[#211f1a]' : 'border-white/10 hover:border-white/30 bg-[#1a1a18]'
      }`}
    >
      <canvas ref={ref} className="block w-full" style={{ aspectRatio: `${VW} / ${CROP_H}` }} />
      <div className="px-2.5 py-2">
        <div className="text-[12px] font-semibold text-bone leading-tight">{def.style.name}</div>
        <div className="text-[10px] text-smoke leading-snug mt-0.5 line-clamp-2">{def.blurb}</div>
      </div>
    </button>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// Form primitives
// ─────────────────────────────────────────────────────────────────────────────

function Field({ label, value, children }: { label: string; value?: string; children: ReactNode }) {
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-mist">{label}</span>
        {value !== undefined && <span className="text-[10px] font-mono text-smoke">{value}</span>}
      </div>
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  fmt?: (v: number) => string;
}) {
  return (
    <Field label={label} value={fmt ? fmt(value) : String(+value.toFixed(3))}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 accent-amber-400 bg-white/15 rounded-lg cursor-pointer"
        aria-label={label}
      />
    </Field>
  );
}

function toHex(c: [number, number, number, number]) {
  return `#${[c[0], c[1], c[2]].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

function ColorField({ label, value, onChange, alpha }: { label: string; value: string; onChange: (v: string) => void; alpha?: boolean }) {
  const c = parseColor(value);
  const hex = toHex(c);
  const emit = (h: string, a: number) => {
    const p = parseColor(h);
    onChange(alpha && a < 1 ? `rgba(${p[0]},${p[1]},${p[2]},${+a.toFixed(2)})` : h);
  };
  return (
    <Field label={label} value={alpha ? `${Math.round(c[3] * 100)}%` : hex.toUpperCase()}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={hex}
          onChange={(e) => emit(e.target.value, c[3])}
          className="w-8 h-6 rounded border border-white/15 bg-transparent cursor-pointer p-0"
          aria-label={label}
        />
        {alpha && (
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={c[3]}
            onChange={(e) => emit(hex, parseFloat(e.target.value))}
            className="flex-1 h-1 accent-amber-400 bg-white/15 rounded-lg cursor-pointer"
            aria-label={`${label} opacity`}
          />
        )}
      </div>
    </Field>
  );
}

function Seg<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: Array<[T, string]>;
  onChange: (v: T) => void;
}) {
  const body = (
    <div className="flex rounded-lg overflow-hidden border border-white/10 bg-[#1a1a18]" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`flex-1 px-1.5 py-1 text-[11px] font-medium transition-colors ${
            value === v ? 'bg-amber-400 text-black' : 'text-mist hover:text-bone hover:bg-white/5'
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
  return label ? <Field label={label}>{body}</Field> : body;
}

function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<[T, string]>;
  onChange: (v: T) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full bg-[#1a1a18] border border-white/10 rounded-lg px-2 py-1.5 text-[12px] text-bone focus:outline-none focus:border-amber-400/60"
        aria-label={label}
      >
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </select>
    </Field>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between py-1.5 cursor-pointer">
      <span className="text-[11px] text-mist">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-amber-400 w-3.5 h-3.5" />
    </label>
  );
}

function Section({ title, children, open = false }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-white/10">
      <summary className="flex items-center justify-between cursor-pointer list-none py-2.5 text-[11px] font-bold tracking-[0.12em] uppercase text-amber-300/90 select-none">
        {title}
        <span className="text-smoke transition-transform group-open:rotate-90">›</span>
      </summary>
      <div className="pb-3">{children}</div>
    </details>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Customize panel
// ─────────────────────────────────────────────────────────────────────────────

const pct = (v: number) => `${Math.round(v * 100)}%`;
const em = (v: number) => `${v.toFixed(2)}em`;

function Customize({ style, update, onReset }: { style: CaptionStyle; update: (fn: (d: CaptionStyle) => void) => void; onReset: () => void }) {
  const fam = fontById(style.font.family);
  const weights = [...new Set(fam.files.map((f) => f.weight))];
  const hasItalic = fam.files.some((f) => f.style === 'italic');
  const gradient: Extract<Paint, object> | null = typeof style.fill === 'string' ? null : style.fill;
  const hl = style.highlight;
  const m = style.motion;

  return (
    <div className="px-3.5 pb-6">
      <Section title="Text" open>
        <SelectField
          label="Font"
          value={style.font.family}
          options={FONT_FAMILIES.map((f) => [f.id, `${f.label} · ${f.group}`] as [string, string])}
          onChange={(id) => {
            void ensureFamily(id);
            update((d) => {
              d.font.family = id;
              const f = fontById(id);
              d.font.weight = f.files.reduce((best, x) => (Math.abs(x.weight - d.font.weight) < Math.abs(best - d.font.weight) ? x.weight : best), f.files[0].weight);
              if (!f.files.some((x) => x.style === 'italic')) d.font.italic = false;
            });
          }}
        />
        {weights.length > 1 && (
          <Seg label="Weight" value={style.font.weight} options={weights.map((w) => [w, String(w)] as [number, string])} onChange={(v) => update((d) => void (d.font.weight = v))} />
        )}
        {hasItalic && <Toggle label="Italic" checked={style.font.italic} onChange={(v) => update((d) => void (d.font.italic = v))} />}
        <Slider label="Size" value={style.font.size} min={0.03} max={0.2} step={0.002} fmt={pct} onChange={(v) => update((d) => void (d.font.size = v))} />
        <Slider label="Tracking" value={style.font.tracking} min={-0.05} max={0.15} step={0.005} fmt={em} onChange={(v) => update((d) => void (d.font.tracking = v))} />
        <Slider label="Line height" value={style.font.lineHeight} min={0.8} max={1.7} step={0.01} onChange={(v) => update((d) => void (d.font.lineHeight = v))} />
        <Seg
          label="Case"
          value={style.font.textCase}
          options={[['none', 'Aa'], ['upper', 'AA'], ['lower', 'aa'], ['title', 'Title']]}
          onChange={(v) => update((d) => void (d.font.textCase = v))}
        />
        <Slider
          label="Words on screen"
          value={style.layout.wordsPerPage}
          min={0}
          max={8}
          step={1}
          fmt={(v) => (v === 0 ? 'All' : String(v))}
          onChange={(v) => update((d) => void (d.layout.wordsPerPage = v))}
        />
        <Slider label="Max lines" value={style.layout.maxLines} min={1} max={3} step={1} onChange={(v) => update((d) => void (d.layout.maxLines = v))} />
        <Seg label="Align" value={style.layout.align} options={[['left', 'Left'], ['center', 'Centre'], ['right', 'Right']]} onChange={(v) => update((d) => void (d.layout.align = v))} />
        <Slider label="Max width" value={style.layout.widthPct} min={0.3} max={0.98} step={0.01} fmt={pct} onChange={(v) => update((d) => void (d.layout.widthPct = v))} />
      </Section>

      <Section title="Colour">
        <Seg
          label="Fill"
          value={gradient ? 'gradient' : 'solid'}
          options={[['solid', 'Solid'], ['gradient', 'Gradient']]}
          onChange={(v) =>
            update((d) => {
              const base = typeof d.fill === 'string' ? d.fill : d.fill.stops[0][1];
              d.fill = v === 'solid' ? base : { angle: 90, stops: [[0, base], [1, '#FF4E50']] };
            })
          }
        />
        {gradient ? (
          <>
            {gradient.stops.map(([, c], i) => (
              <ColorField
                key={i}
                label={`Gradient stop ${i + 1}`}
                value={c}
                onChange={(v) =>
                  update((d) => {
                    if (typeof d.fill !== 'string') d.fill.stops[i][1] = v;
                  })
                }
              />
            ))}
            <Slider
              label="Gradient angle"
              value={gradient.angle}
              min={0}
              max={180}
              step={1}
              fmt={(v) => `${Math.round(v)}°`}
              onChange={(v) =>
                update((d) => {
                  if (typeof d.fill !== 'string') d.fill.angle = v;
                })
              }
            />
          </>
        ) : (
          <ColorField label="Text colour" value={style.fill as string} onChange={(v) => update((d) => void (d.fill = v))} />
        )}
        <Slider label="Outline" value={style.stroke.width} min={0} max={0.14} step={0.005} fmt={em} onChange={(v) => update((d) => void (d.stroke.width = v))} />
        {style.stroke.width > 0 && <ColorField label="Outline colour" value={style.stroke.color} alpha onChange={(v) => update((d) => void (d.stroke.color = v))} />}
      </Section>

      <Section title="Highlight">
        <Seg
          label="Active word"
          value={hl.mode}
          options={[['none', 'None'], ['color', 'Colour'], ['box', 'Box'], ['underline', 'Line'], ['sweep', 'Sweep']]}
          onChange={(v) => update((d) => void (d.highlight.mode = v))}
        />
        {hl.mode !== 'none' && <ColorField label="Highlight colour" value={hl.color} onChange={(v) => update((d) => void (d.highlight.color = v))} />}
        {hl.mode === 'box' && <ColorField label="Text on box" value={hl.textColor || '#0A0A0A'} onChange={(v) => update((d) => void (d.highlight.textColor = v))} />}
        <Slider label="Pop size" value={hl.scale} min={1} max={1.4} step={0.01} fmt={(v) => `${v.toFixed(2)}×`} onChange={(v) => update((d) => void (d.highlight.scale = v))} />
        {(hl.mode === 'color' || hl.mode === 'sweep' || hl.mode === 'underline') && (
          <Toggle label="Keep spoken words highlighted" checked={hl.keep} onChange={(v) => update((d) => void (d.highlight.keep = v))} />
        )}
        <Slider label="Upcoming words" value={style.reveal.dimUnspoken} min={0.15} max={1} step={0.05} fmt={pct} onChange={(v) => update((d) => void (d.reveal.dimUnspoken = v))} />
      </Section>

      <Section title="Effects">
        <Slider label="Shadow blur" value={style.shadow.blur} min={0} max={0.4} step={0.01} fmt={em} onChange={(v) => update((d) => void (d.shadow.blur = v))} />
        <Slider label="Shadow offset" value={style.shadow.y} min={0} max={0.2} step={0.005} fmt={em} onChange={(v) => update((d) => void (d.shadow.y = v))} />
        <ColorField label="Shadow colour" value={style.shadow.color} alpha onChange={(v) => update((d) => void (d.shadow.color = v))} />
        <Slider label="Glow" value={style.glow.strength} min={0} max={3} step={1} fmt={(v) => (v === 0 ? 'Off' : String(v))} onChange={(v) => update((d) => void (d.glow.strength = v))} />
        {style.glow.strength > 0 && (
          <>
            <Slider label="Glow spread" value={style.glow.blur} min={0.05} max={0.5} step={0.01} fmt={em} onChange={(v) => update((d) => void (d.glow.blur = v))} />
            <ColorField label="Glow colour" value={style.glow.color} onChange={(v) => update((d) => void (d.glow.color = v))} />
          </>
        )}
        <Slider label="3-D depth" value={style.extrude.depth} min={0} max={0.2} step={0.005} fmt={em} onChange={(v) => update((d) => void (d.extrude.depth = v))} />
        {style.extrude.depth > 0 && <ColorField label="3-D colour" value={style.extrude.color} onChange={(v) => update((d) => void (d.extrude.color = v))} />}
        <Seg label="Background" value={style.plate.mode} options={[['none', 'None'], ['block', 'Block'], ['line', 'Lines']]} onChange={(v) => update((d) => void (d.plate.mode = v))} />
        {style.plate.mode !== 'none' && (
          <>
            <ColorField label="Background colour" value={style.plate.color} alpha onChange={(v) => update((d) => void (d.plate.color = v))} />
            <Slider label="Padding X" value={style.plate.padX} min={0} max={1} step={0.01} fmt={em} onChange={(v) => update((d) => void (d.plate.padX = v))} />
            <Slider label="Padding Y" value={style.plate.padY} min={0} max={0.6} step={0.01} fmt={em} onChange={(v) => update((d) => void (d.plate.padY = v))} />
            <Slider label="Corner radius" value={style.plate.radius} min={0} max={0.8} step={0.01} fmt={em} onChange={(v) => update((d) => void (d.plate.radius = v))} />
          </>
        )}
      </Section>

      <Section title="Motion">
        <SelectField
          label="Entrance"
          value={m.in}
          options={[
            ['none', 'None'], ['fade', 'Fade'], ['pop', 'Pop'], ['slide-up', 'Slide up'], ['slide-down', 'Slide down'],
            ['zoom', 'Zoom slam'], ['blur', 'Blur in'], ['mask-up', 'Mask reveal'], ['drop', 'Drop'], ['typewriter', 'Typewriter'], ['glitch', 'Glitch'],
          ]}
          onChange={(v) => update((d) => void (d.motion.in = v))}
        />
        <SelectField label="Exit" value={m.out} options={[['none', 'None'], ['fade', 'Fade'], ['slide-down', 'Slide down'], ['shrink', 'Shrink']]} onChange={(v) => update((d) => void (d.motion.out = v))} />
        <Seg label="Animate by" value={m.unit} options={[['line', 'Line'], ['word', 'Word'], ['char', 'Letter']]} onChange={(v) => update((d) => void (d.motion.unit = v))} />
        <Slider label="Entrance time" value={m.inMs} min={1} max={1200} step={10} fmt={(v) => `${Math.round(v)} ms`} onChange={(v) => update((d) => void (d.motion.inMs = v))} />
        <Slider label="Stagger" value={m.stagger} min={0} max={200} step={5} fmt={(v) => `${Math.round(v)} ms`} onChange={(v) => update((d) => void (d.motion.stagger = v))} />
        <SelectField
          label="Easing"
          value={m.ease}
          options={[['spring', 'Spring'], ['back', 'Overshoot'], ['out', 'Smooth'], ['expo', 'Snappy'], ['inout', 'Ease in-out'], ['linear', 'Linear']]}
          onChange={(v) => update((d) => void (d.motion.ease = v))}
        />
        {(m.ease === 'spring' || m.ease === 'back') && <Slider label="Bounce" value={m.bounce} min={0} max={1} step={0.05} fmt={pct} onChange={(v) => update((d) => void (d.motion.bounce = v))} />}
        <Slider label="Tilt" value={m.wobble} min={0} max={6} step={0.1} fmt={(v) => `${v.toFixed(1)}°`} onChange={(v) => update((d) => void (d.motion.wobble = v))} />
        <Seg label="Words appear" value={style.reveal.mode} options={[['page', 'Together'], ['spoken', 'As spoken']]} onChange={(v) => update((d) => void (d.reveal.mode = v))} />
      </Section>

      <Section title="Position & timing">
        <Slider label="Horizontal" value={style.layout.x} min={0.05} max={0.95} step={0.005} fmt={pct} onChange={(v) => update((d) => void (d.layout.x = v))} />
        <Slider label="Vertical" value={style.layout.y} min={0.05} max={0.95} step={0.005} fmt={pct} onChange={(v) => update((d) => void (d.layout.y = v))} />
        <div className="flex gap-1.5 py-1">
          {([['Top', 0.18], ['Middle', 0.5], ['Lower third', 0.74], ['Bottom', 0.87]] as const).map(([label, y]) => (
            <button key={label} type="button" onClick={() => update((d) => void ((d.layout.y = y), (d.layout.x = 0.5)))} className="flex-1 px-1 py-1 text-[10px] rounded-md border border-white/10 text-mist hover:text-bone hover:border-white/30">
              {label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-smoke leading-snug py-1">Tip: you can also drag the captions directly in the preview. They snap to the centre lines.</p>
        <Slider label="Timing offset" value={style.syncOffset} min={-1} max={0.5} step={0.05} fmt={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)} s`} onChange={(v) => update((d) => void (d.syncOffset = v))} />
      </Section>

      <button type="button" onClick={onReset} className="mt-4 w-full py-2 rounded-lg border border-white/15 text-[12px] text-mist hover:text-bone hover:border-white/30 transition-colors">
        Reset to preset
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Drawer
// ─────────────────────────────────────────────────────────────────────────────

const GROUPS: PresetGroup[] = ['Viral', 'Kinetic', 'Glow & colour', 'Film & clean'];

export default function TemplateDrawer({ style, onChange, segments }: TemplateDrawerProps) {
  const [tab, setTab] = useState<'presets' | 'customize'>('presets');
  const baseId = useRef(PRESETS.find((p) => p.style.id === style.id)?.style.id ?? PRESETS[0].style.id);
  const sample = useMemo(() => buildSample(segments), [segments]);

  const choose = useCallback(
    (def: PresetDef) => {
      baseId.current = def.style.id;
      // A preset changes the look; the project's timing offset stays as the user set it
      onChange({ ...structuredClone(def.style), syncOffset: style.syncOffset });
    },
    [onChange, style.syncOffset],
  );

  const update = useCallback(
    (fn: (d: CaptionStyle) => void) => {
      const d = structuredClone(style);
      fn(d);
      if (d.id !== 'custom') {
        d.id = 'custom';
        d.name = 'Custom';
      }
      onChange(d);
    },
    [style, onChange],
  );

  const reset = useCallback(() => {
    const def = PRESETS.find((p) => p.style.id === baseId.current) ?? PRESETS[0];
    choose(def);
  }, [choose]);

  return (
    <div className="h-full flex flex-col bg-[#131312] border-l border-white/10">
      <div className="shrink-0 px-3.5 pt-3 pb-2.5 border-b border-white/10">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[11px] font-bold tracking-[0.14em] uppercase text-mist">Caption style</h3>
          <span className="text-[10px] text-amber-300/90 font-medium truncate max-w-[55%]">{style.name}</span>
        </div>
        <div role="tablist" className="grid grid-cols-2 rounded-lg overflow-hidden border border-white/10 bg-[#1a1a18]">
          {(['presets', 'customize'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`py-1.5 text-[12px] font-semibold capitalize transition-colors ${tab === t ? 'bg-amber-400 text-black' : 'text-mist hover:text-bone'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {tab === 'presets' ? (
          <div className="px-3.5 pt-3 pb-6 space-y-5">
            {GROUPS.map((g) => (
              <div key={g}>
                <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-amber-300/80 mb-2">{g}</div>
                <div className="grid grid-cols-2 gap-2.5">
                  {PRESETS.filter((p) => p.group === g).map((def) => (
                    <PresetCard key={def.style.id} def={def} sample={sample} selected={style.id === def.style.id} onSelect={() => choose(def)} />
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[10px] text-smoke leading-snug">Hover a style to see it move. Previews use your own captions. Switch to Customize to fine-tune anything.</p>
          </div>
        ) : (
          <Customize style={style} update={update} onReset={reset} />
        )}
      </div>
    </div>
  );
}
