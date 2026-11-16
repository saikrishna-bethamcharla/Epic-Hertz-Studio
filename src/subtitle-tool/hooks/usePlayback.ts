// ─── usePlayback Hook — Epic Hertz Studio ────────────────────────────────────
// Manages playback state, active caption tracking, and synchronizes with high-performance timeStore.
// Playback time is decoupled from React state to eliminate playhead lag and full-tree re-renders.

import { useState, useCallback, useEffect, useSyncExternalStore } from 'react';
import type { Segment } from '../types';
import { timeStore, usePlaybackStatus } from '../store/timeStore';

const noopSubscribe = () => () => {};
const getNullSnapshot = () => null;

export interface UsePlaybackReturn {
  duration: number;
  setDuration: (duration: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  /** ID of caption currently under the playhead timestamp (null in gaps). */
  playheadId: string | null;
  /**
   * Active caption ID for editor highlight and auto-scroll. Tracks playheadId during playback
   * and on seek/scrub, or reflects manual user selection until the playhead moves into another caption.
   */
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  handleTimeUpdate: (time: number) => void;
  handleSeek: (time: number) => void;
  resetPlayback: () => void;
  getCurrentTime: () => number;
}

export interface UsePlaybackOptions {
  /**
   * If false, decouples the caller from playhead ID transitions, preventing continuous
   * playback from waking up top-level containers. Defaults to true.
   */
  reactiveActiveId?: boolean;
}

export function usePlayback(
  segments: Segment[],
  options?: UsePlaybackOptions,
): UsePlaybackReturn {
  const { isPlaying, duration } = usePlaybackStatus();
  const reactive = options?.reactiveActiveId ?? true;

  // When reactive is false, use a dummy subscriber so React skips listening to playheadId changes,
  // guaranteeing zero re-renders of the calling component during continuous playback.
  const playheadId = useSyncExternalStore(
    reactive ? timeStore.subscribePlayheadId : noopSubscribe,
    reactive ? timeStore.getPlayheadId : getNullSnapshot,
    reactive ? timeStore.getPlayheadId : getNullSnapshot,
  );
  const [manualActiveId, setManualActiveId] = useState<string | null>(null);

  // Sync segments into timeStore so it can compute playhead transitions
  useEffect(() => {
    timeStore.setSegments(segments);
  }, [segments]);

  // Clear manual selection when playhead moves into a different caption during playback
  useEffect(() => {
    if (reactive) {
      if (isPlaying && playheadId && manualActiveId && playheadId !== manualActiveId) {
        setManualActiveId(null);
      }
    } else {
      return timeStore.subscribePlayheadId(() => {
        if (!manualActiveId) return;
        const curPlayheadId = timeStore.getPlayheadId();
        if (timeStore.getIsPlaying() && curPlayheadId && curPlayheadId !== manualActiveId) {
          setManualActiveId(null);
        }
      });
    }
  }, [reactive, isPlaying, playheadId, manualActiveId]);

  // Clear manual selection on seek or scrub
  useEffect(() => {
    return timeStore.subscribeSeek(() => {
      if (manualActiveId) {
        setManualActiveId(null);
      }
    });
  }, [manualActiveId]);

  const setDuration = useCallback((d: number) => {
    timeStore.setDuration(d);
  }, []);

  const setIsPlaying = useCallback((p: boolean) => {
    timeStore.setIsPlaying(p);
  }, []);

  const handleTimeUpdate = useCallback((time: number) => {
    timeStore.setTime(time, false);
  }, []);

  const handleSeek = useCallback((time: number) => {
    setManualActiveId(null);
    timeStore.seek(time);
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
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    playheadId,
    activeId,
    setActiveId,
    handleTimeUpdate,
    handleSeek,
    resetPlayback,
    getCurrentTime: timeStore.getTime,
  };
}
