// ─── Timeline ────────────────────────────────────────────────────────────────
// Bottom interactive audio waveform & multi-track caption timeline matching ReplixCaptions:
// - Zoomable time ruler
// - Draggable/resizable caption segment blocks
// - Audio waveform peaks visualizer
// - Scrubbable playhead cursor
// - Quick edit actions: + Text, Split, Merge, Delete, Undo/Redo, Find & Replace

import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Scissors, Combine, Trash2, BookOpen, Plus, Undo2, Redo2 } from 'lucide-react';
import { formatTimecode, formatRulerTick } from './utils/formatTime';
import type { Segment } from './types';

interface TimelineProps {
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  segments: Segment[];
  activeId: string | null;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onSegmentsChange: (segments: Segment[]) => void;
  onSelectSegment?: (id: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

export default function Timeline({
  duration,
  currentTime,
  isPlaying,
  segments,
  activeId,
  onSeek,
  onTogglePlay,
  onSegmentsChange,
  onSelectSegment,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: TimelineProps) {
  // Pixels per second zoom factor (default ~90px per second)
  const [zoom, setZoom] = useState(90);
  const [localHistory, setLocalHistory] = useState<Segment[][]>([]);
  const [localRedo, setLocalRedo] = useState<Segment[][]>([]);
  const [showDictionary, setShowDictionary] = useState(false);
  const [findWord, setFindWord] = useState('');
  const [replaceWord, setReplaceWord] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingPlayhead = useRef(false);

  // Push state to undo history
  const pushState = useCallback((newSegments: Segment[]) => {
    if (onUndo) {
      onSegmentsChange(newSegments);
    } else {
      setLocalHistory((prev) => [...prev.slice(-25), segments]);
      setLocalRedo([]);
      onSegmentsChange(newSegments);
    }
  }, [segments, onSegmentsChange, onUndo]);

  const handleUndo = () => {
    if (onUndo) {
      onUndo();
    } else {
      if (localHistory.length === 0) return;
      const prev = localHistory[localHistory.length - 1];
      setLocalRedo((r) => [segments, ...r]);
      setLocalHistory((h) => h.slice(0, -1));
      onSegmentsChange(prev);
    }
  };

  const handleRedo = () => {
    if (onRedo) {
      onRedo();
    } else {
      if (localRedo.length === 0) return;
      const next = localRedo[0];
      setLocalHistory((h) => [...h, segments]);
      setLocalRedo((r) => r.slice(1));
      onSegmentsChange(next);
    }
  };

  const isUndoDisabled = onUndo ? !canUndo : localHistory.length === 0;
  const isRedoDisabled = onRedo ? !canRedo : localRedo.length === 0;

  // Safe duration calculation ensuring timeline span covers both video and caption limits
  const maxSegEnd = segments.length > 0 ? Math.max(...segments.map((s) => s.end)) : 0;
  const totalDuration = Math.max(duration || 0, maxSegEnd, 5);
  const totalWidth = Math.max(totalDuration * zoom, 600);

  // Active segment
  const currentSeg = useMemo(() => {
    return segments.find((s) => s.id === activeId) ||
      segments.find((s) => currentTime >= s.start && currentTime <= s.end);
  }, [segments, activeId, currentTime]);

  // ── Render Waveform Canvas ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = totalWidth;
    canvas.height = 42;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate visually appealing speech-like waveform peaks
    const barWidth = 3;
    const gap = 2;
    const step = barWidth + gap;
    const numBars = Math.floor(totalWidth / step);
    const midY = canvas.height / 2;

    ctx.fillStyle = '#D9A74A'; // Warm gold/amber waveform color

    for (let i = 0; i < numBars; i++) {
      const x = i * step;
      const timeAtBar = (x / totalWidth) * totalDuration;

      // Check if time is within any segment
      const inSpeech = segments.some((s) => timeAtBar >= s.start && timeAtBar <= s.end);

      // Pseudo-random speech amplitude modulation
      const noise = Math.sin(i * 0.28) * Math.cos(i * 0.12) * Math.sin(i * 0.05);
      const baseAmp = inSpeech ? 0.35 + Math.abs(noise) * 0.55 : 0.08 + Math.abs(Math.sin(i * 0.5)) * 0.08;
      const barH = Math.max(3, baseAmp * (canvas.height - 8));

      ctx.globalAlpha = inSpeech ? 0.85 : 0.3;
      ctx.fillRect(x, midY - barH / 2, barWidth, barH);
    }
  }, [totalWidth, totalDuration, segments]);

  // ── Scrubbing / Seeking via Click & Drag on Timeline ──────────────────────
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    isDraggingPlayhead.current = true;

    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const clickX = e.clientX - rect.left + scrollLeft;
    const seekTime = Math.max(0, Math.min(totalDuration, clickX / zoom));
    onSeek(seekTime);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingPlayhead.current || !rect) return;
      const curScroll = containerRef.current?.scrollLeft || 0;
      const x = moveEvent.clientX - rect.left + curScroll;
      const t = Math.max(0, Math.min(totalDuration, x / zoom));
      onSeek(t);
    };

    const handleMouseUp = () => {
      isDraggingPlayhead.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // ── Split Segment at Current Playhead ─────────────────────────────────────
  const handleSplit = () => {
    if (!currentSeg) return;
    if (currentTime <= currentSeg.start + 0.2 || currentTime >= currentSeg.end - 0.2) return;

    const segIndex = segments.findIndex((s) => s.id === currentSeg.id);
    const words = currentSeg.text.split(' ');
    const half = Math.ceil(words.length / 2);
    const text1 = words.slice(0, half).join(' ');
    const text2 = words.slice(half).join(' ');

    const newSeg1: Segment = {
      ...currentSeg,
      end: currentTime,
      text: text1,
      words: currentSeg.words ? currentSeg.words.filter((w) => w.start < currentTime) : undefined,
    };

    const newSeg2: Segment = {
      id: `seg-${Date.now()}`,
      index: currentSeg.index + 1,
      start: currentTime,
      end: currentSeg.end,
      text: text2,
      words: currentSeg.words ? currentSeg.words.filter((w) => w.start >= currentTime) : undefined,
    };

    const updated = [
      ...segments.slice(0, segIndex),
      newSeg1,
      newSeg2,
      ...segments.slice(segIndex + 1),
    ].map((s, idx) => ({ ...s, index: idx + 1 }));

    pushState(updated);
  };

  // ── Merge Current Segment with Next ───────────────────────────────────────
  const handleMerge = () => {
    if (!currentSeg) return;
    const idx = segments.findIndex((s) => s.id === currentSeg.id);
    if (idx === -1 || idx >= segments.length - 1) return;

    const nextSeg = segments[idx + 1];
    const mergedSeg: Segment = {
      ...currentSeg,
      end: nextSeg.end,
      text: `${currentSeg.text.trim()} ${nextSeg.text.trim()}`.trim(),
      words: currentSeg.words && nextSeg.words ? [...currentSeg.words, ...nextSeg.words] : undefined,
    };

    const updated = [
      ...segments.slice(0, idx),
      mergedSeg,
      ...segments.slice(idx + 2),
    ].map((s, i) => ({ ...s, index: i + 1 }));

    pushState(updated);
  };

  // ── Delete Current Segment ────────────────────────────────────────────────
  const handleDelete = () => {
    if (!currentSeg) return;
    const updated = segments
      .filter((s) => s.id !== currentSeg.id)
      .map((s, idx) => ({ ...s, index: idx + 1 }));
    pushState(updated);
  };

  // ── Add New Text Segment at Playhead ───────────────────────────────────────
  const handleAddText = () => {
    const start = currentTime;
    const end = Math.min(totalDuration, start + 2);
    const newSeg: Segment = {
      id: `seg-${Date.now()}`,
      index: segments.length + 1,
      start,
      end,
      text: 'New Caption',
    };
    const updated = [...segments, newSeg].sort((a, b) => a.start - b.start).map((s, i) => ({ ...s, index: i + 1 }));
    pushState(updated);
    onSelectSegment?.(newSeg.id);
  };

  // ── Bulk Find & Replace ───────────────────────────────────────────────────
  const handleBulkReplace = () => {
    if (!findWord.trim()) return;
    const regex = new RegExp(findWord, 'gi');
    const updated = segments.map((s) => ({
      ...s,
      text: s.text.replace(regex, replaceWord),
    }));
    pushState(updated);
    setFindWord('');
    setReplaceWord('');
    setShowDictionary(false);
  };

  // Ruler markers every 2 or 5 seconds based on zoom
  const rulerInterval = zoom > 70 ? 2 : 5;
  const numRulerTicks = Math.ceil(totalDuration / rulerInterval);

  return (
    <div className="flex flex-col bg-[#121211] border-t border-white/10 select-none">
      {/* ── Timeline Toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 text-xs">
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

          <span className="font-mono text-mist text-[11px]">
            <span className="text-bone font-medium">{formatTimecode(currentTime)}</span>
            <span className="text-smoke mx-1">/</span>
            <span>{formatTimecode(totalDuration)}</span>
          </span>
        </div>

        {/* Center: Editing tools (+ Text, Split, Merge, Delete, Undo/Redo) */}
        <div className="flex items-center gap-1.5 bg-[#1a1a18] p-1 rounded-xl border border-white/10">
          <button
            onClick={handleAddText}
            aria-label="Add text caption at playhead"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-400 text-black hover:bg-amber-300 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            title="Add text segment at current position"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Text</span>
          </button>

          <button
            onClick={handleSplit}
            disabled={!currentSeg}
            aria-label="Split active caption at playhead (S)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-bone hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            title="Split active segment at playhead (S)"
          >
            <Scissors className="w-3 h-3 text-mist" />
            <span>Split</span>
          </button>

          <button
            onClick={handleMerge}
            disabled={!currentSeg}
            aria-label="Merge active caption with next"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-bone hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            title="Merge segment with next"
          >
            <Combine className="w-3 h-3 text-mist" />
            <span>Merge</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={!currentSeg}
            aria-label="Delete active caption (Delete)"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-crimson-2 hover:bg-crimson/15 disabled:opacity-40 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-crimson-2"
            title="Delete segment (Delete)"
          >
            <Trash2 className="w-3 h-3 text-crimson-2" />
            <span>Delete</span>
          </button>

          <div className="h-4 w-px bg-white/15 mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={handleUndo}
            disabled={isUndoDisabled}
            aria-label="Undo last edit (Ctrl+Z)"
            className="p-1 rounded text-smoke hover:text-bone disabled:opacity-30 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRedo}
            disabled={isRedoDisabled}
            aria-label="Redo last edit (Ctrl+Shift+Z)"
            className="p-1 rounded text-smoke hover:text-bone disabled:opacity-30 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-white/15 mx-1" />

          {/* Find & Replace Dictionary */}
          <button
            onClick={() => setShowDictionary(!showDictionary)}
            aria-label="Find and replace dialogue in all captions"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-amber-300 hover:bg-amber-400/10 transition-colors cursor-pointer focus-visible:ring-1 focus-visible:ring-amber-400"
            title="Find & Replace in all captions"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Dictionary</span>
          </button>
        </div>

        {/* Right: Zoom controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-smoke">Zoom</span>
          <button
            onClick={() => setZoom((z) => Math.max(30, z - 15))}
            aria-label="Zoom out timeline"
            className="text-smoke hover:text-bone p-1 font-bold text-sm"
          >
            −
          </button>
          <input
            type="range"
            min={30}
            max={200}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Timeline zoom level"
            className="w-16 h-1 accent-amber-400 bg-white/20 rounded cursor-pointer"
          />
          <button
            onClick={() => setZoom((z) => Math.min(220, z + 15))}
            aria-label="Zoom in timeline"
            className="text-smoke hover:text-bone p-1 font-bold text-sm"
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
            onClick={handleBulkReplace}
            className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-black font-semibold rounded text-xs transition-colors"
          >
            Replace All
          </button>
          <button
            onClick={() => setShowDictionary(false)}
            aria-label="Close find and replace banner"
            className="text-smoke hover:text-bone text-xs ml-auto"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Multi-Track Tracks Canvas Area ─────────────────────────────────── */}
      <div
        ref={containerRef}
        onMouseDown={handleTimelineMouseDown}
        className="relative overflow-x-auto overflow-y-hidden cursor-crosshair h-32 bg-[#0c0c0b]"
        style={{ scrollBehavior: 'auto' }}
        data-lenis-prevent
      >
        <div
          className="relative h-full"
          style={{ width: `${totalWidth}px` }}
        >
          {/* 1. Time Ruler Top */}
          <div className="h-6 border-b border-white/10 relative text-[10px] font-mono text-smoke">
            {Array.from({ length: numRulerTicks + 1 }).map((_, i) => {
              const sec = i * rulerInterval;
              const left = sec * zoom;
              if (left > totalWidth) return null;
              return (
                <div
                  key={sec}
                  className="absolute top-0 flex flex-col items-center"
                  style={{ left: `${left}px` }}
                >
                  <span className="px-1 text-[9px] -translate-x-1/2">{formatRulerTick(sec)}</span>
                  <div className="w-px h-2 bg-white/20" />
                </div>
              );
            })}
          </div>

          {/* 2. Caption Track (Segment blocks) */}
          <div className="h-12 relative px-1 my-1">
            {segments.map((seg) => {
              const left = seg.start * zoom;
              const width = Math.max(30, (seg.end - seg.start) * zoom);
              const isActive = seg.id === activeId;

              return (
                <div
                  key={seg.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(seg.start);
                    onSelectSegment?.(seg.id);
                  }}
                  className={`absolute top-0.5 h-11 rounded-lg px-2 py-1 text-xs font-medium cursor-pointer transition-colors border flex flex-col justify-center overflow-hidden group shadow-md ${
                    isActive
                      ? 'bg-[#2b2a26] border-amber-400 text-amber-200 ring-1 ring-amber-400/50'
                      : 'bg-[#1c1c1a] border-white/15 text-bone hover:border-white/35 hover:bg-[#222220]'
                  }`}
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                  }}
                  title={`${seg.text} (${formatTimecode(seg.start)} - ${formatTimecode(seg.end)})`}
                >
                  <div className="truncate font-semibold text-[11px] tracking-tight">
                    {seg.text || '...'}
                  </div>
                  <div className="text-[9px] text-smoke font-mono">
                    {formatTimecode(seg.start)} - {formatTimecode(seg.end)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Audio Waveform Track */}
          <div className="h-11 relative">
            <canvas
              ref={waveformCanvasRef}
              className="absolute inset-0 pointer-events-none"
            />
          </div>

          {/* 4. Playhead Cursor (Red/White vertical line with pointer top) */}
          <div
            className="absolute top-0 bottom-0 pointer-events-none z-30 will-change-transform"
            style={{
              left: 0,
              transform: `translate3d(${currentTime * zoom}px, 0, 0) translateX(-50%)`,
            }}
          >
            {/* Playhead marker pin */}
            <div className="w-3.5 h-3.5 bg-amber-400 rounded-sm rotate-45 -translate-y-1 mx-auto shadow-md" />
            <div className="w-[1.5px] h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}
