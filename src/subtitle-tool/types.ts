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
}

export type SubtitlePreset = 'reel-bold' | 'clean-minimal' | 'boxed' | 'cinema-yellow' | 'headline';
export type SubtitlePosition = 'bottom' | 'middle' | 'top';

export interface SubtitleStyle {
  preset: SubtitlePreset;
  fontSize: number;          // in pixels or scale
  textColor: string;        // hex
  backgroundColor: string;  // rgba
  outlineColor: string;     // hex
  outlineWidth: number;     // px
  position: SubtitlePosition;
  fontFamily: string;
  uppercase: boolean;
}

export type AppStage =
  | 'idle'
  | 'extracting'   // pulling audio out of the video
  | 'uploading'    // uploading audio to Gemini Files API
  | 'transcribing' // waiting for speech-to-text
  | 'editing'      // live professional editor
  | 'burning'      // exporting final video
  | 'done';        // complete
