import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Audits with Axe Core', () => {
  test('landing screen has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .disableRules(['color-contrast']) // Color contrast evaluated in design audit
      .analyze();

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations).toEqual([]);
  });

  test('editor main workspace has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: 'Try Demo', exact: true });
    await demoBtn.click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations).toEqual([]);
  });

  test('keyboard shortcuts modal has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: 'Try Demo', exact: true });
    await demoBtn.click();
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 20000 });

    await page.keyboard.press('?');
    await expect(page.getByRole('dialog')).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical');
    expect(criticalViolations).toEqual([]);
  });
});
