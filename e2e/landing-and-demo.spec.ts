import { test, expect } from '@playwright/test';

test.describe('Landing and Demo Entry', () => {
  test('renders landing page with headline and demo button', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Epic Hertz/i);
    const demoBtn = page.getByRole('button', { name: /try demo/i });
    await expect(demoBtn).toBeVisible();
  });

  test('clicking Try Demo loads demo video and transitions to editor', async ({ page }) => {
    await page.goto('/');
    const demoBtn = page.getByRole('button', { name: /try demo/i });
    await demoBtn.click();

    // Editor should load timeline, video preview, and library
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });
    // Verify demo captions exist in editor
    await expect(page.getByText('Prathi frame lo oka katha').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('file input accepts video files', async ({ page }) => {
    await page.goto('/');
    const fileInput = page.locator('input[type="file"]').first();
    await expect(fileInput).toHaveAttribute('accept', /video\/\*,audio\/\*/);
  });
});
