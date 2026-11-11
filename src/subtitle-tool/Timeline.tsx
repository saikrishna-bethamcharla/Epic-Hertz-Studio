// ─── Timeline ────────────────────────────────────────────────────────────────
// Bottom interactive audio waveform & multi-track caption timeline matching ReplixCaptions:
// - Zoomable time ruler with precision timecodes
// - Draggable & resizable caption segment blocks (trim start, trim end, move)
// - Magnetic snapping (snaps to playhead and adjacent caption boundaries)
// - Ripple editing mode (subsequent captions follow shifts)
// - Visual overlap warnings and gap indicators with instant snap-to-bridge
// - Audio waveform peaks visualizer
// - Scrubbable playhead cursor
// - Quick edit actions: + Text, Split, Merge, Delete, Undo/Redo, Find & Replace

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { formatTimecode, formatRulerTick } from './utils/formatTime';
import { getSpeakerStyle, getSpeakerShortCode } from './utils/speakers';
import type { Segment, LowerThirdSpec } from './types';
import { Trash2 } from 'lucide-react';
import TimelineToolbar from './editor/TimelineToolbar';
import { timeStore, usePlayheadTime } from './store/timeStore';

export const TimelinePlayhead = React.memo(function TimelinePlayhead({
  zoom,
  fallbackTime,
}: {
  zoom: number;
  fallbackTime?: number;
}) {
  const storeTime = usePlayheadTime();
  const time = fallbackTime !== undefined ? fallbackTime : storeTime;
  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none z-30 will-change-transform"
      style={{
        left: 0,
        transform: `translate3d(${time * zoom}px, 0, 0) translateX(-50%)`,
      }}
    >
      {/* Playhead marker pin */}
      <div className="w-3.5 h-3.5 bg-amber-400 rounded-sm rotate-45 -translate-y-1 mx-auto shadow-md" />
      <div className="w-[1.5px] h-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] mx-auto" />
    </div>
  );
});

export interface TimelineProps {
  duration: number;
  currentTime?: number;
  isPlaying: boolean;
  segments: Segment[];
  activeId: string | null;
  selectedId?: string | null;
  lowerThirds?: LowerThirdSpec[];
  activeLowerThirdId?: string | null;
  onLowerThirdsChange?: (lowerThirds: LowerThirdSpec[]) => void;
  onSelectLowerThird?: (id: string | null) => void;
  onDeleteLowerThird?: (id: string) => void;
  onAddLowerThird?: () => void;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onSegmentsChange: (segments: Segment[]) => void;
  onSelectSegment?: (id: string) => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
}

interface DragState {
  type: 'move' | 'trim-start' | 'trim-end' | 'lt-move' | 'lt-trim-start' | 'lt-trim-end';
  segId: string;
  initialClientX: number;
  initialStart: number;
  initialEnd: number;
}

function Timeline({
  duration,
  currentTime,
  isPlaying,
  segments,
  activeId,
  selectedId,
  lowerThirds,
  activeLowerThirdId,
  onLowerThirdsChange,
  onSelectLowerThird,
  onDeleteLowerThird,
  onAddLowerThird,
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
  const [isSnappingEnabled, setIsSnappingEnabled] = useState(true);
  const [isRippleEnabled, setIsRippleEnabled] = useState(false);
  const [snapGuide, setSnapGuide] = useState<number | null>(null);

  const [localHistory, setLocalHistory] = useState<Segment[][]>([]);
  const [localRedo, setLocalRedo] = useState<Segment[][]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingPlayhead = useRef(false);
  const dragStateRef = useRef<DragState | null>(null);

  // Push state to undo history
  const pushState = useCallback(
    (newSegments: Segment[]) => {
      if (onUndo) {
        onSegmentsChange(newSegments);
      } else {
        setLocalHistory((prev) => [...prev.slice(-25), segments]);
        setLocalRedo([]);
        onSegmentsChange(newSegments);
      }
    },
    [segments, onSegmentsChange, onUndo],
  );

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

  // Active / selected segment
  const currentSeg = useMemo(() => {
    const id = selectedId ?? activeId;
    if (id) {
      const found = segments.find((s) => s.id === id);
      if (found) return found;
    }
    const t = currentTime !== undefined ? currentTime : timeStore.getTime();
    return segments.find((s) => t >= s.start && t <= s.end);
  }, [segments, selectedId, activeId, currentTime]);

  // ── Render Waveform Canvas ────────────────────────────────────────────────
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ch = canvas.clientHeight || 48;
    canvas.width = totalWidth;
    canvas.height = ch;

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
      const baseAmp = inSpeech
        ? 0.35 + Math.abs(noise) * 0.55
        : 0.08 + Math.abs(Math.sin(i * 0.5)) * 0.08;
      const barH = Math.max(3, baseAmp * (canvas.height - 8));

      ctx.globalAlpha = inSpeech ? 0.85 : 0.3;
      ctx.fillRect(x, midY - barH / 2, barWidth, barH);
    }
  }, [totalWidth, totalDuration, segments]);

  // ── Scrubbing / Seeking via Click & Drag on Timeline ──────────────────────
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // If clicking on segment controls, do not start playhead drag
    if ((e.target as HTMLElement).closest('.timeline-segment')) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    isDraggingPlayhead.current = true;

    const scrollLeft = containerRef.current?.scrollLeft || 0;
    const clickX = e.clientX - rect.left + scrollLeft;
    let seekTime = Math.max(0, Math.min(totalDuration, clickX / zoom));

    // Snap playhead to segment edges if enabled
    if (isSnappingEnabled) {
      const threshold = 8 / zoom;
      const nearestEdge = segments
        .flatMap((s) => [s.start, s.end])
        .find((t) => Math.abs(t - seekTime) < threshold);
      if (nearestEdge !== undefined) seekTime = nearestEdge;
    }

    onSeek(seekTime);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingPlayhead.current || !rect) return;
      const curScroll = containerRef.current?.scrollLeft || 0;
      const x = moveEvent.clientX - rect.left + curScroll;
      let t = Math.max(0, Math.min(totalDuration, x / zoom));

      if (isSnappingEnabled) {
        const threshold = 8 / zoom;
        const nearestEdge = segments
          .flatMap((s) => [s.start, s.end])
          .find((edge) => Math.abs(edge - t) < threshold);
        if (nearestEdge !== undefined) t = nearestEdge;
      }

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

  // ── Segment Drag / Resize Handlers with Magnetic Snapping & Ripple ─────────
  const startSegmentDrag = (
    e: React.MouseEvent,
    seg: Segment,
    type: 'move' | 'trim-start' | 'trim-end',
  ) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectSegment?.(seg.id);
    onSelectLowerThird?.(null);

    dragStateRef.current = {
      type,
      segId: seg.id,
      initialClientX: e.clientX,
      initialStart: seg.start,
      initialEnd: seg.end,
    };

    const segIndex = segments.findIndex((s) => s.id === seg.id);
    const snapThreshold = 10 / zoom;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const state = dragStateRef.current;
      if (!state) return;

      const effectiveTime = currentTime !== undefined ? currentTime : timeStore.getTime();
      const deltaX = moveEvent.clientX - state.initialClientX;
      const deltaSec = deltaX / zoom;

      let newStart = state.initialStart;
      let newEnd = state.initialEnd;
      let guide: number | null = null;

      if (state.type === 'move') {
        const span = state.initialEnd - state.initialStart;
        newStart = Math.max(0, +(state.initialStart + deltaSec).toFixed(2));
        newEnd = +(newStart + span).toFixed(2);

        if (isSnappingEnabled) {
          // Snap to playhead
          if (Math.abs(newStart - effectiveTime) < snapThreshold) {
            newStart = effectiveTime;
            newEnd = +(newStart + span).toFixed(2);
            guide = newStart;
          } else if (Math.abs(newEnd - effectiveTime) < snapThreshold) {
            newEnd = effectiveTime;
            newStart = Math.max(0, +(newEnd - span).toFixed(2));
            guide = newEnd;
          } else {
            // Snap to neighbors
            const prev = segments.find(
              (s) => s.id !== state.segId && Math.abs(s.end - newStart) < snapThreshold,
            );
            if (prev) {
              newStart = prev.end;
              newEnd = +(newStart + span).toFixed(2);
              guide = newStart;
            } else {
              const next = segments.find(
                (s) => s.id !== state.segId && Math.abs(s.start - newEnd) < snapThreshold,
              );
              if (next) {
                newEnd = next.start;
                newStart = Math.max(0, +(newEnd - span).toFixed(2));
                guide = newEnd;
              }
            }
          }
        }
      } else if (state.type === 'trim-start') {
        newStart = Math.max(
          0,
          Math.min(state.initialEnd - 0.2, +(state.initialStart + deltaSec).toFixed(2)),
        );
        if (isSnappingEnabled) {
          if (Math.abs(newStart - effectiveTime) < snapThreshold) {
            newStart = Math.min(state.initialEnd - 0.2, effectiveTime);
            guide = newStart;
          } else {
            const prev = segments.find(
              (s) => s.id !== state.segId && Math.abs(s.end - newStart) < snapThreshold,
            );
            if (prev) {
              newStart = Math.min(state.initialEnd - 0.2, prev.end);
              guide = newStart;
            }
          }
        }
      } else if (state.type === 'trim-end') {
        newEnd = Math.max(state.initialStart + 0.2, +(state.initialEnd + deltaSec).toFixed(2));
        if (isSnappingEnabled) {
          if (Math.abs(newEnd - effectiveTime) < snapThreshold) {
            newEnd = Math.max(state.initialStart + 0.2, effectiveTime);
            guide = newEnd;
          } else {
            const next = segments.find(
              (s) => s.id !== state.segId && Math.abs(s.start - newEnd) < snapThreshold,
            );
            if (next) {
              newEnd = Math.max(state.initialStart + 0.2, next.start);
              guide = newEnd;
            }
          }
        }
      }

      setSnapGuide(guide);

      // Apply update (with ripple if enabled)
      const shiftDelta =
        state.type === 'move' ? newStart - state.initialStart : newEnd - state.initialEnd;

      const updated = segments.map((s, idx) => {
        if (s.id === state.segId) {
          return { ...s, start: newStart, end: newEnd };
        }
        if (isRippleEnabled && idx > segIndex && Math.abs(shiftDelta) > 0.01) {
          const rStart = Math.max(0, +(s.start + shiftDelta).toFixed(2));
          const rEnd = Math.max(rStart + 0.2, +(s.end + shiftDelta).toFixed(2));
          return { ...s, start: rStart, end: rEnd };
        }
        return s;
      });

      onSegmentsChange(updated);
    };

    const onMouseUp = () => {
      dragStateRef.current = null;
      setSnapGuide(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const startLowerThirdDrag = (
    e: React.MouseEvent,
    lt: LowerThirdSpec,
    type: 'lt-move' | 'lt-trim-start' | 'lt-trim-end',
  ) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectLowerThird?.(lt.id);
    onSelectSegment?.('');

    dragStateRef.current = {
      type,
      segId: lt.id,
      initialClientX: e.clientX,
      initialStart: lt.start,
      initialEnd: lt.end,
    };

    const snapThreshold = 10 / zoom;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const state = dragStateRef.current;
      if (!state || !lowerThirds) return;

      const effectiveTime = currentTime !== undefined ? currentTime : timeStore.getTime();
      const deltaX = moveEvent.clientX - state.initialClientX;
      const deltaSec = deltaX / zoom;

      let newStart = state.initialStart;
      let newEnd = state.initialEnd;
      let guide: number | null = null;

      if (state.type === 'lt-move') {
        const span = state.initialEnd - state.initialStart;
        newStart = Math.max(0, +(state.initialStart + deltaSec).toFixed(2));
        newEnd = +(newStart + span).toFixed(2);

        if (isSnappingEnabled) {
          if (Math.abs(newStart - effectiveTime) < snapThreshold) {
            newStart = effectiveTime;
            newEnd = +(newStart + span).toFixed(2);
            guide = newStart;
          } else if (Math.abs(newEnd - effectiveTime) < snapThreshold) {
            newEnd = effectiveTime;
            newStart = Math.max(0, +(newEnd - span).toFixed(2));
            guide = newEnd;
          }
        }
      } else if (state.type === 'lt-trim-start') {
        newStart = Math.max(
          0,
          Math.min(state.initialEnd - 0.3, +(state.initialStart + deltaSec).toFixed(2)),
        );
        if (isSnappingEnabled && Math.abs(newStart - effectiveTime) < snapThreshold) {
          newStart = Math.min(state.initialEnd - 0.3, effectiveTime);
          guide = newStart;
        }
      } else if (state.type === 'lt-trim-end') {
        newEnd = Math.max(
          state.initialStart + 0.3,
          Math.min(totalDuration, +(state.initialEnd + deltaSec).toFixed(2)),
        );
        if (isSnappingEnabled && Math.abs(newEnd - effectiveTime) < snapThreshold) {
          newEnd = Math.max(state.initialStart + 0.3, effectiveTime);
          guide = newEnd;
        }
      }

      setSnapGuide(guide);

      const updated = lowerThirds.map((item) =>
        item.id === state.segId ? { ...item, start: newStart, end: newEnd } : item,
      );
      onLowerThirdsChange?.(updated);
    };

    const onMouseUp = () => {
      dragStateRef.current = null;
      setSnapGuide(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // ── Split Segment at Current Playhead ─────────────────────────────────────
  const handleSplit = () => {
    if (!currentSeg) return;
    const curTime = currentTime !== undefined ? currentTime : timeStore.getTime();
    if (curTime <= currentSeg.start + 0.2 || curTime >= currentSeg.end - 0.2) return;

    const segIndex = segments.findIndex((s) => s.id === currentSeg.id);
    const words = currentSeg.text.split(' ');
    const half = Math.ceil(words.length / 2);
    const text1 = words.slice(0, half).join(' ');
    const text2 = words.slice(half).join(' ');

    const newSeg1: Segment = {
      ...currentSeg,
      end: curTime,
      text: text1,
      words: currentSeg.words ? currentSeg.words.filter((w) => w.start < curTime) : undefined,
    };

    const newSeg2: Segment = {
      ...currentSeg,
      id: `seg-${Date.now()}`,
      index: currentSeg.index + 1,
      start: curTime,
      end: currentSeg.end,
      text: text2,
      words: currentSeg.words ? currentSeg.words.filter((w) => w.start >= curTime) : undefined,
      styleOverride: currentSeg.styleOverride ? { ...currentSeg.styleOverride } : undefined,
      speaker: currentSeg.speaker,
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
      words:
        currentSeg.words && nextSeg.words ? [...currentSeg.words, ...nextSeg.words] : undefined,
    };

    const updated = [...segments.slice(0, idx), mergedSeg, ...segments.slice(idx + 2)].map(
      (s, i) => ({ ...s, index: i + 1 }),
    );

    pushState(updated);
  };

  // ── Delete Current Segment or Selected Lower Third ──────────────────────────
  const handleDelete = () => {
    if (activeLowerThirdId) {
      if (onDeleteLowerThird) {
        onDeleteLowerThird(activeLowerThirdId);
      } else {
        const nextLt = (lowerThirds || []).filter((lt) => lt.id !== activeLowerThirdId);
        onLowerThirdsChange?.(nextLt);
        onSelectLowerThird?.(null);
      }
      return;
    }
    if (!currentSeg) return;
    const updated = segments
      .filter((s) => s.id !== currentSeg.id)
      .map((s, idx) => ({ ...s, index: idx + 1 }));
    pushState(updated);
  };

  // ── Add New Text Segment at Playhead ───────────────────────────────────────
  const handleAddText = () => {
    const start = currentTime !== undefined ? currentTime : timeStore.getTime();
    const end = Math.min(totalDuration, start + 2);
    const newSeg: Segment = {
      id: `seg-${Date.now()}`,
      index: segments.length + 1,
      start,
      end,
      text: 'New Caption',
    };
    const updated = [...segments, newSeg]
      .sort((a, b) => a.start - b.start)
      .map((s, i) => ({ ...s, index: i + 1 }));
    pushState(updated);
    onSelectSegment?.(newSeg.id);
  };

  // ── Snap Gap between segments ─────────────────────────────────────────────
  const handleCloseGap = (prevSeg: Segment, nextSeg: Segment) => {
    const updated = segments.map((s) => {
      if (s.id === nextSeg.id) {
        const span = s.end - s.start;
        return { ...s, start: prevSeg.end, end: +(prevSeg.end + span).toFixed(2) };
      }
      return s;
    });
    pushState(updated);
  };

  // Ruler markers every 2 or 5 seconds based on zoom
  const rulerInterval = zoom > 70 ? 2 : 5;
  const numRulerTicks = Math.ceil(totalDuration / rulerInterval);

  return (
    <div className="h-full w-full flex flex-col bg-[#121211] border-t border-white/10 select-none overflow-hidden">
      {/* ── Timeline Toolbar ──────────────────────────────────────────────── */}
      <TimelineToolbar
        currentTime={currentTime}
        totalDuration={totalDuration}
        isPlaying={isPlaying}
        onTogglePlay={onTogglePlay}
        currentSeg={currentSeg}
        activeLowerThirdId={activeLowerThirdId}
        onAddText={handleAddText}
        onAddLowerThird={onAddLowerThird}
        onSplit={handleSplit}
        onMerge={handleMerge}
        onDelete={handleDelete}
        isSnappingEnabled={isSnappingEnabled}
        onToggleSnapping={() => setIsSnappingEnabled((s) => !s)}
        isRippleEnabled={isRippleEnabled}
        onToggleRipple={() => setIsRippleEnabled((r) => !r)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isUndoDisabled={isUndoDisabled}
        isRedoDisabled={isRedoDisabled}
        onBulkReplace={(find, replace) => {
          const regex = new RegExp(find, 'gi');
          const updated = segments.map((s) => ({
            ...s,
            text: s.text.replace(regex, replace),
          }));
          pushState(updated);
        }}
        zoom={zoom}
        onZoomChange={setZoom}
      />

      {/* ── Multi-Track Tracks Canvas Area ─────────────────────────────────── */}
      <div
        ref={containerRef}
        onMouseDown={handleTimelineMouseDown}
        className="flex-1 min-h-0 relative overflow-x-auto overflow-y-hidden cursor-crosshair bg-[#0c0c0b]"
        style={{ scrollBehavior: 'auto' }}
      >
        <div
          className="relative h-full flex flex-col justify-between"
          style={{ width: `${totalWidth}px` }}
        >
          {/* 1. Time Ruler Top */}
          <div className="h-6 shrink-0 border-b border-white/10 relative text-[10px] font-mono text-smoke">
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

          {/* 2. Caption Track (Segment blocks with resize/drag handles & gap bridges) */}
          <div className="h-12 shrink-0 relative px-1 my-1">
            {segments.map((seg, sIdx) => {
              const left = seg.start * zoom;
              const width = Math.max(30, (seg.end - seg.start) * zoom);
              const isSelected = seg.id === (selectedId ?? activeId);
              const isActive = seg.id === activeId;
              const speakerStyle = getSpeakerStyle(seg.speaker);
              const nextSeg = sIdx < segments.length - 1 ? segments[sIdx + 1] : undefined;
              const hasOverlap = nextSeg && nextSeg.start < seg.end - 0.03;
              const hasGap = nextSeg && nextSeg.start > seg.end + 0.6;

              return (
                <div key={seg.id}>
                  {/* Segment block */}
                  <div
                    onMouseDown={(e) => startSegmentDrag(e, seg, 'move')}
                    className={`timeline-segment absolute top-0.5 h-11 rounded-lg px-2 py-1 text-xs font-medium cursor-grab active:cursor-grabbing transition-colors border flex flex-col justify-center overflow-hidden group shadow-md select-none ${
                      isSelected
                        ? 'bg-[#2b2a26] border-amber-400 text-amber-200 ring-1 ring-amber-400/50'
                        : isActive
                          ? 'bg-[#232321] border-amber-400/40 text-bone ring-1 ring-amber-400/20'
                          : 'bg-[#1c1c1a] border-white/15 text-bone hover:border-white/35 hover:bg-[#222220]'
                    }`}
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                      borderTopColor: speakerStyle ? speakerStyle.darkBorder : undefined,
                      borderTopWidth: speakerStyle ? 3 : 1,
                    }}
                    title={`${speakerStyle ? `[${speakerStyle.name}] ` : ''}${seg.text} (${formatTimecode(seg.start)} - ${formatTimecode(seg.end)})`}
                  >
                    {/* Left Trim Handle */}
                    <div
                      onMouseDown={(e) => startSegmentDrag(e, seg, 'trim-start')}
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-400/60 transition-colors z-20 group-hover:bg-white/20"
                      title="Drag to trim start"
                    />

                    {/* Content */}
                    <div className="flex items-center gap-1 pl-1 min-w-0">
                      {speakerStyle && (
                        <span
                          className={`px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase shrink-0 border ${speakerStyle.bg} ${speakerStyle.text} ${speakerStyle.border}`}
                        >
                          {getSpeakerShortCode(seg.speaker)}
                        </span>
                      )}
                      <span className="truncate font-semibold text-[11px] tracking-tight">
                        {seg.text || '...'}
                      </span>
                    </div>
                    <div className="text-[9px] text-smoke font-mono pl-1">
                      {formatTimecode(seg.start)} - {formatTimecode(seg.end)}
                    </div>

                    {/* Right Trim Handle */}
                    <div
                      onMouseDown={(e) => startSegmentDrag(e, seg, 'trim-end')}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-400/60 transition-colors z-20 group-hover:bg-white/20"
                      title="Drag to trim end"
                    />
                  </div>

                  {/* Overlap Warning Indicator */}
                  {hasOverlap && (
                    <div
                      className="absolute top-0 h-12 bg-crimson/30 border-l border-r border-crimson/60 pointer-events-none z-10"
                      style={{
                        left: `${nextSeg.start * zoom}px`,
                        width: `${Math.max(4, (seg.end - nextSeg.start) * zoom)}px`,
                      }}
                      title="Warning: Overlapping captions"
                    />
                  )}

                  {/* Gap indicator with snap/close gap button */}
                  {hasGap && (
                    <div
                      className="absolute top-2.5 h-7 flex items-center justify-center z-10"
                      style={{
                        left: `${seg.end * zoom}px`,
                        width: `${(nextSeg.start - seg.end) * zoom}px`,
                      }}
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCloseGap(seg, nextSeg);
                        }}
                        className="px-1 py-0.5 rounded bg-white/5 hover:bg-amber-400/20 text-smoke hover:text-amber-300 text-[9px] border border-dashed border-white/20 font-mono transition-colors"
                        title="Click to snap / close gap"
                      >
                        Snap
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 3. Lower Thirds Track */}
          <div className="h-10 shrink-0 relative px-1 my-0.5 border-t border-b border-white/5 bg-[#0d0d0c]/70">
            <div className="absolute left-1 top-0.5 z-10 text-[8px] font-mono font-bold tracking-wider text-smoke/60 uppercase pointer-events-none">
              Lower Thirds
            </div>
            {lowerThirds && lowerThirds.length > 0 ? (
              lowerThirds.map((lt) => {
                const left = lt.start * zoom;
                const width = Math.max(36, (lt.end - lt.start) * zoom);
                const isActive = lt.id === activeLowerThirdId;

                return (
                  <div
                    key={lt.id}
                    onMouseDown={(e) => startLowerThirdDrag(e, lt, 'lt-move')}
                    className={`timeline-segment absolute top-1 h-8 rounded-lg px-2 text-xs font-medium cursor-grab active:cursor-grabbing transition-colors border flex items-center justify-between overflow-hidden group shadow-md select-none ${
                      isActive
                        ? 'bg-[#272621] border-amber-400 text-amber-200 ring-1 ring-amber-400/50 z-20'
                        : 'bg-[#181816] border-white/15 text-bone hover:border-white/35 hover:bg-[#1f1f1d] z-10'
                    }`}
                    style={{
                      left: `${left}px`,
                      width: `${width}px`,
                      borderLeftColor: lt.colors.primary,
                      borderLeftWidth: 3,
                    }}
                    title={`[V${lt.variant}] ${lt.name} - ${lt.role} (${formatTimecode(lt.start)} - ${formatTimecode(lt.end)})`}
                  >
                    {/* Left Trim Handle */}
                    <div
                      onMouseDown={(e) => startLowerThirdDrag(e, lt, 'lt-trim-start')}
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-400/60 transition-colors z-20 group-hover:bg-white/20"
                      title="Drag to trim start"
                    />

                    {/* Content */}
                    <div className="flex items-center gap-1.5 min-w-0 pl-1">
                      <span className="px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[8px] font-bold shrink-0">
                        V{lt.variant}
                      </span>
                      <span className="truncate font-semibold text-[10px] tracking-tight">
                        {lt.name || 'Lower Third'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pl-1">
                      <span className="text-[8px] text-smoke font-mono">
                        {(lt.end - lt.start).toFixed(1)}s
                      </span>
                      {isActive && (
                        <button
                          type="button"
                          aria-label={`Delete lower third ${lt.name}`}
                          onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (onDeleteLowerThird) {
                              onDeleteLowerThird(lt.id);
                            } else {
                              const nextLt = (lowerThirds || []).filter(
                                (item) => item.id !== lt.id,
                              );
                              onLowerThirdsChange?.(nextLt);
                              onSelectLowerThird?.(null);
                            }
                          }}
                          className="p-0.5 rounded text-red-400 hover:text-red-200 hover:bg-red-500/20 z-30 transition-colors cursor-pointer"
                          title="Delete lower third"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>

                    {/* Right Trim Handle */}
                    <div
                      onMouseDown={(e) => startLowerThirdDrag(e, lt, 'lt-trim-end')}
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-400/60 transition-colors z-20 group-hover:bg-white/20"
                      title="Drag to trim end"
                    />
                  </div>
                );
              })
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-smoke/40 font-medium pointer-events-none">
                No lower thirds · Click "+ Lower Third" in toolbar to add
              </div>
            )}
          </div>

          {/* 4. Audio Waveform Track */}
          <div className="flex-1 min-h-[44px] relative">
            <canvas
              ref={waveformCanvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
          </div>

          {/* Magnetic Snap Guideline (Amber vertical line) */}
          {snapGuide !== null && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-40 border-l-2 border-amber-300/90 shadow-[0_0_10px_rgba(251,191,36,0.9)]"
              style={{ left: `${snapGuide * zoom}px` }}
            />
          )}

          {/* 4. Playhead Cursor (Amber vertical line with pointer top) */}
          <TimelinePlayhead zoom={zoom} fallbackTime={currentTime} />
        </div>
      </div>
    </div>
  );
}

export default React.memo(Timeline);
