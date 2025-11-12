import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour tests E2E de l'onglet Garmin
 * 
 * Stratégie :
 * - Tests critiques (P0) : sync, import, cache
 * - Tests nominaux (P1) : navigation, export, auto-sync, DebugPanel
 * - Support multi-navigateurs (Chromium par défaut, extensible)
 * - Intégration avec serveurs frontend (3001) et backend (3031)
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  // Timeout global pour chaque test
  timeout: 60 * 1000, // 60 secondes
  
  // Timeout pour chaque assertion
  expect: {
    timeout: 10 * 1000, // 10 secondes
  },
  
  // Exécution en parallèle (1 worker pour éviter conflits IndexedDB)
  fullyParallel: false,
  workers: 1,
  
  // Répétition en cas d'échec
  retries: process.env.CI ? 2 : 0,
  
  // Reporter
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
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
    actionTimeout: 15 * 1000, // 15 secondes
  },

  // Projets (navigateurs)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Extensible : Firefox, WebKit si nécessaire
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
      command: 'cd garmin-server && node garmin-server.js',
      port: 3031,
      timeout: 30 * 1000, // 30 secondes pour démarrer
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
      },
    },
  ],
});


