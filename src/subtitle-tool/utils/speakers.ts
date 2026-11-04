// ─── Speaker Configurations & Palettes ─────────────────────────────────────────
// Multi-speaker color-coding for podcasts, interviews, and multi-actor dialogue.

export interface SpeakerPalette {
  name: string;
  color: string;       // Primary highlight / accent hex
  bg: string;          // Tailwind background class
  text: string;        // Tailwind text class
  border: string;      // Tailwind border class
  darkBorder: string;  // Hex for canvas/timeline borders
}

export const SPEAKER_PALETTES: SpeakerPalette[] = [
  {
    name: 'Speaker 1',
    color: '#F59E0B',
    bg: 'bg-amber-500/15',
    text: 'text-amber-300',
    border: 'border-amber-400/40',
    darkBorder: '#F59E0B',
  },
  {
    name: 'Speaker 2',
    color: '#06B6D4',
    bg: 'bg-cyan-500/15',
    text: 'text-cyan-300',
    border: 'border-cyan-400/40',
    darkBorder: '#06B6D4',
  },
  {
    name: 'Speaker 3',
    color: '#A855F7',
    bg: 'bg-purple-500/15',
    text: 'text-purple-300',
    border: 'border-purple-400/40',
    darkBorder: '#A855F7',
  },
  {
    name: 'Speaker 4',
    color: '#10B981',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-300',
    border: 'border-emerald-400/40',
    darkBorder: '#10B981',
  },
  {
    name: 'Speaker 5',
    color: '#EC4899',
    bg: 'bg-pink-500/15',
    text: 'text-pink-300',
    border: 'border-pink-400/40',
    darkBorder: '#EC4899',
  },
];

export function getSpeakerStyle(speaker?: string): SpeakerPalette | null {
  if (!speaker) return null;
  const trimmed = speaker.trim();
  if (!trimmed) return null;

  const found = SPEAKER_PALETTES.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
  if (found) return found;

  // Custom speaker name: deterministic color selection based on string hash
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = trimmed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % SPEAKER_PALETTES.length;
  return {
    ...SPEAKER_PALETTES[idx],
    name: trimmed,
  };
}

export function getSpeakerShortCode(speaker?: string): string {
  if (!speaker) return '';
  const trimmed = speaker.trim();
  if (trimmed.toLowerCase().startsWith('speaker ')) {
    const num = trimmed.slice(8).trim();
    return `S${num}`;
  }
  return trimmed.slice(0, 3).toUpperCase();
}
