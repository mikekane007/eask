import { expect, test, type Page } from '@playwright/test';

test.use({ locale: 'en-US' });

test.beforeEach(async ({ page }) => {
  // Start every test from a fresh game, but let a reload inside a test keep its progress.
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('e2e-seeded')) {
      localStorage.clear();
      // a name and a look are already chosen, so the first-time character screen does not get in the way
      if (!location.hash.includes('new-player')) {
        localStorage.setItem('goandtell:avatar', '{"female":false,"skin":4,"hair":0,"outfit":0}');
        localStorage.setItem('goandtell:name', 'Tester');
      }
      sessionStorage.setItem('e2e-seeded', '1');
    }
  });
});

/** Opens the app, picks a city and presses the start button. */
async function play(page: Page, city = 'lille', start = 'Step out'): Promise<void> {
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
  for (const city of ['lille', 'paris', 'douai']) {
    await expect(page.locator(`#city-${city}`)).toBeVisible();
  }
  // Accra stays in the game but is no longer offered
  await expect(page.locator('#city-accra')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('choosing a city shows its intro, and starting reveals the HUD and the home sheet', async ({ page }) => {
  await page.goto('/');
  await page.locator('#city-lille').click();
  await expect(page.getByRole('heading', { name: 'GO AND TELL' })).toBeVisible();
  await expect(page.locator('canvas#c')).toBeVisible();
  await page.getByRole('button', { name: 'Step out' }).click();

  await expect(page.getByRole('heading', { name: 'GO AND TELL' })).toBeHidden();
  await expect(page.getByText('Energy', { exact: true })).toBeVisible();
  // the clock starts at 07:00 and ticks a minute every few seconds while the city loads
  await expect(page.getByText(/^07:0\d$/)).toBeVisible();
  // The player spawns beside home, so the room sheet opens.
  await expect(page.getByRole('heading', { name: 'Your flat' })).toBeVisible();
});

test('sleeping restores energy and advances the day', async ({ page }) => {
  await play(page);
  await page.getByRole('button', { name: /Sleep till morning/ }).click();

  await expect(page.getByText(/Rested\. Day 2/)).toBeVisible();
  await expect(page.getByText(/^Day 2 ·/)).toBeVisible();
});

test('progress survives a reload and offers Continue', async ({ page }) => {
  await play(page);
  await page.getByRole('button', { name: /Sleep till morning/ }).click();
  await expect(page.getByText(/^Day 2 ·/)).toBeVisible();

  await page.reload();
  await page.locator('#city-lille').click();
  await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start over' })).toBeVisible();
});

test('the people panel lists the people of the chosen city', async ({ page }) => {
  await play(page);
  await page.getByRole('button', { name: 'Show people and progress' }).click();
  await expect(page.getByText('PEOPLE ON YOUR STREET')).toBeVisible();
  await expect(page.getByText('Thomas')).toBeVisible();
  await expect(page.getByText('Margot')).toBeVisible();
  await expect(page.getByText('Mme Lefebvre', { exact: true })).toBeVisible();
});

test('the rules can be opened from the intro and during play, and closed with Escape', async ({ page }) => {
  await page.goto('/');
  await page.locator('#city-lille').click();
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
  await play(page, 'lille');
  await page.getByRole('button', { name: /Sleep till morning/ }).click();
  await expect(page.getByText(/^Day 2 ·/)).toBeVisible();

  await page.getByRole('button', { name: 'Game rules' }).click();
  await page.getByRole('button', { name: 'Change city' }).click();
  await expect(page.getByRole('heading', { name: 'CHOOSE YOUR CITY' })).toBeVisible();

  await page.locator('#city-douai').click();
  await page.getByRole('button', { name: 'Step out' }).click();
  await expect(page.getByText(/^Day 1 ·/)).toBeVisible();
});

test('a city with a real street map loads it, shows the credit and starts beside home', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (err) => errors.push(err.message));
  await play(page, 'lille');
  await expect(page.getByText('© OpenStreetMap contributors (ODbL)')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Your flat' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('a new player gives a name and chooses a look, in 3D, before stepping out', async ({ page }) => {
  await page.goto('/#new-player');
  await page.locator('#city-lille').click();
  await page.getByRole('button', { name: 'Step out' }).click();
  const dialog = page.getByRole('dialog', { name: 'Your character' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('canvas.look3d')).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Done' })).toBeDisabled();
  await dialog.getByLabel('Your name').fill('Ama');
  await dialog.getByRole('button', { name: 'Lady' }).click();
  await dialog.getByRole('button', { name: 'Kente cloth' }).click();
  await dialog.getByRole('button', { name: 'Done' }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByText('Energy', { exact: true })).toBeVisible();
});

test('autopilot offers the places and people of the city', async ({ page }) => {
  await play(page);
  await page.getByRole('button', { name: 'Autopilot' }).click();
  const dialog = page.getByRole('dialog', { name: 'Walk by itself' });
  await expect(dialog.getByRole('button', { name: 'Mme Lefebvre' })).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Thomas' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Thomas' }).click();
  await expect(page.getByText('Walking there…')).toBeVisible();
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.getByText('Walking there…')).toBeHidden();
});

test('play together opens, and a wrong code is refused without going online', async ({ page }) => {
  await play(page);
  await page.getByRole('button', { name: 'Play together' }).click();
  const dialog = page.getByRole('dialog', { name: 'Play together' });
  await expect(dialog.getByRole('button', { name: 'Open a room' })).toBeVisible();
  await dialog.getByLabel('Room code').fill('abc');
  await dialog.getByRole('button', { name: 'Join' }).click();
  await expect(dialog.getByText('No room has that code.')).toBeVisible();
});

test('someone can be phoned from home, and the typed question has no list of answers', async ({ page }) => {
  await play(page);
  await page.getByRole('button', { name: /Call Mme Lefebvre/ }).click();
  await expect(page.getByRole('heading', { name: 'Mme Lefebvre' })).toBeVisible();
  await expect(page.getByText('Question 1 of 3')).toBeVisible();
  await page.locator('#ans-0-0').click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByText('Question 2 of 3')).toBeVisible();
  await expect(page.locator('#ans-1-0')).toHaveCount(0);
  await expect(page.getByPlaceholder('Type what you would say…')).toBeFocused();
  await page.getByPlaceholder('Type what you would say…').fill('That sounds lonely, could I visit you this week?');
  await page.getByRole('button', { name: 'Say it' }).click();
  await expect(page.getByText(/How close you came: \d+%/)).toBeVisible();
});
