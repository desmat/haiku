import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // Traces record on first retry only.
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3017',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'mkdir -p test-results && : > test-results/webserver.log && npm run dev -- --hostname 127.0.0.1 --port 3017 2>&1 | tee -a test-results/webserver.log',
      url: 'http://localhost:3017',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        EXPERIENCE_MODE: 'haiku',
        NEXT_DIST_DIR: '.next-test/haiku',
        NO_ONBOARDING: 'true',
        STORE_TYPE: 'memory',
        AI_MOCK: 'true',
        BLOB_MOCK: 'true',
        // Leaves time to see the streamed preview.
        AI_MOCK_IMAGE_MS: '3000',
      },
    },
    {
      // `?mode=haikudle` on a haiku server isn't haikudle.ai: /api/haikus refuses the mode.
      command: 'mkdir -p test-results && : > test-results/webserver-haikudle.log && npm run dev -- --hostname 127.0.0.1 --port 3018 2>&1 | tee -a test-results/webserver-haikudle.log',
      url: 'http://localhost:3018',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        EXPERIENCE_MODE: 'haikudle',
        NEXT_DIST_DIR: '.next-test/haikudle',
        NO_ONBOARDING: 'true',
        STORE_TYPE: 'memory',
        AI_MOCK: 'true',
        BLOB_MOCK: 'true',
      },
    },
  ],
  projects: [
    {
      name: 'chromium',
      testIgnore: /haikudle-mode\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: Number(process.env.PLAYWRIGHT_SLOW_MO || 0),
        },
      },
    },
    {
      name: 'haikudle',
      testMatch: /haikudle-mode\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:3018',
        launchOptions: {
          slowMo: Number(process.env.PLAYWRIGHT_SLOW_MO || 0),
        },
      },
    },
  ],
});
