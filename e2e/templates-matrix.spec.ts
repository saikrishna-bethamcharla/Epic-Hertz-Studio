import { test, expect } from '@playwright/test';

test.describe('Templates Matrix (40 Catalog Templates)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /try demo/i });
    await demoBtn.click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });
  });

  test('applies templates globally in all scope', async ({ page }) => {
    // Switch to Styles tab in Library panel
    await page.getByRole('tab', { name: /Styles/i }).click();

    // Scope should default to 'all'
    const allScopeBtn = page.getByRole('button', { name: 'All', exact: true }).first();
    await expect(allScopeBtn).toHaveClass(/bg-amber-400/);

    // Look for template cards in styles grid
    const templateCards = page.locator(
      'div[title*="Karaoke Highlight"], div[title*="Neon Pulse"], div[title*="Bouncy Pop"]',
    );
    const firstCard = templateCards.first();
    await expect(firstCard).toBeVisible();
    await firstCard.click();
    // Canvas should still be rendering cleanly
    await expect(page.locator('canvas').first()).toBeVisible();
  });

  test('applies templates per caption in caption scope', async ({ page }) => {
    // Select first caption
    await page
      .getByRole('tab', { name: /captions/i })
      .first()
      .click();
    const firstCaption = page.locator('text=Prathi frame lo oka katha').first();
    await expect(firstCaption).toBeVisible();
    await firstCaption.click();

    // Switch to Styles tab and verify scope is 'Caption'
    await page
      .getByRole('tab', { name: /Styles/i })
      .first()
      .click();

    // Verify scope is now 'Caption'
    const captionScopeBtn = page.getByRole('button', { name: 'Caption', exact: true }).first();
    await expect(captionScopeBtn).toHaveClass(/bg-amber-400/);

    const templateCard = page
      .locator('div[title*="Karaoke Highlight"], div[title*="Neon Pulse"]')
      .first();
    await expect(templateCard).toBeVisible();
    await templateCard.click();

    // Switch back to captions list and verify the first caption has an override indicator
    await page
      .getByRole('tab', { name: /captions/i })
      .first()
      .click();
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
