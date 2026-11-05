// ─── usePlayback Hook — Epic Hertz Studio ────────────────────────────────────
// Manages playhead position, media duration, playback state, and active caption tracking.

import { useState, useCallback } from 'react';
import type { Segment } from '../types';

export interface UsePlaybackReturn {
  currentTime: number;
  setCurrentTime: (time: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  handleTimeUpdate: (time: number) => void;
  resetPlayback: () => void;
}

export function usePlayback(segments: Segment[]): UsePlaybackReturn {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleTimeUpdate = useCallback(
    (time: number) => {
      setCurrentTime(time);
      const active = segments.find((s) => time >= s.start && time <= s.end);
      setActiveId(active?.id ?? null);
    },
    [segments],
  );

  const resetPlayback = useCallback(() => {
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    setActiveId(null);
  }, []);

  return {
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    isPlaying,
    setIsPlaying,
    activeId,
    setActiveId,
    handleTimeUpdate,
    resetPlayback,
  };
}
