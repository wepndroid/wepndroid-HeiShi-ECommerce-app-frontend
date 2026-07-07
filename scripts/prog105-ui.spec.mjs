/**
 * PROG-105 Expo web UI smoke tests.
 * Run: npx playwright test scripts/prog105-ui.spec.mjs --config=scripts/playwright.prog105.config.mjs
 */
import { test, expect } from '@playwright/test';

const BASE = process.env.EXPO_WEB_URL || 'http://127.0.0.1:19006';

test.describe('PROG-105 auth UI', () => {
  test('register page loads', async ({ page }) => {
    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page.getByText(/sign up|注册/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('empty register shows validation toast', async ({ page }) => {
    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const submit = page.getByText(/sign up|注册/i).last();
    await submit.click();
    await expect(page.getByText(/nickname|昵称/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('register password mismatch toast', async ({ page }) => {
    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('input').nth(0).fill('TestUser');
    await page.locator('input').nth(1).fill('0400112233');
    await page.locator('input').nth(2).fill('secret1');
    await page.locator('input').nth(3).fill('secret2');
    await page.getByText(/sign up|注册/i).last().click();
    await expect(page.getByText(/match|不一致/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('register invalid phone toast', async ({ page }) => {
    await page.goto(`${BASE}/register`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.locator('input').nth(0).fill('TestUser');
    await page.locator('input').nth(1).fill('123');
    await page.locator('input').nth(2).fill('secret1');
    await page.locator('input').nth(3).fill('secret1');
    await page.getByText(/sign up|注册/i).last().click();
    await expect(page.getByText(/valid.*mobile|有效.*手机/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('login page loads', async ({ page }) => {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await expect(page.getByText(/sign in|登录/i).first()).toBeVisible({ timeout: 15000 });
  });

  test('guest publish tab prompts login', async ({ page }) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const publish = page.getByText(/^Publish$|^发布$/).first();
    if (await publish.isVisible().catch(() => false)) {
      await publish.click();
      await expect(page.getByText(/sign in|登录/i).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
