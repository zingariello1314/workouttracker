#!/usr/bin/env node

/**
 * Script pour créer une baseline de performance
 * 
 * Usage: node scripts/perf/create-baseline.js
 * 
 * Crée une baseline avec les valeurs par défaut basées sur les budgets.
 * Pour mettre à jour avec des valeurs réelles, exécuter les tests et extraire les résultats.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const BASELINE_DIR = path.join(rootDir, 'logs', 'garmin');
const BASELINE_FILE = path.join(BASELINE_DIR, 'perf-baseline.json');

// Créer le répertoire si nécessaire
if (!fs.existsSync(BASELINE_DIR)) {
  fs.mkdirSync(BASELINE_DIR, { recursive: true });
}

// Valeurs par défaut basées sur PERFORMANCE_BUDGET.md
const baseline = {
  tti: 2000,              // < 2.0s (budget)
  chartRender: 200,       // < 200ms (budget)
  indexedDBWrite: 5000,   // < 50ms * 100 opérations (budget)
  syncRoundTrip: 3000,    // < 3s (budget)
  lastUpdated: new Date().toISOString(),
  note: 'Baseline created with default values from PERFORMANCE_BUDGET.md. Run "npm run test:perf" to update with actual measurements.',
  source: 'default'
};

// Sauvegarder
fs.writeFileSync(BASELINE_FILE, JSON.stringify(baseline, null, 2), 'utf-8');

console.log('✅ Baseline saved to', BASELINE_FILE);
console.log('');
console.log('Note: This baseline contains default values from PERFORMANCE_BUDGET.md.');
console.log('To update with actual measurements:');
console.log('  1. Run: npm run test:perf');
console.log('  2. Extract metrics from test results');
console.log('  3. Update baseline manually or via script');

