// ─── Subtitle parsing helpers ───────────────────────────────────────────────
// Lives in api/_lib/ — Vercel ignores underscore-prefixed folders, so this is
// shared code, not a deployed endpoint.

/**
 * Accepts: 1.5 | "1.5" | "1.5s" | "01:23" | "00:01:23.450" | "00:00:01,500"
 * Returns seconds as a number (0 if unparseable).
 */
export function parseTime(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const s = value.trim().replace(',', '.').replace(/\s*s$/i, '');
  if (!s) return 0;
  if (s.includes(':')) {
    const t = s.split(':').reduce((acc, part) => acc * 60 + (parseFloat(part) || 0), 0);
    return Number.isFinite(t) ? t : 0;
  }
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function normalizeWords(rawWords) {
  if (!Array.isArray(rawWords)) return undefined;
  let prevEnd = 0;
  const words = rawWords
    .map((w) => {
      const word = String(w?.word ?? w?.text ?? '').trim();
      let start = parseTime(w?.start ?? w?.start_time ?? 0);
      let end = parseTime(w?.end ?? w?.end_time ?? 0);
      if (start < prevEnd) start = prevEnd; // keep words monotonic
      if (end <= start) end = start + 0.1;
      prevEnd = end;
      return { word, start, end };
    })
    .filter((w) => w.word.length > 0);
  return words.length > 0 ? words : undefined;
}

function normalizeSegments(list) {
  const stamp = Date.now();
  const segs = list
    .map((item) => {
      const text = String(item?.text ?? item?.dialogue ?? item?.caption ?? '').trim();
      const words = normalizeWords(item?.words);
      let start = parseTime(item?.start_time ?? item?.start ?? item?.startTime ?? 0);
      let end = parseTime(item?.end_time ?? item?.end ?? item?.endTime ?? 0);
      if (words && words.length > 0) {
        // If word-level timings are provided, anchor segment start and end to them
        start = words[0].start;
        end = Math.max(start + 0.35, words[words.length - 1].end);
      }
      if (end <= start) end = start + 0.8;
      return { start, end, text, words };
    })
    .filter((s) => s.text.length > 0)
    .sort((a, b) => a.start - b.start);

  // Remove overlaps and enforce positive non-zero segment durations
  for (let i = 1; i < segs.length; i++) {
    const prev = segs[i - 1];
    const curr = segs[i];
    if (curr.start < prev.end) {
      if (curr.start >= prev.start + 0.35) {
        prev.end = curr.start;
      } else {
        curr.start = prev.end;
        if (curr.end <= curr.start) {
          curr.end = curr.start + 0.8;
        }
      }
    }
  }

  return segs.map((s, i) => ({
    id: `seg-${i + 1}-${stamp}`,
    index: i + 1,
    start: +s.start.toFixed(2),
    end: +s.end.toFixed(2),
    text: s.text,
    words: s.words,
  }));
}

function stripFences(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return cleaned;
}

function tryJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function fromSrt(text) {
  const out = [];
  for (const block of text.split(/\n\s*\n/)) {
    const lines = block
      .trim()
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const timeIdx = lines.findIndex((l) => l.includes('-->'));
    if (timeIdx === -1) continue;
    const [startStr, endStr] = lines[timeIdx].split('-->').map((s) => s.trim());
    const body = lines.slice(timeIdx + 1).join(' ');
    if (body) out.push({ start: parseTime(startStr), end: parseTime(endStr), text: body });
  }
  return out;
}

/**
 * Returns an array of segments, or [] if nothing trustworthy could be parsed.
 * Deliberately has NO "invent timings" fallback — wrong sync is worse than an error.
 */
export function parseSegmentsFromResponse(rawText) {
  const cleaned = stripFences(String(rawText || ''));
  if (!cleaned) return [];

  // 1. Straight JSON, or JSON wrapped in model chatter ("Here you go: [...]")
  let data = tryJson(cleaned);
  if (data === null) {
    const a = cleaned.indexOf('[');
    const b = cleaned.lastIndexOf(']');
    if (a !== -1 && b > a) data = tryJson(cleaned.slice(a, b + 1));
  }
  if (data !== null) {
    const list = Array.isArray(data) ? data : data.segments || data.subtitles || [];
    if (Array.isArray(list) && list.length > 0) {
      const segs = normalizeSegments(list);
      if (segs.length > 0) return segs;
    }
  }

  // 2. SRT-style output
  const srt = fromSrt(cleaned);
  if (srt.length > 0) return normalizeSegments(srt);

  return [];
}
