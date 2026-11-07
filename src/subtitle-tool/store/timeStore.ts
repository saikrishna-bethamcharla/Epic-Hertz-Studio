// ─── Playback Time Store ──────────────────────────────────────────────────
// High-performance external time store decoupled from React component tree.
// Prevents 60Hz/30Hz full-tree re-renders on every playhead tick.
// Only components explicitly subscribing to usePlayheadTime() (TimelinePlayhead,
// TimeDisplay) re-render on time ticks, throttled to at most 30 Hz.

import { useSyncExternalStore } from 'react';
import type { Segment } from '../types';

export class PlaybackTimeStore {
  private _currentTime: number = 0;
  private _duration: number = 0;
  private _isPlaying: boolean = false;
  private _playheadId: string | null = null;
  private _segments: Segment[] = [];
  private _currentSegment: Segment | null = null;
  private _syncOffset: number = 0;
  private _lastTickMs: number = 0;

  // Listeners
  private _timeListeners = new Set<() => void>();
  private _playheadIdListeners = new Set<() => void>();
  private _playbackStatusListeners = new Set<() => void>();

  constructor() {
    this.subscribeTime = this.subscribeTime.bind(this);
    this.subscribePlayheadId = this.subscribePlayheadId.bind(this);
    this.subscribePlaybackStatus = this.subscribePlaybackStatus.bind(this);
    this.getTime = this.getTime.bind(this);
    this.getPlayheadId = this.getPlayheadId.bind(this);
    this.getDuration = this.getDuration.bind(this);
    this.getIsPlaying = this.getIsPlaying.bind(this);
  }

  // ── Getters for useSyncExternalStore ──────────────────────────────────────
  getTime(): number {
    return this._currentTime;
  }

  getPlayheadId(): string | null {
    return this._playheadId;
  }

  getDuration(): number {
    return this._duration;
  }

  getIsPlaying(): boolean {
    return this._isPlaying;
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────
  subscribeTime(listener: () => void): () => void {
    this._timeListeners.add(listener);
    return () => {
      this._timeListeners.delete(listener);
    };
  }

  subscribePlayheadId(listener: () => void): () => void {
    this._playheadIdListeners.add(listener);
    return () => {
      this._playheadIdListeners.delete(listener);
    };
  }

  subscribePlaybackStatus(listener: () => void): () => void {
    this._playbackStatusListeners.add(listener);
    return () => {
      this._playbackStatusListeners.delete(listener);
    };
  }

  // ── Setters ───────────────────────────────────────────────────────────────
  setSegments(segments: Segment[]): void {
    this._segments = segments;
    // Re-evaluate playheadId with new segments
    this._updatePlayheadId(this._currentTime);
  }

  setSyncOffset(offset: number): void {
    if (this._syncOffset !== offset) {
      this._syncOffset = offset;
      this._updatePlayheadId(this._currentTime);
    }
  }

  setDuration(duration: number): void {
    if (this._duration !== duration) {
      this._duration = duration;
      this._notifyStatus();
    }
  }

  setIsPlaying(isPlaying: boolean): void {
    if (this._isPlaying !== isPlaying) {
      this._isPlaying = isPlaying;
      this._notifyStatus();
    }
  }

  /**
   * Updates current playback time from rAF loop or media event.
   * Throttles playhead tick listeners to at most 30 Hz (~33.3ms) unless force = true.
   * Only notifies playheadId listeners when the active segment actually changes!
   */
  setTime(time: number, force: boolean = false, nowMs: number = performance.now()): void {
    this._currentTime = time;

    // 1. Evaluate active caption segment (only notifies when changed!)
    this._updatePlayheadId(time);

    // 2. Notify tick listeners throttled to at most 30 Hz (>= 33ms interval)
    if (force || nowMs - this._lastTickMs >= 33) {
      this._lastTickMs = nowMs;
      this._timeListeners.forEach((fn) => fn());
    }
  }

  private _updatePlayheadId(time: number): void {
    const t = time - this._syncOffset;
    let newId: string | null = null;
    let nextSeg: Segment | null = null;

    if (
      this._currentSegment &&
      t >= this._currentSegment.start &&
      t <= this._currentSegment.end + 0.15
    ) {
      newId = this._currentSegment.id;
      nextSeg = this._currentSegment;
    } else {
      const found = this._segments.find((s) => t >= s.start && t <= s.end + 0.15);
      if (found) {
        newId = found.id;
        nextSeg = found;
      }
    }

    if (newId !== this._playheadId) {
      this._playheadId = newId;
      this._currentSegment = nextSeg;
      this._playheadIdListeners.forEach((fn) => fn());
    }
  }

  private _notifyStatus(): void {
    this._playbackStatusListeners.forEach((fn) => fn());
  }

  reset(): void {
    this._currentTime = 0;
    this._duration = 0;
    this._isPlaying = false;
    this._playheadId = null;
    this._currentSegment = null;
    this._lastTickMs = 0;
    this._notifyStatus();
    this._playheadIdListeners.forEach((fn) => fn());
    this._timeListeners.forEach((fn) => fn());
  }
}

// Global / singleton instance for application session
export const timeStore = new PlaybackTimeStore();

// ── React Hooks ─────────────────────────────────────────────────────────────

/**
 * Subscribes to playback time ticks, throttled to at most 30 Hz.
 * Only use in lightweight visual indicator components (e.g. PlayheadLine, TimeDisplay).
 * Never subscribe in large container panels!
 */
export function usePlayheadTime(): number {
  return useSyncExternalStore(timeStore.subscribeTime, timeStore.getTime, timeStore.getTime);
}

/**
 * Subscribes ONLY to active caption ID under playhead.
 * Only triggers re-render when the active caption changes (null -> seg-1 -> seg-2).
 * Does NOT re-render on continuous time ticks!
 */
export function usePlayheadId(): string | null {
  return useSyncExternalStore(
    timeStore.subscribePlayheadId,
    timeStore.getPlayheadId,
    timeStore.getPlayheadId,
  );
}

/**
 * Subscribes ONLY to isPlaying and duration changes.
 * Does NOT re-render on time ticks.
 */
export function usePlaybackStatus(): { isPlaying: boolean; duration: number } {
  const isPlaying = useSyncExternalStore(
    timeStore.subscribePlaybackStatus,
    timeStore.getIsPlaying,
    timeStore.getIsPlaying,
  );
  const duration = useSyncExternalStore(
    timeStore.subscribePlaybackStatus,
    timeStore.getDuration,
    timeStore.getDuration,
  );
  return { isPlaying, duration };
}
