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

export type SubtitlePreset =
  | 'reel-bold'
  | 'cinema-yellow'
  | 'clean-minimal'
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
  fontSize: number;          // in pixels or scale
  textColor: string;        // hex
  backgroundColor: string;  // rgba or hex
  outlineColor: string;     // hex
  outlineWidth: number;     // px
  position: SubtitlePosition;
  fontFamily: string;
  uppercase: boolean;
  highlightCurrentWord?: boolean;
  highlightColor?: string;
}

export type AppStage =
  | 'idle'
  | 'configuring'  // "Prepare your media" modal (Replix-style)
  | 'extracting'   // pulling audio out of the video
  | 'uploading'    // uploading audio to Gemini Files API
  | 'transcribing' // waiting for speech-to-text
  | 'editing'      // live professional editor
  | 'burning'      // exporting final video
  | 'done';        // complete

