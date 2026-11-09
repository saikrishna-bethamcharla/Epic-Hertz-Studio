// ─── SegmentWordEditor — Epic Hertz Studio ──────────────────────────────────
// Dedicated editor sub-component for sub-second word timing precision, color, and emphasis.

import { motion } from 'framer-motion';
import { Wand2, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Segment, WordTimestamp } from '../types';

export interface SegmentWordEditorProps {
  segment: Segment;
  wordsList: WordTimestamp[];
  onSeek: (time: number) => void;
  onAutoDistribute: (seg: Segment) => void;
  onUpdateWord: (seg: Segment, wordIndex: number, patch: Partial<WordTimestamp>) => void;
  onCycleWordColor: (seg: Segment, wordIndex: number) => void;
  onCycleWordEmphasis: (seg: Segment, wordIndex: number) => void;
  onNudgeWord: (seg: Segment, wordIndex: number, deltaStart: number, deltaEnd: number) => void;
}

export function SegmentWordEditor({
  segment,
  wordsList,
  onSeek,
  onAutoDistribute,
  onUpdateWord,
  onCycleWordColor,
  onCycleWordEmphasis,
  onNudgeWord,
}: SegmentWordEditorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2.5 pt-2.5 border-t border-white/10"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2 text-[10px] text-smoke">
        <span className="font-semibold uppercase tracking-wider text-amber-400">
          Word Timing Precision
        </span>
        <button
          type="button"
          onClick={() => onAutoDistribute(segment)}
          className="flex items-center gap-1 text-mist hover:text-amber-300 px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors cursor-pointer"
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
                onClick={() => onSeek(w.start)}
                aria-label={`Seek to word ${w.word}`}
                title={`Play word: ${w.word} (${w.start.toFixed(2)}s - ${w.end.toFixed(2)}s · ${wDuration}s)`}
                className="p-0.5 text-smoke hover:text-amber-400 transition-colors cursor-pointer"
              >
                <Play className="w-2.5 h-2.5 fill-current" />
              </button>

              {/* Editable word text */}
              <input
                type="text"
                value={w.word}
                onChange={(e) => onUpdateWord(segment, wIdx, { word: e.target.value })}
                className="bg-transparent text-bone font-medium text-[11px] w-14 focus:w-20 outline-none border-b border-transparent focus:border-amber-400 transition-all font-mono"
              />

              {/* Custom Color Cycle Button */}
              <button
                type="button"
                onClick={() => onCycleWordColor(segment, wIdx)}
                aria-label={`Change color for word ${w.word}`}
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center p-0.5 transition-transform hover:scale-115 cursor-pointer"
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
                onClick={() => onCycleWordEmphasis(segment, wIdx)}
                aria-label={`Change emphasis for word ${w.word}`}
                className={`px-1 py-0.2 rounded text-[8px] font-mono font-bold tracking-tight uppercase transition-all cursor-pointer ${
                  hasEmphasis
                    ? 'bg-amber-400 text-black shadow-xs'
                    : 'text-smoke/50 hover:text-smoke hover:bg-white/5'
                }`}
                title={`Animation FX: ${w.emphasis || 'None'} (Click to cycle: pop, shake, glow, underline)`}
              >
                {w.emphasis && w.emphasis !== 'none' ? w.emphasis : '+fx'}
              </button>

              {/* Timestamp badge */}
              <span className="text-[9px] font-mono text-smoke">{w.start.toFixed(2)}s</span>

              {/* Nudge buttons */}
              <div className="flex items-center ml-0.5">
                <button
                  type="button"
                  onClick={() => onNudgeWord(segment, wIdx, -0.05, 0)}
                  className="px-1 text-[9px] text-smoke hover:text-bone hover:bg-white/10 rounded cursor-pointer"
                  title="Nudge start earlier (-0.05s)"
                >
                  <ChevronLeft className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onNudgeWord(segment, wIdx, 0.05, 0)}
                  className="px-1 text-[9px] text-smoke hover:text-bone hover:bg-white/10 rounded cursor-pointer"
                  title="Nudge start later (+0.05s)"
                >
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
