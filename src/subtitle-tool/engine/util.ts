// ─── Engine utilities: easing, springs, colour maths ────────────────────────

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type EaseName = 'linear' | 'out' | 'inout' | 'expo' | 'back' | 'spring';

/**
 * Underdamped spring, normalised so t∈[0,1] maps onto the whole settle time.
 * `bounce` 0 → critically smooth (≈0 overshoot) … 1 → lively (~40% overshoot).
 * Returns values that overshoot 1 before settling exactly on 1.
 */
export function spring(t: number, bounce = 0.5): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const zeta = 0.9 - 0.62 * clamp01(bounce); // damping ratio
  const w0 = 3.9 / zeta; // envelope ≈ 2% at t = 1
  const wd = w0 * Math.sqrt(1 - zeta * zeta);
  const env = Math.exp(-zeta * w0 * t);
  return 1 - env * (Math.cos(wd * t) + ((zeta * w0) / wd) * Math.sin(wd * t));
}

export function ease(name: EaseName, t: number, bounce = 0.5): number {
  const x = clamp01(t);
  switch (name) {
    case 'linear':
      return x;
    case 'out':
      return 1 - Math.pow(1 - x, 3);
    case 'inout':
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    case 'expo':
      return x >= 1 ? 1 : 1 - Math.pow(2, -10 * x);
    case 'back': {
      const s = 0.9 + 1.6 * clamp01(bounce);
      return 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
    }
    case 'spring':
      return spring(x, bounce);
  }
}

// ── Colour ───────────────────────────────────────────────────────────────────

export type RGBA = [number, number, number, number];

const colourCache = new Map<string, RGBA>();

export function parseColor(input: string): RGBA {
  const cached = colourCache.get(input);
  if (cached) return cached;
  let out: RGBA = [255, 255, 255, 1];
  const s = input.trim().toLowerCase();
  if (s === 'transparent') out = [0, 0, 0, 0];
  else if (s[0] === '#') {
    let h = s.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length === 6 || h.length === 8) {
      out = [
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
        h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
      ];
    }
  } else {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const p = m[1].split(',').map((v) => parseFloat(v));
      out = [p[0] || 0, p[1] || 0, p[2] || 0, p.length > 3 ? p[3] : 1];
    }
  }
  colourCache.set(input, out);
  return out;
}

export function rgba(c: RGBA, alphaMul = 1): string {
  return `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${+(c[3] * alphaMul).toFixed(3)})`;
}

export function mixColor(a: string, b: string, t: number): string {
  if (t <= 0) return a;
  if (t >= 1) return b;
  const ca = parseColor(a);
  const cb = parseColor(b);
  return rgba([lerp(ca[0], cb[0], t), lerp(ca[1], cb[1], t), lerp(ca[2], cb[2], t), lerp(ca[3], cb[3], t)]);
}

/** Deterministic 0..1 pseudo-random from two numbers (stable across frames/exports). */
export function hash01(a: number, b = 0): number {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
}
