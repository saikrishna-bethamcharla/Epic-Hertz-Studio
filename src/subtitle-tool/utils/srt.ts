// ─── SRT / VTT utilities ────────────────────────────────────────────────────
import type { Segment, WordTimestamp } from '../types';

// ── Segment grouping ─────────────────────────────────────────────────────────

const MAX_WORDS = 8; // maximum words per caption segment
const MAX_DURATION = 4.5; // seconds – cap long silences

/**
 * Groups word-level timestamps into display segments.
 * Strategy: flush at MAX_WORDS words OR MAX_DURATION seconds, whichever comes first.
 */
export function buildSegments(words: WordTimestamp[]): Segment[] {
  const segments: Segment[] = [];
  let buffer: WordTimestamp[] = [];
  let idx = 1;

  const flush = () => {
    if (!buffer.length) return;
    segments.push({
      id: `seg-${idx}`,
      index: idx++,
      start: buffer[0].start,
      end: buffer[buffer.length - 1].end,
      text: buffer
        .map((w) => w.word)
        .join(' ')
        .trim(),
    });
    buffer = [];
  };

  for (const word of words) {
    if (buffer.length === 0) {
      buffer.push(word);
      continue;
    }
    const durSoFar = word.end - buffer[0].start;
    if (buffer.length >= MAX_WORDS || durSoFar > MAX_DURATION) {
      flush();
    }
    buffer.push(word);
  }
  flush();

  return segments;
}

// ── Time formatting ──────────────────────────────────────────────────────────

/**
 * Converts seconds → SRT timestamp  "HH:MM:SS,mmm"
 */
export function toSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return (
    [String(h).padStart(2, '0'), String(m).padStart(2, '0'), String(s).padStart(2, '0')].join(':') +
    ',' +
    String(ms).padStart(3, '0')
  );
}

/**
 * Converts seconds → VTT timestamp  "HH:MM:SS.mmm"
 */
export function toVTTTime(seconds: number): string {
  return toSRTTime(seconds).replace(',', '.');
}

/**
 * Parses "HH:MM:SS,mmm", "HH:MM:SS.mmm", "MM:SS.mmm", or "SS.mmm" → seconds
 */
export function parseTimestamp(ts: string): number {
  if (typeof ts !== 'string') return 0;
  const cleaned = ts.trim().replace(',', '.');
  const [hms, fracStr = '0'] = cleaned.split('.');
  if (!hms) return 0;
  const parts = hms.split(':').map(Number);
  if (parts.some((p) => !Number.isFinite(p))) return 0;

  let seconds = 0;
  if (parts.length === 3) {
    seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    seconds = parts[0] * 60 + parts[1];
  } else if (parts.length === 1) {
    seconds = parts[0];
  }
  const frac = Number(fracStr) / 1000;
  const total = seconds + (Number.isFinite(frac) ? frac : 0);
  return Number.isFinite(total) && total >= 0 ? total : 0;
}

// ── SRT export ───────────────────────────────────────────────────────────────

export function toSRT(segments: Segment[]): string {
  return segments
    .map((seg) => `${seg.index}\n${toSRTTime(seg.start)} --> ${toSRTTime(seg.end)}\n${seg.text}`)
    .join('\n\n');
}

// ── VTT export ───────────────────────────────────────────────────────────────

export function toVTT(segments: Segment[]): string {
  const body = segments
    .map((seg) => `${toVTTTime(seg.start)} --> ${toVTTTime(seg.end)}\n${seg.text}`)
    .join('\n\n');
  return `WEBVTT\n\n${body}`;
}

export function toTXT(segments: Segment[]): string {
  return segments.map((s) => s.text).join('\n');
}

// ── Download helper ──────────────────────────────────────────────────────────

export function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  downloadBlob(blob, filename);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  // Chrome download subsystem is asynchronous: revoking synchronously cancels the download!
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 60000); // 60s delay gives ample time for disk write
}
