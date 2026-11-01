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
  // Motion slide & kinetic text movements
  | 'slide-up'             // Vertical mask slide up from bottom
  | 'slide-left'           // Kinetic slide in from left with inertia
  | 'slide-right'          // Kinetic slide in from right with inertia
  | 'punch-zoom'           // Elastic punch zoom in
  | 'word-cascade'         // Staggered word-by-word slide rise
  | 'flip-3d'              // 3D perspective roll/flip into place
  | 'bounce-rise'          // Elastic spring bounce upward with overshoot
  | 'glitch-whip'          // Fast lateral snap with chromatic RGB displacement
  | 'float-drift'          // Smooth floating kinetic pan
  | 'typewriter'           // Editorial typewriter reveal
  | 'highlight-wipe'       // Accent marker wipe under active word
  // Legacy aliases
  | 'capcut-bounce'
  | 'hormozi-box'
  | 'premiere-glow'
  | 'comic-pop'
  | 'fire-flame'
  | 'cinematic-clean'
  | 'premiere-rgb-glitch'
  | 'premiere-whip-slide'
  | 'premiere-typewriter'
  | 'premiere-highlight-wipe'
  | 'premiere-lower-third'
  | 'premiere-impact-shake'
  | 'none';

export type SubtitlePreset =
  // Primary unified motion presets
  | 'slide-up-modern'
  | 'whip-left-bold'
  | 'punch-zoom-action'
  | 'word-cascade-reel'
  | 'flip-3d-title'
  | 'bounce-rise-kinetic'
  | 'glitch-whip-cyber'
  | 'highlight-sweep'
  | 'broadcast-lower-third'
  | 'editorial-typewriter'
  | 'cinema-drift'
  | 'clean-minimal'
  // Legacy aliases
  | 'capcut-viral'
  | 'hormozi-yellow'
  | 'premiere-glow'
  | 'mrbeast-comic'
  | 'cinema-gold'
  | 'neon-tokyo'
  | 'fire-hype'
  | 'reel-bold'
  | 'cinema-yellow'
  | 'boxed'
  | 'spotlight'
  | 'neon-pop'
  | 'noir'
  | 'gold-luxe'
  | 'punch'
  | 'dark'
  | 'headline'
  | 'premiere-glitch'
  | 'premiere-whip'
  | 'premiere-broadcast'
  | 'premiere-highlighter';

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
