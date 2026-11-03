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
import { Play, ChevronDown, ChevronRight, CheckSquare, Square, Trash2, Combine, AlertTriangle, Wand2 } from 'lucide-react';
import { formatTimecode } from './utils/formatTime';
import { checkReadability, getCPS } from './utils/readability';
import type { Segment, ScriptOutput, SpokenLanguage, WordTimestamp } from './types';

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

  // Update a single word's timing or text inside a segment
  const updateWord = (seg: Segment, wordIdx: number, patch: Partial<WordTimestamp>) => {
    const currentWords = [...(seg.words || [])];
    if (!currentWords[wordIdx]) return;
    currentWords[wordIdx] = { ...currentWords[wordIdx], ...patch };
    updateSegment(seg.id, { words: currentWords });
  };

  // Nudge word boundaries
  const nudgeWord = (seg: Segment, wordIdx: number, deltaStart: number, deltaEnd: number) => {
    const currentWords = [...(seg.words || [])];
    const w = currentWords[wordIdx];
    if (!w) return;
    const newStart = Math.max(seg.start, +(w.start + deltaStart).toFixed(2));
    const newEnd = Math.min(seg.end, Math.max(newStart + 0.05, +(w.end + deltaEnd).toFixed(2)));
    currentWords[wordIdx] = { ...w, start: newStart, end: newEnd };
    updateSegment(seg.id, { words: currentWords });
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
        data-lenis-prevent
      >
        <AnimatePresence initial={false}>
          {filteredSegments.map((seg, idx) => {
            const isActive = seg.id === activeId;
            const isSelected = selectedIds.has(seg.id);
            const isWordsExpanded = expandedWordIds.has(seg.id);
            const prevSeg = idx > 0 ? filteredSegments[idx - 1] : undefined;
            const nextSeg = idx < filteredSegments.length - 1 ? filteredSegments[idx + 1] : undefined;
            const issues = checkReadability(seg, prevSeg, nextSeg);
            const wordsList = seg.words && seg.words.length > 0
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

                  {/* Actions & Words toggle button */}
                  <div className="flex items-center gap-1 shrink-0 text-smoke opacity-70 group-hover:opacity-100 transition-opacity">
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
                      title="Word-level timing editor"
                    >
                      {isWordsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
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
                      <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto" data-lenis-prevent>
                        {wordsList.map((w, wIdx) => {
                          const wDuration = +(w.end - w.start).toFixed(2);
                          return (
                            <div
                              key={wIdx}
                              className="flex items-center gap-1 bg-[#151514] border border-white/10 rounded-lg px-2 py-1 text-xs hover:border-amber-400/40 transition-colors"
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
