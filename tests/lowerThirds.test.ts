import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';
import {
  easeOutExpo,
  easeOutCubic,
  clamp01,
  getLowerThirdPhase,
  fitFontSize,
  draw,
  renderLowerThirds,
} from '../src/subtitle-tool/engine/lowerThirds';
import {
  DEFAULT_LOWER_THIRD,
  type LowerThirdSpec,
  type LowerThirdVariant,
} from '../src/subtitle-tool/engine/spec';
import {
  migrateProjectRecord,
  savePhotoBlob,
  getPhotoBlob,
  deletePhotoBlob,
  closeDB,
  DB_NAME,
} from '../src/subtitle-tool/utils/projectStorage';

describe('Lower Thirds: Timing, Easing & Phase Transitions', () => {
  it('verifies mathematical properties of easing curves', () => {
    // easeOutExpo endpoints
    expect(easeOutExpo(0)).toBe(0);
    expect(easeOutExpo(1)).toBe(1);

    // easeOutCubic endpoints
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);

    // Monotonic increase
    expect(easeOutExpo(0.2)).toBeLessThan(easeOutExpo(0.6));
    expect(easeOutCubic(0.2)).toBeLessThan(easeOutCubic(0.6));

    // Clamp helper
    expect(clamp01(-0.2)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1.5)).toBe(1);
  });

  it('calculates deterministic animation phases: before, intro, hold, outro, and after', () => {
    const spec: LowerThirdSpec = {
      ...DEFAULT_LOWER_THIRD,
      start: 2.0,
      end: 6.0,
      introDuration: 0.7,
      outroDuration: 0.6,
    };

    // Before start (t < 2.0)
    const before = getLowerThirdPhase(spec, 1.5);
    expect(before.active).toBe(false);
    expect(before.phase).toBe('inactive');
    expect(before.progress).toBe(0);
    expect(before.shapeProgress).toBe(0);
    expect(before.textProgress).toBe(0);

    // At exact start (t = 2.0)
    const atStart = getLowerThirdPhase(spec, 2.0);
    expect(atStart.active).toBe(true);
    expect(atStart.phase).toBe('intro');
    expect(atStart.progress).toBe(0);
    expect(atStart.shapeProgress).toBe(0);
    expect(atStart.textProgress).toBe(0);

    // Mid-intro (t = 2.35): shape wipe leads text reveal
    const midIntro = getLowerThirdPhase(spec, 2.35);
    expect(midIntro.active).toBe(true);
    expect(midIntro.phase).toBe('intro');
    expect(midIntro.shapeProgress).toBeGreaterThan(0);
    expect(midIntro.shapeProgress).toBeGreaterThanOrEqual(midIntro.textProgress);

    // Intro finished, entered hold (t = 2.7)
    const introDone = getLowerThirdPhase(spec, 2.7);
    expect(introDone.active).toBe(true);
    expect(introDone.phase).toBe('hold');
    expect(introDone.shapeProgress).toBe(1);
    expect(introDone.textProgress).toBe(1);
    expect(introDone.progress).toBe(1);

    // Mid-hold (t = 4.0)
    const midHold = getLowerThirdPhase(spec, 4.0);
    expect(midHold.active).toBe(true);
    expect(midHold.phase).toBe('hold');
    expect(midHold.shapeProgress).toBe(1);
    expect(midHold.textProgress).toBe(1);
    expect(midHold.progress).toBe(1);

    // Outro start (t = 5.4 = 6.0 - 0.6)
    const outroStart = getLowerThirdPhase(spec, 5.4);
    expect(outroStart.active).toBe(true);
    expect(outroStart.phase).toBe('outro');
    expect(outroStart.progress).toBeCloseTo(0, 1);

    // Mid-outro (t = 5.7)
    const midOutro = getLowerThirdPhase(spec, 5.7);
    expect(midOutro.active).toBe(true);
    expect(midOutro.phase).toBe('outro');
    expect(midOutro.textProgress).toBeLessThan(1);
    expect(midOutro.shapeProgress).toBeLessThan(1);

    // After end (t = 6.5)
    const after = getLowerThirdPhase(spec, 6.5);
    expect(after.active).toBe(false);
    expect(after.phase).toBe('inactive');
    expect(after.progress).toBe(0);
  });

  it('supports custom intro and outro durations', () => {
    const customSpec: LowerThirdSpec = {
      ...DEFAULT_LOWER_THIRD,
      start: 1.0,
      end: 5.0,
      introDuration: 1.2,
      outroDuration: 0.8,
    };

    // At t = 2.0 (1.0s into 1.2s intro), it should still be in intro
    const introCheck = getLowerThirdPhase(customSpec, 2.0);
    expect(introCheck.phase).toBe('intro');

    // At t = 2.3 (past 1.2s intro), it should be in hold
    const holdCheck = getLowerThirdPhase(customSpec, 2.3);
    expect(holdCheck.phase).toBe('hold');

    // Outro starts at 5.0 - 0.8 = 4.2. At 4.4 it should be in outro
    const outroCheck = getLowerThirdPhase(customSpec, 4.4);
    expect(outroCheck.phase).toBe('outro');
  });

  it('gracefully handles ultra-short clips where total duration < intro + outro', () => {
    const tinySpec: LowerThirdSpec = {
      ...DEFAULT_LOWER_THIRD,
      start: 0,
      end: 0.5,
      introDuration: 0.7,
      outroDuration: 0.6,
    };

    // Should not throw and progress remains within 0..1
    const p1 = getLowerThirdPhase(tinySpec, 0.1);
    expect(p1.progress).toBeGreaterThanOrEqual(0);
    expect(p1.progress).toBeLessThanOrEqual(1);

    const p2 = getLowerThirdPhase(tinySpec, 0.4);
    expect(p2.progress).toBeGreaterThanOrEqual(0);
    expect(p2.progress).toBeLessThanOrEqual(1);
  });
});

describe('Lower Thirds: Multilingual Text Fitting & Font Scaling', () => {
  function createMeasuringContext() {
    return {
      save: () => {},
      restore: () => {},
      font: '',
      measureText: (text: string) => {
        // Approximate character width per script: Indic conjuncts are typically wider
        const pxPerChar = /[\u0C00-\u0C7F\u0900-\u097F]/.test(text) ? 18 : 12;
        return {
          width: text.length * pxPerChar,
          actualBoundingBoxAscent: 14,
          actualBoundingBoxDescent: 4,
        };
      },
    } as unknown as CanvasRenderingContext2D;
  }

  it('fits long Telugu names within max width without clipping', () => {
    const ctx = createMeasuringContext();
    const teluguName = 'శ్రీ వేంకటేశ్వర సిద్ధాంతి గారు';
    const maxWidth = 200;
    const baseSize = 48;

    const fittedSize = fitFontSize(ctx, teluguName, maxWidth, baseSize, 'Unbounded', 800, 0.3);
    expect(fittedSize).toBeLessThan(baseSize);
    expect(fittedSize).toBeGreaterThanOrEqual(baseSize * 0.3);

    // Verify fitted width is <= maxWidth
    const fittedWidth = (teluguName.length * 18 * fittedSize) / baseSize;
    expect(fittedWidth).toBeLessThanOrEqual(maxWidth + 5);
  });

  it('fits long Hindi names within max width without clipping', () => {
    const ctx = createMeasuringContext();
    const hindiName = 'पंडित जवाहरलाल नेहरू विश्वविद्यालय';
    const maxWidth = 220;
    const baseSize = 44;

    const fittedSize = fitFontSize(ctx, hindiName, maxWidth, baseSize, 'Albert Sans', 700, 0.4);
    expect(fittedSize).toBeLessThan(baseSize);
    expect(fittedSize).toBeGreaterThanOrEqual(baseSize * 0.4);
  });

  it('retains base font size when text easily fits within boundary', () => {
    const ctx = createMeasuringContext();
    const shortName = 'Alex Roy';
    const maxWidth = 400;
    const baseSize = 28;

    const fittedSize = fitFontSize(ctx, shortName, maxWidth, baseSize, 'Albert Sans', 600, 0.55);
    expect(fittedSize).toBe(baseSize);
  });
});

describe('Lower Thirds: Schema Migration & Backward Compatibility', () => {
  it('migrates legacy v1/v2 project records to v3 with lowerThirds array', () => {
    const legacyProject = {
      id: 'legacy-1',
      name: 'Legacy Reel',
      videoName: 'test.mp4',
      videoType: 'video/mp4',
      segmentCount: 1,
      segments: [{ id: 's1', index: 1, start: 0, end: 2, text: 'Hello world' }],
      style: { name: 'Simple' },
      spokenLanguage: 'en',
      scriptOutput: 'native',
      aspectRatio: '9:16',
      schemaVersion: 2,
      updatedAt: 1000,
    };

    const migrated = migrateProjectRecord(legacyProject);
    expect(migrated.schemaVersion).toBe(3);
    expect(Array.isArray(migrated.lowerThirds)).toBe(true);
    expect(migrated.lowerThirds).toHaveLength(0);
    expect(migrated.name).toBe('Legacy Reel');
  });

  it('preserves existing lowerThirds on already-v3 projects', () => {
    const v3Project = {
      id: 'v3-1',
      name: 'V3 Project',
      videoName: 'video.mp4',
      videoType: 'video/mp4',
      segmentCount: 0,
      segments: [],
      style: { name: 'Simple' },
      spokenLanguage: 'te',
      scriptOutput: 'romanized',
      aspectRatio: '9:16',
      schemaVersion: 3,
      lowerThirds: [
        {
          ...DEFAULT_LOWER_THIRD,
          id: 'lt-existing',
          name: 'Pavan Kalyan',
          role: 'Producer',
        },
      ],
      updatedAt: 2000,
    };

    const result = migrateProjectRecord(v3Project);
    expect(result.schemaVersion).toBe(3);
    expect(result.lowerThirds).toHaveLength(1);
    expect(result.lowerThirds[0].name).toBe('Pavan Kalyan');
  });
});

describe('Lower Thirds: Photo Storage in IndexedDB', () => {
  beforeEach(async () => {
    closeDB();
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  });

  afterEach(() => {
    closeDB();
  });

  it('saves, retrieves, and deletes photo blobs for lower thirds', async () => {
    const testBlob = new Blob(['photo-binary-data'], { type: 'image/png' });
    const photoId = 'photo_test_123';

    await savePhotoBlob(photoId, testBlob);
    const retrieved = await getPhotoBlob(photoId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.size).toBe(testBlob.size);

    await deletePhotoBlob(photoId);
    const afterDelete = await getPhotoBlob(photoId);
    expect(afterDelete).toBeNull();
  });
});

describe('Lower Thirds: Canvas 2D Engine - All 8 Design Variants', () => {
  function createRecordingMockContext() {
    const calls: string[] = [];
    return {
      calls,
      save: () => calls.push('save'),
      restore: () => calls.push('restore'),
      beginPath: () => calls.push('beginPath'),
      closePath: () => calls.push('closePath'),
      moveTo: () => calls.push('moveTo'),
      lineTo: () => calls.push('lineTo'),
      rect: () => calls.push('rect'),
      fillRect: () => calls.push('fillRect'),
      strokeRect: () => calls.push('strokeRect'),
      roundRect: () => calls.push('roundRect'),
      arc: () => calls.push('arc'),
      fill: () => calls.push('fill'),
      stroke: () => calls.push('stroke'),
      clip: () => calls.push('clip'),
      clearRect: () => calls.push('clearRect'),
      fillText: (text: string) => calls.push(`fillText:${text}`),
      strokeText: () => calls.push('strokeText'),
      measureText: (text: string) => ({
        width: text.length * 10,
        actualBoundingBoxAscent: 12,
        actualBoundingBoxDescent: 4,
      }),
      setLineDash: () => calls.push('setLineDash'),
      translate: () => calls.push('translate'),
      scale: () => calls.push('scale'),
      rotate: () => calls.push('rotate'),
      transform: () => calls.push('transform'),
      resetTransform: () => calls.push('resetTransform'),
      drawImage: () => calls.push('drawImage'),
      createLinearGradient: () => ({ addColorStop: () => {} }),
      shadowColor: '',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: 'left',
      textBaseline: 'middle',
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
    } as unknown as CanvasRenderingContext2D & { calls: string[] };
  }

  const variants: LowerThirdVariant[] = [1, 2, 3, 4, 5, 6, 7, 8];

  for (const variant of variants) {
    it(`renders variant ${variant} without error at intro, hold and outro timestamps`, () => {
      const spec: LowerThirdSpec = {
        ...DEFAULT_LOWER_THIRD,
        id: `test-variant-${variant}`,
        variant,
        name: 'Saikrishna Varma',
        role: 'Cinematographer & Director',
        handle: '@saikrishna.films',
        start: 1.0,
        end: 5.0,
        introDuration: 0.7,
        outroDuration: 0.6,
      };

      const w = 1080;
      const h = 1920;

      // Intro sample (t = 1.35)
      const introCtx = createRecordingMockContext();
      expect(() => draw(introCtx, spec, 1.35, w, h)).not.toThrow();
      expect(introCtx.calls.length).toBeGreaterThan(0);

      // Hold sample (t = 3.0)
      const holdCtx = createRecordingMockContext();
      expect(() => draw(holdCtx, spec, 3.0, w, h)).not.toThrow();
      expect(holdCtx.calls.length).toBeGreaterThan(0);
      expect(holdCtx.calls.some((c) => c.includes('fillText'))).toBe(true);

      // Outro sample (t = 4.7)
      const outroCtx = createRecordingMockContext();
      expect(() => draw(outroCtx, spec, 4.7, w, h)).not.toThrow();
      expect(outroCtx.calls.length).toBeGreaterThan(0);
    });
  }

  it('renders avatar photo on photo variants when provided', () => {
    const spec: LowerThirdSpec = {
      ...DEFAULT_LOWER_THIRD,
      variant: 3,
      name: 'Ravi Teja',
      role: 'Action Director',
      photoBlobId: 'blob-1',
      start: 0,
      end: 4,
    };

    const ctx = createRecordingMockContext();
    const mockImg = { width: 100, height: 100 } as unknown as HTMLImageElement;

    draw(ctx, spec, 2.0, 1080, 1920, mockImg);
    expect(ctx.calls).toContain('drawImage');
  });

  it('renderLowerThirds filters out inactive items based on current time', () => {
    const ctx = createRecordingMockContext();
    const specs: LowerThirdSpec[] = [
      { ...DEFAULT_LOWER_THIRD, id: 'lt-1', name: 'Active Person', start: 1.0, end: 4.0 },
      { ...DEFAULT_LOWER_THIRD, id: 'lt-2', name: 'Future Person', start: 5.0, end: 8.0 },
    ];

    renderLowerThirds(ctx, 1080, 1920, 2.5, specs);
    expect(ctx.calls.some((c) => c.includes('Active Person'))).toBe(true);
    expect(ctx.calls.some((c) => c.includes('Future Person'))).toBe(false);
  });
});
