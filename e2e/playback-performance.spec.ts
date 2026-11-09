import { test, expect } from '@playwright/test';

declare global {
  interface Window {
    __frameTimings?: number[];
    __startRecordingFrames?: () => void;
    __stopRecordingFrames?: () => void;
  }
}

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
      window.__frameTimings = [];
      let lastTime = performance.now();
      let recording = false;
      window.__startRecordingFrames = () => {
        recording = true;
        lastTime = performance.now();
        const loop = (now: number) => {
          if (!recording) return;
          const delta = now - lastTime;
          lastTime = now;
          window.__frameTimings?.push(delta);
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      };
      window.__stopRecordingFrames = () => {
        recording = false;
      };
    });

    // Start recording frame deltas
    await page.evaluate(() => window.__startRecordingFrames?.());

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
      window.__stopRecordingFrames?.();
      return window.__frameTimings || [];
    });

    // Pause video
    await page.keyboard.press('Space');

    expect(timings.length).toBeGreaterThan(0);

    if (timings.length > 1) {
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

      // Performance assertion: ensure render loop is active without deadlock or thread lockup in CI
      expect(Number.isFinite(avg)).toBe(true);
      expect(p95).toBeLessThan(500);
    }
  });

  test('drags a slider during playback and asserts input-to-paint latency', async ({ page }) => {
    await page.goto('/');

    const demoBtn = page.getByRole('button', { name: /try demo/i });
    await expect(demoBtn).toBeVisible();
    await demoBtn.click();

    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });

    // If on mobile layout, switch to timeline tab so zoom slider is mounted
    const timelineTab = page.getByRole('tab', { name: /^timeline$/i });
    if (await timelineTab.isVisible()) {
      await timelineTab.click();
    }

    // Start playback
    const playBtn = page.getByRole('button', { name: /start playback|play/i }).first();
    if (await playBtn.isVisible()) {
      await playBtn.click();
    } else {
      await page.keyboard.press('Space');
    }

    // Locate timeline zoom slider directly
    const slider = page.getByLabel('Timeline zoom level');
    await expect(slider).toBeAttached({ timeout: 10000 });

    // Measure input-to-paint latency during active playback
    const latency: number = await slider.evaluate(async (el: HTMLInputElement) => {
      return new Promise<number>((resolve) => {
        const start = performance.now();
        el.value = String(Math.min(Number(el.max), Number(el.value) + 15));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        requestAnimationFrame(() => {
          const painted = performance.now();
          resolve(painted - start);
        });
      });
    });

    // Drag the slider interactively if bounding box is accessible and visible
    if (await slider.isVisible()) {
      await slider.scrollIntoViewIfNeeded();
      const box = await slider.boundingBox();
      if (box && box.width > 0 && box.height > 0) {
        const startX = box.x + box.width / 2;
        const startY = box.y + box.height / 2;
        await page.mouse.move(startX, startY);
        await page.mouse.down();
        await page.mouse.move(startX + 10, startY, { steps: 3 });
        await page.mouse.up();
      }
    }

    // Pause video
    const pauseBtn = page.getByRole('button', { name: /pause/i }).first();
    if (await pauseBtn.isVisible()) {
      await pauseBtn.click();
    } else {
      await page.keyboard.press('Space');
    }

    console.log(`[SLIDER INTERACTION LATENCY] Measured input-to-paint: ${latency.toFixed(2)} ms`);

    // Assert that input-to-paint latency during playback is bounded (responsive, unblocked UI even under CI virtualization)
    expect(latency).toBeGreaterThanOrEqual(0);
    expect(latency).toBeLessThan(500);
  });
});
