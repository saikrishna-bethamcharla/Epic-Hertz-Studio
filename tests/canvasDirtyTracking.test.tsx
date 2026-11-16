// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import CaptionCanvas from '../src/subtitle-tool/CaptionCanvas';
import type { LowerThirdSpec, Segment, CaptionStyle } from '../src/subtitle-tool/types';
import { DEFAULT_STYLE } from '../src/subtitle-tool/constants';
import { timeStore } from '../src/subtitle-tool/store/timeStore';

// Mock canvas getContext in jsdom
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () =>
      ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        measureText: vi.fn(() => ({ width: 100 })),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        rect: vi.fn(),
        roundRect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        drawImage: vi.fn(),
        clip: vi.fn(),
        setLineDash: vi.fn(),
        strokeRect: vi.fn(),
        scale: vi.fn(),
        translate: vi.fn(),
      }) as any,
  );
}

describe('CaptionCanvas Dirty-Tracking & 0% Idle CPU/GPU', () => {
  const dummySegments: Segment[] = [
    {
      id: 'seg-1',
      start: 0,
      end: 5,
      text: 'Testing dirty tracking',
      words: [{ word: 'Testing', start: 0, end: 1 }],
    },
  ];

  const dummyLowerThird: LowerThirdSpec = {
    id: 'lt-1',
    templateId: 'mogrt-callout-right-box',
    variant: 1,
    name: 'CALLOUT TARGET',
    role: 'Precision Spec',
    colors: { primary: '#F59E0B', secondary: '#18181B' },
    font: { family: 'Inter', size: 0.038, weight: 700 },
    position: { x: 0.5, y: 0.5, align: 'center' },
    scale: 1.0,
    start: 0,
    end: 10,
  };

  const style: CaptionStyle = {
    ...DEFAULT_STYLE,
    layout: { ...DEFAULT_STYLE.layout, x: 0.5, y: 0.8 },
  };

  beforeEach(() => {
    timeStore.reset();
    vi.clearAllMocks();
  });

  it('draws initial frame on mount and then stops completely when paused and stationary (0% CPU/GPU)', async () => {
    let rafCalls = 0;
    const originalRaf = window.requestAnimationFrame;
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCalls++;
      return originalRaf(cb);
    });

    const videoEl = document.createElement('video');
    Object.defineProperty(videoEl, 'paused', { value: true, writable: true });
    Object.defineProperty(videoEl, 'currentTime', { value: 1, writable: true });
    const videoRef = { current: videoEl };
    const hostRef = { current: document.createElement('div') };

    const { unmount } = render(
      <CaptionCanvas
        segments={dummySegments}
        style={style}
        lowerThirds={[dummyLowerThird]}
        videoRef={videoRef}
        hostRef={hostRef}
      />,
    );

    // Initial mount schedules a single dirty frame
    const mountRafCount = rafCalls;
    expect(mountRafCount).toBeGreaterThanOrEqual(1);

    // Wait a macro-task / micro-task cycle to ensure all initial effects settle
    await new Promise((resolve) => setTimeout(resolve, 50));

    const settledRafCount = rafCalls;

    // Simulate idle time: no events, no playback, no drags
    await new Promise((resolve) => setTimeout(resolve, 50));

    // When paused and stationary, NO further requestAnimationFrame calls must be scheduled!
    expect(rafCalls).toBe(settledRafCount);

    rafSpy.mockRestore();
    unmount();
  });

  it('runs continuous frame loop when video is playing and stops immediately when paused', async () => {
    let rafCalls = 0;
    const originalRaf = window.requestAnimationFrame;
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCalls++;
      return originalRaf(cb);
    });

    const videoEl = document.createElement('video');
    Object.defineProperty(videoEl, 'paused', { value: true, writable: true });
    Object.defineProperty(videoEl, 'currentTime', { value: 1, writable: true });
    const videoRef = { current: videoEl };
    const hostRef = { current: document.createElement('div') };

    const { unmount } = render(
      <CaptionCanvas
        segments={dummySegments}
        style={style}
        lowerThirds={[dummyLowerThird]}
        videoRef={videoRef}
        hostRef={hostRef}
      />,
    );

    await new Promise((resolve) => setTimeout(resolve, 30));
    const pausedBaseline = rafCalls;

    // 1. Start playback
    act(() => {
      Object.defineProperty(videoEl, 'paused', { value: false, writable: true });
      videoEl.dispatchEvent(new Event('play'));
    });

    // Advance time during playback
    await new Promise((resolve) => setTimeout(resolve, 60));
    const activePlaybackCalls = rafCalls - pausedBaseline;
    expect(activePlaybackCalls).toBeGreaterThan(0);

    // 2. Pause video
    act(() => {
      Object.defineProperty(videoEl, 'paused', { value: true, writable: true });
      videoEl.dispatchEvent(new Event('pause'));
    });

    await new Promise((resolve) => setTimeout(resolve, 30));
    const stoppedBaseline = rafCalls;

    // Simulate another idle period
    await new Promise((resolve) => setTimeout(resolve, 50));

    // After pause settles, no further rAF calls are made!
    expect(rafCalls).toBe(stoppedBaseline);

    rafSpy.mockRestore();
    unmount();
  });

  it('runs frame loop while an overlay is actively being dragged, and drops to 0% upon release', async () => {
    let rafCalls = 0;
    const originalRaf = window.requestAnimationFrame;
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      rafCalls++;
      return originalRaf(cb);
    });

    const host = document.createElement('div');
    document.body.appendChild(host);

    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 500,
      bottom: 1000,
      width: 500,
      height: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    });

    const videoEl = document.createElement('video');
    Object.defineProperty(videoEl, 'paused', { value: true, writable: true });
    Object.defineProperty(videoEl, 'currentTime', { value: 2, writable: true });
    Object.defineProperty(videoEl, 'videoWidth', { value: 500, writable: true });
    Object.defineProperty(videoEl, 'videoHeight', { value: 1000, writable: true });
    const videoRef = { current: videoEl };
    const hostRef = { current: host };

    const { container, unmount } = render(
      <CaptionCanvas
        segments={dummySegments}
        style={style}
        lowerThirds={[dummyLowerThird]}
        videoRef={videoRef}
        hostRef={hostRef}
      />,
    );

    const canvas = container.querySelector('canvas')!;
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      right: 500,
      bottom: 1000,
      width: 500,
      height: 1000,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
    canvas.width = 500;
    canvas.height = 1000;

    await new Promise((resolve) => setTimeout(resolve, 30));
    const stationaryCount = rafCalls;

    // 1. Pointer down on lower third (center at 250, 500)
    act(() => {
      fireEvent.pointerDown(host, {
        button: 0,
        clientX: 250,
        clientY: 500,
        pointerId: 1,
      });
    });

    // 2. Pointer move while dragging
    act(() => {
      fireEvent.pointerMove(host, {
        clientX: 280,
        clientY: 530,
        pointerId: 1,
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(rafCalls).toBeGreaterThan(stationaryCount);

    // 3. Pointer up (release drag)
    act(() => {
      fireEvent.pointerUp(host, {
        pointerId: 1,
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 30));
    const settledAfterDragCount = rafCalls;

    // 4. Idle period after release
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Zero further rAF calls!
    expect(rafCalls).toBe(settledAfterDragCount);

    document.body.removeChild(host);
    rafSpy.mockRestore();
    unmount();
  });
});
