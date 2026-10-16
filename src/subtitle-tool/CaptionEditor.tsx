// ─── CaptionEditor ────────────────────────────────────────────────────────────
// Left panel caption list matching ReplixCaptions reference:
// - Header with "CAPTIONS [Tanglish]" badge and search filter
// - Segment rows with timestamp pill, inline editable text, and edit icon
// - Playhead active sync, seek on click, plus add/split/delete actions

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Segment, ScriptOutput, SpokenLanguage } from './types';

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
    },
    [segments, onSegmentsChange],
  );

  const addAfter = useCallback(
    (id: string) => {
      const idx = segments.findIndex((s) => s.id === id);
      const prev = segments[idx];
      const next = segments[idx + 1];
      const newStart = prev.end + 0.05;
      const newEnd = next ? Math.min(next.start - 0.05, newStart + 2) : newStart + 2;
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

  // Filtered segments if searching
  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, searchQuery]);

  // Format mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

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
      <div className="p-4 border-b border-white/10">
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
          <h2 className="text-xs text-smoke font-medium">Review captions</h2>
        </div>

        {/* Quick Search */}
        <div className="mt-2.5 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dialogue…"
            className="w-full bg-[#1f1f1d] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-bone placeholder:text-smoke focus:outline-none focus:border-amber-400/60"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-smoke hover:text-bone text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Scrollable list */}
      <div
        className="flex-1 overflow-y-auto p-3 space-y-2"
        data-lenis-prevent
      >
        <AnimatePresence initial={false}>
          {filteredSegments.map((seg) => {
            const isActive = seg.id === activeId;
            return (
              <motion.div
                key={seg.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                onClick={() => onSeek(seg.start)}
                className={`group relative rounded-xl p-3 border transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'border-amber-400/70 bg-[#252420] shadow-md ring-1 ring-amber-400/40'
                    : 'border-white/[0.08] bg-[#1a1a18] hover:border-white/20 hover:bg-[#20201d]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Timestamp pill (Replix-style e.g. "0:00", "0:04") */}
                  <span
                    className={`font-mono text-xs px-2 py-0.5 rounded-md shrink-0 transition-colors ${
                      isActive
                        ? 'bg-amber-400 text-black font-semibold'
                        : 'bg-white/10 text-mist group-hover:text-bone'
                    }`}
                  >
                    {formatTime(seg.start)}
                  </span>

                  {/* Caption text display or edit */}
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={seg.text}
                      onChange={(e) => updateSegment(seg.id, { text: e.target.value })}
                      rows={2}
                      className="w-full resize-none bg-transparent text-bone text-sm leading-relaxed outline-none focus:outline-none rounded hover:bg-white/5 focus:bg-white/5 p-1 transition-colors cursor-text"
                      placeholder="Caption text…"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* Edit pencil icon and actions */}
                  <div className="flex items-center gap-1 shrink-0 text-smoke opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        addAfter(seg.id);
                      }}
                      className="p-1 hover:text-amber-300 rounded hover:bg-white/10"
                      title="Add segment after"
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
                      className="p-1 hover:text-crimson-2 rounded hover:bg-crimson/10"
                      title="Delete segment"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
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
