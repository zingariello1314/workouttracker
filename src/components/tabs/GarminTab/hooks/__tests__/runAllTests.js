/**
 * 🔴 FIX #40: Script pour exécuter tous les tests des hooks React
 * Exécution simple sans framework complexe
 */

import { testUseAdvancedFilters } from './useAdvancedFilters.test.js';
import { testUseGarminData } from './useGarminData.test.js';
import { testUseAutoSync } from './useAutoSync.test.js';
import { testFullSyncFlow } from './integration.test.js';

/**
 * Exécute tous les tests et affiche les résultats
 */
export async function runAllTests() {
  console.log('🧪 Démarrage des tests unitaires...\n');
  
  const allResults = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: useAdvancedFilters
  console.log('📋 Test de useAdvancedFilters...');
  const filtersResults = testUseAdvancedFilters();
  allResults.total += filtersResults.passed + filtersResults.failed;
  allResults.passed += filtersResults.passed;
  allResults.failed += filtersResults.failed;
  allResults.tests.push(...filtersResults.tests.map(t => ({ ...t, suite: 'useAdvancedFilters' })));
  console.log(`✅ ${filtersResults.passed} passé(s), ❌ ${filtersResults.failed} échoué(s)\n`);

  // Test 2: useGarminData
  console.log('📋 Test de useGarminData...');
  const dataResults = testUseGarminData();
  allResults.total += dataResults.passed + dataResults.failed;
  allResults.passed += dataResults.passed;
  allResults.failed += dataResults.failed;
  allResults.tests.push(...dataResults.tests.map(t => ({ ...t, suite: 'useGarminData' })));
  console.log(`✅ ${dataResults.passed} passé(s), ❌ ${dataResults.failed} échoué(s)\n`);

  // Test 3: useAutoSync
  console.log('📋 Test de useAutoSync...');
  const syncResults = testUseAutoSync();
  allResults.total += syncResults.passed + syncResults.failed;
  allResults.passed += syncResults.passed;
  allResults.failed += syncResults.failed;
  allResults.tests.push(...syncResults.tests.map(t => ({ ...t, suite: 'useAutoSync' })));
  console.log(`✅ ${syncResults.passed} passé(s), ❌ ${syncResults.failed} échoué(s)\n`);

  // Test 4: Tests d'intégration
  console.log('📋 Tests d\'intégration...');
  const integrationResults = await testFullSyncFlow();
  allResults.total += integrationResults.passed + integrationResults.failed;
  allResults.passed += integrationResults.passed;
  allResults.failed += integrationResults.failed;
  allResults.tests.push(...integrationResults.tests.map(t => ({ ...t, suite: 'integration' })));
  console.log(`✅ ${integrationResults.passed} passé(s), ❌ ${integrationResults.failed} échoué(s)\n`);

  // Résumé
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('═══════════════════════════════════════');
  console.log(`Total: ${allResults.total}`);
  console.log(`✅ Passés: ${allResults.passed}`);
  console.log(`❌ Échoués: ${allResults.failed}`);
  console.log(`📈 Taux de réussite: ${((allResults.passed / allResults.total) * 100).toFixed(1)}%`);
  console.log('═══════════════════════════════════════\n');

  // Détails des échecs
  const failedTests = allResults.tests.filter(t => t.status === 'FAIL');
  if (failedTests.length > 0) {
    console.log('❌ TESTS ÉCHOUÉS:\n');
    failedTests.forEach(test => {
      console.log(`  - ${test.suite}::${test.name}`);
      if (test.error) {
        console.log(`    Erreur: ${test.error}`);
      }
    });
    console.log('');
  }

  return allResults;
}

// Exporter pour utilisation dans la console ou un test runner
if (typeof window !== 'undefined') {
  window.runAllGarminTests = runAllTests;
}

// Exécuter automatiquement si importé directement
if (import.meta.url === `file://${process.cwd()}/src/components/tabs/GarminTab/hooks/__tests__/runAllTests.js`) {
  runAllTests();
}

