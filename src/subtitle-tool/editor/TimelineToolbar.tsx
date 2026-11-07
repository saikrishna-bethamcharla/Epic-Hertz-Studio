// ─── TimelineToolbar — Epic Hertz Studio ─────────────────────────────────────
import React, { useState } from 'react';
import {
  Scissors,
  Trash2,
  Combine,
  Plus,
  Undo2,
  Redo2,
  BookOpen,
  Magnet,
  Link2,
} from 'lucide-react';
import type { Segment } from '../types';
import { formatTimecode } from '../utils/formatTime';
import { usePlayheadTime } from '../store/timeStore';

export const TimelineTimeDisplay = React.memo(function TimelineTimeDisplay({
  totalDuration,
}: {
  totalDuration: number;
}) {
  const currentTime = usePlayheadTime();
  return (
    <span className="font-mono text-mist text-[11px]">
      <span className="text-bone font-medium">{formatTimecode(currentTime)}</span>
      <span className="text-smoke mx-1">/</span>
      <span>{formatTimecode(totalDuration)}</span>
    </span>
  );
});

export interface TimelineToolbarProps {
  currentTime?: number;
  totalDuration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentSeg: Segment | null | undefined;
  onAddText: () => void;
  onAddLowerThird?: () => void;
  onSplit: () => void;
  onMerge: () => void;
  onDelete: () => void;
  isSnappingEnabled: boolean;
  onToggleSnapping: () => void;
  isRippleEnabled: boolean;
  onToggleRipple: () => void;
  onUndo: () => void;
  onRedo: () => void;
  isUndoDisabled: boolean;
  isRedoDisabled: boolean;
  onBulkReplace: (find: string, replace: string) => void;
  zoom: number;
  onZoomChange: (updater: (prev: number) => number) => void;
}

export const TimelineToolbar: React.FC<TimelineToolbarProps> = ({
  currentTime,
  totalDuration,
  isPlaying,
  onTogglePlay,
  currentSeg,
  onAddText,
  onAddLowerThird,
  onSplit,
  onMerge,
  onDelete,
  isSnappingEnabled,
  onToggleSnapping,
  isRippleEnabled,
  onToggleRipple,
  onUndo,
  onRedo,
  isUndoDisabled,
  isRedoDisabled,
  onBulkReplace,
  zoom,
  onZoomChange,
}) => {
  const [showDictionary, setShowDictionary] = useState(false);
  const [findWord, setFindWord] = useState('');
  const [replaceWord, setReplaceWord] = useState('');

  const handleBulkReplaceSubmit = () => {
    if (!findWord.trim()) return;
    onBulkReplace(findWord, replaceWord);
    setFindWord('');
    setReplaceWord('');
    setShowDictionary(false);
  };

  return (
    <>
      <div className="shrink-0 flex items-center justify-between px-4 py-2 border-b border-white/10 text-xs">
        {/* Left: Playhead control & current time */}
        <div className="flex items-center gap-3">
          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause playback (Space)' : 'Start playback (Space)'}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-bone flex items-center justify-center transition-colors focus-visible:ring-1 focus-visible:ring-amber-400"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? (
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {currentTime !== undefined ? (
            <span className="font-mono text-mist text-[11px]">
              <span className="text-bone font-medium">{formatTimecode(currentTime)}</span>
              <span className="text-smoke mx-1">/</span>
              <span>{formatTimecode(totalDuration)}</span>
            </span>
          ) : (
            <TimelineTimeDisplay totalDuration={totalDuration} />
          )}
        </div>

        {/* Center: Editing tools (+ Text, Split, Merge, Delete, Snap, Ripple, Undo/Redo, Dictionary) */}
        <div className="flex items-center gap-1 bg-[#1a1a18] p-1 rounded-xl border border-white/10">
          {/* Add Text */}
          <div className="relative group/tip flex items-center">
            <button
              onClick={onAddText}
              aria-label="Add text caption at playhead"
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-400 text-black hover:bg-amber-300 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
              <div className="relative bg-[#181816] border border-white/15 px-2.5 py-1 rounded-md text-[11px] text-bone font-medium shadow-xl whitespace-nowrap">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#181816] border-t border-l border-white/15 rotate-45" />
                <span>Add Text</span>
              </div>
            </div>
          </div>

          {/* Add Lower Third */}
          {onAddLowerThird && (
            <div className="relative group/tip flex items-center">
              <button
                onClick={onAddLowerThird}
                aria-label="Add lower third overlay at playhead"
                className="h-7 px-2 flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-amber-400/20 text-bone hover:text-amber-300 border border-white/10 hover:border-amber-400/40 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400 font-semibold text-[11px]"
                title="Add Lower Third at playhead"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Lower Third</span>
              </button>
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
                <div className="relative bg-[#181816] border border-white/15 px-2.5 py-1 rounded-md text-[11px] text-bone font-medium shadow-xl whitespace-nowrap">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#181816] border-t border-l border-white/15 rotate-45" />
                  <span>Add Lower Third</span>
                </div>
              </div>
            </div>
          )}

          {/* Split */}
          <div className="relative group/tip flex items-center">
            <button
              onClick={onSplit}
              disabled={!currentSeg}
              aria-label="Split active caption at playhead (S)"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-bone hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            >
              <Scissors className="w-3.5 h-3.5 text-mist" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
              <div className="relative bg-[#181816] border border-white/15 px-2.5 py-1 rounded-md text-[11px] text-bone font-medium shadow-xl whitespace-nowrap flex items-center gap-1.5">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#181816] border-t border-l border-white/15 rotate-45" />
                <span>Split</span>
                <kbd className="px-1 py-0.2 rounded bg-white/10 text-[9px] text-smoke font-mono font-semibold">
                  S
                </kbd>
              </div>
            </div>
          </div>

          {/* Merge */}
          <div className="relative group/tip flex items-center">
            <button
              onClick={onMerge}
              disabled={!currentSeg}
              aria-label="Merge active caption with next"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-bone hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            >
              <Combine className="w-3.5 h-3.5 text-mist" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
              <div className="relative bg-[#181816] border border-white/15 px-2.5 py-1 rounded-md text-[11px] text-bone font-medium shadow-xl whitespace-nowrap">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#181816] border-t border-l border-white/15 rotate-45" />
                <span>Merge</span>
              </div>
            </div>
          </div>

          {/* Delete */}
          <div className="relative group/tip flex items-center">
            <button
              onClick={onDelete}
              disabled={!currentSeg}
              aria-label="Delete active caption (Delete)"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-crimson-2 hover:bg-crimson/15 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-crimson-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-crimson-2" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
              <div className="relative bg-[#181816] border border-white/15 px-2.5 py-1 rounded-md text-[11px] text-bone font-medium shadow-xl whitespace-nowrap flex items-center gap-1.5">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#181816] border-t border-l border-white/15 rotate-45" />
                <span>Delete</span>
                <kbd className="px-1 py-0.2 rounded bg-white/10 text-[9px] text-smoke font-mono font-semibold">
                  Del
                </kbd>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-white/15 mx-0.5" />

          {/* Magnetic Snapping Toggle */}
          <div className="relative group/tip flex items-center">
            <button
              onClick={onToggleSnapping}
              aria-label={`Toggle magnetic snapping (${isSnappingEnabled ? 'ON' : 'OFF'})`}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isSnappingEnabled
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'text-smoke hover:text-bone hover:bg-white/5'
              }`}
            >
              <Magnet className="w-3.5 h-3.5" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
              <div className="relative bg-[#181816] border border-white/15 px-2.5 py-1 rounded-md text-[11px] text-bone font-medium shadow-xl whitespace-nowrap flex items-center gap-1.5">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#181816] border-t border-l border-white/15 rotate-45" />
                <span>Snap</span>
                <span
                  className={`text-[9px] font-bold ${isSnappingEnabled ? 'text-amber-400' : 'text-smoke'}`}
                >
                  {isSnappingEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>

          {/* Ripple Editing Mode Toggle */}
          <div className="relative group/tip flex items-center">
            <button
              onClick={onToggleRipple}
              aria-label={`Toggle ripple editing (${isRippleEnabled ? 'ON' : 'OFF'})`}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
                isRippleEnabled
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                  : 'text-smoke hover:text-bone hover:bg-white/5'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
              <div className="relative bg-[#181816] border border-white/15 px-2.5 py-1 rounded-md text-[11px] text-bone font-medium shadow-xl whitespace-nowrap flex items-center gap-1.5">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#181816] border-t border-l border-white/15 rotate-45" />
                <span>Ripple</span>
                <span
                  className={`text-[9px] font-bold ${isRippleEnabled ? 'text-amber-400' : 'text-smoke'}`}
                >
                  {isRippleEnabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-white/15 mx-0.5" />

          {/* Undo */}
          <div className="relative group/tip flex items-center">
            <button
              onClick={onUndo}
              disabled={isUndoDisabled}
              aria-label="Undo last edit (Ctrl+Z)"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-smoke hover:text-bone disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
              <div className="relative bg-[#181816] border border-white/15 px-2.5 py-1 rounded-md text-[11px] text-bone font-medium shadow-xl whitespace-nowrap flex items-center gap-1.5">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#181816] border-t border-l border-white/15 rotate-45" />
                <span>Undo</span>
                <kbd className="px-1 py-0.2 rounded bg-white/10 text-[9px] text-smoke font-mono font-semibold">
                  Ctrl+Z
                </kbd>
              </div>
            </div>
          </div>

          {/* Redo */}
          <div className="relative group/tip flex items-center">
            <button
              onClick={onRedo}
              disabled={isRedoDisabled}
              aria-label="Redo last edit (Ctrl+Shift+Z)"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-smoke hover:text-bone disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
              <div className="relative bg-[#181816] border border-white/15 px-2.5 py-1 rounded-md text-[11px] text-bone font-medium shadow-xl whitespace-nowrap flex items-center gap-1.5">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#181816] border-t border-l border-white/15 rotate-45" />
                <span>Redo</span>
                <kbd className="px-1 py-0.2 rounded bg-white/10 text-[9px] text-smoke font-mono font-semibold">
                  Ctrl+Y
                </kbd>
              </div>
            </div>
          </div>

          <div className="h-4 w-px bg-white/15 mx-0.5" />

          {/* Find & Replace Dictionary */}
          <div className="relative group/tip flex items-center">
            <button
              onClick={() => setShowDictionary(!showDictionary)}
              aria-label="Find and replace dialogue in all captions"
              className="w-7 h-7 flex items-center justify-center rounded-lg text-amber-300 hover:bg-amber-400/10 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            </button>
            <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover/tip:opacity-100 transition-opacity duration-150 z-50">
              <div className="relative bg-[#181816] border border-white/15 px-2.5 py-1 rounded-md text-[11px] text-bone font-medium shadow-xl whitespace-nowrap">
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#181816] border-t border-l border-white/15 rotate-45" />
                <span>Dictionary</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-smoke">Zoom</span>
          <button
            onClick={() => onZoomChange((z) => Math.max(30, z - 15))}
            aria-label="Zoom out timeline"
            className="text-smoke hover:text-bone p-1 font-bold text-sm cursor-pointer"
          >
            −
          </button>
          <input
            type="range"
            min={30}
            max={220}
            value={zoom}
            onChange={(e) => onZoomChange(() => Number(e.target.value))}
            aria-label="Timeline zoom level"
            className="w-16 h-1 accent-amber-400 bg-white/20 rounded cursor-pointer"
          ></input>
          <button
            onClick={() => onZoomChange((z) => Math.min(220, z + 15))}
            aria-label="Zoom in timeline"
            className="text-smoke hover:text-bone p-1 font-bold text-sm cursor-pointer"
          >
            +
          </button>
        </div>
      </div>

      {/* Dictionary Modal (Find & Replace) */}
      {showDictionary && (
        <div className="flex items-center gap-3 px-6 py-2.5 bg-[#181816] border-b border-amber-400/20 text-xs">
          <span className="text-amber-300 font-semibold">Bulk Replace:</span>
          <input
            type="text"
            placeholder="Find word..."
            value={findWord}
            onChange={(e) => setFindWord(e.target.value)}
            aria-label="Word to find"
            className="px-2.5 py-1 bg-[#222220] border border-white/15 rounded text-bone focus:outline-none focus:border-amber-400 text-xs w-36"
          />
          <span className="text-smoke">with</span>
          <input
            type="text"
            placeholder="Replace with..."
            value={replaceWord}
            onChange={(e) => setReplaceWord(e.target.value)}
            aria-label="Replacement word"
            className="px-2.5 py-1 bg-[#222220] border border-white/15 rounded text-bone focus:outline-none focus:border-amber-400 text-xs w-36"
          />
          <button
            onClick={handleBulkReplaceSubmit}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-semibold rounded text-xs transition-colors cursor-pointer"
          >
            Replace All
          </button>
          <button
            onClick={() => setShowDictionary(false)}
            aria-label="Close find and replace banner"
            className="text-smoke hover:text-bone text-xs ml-auto cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
};

export default React.memo(TimelineToolbar);
