import { defineConfig, devices } from '@playwright/test'

// E2E tests run in WebKit with iPhone emulation, the closest match to Safari on iOS.
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
  projects: (['aqua', 'glass', 'win98'] as const).map((theme) => ({
    name: theme,
    use: {
      ...devices['iPhone 17'],
      storageState: { cookies: [], origins: [{ origin: 'http://localhost:4173', localStorage: [{ name: 'good-dogs-only.theme', value: theme }] }] },
    },
  })),
  webServer: {
    command: 'pnpm build && pnpm preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
