import { test, expect } from '@playwright/test';

test.describe('Lower Thirds Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /try demo/i });
    await demoBtn.click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });
  });

  test('can switch to Lower Third tab and add an overlay', async ({ page }) => {
    // If on mobile layout, switch to inspector tab
    const inspectorTab = page.getByRole('tab', { name: /inspector/i });
    if (await inspectorTab.isVisible()) {
      await inspectorTab.click();
    }

    // Look for Lower Thirds tab or button in inspector
    const ltTab = page.getByRole('button', { name: /Lower Thirds/i }).first();
    await expect(ltTab).toBeVisible();
    await ltTab.click();

    // Click Add or Create Lower Third
    const addBtn = page.getByRole('button', { name: /Create Lower Third|Add/i }).first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Verify name input exists
    const nameInput = page.locator('input[placeholder*="RAVI TEJA" i]').first();
    await expect(nameInput).toBeVisible();
  });

  test('timeline contains lower thirds track', async ({ page }) => {
    // If on mobile layout, switch to timeline tab
    const timelineTab = page.getByRole('tab', { name: /timeline/i });
    if (await timelineTab.isVisible()) {
      await timelineTab.click();
    }
    const trackLabel = page.getByText(/Lower thirds/i).first();
    await expect(trackLabel).toBeVisible();
  });
});
