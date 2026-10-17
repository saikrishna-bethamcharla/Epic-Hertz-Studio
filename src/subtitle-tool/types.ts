export interface WordTimestamp {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

export interface Segment {
  id: string;      // uuid-like key for React
  index: number;   // 1-based SRT index
  start: number;   // seconds
  end: number;     // seconds
  text: string;
  words?: WordTimestamp[];
}

export type ScriptOutput = 'romanized' | 'native'; // e.g. 'Tanglish' vs 'తెలుగు లిపి'
export type SpokenLanguage =
  | 'auto'
  | 'te'
  | 'hi'
  | 'en'
  | 'ta'
  | 'kn'
  | 'ml'
  | 'mr'
  | 'bn'
  | 'es'
  | 'fr';

export type CaptionAnimationEffect =
  | 'capcut-bounce'   // CapCut signature bounce pop & tilt
  | 'hormozi-box'     // Alex Hormozi jumping word highlight badge
  | 'premiere-glow'   // Premiere Pro electric neon glow & scale
  | 'comic-pop'       // MrBeast 3D comic shadow & energetic pop
  | 'fire-flame'      // Flame gradient & hype jump
  | 'cinematic-clean' // Netflix / Premiere pristine film look
  | 'none';

export type SubtitlePreset =
  | 'capcut-viral'
  | 'hormozi-yellow'
  | 'premiere-glow'
  | 'mrbeast-comic'
  | 'cinema-gold'
  | 'neon-tokyo'
  | 'fire-hype'
  | 'clean-minimal'
  | 'reel-bold'
  | 'cinema-yellow'
  | 'boxed'
  | 'spotlight'
  | 'neon-pop'
  | 'noir'
  | 'gold-luxe'
  | 'punch'
  | 'dark'
  | 'headline';

export type SubtitlePosition = 'bottom' | 'middle' | 'top';
export type VideoAspectRatio = 'original' | '9:16' | '16:9' | '1:1';

export interface SubtitleStyle {
  preset: SubtitlePreset;
  animationEffect: CaptionAnimationEffect;
  fontSize: number;          // in pixels
  textColor: string;        // hex
  backgroundColor: string;  // rgba or hex
  outlineColor: string;     // hex
  outlineWidth: number;     // px
  position: SubtitlePosition;
  fontFamily: string;
  uppercase: boolean;
  highlightCurrentWord?: boolean;
  highlightColor?: string;
  shadowEffect?: boolean;
  syncOffset?: number; // Timing lead offset in seconds (e.g. -0.35s to pop words in tight sync with voice onset)
}

export type AppStage =
  | 'idle'
  | 'configuring'  // "Prepare your media" modal (Replix-style)
  | 'extracting'   // pulling audio out of the video
  | 'uploading'    // uploading audio to Gemini Files API
  | 'transcribing' // waiting for speech-to-text
  | 'editing'      // 3-column Replix editor layout
  | 'burning'      // burning subtitles into MP4
  | 'done';        // export finished
