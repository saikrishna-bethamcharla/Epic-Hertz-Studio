// ─── CaptionEditor ────────────────────────────────────────────────────────────
// Left panel caption list matching ReplixCaptions reference:
// - Header with "CAPTIONS [Tanglish]" badge and search filter
// - Segment rows with precision timestamp pill, inline editable text, split/merge keys
// - Word-level timing chip editor (nudge boundaries, loop-preview words, distribute)
// - Multi-select and bulk actions (bulk delete, bulk merge, bulk time shift)
// - Readability and timing diagnostics (CPS, WPM, duration, overlap warnings)
// - Playhead active sync, seek on click, plus add/split/delete actions

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Trash2, Combine } from 'lucide-react';
import { fixTimings } from './utils/alignWords';
import {
  rechunkSegments,
  transformTextCase,
  stripSmartPunctuation,
  autoPairEmojis,
} from './utils/captionPacing';
import type {
  Segment,
  ScriptOutput,
  SpokenLanguage,
  WordTimestamp,
  SegmentStyleOverride,
} from './types';
import { CaptionCard } from './editor/CaptionCard';
import { timeStore } from './store/timeStore';

export interface CaptionEditorProps {
  segments: Segment[];
  activeId?: string | null;
  selectedId?: string | null;
  isPlaying?: boolean;
  scriptOutput?: ScriptOutput;
  spokenLanguage?: SpokenLanguage;
  onSegmentsChange: (segments: Segment[]) => void;
  onSeek: (time: number) => void;
  onSelectSegment?: (id: string) => void;
}

function CaptionEditor({
  segments,
  activeId,
  selectedId,
  scriptOutput = 'romanized',
  spokenLanguage = 'te',
  onSegmentsChange,
  onSeek,
  onSelectSegment,
}: CaptionEditorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWordIds, setExpandedWordIds] = useState<Set<string>>(new Set());
  const [styleOverrideSegIds, setStyleOverrideSegIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedIdRef = useRef<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to active caption row via direct store subscription
  // Completely decoupled from React re-renders so CaptionEditor never re-renders during playback!
  useEffect(() => {
    return timeStore.subscribePlayheadId(() => {
      const curActiveId = timeStore.getPlayheadId();
      if (!curActiveId || isUserScrollingRef.current) return;
      const el = document.getElementById(`caption-${curActiveId}`);
      const container = scrollContainerRef.current;
      if (el && container) {
        const cRect = container.getBoundingClientRect();
        const eRect = el.getBoundingClientRect();
        // Only scroll if outside visible bounds to eliminate layout thrashing
        if (eRect.top < cRect.top + 20 || eRect.bottom > cRect.bottom - 20) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });
  }, []);

  // Also support manual activeId prop updates if supplied
  useEffect(() => {
    if (!activeId || isUserScrollingRef.current) return;
    const el = document.getElementById(`caption-${activeId}`);
    const container = scrollContainerRef.current;
    if (el && container) {
      const cRect = container.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      if (eRect.top < cRect.top + 20 || eRect.bottom > cRect.bottom - 20) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeId]);

  const handleScroll = () => {
    isUserScrollingRef.current = true;
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 2000);
  };

  const updateSegment = useCallback(
    (id: string, patch: Partial<Segment>) => {
      onSegmentsChange(segments.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    },
    [segments, onSegmentsChange],
  );

  const deleteSegment = useCallback(
    (id: string) => {
      const next = segments.filter((s) => s.id !== id).map((s, i) => ({ ...s, index: i + 1 }));
      onSegmentsChange(next);
      setSelectedIds((prev) => {
        const copy = new Set(prev);
        copy.delete(id);
        return copy;
      });
    },
    [segments, onSegmentsChange],
  );

  const addAfter = useCallback(
    (id: string) => {
      const idx = segments.findIndex((s) => s.id === id);
      if (idx === -1) return;
      const prev = segments[idx];
      const next = segments[idx + 1];
      const newStart = +(prev.end + 0.05).toFixed(2);
      const newEnd = next
        ? +Math.min(next.start - 0.05, newStart + 2).toFixed(2)
        : +(newStart + 2).toFixed(2);
      const newSeg: Segment = {
        id: `seg-${Date.now()}`,
        index: idx + 2,
        start: newStart,
        end: newEnd,
        text: '',
      };
      const updated = [...segments.slice(0, idx + 1), newSeg, ...segments.slice(idx + 1)].map(
        (s, i) => ({ ...s, index: i + 1 }),
      );
      onSegmentsChange(updated);
    },
    [segments, onSegmentsChange],
  );

  // Toggle words expanded view for a caption
  const toggleWordsExpanded = useCallback((id: string) => {
    setExpandedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Toggle style override view for a caption
  const toggleStyleOverride = useCallback((id: string) => {
    setStyleOverrideSegIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Helper to ensure word array exists
  const getOrInitWords = useCallback((seg: Segment): WordTimestamp[] => {
    if (seg.words && seg.words.length > 0) return [...seg.words];
    const rawWords = seg.text.trim().split(/\s+/).filter(Boolean);
    const duration = Math.max(0.2, seg.end - seg.start);
    const perWord = duration / Math.max(1, rawWords.length);
    return rawWords.map((w, i) => ({
      word: w,
      start: +(seg.start + i * perWord).toFixed(2),
      end: +(seg.start + (i + 1) * perWord).toFixed(2),
    }));
  }, []);

  // Auto-distribute word timings proportionally based on character count
  const handleAutoDistributeWords = useCallback((seg: Segment) => {
    const fixed = fixTimings(seg);
    updateSegment(seg.id, { words: fixed.words, start: fixed.start, end: fixed.end });
  }, [updateSegment]);

  // Update a single word's timing, color, or emphasis inside a segment
  const updateWord = useCallback((seg: Segment, wordIdx: number, patch: Partial<WordTimestamp>) => {
    const currentWords = getOrInitWords(seg);
    if (!currentWords[wordIdx]) return;
    currentWords[wordIdx] = { ...currentWords[wordIdx], ...patch };
    updateSegment(seg.id, { words: currentWords });
  }, [getOrInitWords, updateSegment]);

  // Nudge word boundaries
  const nudgeWord = useCallback((seg: Segment, wordIdx: number, deltaStart: number, deltaEnd: number) => {
    const currentWords = getOrInitWords(seg);
    const w = currentWords[wordIdx];
    if (!w) return;
    const newStart = Math.max(seg.start, +(w.start + deltaStart).toFixed(2));
    const newEnd = Math.min(seg.end, Math.max(newStart + 0.05, +(w.end + deltaEnd).toFixed(2)));
    currentWords[wordIdx] = { ...w, start: newStart, end: newEnd };
    updateSegment(seg.id, { words: currentWords });
  }, [getOrInitWords, updateSegment]);

  const cycleWordEmphasis = useCallback((seg: Segment, wordIdx: number) => {
    const currentWords = getOrInitWords(seg);
    const curr = currentWords[wordIdx]?.emphasis || 'none';
    const modes: ('none' | 'pop' | 'shake' | 'glow' | 'underline')[] = [
      'none',
      'pop',
      'shake',
      'glow',
      'underline',
    ];
    const next = modes[(modes.indexOf(curr) + 1) % modes.length];
    updateWord(seg, wordIdx, { emphasis: next });
  }, [getOrInitWords, updateWord]);

  const cycleWordColor = useCallback((seg: Segment, wordIdx: number) => {
    const currentWords = getOrInitWords(seg);
    const colors = ['', '#FACC15', '#EC4899', '#06B6D4', '#84CC16', '#EF4444', '#FB923C'];
    const curr = currentWords[wordIdx]?.highlightColor || '';
    const next = colors[(colors.indexOf(curr) + 1) % colors.length];
    updateWord(seg, wordIdx, { highlightColor: next || undefined });
  }, [getOrInitWords, updateWord]);

  const updateSegmentStyleOverride = useCallback((
    segId: string,
    override: Partial<SegmentStyleOverride> | null,
  ) => {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return;
    if (override === null) {
      updateSegment(segId, { styleOverride: undefined });
    } else {
      updateSegment(segId, {
        styleOverride: {
          ...(seg.styleOverride || {}),
          ...override,
        },
      });
    }
  }, [segments, updateSegment]);

  const cycleSpeaker = useCallback((segId: string) => {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return;
    const speakers = [undefined, 'Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4'];
    const currIdx = speakers.indexOf(seg.speaker);
    const nextSpeaker = speakers[(currIdx + 1) % speakers.length];
    updateSegment(segId, { speaker: nextSpeaker });
  }, [segments, updateSegment]);

  const handleToggleSelectCheckbox = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    lastClickedIdRef.current = id;
  }, []);

  const handleBulkSetSpeaker = (speaker?: string) => {
    if (selectedIds.size === 0) return;
    const updated = segments.map((s) => {
      if (selectedIds.has(s.id)) {
        return { ...s, speaker };
      }
      return s;
    });
    onSegmentsChange(updated);
  };

  // Split segment at cursor when pressing Enter inside caption textarea
  const splitAtCursor = useCallback(
    (id: string, cursorIndex: number) => {
      const idx = segments.findIndex((s) => s.id === id);
      if (idx === -1) return;
      const target = segments[idx];
      const fullText = target.text;
      const beforeText = fullText.slice(0, cursorIndex).trim();
      const afterText = fullText.slice(cursorIndex).trim();

      if (!beforeText || !afterText) return;

      const ratio = beforeText.length / (beforeText.length + afterText.length);
      const span = target.end - target.start;
      const splitTime = +(target.start + Math.max(0.2, Math.min(span - 0.2, span * ratio))).toFixed(
        2,
      );

      const words1 = target.words ? target.words.filter((w) => w.start <= splitTime) : undefined;
      const words2 = target.words ? target.words.filter((w) => w.start > splitTime) : undefined;

      const seg1: Segment = {
        ...target,
        text: beforeText,
        end: splitTime,
        words: words1,
      };

      const newId = `seg-${Date.now()}`;
      const seg2: Segment = {
        ...target,
        id: newId,
        index: idx + 2,
        start: splitTime,
        end: target.end,
        text: afterText,
        words: words2,
        styleOverride: target.styleOverride ? { ...target.styleOverride } : undefined,
        speaker: target.speaker,
      };

      const updated = [...segments.slice(0, idx), seg1, seg2, ...segments.slice(idx + 1)].map(
        (s, i) => ({ ...s, index: i + 1 }),
      );

      onSegmentsChange(updated);

      // Focus the newly split second segment shortly after render
      setTimeout(() => {
        const nextInput = document.querySelector<HTMLTextAreaElement>(`#caption-${newId} textarea`);
        nextInput?.focus();
        nextInput?.setSelectionRange(0, 0);
      }, 50);
    },
    [segments, onSegmentsChange],
  );

  // Merge segment with previous when pressing Backspace at index 0
  const mergeWithPrevious = useCallback(
    (id: string): boolean => {
      const idx = segments.findIndex((s) => s.id === id);
      if (idx <= 0) return false;
      const prev = segments[idx - 1];
      const curr = segments[idx];

      const mergedText = `${prev.text.trim()} ${curr.text.trim()}`.trim();
      const mergedWords =
        prev.words || curr.words ? [...(prev.words || []), ...(curr.words || [])] : undefined;

      const mergedSeg: Segment = {
        ...prev,
        text: mergedText,
        end: Math.max(prev.end, curr.end),
        words: mergedWords,
      };

      const updated = [...segments.slice(0, idx - 1), mergedSeg, ...segments.slice(idx + 1)].map(
        (s, i) => ({ ...s, index: i + 1 }),
      );

      onSegmentsChange(updated);

      // Position cursor at junction point in the merged textarea
      setTimeout(() => {
        const prevInput = document.querySelector<HTMLTextAreaElement>(
          `#caption-${prev.id} textarea`,
        );
        if (prevInput) {
          prevInput.focus();
          const junction = prev.text.trim().length + 1;
          prevInput.setSelectionRange(junction, junction);
        }
      }, 50);

      return true;
    },
    [segments, onSegmentsChange],
  );

  // Selection logic (click, shift-click range, cmd/ctrl-click toggle)
  const handleSelectRow = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (e.shiftKey && lastClickedIdRef.current) {
        const idx1 = segments.findIndex((s) => s.id === lastClickedIdRef.current);
        const idx2 = segments.findIndex((s) => s.id === id);
        if (idx1 !== -1 && idx2 !== -1) {
          const [startIdx, endIdx] = idx1 < idx2 ? [idx1, idx2] : [idx2, idx1];
          const range = new Set(segments.slice(startIdx, endIdx + 1).map((s) => s.id));
          setSelectedIds(range);
          return;
        }
      }

      if (e.metaKey || e.ctrlKey) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        lastClickedIdRef.current = id;
        return;
      }

      // Normal click: select single if multiple were active, else maintain
      lastClickedIdRef.current = id;
      setSelectedIds((prev) => (prev.size > 1 ? new Set([id]) : prev));
    },
    [segments],
  );

  // Bulk actions
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const next = segments
      .filter((s) => !selectedIds.has(s.id))
      .map((s, i) => ({ ...s, index: i + 1 }));
    onSegmentsChange(next);
    setSelectedIds(new Set());
  };

  const handleBulkMerge = () => {
    if (selectedIds.size <= 1) return;
    const selectedList = segments.filter((s) => selectedIds.has(s.id));
    if (selectedList.length === 0) return;

    const first = selectedList[0];
    const last = selectedList[selectedList.length - 1];
    const mergedText = selectedList
      .map((s) => s.text.trim())
      .filter(Boolean)
      .join(' ');
    const allWords = selectedList.flatMap((s) => s.words || []);

    const mergedSeg: Segment = {
      ...first,
      text: mergedText,
      end: last.end,
      words: allWords.length > 0 ? allWords : undefined,
    };

    const firstIdx = segments.findIndex((s) => s.id === first.id);
    const filtered = segments.filter((s) => !selectedIds.has(s.id));
    const targetIdx = Math.max(0, Math.min(filtered.length, firstIdx));
    const updated = [...filtered.slice(0, targetIdx), mergedSeg, ...filtered.slice(targetIdx)].map(
      (s: Segment, i: number) => ({ ...s, index: i + 1 }),
    );

    onSegmentsChange(updated);
    setSelectedIds(new Set([mergedSeg.id]));
  };

  const handleBulkShiftTime = (delta: number) => {
    if (selectedIds.size === 0) return;
    const updated = segments.map((s) => {
      if (!selectedIds.has(s.id)) return s;
      const newStart = Math.max(0, +(s.start + delta).toFixed(2));
      const newEnd = Math.max(newStart + 0.1, +(s.end + delta).toFixed(2));
      const newWords = s.words?.map((w) => ({
        ...w,
        start: Math.max(0, +(w.start + delta).toFixed(2)),
        end: Math.max(0, +(w.end + delta).toFixed(2)),
      }));
      return { ...s, start: newStart, end: newEnd, words: newWords };
    });
    onSegmentsChange(updated);
  };

  // Filtered segments if searching
  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, searchQuery]);

  const scriptBadgeText = useMemo(() => {
    if (scriptOutput === 'native') return 'Native';
    if (spokenLanguage === 'te') return 'Tanglish';
    if (spokenLanguage === 'hi') return 'Hinglish';
    if (spokenLanguage === 'ta') return 'Tanglish';
    return 'Romanized';
  }, [scriptOutput, spokenLanguage]);

  // Pacing, Casing & Emoji Handlers
  const handlePacingChange = (density: '1-word' | '2-3-words' | 'sentence') => {
    const updated = rechunkSegments(segments, density);
    onSegmentsChange(updated);
  };

  const handleTransformCasing = (mode: 'upper' | 'title' | 'lower') => {
    const updated = transformTextCase(segments, mode);
    onSegmentsChange(updated);
  };

  const handleStripPunctuation = () => {
    const updated = stripSmartPunctuation(segments);
    onSegmentsChange(updated);
  };

  const handleAutoEmojis = () => {
    const { segments: updated, matchedCount } = autoPairEmojis(segments);
    if (matchedCount > 0) {
      onSegmentsChange(updated);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#141413] border-r border-white/10 select-none">
      {/* Header matching ReplixCaptions */}
      <div className="p-4 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-bold text-mist uppercase tracking-widest">
            Captions
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
            {scriptBadgeText}
          </span>
          <span className="text-smoke text-xs ml-auto font-mono">{segments.length}</span>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-xs text-smoke font-medium">Review & word timing</h2>
        </div>

        {/* Quick Search */}
        <div className="mt-2.5 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dialogue…"
            aria-label="Search caption dialogue"
            className="w-full bg-[#1f1f1d] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-bone placeholder:text-smoke focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search filter"
              title="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-smoke hover:text-bone text-xs p-1 rounded"
            >
              ✕
            </button>
          )}
        </div>

        {/* Caption Pacing & Detailing Toolbar */}
        <div className="mt-2.5 pt-2 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[11px]">
          {/* Pacing Density Selector */}
          <div className="flex items-center gap-0.5 bg-[#191918] p-0.5 rounded-lg border border-white/10">
            <span className="text-[10px] text-smoke pl-1.5 pr-0.5 font-medium">Pacing:</span>
            <button
              type="button"
              onClick={() => handlePacingChange('1-word')}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-smoke hover:text-amber-300 hover:bg-white/5 transition-colors cursor-pointer"
              title="1 Word at a time (Ultra-kinetic TikTok & Reels style)"
            >
              1-Word
            </button>
            <button
              type="button"
              onClick={() => handlePacingChange('2-3-words')}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-smoke hover:text-amber-300 hover:bg-white/5 transition-colors cursor-pointer"
              title="2 to 3 Words (Punchy dynamic phrase rhythm)"
            >
              2–3
            </button>
            <button
              type="button"
              onClick={() => handlePacingChange('sentence')}
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-smoke hover:text-amber-300 hover:bg-white/5 transition-colors cursor-pointer"
              title="Sentence Blocks (Narrative conversational rhythm)"
            >
              Sentence
            </button>
          </div>

          {/* Casing & Punctuation Tools */}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              onClick={() => handleTransformCasing('upper')}
              className="px-1.5 py-0.5 rounded bg-[#191918] hover:bg-white/10 border border-white/10 text-smoke hover:text-bone text-[10px] font-bold tracking-wider transition-colors cursor-pointer"
              title="Transform all text to UPPERCASE"
            >
              CAPS
            </button>
            <button
              type="button"
              onClick={() => handleTransformCasing('title')}
              className="px-1.5 py-0.5 rounded bg-[#191918] hover:bg-white/10 border border-white/10 text-smoke hover:text-bone text-[10px] font-medium transition-colors cursor-pointer"
              title="Transform all text to Title Case"
            >
              Aa
            </button>
            <button
              type="button"
              onClick={handleStripPunctuation}
              className="px-1.5 py-0.5 rounded bg-[#191918] hover:bg-white/10 border border-white/10 text-smoke hover:text-bone text-[10px] font-mono transition-colors cursor-pointer"
              title="Strip commas, periods & semicolons for clean kinetic punchiness"
            >
              No [.,]
            </button>
            <button
              type="button"
              onClick={handleAutoEmojis}
              className="px-1.5 py-0.5 rounded bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-300 text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              title="Auto-pair viral trigger words with animated emojis"
            >
              <span>✨ Emojis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Selection Actions Bar */}
      <AnimatePresence>
        {selectedIds.size > 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2 bg-gradient-to-r from-amber-500/15 via-[#1a1a18] to-[#1a1a18] border-b border-amber-400/30 flex items-center justify-between gap-2 text-xs shrink-0"
          >
            <div className="flex items-center gap-2 font-medium text-amber-300 text-[11px]">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectedIds.size} captions selected</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleBulkMerge}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-bone text-[11px] font-medium transition-colors flex items-center gap-1"
                title="Merge selected captions into one"
              >
                <Combine className="w-3 h-3 text-amber-400" />
                <span>Merge</span>
              </button>
              <button
                type="button"
                onClick={() => handleBulkShiftTime(-0.1)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-bone text-[10px] font-mono transition-colors"
                title="Shift selected -0.1s"
              >
                -0.1s
              </button>
              <button
                type="button"
                onClick={() => handleBulkShiftTime(0.1)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-bone text-[10px] font-mono transition-colors"
                title="Shift selected +0.1s"
              >
                +0.1s
              </button>
              <div className="flex items-center gap-1 border-l border-white/10 pl-1.5 ml-0.5">
                <span className="text-[10px] text-smoke font-mono">Speaker:</span>
                {['S1', 'S2', 'S3'].map((code, i) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleBulkSetSpeaker(`Speaker ${i + 1}`)}
                    className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-bone text-[10px] font-mono font-bold"
                    title={`Set selected to Speaker ${i + 1}`}
                  >
                    {code}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleBulkSetSpeaker(undefined)}
                  className="px-1 py-0.5 rounded bg-white/5 hover:bg-white/10 text-smoke text-[9px]"
                  title="Clear speaker"
                >
                  ✕
                </button>
              </div>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="p-1 rounded bg-crimson/15 hover:bg-crimson/25 text-crimson-2 transition-colors"
                title="Delete selected captions"
                aria-label="Delete selected captions"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-smoke hover:text-bone text-[11px] px-1.5 py-0.5"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable list */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-2"
      >
        <AnimatePresence initial={false}>
          {filteredSegments.map((seg, idx) => {
            const isSelected = selectedId === seg.id || selectedIds.has(seg.id);
            const isWordsExpanded = expandedWordIds.has(seg.id);
            const isStyleOverrideOpen = styleOverrideSegIds.has(seg.id);
            const prevSeg = idx > 0 ? filteredSegments[idx - 1] : undefined;
            const nextSeg =
              idx < filteredSegments.length - 1 ? filteredSegments[idx + 1] : undefined;

            return (
              <CaptionCard
                key={seg.id}
                seg={seg}
                prevSeg={prevSeg}
                nextSeg={nextSeg}
                isSelected={isSelected}
                isWordsExpanded={isWordsExpanded}
                isStyleOverrideOpen={isStyleOverrideOpen}
                activeIdProp={activeId}
                onSelectRow={handleSelectRow}
                onSelectSegment={onSelectSegment}
                onSeek={onSeek}
                onToggleSelectCheckbox={handleToggleSelectCheckbox}
                onCycleSpeaker={cycleSpeaker}
                onUpdateSegment={updateSegment}
                onSplitAtCursor={splitAtCursor}
                onMergeWithPrevious={mergeWithPrevious}
                onToggleStyleOverride={toggleStyleOverride}
                onToggleWordsExpanded={toggleWordsExpanded}
                onAddAfter={addAfter}
                onDeleteSegment={deleteSegment}
                onUpdateSegmentStyleOverride={updateSegmentStyleOverride}
                onAutoDistributeWords={handleAutoDistributeWords}
                onUpdateWord={updateWord}
                onCycleWordColor={cycleWordColor}
                onCycleWordEmphasis={cycleWordEmphasis}
                onNudgeWord={nudgeWord}
              />
            );
          })}
        </AnimatePresence>

        {filteredSegments.length === 0 && (
          <div className="text-center py-12 text-smoke text-xs">
            {searchQuery ? 'No matching captions found.' : 'No captions available.'}
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(CaptionEditor);
