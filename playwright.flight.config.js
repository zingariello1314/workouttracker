import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'today-flight-recorder.spec.js',
  timeout: 90 * 1000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3012',
    ...devices['Desktop Chrome']
  },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 3012 --strictPort',
    port: 3012,
    timeout: 120 * 1000,
    reuseExistingServer: false
  }
});
