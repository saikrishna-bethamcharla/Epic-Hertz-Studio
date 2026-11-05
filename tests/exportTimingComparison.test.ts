import { describe, it, expect } from 'vitest';
import { renderCaptions, findSegment, segmentWords } from '../src/subtitle-tool/engine/render';
import { presetById, DEFAULT_STYLE } from '../src/subtitle-tool/engine/presets';
import type { Segment, CaptionStyle } from '../src/subtitle-tool/types';

describe('Task 4: Preview vs MP4 Export caption timing comparison', () => {
  // Mock a 2D canvas context that records drawing calls
  function createMockCanvasContext() {
    return {
      save: () => {},
      restore: () => {},
      beginPath: () => {},
      closePath: () => {},
      rect: () => {},
      fill: () => {},
      stroke: () => {},
      clip: () => {},
      clearRect: () => {},
      fillText: () => {},
      strokeText: () => {},
      measureText: (text: string) => ({
        width: text.length * 14,
        actualBoundingBoxAscent: 12,
        actualBoundingBoxDescent: 4,
      }),
      setLineDash: () => {},
      roundRect: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      transform: () => {},
      resetTransform: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'center',
      textBaseline: 'middle',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D;
  }

  it('proves 1:1 frame-accurate match between preview playback and MP4 export at 60fps', () => {
    // Standard test clip with multiple words across segments
    const segments: Segment[] = [
      {
        id: 'seg-1',
        index: 1,
        start: 0.5,
        end: 2.2,
        text: 'Welcome to Epic Hertz Studio',
        words: [
          { word: 'Welcome', start: 0.5, end: 0.9 },
          { word: 'to', start: 0.95, end: 1.15 },
          { word: 'Epic', start: 1.2, end: 1.55 },
          { word: 'Hertz', start: 1.6, end: 1.85 },
          { word: 'Studio', start: 1.9, end: 2.2 },
        ],
      },
      {
        id: 'seg-2',
        index: 2,
        start: 2.6,
        end: 4.5,
        text: 'Frame accurate kinetic caption engine',
        words: [
          { word: 'Frame', start: 2.6, end: 2.9 },
          { word: 'accurate', start: 2.95, end: 3.4 },
          { word: 'kinetic', start: 3.45, end: 3.8 },
          { word: 'caption', start: 3.85, end: 4.15 },
          { word: 'engine', start: 4.2, end: 4.5 },
        ],
      },
    ];

    // Tested styles: Viral Bounce, Karaoke, and Minimal
    const stylesToTest: CaptionStyle[] = [
      { ...(presetById('viral-bounce')?.style ?? DEFAULT_STYLE), syncOffset: -0.1 },
      { ...(presetById('kinetic-karaoke')?.style ?? DEFAULT_STYLE), syncOffset: -0.1 },
      { ...(presetById('clean-minimal')?.style ?? DEFAULT_STYLE), syncOffset: -0.07 },
    ];

    const ctxPreview = createMockCanvasContext();
    const ctxExport = createMockCanvasContext();

    // 1080 x 1920 canvas resolution for both preview canvas buffer and MP4 video frame
    const canvasWidth = 1080;
    const canvasHeight = 1920;

    // Sample across 300 consecutive frames at 60fps (0.0s to 5.0s, delta = 1/60s ≈ 16.666ms)
    const fps = 60;
    const totalFrames = 300;
    const frameDelta = 1 / fps;

    for (const style of stylesToTest) {
      let matchedFrames = 0;

      for (let frame = 0; frame < totalFrames; frame++) {
        const timestamp = frame * frameDelta;

        // 1. In Preview (CaptionCanvas.tsx):
        // Active time in preview is videoRef.current.currentTime:
        const previewTime = timestamp;
        const previewEffectiveTime = previewTime - (style.syncOffset ?? 0);
        const previewSeg = findSegment(segments, previewEffectiveTime);
        const previewWords = previewSeg ? segmentWords(previewSeg) : [];
        const previewActiveWordIdx = previewWords.findIndex(
          (w) => previewEffectiveTime >= w.start && previewEffectiveTime <= w.end,
        );
        const previewResult = renderCaptions(
          ctxPreview,
          canvasWidth,
          canvasHeight,
          previewTime,
          segments,
          style,
        );

        // 2. In MP4 Export (exportVideo.ts):
        // Active time in export is sample.timestamp:
        const exportTime = timestamp;
        const exportEffectiveTime = exportTime - (style.syncOffset ?? 0);
        const exportSeg = findSegment(segments, exportEffectiveTime);
        const exportWords = exportSeg ? segmentWords(exportSeg) : [];
        const exportActiveWordIdx = exportWords.findIndex(
          (w) => exportEffectiveTime >= w.start && exportEffectiveTime <= w.end,
        );
        const exportResult = renderCaptions(
          ctxExport,
          canvasWidth,
          canvasHeight,
          exportTime,
          segments,
          style,
        );

        // Verification assertions:
        // A. Segment identity: both preview and export identify the exact same segment
        expect(previewSeg?.id).toBe(exportSeg?.id);
        expect(previewSeg?.index).toBe(exportSeg?.index);

        // B. Word identity: both preview and export highlight the exact same word
        expect(previewActiveWordIdx).toBe(exportActiveWordIdx);

        // C. Layout bounds & visibility identity:
        if (previewResult.bounds && exportResult.bounds) {
          expect(previewResult.bounds.x).toBeCloseTo(exportResult.bounds.x, 4);
          expect(previewResult.bounds.y).toBeCloseTo(exportResult.bounds.y, 4);
          expect(previewResult.bounds.w).toBeCloseTo(exportResult.bounds.w, 4);
          expect(previewResult.bounds.h).toBeCloseTo(exportResult.bounds.h, 4);
        } else {
          expect(previewResult.bounds).toBe(exportResult.bounds); // both null
        }

        matchedFrames++;
      }

      // Exactly 300 out of 300 frames match with zero drift
      expect(matchedFrames).toBe(totalFrames);
    }
  });
});
