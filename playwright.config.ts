import { defineConfig, devices } from '@playwright/test';

const PORT = 4300;
const CI = !!process.env['CI'];

// Local runs are deliberately light (one worker, desktop only, real GPU) so a modest laptop stays
// responsive. CI runs the full matrix with software rendering.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: CI,
  workers: CI ? 2 : 1,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  // CI draws the 3D scene in software at a few frames a second, which can hold up a DOM update for a few seconds.
  expect: { timeout: CI ? 10_000 : 5_000 },
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: CI
      ? { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }
      : {},
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    ...(CI ? [{ name: 'phone', use: { ...devices['Pixel 7'] } }] : []),
  ],
  webServer: {
    command: `npm start -- --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
