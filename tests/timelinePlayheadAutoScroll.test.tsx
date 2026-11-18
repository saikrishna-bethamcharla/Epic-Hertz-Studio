// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import Timeline from '../src/subtitle-tool/Timeline';
import { timeStore } from '../src/subtitle-tool/store/timeStore';
import type { Segment } from '../src/subtitle-tool/types';

describe('Timeline Playhead Auto-Scroll and Always-Visible Tracking', () => {
  const dummySegments: Segment[] = [
    {
      id: 'seg-1',
      start: 0,
      end: 5,
      text: 'First segment',
      words: [{ word: 'First', start: 0, end: 2, confidence: 1 }],
    },
    {
      id: 'seg-2',
      start: 10,
      end: 25,
      text: 'Second segment',
      words: [{ word: 'Second', start: 10, end: 15, confidence: 1 }],
    },
    {
      id: 'seg-3',
      start: 30,
      end: 60,
      text: 'Third segment',
      words: [{ word: 'Third', start: 30, end: 35, confidence: 1 }],
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
    timeStore.reset();
    vi.restoreAllMocks();

    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      fill: vi.fn(),
      closePath: vi.fn(),
      arc: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 0 }),
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clamps playhead inside visible viewport and starts auto-scrolling when dragging past right edge', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <Timeline
        duration={60}
        isPlaying={false}
        segments={dummySegments}
        onSeek={onSeek}
        onTogglePlay={vi.fn()}
        onSegmentsChange={vi.fn()}
      />,
    );

    const tracksContainer = container.querySelector('.cursor-crosshair') as HTMLElement;
    expect(tracksContainer).toBeTruthy();

    // Mock container geometry: 1000px wide, left=0, right=1000, scrollWidth=5400px
    vi.spyOn(tracksContainer, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 1000,
      bottom: 200,
      width: 1000,
      height: 200,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    Object.defineProperty(tracksContainer, 'clientWidth', { value: 1000, configurable: true });
    Object.defineProperty(tracksContainer, 'scrollWidth', { value: 5400, configurable: true });
    tracksContainer.scrollLeft = 0;

    // 1. Mouse down at clientX = 400 (inside container)
    fireEvent.mouseDown(tracksContainer, { clientX: 400, clientY: 50, button: 0 });
    expect(onSeek).toHaveBeenCalled();
    const t0 = timeStore.getTime();
    expect(t0).toBeCloseTo(400 / 90, 1);

    // 2. Drag mouse PAST the right edge: clientX = 1100 (100px outside container)
    fireEvent.mouseMove(window, { clientX: 1100, clientY: 50 });

    // The playhead position must be clamped to the container edge, NOT off-screen!
    const tClamped = timeStore.getTime();
    // Clamped screen X = 994px (1000 - 6px margin) -> tClamped = 994 / 90 ~ 11.04s
    expect(tClamped).toBeCloseTo(994 / 90, 1);

    // 3. Fast-forward animation frames: auto-scroll must advance container.scrollLeft continuously
    act(() => {
      vi.advanceTimersByTime(100); // ~6 frames of rAF
    });

    // container.scrollLeft should have increased due to rightward velocity
    expect(tracksContainer.scrollLeft).toBeGreaterThan(0);

    // And timeStore.getTime() should advance as the timeline scrolls forward
    const tAfterScroll = timeStore.getTime();
    expect(tAfterScroll).toBeGreaterThan(tClamped);

    // 4. Release mouse: auto-scroll stops and final seek commits
    fireEvent.mouseUp(window);
    const finalCalls = onSeek.mock.calls;
    const lastCall = finalCalls[finalCalls.length - 1];
    expect(lastCall[1]).toBe(true); // isFinal is true on release
  });

  it('clamps playhead inside visible viewport and auto-scrolls left when dragging past left edge', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <Timeline
        duration={60}
        isPlaying={false}
        segments={dummySegments}
        onSeek={onSeek}
        onTogglePlay={vi.fn()}
        onSegmentsChange={vi.fn()}
      />,
    );

    const tracksContainer = container.querySelector('.cursor-crosshair') as HTMLElement;
    expect(tracksContainer).toBeTruthy();

    vi.spyOn(tracksContainer, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 0,
      right: 1100,
      bottom: 200,
      width: 1000,
      height: 200,
      x: 100,
      y: 0,
      toJSON: () => {},
    });
    Object.defineProperty(tracksContainer, 'clientWidth', { value: 1000, configurable: true });
    Object.defineProperty(tracksContainer, 'scrollWidth', { value: 5400, configurable: true });
    // Start scrolled into the timeline
    tracksContainer.scrollLeft = 500;

    // Mouse down at clientX = 400
    fireEvent.mouseDown(tracksContainer, { clientX: 400, clientY: 50, button: 0 });

    // Drag mouse PAST the left edge: clientX = 20 (80px to the left of container left boundary)
    fireEvent.mouseMove(window, { clientX: 20, clientY: 50 });

    // Playhead is clamped to left+6px (screen X = 106px)
    const tClampedLeft = timeStore.getTime();
    expect(tClampedLeft).toBeCloseTo((6 + 500) / 90, 1);

    // Advance rAF timers to let left auto-scroll run
    act(() => {
      vi.advanceTimersByTime(100);
    });

    // scrollLeft should have decreased towards 0
    expect(tracksContainer.scrollLeft).toBeLessThan(500);

    fireEvent.mouseUp(window);
  });

  it('auto-scrolls timeline forward during video playback when playhead nears right edge', () => {
    const { container } = render(
      <Timeline
        duration={60}
        isPlaying={true}
        segments={dummySegments}
        onSeek={vi.fn()}
        onTogglePlay={vi.fn()}
        onSegmentsChange={vi.fn()}
      />,
    );

    const tracksContainer = container.querySelector('.cursor-crosshair') as HTMLElement;
    expect(tracksContainer).toBeTruthy();

    Object.defineProperty(tracksContainer, 'clientWidth', { value: 1000, configurable: true });
    Object.defineProperty(tracksContainer, 'scrollWidth', { value: 5400, configurable: true });
    tracksContainer.scrollLeft = 0;

    // Simulate playback playing: set isPlaying true in timeStore
    act(() => {
      timeStore.setIsPlaying(true);
      // Playhead advances to near right edge (e.g. at 980px -> t = 980 / 90 ~ 10.88s)
      timeStore.setTime(10.9, true);
    });

    // Timeline should have auto-scrolled forward so playhead remains visible at ~20% of viewport
    expect(tracksContainer.scrollLeft).toBeGreaterThan(0);
  });
});
