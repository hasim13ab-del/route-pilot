import { test, expect } from '@playwright/test';

test('app loads and navigates', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/RoutePilot/);

  // Verify tabs
  await page.click('nav button:nth-child(2)'); // Map
  await expect(page.locator('text=Live Route Map')).toBeVisible();

  await page.click('nav button:nth-child(3)'); // Stats
  await expect(page.locator('text=Total')).toBeVisible();

  await page.click('nav button:nth-child(4)'); // Settings
  await expect(page.locator('text=PWA Status')).toBeVisible();

  await page.click('nav button:nth-child(1)'); // Shipments
  await expect(page.locator('text=No shipments found')).toBeVisible();
});
