// @vitest-environment jsdom
import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import VideoPreview, { type VideoPreviewHandle } from '../src/subtitle-tool/VideoPreview';
import Timeline from '../src/subtitle-tool/Timeline';
import { timeStore } from '../src/subtitle-tool/store/timeStore';
import { DEFAULT_STYLE } from '../src/subtitle-tool/constants';
import type { Segment } from '../src/subtitle-tool/types';

describe('Decoupled UI & Throttled Video Seek Gate', () => {
  const dummyFile = new File(['mock'], 'test.mp4', { type: 'video/mp4' });
  const dummySegments: Segment[] = [
    {
      id: 'seg-1',
      start: 1,
      end: 4,
      text: 'First test segment',
      words: [{ word: 'First', start: 1, end: 2, confidence: 1 }],
    },
    {
      id: 'seg-2',
      start: 5,
      end: 8,
      text: 'Second test segment',
      words: [{ word: 'Second', start: 5, end: 6, confidence: 1 }],
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

  it('instantly updates timeStore on seekTo without waiting for video element', () => {
    const previewRef = createRef<VideoPreviewHandle>();
    const onSeek = vi.fn();

    render(
      <VideoPreview
        ref={previewRef}
        videoFile={dummyFile}
        segments={dummySegments}
        style={DEFAULT_STYLE}
        onTimeUpdate={vi.fn()}
        onSeek={onSeek}
      />,
    );

    expect(previewRef.current).toBeTruthy();

    // Call seekTo(3.5)
    act(() => {
      previewRef.current?.seekTo(3.5);
    });

    // timeStore should be updated immediately with zero delay
    expect(timeStore.getTime()).toBe(3.5);
    expect(onSeek).toHaveBeenCalledWith(3.5, true);
  });

  it('throttles video seeks when video is already seeking and uses fastSeek when available', () => {
    const previewRef = createRef<VideoPreviewHandle>();
    const onSeek = vi.fn();

    const { container } = render(
      <VideoPreview
        ref={previewRef}
        videoFile={dummyFile}
        segments={dummySegments}
        style={DEFAULT_STYLE}
        onTimeUpdate={vi.fn()}
        onSeek={onSeek}
      />,
    );

    const videoEl = container.querySelector('video') as HTMLVideoElement;
    expect(videoEl).toBeTruthy();

    const fastSeekSpy = vi.fn();
    (videoEl as any).fastSeek = fastSeekSpy;

    // Simulate rapid scrubbing (multiple non-final seeks)
    act(() => {
      previewRef.current?.seekTo(1.0, false);
      previewRef.current?.seekTo(1.5, false);
      previewRef.current?.seekTo(2.0, false);
    });

    // Immediate timeStore update to 2.0 (instant visual feedback)
    expect(timeStore.getTime()).toBe(2.0);

    // Fast-forward animation frames
    act(() => {
      vi.advanceTimersByTime(50);
    });

    // Mark video as actively seeking
    Object.defineProperty(videoEl, 'seeking', { value: true, configurable: true, writable: true });

    act(() => {
      // New seek while video is currently seeking
      previewRef.current?.seekTo(4.2, false);
    });

    // Video should NOT be flooded with immediate seek call while seeking is true
    expect(timeStore.getTime()).toBe(4.2);

    // When video finishes current seek (seeked event), pending seek to 4.2 should be executed
    Object.defineProperty(videoEl, 'seeking', { value: false, configurable: true, writable: true });
    fireEvent(videoEl, new Event('seeked'));

    act(() => {
      // execute next queued rAF
      vi.advanceTimersByTime(50);
    });
  });

  it('renders Timeline playhead with GPU-accelerated translate3d transform', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <Timeline
        duration={10}
        isPlaying={false}
        segments={dummySegments}
        onSeek={onSeek}
        onTogglePlay={vi.fn()}
        onSegmentsChange={vi.fn()}
      />,
    );

    // Find playhead element
    const playhead = container.querySelector('.will-change-transform') as HTMLElement;
    expect(playhead).toBeTruthy();

    // Initial transform at t=0
    expect(playhead.style.transform).toContain('translate3d(0px,');

    // Seek to 4.0s
    act(() => {
      timeStore.seek(4.0);
    });

    // Playhead translates via GPU transform instantly
    expect(playhead.style.transform).toContain('translate3d(');
    expect(playhead.style.transform).not.toContain('translate3d(0px, 0px, 0px)');
  });

  it('updates timeStore immediately on mouse scrub and commits on mouse up', () => {
    const onSeek = vi.fn();
    const { container } = render(
      <Timeline
        duration={10}
        isPlaying={false}
        segments={dummySegments}
        onSeek={onSeek}
        onTogglePlay={vi.fn()}
        onSegmentsChange={vi.fn()}
      />,
    );

    // Find timeline tracks scroll container
    const tracksContainer = container.querySelector('.cursor-crosshair') as HTMLElement;
    expect(tracksContainer).toBeTruthy();

    // Mock getBoundingClientRect
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

    // Simulate mousedown scrub at x=100
    fireEvent.mouseDown(tracksContainer, {
      clientX: 100,
      clientY: 50,
      button: 0,
    });

    expect(onSeek).toHaveBeenCalled();
    const initialCall = onSeek.mock.calls[0];
    expect(initialCall[1]).toBe(false); // isFinal is false during scrub

    // Mouse move scrub
    fireEvent.mouseMove(window, {
      clientX: 250,
      clientY: 50,
    });

    expect(onSeek).toHaveBeenCalledTimes(2);
    expect(onSeek.mock.calls[1][1]).toBe(false);

    // Mouse up commits exact final seek
    fireEvent.mouseUp(window);

    expect(onSeek).toHaveBeenCalledTimes(3);
    const finalCall = onSeek.mock.calls[2];
    expect(finalCall[1]).toBe(true); // isFinal is true on release
  });
});
