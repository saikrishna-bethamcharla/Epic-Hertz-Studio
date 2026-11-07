import { test, expect } from '@playwright/test';

test.describe('Transcription Flow (Mocked & Error Recovery)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const uploadSyntheticVideo = async (page: any) => {
    await page.evaluate(async () => {
      const { __setTestAudioMockEnabled } =
        await import('./src/subtitle-tool/utils/extractAudio.ts');
      __setTestAudioMockEnabled(true);
      const { createDemoVideo } = await import('./src/subtitle-tool/utils/createDemoVideo.ts');
      const file = await createDemoVideo();
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(file);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Wait for PrepareMediaModal dialog to become visible
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible({ timeout: 15000 });

    // Click 'Continue' to trigger audio extraction & transcription
    const continueBtn = page.getByRole('button', { name: 'Continue', exact: true });
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();
  };

  test('mocked success: transcribes audio and enters editor', async ({ page }) => {
    await page.route('**/api/transcribe*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          segments: [
            {
              id: 'seg-mock-1',
              index: 1,
              start: 0.0,
              end: 1.5,
              text: 'Welcome to Epic Hertz Studio',
              words: [
                { word: 'Welcome', start: 0.0, end: 0.4 },
                { word: 'to', start: 0.4, end: 0.6 },
                { word: 'Epic', start: 0.6, end: 0.9 },
                { word: 'Hertz', start: 0.9, end: 1.2 },
                { word: 'Studio', start: 1.2, end: 1.5 },
              ],
            },
          ],
          model: 'gemini-3.5-flash',
        }),
      });
    });

    await uploadSyntheticVideo(page);

    // Should transition to editing stage with canvas and text visible
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('text=Welcome to Epic Hertz Studio').first()).toBeVisible();
  });

  test('mocked 429: handles daily limit rate-limiting gracefully', async ({ page }) => {
    await page.route('**/api/transcribe*', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error:
            'Daily free limit reached for your IP (60 requests/day). Please add your own free Gemini API key in upload settings to continue without limits.',
        }),
      });
    });

    await uploadSyntheticVideo(page);

    // Should show error banner
    await expect(page.locator('text=Daily free limit reached').first()).toBeVisible({
      timeout: 25000,
    });
  });

  test('mocked 500: handles server failure without crash', async ({ page }) => {
    await page.route('**/api/transcribe*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Something went wrong while transcribing. Please try again.',
        }),
      });
    });

    await uploadSyntheticVideo(page);

    // Error message should appear in banner
    await expect(page.locator('text=Something went wrong').first()).toBeVisible({ timeout: 25000 });
  });

  test('mocked offline: handles network disconnection cleanly', async ({ page }) => {
    await page.route('**/api/transcribe*', async (route) => {
      await route.abort('failed');
    });

    await uploadSyntheticVideo(page);

    // Should return to idle stage with Try Demo button
    await expect(page.getByRole('button', { name: 'Try Demo', exact: true })).toBeVisible({
      timeout: 25000,
    });
  });
});
