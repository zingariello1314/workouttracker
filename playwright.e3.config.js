import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'e3-persistence-isolated.spec.js',
  timeout: 90 * 1000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3011',
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 3011 --strictPort',
    port: 3011,
    timeout: 120 * 1000,
    reuseExistingServer: false
  }
});
