// ─── CaptionEditor ────────────────────────────────────────────────────────────
// Left panel caption list matching ReplixCaptions reference:
// - Header with "CAPTIONS [Tanglish]" badge and search filter
// - Segment rows with precision timestamp pill, inline editable text, split/merge keys
// - Word-level timing chip editor (nudge boundaries, loop-preview words, distribute)
// - Multi-select and bulk actions (bulk delete, bulk merge, bulk time shift)
// - Readability and timing diagnostics (CPS, WPM, duration, overlap warnings)
// - Playhead active sync, seek on click, plus add/split/delete actions

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  Trash2,
  Combine,
  AlertTriangle,
  Wand2,
  Smile,
  Sliders,
  Palette,
  RotateCcw,
  Mic,
} from 'lucide-react';
import { formatTimecode } from './utils/formatTime';
import { checkReadability, getCPS } from './utils/readability';
import { getSpeakerStyle, getSpeakerShortCode } from './utils/speakers';
import type { Segment, ScriptOutput, SpokenLanguage, WordTimestamp, SegmentStyleOverride } from './types';

const POPULAR_EMOJIS = [
  { label: 'Hype', emojis: ['🔥', '⚡', '💥', '🚀', '💯', '👑', '✨', '🌟'] },
  { label: 'Mindset', emojis: ['💡', '🧠', '🎯', '📈', '💰', '🔑', '🏆', '📌'] },
  { label: 'Reactions', emojis: ['😂', '😱', '🤯', '🤫', '👀', '💀', '🤩', '🙌'] },
  { label: 'Signals', emojis: ['👍', '👏', '🤝', '❤️', '🚨', '⚠️', '❌', '✅'] },
];

const PRESET_ACCENT_COLORS = [
  { label: 'Yellow', value: '#FACC15' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Cyan', value: '#06B6D4' },
  { label: 'Lime', value: '#84CC16' },
  { label: 'Orange', value: '#FB923C' },
  { label: 'Red', value: '#EF4444' },
];

interface CaptionEditorProps {
  segments: Segment[];
  activeId: string | null;
  scriptOutput?: ScriptOutput;
  spokenLanguage?: SpokenLanguage;
  onSegmentsChange: (segments: Segment[]) => void;
  onSeek: (time: number) => void;
}

export default function CaptionEditor({
  segments,
  activeId,
  scriptOutput = 'romanized',
  spokenLanguage = 'te',
  onSegmentsChange,
  onSeek,
}: CaptionEditorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedWordIds, setExpandedWordIds] = useState<Set<string>>(new Set());
  const [styleOverrideSegIds, setStyleOverrideSegIds] = useState<Set<string>>(new Set());
  const [emojiPickerSegId, setEmojiPickerSegId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedIdRef = useRef<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to active caption row when playing (unless user is actively scrolling)
  useEffect(() => {
    if (!activeId || isUserScrollingRef.current) return;
    const el = document.getElementById(`caption-${activeId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
      onSegmentsChange(
        segments.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      );
    },
    [segments, onSegmentsChange],
  );

  const deleteSegment = useCallback(
    (id: string) => {
      const next = segments
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, index: i + 1 }));
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
      const newEnd = next ? +Math.min(next.start - 0.05, newStart + 2).toFixed(2) : +(newStart + 2).toFixed(2);
      const newSeg: Segment = {
        id: `seg-${Date.now()}`,
        index: idx + 2,
        start: newStart,
        end: newEnd,
        text: '',
      };
      const updated = [
        ...segments.slice(0, idx + 1),
        newSeg,
        ...segments.slice(idx + 1),
      ].map((s, i) => ({ ...s, index: i + 1 }));
      onSegmentsChange(updated);
    },
    [segments, onSegmentsChange],
  );

  // Toggle words expanded view for a caption
  const toggleWordsExpanded = (id: string) => {
    setExpandedWordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle style override view for a caption
  const toggleStyleOverride = (id: string) => {
    setStyleOverrideSegIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helper to ensure word array exists
  const getOrInitWords = (seg: Segment): WordTimestamp[] => {
    if (seg.words && seg.words.length > 0) return [...seg.words];
    const rawWords = seg.text.trim().split(/\s+/).filter(Boolean);
    const duration = Math.max(0.2, seg.end - seg.start);
    const perWord = duration / Math.max(1, rawWords.length);
    return rawWords.map((w, i) => ({
      word: w,
      start: +(seg.start + i * perWord).toFixed(2),
      end: +(seg.start + (i + 1) * perWord).toFixed(2),
    }));
  };

  // Auto-distribute word timings evenly across segment bounds
  const handleAutoDistributeWords = (seg: Segment) => {
    const rawWords = seg.text.trim().split(/\s+/).filter(Boolean);
    if (rawWords.length === 0) return;
    const duration = Math.max(0.2, seg.end - seg.start);
    const perWord = duration / rawWords.length;
    const words: WordTimestamp[] = rawWords.map((w, i) => ({
      word: w,
      start: +(seg.start + i * perWord).toFixed(2),
      end: +(seg.start + (i + 1) * perWord).toFixed(2),
    }));
    updateSegment(seg.id, { words });
  };

  // Update a single word's timing, color, or emphasis inside a segment
  const updateWord = (seg: Segment, wordIdx: number, patch: Partial<WordTimestamp>) => {
    const currentWords = getOrInitWords(seg);
    if (!currentWords[wordIdx]) return;
    currentWords[wordIdx] = { ...currentWords[wordIdx], ...patch };
    updateSegment(seg.id, { words: currentWords });
  };

  // Nudge word boundaries
  const nudgeWord = (seg: Segment, wordIdx: number, deltaStart: number, deltaEnd: number) => {
    const currentWords = getOrInitWords(seg);
    const w = currentWords[wordIdx];
    if (!w) return;
    const newStart = Math.max(seg.start, +(w.start + deltaStart).toFixed(2));
    const newEnd = Math.min(seg.end, Math.max(newStart + 0.05, +(w.end + deltaEnd).toFixed(2)));
    currentWords[wordIdx] = { ...w, start: newStart, end: newEnd };
    updateSegment(seg.id, { words: currentWords });
  };

  const cycleWordEmphasis = (seg: Segment, wordIdx: number) => {
    const currentWords = getOrInitWords(seg);
    const curr = currentWords[wordIdx]?.emphasis || 'none';
    const modes: ('none' | 'pop' | 'shake' | 'glow' | 'underline')[] = ['none', 'pop', 'shake', 'glow', 'underline'];
    const next = modes[(modes.indexOf(curr) + 1) % modes.length];
    updateWord(seg, wordIdx, { emphasis: next });
  };

  const cycleWordColor = (seg: Segment, wordIdx: number) => {
    const currentWords = getOrInitWords(seg);
    const colors = ['', '#FACC15', '#EC4899', '#06B6D4', '#84CC16', '#EF4444', '#FB923C'];
    const curr = currentWords[wordIdx]?.highlightColor || '';
    const next = colors[(colors.indexOf(curr) + 1) % colors.length];
    updateWord(seg, wordIdx, { highlightColor: next || undefined });
  };

  const insertEmoji = (segId: string, emoji: string) => {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return;
    const textarea = document.querySelector<HTMLTextAreaElement>(`#caption-${segId} textarea`);
    let newText = seg.text;
    if (textarea && textarea.selectionStart !== null) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      newText = seg.text.slice(0, start) + emoji + (start < seg.text.length && seg.text[start] !== ' ' ? ' ' : '') + seg.text.slice(end);
    } else {
      newText = `${seg.text} ${emoji}`;
    }
    updateSegment(segId, { text: newText });
    setEmojiPickerSegId(null);
  };

  const updateSegmentStyleOverride = (segId: string, override: Partial<SegmentStyleOverride> | null) => {
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
  };

  const cycleSpeaker = (segId: string) => {
    const seg = segments.find((s) => s.id === segId);
    if (!seg) return;
    const speakers = [undefined, 'Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4'];
    const currIdx = speakers.indexOf(seg.speaker);
    const nextSpeaker = speakers[(currIdx + 1) % speakers.length];
    updateSegment(segId, { speaker: nextSpeaker });
  };

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
      const splitTime = +(target.start + Math.max(0.2, Math.min(span - 0.2, span * ratio))).toFixed(2);

      let words1 = target.words ? target.words.filter((w) => w.start <= splitTime) : undefined;
      let words2 = target.words ? target.words.filter((w) => w.start > splitTime) : undefined;

      const seg1: Segment = {
        ...target,
        text: beforeText,
        end: splitTime,
        words: words1,
      };

      const newId = `seg-${Date.now()}`;
      const seg2: Segment = {
        id: newId,
        index: idx + 2,
        start: splitTime,
        end: target.end,
        text: afterText,
        words: words2,
      };

      const updated = [
        ...segments.slice(0, idx),
        seg1,
        seg2,
        ...segments.slice(idx + 1),
      ].map((s, i) => ({ ...s, index: i + 1 }));

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
      const mergedWords = prev.words || curr.words ? [...(prev.words || []), ...(curr.words || [])] : undefined;

      const mergedSeg: Segment = {
        ...prev,
        text: mergedText,
        end: Math.max(prev.end, curr.end),
        words: mergedWords,
      };

      const updated = [
        ...segments.slice(0, idx - 1),
        mergedSeg,
        ...segments.slice(idx + 1),
      ].map((s, i) => ({ ...s, index: i + 1 }));

      onSegmentsChange(updated);

      // Position cursor at junction point in the merged textarea
      setTimeout(() => {
        const prevInput = document.querySelector<HTMLTextAreaElement>(`#caption-${prev.id} textarea`);
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
  const handleSelectRow = (id: string, e: React.MouseEvent) => {
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
    if (selectedIds.size > 1) {
      setSelectedIds(new Set([id]));
    }
  };

  // Bulk actions
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const next = segments.filter((s) => !selectedIds.has(s.id)).map((s, i) => ({ ...s, index: i + 1 }));
    onSegmentsChange(next);
    setSelectedIds(new Set());
  };

  const handleBulkMerge = () => {
    if (selectedIds.size <= 1) return;
    const selectedList = segments.filter((s) => selectedIds.has(s.id));
    if (selectedList.length === 0) return;

    const first = selectedList[0];
    const last = selectedList[selectedList.length - 1];
    const mergedText = selectedList.map((s) => s.text.trim()).filter(Boolean).join(' ');
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
    const updated = [
      ...filtered.slice(0, targetIdx),
      mergedSeg,
      ...filtered.slice(targetIdx),
    ].map((s: Segment, i: number) => ({ ...s, index: i + 1 }));

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
          <span className="text-smoke text-xs ml-auto font-mono">
            {segments.length}
          </span>
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
            const isActive = seg.id === activeId;
            const isSelected = selectedIds.has(seg.id);
            const isWordsExpanded = expandedWordIds.has(seg.id);
            const prevSeg = idx > 0 ? filteredSegments[idx - 1] : undefined;
            const nextSeg = idx < filteredSegments.length - 1 ? filteredSegments[idx + 1] : undefined;
            const issues = checkReadability(seg, prevSeg, nextSeg);
            const speakerStyle = getSpeakerStyle(seg.speaker);
            const wordsList: WordTimestamp[] = seg.words && seg.words.length > 0
              ? seg.words
              : seg.text.trim().split(/\s+/).filter(Boolean).map((w, i, arr) => {
                  const per = Math.max(0.1, seg.end - seg.start) / Math.max(1, arr.length);
                  return { word: w, start: +(seg.start + i * per).toFixed(2), end: +(seg.start + (i + 1) * per).toFixed(2) };
                });

            return (
              <motion.div
                key={seg.id}
                id={`caption-${seg.id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => {
                  handleSelectRow(seg.id, e);
                  onSeek(seg.start);
                }}
                style={speakerStyle ? { borderLeftColor: speakerStyle.darkBorder, borderLeftWidth: 3 } : undefined}
                className={`group relative rounded-xl p-3 border transition-colors duration-150 cursor-pointer ${
                  isActive
                    ? 'border-amber-400/80 bg-[#252420] shadow-md ring-1 ring-amber-400/40'
                    : isSelected
                    ? 'border-amber-400/40 bg-[#1e1e1b] ring-1 ring-amber-400/20'
                    : 'border-white/[0.08] bg-[#1a1a18] hover:border-white/20 hover:bg-[#20201d]'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Select Checkbox (on hover or selected) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIds((prev) => {
                        const next = new Set(prev);
                        if (next.has(seg.id)) next.delete(seg.id);
                        else next.add(seg.id);
                        return next;
                      });
                      lastClickedIdRef.current = seg.id;
                    }}
                    aria-label={`Select caption ${seg.index}`}
                    className={`mt-0.5 p-0.5 text-smoke hover:text-amber-400 transition-colors ${
                      isSelected ? 'text-amber-400 opacity-100' : 'opacity-30 group-hover:opacity-80'
                    }`}
                  >
                    {isSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  </button>

                  {/* Timestamp pill with sub-second precision */}
                  <span
                    className={`font-mono text-[11px] px-2 py-0.5 rounded-md shrink-0 transition-colors ${
                      isActive
                        ? 'bg-amber-400 text-black font-semibold'
                        : 'bg-white/10 text-mist group-hover:text-bone'
                    }`}
                    title={`Start: ${formatTimecode(seg.start)} · End: ${formatTimecode(seg.end)} · Duration: ${(seg.end - seg.start).toFixed(2)}s`}
                  >
                    {formatTimecode(seg.start)}
                  </span>

                  {/* Speaker Badge & Quick Cycle Selector */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cycleSpeaker(seg.id);
                    }}
                    aria-label={`Speaker: ${seg.speaker || 'Unassigned'} (Click to cycle)`}
                    title={`Speaker: ${seg.speaker || 'Unassigned'} (Click to cycle S1, S2, S3, S4)`}
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono tracking-wide border flex items-center gap-1 transition-all shrink-0 ${
                      speakerStyle
                        ? `${speakerStyle.bg} ${speakerStyle.text} ${speakerStyle.border} shadow-xs`
                        : 'bg-white/5 text-smoke/70 border-white/10 hover:text-bone hover:bg-white/10'
                    }`}
                  >
                    <Mic className="w-2.5 h-2.5" />
                    <span>{speakerStyle ? getSpeakerShortCode(seg.speaker) : '+S'}</span>
                  </button>

                  {/* Custom Position Indicator */}
                  {(seg.styleOverride?.positionX !== undefined || seg.styleOverride?.positionY !== undefined) && (
                    <span
                      className="text-[10px] text-amber-400 font-mono flex items-center shrink-0 cursor-help"
                      title={`Custom Position: (${Math.round((seg.styleOverride.positionX ?? 0.5) * 100)}%, ${Math.round((seg.styleOverride.positionY ?? 0.82) * 100)}%)`}
                    >
                      📍
                    </span>
                  )}

                  {/* Caption text display or edit with Enter/Backspace shortcuts */}
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={seg.text}
                      onChange={(e) => updateSegment(seg.id, { text: e.target.value })}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          splitAtCursor(seg.id, e.currentTarget.selectionStart);
                        } else if (
                          e.key === 'Backspace' &&
                          e.currentTarget.selectionStart === 0 &&
                          e.currentTarget.selectionEnd === 0
                        ) {
                          if (mergeWithPrevious(seg.id)) {
                            e.preventDefault();
                          }
                        }
                      }}
                      rows={2}
                      aria-label={`Caption ${seg.index} text (${formatTimecode(seg.start)})`}
                      className="w-full resize-none bg-transparent text-bone text-sm leading-relaxed outline-none focus:outline-none rounded hover:bg-white/5 focus:bg-white/5 focus:ring-1 focus:ring-amber-400/30 p-1 transition-colors cursor-text"
                      placeholder="Caption text…"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Actions & Toggles: Emoji, Style Override, Words, Add, Delete */}
                  <div className="flex items-center gap-1 shrink-0 text-smoke opacity-70 group-hover:opacity-100 transition-opacity">
                    {/* Emoji Picker Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEmojiPickerSegId((prev) => (prev === seg.id ? null : seg.id));
                      }}
                      aria-label={`Insert emoji into caption ${seg.index}`}
                      className={`p-1 rounded hover:bg-white/10 transition-colors ${
                        emojiPickerSegId === seg.id ? 'text-amber-400 bg-white/10' : 'text-smoke hover:text-bone'
                      }`}
                      title="Insert emoji"
                    >
                      <Smile className="w-3.5 h-3.5" />
                    </button>

                    {/* Style Override Drawer Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStyleOverride(seg.id);
                      }}
                      aria-label={`Customize style for caption ${seg.index}`}
                      className={`p-1 rounded hover:bg-white/10 transition-colors relative ${
                        styleOverrideSegIds.has(seg.id) ? 'text-amber-400 bg-white/10' : 'text-smoke hover:text-bone'
                      }`}
                      title="Custom caption style override (Position, scale, accent color)"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      {seg.styleOverride && (
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      )}
                    </button>

                    {/* Word Timing Trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWordsExpanded(seg.id);
                      }}
                      aria-label={`Expand word timings for caption ${seg.index}`}
                      className={`p-1 rounded hover:bg-white/10 transition-colors ${
                        isWordsExpanded ? 'text-amber-400' : 'text-smoke hover:text-bone'
                      }`}
                      title="Word-level timing & emphasis editor"
                    >
                      {isWordsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>

                    {/* Add Segment After */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addAfter(seg.id);
                      }}
                      aria-label={`Add caption after segment ${seg.index}`}
                      className="p-1 hover:text-amber-300 rounded hover:bg-white/10 transition-colors"
                      title="Add segment after (+)"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>

                    {/* Delete Segment */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSegment(seg.id);
                      }}
                      aria-label={`Delete caption ${seg.index}`}
                      className="p-1 hover:text-crimson-2 rounded hover:bg-crimson/10 transition-colors"
                      title="Delete segment"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* ── Popover: Opt-In Creator Emoji Picker ──────────────────────── */}
                <AnimatePresence>
                  {emojiPickerSegId === seg.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      className="mt-2 p-2.5 bg-[#1f1e1b] border border-amber-400/30 rounded-xl shadow-xl z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                          <Smile className="w-3 h-3" />
                          <span>Insert Reaction Emoji</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setEmojiPickerSegId(null)}
                          className="text-smoke hover:text-bone text-xs p-0.5 rounded"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-2">
                        {POPULAR_EMOJIS.map((group) => (
                          <div key={group.label}>
                            <div className="text-[9px] font-semibold text-smoke/70 mb-1">{group.label}</div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {group.emojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => insertEmoji(seg.id, emoji)}
                                  className="w-7 h-7 flex items-center justify-center text-sm rounded-lg bg-black/40 hover:bg-amber-400/20 hover:scale-120 active:scale-95 transition-all"
                                  title={`Insert ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Drawer: Per-Caption Style Overrides ────────────────────────── */}
                <AnimatePresence>
                  {styleOverrideSegIds.has(seg.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2.5 p-2.5 bg-[#181715] border border-white/10 rounded-xl text-xs space-y-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-400 uppercase tracking-wider border-b border-white/10 pb-1">
                        <span className="flex items-center gap-1">
                          <Palette className="w-3 h-3" />
                          <span>Caption Style Override</span>
                        </span>
                        {seg.styleOverride && (
                          <button
                            type="button"
                            onClick={() => updateSegmentStyleOverride(seg.id, null)}
                            className="flex items-center gap-1 text-[9px] text-smoke hover:text-amber-300 lowercase"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>reset</span>
                          </button>
                        )}
                      </div>

                      {/* Position Override */}
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-smoke">Position (2D Anchor):</span>
                          {(seg.styleOverride?.positionX !== undefined || seg.styleOverride?.positionY !== undefined) && (
                            <span className="text-[10px] text-amber-300 font-mono">
                              ({Math.round((seg.styleOverride.positionX ?? 0.5) * 100)}%,{' '}
                              {Math.round((seg.styleOverride.positionY ?? 0.82) * 100)}%)
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { label: 'Def', x: undefined, y: undefined },
                            { label: 'Top', x: 0.5, y: 0.18 },
                            { label: 'Mid', x: 0.5, y: 0.5 },
                            { label: 'Bot', x: 0.5, y: 0.82 },
                            { label: 'Top-L', x: 0.22, y: 0.18 },
                            { label: 'Top-R', x: 0.78, y: 0.18 },
                            { label: 'Bot-L', x: 0.22, y: 0.82 },
                            { label: 'Bot-R', x: 0.78, y: 0.82 },
                          ].map((opt) => {
                            const isSelected =
                              opt.x === undefined && opt.y === undefined
                                ? seg.styleOverride?.positionX === undefined && seg.styleOverride?.positionY === undefined
                                : Math.abs((seg.styleOverride?.positionX ?? 0.5) - (opt.x ?? 0.5)) < 0.05 &&
                                  Math.abs((seg.styleOverride?.positionY ?? 0.82) - (opt.y ?? 0.82)) < 0.05;
                            return (
                              <button
                                key={opt.label}
                                type="button"
                                onClick={() =>
                                  updateSegmentStyleOverride(seg.id, {
                                    positionX: opt.x,
                                    positionY: opt.y,
                                  })
                                }
                                className={`px-1.5 py-1 rounded text-[10px] font-medium transition-colors text-center ${
                                  isSelected
                                    ? 'bg-amber-400 text-black font-bold'
                                    : 'bg-white/10 text-smoke hover:text-bone'
                                }`}
                              >
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-smoke/70 italic">
                          💡 You can also drag this caption directly on the video player.
                        </p>
                      </div>

                      {/* Scale Override */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-smoke">Scale:</span>
                        <div className="flex items-center gap-1">
                          {[
                            { label: '0.85x', val: 0.85 },
                            { label: '1.0x', val: undefined },
                            { label: '1.15x', val: 1.15 },
                            { label: '1.3x', val: 1.3 },
                          ].map((opt) => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => updateSegmentStyleOverride(seg.id, { scale: opt.val })}
                              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                                seg.styleOverride?.scale === opt.val
                                  ? 'bg-amber-400 text-black font-bold'
                                  : 'bg-white/10 text-smoke hover:text-bone'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Accent Highlight Override */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-smoke">Accent Color:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateSegmentStyleOverride(seg.id, { highlightColor: undefined })}
                            className={`w-4 h-4 rounded-full border border-white/30 text-[9px] flex items-center justify-center ${
                              !seg.styleOverride?.highlightColor ? 'ring-2 ring-amber-400' : ''
                            }`}
                            title="Default Color"
                          >
                            ✕
                          </button>
                          {PRESET_ACCENT_COLORS.map((col) => (
                            <button
                              key={col.value}
                              type="button"
                              onClick={() => updateSegmentStyleOverride(seg.id, { highlightColor: col.value })}
                              style={{ backgroundColor: col.value }}
                              className={`w-4 h-4 rounded-full transition-transform ${
                                seg.styleOverride?.highlightColor === col.value
                                  ? 'ring-2 ring-white scale-110'
                                  : 'opacity-80 hover:opacity-100 hover:scale-105'
                              }`}
                              title={col.label}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Speaker Assignment */}
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/5">
                        <span className="text-smoke">Speaker:</span>
                        <div className="flex items-center gap-1">
                          {['Speaker 1', 'Speaker 2', 'Speaker 3', 'Speaker 4'].map((spk, i) => (
                            <button
                              key={spk}
                              type="button"
                              onClick={() => updateSegment(seg.id, { speaker: seg.speaker === spk ? undefined : spk })}
                              className={`px-1.5 py-0.5 rounded text-[10px] font-medium font-mono transition-colors ${
                                seg.speaker === spk
                                  ? 'bg-amber-400 text-black font-bold'
                                  : 'bg-white/10 text-smoke hover:text-bone'
                              }`}
                            >
                              S{i + 1}
                            </button>
                          ))}
                          {seg.speaker && (
                            <button
                              type="button"
                              onClick={() => updateSegment(seg.id, { speaker: undefined })}
                              className="text-smoke hover:text-bone text-[9px] px-1"
                              title="Clear speaker"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Readability Warnings Pill */}
                {issues.length > 0 && (
                  <div className="mt-1.5 pt-1.5 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-[10px]">
                    {issues.map((iss, iIdx) => (
                      <span
                        key={iIdx}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${
                          iss.severity === 'error'
                            ? 'bg-crimson/15 text-crimson-2 border border-crimson/30'
                            : 'bg-amber-400/15 text-amber-300 border border-amber-400/25'
                        }`}
                        title={iss.message}
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        <span>{iss.message}</span>
                      </span>
                    ))}
                    <span className="text-smoke/60 ml-auto font-mono">
                      {getCPS(seg)} CPS
                    </span>
                  </div>
                )}

                {/* ── Word-Level Timing Chip Editor ───────────────────────────── */}
                <AnimatePresence>
                  {isWordsExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2.5 pt-2.5 border-t border-white/10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-2 text-[10px] text-smoke">
                        <span className="font-semibold uppercase tracking-wider text-amber-400">Word Timing Precision</span>
                        <button
                          type="button"
                          onClick={() => handleAutoDistributeWords(seg)}
                          className="flex items-center gap-1 text-mist hover:text-amber-300 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors"
                          title="Auto distribute word timings evenly over segment duration"
                        >
                          <Wand2 className="w-3 h-3 text-amber-400" />
                          <span>Sync words</span>
                        </button>
                      </div>

                      {/* Word Chips Row */}
                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
                        {wordsList.map((w, wIdx) => {
                          const wDuration = +(w.end - w.start).toFixed(2);
                          const hasCustomColor = !!w.highlightColor;
                          const hasEmphasis = w.emphasis && w.emphasis !== 'none';
                          return (
                            <div
                              key={wIdx}
                              className={`flex items-center gap-1 bg-[#151514] border rounded-lg px-2 py-1 text-xs transition-colors ${
                                hasCustomColor
                                  ? 'border-amber-400/50 bg-[#1c1b18]'
                                  : 'border-white/10 hover:border-amber-400/40'
                              }`}
                            >
                              {/* Word loop play button */}
                              <button
                                type="button"
                                onClick={() => {
                                  onSeek(w.start);
                                }}
                                aria-label={`Seek to word ${w.word}`}
                                title={`Play word: ${w.word} (${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s · ${wDuration}s)`}
                                className="p-0.5 text-smoke hover:text-amber-400 transition-colors"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                              </button>

                              {/* Editable word text */}
                              <input
                                type="text"
                                value={w.word}
                                onChange={(e) => updateWord(seg, wIdx, { word: e.target.value })}
                                className="bg-transparent text-bone font-medium text-[11px] w-14 focus:w-20 outline-none border-b border-transparent focus:border-amber-400 transition-all font-mono"
                              />

                              {/* Custom Color Cycle Button */}
                              <button
                                type="button"
                                onClick={() => cycleWordColor(seg, wIdx)}
                                aria-label={`Change color for word ${w.word}`}
                                className="w-3.5 h-3.5 rounded-full flex items-center justify-center p-0.5 transition-transform hover:scale-115"
                                title={`Highlight Color: ${w.highlightColor || 'Default'} (Click to cycle)`}
                              >
                                {w.highlightColor ? (
                                  <span
                                    className="w-2.5 h-2.5 rounded-full ring-1 ring-white/60"
                                    style={{ backgroundColor: w.highlightColor }}
                                  />
                                ) : (
                                  <span className="w-2 h-2 rounded-full border border-white/30" />
                                )}
                              </button>

                              {/* Custom Emphasis FX Cycle Button */}
                              <button
                                type="button"
                                onClick={() => cycleWordEmphasis(seg, wIdx)}
                                aria-label={`Change emphasis for word ${w.word}`}
                                className={`px-1 py-0.2 rounded text-[8px] font-mono font-bold tracking-tight uppercase transition-all ${
                                  hasEmphasis
                                    ? 'bg-amber-400 text-black shadow-xs'
                                    : 'text-smoke/50 hover:text-smoke hover:bg-white/5'
                                }`}
                                title={`Animation FX: ${w.emphasis || 'None'} (Click to cycle: pop, shake, glow, underline)`}
                              >
                                {w.emphasis && w.emphasis !== 'none' ? w.emphasis : '+fx'}
                              </button>

                              {/* Timestamp badge */}
                              <span className="text-[9px] font-mono text-smoke">
                                {w.start.toFixed(2)}s
                              </span>

                              {/* Nudge buttons */}
                              <div className="flex items-center ml-0.5">
                                <button
                                  type="button"
                                  onClick={() => nudgeWord(seg, wIdx, -0.05, 0)}
                                  className="px-1 text-[9px] text-smoke hover:text-bone hover:bg-white/10 rounded"
                                  title="Nudge start earlier (-0.05s)"
                                >
                                  ◀
                                </button>
                                <button
                                  type="button"
                                  onClick={() => nudgeWord(seg, wIdx, 0.05, 0)}
                                  className="px-1 text-[9px] text-smoke hover:text-bone hover:bg-white/10 rounded"
                                  title="Nudge start later (+0.05s)"
                                >
                                  ▶
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
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
