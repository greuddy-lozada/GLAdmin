import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './modules',
  timeout: 60000,
  expect: { timeout: 10000 },
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        storageState: '.auth/user.json',
      },
    },
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
  ],
});
