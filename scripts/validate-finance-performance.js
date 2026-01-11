/**
 * Script de Validation Performance - Module Finance
 * 
 * ✅ PHASE 4 - Étape 4.1 : Tests performance automatisés
 * 
 * Mesure et valide les métriques de performance du module Finance
 * 
 * Usage: node scripts/validate-finance-performance.js
 */

import { getFinancePerformanceMetrics, exportFinancePerformanceMetrics } from '../src/hooks/useFinancePerformance.js';

console.log('📊 Validation Performance - Module Finance\n');
console.log('='.repeat(60));

// Obtenir métriques
const metrics = getFinancePerformanceMetrics();

// Afficher résultats
console.log('\n📈 MÉTRIQUES COMPOSANTS\n');
console.log('Temps de chargement moyen:');
Object.entries(metrics.components.loadTimes).forEach(([component, time]) => {
  const status = time < 500 ? '✅' : time < 1000 ? '⚠️' : '❌';
  console.log(`  ${status} ${component}: ${time.toFixed(2)}ms`);
});

console.log('\n🔄 RE-RENDERS\n');
console.log('Nombre de re-renders:');
Object.entries(metrics.components.renderCounts).forEach(([component, count]) => {
  const status = count <= 3 ? '✅' : count <= 10 ? '⚠️' : '❌';
  console.log(`  ${status} ${component}: ${count} re-renders`);
});

console.log('\n🌐 APPELS API\n');
console.log(`Total: ${metrics.api.total}`);
console.log(`Durée moyenne: ${metrics.api.avgDuration.toFixed(2)}ms`);
console.log('\nPar endpoint:');
Object.entries(metrics.api.byEndpoint).forEach(([endpoint, stats]) => {
  const avgDuration = stats.totalDuration / stats.count;
  console.log(`  ${endpoint}: ${stats.count} appels, ${avgDuration.toFixed(2)}ms moyenne`);
});

console.log('\n💾 STORAGE\n');
console.log(`IndexedDB: ${(metrics.storage.indexedDB / 1024 / 1024).toFixed(2)} MB`);
console.log(`localStorage: ${(metrics.storage.localStorage / 1024).toFixed(2)} KB`);

// Critères de succès
console.log('\n✅ CRITÈRES DE SUCCÈS\n');
const criteria = {
  loadTime: Object.values(metrics.components.loadTimes).every(t => t < 1000),
  renderCount: Object.values(metrics.components.renderCounts).every(c => c <= 10),
  apiCalls: metrics.api.avgDuration < 500
};

Object.entries(criteria).forEach(([criterion, passed]) => {
  console.log(`  ${passed ? '✅' : '❌'} ${criterion}: ${passed ? 'PASS' : 'FAIL'}`);
});

// Export JSON
const json = exportFinancePerformanceMetrics();
console.log('\n📄 Export JSON disponible via exportFinancePerformanceMetrics()');

console.log('\n' + '='.repeat(60));
console.log('✅ Validation terminée\n');
