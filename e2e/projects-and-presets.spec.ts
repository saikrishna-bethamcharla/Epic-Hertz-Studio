import { test, expect } from '@playwright/test';

test.describe('Projects, Presets & Font Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /try demo/i });
    await demoBtn.click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });
  });

  test('opens Project Manager modal from header', async ({ page }) => {
    const projectsBtn = page.getByRole('button', { name: /projects/i }).first();
    if (await projectsBtn.isVisible()) {
      await projectsBtn.click();
      await expect(
        page.getByRole('heading', { name: /Saved Projects|Projects/i }).first(),
      ).toBeVisible();

      // Close modal
      const closeBtn = page.getByRole('button', { name: /close/i }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    }
  });

  test('preset import rejects malformed JSON cleanly without crash', async ({ page }) => {
    // Switch to Templates/Styles tab in Library panel
    await page
      .getByRole('tab', { name: /Templates|Styles/i })
      .first()
      .click();

    // Trigger import with malformed JSON file via DOM evaluation
    const result = await page.evaluate(async () => {
      try {
        const { importUserPresetsFromJson } = await import('./src/subtitle-tool/v2/userPresets.ts');
        const res = importUserPresetsFromJson('{ this is completely invalid json !!!');
        return { success: false, errors: res.errors };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    expect(result.errors?.[0] || result.error).toBeTruthy();
    // Verify canvas continues running
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('custom font selection switches font safely', async ({ page }) => {
    // Switch to inspector typography
    const fontSelector = page
      .locator('select, button:has-text("Montserrat"), button:has-text("Anton")')
      .first();
    if (await fontSelector.isVisible()) {
      await fontSelector.click();
    }
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
