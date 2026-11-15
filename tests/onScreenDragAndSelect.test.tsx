// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import React, { createRef } from 'react';
import { render, fireEvent } from '@testing-library/react';
import CaptionCanvas from '../src/subtitle-tool/CaptionCanvas';
import {
  getLowerThirdBounds,
  getDefaultLowerThirdPosition,
  isPointInBounds,
} from '../src/subtitle-tool/engine/lowerThirdBounds';
import type { LowerThirdSpec, Segment, CaptionStyle } from '../src/subtitle-tool/types';
import { DEFAULT_STYLE } from '../src/subtitle-tool/constants';

describe('Lower Third Bounds & Hit Testing', () => {
  const sampleCallout: LowerThirdSpec = {
    id: 'callout-1',
    templateId: 'mogrt-callout-right-box',
    variant: 1,
    name: 'PRODUCT FEATURE',
    role: 'Camera Lens Detail',
    colors: { primary: '#F59E0B', secondary: '#18181B' },
    font: { family: 'Inter', size: 0.038, weight: 700 },
    position: { x: 0.55, y: 0.45, align: 'center' },
    scale: 1.0,
    start: 0,
    end: 4.5,
  };

  it('calculates default position for templates', () => {
    expect(getDefaultLowerThirdPosition(sampleCallout)).toEqual({ x: 0.55, y: 0.45 });
    expect(
      getDefaultLowerThirdPosition({
        ...sampleCallout,
        templateId: 'mogrt-youtube-subscribe',
      }),
    ).toEqual({ x: 0.5, y: 0.82 });
    expect(
      getDefaultLowerThirdPosition({
        ...sampleCallout,
        templateId: 'social-handle-instagram',
      }),
    ).toEqual({ x: 0.5, y: 0.84 });
    expect(
      getDefaultLowerThirdPosition({
        ...sampleCallout,
        templateId: 'mogrt-spin-twist',
      }),
    ).toEqual({ x: 0.5, y: 0.5 });
  });

  it('computes accurate bounds at active timestamp', () => {
    const bounds = getLowerThirdBounds(sampleCallout, 1080, 1920, 2.0);
    expect(bounds).not.toBeNull();
    if (bounds) {
      expect(bounds.w).toBeGreaterThan(100);
      expect(bounds.h).toBeGreaterThan(50);
      expect(bounds.cx).toBeCloseTo(0.55 * 1080);
      expect(bounds.cy).toBeCloseTo(0.45 * 1920);
    }
  });

  it('returns null if timestamp is outside interval', () => {
    const beforeStart = getLowerThirdBounds(sampleCallout, 1080, 1920, -1.0);
    const afterEnd = getLowerThirdBounds(sampleCallout, 1080, 1920, 5.0);
    expect(beforeStart).toBeNull();
    expect(afterEnd).toBeNull();
  });

  it('tests points inside and outside bounds accurately', () => {
    const bounds = { x: 100, y: 200, w: 300, h: 150 };
    expect(isPointInBounds({ x: 200, y: 250 }, bounds)).toBe(true);
    expect(isPointInBounds({ x: 50, y: 250 }, bounds)).toBe(false);
    expect(isPointInBounds({ x: 200, y: 400 }, bounds)).toBe(false);
    expect(isPointInBounds({ x: 90, y: 250 }, bounds, 20)).toBe(true); // with padding
  });
});

describe('CaptionCanvas on-screen selection and dragging', () => {
  const dummySegments: Segment[] = [
    {
      id: 'seg-1',
      start: 0,
      end: 5,
      text: 'Testing on-screen caption selection',
      words: [{ word: 'Testing', start: 0, end: 1, confidence: 0.99 }],
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

  it('renders canvas and listens to pointer events on host', () => {
    const videoEl = document.createElement('video');
    Object.defineProperty(videoEl, 'currentTime', { value: 2, writable: true });
    Object.defineProperty(videoEl, 'videoWidth', { value: 1080, writable: true });
    Object.defineProperty(videoEl, 'videoHeight', { value: 1920, writable: true });
    const videoRef = { current: videoEl };
    const hostRef = { current: document.createElement('div') };

    const onSelectLt = vi.fn();
    const onUpdateLt = vi.fn();

    const { container } = render(
      <CaptionCanvas
        segments={dummySegments}
        style={style}
        lowerThirds={[dummyLowerThird]}
        videoRef={videoRef}
        hostRef={hostRef}
        selectedLowerThirdId={null}
        onSelectLowerThird={onSelectLt}
        onUpdateLowerThird={onUpdateLt}
      />,
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('selects lower third when pointer down hits its bounds', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);

    // Mock bounding client rects
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
    Object.defineProperty(videoEl, 'currentTime', { value: 2, writable: true });
    Object.defineProperty(videoEl, 'videoWidth', { value: 500, writable: true });
    Object.defineProperty(videoEl, 'videoHeight', { value: 1000, writable: true });
    videoEl.pause = vi.fn();
    const videoRef = { current: videoEl };
    const hostRef = { current: host };
    const onSelectLt = vi.fn();
    const onUpdateLt = vi.fn();

    const { container } = render(
      <CaptionCanvas
        segments={dummySegments}
        style={style}
        lowerThirds={[dummyLowerThird]}
        videoRef={videoRef}
        hostRef={hostRef}
        selectedLowerThirdId={null}
        onSelectLowerThird={onSelectLt}
        onUpdateLowerThird={onUpdateLt}
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

    // Center click at (250, 500) which corresponds to (0.5, 0.5)
    fireEvent.pointerDown(host, {
      button: 0,
      clientX: 250,
      clientY: 500,
      pointerId: 1,
    });

    expect(onSelectLt).toHaveBeenCalledWith('lt-1');

    // Pointer move to drag
    fireEvent.pointerMove(host, {
      clientX: 300, // dragged right by 50px (50 / 500 = +0.1)
      clientY: 600, // dragged down by 100px (100 / 1000 = +0.1)
      pointerId: 1,
    });

    // Pointer up commits the update
    fireEvent.pointerUp(host, {
      pointerId: 1,
    });

    expect(onUpdateLt).toHaveBeenCalled();
    const updated = onUpdateLt.mock.calls[0][0];
    expect(updated.id).toBe('lt-1');
    expect(updated.position.x).toBeCloseTo(0.6, 1);
    expect(updated.position.y).toBeCloseTo(0.6, 1);
    expect(updated.position.align).toBe('center');

    document.body.removeChild(host);
  });

  it('selects lower third on click without triggering update if not dragged', () => {
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
    Object.defineProperty(videoEl, 'currentTime', { value: 2, writable: true });
    Object.defineProperty(videoEl, 'videoWidth', { value: 500, writable: true });
    Object.defineProperty(videoEl, 'videoHeight', { value: 1000, writable: true });
    videoEl.pause = vi.fn();
    const videoRef = { current: videoEl };
    const hostRef = { current: host };
    const onSelectLt = vi.fn();
    const onUpdateLt = vi.fn();

    const { container } = render(
      <CaptionCanvas
        segments={dummySegments}
        style={style}
        lowerThirds={[dummyLowerThird]}
        videoRef={videoRef}
        hostRef={hostRef}
        selectedLowerThirdId={null}
        onSelectLowerThird={onSelectLt}
        onUpdateLowerThird={onUpdateLt}
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

    // Pointer down and immediate up (click)
    fireEvent.pointerDown(host, {
      button: 0,
      clientX: 250,
      clientY: 500,
      pointerId: 1,
    });

    expect(onSelectLt).toHaveBeenCalledWith('lt-1');

    fireEvent.pointerUp(host, {
      pointerId: 1,
    });

    // onUpdateLt should NOT be called since no drag occurred
    expect(onUpdateLt).not.toHaveBeenCalled();

    document.body.removeChild(host);
  });
});
