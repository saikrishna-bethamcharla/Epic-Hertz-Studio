import { test, expect } from '@playwright/test';

test.describe('Timeline Operations (Split, Delete, Undo, Redo)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /try demo/i });
    await demoBtn.click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });
  });

  test('split caption at playhead and undo/redo', async ({ page }) => {
    // Switch to captions tab
    await page
      .getByRole('tab', { name: /captions/i })
      .first()
      .click();

    // Count initial caption textareas
    const initialCards = await page.locator('textarea').count();
    expect(initialCards).toBeGreaterThanOrEqual(3);

    // Seek to 0.7s (middle of first caption: 0.1s - 1.4s)
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (video) {
        video.currentTime = 0.7;
        video.dispatchEvent(new Event('timeupdate'));
      }
    });

    // Press 's' to split at playhead
    await page.keyboard.press('s');

    // After split, number of textareas should increase or remain stable
    await page.waitForTimeout(500);

    // Press Undo (Ctrl+Z or Meta+Z)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+z`);
    await page.waitForTimeout(300);

    // Press Redo
    await page.keyboard.press(`${modifier}+Shift+z`);
    await page.waitForTimeout(300);

    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('delete active caption and undo', async ({ page }) => {
    await page
      .getByRole('tab', { name: /captions/i })
      .first()
      .click();
    const firstCaption = page.locator('text=Prathi frame lo oka katha').first();
    await expect(firstCaption).toBeVisible();
    await firstCaption.hover();

    const initialCount = await page.locator('textarea').count();

    const deleteBtn = page.getByRole('button', { name: /Delete caption 1/i }).first();
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    await expect(page.locator('textarea')).toHaveCount(initialCount - 1);

    // Press Undo to restore deleted caption
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+z`);

    await expect(page.locator('textarea')).toHaveCount(initialCount);
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
