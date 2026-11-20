// ─── CaptionCard — Epic Hertz Studio ─────────────────────────────────────────
// Individual subtitle card component subscribed strictly to its own active state.
// Uses useSyncExternalStore (via useIsSegmentActive) to isolate re-renders on playhead ticks.
// When active playhead ID changes, only the leaving card and entering card re-render;
// all other cards and the parent container skip re-rendering entirely.

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  CheckSquare,
  Square,
  AlertTriangle,
  Wand2,
  Sliders,
  Mic,
  MapPin,
} from 'lucide-react';
import { formatTimecode } from '../utils/formatTime';
import { checkReadability, getCPS } from '../utils/readability';
import { checkWordTimings, fixTimings } from '../utils/alignWords';
import { getSpeakerStyle, getSpeakerShortCode } from '../utils/speakers';
import type { Segment, WordTimestamp, SegmentStyleOverride } from '../types';
import { SegmentStyleDrawer } from './SegmentStyleDrawer';
import { SegmentWordEditor } from './SegmentWordEditor';
import { useIsSegmentActive } from '../store/timeStore';
import { AstryxTooltip } from '../astryx';

export interface CaptionCardProps {
  seg: Segment;
  prevSeg?: Segment;
  nextSeg?: Segment;
  isSelected: boolean;
  isWordsExpanded: boolean;
  isStyleOverrideOpen: boolean;
  activeIdProp?: string | null;
  onSelectRow: (id: string, e: React.MouseEvent) => void;
  onSelectSegment?: (id: string) => void;
  onSeek: (time: number) => void;
  onToggleSelectCheckbox: (id: string, e: React.MouseEvent) => void;
  onCycleSpeaker: (id: string) => void;
  onUpdateSegment: (id: string, patch: Partial<Segment>) => void;
  onSplitAtCursor: (id: string, cursorIndex: number) => void;
  onMergeWithPrevious: (id: string) => boolean;
  onToggleStyleOverride: (id: string) => void;
  onToggleWordsExpanded: (id: string) => void;
  onAddAfter: (id: string) => void;
  onDeleteSegment: (id: string) => void;
  onUpdateSegmentStyleOverride: (
    segId: string,
    override: Partial<SegmentStyleOverride> | null,
  ) => void;
  onAutoDistributeWords: (seg: Segment) => void;
  onUpdateWord: (seg: Segment, wordIndex: number, patch: Partial<WordTimestamp>) => void;
  onCycleWordColor: (seg: Segment, wordIndex: number) => void;
  onCycleWordEmphasis: (seg: Segment, wordIndex: number) => void;
  onNudgeWord: (seg: Segment, wordIndex: number, deltaStart: number, deltaEnd: number) => void;
}

export const CaptionCard = React.memo(function CaptionCard({
  seg,
  prevSeg,
  nextSeg,
  isSelected,
  isWordsExpanded,
  isStyleOverrideOpen,
  activeIdProp,
  onSelectRow,
  onSelectSegment,
  onSeek,
  onToggleSelectCheckbox,
  onCycleSpeaker,
  onUpdateSegment,
  onSplitAtCursor,
  onMergeWithPrevious,
  onToggleStyleOverride,
  onToggleWordsExpanded,
  onAddAfter,
  onDeleteSegment,
  onUpdateSegmentStyleOverride,
  onAutoDistributeWords,
  onUpdateWord,
  onCycleWordColor,
  onCycleWordEmphasis,
  onNudgeWord,
}: CaptionCardProps) {
  // Directly subscribe to whether THIS card is active under the playhead via useSyncExternalStore.
  // Returns a boolean snapshot so React skips re-rendering any card whose active status didn't flip!
  const isStoreActive = useIsSegmentActive(seg.id);
  const isActive =
    isStoreActive ||
    (activeIdProp !== undefined && activeIdProp !== null && activeIdProp === seg.id);

  const issues = checkReadability(seg, prevSeg, nextSeg);
  const wordCheck = checkWordTimings(seg.words);
  const speakerStyle = getSpeakerStyle(seg.speaker);
  const wordsList: WordTimestamp[] =
    seg.words && seg.words.length > 0
      ? seg.words
      : seg.text
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .map((w, i, arr) => {
            const per = Math.max(0.1, seg.end - seg.start) / Math.max(1, arr.length);
            return {
              word: w,
              start: +(seg.start + i * per).toFixed(2),
              end: +(seg.start + (i + 1) * per).toFixed(2),
            };
          });

  return (
    <motion.div
      id={`caption-${seg.id}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => {
        onSelectRow(seg.id, e);
        onSelectSegment?.(seg.id);
        onSeek(seg.start);
      }}
      style={
        speakerStyle
          ? { borderLeftColor: speakerStyle.darkBorder, borderLeftWidth: 3 }
          : undefined
      }
      className={`group relative rounded-xl p-3 border transition-colors duration-150 cursor-pointer ${
        seg.isCut
          ? 'border-rose-500/40 bg-rose-950/15 opacity-75'
          : isActive
            ? 'border-amber-400/80 bg-[#252420] shadow-md ring-1 ring-amber-400/40'
            : isSelected
              ? 'border-amber-400/40 bg-[#1e1e1b] ring-1 ring-amber-400/20'
              : 'border-white/[0.08] bg-[#1a1a18] hover:border-white/20 hover:bg-[#20201d]'
      }`}
    >
      {/* NLE-style active playhead edge indicator */}
      {isActive && (
        <motion.div
          layoutId="active-caption-edge"
          className="absolute left-0 top-2 bottom-2 w-1 bg-amber-400 rounded-r shadow-[0_0_8px_rgba(251,191,36,0.6)] pointer-events-none"
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        />
      )}
      <div className="flex items-start gap-2.5">
        {/* Select Checkbox (on hover or selected) */}
        <button
          type="button"
          onClick={(e) => onToggleSelectCheckbox(seg.id, e)}
          aria-label={`Select caption ${seg.index}`}
          className={`mt-0.5 p-0.5 text-smoke hover:text-amber-400 transition-colors ${
            isSelected ? 'text-amber-400 opacity-100' : 'opacity-30 group-hover:opacity-80'
          }`}
        >
          {isSelected ? (
            <CheckSquare className="w-3.5 h-3.5" />
          ) : (
            <Square className="w-3.5 h-3.5" />
          )}
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
            onCycleSpeaker(seg.id);
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

        {/* Cut / Trim Indicator */}
        {seg.isCut && (
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 shrink-0"
            title="This caption is cut from the video (skipped during playback & export)"
          >
            <span>✂️ CUT</span>
          </span>
        )}

        {/* Custom Position Indicator */}
        {(seg.styleOverride?.positionX !== undefined ||
          seg.styleOverride?.positionY !== undefined) && (
          <span
            className="text-[10px] text-amber-400 font-mono flex items-center shrink-0 cursor-help"
            title={`Custom Position: (${Math.round((seg.styleOverride.positionX ?? 0.5) * 100)}%, ${Math.round((seg.styleOverride.positionY ?? 0.82) * 100)}%)`}
          >
            <MapPin className="w-2.5 h-2.5" />
          </span>
        )}

        {/* Caption text display or edit with Enter/Backspace shortcuts */}
        <div className="flex-1 min-w-0">
          <textarea
            value={seg.text}
            onChange={(e) => onUpdateSegment(seg.id, { text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSplitAtCursor(seg.id, e.currentTarget.selectionStart);
              } else if (
                e.key === 'Backspace' &&
                e.currentTarget.selectionStart === 0 &&
                e.currentTarget.selectionEnd === 0
              ) {
                if (onMergeWithPrevious(seg.id)) {
                  e.preventDefault();
                }
              }
            }}
            rows={2}
            aria-label={`Caption ${seg.index} text (${formatTimecode(seg.start)})`}
            className="w-full resize-none bg-transparent text-bone text-sm leading-relaxed outline-none focus:outline-none rounded hover:bg-white/5 focus:bg-white/5 focus:ring-1 focus:ring-amber-400/30 p-1 transition-colors cursor-text"
            placeholder="Caption text…"
            onClick={(e) => {
              e.stopPropagation();
              onSelectSegment?.(seg.id);
              onSeek(seg.start);
            }}
            onFocus={() => {
              onSelectSegment?.(seg.id);
              onSeek(seg.start);
            }}
          />
        </div>

        {/* Actions & Toggles: Style Override, Words, Add, Delete */}
        <div className="flex items-center gap-1 shrink-0 text-smoke opacity-70 group-hover:opacity-100 transition-opacity">
          {/* Style Override Drawer Trigger */}
          <AstryxTooltip content="Style Overrides">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStyleOverride(seg.id);
              }}
              aria-label={`Customize style for caption ${seg.index}`}
              className={`p-1 rounded hover:bg-white/10 transition-colors relative cursor-pointer ${
                isStyleOverrideOpen ? 'text-amber-400 bg-white/10' : 'text-smoke hover:text-bone'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {seg.styleOverride && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </AstryxTooltip>

          {/* Word Timing Trigger */}
          <AstryxTooltip content={isWordsExpanded ? 'Hide Word Timings' : 'Edit Word Timings'}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWordsExpanded(seg.id);
              }}
              aria-label={`Expand word timings for caption ${seg.index}`}
              className={`p-1 rounded hover:bg-white/10 transition-colors cursor-pointer ${
                isWordsExpanded ? 'text-amber-400' : 'text-smoke hover:text-bone'
              }`}
            >
              {isWordsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </AstryxTooltip>

          {/* Add Segment After */}
          <AstryxTooltip content="Add Caption After">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddAfter(seg.id);
              }}
              aria-label={`Add caption after segment ${seg.index}`}
              className="p-1 hover:text-amber-300 rounded hover:bg-white/10 transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </AstryxTooltip>

          {/* Delete Segment */}
          <AstryxTooltip content="Delete Caption" shortcut="Del">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteSegment(seg.id);
              }}
              aria-label={`Delete caption ${seg.index}`}
              className="p-1 hover:text-crimson-2 rounded hover:bg-crimson/10 transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </AstryxTooltip>
        </div>
      </div>

      {/* ── Per-Caption Style Overrides Drawer ────────────────── */}
      <SegmentStyleDrawer
        segment={seg}
        isOpen={isStyleOverrideOpen}
        onUpdateOverride={onUpdateSegmentStyleOverride}
        onUpdateSpeaker={(segId, speaker) => onUpdateSegment(segId, { speaker })}
      />

      {/* Readability & Timing Warnings Pill */}
      {(issues.length > 0 || wordCheck.hasIssues) && (
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
          {wordCheck.hasIssues && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const fixed = fixTimings(seg);
                onUpdateSegment(seg.id, {
                  words: fixed.words,
                  start: fixed.start,
                  end: fixed.end,
                });
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer"
              title="Word timings have collapsed or overlap. Click to auto-distribute by character count."
            >
              <Wand2 className="w-2.5 h-2.5" />
              <span>
                Fix timings ({wordCheck.collapsedCount + wordCheck.overlapCount} alerts)
              </span>
            </button>
          )}
          <span className="text-smoke/60 ml-auto font-mono">{getCPS(seg)} CPS</span>
        </div>
      )}

      {/* ── Word-Level Timing Chip Editor ───────────────────────────── */}
      <AnimatePresence>
        {isWordsExpanded && (
          <SegmentWordEditor
            segment={seg}
            wordsList={wordsList}
            onSeek={onSeek}
            onAutoDistribute={onAutoDistributeWords}
            onUpdateWord={onUpdateWord}
            onCycleWordColor={onCycleWordColor}
            onCycleWordEmphasis={onCycleWordEmphasis}
            onNudgeWord={onNudgeWord}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default CaptionCard;
