// ─── usePlayback Hook — Epic Hertz Studio ────────────────────────────────────
// Manages playback state, active caption tracking, and synchronizes with high-performance timeStore.
// Playback time is decoupled from React state to eliminate playhead lag and full-tree re-renders.

import { useState, useCallback, useEffect } from 'react';
import type { Segment } from '../types';
import { timeStore, usePlayheadId, usePlaybackStatus } from '../store/timeStore';

export interface UsePlaybackReturn {
  currentTime: number;
  duration: number;
  setDuration: (duration: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  /** ID of caption currently under the playhead timestamp (null in gaps). */
  playheadId: string | null;
  /** Backward-compatible alias for playheadId. */
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  handleTimeUpdate: (time: number) => void;
  resetPlayback: () => void;
  getCurrentTime: () => number;
}

export function usePlayback(segments: Segment[]): UsePlaybackReturn {
  const { isPlaying, duration } = usePlaybackStatus();
  const playheadId = usePlayheadId();
  const [manualActiveId, setManualActiveId] = useState<string | null>(null);

  // Sync segments into timeStore so it can compute playhead transitions
  useEffect(() => {
    timeStore.setSegments(segments);
  }, [segments]);

  const setDuration = useCallback((d: number) => {
    timeStore.setDuration(d);
  }, []);

  const setIsPlaying = useCallback((p: boolean) => {
    timeStore.setIsPlaying(p);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    timeStore.setTime(time, false);
  }, []);

  const resetPlayback = useCallback(() => {
    timeStore.reset();
    setManualActiveId(null);
  }, []);

  const setActiveId = useCallback((id: string | null) => {
    setManualActiveId(id);
  }, []);

  const activeId = manualActiveId ?? playheadId;

  return {
    currentTime: timeStore.getTime(),
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    playheadId,
    activeId,
    setActiveId,
    handleTimeUpdate,
    resetPlayback,
    getCurrentTime: timeStore.getTime,
  };
}
