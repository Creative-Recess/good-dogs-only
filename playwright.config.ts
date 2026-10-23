import { defineConfig, devices } from '@playwright/test'

// E2E tests run in WebKit with iPhone emulation, the closest match to Safari on iOS.
/** Starts the browser with a theme already chosen on the "phone", and the Add to Home Screen prompt turned off
 *  (install.spec.ts turns it back on to test it). */
const withTheme = (theme: string) => ({
  cookies: [],
  origins: [
    {
      origin: 'http://localhost:4173',
      localStorage: [
        { name: 'good-dogs-only.theme', value: theme },
        { name: 'good-dogs-only.home-screen-prompt', value: 'off' },
      ],
    },
  ],
})

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  // The whole suite runs once per theme; each project starts with its theme saved on the "phone".
  projects: [
    ...(['glass', 'aqua', 'win98'] as const).map((theme) => ({
      name: theme,
      use: { ...devices['iPhone 17'], storageState: withTheme(theme) },
    })),
    // Android: Chrome on a Pixel, in the default theme. Screenshot baselines are iPhone-only, so those are skipped.
    { name: 'android', use: { ...devices['Pixel 7'], storageState: withTheme('glass') }, testIgnore: /visual\.spec\.ts/ },
  ],
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
