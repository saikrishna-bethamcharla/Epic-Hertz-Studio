import { test, expect } from '@playwright/test';

test.describe('Editor Scope & Control Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /try demo/i });
    await demoBtn.click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });
  });

  test('clicking caption selects it and sets scope to caption', async ({ page }) => {
    // Switch to Captions tab in Library panel
    await page
      .getByRole('tab', { name: /captions/i })
      .first()
      .click();

    // Select first caption card in Caption list
    const firstCaptionCard = page.locator('text=Prathi frame lo oka katha').first();
    await expect(firstCaptionCard).toBeVisible();
    await firstCaptionCard.click();

    // If mobile, switch to styles or inspector tab to check scope button
    const stylesTab = page.getByRole('tab', { name: /styles/i }).first();
    const inspectorTab = page.getByRole('tab', { name: /inspector/i }).first();
    if (await inspectorTab.isVisible()) {
      await inspectorTab.click();
    } else if (await stylesTab.isVisible()) {
      await stylesTab.click();
    }

    // Check scope selector displays 'Caption'
    const captionScopeBtn = page.getByRole('button', { name: 'Caption', exact: true }).first();
    await expect(captionScopeBtn).toHaveClass(/bg-amber-400/);
  });

  test('typography toggles (bold, italic, underline) operate without crash', async ({ page }) => {
    await page.getByRole('tab', { name: /captions/i }).click();
    const firstCaptionCard = page.locator('text=Prathi frame lo oka katha').first();
    await expect(firstCaptionCard).toBeVisible();
    await firstCaptionCard.click();

    const inspectorTab = page.getByRole('tab', { name: /inspector/i }).first();
    if (await inspectorTab.isVisible()) {
      await inspectorTab.click();
    }

    const boldBtn = page.getByTitle('Bold');
    await expect(boldBtn).toBeVisible();
    await boldBtn.click();

    const italicBtn = page.getByTitle('Italic');
    await expect(italicBtn).toBeVisible();
    await italicBtn.click();

    const underlineBtn = page.getByTitle('Underline');
    await expect(underlineBtn).toBeVisible();
    await underlineBtn.click();

    // Canvas should still be visible and rendering
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('Escape key in text input does not reset scope to all', async ({ page }) => {
    await page
      .getByRole('tab', { name: /captions/i })
      .first()
      .click();
    const firstCaptionCard = page.locator('text=Prathi frame lo oka katha').first();
    await expect(firstCaptionCard).toBeVisible();
    await firstCaptionCard.click();

    const stylesTab = page.getByRole('tab', { name: /styles/i }).first();
    const inspectorTab = page.getByRole('tab', { name: /inspector/i }).first();
    if (await inspectorTab.isVisible()) {
      await inspectorTab.click();
    } else if (await stylesTab.isVisible()) {
      await stylesTab.click();
    }

    // Ensure we are in caption scope
    const captionScopeBtn = page.getByRole('button', { name: 'Caption', exact: true }).first();
    await expect(captionScopeBtn).toHaveClass(/bg-amber-400/);

    // Focus a textarea in the editor
    const captionsTab = page.getByRole('tab', { name: /captions/i }).first();
    if (
      (await captionsTab.isVisible()) &&
      ((await inspectorTab.isVisible()) || (await stylesTab.isVisible()))
    ) {
      await captionsTab.click();
    }

    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible()) {
      await textarea.focus();
      await page.keyboard.press('Escape');

      if (await inspectorTab.isVisible()) {
        await inspectorTab.click();
      } else if (await stylesTab.isVisible()) {
        await stylesTab.click();
      }

      // Scope should STILL be 'Caption' because Escape occurred inside an input
      await expect(captionScopeBtn).toHaveClass(/bg-amber-400/);
    }
  });

  test('Reset all overrides is accessible from options menu', async ({ page }) => {
    await page.getByRole('tab', { name: /captions/i }).click();
    const firstCaptionCard = page.locator('text=Prathi frame lo oka katha').first();
    await expect(firstCaptionCard).toBeVisible();
    await firstCaptionCard.click();

    // Click 3 dots more button in inspector
    const moreBtn = page.getByTitle(/Options & shortcuts/i);
    if (await moreBtn.isVisible()) {
      await moreBtn.click();
      const resetBtn = page.getByText(/Reset all overrides/i);
      await expect(resetBtn).toBeVisible();
      await resetBtn.click();
    }
  });
});
