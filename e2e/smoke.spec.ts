import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

test.beforeEach(async ({ page }) => {
  // Start every test from a fresh game, but let a reload inside a test keep its progress.
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-seeded')) {
      localStorage.clear();
      sessionStorage.setItem('e2e-seeded', '1');
    }
  });
});

/** Opens the app, picks a city and presses the start button. */
async function play(page: Page, city = 'accra', start = 'Step out'): Promise<void> {
  await page.goto('/');
  await page.locator(`#city-${city}`).click();
  await page.getByRole('button', { name: start }).click();
}

test('boots without console errors and shows the city picker', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'CHOOSE YOUR CITY' })).toBeVisible();
  for (const city of ['accra', 'lille', 'paris', 'douai']) {
    await expect(page.locator(`#city-${city}`)).toBeVisible();
  }
  expect(errors).toEqual([]);
});

test('choosing a city shows its intro, and starting reveals the HUD and the home sheet', async ({ page }) => {
  await page.goto('/');
  await page.locator('#city-accra').click();
  await expect(page.getByRole('heading', { name: 'GO AND TELL' })).toBeVisible();
  await expect(page.locator('canvas#c')).toBeVisible();
  await page.getByRole('button', { name: 'Step out' }).click();

  await expect(page.getByRole('heading', { name: 'GO AND TELL' })).toBeHidden();
  await expect(page.getByText('Energy', { exact: true })).toBeVisible();
  await expect(page.getByText('07:00')).toBeVisible();
  // The player spawns beside home, so the room sheet opens.
  await expect(page.getByRole('heading', { name: 'Your room' })).toBeVisible();
});

test('sleeping restores energy and advances the day', async ({ page }) => {
  await play(page);
  await page.getByRole('button', { name: /Sleep till morning/ }).click();

  await expect(page.getByText(/Rested\. Day 2/)).toBeVisible();
  await expect(page.getByText('Day 2', { exact: true })).toBeVisible();
});

test('progress survives a reload and offers Continue', async ({ page }) => {
  await play(page);
  await page.getByRole('button', { name: /Sleep till morning/ }).click();
  await expect(page.getByText('Day 2', { exact: true })).toBeVisible();

  await page.reload();
  await page.locator('#city-accra').click();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start over' })).toBeVisible();
});

test('the people panel lists the people of the chosen city', async ({ page }) => {
  await play(page);
  await page.getByRole('button', { name: 'Show people and progress' }).click();
  await expect(page.getByText('PEOPLE ON YOUR STREET')).toBeVisible();
  await expect(page.getByText('Kwame')).toBeVisible();
  await expect(page.getByText('Auntie Akos')).toBeVisible();
});

test('the rules can be opened from the intro and during play, and closed with Escape', async ({ page }) => {
  await page.goto('/');
  await page.locator('#city-accra').click();
  await page.getByRole('button', { name: 'How to play' }).click();
  await expect(page.getByRole('dialog', { name: 'HOW TO PLAY' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.getByRole('button', { name: 'Step out' }).click();
  await page.getByRole('button', { name: 'Game rules' }).click();
  await expect(page.getByText('People and the Word they need')).toBeVisible();
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('a French city plays in French, with its own people and place names', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Français' }).click();
  await expect(page.getByRole('heading', { name: 'CHOISISSEZ VOTRE VILLE' })).toBeVisible();

  await page.locator('#city-lille').click();
  await expect(page.getByText('Provisoire : les conversations attendent d’être relues.')).toBeVisible();
  await page.getByRole('button', { name: 'Sortir' }).click();
  await expect(page.getByRole('heading', { name: 'Votre appartement' })).toBeVisible();

  await page.getByRole('button', { name: 'Afficher les personnes et la progression' }).click();
  await expect(page.getByText('Thomas')).toBeVisible();
  await expect(page.getByText('Amélie')).toBeVisible();
});

test('the language can be switched in the middle of the game', async ({ page }) => {
  await play(page, 'paris');
  await expect(page.getByRole('heading', { name: 'Your studio' })).toBeVisible();
  await page.getByRole('button', { name: 'Language' }).click();
  await expect(page.getByRole('heading', { name: 'Votre studio' })).toBeVisible();
  await expect(page.getByText('Énergie', { exact: true })).toBeVisible();
});

test('each city keeps its own progress, and you can change city from the rules', async ({ page }) => {
  await play(page, 'accra');
  await page.getByRole('button', { name: /Sleep till morning/ }).click();
  await expect(page.getByText('Day 2', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Game rules' }).click();
  await page.getByRole('button', { name: 'Change city' }).click();
  await expect(page.getByRole('heading', { name: 'CHOOSE YOUR CITY' })).toBeVisible();

  await page.locator('#city-douai').click();
  await page.getByRole('button', { name: 'Step out' }).click();
  await expect(page.getByText('Day 1', { exact: true })).toBeVisible();
});
