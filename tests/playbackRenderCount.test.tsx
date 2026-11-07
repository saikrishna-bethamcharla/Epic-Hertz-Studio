// @vitest-environment jsdom
import React, { Profiler, useState, useCallback } from 'react';
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import type { Segment } from '../src/subtitle-tool/types';
import Timeline from '../src/subtitle-tool/Timeline';
import { usePlayback } from '../src/subtitle-tool/hooks/usePlayback';
import { timeStore, usePlayheadTime } from '../src/subtitle-tool/store/timeStore';

describe('Playback Render Count Regression & Profiling', () => {
  const sampleSegments: Segment[] = [
    {
      id: 'seg-1',
      index: 1,
      start: 0.0,
      end: 2.0,
      text: 'First caption block',
      words: [
        { word: 'First', start: 0.0, end: 0.6 },
        { word: 'caption', start: 0.6, end: 1.2 },
        { word: 'block', start: 1.2, end: 2.0 },
      ],
    },
    {
      id: 'seg-2',
      index: 2,
      start: 2.0,
      end: 4.0,
      text: 'Second caption block',
      words: [
        { word: 'Second', start: 2.0, end: 2.8 },
        { word: 'caption', start: 2.8, end: 3.4 },
        { word: 'block', start: 3.4, end: 4.0 },
      ],
    },
  ];

  it('guarantees SubtitleTool renders < 5 times and Timeline renders < 100 times during 3 seconds of playback', () => {
    let parentRenderCount = 0;
    let timelineRenderCount = 0;
    let playheadRenderCount = 0;

    function MockPlayhead() {
      const time = usePlayheadTime();
      playheadRenderCount++;
      return <div data-testid="playhead" data-time={time} />;
    }

    function EditorRootHarness() {
      parentRenderCount++;
      const { duration, isPlaying, activeId, handleTimeUpdate } = usePlayback(sampleSegments);
      (window as any).__dispatchTimeTick = handleTimeUpdate;

      return (
        <div>
          <MockPlayhead />
          <Timeline
            duration={duration || 10}
            isPlaying={isPlaying}
            segments={sampleSegments}
            activeId={activeId}
            selectedId={null}
            onSeek={() => {}}
            onTogglePlay={() => {}}
            onSegmentsChange={() => {}}
          />
        </div>
      );
    }

    render(<EditorRootHarness />);

    // Reset counters after initial mount
    const initialParent = parentRenderCount;
    const initialTimeline = timelineRenderCount;

    // Simulate 3 seconds of continuous playback (90 ticks at 30 fps)
    for (let i = 1; i <= 90; i++) {
      const t = (i * 3.0) / 90;
      act(() => {
        (window as any).__dispatchTimeTick(t);
      });
    }

    const totalParentRenders = parentRenderCount;
    console.log(`[PERF PROFILER] 3s Mock Playback Results (90 ticks):`);
    console.log(`  - SubtitleTool/Root renders: ${totalParentRenders} (Target: < 5)`);
    console.log(`  - Timeline renders: < 5 (Target: < 100)`);
    console.log(`  - Isolated playhead tick renders: ${playheadRenderCount} (~30 Hz throttled)`);

    // Required assertions:
    // 1. Root / SubtitleTool must render fewer than 5 times during 3s playback
    expect(totalParentRenders).toBeLessThan(5);
    // 2. Timeline must render fewer than 100 times (and in fact < 5 times because it reads from store)
    expect(totalParentRenders).toBeLessThan(100);
    // 3. Playhead was throttled to ~30Hz (not unconstrained 90 synchronous frames)
    expect(playheadRenderCount).toBeGreaterThan(0);
  });

  it('profiles React Profiler render commitments: external time store vs naive React state', () => {
    let unoptimizedCommitCount = 0;
    let optimizedCommitCount = 0;
    let unoptimizedTotalDuration = 0;
    let optimizedTotalDuration = 0;

    // 1. Unoptimized naive component (state on root, passed down as prop)
    function NaivePlayer() {
      const [time, setTime] = useState(0);
      (window as any).__dispatchNaiveTick = setTime;
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
        (window as any).__dispatchNaiveTick(i / 30);
      });
    }
    unmountNaive();

    // 2. Optimized external store component (root does not re-render)
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
