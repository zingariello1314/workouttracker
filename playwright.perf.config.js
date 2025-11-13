import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour tests de performance
 * 
 * Configuration séparée pour les tests de performance
 * qui sont dans tests/performance/ au lieu de tests/e2e/
 */
export default defineConfig({
  testDir: './tests/performance',
  
  // Timeout global pour chaque test (plus long pour tests perf)
  timeout: 120 * 1000, // 2 minutes
  
  // Timeout pour chaque assertion
  expect: {
    timeout: 30 * 1000, // 30 secondes
  },
  
  // Exécution séquentielle pour tests de performance
  fullyParallel: false,
  workers: 1,
  
  // Répétition en cas d'échec
  retries: process.env.CI ? 2 : 0,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report-perf' }],
    ['json', { outputFile: 'playwright-report-perf/results.json' }],
    ['list']
  ],
  
  // Configuration partagée pour tous les projets
  use: {
    // Base URL de l'application
    baseURL: 'http://localhost:3001',
    
    // Screenshot en cas d'échec
    screenshot: 'only-on-failure',
    
    // Video en cas d'échec
    video: 'retain-on-failure',
    
    // Trace pour debugging
    trace: 'on-first-retry',
    
    // Action timeout
    actionTimeout: 30 * 1000, // 30 secondes
  },

  // Projets (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Serveurs web à démarrer avant les tests
  webServer: [
    {
      command: 'npm run dev',
      port: 3001,
      timeout: 120 * 1000, // 2 minutes pour démarrer
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
      },
    },
    {
      command: process.platform === 'win32' 
        ? 'powershell -Command "cd garmin-server; node garmin-server.js"'
        : 'cd garmin-server && node garmin-server.js',
      port: 3031,
      timeout: 60 * 1000, // 60 secondes pour démarrer (plus long pour Windows)
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
        PORT: '3031',
        USE_PYTHON: '0', // Mode mock pour les tests (pas besoin de Python)
      },
    },
  ],
});

