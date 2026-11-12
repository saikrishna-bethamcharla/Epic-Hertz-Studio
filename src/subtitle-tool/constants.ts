// ─── constants.ts — Epic Hertz Studio ─────────────────────────────────────────
// Centralized constants, types, and default values used across all subtitle tool modules.
// Most are re-exported from their original definitions to avoid duplication.
// New constants specific to this toolkit are defined inline.

// Re-export commonly used types from './types' for convenience
export type {
  AppStage,
  Segment,
  SegmentStyleOverride,
  CaptionStyle,
  SpokenLanguage,
  ScriptOutput,
  VideoAspectRatio,
  LowerThirdSpec,
  WordTimestamp,
} from './types';

// Re-export commonly used types from './engine/spec' for convenience
export type {
  TextCase,
  LowerThirdVariant,
  LowerThirdColors,
  LowerThirdPosition,
  LowerThirdVariant as LowerThirdVariantExported,
} from './engine/spec';

// Re-export DEFAULT_LOWER_THIRD from engine/spec (it's defined there)
export { DEFAULT_LOWER_THIRD } from './engine/spec';

// Re-export FONT_FAMILIES and related from engine/spec
export { FONT_FAMILIES, fontById, SCRIPT_FONTS, COMPLEX_SCRIPT } from './engine/spec';

// Re-export getEffectiveCaptionStyle from engine/spec
export { getEffectiveCaptionStyle } from './engine/spec';

// Re-export DEFAULT_STYLE from engine/presets (it's defined there, not spec)
export { DEFAULT_STYLE } from './engine/presets';

// Re-export layout utilities from v2/userPresets
export { getStoredLayout, saveStoredLayout, type WorkspaceLayout } from './v2/userPresets';

// ---------------------------------------------------------------------------
// Keybinding constants
// ---------------------------------------------------------------------------
export const KEYBINDINGS = {
  undo: ['MetaKey', 'Control'], // Cmd+Z / Ctrl+Z
  redo: ['MetaKey', 'KeyY'], // Cmd+Y / Ctrl+Y
  shortcuts: '?', // Show shortcuts cheat sheet
  escape: 'Escape',
  toggle_captions: '\\', // Backslash to toggle hide captions
  fullscreen: 'f',
  play_pause: ['MetaKey', 'Space'], // Cmd+Space / Space
  seek_backward: 'j',
  seek_forward: 'l',
  split_at_playhead: 's',
  delete: ['Delete', 'Backspace'],
  jump_prev: 'ArrowUp',
  jump_next: 'ArrowDown',
  collapse_left: '[', // Collapse left library panel
  collapse_right: ']', // Collapse right inspector panel
};

// ---------------------------------------------------------------------------
// Memory / export constants
// ---------------------------------------------------------------------------
export const MEMORY = {
  SAFE_QUALITY: 'standard',
  SAFE_RESOLUTION: '1080p',
  HIGH_MEMORY_THRESHOLD_MB: 950,
  EXPORT_QUALITIES: ['low', 'medium', 'high', 'lossless'] as const,
  EXPORT_RESOLUTIONS: ['720p', '1080p', '4K'] as const,
};

// ---------------------------------------------------------------------------
// Export quality/resolution recommendations based on memory budget
// ---------------------------------------------------------------------------
export const EXPORT_RECOMMENDATIONS = {
  [MEMORY.SAFE_QUALITY]: {
    minResolution: '720p' as const,
    maxResolution: '1080p' as const,
  },
  medium: {
    minResolution: '720p' as const,
    maxResolution: '4K' as const,
  },
  high: {
    minResolution: '1080p' as const,
    maxResolution: '4K' as const,
  },
};

// ---------------------------------------------------------------------------
// Default layout values
// ---------------------------------------------------------------------------
export const DEFAULT_LAYOUT = {
  leftWidth: 280,
  rightWidth: 300,
  timelineHeight: 200,
  isLeftCollapsed: false,
  isRightCollapsed: false,
};

// ---------------------------------------------------------------------------
// API endpoint constants
// ---------------------------------------------------------------------------
export const API = {
  RATE_LIMIT: '/api/rate-limit',
  TRANSCRIBE: '/api/transcribe',
};

// ---------------------------------------------------------------------------
// Storage keys
// ---------------------------------------------------------------------------
export const STORAGE = {
  GEMINI_API_KEY: 'epic_gemini_api_key',
  STORED_LAYOUT: 'stored_layout',
};

// ---------------------------------------------------------------------------
// Default project name pattern
// ---------------------------------------------------------------------------
export const PROJECT_NAME_PATTERN = /\\.[^/.]+$/;

// ---------------------------------------------------------------------------
// Demo segments for Try Demo button
// ---------------------------------------------------------------------------
export const DEMO_SEGMENTS = [
  {
    id: 'demo-1',
    index: 1,
    start: 0.1,
    end: 1.4,
    text: 'Prathi frame lo oka katha',
    words: [
      { word: 'Prathi', start: 0.1, end: 0.4 },
      { word: 'frame', start: 0.4, end: 0.7 },
      { word: 'lo', start: 0.7, end: 0.9 },
      { word: 'oka', start: 0.9, end: 1.1 },
      { word: 'katha', start: 1.1, end: 1.4 },
    ],
  },
  {
    id: 'demo-2',
    index: 2,
    start: 1.5,
    end: 2.7,
    text: 'Mana cinema mana passion',
    words: [
      { word: 'Mana', start: 1.5, end: 1.8 },
      { word: 'cinema', start: 1.8, end: 2.1 },
      { word: 'mana', start: 2.1, end: 2.4 },
      { word: 'passion', start: 2.4, end: 2.7 },
    ],
  },
  {
    id: 'demo-3',
    index: 3,
    start: 2.8,
    end: 3.9,
    text: 'Epic Hertz AI auto captions',
    words: [
      { word: 'Epic', start: 2.8, end: 3.1 },
      { word: 'Hertz', start: 3.1, end: 3.4 },
      { word: 'AI', start: 3.4, end: 3.6 },
      { word: 'auto', start: 3.6, end: 3.8 },
      { word: 'captions', start: 3.8, end: 3.9 },
    ],
  },
] as const;
