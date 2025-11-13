/**
 * Script pour comparer les résultats de performance avec la baseline
 * 
 * Usage: node scripts/perf/compare-baseline.js [results-file]
 * 
 * @param {string} resultsFile - Fichier JSON avec les résultats des tests (optionnel)
 */

import fs from 'fs';
import path from 'path';

const BASELINE_FILE = path.join(process.cwd(), 'logs', 'garmin', 'perf-baseline.json');
const DEFAULT_RESULTS_FILE = path.join(process.cwd(), 'logs', 'garmin', 'perf-results.json');

function loadJSON(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load ${filePath}:`, error.message);
    return null;
  }
}

function compareMetric(current, baseline, metricName, threshold = 10) {
  if (!baseline || !baseline[metricName]) {
    console.log(`⚠️  ${metricName}: No baseline available`);
    return { isRegression: false, percentChange: 0 };
  }

  const baselineValue = baseline[metricName];
  const percentChange = ((current - baselineValue) / baselineValue) * 100;
  const isRegression = percentChange > threshold;

  const status = isRegression ? '❌' : '✅';
  const change = percentChange >= 0 ? '+' : '';
  console.log(
    `${status} ${metricName}: ${current.toFixed(0)}ms (${change}${percentChange.toFixed(1)}% vs baseline ${baselineValue}ms)`
  );

  return { isRegression, percentChange };
}

function main() {
  const resultsFile = process.argv[2] || DEFAULT_RESULTS_FILE;
  const baseline = loadJSON(BASELINE_FILE);
  const results = loadJSON(resultsFile);

  if (!baseline) {
    console.error('❌ Baseline not found. Run "npm run perf:baseline" first.');
    process.exit(1);
  }

  if (!results) {
    console.error(`❌ Results file not found: ${resultsFile}`);
    console.log('Run "npm run test:perf" first to generate results.');
    process.exit(1);
  }

  console.log('📊 Comparing performance results with baseline...\n');

  const comparisons = {
    tti: compareMetric(results.tti, baseline, 'tti'),
    chartRender: compareMetric(results.chartRender, baseline, 'chartRender'),
    indexedDBWrite: compareMetric(results.indexedDBWrite, baseline, 'indexedDBWrite'),
    syncRoundTrip: compareMetric(results.syncRoundTrip, baseline, 'syncRoundTrip')
  };

  const hasRegression = Object.values(comparisons).some(c => c.isRegression);

  console.log('');

  if (hasRegression) {
    console.log('❌ Performance regression detected!');
    console.log('Some metrics exceed the 10% threshold compared to baseline.');
    process.exit(1);
  } else {
    console.log('✅ All performance metrics are within acceptable range.');
    process.exit(0);
  }
}

main();

