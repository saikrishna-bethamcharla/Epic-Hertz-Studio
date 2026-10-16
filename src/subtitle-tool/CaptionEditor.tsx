// ─── CaptionEditor ────────────────────────────────────────────────────────────
// Scrollable list of caption segments. Each row shows timestamps + editable text.

import { useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toSRTTime, parseTimestamp } from './utils/srt';
import type { Segment } from './types';

interface CaptionEditorProps {
  segments: Segment[];
  activeId: string | null;
  onSegmentsChange: (segments: Segment[]) => void;
  onSeek: (time: number) => void;
}

export default function CaptionEditor({
  segments,
  activeId,
  onSegmentsChange,
  onSeek,
}: CaptionEditorProps) {

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
      const newStart = prev.end + 0.01;
      const newEnd = next ? Math.min(next.start - 0.01, newStart + 2) : newStart + 2;
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <h2 className="text-bone font-display text-2xl tracking-wide">Captions</h2>
        <span className="text-mist text-xs">{segments.length} segments</span>
      </div>

      {/* Scrollable list */}
      <div
        className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
        data-lenis-prevent
      >
        <AnimatePresence initial={false}>
          {segments.map((seg) => (
            <SegmentRow
              key={seg.id}
              seg={seg}
              isActive={seg.id === activeId}
              onChange={updateSegment}
              onDelete={deleteSegment}
              onAddAfter={addAfter}
              onSeek={onSeek}
            />
          ))}
        </AnimatePresence>

        {segments.length === 0 && (
          <p className="text-smoke text-sm text-center py-10">
            No segments yet.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Individual caption row ───────────────────────────────────────────────────

interface RowProps {
  seg: Segment;
  isActive: boolean;
  onChange: (id: string, patch: Partial<Segment>) => void;
  onDelete: (id: string) => void;
  onAddAfter: (id: string) => void;
  onSeek: (time: number) => void;
}

function SegmentRow({ seg, isActive, onChange, onDelete, onAddAfter, onSeek }: RowProps) {
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleTimeBlur = (field: 'start' | 'end', value: string) => {
    const secs = parseTimestamp(value);
    if (!isNaN(secs)) onChange(seg.id, { [field]: secs });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      className={`
        group relative rounded-xl p-3 border transition-all duration-150
        ${isActive
          ? 'border-crimson/60 bg-crimson/5 ring-1 ring-crimson/20'
          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
        }
      `}
    >
      {/* Index + timestamps row */}
      <div className="flex items-center gap-2 mb-2">
        {/* Segment index — click to seek video */}
        <button
          className="text-smoke text-xs w-6 shrink-0 text-center hover:text-crimson-2 transition-colors"
          title="Seek video to this segment"
          onClick={() => onSeek(seg.start)}
        >
          {seg.index}
        </button>

        {/* Start time */}
        <TimeInput
          value={toSRTTime(seg.start)}
          label={`Segment ${seg.index} start time`}
          onBlur={(v) => handleTimeBlur('start', v)}
        />
        <span className="text-smoke text-xs">→</span>
        {/* End time */}
        <TimeInput
          value={toSRTTime(seg.end)}
          label={`Segment ${seg.index} end time`}
          onBlur={(v) => handleTimeBlur('end', v)}
        />

        {/* Actions — visible on hover */}
        <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionBtn
            title="Add segment after"
            onClick={() => onAddAfter(seg.id)}
          >
            <PlusIcon />
          </ActionBtn>
          <ActionBtn
            title="Delete segment"
            onClick={() => onDelete(seg.id)}
            danger
          >
            <TrashIcon />
          </ActionBtn>
        </div>
      </div>

      {/* Caption text */}
      <textarea
        ref={textRef}
        value={seg.text}
        onChange={(e) => onChange(seg.id, { text: e.target.value })}
        rows={2}
        aria-label={`Caption text for segment ${seg.index}`}
        className="
          w-full resize-none bg-transparent text-bone text-sm leading-relaxed
          placeholder:text-smoke outline-none focus:outline-none
          rounded-md p-1 hover:bg-white/5 focus:bg-white/5 transition-colors
        "
        placeholder="Caption text…"
      />
    </motion.div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimeInput({
  value,
  label,
  onBlur,
}: {
  value: string;
  label: string;
  onBlur: (v: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  return (
    <input
      ref={ref}
      type="text"
      defaultValue={value}
      key={value} // re-mount when value changes from outside
      aria-label={label}
      onBlur={(e) => onBlur(e.target.value)}
      onFocus={(e) => e.target.select()}
      spellCheck={false}
      className="
        w-[106px] text-[11px] font-mono text-mist bg-transparent
        border border-white/10 rounded px-1.5 py-0.5
        focus:outline-none focus:border-crimson/50 focus:text-bone
        transition-colors
      "
    />
  );
}

function ActionBtn({
  children,
  title,
  onClick,
  danger = false,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`
        p-1 rounded-md transition-colors
        ${danger
          ? 'text-smoke hover:text-crimson hover:bg-crimson/10'
          : 'text-smoke hover:text-bone hover:bg-white/10'
        }
      `}
    >
      {children}
    </button>
  );
}

function PlusIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
      <line x1="8" y1="3" x2="8" y2="13" />
      <line x1="3" y1="8" x2="13" y2="8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16" stroke="currentColor" strokeWidth={1.8}>
      <polyline points="3,5 13,5" />
      <path d="M6 5V3h4v2" />
      <rect x="4" y="5" width="8" height="8" rx="1" />
    </svg>
  );
}
