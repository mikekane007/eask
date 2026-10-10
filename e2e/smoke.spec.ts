import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Start every test from a fresh game, but let a reload inside a test keep its progress.
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-seeded')) {
      localStorage.clear();
      sessionStorage.setItem('e2e-seeded', '1');
    }
  });
});

test('boots without console errors and shows the intro', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'GO AND TELL' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Step out' })).toBeVisible();
  await expect(page.locator('canvas#c')).toBeVisible();
  expect(errors).toEqual([]);
});

test('starting the game reveals the HUD and the home sheet', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Step out' }).click();

  await expect(page.getByRole('heading', { name: 'GO AND TELL' })).toBeHidden();
  await expect(page.getByText('Energy', { exact: true })).toBeVisible();
  await expect(page.getByText('07:00')).toBeVisible();
  // The player spawns beside home, so the room sheet opens.
  await expect(page.getByRole('heading', { name: 'Your room' })).toBeVisible();
});

test('sleeping restores energy and advances the day', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Step out' }).click();
  await page.getByRole('button', { name: /Sleep till morning/ }).click();

  await expect(page.getByText(/Rested\. Day 2/)).toBeVisible();
  await expect(page.getByText('Day 2', { exact: true })).toBeVisible();
});

test('progress survives a reload and offers Continue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Step out' }).click();
  await page.getByRole('button', { name: /Sleep till morning/ }).click();
  await expect(page.getByText('Day 2', { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start over' })).toBeVisible();
});

test('the people panel lists all ten people', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Step out' }).click();
  await page.getByRole('button', { name: 'Show people and progress' }).click();
  await expect(page.getByText('PEOPLE ON YOUR STREET')).toBeVisible();
  await expect(page.getByText('Kwame')).toBeVisible();
  await expect(page.getByText('Auntie Akos')).toBeVisible();
});
