import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    /** Specs Playwright : exclues (lancer via `npm run test:e2e` / `test:perf`). */
    exclude: [
      ...configDefaults.exclude,
      'tests/e2e/**',
      'tests/performance/**',
    ],
    setupFiles: ['./src/test/setup.js'],
    environmentOptions: {
      jsdom: {
        resources: 'usable'
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js',
        '**/*.test.js',
        '**/*.spec.js'
      ]
    }
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
});

