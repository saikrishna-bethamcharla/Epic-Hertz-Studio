// ─── Precision Timecode Formatter ──────────────────────────────────────────
// Formats timestamps consistently across CaptionEditor, Timeline, and Preview.

/**
 * Formats a time in seconds into mm:ss.SS (or hh:mm:ss.SS for long videos)
 * e.g., 4.25 -> "0:04.25", 74.8 -> "1:14.80"
 */
export function formatTimecode(secs: number, options: { decimals?: boolean; padMinutes?: boolean } = {}): string {
  const { decimals = true, padMinutes = false } = options;
  if (!Number.isFinite(secs) || secs < 0) secs = 0;

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  const hundredths = Math.floor((secs % 1) * 100);

  const mStr = padMinutes || h > 0 ? (m < 10 ? `0${m}` : `${m}`) : `${m}`;
  const sStr = s < 10 ? `0${s}` : `${s}`;
  const msStr = hundredths < 10 ? `0${hundredths}` : `${hundredths}`;

  if (h > 0) {
    const base = `${h}:${mStr}:${sStr}`;
    return decimals ? `${base}.${msStr}` : base;
  }

  const base = `${mStr}:${sStr}`;
  return decimals ? `${base}.${msStr}` : base;
}

/**
 * Compact timecode for ruler ticks (e.g., "0:00", "0:05", "1:30")
 */
export function formatRulerTick(secs: number): string {
  return formatTimecode(secs, { decimals: false, padMinutes: true });
}
