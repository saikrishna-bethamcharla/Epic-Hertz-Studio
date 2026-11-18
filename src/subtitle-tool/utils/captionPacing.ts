// ─── Caption Pacing, Formatting & Splitting Engine ───────────────────────────
// High-precision utilities for re-chunking captions into 1-word kinetic shorts,
// 2-3 word dynamic phrases, or sentence blocks, plus instant cursor split & merge.

import type { Segment, WordTimestamp } from '../types';

export type PacingDensity = '1-word' | '2-3-words' | 'sentence';

/**
 * Extracts all words with reliable timestamps from a segment list.
 * If words are missing on a segment, heuristically distributes them across segment duration.
 */
export function extractAllWords(segments: Segment[]): { words: WordTimestamp[]; speaker?: string }[] {
  return segments.map((seg) => {
    if (seg.words && seg.words.length > 0) {
      return { words: [...seg.words], speaker: seg.speaker };
    }
    // Heuristic word breakdown if segment has text without word timestamps
    const rawTokens = seg.text.trim().split(/\s+/).filter(Boolean);
    if (rawTokens.length === 0) {
      return { words: [], speaker: seg.speaker };
    }
    const dur = Math.max(0.3, seg.end - seg.start);
    const wordDur = dur / rawTokens.length;
    const synthWords: WordTimestamp[] = rawTokens.map((w, idx) => ({
      word: w,
      start: +(seg.start + idx * wordDur).toFixed(2),
      end: +(seg.start + (idx + 1) * wordDur).toFixed(2),
    }));
    return { words: synthWords, speaker: seg.speaker };
  });
}

/**
 * Re-chunks caption segments into target density:
 * - '1-word': Ultra-fast TikTok / Reels kinetic typography (1 word per frame)
 * - '2-3-words': Punchy phrase rhythm (2 to 3 words per frame with natural cadence)
 * - 'sentence': Narrative conversational blocks (sentence or natural pause boundaries)
 */
export function rechunkSegments(segments: Segment[], density: PacingDensity): Segment[] {
  if (segments.length === 0) return [];

  const wordGroups = extractAllWords(segments);
  const result: Segment[] = [];
  let nextIndex = 1;

  for (const group of wordGroups) {
    const words = group.words;
    if (words.length === 0) continue;

    if (density === '1-word') {
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const nextW = words[i + 1];
        // Extend end slightly if next word starts immediately to avoid micro-flicker
        const start = w.start;
        const end = nextW ? Math.min(nextW.start, w.end + 0.05) : w.end;

        result.push({
          id: `seg-${Date.now()}-${nextIndex}`,
          index: nextIndex++,
          start: +start.toFixed(2),
          end: +Math.max(start + 0.2, end).toFixed(2),
          text: w.word,
          speaker: group.speaker,
          words: [{ ...w, start: +start.toFixed(2), end: +Math.max(start + 0.2, end).toFixed(2) }],
        });
      }
    } else if (density === '2-3-words') {
      let currentChunk: WordTimestamp[] = [];

      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        currentChunk.push(w);

        const isLastWord = i === words.length - 1;
        const pauseAfter = isLastWord ? 0 : words[i + 1].start - w.end;
        const hasPunctuation = /[.,!?;:]$/.test(w.word.trim());

        // Break if we reached 3 words, or 2 words with pause/punctuation, or end of group
        if (
          currentChunk.length >= 3 ||
          (currentChunk.length >= 2 && (hasPunctuation || pauseAfter > 0.25)) ||
          isLastWord
        ) {
          const segStart = currentChunk[0].start;
          const segEnd = currentChunk[currentChunk.length - 1].end;
          result.push({
            id: `seg-${Date.now()}-${nextIndex}`,
            index: nextIndex++,
            start: +segStart.toFixed(2),
            end: +Math.max(segStart + 0.35, segEnd).toFixed(2),
            text: currentChunk.map((cw) => cw.word).join(' '),
            speaker: group.speaker,
            words: [...currentChunk],
          });
          currentChunk = [];
        }
      }
    } else {
      // 'sentence' mode: chunk by sentence punctuation or natural 6-8 word phrase limits
      let currentChunk: WordTimestamp[] = [];

      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        currentChunk.push(w);

        const isLastWord = i === words.length - 1;
        const pauseAfter = isLastWord ? 0 : words[i + 1].start - w.end;
        const isSentenceEnd = /[.!?]$/.test(w.word.trim());

        if (isSentenceEnd || currentChunk.length >= 7 || (currentChunk.length >= 4 && pauseAfter > 0.4) || isLastWord) {
          const segStart = currentChunk[0].start;
          const segEnd = currentChunk[currentChunk.length - 1].end;
          result.push({
            id: `seg-${Date.now()}-${nextIndex}`,
            index: nextIndex++,
            start: +segStart.toFixed(2),
            end: +Math.max(segStart + 0.45, segEnd).toFixed(2),
            text: currentChunk.map((cw) => cw.word).join(' '),
            speaker: group.speaker,
            words: [...currentChunk],
          });
          currentChunk = [];
        }
      }
    }
  }

  return result.length > 0 ? result : segments;
}

/**
 * Transforms text case across all segments and words (UPPERCASE, Title Case, lowercase).
 */
export function transformTextCase(segments: Segment[], mode: 'upper' | 'title' | 'lower'): Segment[] {
  return segments.map((seg) => {
    let newText = seg.text;
    if (mode === 'upper') {
      newText = seg.text.toUpperCase();
    } else if (mode === 'lower') {
      newText = seg.text.toLowerCase();
    } else if (mode === 'title') {
      newText = seg.text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
    }

    const newWords = seg.words?.map((w) => {
      let wordStr = w.word;
      if (mode === 'upper') wordStr = w.word.toUpperCase();
      else if (mode === 'lower') wordStr = w.word.toLowerCase();
      else if (mode === 'title') {
        wordStr = w.word.charAt(0).toUpperCase() + w.word.substring(1).toLowerCase();
      }
      return { ...w, word: wordStr };
    });

    return {
      ...seg,
      text: newText,
      words: newWords,
    };
  });
}

/**
 * Strips punctuation marks (.,!?:;) from captions for high-energy clean kinetic reels.
 * Preserves inner apostrophes (e.g. "don't", "it's").
 */
export function stripSmartPunctuation(segments: Segment[]): Segment[] {
  return segments.map((seg) => {
    const cleanText = seg.text
      .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    const cleanWords = seg.words?.map((w) => ({
      ...w,
      word: w.word.replace(/^[.,/#!$%^&*;:{}=\-_`~()?"'«»]+|[.,/#!$%^&*;:{}=\-_`~()?"'«»]+$/g, '').trim(),
    }));

    return {
      ...seg,
      text: cleanText,
      words: cleanWords,
    };
  });
}

/**
 * Splits a segment into two segments at a specific text cursor position (character index).
 * Accurately maps words and timestamps between the two segments.
 */
export function splitSegmentAtCursor(segment: Segment, charIndex: number): [Segment, Segment] {
  const fullText = segment.text;
  const leftText = fullText.slice(0, charIndex).trim();
  const rightText = fullText.slice(charIndex).trim();

  const totalDur = Math.max(0.4, segment.end - segment.start);
  const leftRatio = fullText.length > 0 ? Math.max(0.1, Math.min(0.9, leftText.length / fullText.length)) : 0.5;
  const splitTimestamp = +(segment.start + totalDur * leftRatio).toFixed(2);

  // Split words if present
  let leftWords: WordTimestamp[] = [];
  let rightWords: WordTimestamp[] = [];

  if (segment.words && segment.words.length > 0) {
    const leftWordCount = leftText.split(/\s+/).filter(Boolean).length;
    leftWords = segment.words.slice(0, leftWordCount);
    rightWords = segment.words.slice(leftWordCount);
  }

  const seg1End = leftWords.length > 0 ? leftWords[leftWords.length - 1].end : splitTimestamp;
  const seg2Start = rightWords.length > 0 ? rightWords[0].start : seg1End;

  const seg1: Segment = {
    ...segment,
    id: `seg-${Date.now()}-1`,
    text: leftText || fullText,
    end: Math.max(segment.start + 0.15, seg1End),
    words: leftWords.length > 0 ? leftWords : undefined,
  };

  const seg2: Segment = {
    id: `seg-${Date.now()}-2`,
    index: segment.index + 1,
    start: Math.max(seg1.end, seg2Start),
    end: segment.end,
    text: rightText || '',
    speaker: segment.speaker,
    words: rightWords.length > 0 ? rightWords : undefined,
  };

  return [seg1, seg2];
}

/**
 * Merges two adjacent segments into a single continuous segment.
 */
export function mergeAdjacentSegments(seg1: Segment, seg2: Segment): Segment {
  const combinedText = `${seg1.text.trim()} ${seg2.text.trim()}`.trim();
  const combinedWords = [...(seg1.words || []), ...(seg2.words || [])];

  return {
    ...seg1,
    end: Math.max(seg1.end, seg2.end),
    text: combinedText,
    words: combinedWords.length > 0 ? combinedWords : undefined,
  };
}

/**
 * Auto-Emoji trigger keywords dictionary.
 * Matches high-impact spoken words with kinetic animated emojis.
 */
export const AUTO_EMOJI_MAP: Record<string, string> = {
  money: '💰',
  cash: '💵',
  rich: '🤑',
  dollar: '💸',
  dollars: '💸',
  profit: '📈',
  fire: '🔥',
  lit: '🔥',
  hot: '🔥',
  flame: '🔥',
  rocket: '🚀',
  launch: '🚀',
  growth: '📈',
  scale: '🚀',
  fast: '⚡',
  speed: '⚡',
  energy: '⚡',
  idea: '💡',
  smart: '🧠',
  brain: '🧠',
  think: '🤔',
  warning: '⚠️',
  danger: '🚨',
  mistake: '❌',
  error: '❌',
  stop: '🛑',
  love: '❤️',
  heart: '❤️',
  best: '⭐',
  star: '⭐',
  target: '🎯',
  goal: '🎯',
  focus: '🎯',
  time: '⏱️',
  clock: '⏰',
  watch: '👀',
  look: '👀',
  eye: '👀',
  see: '👀',
  win: '🏆',
  winner: '🏆',
  champion: '🏆',
  trophy: '🏆',
  success: '🎉',
  hundred: '💯',
  perfect: '💯',
  fact: '💯',
  facts: '💯',
  question: '❓',
  why: '❓',
  how: '❓',
  shock: '😱',
  crazy: '🤯',
  insane: '🤯',
  music: '🎵',
  song: '🎶',
  code: '💻',
  computer: '💻',
  phone: '📱',
  call: '📞',
  food: '🍕',
  eat: '🍔',
  coffee: '☕',
};

/**
 * Injects animated emojis above or beside matching keywords.
 */
export function autoPairEmojis(segments: Segment[]): { segments: Segment[]; matchedCount: number } {
  let matchedCount = 0;

  const newSegments = segments.map((seg) => {
    let textModified = false;
    const words = seg.text.split(/\s+/);

    const updatedWords = words.map((rawWord) => {
      const clean = rawWord.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (AUTO_EMOJI_MAP[clean] && !rawWord.includes(AUTO_EMOJI_MAP[clean])) {
        matchedCount++;
        textModified = true;
        return `${rawWord} ${AUTO_EMOJI_MAP[clean]}`;
      }
      return rawWord;
    });

    if (!textModified) return seg;

    const newText = updatedWords.join(' ');
    return {
      ...seg,
      text: newText,
    };
  });

  return { segments: newSegments, matchedCount };
}
