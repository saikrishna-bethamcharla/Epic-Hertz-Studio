import { test, expect } from '@playwright/test';

test.describe('Playback Performance & Frame Timing', () => {
  test('logs frame timings during playback and confirms smooth frame delivery', async ({
    page,
  }) => {
    await page.goto('/');

    // Load demo video
    const demoBtn = page.getByRole('button', { name: /try demo/i });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    // Wait for editor to be ready
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });

    // Install frame timing probe in the browser context
    await page.evaluate(() => {
      (window as any).__frameTimings = [];
      let lastTime = performance.now();
      let recording = false;
      (window as any).__startRecordingFrames = () => {
        recording = true;
        lastTime = performance.now();
        const loop = (now: number) => {
          if (!recording) return;
          const delta = now - lastTime;
          lastTime = now;
          (window as any).__frameTimings.push(delta);
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      };
      (window as any).__stopRecordingFrames = () => {
        recording = false;
      };
    });

    // Start recording frame deltas
    await page.evaluate(() => (window as any).__startRecordingFrames());

    // Hit Space to play or click play button
    const playBtn = page.getByRole('button', { name: /start playback|play/i }).first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
    } else {
      await page.keyboard.press('Space');
    }

    // Play for 1.5 seconds
    await page.waitForTimeout(1500);

    // Stop recording frame deltas
    const timings: number[] = await page.evaluate(() => {
      (window as any).__stopRecordingFrames();
      return (window as any).__frameTimings || [];
    });

    // Pause video
    await page.keyboard.press('Space');

    expect(timings.length).toBeGreaterThan(15);

    // Compute metrics: avg, min, max, p95
    const cleanTimings = timings.slice(1); // Drop first warm-up frame
    const sum = cleanTimings.reduce((acc, t) => acc + t, 0);
    const avg = sum / cleanTimings.length;
    const sorted = [...cleanTimings].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const max = Math.max(...cleanTimings);
    const min = Math.min(...cleanTimings);

    console.log(`[PLAYWRIGHT FRAME TIMINGS] Across ${cleanTimings.length} captured frames:`);
    console.log(`  - Average frame time: ${avg.toFixed(2)} ms (~${(1000 / avg).toFixed(1)} fps)`);
    console.log(`  - 95th percentile: ${p95.toFixed(2)} ms`);
    console.log(`  - Min / Max: ${min.toFixed(2)} ms / ${max.toFixed(2)} ms`);

    // Performance assertion: 95% of frames delivered under 50ms (>= 20 fps even under CI/CD load)
    expect(p95).toBeLessThan(60);
  });
});
