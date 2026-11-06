import type { CaptionStyle, TextCase } from './engine/spec';

export type {
  CaptionStyle,
  TextCase,
  LowerThirdSpec,
  LowerThirdVariant,
  LowerThirdColors,
  LowerThirdPosition,
} from './engine/spec';
export { DEFAULT_LOWER_THIRD } from './engine/spec';

export interface WordTimestamp {
  word: string;
  start: number; // seconds
  end: number; // seconds
  highlightColor?: string; // custom highlight color override
  emphasis?: 'none' | 'pop' | 'shake' | 'glow' | 'underline';
}

export interface SegmentStyleOverride {
  fillColor?: string;
  strokeColor?: string;
  highlightColor?: string;
  scale?: number;
  positionX?: number; // 0..1 frame width (0 = left, 0.5 = center, 1 = right)
  positionY?: number; // 0..1 frame height (0 = top, 0.5 = center, 1 = bottom)
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  underline?: boolean;
  italic?: boolean;
  textCase?: TextCase;
  customStyle?: Partial<CaptionStyle>;
}

export interface Segment {
  id: string; // uuid-like key for React
  index: number; // 1-based SRT index
  start: number; // seconds
  end: number; // seconds
  text: string;
  speaker?: string; // e.g. 'Speaker 1', 'Speaker 2', 'Guest', 'Host'
  words?: WordTimestamp[];
  styleOverride?: SegmentStyleOverride;
}

export type ScriptOutput = 'romanized' | 'native'; // e.g. 'Tanglish' vs 'తెలుగు లిపి'
export type SpokenLanguage =
  'auto' | 'te' | 'hi' | 'en' | 'ta' | 'kn' | 'ml' | 'mr' | 'bn' | 'es' | 'fr';

export type CaptionAnimationEffect =
  | 'capcut-bounce' // CapCut signature bounce pop & tilt
  | 'hormozi-box' // Alex Hormozi jumping word highlight badge
  | 'premiere-glow' // Premiere Pro electric neon glow & scale
  | 'comic-pop' // MrBeast 3D comic shadow & energetic pop
  | 'fire-flame' // Flame gradient & hype jump
  | 'cinematic-clean' // Netflix / Premiere pristine film look
  | 'none';

export type SubtitlePosition = 'bottom' | 'middle' | 'top';
export type VideoAspectRatio = 'original' | '9:16' | '16:9' | '1:1';

export type AppStage =
  | 'idle'
  | 'configuring' // "Prepare your media" modal (Replix-style)
  | 'extracting' // pulling audio out of the video
  | 'uploading' // sending chunked audio to serverless transcription proxy
  | 'transcribing' // waiting for speech-to-text
  | 'editing' // 3-column Replix editor layout
  | 'burning' // burning subtitles into MP4
  | 'done'; // export finished
