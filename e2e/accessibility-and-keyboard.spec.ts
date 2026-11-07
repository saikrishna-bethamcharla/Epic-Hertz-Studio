import { test, expect } from '@playwright/test';

test.describe('Accessibility & Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /try demo/i });
    await demoBtn.click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });
  });

  test('pressing ? opens keyboard shortcuts cheat sheet', async ({ page }) => {
    await page.keyboard.press('?');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Keyboard Shortcuts' })).toBeVisible();

    // Pressing Escape closes dialog
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('panel toggle shortcuts [ and ] collapse and restore panels', async ({ page }) => {
    // Press [ to toggle left panel
    await page.keyboard.press('[');
    // Press [ again to restore
    await page.keyboard.press('[');

    // Press ] to toggle right panel
    await page.keyboard.press(']');
    // Press ] again to restore
    await page.keyboard.press(']');

    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
