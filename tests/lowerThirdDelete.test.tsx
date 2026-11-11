// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import 'fake-indexeddb/auto';

beforeAll(() => {
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
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        scale: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        drawImage: vi.fn(),
        clip: vi.fn(),
      }) as any,
  );
});

import TimelineToolbar from '../src/subtitle-tool/editor/TimelineToolbar';
import Timeline from '../src/subtitle-tool/Timeline';
import LowerThirdInspector from '../src/subtitle-tool/v2/inspector/LowerThirdInspector';
import { DEFAULT_LOWER_THIRD } from '../src/subtitle-tool/engine/spec';
import type { LowerThirdSpec } from '../src/subtitle-tool/engine/spec';
import type { Segment } from '../src/subtitle-tool/types';

describe('Lower Third Deletion Verification Suite', () => {
  describe('TimelineToolbar Delete Button State', () => {
    it('disables delete button when neither caption segment nor lower third is selected', () => {
      render(
        <TimelineToolbar
          currentTime={0}
          totalDuration={10}
          isPlaying={false}
          onTogglePlay={vi.fn()}
          currentSeg={null}
          activeLowerThirdId={null}
          onAddText={vi.fn()}
          onSplit={vi.fn()}
          onMerge={vi.fn()}
          onDelete={vi.fn()}
          isSnappingEnabled={true}
          onToggleSnapping={vi.fn()}
          isRippleEnabled={false}
          onToggleRipple={vi.fn()}
          onUndo={vi.fn()}
          onRedo={vi.fn()}
          isUndoDisabled={true}
          isRedoDisabled={true}
          onBulkReplace={vi.fn()}
          zoom={90}
          onZoomChange={vi.fn()}
        />,
      );

      const deleteBtn = screen.getByRole('button', { name: /delete active caption/i });
      expect((deleteBtn as HTMLButtonElement).disabled).toBe(true);
    });

    it('enables delete button when a lower third is active even if no caption segment is selected', () => {
      const onDelete = vi.fn();
      render(
        <TimelineToolbar
          currentTime={0}
          totalDuration={10}
          isPlaying={false}
          onTogglePlay={vi.fn()}
          currentSeg={null}
          activeLowerThirdId="lt-test-123"
          onAddText={vi.fn()}
          onSplit={vi.fn()}
          onMerge={vi.fn()}
          onDelete={onDelete}
          isSnappingEnabled={true}
          onToggleSnapping={vi.fn()}
          isRippleEnabled={false}
          onToggleRipple={vi.fn()}
          onUndo={vi.fn()}
          onRedo={vi.fn()}
          isUndoDisabled={true}
          isRedoDisabled={true}
          onBulkReplace={vi.fn()}
          zoom={90}
          onZoomChange={vi.fn()}
        />,
      );

      const deleteBtn = screen.getByRole('button', { name: /delete active lower third/i });
      expect((deleteBtn as HTMLButtonElement).disabled).toBe(false);

      fireEvent.click(deleteBtn);
      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timeline Integration with Lower Third Deletion', () => {
    const mockLowerThird: LowerThirdSpec = {
      ...DEFAULT_LOWER_THIRD,
      id: 'lt-active-1',
      name: 'Ravi Teja',
      role: 'Creative Director',
      start: 0.5,
      end: 4.5,
    };

    it('deletes active lower third via timeline toolbar and calls onDeleteLowerThird', () => {
      const onDeleteLt = vi.fn();
      const onSelectLt = vi.fn();

      render(
        <Timeline
          duration={10}
          currentTime={0}
          isPlaying={false}
          segments={[]}
          activeId={null}
          selectedId={null}
          lowerThirds={[mockLowerThird]}
          activeLowerThirdId="lt-active-1"
          onLowerThirdsChange={vi.fn()}
          onSelectLowerThird={onSelectLt}
          onDeleteLowerThird={onDeleteLt}
          onSeek={vi.fn()}
          onTogglePlay={vi.fn()}
          onSegmentsChange={vi.fn()}
        />,
      );

      const deleteBtn = screen.getByRole('button', { name: /delete active lower third/i });
      expect((deleteBtn as HTMLButtonElement).disabled).toBe(false);

      fireEvent.click(deleteBtn);
      expect(onDeleteLt).toHaveBeenCalledWith('lt-active-1');
    });

    it('falls back to onLowerThirdsChange and deselects if onDeleteLowerThird is not provided', () => {
      const onLtChange = vi.fn();
      const onSelectLt = vi.fn();

      render(
        <Timeline
          duration={10}
          currentTime={0}
          isPlaying={false}
          segments={[]}
          activeId={null}
          selectedId={null}
          lowerThirds={[mockLowerThird]}
          activeLowerThirdId="lt-active-1"
          onLowerThirdsChange={onLtChange}
          onSelectLowerThird={onSelectLt}
          onSeek={vi.fn()}
          onTogglePlay={vi.fn()}
          onSegmentsChange={vi.fn()}
        />,
      );

      const deleteBtn = screen.getByRole('button', { name: /delete active lower third/i });
      fireEvent.click(deleteBtn);

      expect(onLtChange).toHaveBeenCalledWith([]);
      expect(onSelectLt).toHaveBeenCalledWith(null);
    });

    it('shows clip on-element delete button when active and triggers deletion', () => {
      const onDeleteLt = vi.fn();

      render(
        <Timeline
          duration={10}
          currentTime={0}
          isPlaying={false}
          segments={[]}
          activeId={null}
          selectedId={null}
          lowerThirds={[mockLowerThird]}
          activeLowerThirdId="lt-active-1"
          onLowerThirdsChange={vi.fn()}
          onSelectLowerThird={vi.fn()}
          onDeleteLowerThird={onDeleteLt}
          onSeek={vi.fn()}
          onTogglePlay={vi.fn()}
          onSegmentsChange={vi.fn()}
        />,
      );

      const clipDeleteBtn = screen.getByRole('button', {
        name: /delete lower third ravi teja/i,
      });
      expect(clipDeleteBtn).toBeDefined();

      fireEvent.click(clipDeleteBtn);
      expect(onDeleteLt).toHaveBeenCalledWith('lt-active-1');
    });
  });

  describe('LowerThirdInspector Delete Buttons', () => {
    it('provides both header delete button and full-width danger delete button', () => {
      const onDelete = vi.fn();
      const testSpec: LowerThirdSpec = {
        ...DEFAULT_LOWER_THIRD,
        id: 'lt-spec-delete-test',
        name: 'Ravi Teja',
      };

      render(<LowerThirdInspector spec={testSpec} onChange={vi.fn()} onDelete={onDelete} />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete (this )?lower third/i });
      expect(deleteButtons.length).toBeGreaterThanOrEqual(2);

      // Click the header delete button
      fireEvent.click(deleteButtons[0]);
      expect(onDelete).toHaveBeenCalledWith('lt-spec-delete-test');

      // Click the full-width bottom delete button
      fireEvent.click(deleteButtons[1]);
      expect(onDelete).toHaveBeenCalledTimes(2);
    });
  });
});
