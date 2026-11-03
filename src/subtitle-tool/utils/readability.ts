// ─── Subtitle Readability & Timing Diagnostics ──────────────────────────────
// Analyzes reading speed (CPS/WPM), duration bounds, and sequence overlaps.

import type { Segment } from '../types';

export interface ReadabilityIssue {
  type: 'speed' | 'duration' | 'overlap' | 'length';
  severity: 'warning' | 'error';
  message: string;
}

/**
 * Computes characters per second (CPS) excluding excess whitespace.
 */
export function getCPS(seg: Segment): number {
  const duration = Math.max(0.1, seg.end - seg.start);
  const chars = seg.text.trim().replace(/\s+/g, ' ').length;
  return +(chars / duration).toFixed(1);
}

/**
 * Computes words per minute (WPM).
 */
export function getWPM(seg: Segment): number {
  const duration = Math.max(0.1, seg.end - seg.start);
  const words = seg.text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round((words / duration) * 60);
}

/**
 * Evaluates a segment and returns any readability warnings.
 */
export function checkReadability(seg: Segment, prevSeg?: Segment, nextSeg?: Segment): ReadabilityIssue[] {
  const issues: ReadabilityIssue[] = [];
  const duration = seg.end - seg.start;
  const cps = getCPS(seg);
  const words = seg.text.trim().split(/\s+/).filter(Boolean);

  // 1. Reading Speed (Standard Netflix/BBC subtitle guidelines: 17-21 CPS max)
  if (cps > 26 && words.length > 2) {
    issues.push({
      type: 'speed',
      severity: 'error',
      message: `Too fast to read (${cps} chars/sec) · Consider splitting or extending`,
    });
  } else if (cps > 21 && words.length > 2) {
    issues.push({
      type: 'speed',
      severity: 'warning',
      message: `Fast reading speed (${cps} chars/sec)`,
    });
  }

  // 2. Duration Bounds
  if (duration < 0.45 && words.length > 1) {
    issues.push({
      type: 'duration',
      severity: 'warning',
      message: `Very brief duration (${duration.toFixed(2)}s)`,
    });
  } else if (duration > 6.5) {
    issues.push({
      type: 'duration',
      severity: 'warning',
      message: `Long duration (${duration.toFixed(1)}s) · Consider splitting into shorter beats`,
    });
  }

  // 3. Overlaps with adjacent captions
  if (prevSeg && seg.start < prevSeg.end - 0.05) {
    const overlapMs = Math.round((prevSeg.end - seg.start) * 1000);
    issues.push({
      type: 'overlap',
      severity: 'error',
      message: `Overlaps previous caption by ${overlapMs}ms`,
    });
  }

  if (nextSeg && seg.end > nextSeg.start + 0.05) {
    const overlapMs = Math.round((seg.end - nextSeg.start) * 1000);
    issues.push({
      type: 'overlap',
      severity: 'error',
      message: `Overlaps next caption by ${overlapMs}ms`,
    });
  }

  // 4. Line length & word density
  if (seg.text.length > 60) {
    issues.push({
      type: 'length',
      severity: 'warning',
      message: `Long line (${seg.text.length} chars) · May overflow vertical reels`,
    });
  }

  return issues;
}
