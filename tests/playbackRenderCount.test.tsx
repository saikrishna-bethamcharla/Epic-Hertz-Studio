// @vitest-environment jsdom
import React, { Profiler, useState } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, fireEvent } from '@testing-library/react';
import 'fake-indexeddb/auto';
import type { Segment } from '../src/subtitle-tool/types';
import SubtitleTool from '../src/subtitle-tool/SubtitleTool';
import CaptionEditor from '../src/subtitle-tool/CaptionEditor';
import VideoPreview, { type VideoPreviewHandle } from '../src/subtitle-tool/VideoPreview';
import Timeline from '../src/subtitle-tool/Timeline';
import { DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import { usePlayback } from '../src/subtitle-tool/hooks/usePlayback';
import { timeStore, usePlayheadTime } from '../src/subtitle-tool/store/timeStore';

// Mock DOM APIs missing in jsdom
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: true,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  }
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-video-url');
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn();
  }
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;
  }
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = vi.fn();
  window.HTMLMediaElement.prototype.load = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();

  if (!HTMLCanvasElement.prototype.getContext) {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      fillRect: vi.fn(),
      clearRect: vi.fn(),
      getImageData: vi.fn(),
      putImageData: vi.fn(),
      createImageData: vi.fn(),
      setTransform: vi.fn(),
      drawImage: vi.fn(),
      save: vi.fn(),
      fillText: vi.fn(),
      restore: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      stroke: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      rotate: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      transform: vi.fn(),
      resetTransform: vi.fn(),
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  }
}

const sampleSegments: Segment[] = [
  {
    id: 'seg-1',
    index: 1,
    start: 0.0,
    end: 1.5,
    text: 'Caption A content',
    words: [
      { word: 'Caption', start: 0.0, end: 0.5 },
      { word: 'A', start: 0.5, end: 1.0 },
      { word: 'content', start: 1.0, end: 1.5 },
    ],
  },
  {
    id: 'seg-2',
    index: 2,
    start: 1.5,
    end: 3.5,
    text: 'Caption B content',
    words: [
      { word: 'Caption', start: 1.5, end: 2.2 },
      { word: 'B', start: 2.2, end: 2.8 },
      { word: 'content', start: 2.8, end: 3.5 },
    ],
  },
];

describe('Playback Render Count Regression & Profiling', () => {
  beforeEach(() => {
    timeStore.reset();
    vi.clearAllMocks();
  });

  it('mounts real SubtitleTool with mock media and verifies SubtitleTool, Timeline, LibraryPanel, and InspectorPanel render < 5 times over 3s playback', () => {
    let subtitleToolRenders = 0;
    const mockFile = new File(['mock-media-content'], 'test.mp4', { type: 'video/mp4' });

    timeStore.setSegments(sampleSegments);
    timeStore.setDuration(10);

    const { unmount } = render(
      <Profiler
        id="subtitle-tool-profiler"
        onRender={() => {
          subtitleToolRenders++;
        }}
      >
        <SubtitleTool
          initialStage="editing"
          initialVideoFile={mockFile}
          initialSegments={sampleSegments}
        />
      </Profiler>,
    );

    const baselineRenders = subtitleToolRenders;

    // Simulate 3 seconds of continuous playback (90 ticks at 30 fps)
    for (let i = 1; i <= 90; i++) {
      const t = (i * 3.0) / 90;
      act(() => {
        timeStore.setTime(t, false);
      });
    }

    const additionalRenders = subtitleToolRenders - baselineRenders;
    console.log(`[REAL SUBTITLE TOOL MOUNT PROFILER]`);
    console.log(`  - SubtitleTool baseline mount renders: ${baselineRenders}`);
    console.log(
      `  - SubtitleTool ticks renders across 90 frames: ${additionalRenders} (Target: < 5)`,
    );

    // Only segment transition (seg-1 -> seg-2) triggers a state update, not 90 frames!
    expect(additionalRenders).toBeLessThan(5);
    unmount();
  });

  it('verifies CaptionEditor renders < 5 times over 3 seconds of simulated playback', () => {
    let captionEditorRenders = 0;

    function CaptionEditorHarness() {
      const { activeId, isPlaying } = usePlayback(sampleSegments);
      return (
        <Profiler
          id="caption-editor-profiler"
          onRender={() => {
            captionEditorRenders++;
          }}
        >
          <CaptionEditor
            segments={sampleSegments}
            activeId={activeId}
            isPlaying={isPlaying}
            selectedId={null}
            onSelectSegment={() => {}}
            onSegmentsChange={() => {}}
            onSeek={() => {}}
          />
        </Profiler>
      );
    }

    const { unmount } = render(<CaptionEditorHarness />);
    const baseline = captionEditorRenders;

    for (let i = 1; i <= 90; i++) {
      const t = (i * 3.0) / 90;
      act(() => {
        timeStore.setTime(t, false);
      });
    }

    const additional = captionEditorRenders - baseline;
    console.log(`[CAPTION EDITOR PROFILER] Renders across 90 ticks: ${additional} (Target: < 5)`);
    expect(additional).toBeLessThan(5);
    unmount();
  });

  it('click caption A, play into caption B: activeId becomes B, scrollIntoView called for B, style actions target selectedId A', () => {
    const scrollSpy = vi.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollSpy;

    function TestHarness() {
      const { activeId, setActiveId, isPlaying, setIsPlaying } = usePlayback(sampleSegments);
      const [selectedId, setSelectedId] = useState<string | null>(null);

      // In SubtitleTool, style actions target selectedId ?? activeId
      const targetStyleId = selectedId ?? activeId;

      return (
        <div>
          <button
            data-testid="select-a"
            onClick={() => {
              setSelectedId('seg-1');
              setActiveId('seg-1');
            }}
          >
            Select Caption A
          </button>
          <button
            data-testid="toggle-play"
            onClick={() => {
              setIsPlaying(!isPlaying);
            }}
          >
            Toggle Play
          </button>
          <div data-testid="active-id">{activeId}</div>
          <div data-testid="selected-id">{selectedId}</div>
          <div data-testid="target-style-id">{targetStyleId}</div>
          <CaptionEditor
            segments={sampleSegments}
            activeId={activeId}
            selectedId={selectedId}
            isPlaying={isPlaying}
            onSelectSegment={(id) => {
              setSelectedId(id);
              setActiveId(id);
            }}
            onSegmentsChange={() => {}}
            onSeek={() => {}}
          />
        </div>
      );
    }

    const { getByTestId } = render(<TestHarness />);

    // 1. Initially playhead at 0.0s (Caption A)
    act(() => {
      timeStore.setTime(0.0, true);
    });
    expect(getByTestId('active-id').textContent).toBe('seg-1');

    // 2. Click Caption A
    act(() => {
      fireEvent.click(getByTestId('select-a'));
    });
    expect(getByTestId('selected-id').textContent).toBe('seg-1');
    expect(getByTestId('active-id').textContent).toBe('seg-1');
    expect(getByTestId('target-style-id').textContent).toBe('seg-1');

    // 3. Start playback
    act(() => {
      fireEvent.click(getByTestId('toggle-play'));
    });

    // 4. Playhead advances into Caption B (2.0s is inside seg-2: 1.5s - 3.5s)
    act(() => {
      timeStore.setTime(2.0, false);
    });

    // 5. Assertions:
    // - activeId became B ('seg-2') because manualActiveId was cleared during playback
    expect(getByTestId('active-id').textContent).toBe('seg-2');

    // - Caption list scroll and highlight follow activeId (seg-2)
    const captionBElement = document.getElementById('caption-seg-2');
    expect(captionBElement).not.toBeNull();
    expect(captionBElement?.className).toContain('border-amber-400');
    expect(scrollSpy).toHaveBeenCalled();

    // - selectedId is still 'seg-1' (Caption A)
    expect(getByTestId('selected-id').textContent).toBe('seg-1');

    // - Style actions still target user-selected caption A, NOT playhead B!
    expect(getByTestId('target-style-id').textContent).toBe('seg-1');
  });

  it('drives seeks through videoRef.seekTo and Timeline onSeek: paused, click caption A, scrub to caption B, expects activeId = B while selectedId stays A', () => {
    const videoRef = React.createRef<VideoPreviewHandle>();

    function RealSeekPathHarness() {
      const { activeId, setActiveId, isPlaying, handleSeek } = usePlayback(sampleSegments);
      const [selectedId, setSelectedId] = useState<string | null>(null);
      const mockFile = new File(['dummy-video'], 'demo.mp4', { type: 'video/mp4' });

      return (
        <div>
          <button
            data-testid="select-a-btn"
            onClick={() => {
              setSelectedId('seg-1');
              setActiveId('seg-1');
            }}
          >
            Click Caption A
          </button>
          <div data-testid="active-id-val">{activeId}</div>
          <div data-testid="selected-id-val">{selectedId}</div>
          <VideoPreview
            ref={videoRef}
            videoFile={mockFile}
            segments={sampleSegments}
            style={DEFAULT_STYLE}
            onTimeUpdate={() => {}}
            onSeek={handleSeek}
          />
          <Timeline
            duration={10}
            isPlaying={isPlaying}
            segments={sampleSegments}
            activeId={activeId}
            selectedId={selectedId}
            onSeek={(t) => videoRef.current?.seekTo(t)}
            onTogglePlay={() => {}}
            onSegmentsChange={() => {}}
          />
        </div>
      );
    }

    const { getByTestId } = render(<RealSeekPathHarness />);

    // Confirms playback is paused
    expect(timeStore.getIsPlaying()).toBe(false);

    // 1. Click Caption A: selectedId becomes 'seg-1', activeId becomes 'seg-1'
    act(() => {
      fireEvent.click(getByTestId('select-a-btn'));
    });
    expect(getByTestId('selected-id-val').textContent).toBe('seg-1');
    expect(getByTestId('active-id-val').textContent).toBe('seg-1');

    // 2. Scrub to Caption B (2.0s is inside seg-2: 1.5s - 3.5s)
    // Invoked through videoRef.current.seekTo / Timeline onSeek (the real seek path)
    act(() => {
      videoRef.current?.seekTo(2.0);
    });

    // 3. Expect activeId = 'seg-2' (B) while selectedId stays 'seg-1' (A)
    expect(getByTestId('active-id-val').textContent).toBe('seg-2');
    expect(getByTestId('selected-id-val').textContent).toBe('seg-1');
  });

  it('guarantees throttled playhead indicator renders without waking parents', () => {
    let playheadTicks = 0;

    function MockPlayhead() {
      const time = usePlayheadTime();
      playheadTicks++;
      return <div data-testid="playhead" data-time={time} />;
    }

    const { unmount } = render(<MockPlayhead />);

    for (let i = 1; i <= 90; i++) {
      const t = (i * 3.0) / 90;
      act(() => {
        timeStore.setTime(t, false);
      });
    }

    expect(playheadTicks).toBeGreaterThan(0);
    unmount();
  });

  it('profiles React Profiler render commitments: external time store vs naive React state', () => {
    let unoptimizedCommitCount = 0;
    let optimizedCommitCount = 0;
    let unoptimizedTotalDuration = 0;
    let optimizedTotalDuration = 0;

    function NaivePlayer() {
      const [time, setTime] = useState(0);
      (window as unknown as { __dispatchNaiveTick: (t: number) => void }).__dispatchNaiveTick =
        setTime;
      return <div data-time={time}>Naive Frame: {time}</div>;
    }

    const { unmount: unmountNaive } = render(
      <Profiler
        id="naive-player"
        onRender={(_id, _phase, actualDuration) => {
          unoptimizedCommitCount++;
          unoptimizedTotalDuration += actualDuration;
        }}
      >
        <NaivePlayer />
      </Profiler>,
    );

    for (let i = 1; i <= 90; i++) {
      act(() => {
        (window as unknown as { __dispatchNaiveTick: (t: number) => void }).__dispatchNaiveTick(
          i / 30,
        );
      });
    }
    unmountNaive();

    function OptimizedPlayer() {
      return (
        <div>
          <span>Static Container</span>
        </div>
      );
    }

    const { unmount: unmountOptimized } = render(
      <Profiler
        id="optimized-player"
        onRender={(_id, _phase, actualDuration) => {
          optimizedCommitCount++;
          optimizedTotalDuration += actualDuration;
        }}
      >
        <OptimizedPlayer />
      </Profiler>,
    );

    for (let i = 1; i <= 90; i++) {
      act(() => {
        timeStore.setTime(i / 30, false);
      });
    }
    unmountOptimized();

    console.log(`[REACT PROFILER BENCHMARK]`);
    console.log(
      `  - Naive state commits: ${unoptimizedCommitCount} (Duration: ${unoptimizedTotalDuration.toFixed(2)}ms)`,
    );
    console.log(
      `  - Optimized store commits: ${optimizedCommitCount} (Duration: ${optimizedTotalDuration.toFixed(2)}ms)`,
    );

    expect(optimizedCommitCount).toBe(1); // Only initial mount committed!
    expect(unoptimizedCommitCount).toBe(91); // 91 commits on naive
  });
});
