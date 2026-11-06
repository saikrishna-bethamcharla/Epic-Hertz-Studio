import { describe, it, expect } from 'vitest';
import { renderCaptions } from '../src/subtitle-tool/engine/render';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import type { Segment, CaptionStyle } from '../src/subtitle-tool/types';
import type {
  EntranceType,
  EmphasisType,
  ExitType,
} from '../src/subtitle-tool/engine/animation/types';

describe('Requirement 2: Visibly Distinct Animations Suite', () => {
  function createRecorderCanvasContext() {
    const ops: string[] = [];
    return {
      ops,
      save: () => ops.push('save'),
      restore: () => ops.push('restore'),
      beginPath: () => ops.push('beginPath'),
      closePath: () => ops.push('closePath'),
      rect: (x: number, y: number, w: number, h: number) =>
        ops.push(`rect(${Math.round(x)},${Math.round(y)},${Math.round(w)},${Math.round(h)})`),
      roundRect: (x: number, y: number, w: number, h: number, r: number) =>
        ops.push(
          `roundRect(${Math.round(x)},${Math.round(y)},${Math.round(w)},${Math.round(h)},${Math.round(r)})`,
        ),
      fillRect: (x: number, y: number, w: number, h: number) =>
        ops.push(`fillRect(${Math.round(x)},${Math.round(y)},${Math.round(w)},${Math.round(h)})`),
      fill: () => ops.push('fill'),
      stroke: () => ops.push('stroke'),
      clip: () => ops.push('clip'),
      clearRect: () => ops.push('clearRect'),
      fillText: (text: string, x: number, y: number) =>
        ops.push(`fillText("${text}",${Math.round(x)},${Math.round(y)})`),
      strokeText: (text: string, x: number, y: number) =>
        ops.push(`strokeText("${text}",${Math.round(x)},${Math.round(y)})`),
      measureText: (text: string) => ({
        width: text.length * 16,
        actualBoundingBoxAscent: 14,
        actualBoundingBoxDescent: 4,
        fontBoundingBoxAscent: 16,
        fontBoundingBoxDescent: 6,
      }),
      setLineDash: () => {},
      translate: (x: number, y: number) => ops.push(`translate(${Math.round(x)},${Math.round(y)})`),
      scale: (sx: number, sy: number) => ops.push(`scale(${sx.toFixed(2)},${sy.toFixed(2)})`),
      rotate: (rad: number) => ops.push(`rotate(${rad.toFixed(3)})`),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'left',
      textBaseline: 'alphabetic',
      _globalAlpha: 1,
      get globalAlpha() {
        return this._globalAlpha;
      },
      set globalAlpha(v: number) {
        this._globalAlpha = v;
        ops.push(`alpha(${v.toFixed(2)})`);
      },
      globalCompositeOperation: 'source-over',
      filter: 'none',
    } as unknown as CanvasRenderingContext2D & { ops: string[]; filter: string };
  }

  const sampleSegments: Segment[] = [
    {
      id: 'anim-seg-1',
      index: 1,
      start: 1.0,
      end: 3.0,
      text: 'Animation verification frame',
      words: [
        { word: 'Animation', start: 1.0, end: 1.6 },
        { word: 'verification', start: 1.7, end: 2.3 },
        { word: 'frame', start: 2.4, end: 3.0 },
      ],
    },
  ];

  const W = 1080;
  const H = 1920;

  it('renders every entrance type with a distinct transformation signature at mid-animation', () => {
    const entranceTypes: EntranceType[] = [
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
    ];

    const signatures = new Map<EntranceType, string>();

    // Test each at mid entrance (t = 1.15s, since start = 1.0s and duration = 0.3s)
    for (const ent of entranceTypes) {
      const style: CaptionStyle = {
        ...structuredClone(DEFAULT_STYLE),
        motion: {
          ...DEFAULT_STYLE.motion,
          in: ent,
          entranceType: ent,
          inMs: 300,
        },
      };

      const ctx = createRecorderCanvasContext();
      renderCaptions(ctx, W, H, 1.15, sampleSegments, style);

      const sig = ctx.ops.join(';');
      expect(sig.length).toBeGreaterThan(10);
      signatures.set(ent, sig);
    }

    // Assert that every entrance type produces a visibly distinct output from every other
    for (let i = 0; i < entranceTypes.length; i++) {
      for (let j = i + 1; j < entranceTypes.length; j++) {
        const typeA = entranceTypes[i];
        const typeB = entranceTypes[j];
        const sigA = signatures.get(typeA);
        const sigB = signatures.get(typeB);

        expect(
          sigA,
          `Entrance type "${typeA}" must not be identical to entrance type "${typeB}"`,
        ).not.toBe(sigB);
      }
    }
  });

  it('renders every emphasis type with a distinct transformation signature at mid-spoken word', () => {
    const emphasisTypes: EmphasisType[] = [
      'pop',
      'shake',
      'glow-pulse',
      'underline-draw',
      'highlight-box-sweep',
      'color-flip',
      'scale-slam',
      'wobble',
    ];

    const signatures = new Map<EmphasisType, string>();

    // Test active word 1 ('Animation') at mid-word (t = 1.3s, start=1.0s, end=1.6s)
    for (const emph of emphasisTypes) {
      const style: CaptionStyle = {
        ...structuredClone(DEFAULT_STYLE),
        highlight: {
          ...DEFAULT_STYLE.highlight,
          emphasisType: emph,
          color: '#FFE14D',
        },
        motion: {
          ...DEFAULT_STYLE.motion,
          in: 'none',
        },
      };

      const ctx = createRecorderCanvasContext();
      renderCaptions(ctx, W, H, 1.3, sampleSegments, style);

      const sig = ctx.ops.join(';');
      expect(sig.length).toBeGreaterThan(10);
      signatures.set(emph, sig);
    }

    // Pairwise uniqueness assertion
    for (let i = 0; i < emphasisTypes.length; i++) {
      for (let j = i + 1; j < emphasisTypes.length; j++) {
        const typeA = emphasisTypes[i];
        const typeB = emphasisTypes[j];
        const sigA = signatures.get(typeA);
        const sigB = signatures.get(typeB);

        expect(
          sigA,
          `Emphasis type "${typeA}" must not be identical to emphasis type "${typeB}"`,
        ).not.toBe(sigB);
      }
    }
  });

  it('renders every exit type with a distinct transformation signature at mid-outro', () => {
    const exitTypes: ExitType[] = [
      'fade',
      'slide-down',
      'slide-left',
      'slide-right',
      'scale-out',
      'blur-out',
      'clip-hide',
      'typewriter-erase',
      'drop-out',
      'glitch-out',
    ];

    const signatures = new Map<ExitType, string>();

    // Test during page outro: visEnd = 3.0s, outMs = 300ms, mid outro is at t = 2.85s
    for (const ext of exitTypes) {
      const style: CaptionStyle = {
        ...structuredClone(DEFAULT_STYLE),
        motion: {
          ...DEFAULT_STYLE.motion,
          in: 'none',
          out: ext,
          exitType: ext,
          outMs: 300,
        },
      };

      const ctx = createRecorderCanvasContext();
      renderCaptions(ctx, W, H, 2.85, sampleSegments, style);

      const sig = ctx.ops.join(';');
      signatures.set(ext, sig);
    }

    // Pairwise uniqueness assertion
    for (let i = 0; i < exitTypes.length; i++) {
      for (let j = i + 1; j < exitTypes.length; j++) {
        const typeA = exitTypes[i];
        const typeB = exitTypes[j];
        const sigA = signatures.get(typeA);
        const sigB = signatures.get(typeB);

        expect(sigA, `Exit type "${typeA}" must not be identical to exit type "${typeB}"`).not.toBe(
          sigB,
        );
      }
    }
  });
});
