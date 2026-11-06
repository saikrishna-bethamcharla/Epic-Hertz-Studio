// ─── Animation Types — Epic Hertz Studio Engine ─────────────────────────────
// Pure transform models for composable caption entrance, emphasis, and exit animations.

export type AnimationEasing =
  | 'linear'
  | 'easeOutQuad'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeOutExpo'
  | 'easeOutBack'
  | 'easeOutElastic'
  | 'easeOutBounce'
  | 'spring';

export interface TransformState {
  alpha: number; // 0..1
  dx: number; // px horizontal translation
  dy: number; // px vertical translation
  scale: number; // 1 = normal scale
  scaleX?: number;
  scaleY?: number;
  rotation?: number; // degrees
  blur?: number; // px blur radius
  clip?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    wipeProgress?: number;
    rect?: boolean;
  };
  colorMix?: number; // 0..1 tint/emphasis mix
  glitch?: number; // 0..1 chromatic displacement
}

export type EntranceType =
  | 'fade'
  | 'slide-up'
  | 'slide-left'
  | 'slide-right'
  | 'scale-pop'
  | 'rotate-in'
  | 'blur-in'
  | 'typewriter'
  | 'bounce-in'
  | 'wave'
  | 'flip-in'
  | 'drop-in'
  | 'clip-reveal';

export type EmphasisType =
  | 'pop'
  | 'shake'
  | 'glow-pulse'
  | 'underline-draw'
  | 'highlight-box-sweep'
  | 'color-flip'
  | 'scale-slam'
  | 'wobble';

export type ExitType =
  | 'fade'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale-out'
  | 'blur-out'
  | 'clip-hide'
  | 'typewriter-erase'
  | 'drop-out'
  | 'glitch-out';
