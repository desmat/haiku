import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3017',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'mkdir -p test-results && : > test-results/webserver.log && npm run dev -- --hostname 127.0.0.1 --port 3017 2>&1 | tee -a test-results/webserver.log',
    url: 'http://localhost:3017',
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      EXPERIENCE_MODE: 'haiku',
      NO_ONBOARDING: 'true',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: Number(process.env.PLAYWRIGHT_SLOW_MO || 0),
        },
      },
    },
  ],
});
