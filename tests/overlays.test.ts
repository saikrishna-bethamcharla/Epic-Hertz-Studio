import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderOverlays, DEFAULT_OVERLAYS_CONFIG, type VideoOverlaysConfig } from '../src/subtitle-tool/engine/overlays';

describe('Video Overlays Engine (Progress Bar, Headline Banner, Audio Visualizer)', () => {
  let mockCtx: any;

  beforeEach(() => {
    mockCtx = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      roundRect: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      measureText: vi.fn().mockReturnValue({ width: 120 }),
      fillStyle: '',
      strokeStyle: '',
      shadowColor: '',
      shadowBlur: 0,
      font: '',
      textAlign: '',
      textBaseline: '',
    };
  });

  it('renders progress bar proportionally when enabled', () => {
    const config: VideoOverlaysConfig = {
      progressBar: {
        enabled: true,
        position: 'bottom',
        height: 10,
        color: '#f59e0b',
        glow: true,
      },
    };

    // Render at 50% time (t=15, duration=30)
    renderOverlays(mockCtx, 1080, 1920, 15, 30, config);

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fillRect).toHaveBeenCalled();
    // Verify fill width was approximately half of frame width (540px)
    const fillCalls = mockCtx.fillRect.mock.calls;
    const progressFill = fillCalls.find((call: any[]) => Math.abs(call[2] - 540) < 5);
    expect(progressFill).toBeDefined();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('renders sticky headline banner at specified top position', () => {
    const config: VideoOverlaysConfig = {
      headlineBanner: {
        enabled: true,
        text: '3 MISTAKES TO AVOID',
        positionY: 0.08,
      },
    };

    renderOverlays(mockCtx, 1080, 1920, 5, 30, config);

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.fillText).toHaveBeenCalledWith(
      '3 MISTAKES TO AVOID',
      expect.any(Number),
      expect.any(Number),
    );
    expect(mockCtx.roundRect).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('renders audio visualizer bars reacting to dialogue', () => {
    const config: VideoOverlaysConfig = {
      audioVisualizer: {
        enabled: true,
        positionY: 0.88,
        color: '#00e5d4',
        barCount: 16,
      },
    };

    renderOverlays(mockCtx, 1080, 1920, 2.5, 30, config, [{ start: 2.0, end: 4.0 }]);

    expect(mockCtx.save).toHaveBeenCalled();
    expect(mockCtx.roundRect).toHaveBeenCalled();
    expect(mockCtx.fill).toHaveBeenCalled();
    expect(mockCtx.restore).toHaveBeenCalled();
  });

  it('does nothing when all overlays are disabled', () => {
    renderOverlays(mockCtx, 1080, 1920, 10, 30, DEFAULT_OVERLAYS_CONFIG);
    expect(mockCtx.save).not.toHaveBeenCalled();
    expect(mockCtx.fillRect).not.toHaveBeenCalled();
    expect(mockCtx.fillText).not.toHaveBeenCalled();
  });
});
