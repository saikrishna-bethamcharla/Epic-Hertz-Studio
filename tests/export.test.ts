import { describe, it, expect } from 'vitest';
import { estimateExportMemory } from '../src/subtitle-tool/utils/exportVideo';

describe('export: estimateExportMemory', () => {
  it('calculates reasonable memory for a short 1080p standard clip', () => {
    // 30 seconds, 1080x1920 (vertical reel), standard quality
    const estimate = estimateExportMemory(30, 1080, 1920, 'standard');
    expect(estimate.isHighMemory).toBe(false);
    expect(estimate.estimatedBytes).toBeGreaterThan(5_000_000);
    expect(estimate.estimatedBytes).toBeLessThan(100_000_000);
  });

  it('flags high memory warning for long or 4K videos', () => {
    // 10 minutes (600s) of 4K (3840x2160) at max quality
    const estimate = estimateExportMemory(600, 3840, 2160, 'max');
    expect(estimate.isHighMemory).toBe(true);
    expect(estimate.estimatedBytes).toBeGreaterThan(950_000_000);
  });

  it('caps resolution when maxShortSide is specified', () => {
    const unscaled = estimateExportMemory(60, 3840, 2160, 'high');
    const scaled1080 = estimateExportMemory(60, 3840, 2160, 'high', 1080);
    expect(scaled1080.estimatedBytes).toBeLessThan(unscaled.estimatedBytes);
  });
});
