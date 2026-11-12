// ─── Motion Presets — Epic Hertz Studio Animation Library ───────────────────
// Tuned, editor-facing animation recipes. Unlike raw animation types, each
// preset carries its own duration, easing, stagger and unit so applying one
// always looks the same no matter which template the caption started from.

import type { CaptionStyle } from '../spec';

export interface MotionPreset {
  id: string;
  name: string;
  /** Short line shown under the name in the library. */
  hint: string;
  motion: Partial<CaptionStyle['motion']>;
}

export interface HighlightPreset {
  id: string;
  name: string;
  hint: string;
  highlight: Partial<CaptionStyle['highlight']>;
}

export const ENTRANCE_PRESETS: MotionPreset[] = [
  {
    id: 'beast-pop',
    name: 'Beast Pop',
    hint: 'Words punch in with spring overshoot',
    motion: {
      in: 'scale-pop',
      entranceType: 'scale-pop',
      inMs: 220,
      stagger: 45,
      unit: 'word',
      easing: 'spring',
      bounce: 0.65,
      entranceParams: { initialScale: 0.55, bounce: 0.65 },
    },
  },
  {
    id: 'capcut-bounce',
    name: 'CapCut Bounce',
    hint: 'Line springs in with elastic overshoot',
    motion: {
      in: 'elastic-pop',
      entranceType: 'elastic-pop',
      inMs: 520,
      stagger: 0,
      unit: 'line',
      easing: 'easeOutElastic',
      entranceParams: { initialScale: 0.72, bounce: 0.85 },
    },
  },
  {
    id: 'rack-focus',
    name: 'Blur Focus',
    hint: 'Rack focus from soft blur to sharp',
    motion: {
      in: 'rack-focus',
      entranceType: 'rack-focus',
      inMs: 380,
      stagger: 40,
      unit: 'word',
      easing: 'easeOutCubic',
      entranceParams: { maxBlur: 0.55 },
    },
  },
  {
    id: 'tracking-in',
    name: 'Tracking In',
    hint: 'Wide letters tighten into place',
    motion: {
      in: 'tracking-in',
      entranceType: 'tracking-in',
      inMs: 420,
      stagger: 0,
      unit: 'line',
      easing: 'easeOutExpo',
      entranceParams: { spread: 0.3 },
    },
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    hint: 'Rise into frame as it fades in',
    motion: {
      in: 'slide-up',
      entranceType: 'slide-up',
      inMs: 320,
      stagger: 30,
      unit: 'word',
      easing: 'easeOutCubic',
      entranceParams: { distance: 0.4 },
    },
  },
  {
    id: 'mask-reveal',
    name: 'Mask Reveal',
    hint: 'Wipe the line up from behind a mask',
    motion: {
      in: 'clip-reveal',
      entranceType: 'clip-reveal',
      inMs: 360,
      stagger: 0,
      unit: 'line',
      easing: 'easeOutExpo',
      entranceParams: {},
    },
  },
  {
    id: 'drop-in',
    name: 'Drop In',
    hint: 'Fall in from above and land',
    motion: {
      in: 'drop-in',
      entranceType: 'drop-in',
      inMs: 380,
      stagger: 35,
      unit: 'word',
      easing: 'easeOutCubic',
      entranceParams: { height: 1.1 },
    },
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    hint: 'Characters reveal one by one',
    motion: {
      in: 'typewriter',
      entranceType: 'typewriter',
      inMs: 650,
      stagger: 26,
      unit: 'char',
      easing: 'linear',
      entranceParams: {},
    },
  },
  {
    id: 'glitch',
    name: 'Glitch',
    hint: 'Chromatic jitter into frame',
    motion: {
      in: 'glitch',
      entranceType: undefined,
      inMs: 300,
      stagger: 0,
      unit: 'word',
      easing: 'linear',
      entranceParams: {},
    },
  },
  {
    id: 'fade',
    name: 'Fade',
    hint: 'Soft opacity only',
    motion: {
      in: 'fade',
      entranceType: 'fade',
      inMs: 300,
      stagger: 0,
      unit: 'line',
      easing: 'easeOutCubic',
      entranceParams: {},
    },
  },
  {
    id: 'none',
    name: 'None',
    hint: 'Appear instantly',
    motion: {
      in: 'none',
      entranceType: undefined,
      inMs: 1,
      stagger: 0,
      unit: 'word',
      entranceParams: {},
    },
  },
];

export const EXIT_PRESETS: MotionPreset[] = [
  {
    id: 'fade-out',
    name: 'Fade Out',
    hint: 'Soft dissolve out',
    motion: {
      out: 'fade',
      exitType: 'fade',
      outMs: 220,
      easing: 'easeOutCubic',
      exitParams: {},
    },
  },
  {
    id: 'slide-down-out',
    name: 'Slide Down',
    hint: 'Sink down and fade',
    motion: {
      out: 'slide-down',
      exitType: 'slide-down',
      outMs: 240,
      easing: 'easeOutCubic',
      exitParams: { distance: 0.35 },
    },
  },
  {
    id: 'slide-up-out',
    name: 'Slide Up',
    hint: 'Lift up and fade',
    motion: {
      out: 'slide-up',
      exitType: 'slide-up',
      outMs: 240,
      easing: 'easeOutCubic',
      exitParams: { distance: 0.35 },
    },
  },
  {
    id: 'shrink',
    name: 'Shrink',
    hint: 'Pull inward as it fades',
    motion: {
      out: 'shrink',
      exitType: undefined,
      outMs: 220,
      easing: 'easeOutCubic',
      exitParams: {},
    },
  },
  {
    id: 'blur-out',
    name: 'Blur Out',
    hint: 'Defocus away',
    motion: {
      out: 'blur-out',
      exitType: 'blur-out',
      outMs: 260,
      easing: 'easeOutCubic',
      exitParams: { maxBlur: 0.28 },
    },
  },
  {
    id: 'drop-out',
    name: 'Drop Out',
    hint: 'Gravity fall out of frame',
    motion: {
      out: 'drop-out',
      exitType: 'drop-out',
      outMs: 320,
      easing: 'linear',
      exitParams: { distance: 1.4 },
    },
  },
  {
    id: 'glitch-out',
    name: 'Glitch Out',
    hint: 'Chromatic break-up',
    motion: {
      out: 'glitch-out',
      exitType: 'glitch-out',
      outMs: 260,
      easing: 'linear',
      exitParams: {},
    },
  },
  {
    id: 'none-highlight',
    name: 'None',
    hint: 'Cut straight out',
    motion: {
      out: 'none',
      exitType: undefined,
      outMs: 1,
      exitParams: {},
    },
  },
];

export const HIGHLIGHT_PRESETS: HighlightPreset[] = [
  {
    id: 'box',
    name: 'Highlight Box',
    hint: 'Solid box behind the spoken word',
    highlight: { mode: 'box', emphasisType: 'color-flip' },
  },
  {
    id: 'pop-box',
    name: 'Pop Box',
    hint: 'Box jumps word to word with a pop',
    highlight: {
      mode: 'box',
      emphasisType: 'pop',
      emphasisParams: { scale: 1.12 },
    },
  },
  {
    id: 'color',
    name: 'Active Color',
    hint: 'Spoken word switches colour',
    highlight: { mode: 'color', emphasisType: 'color-flip' },
  },
  {
    id: 'word-bounce',
    name: 'Word Bounce',
    hint: 'Spoken word hops on the baseline',
    highlight: {
      mode: 'color',
      emphasisType: 'hop',
      emphasisParams: { height: 0.2, scale: 0.08 },
    },
  },
  {
    id: 'underline',
    name: 'Underline Sweep',
    hint: 'Line draws under the spoken word',
    highlight: { mode: 'underline', emphasisType: 'underline-draw' },
  },
  {
    id: 'sweep',
    name: 'Karaoke Sweep',
    hint: 'Fill sweeps across as words are said',
    highlight: {
      mode: 'sweep',
      emphasisType: 'highlight-box-sweep',
      keep: false,
      textColor: '#000000',
    },
  },
  {
    id: 'none-out',
    name: 'None',
    hint: 'No active word treatment',
    highlight: { mode: 'none' },
  },
];
