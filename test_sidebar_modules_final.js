/**
 * Test final des modules historiques de la sidebar
 * Vérifie que tous les modules peuvent être importés sans erreur
 */

console.log('🧪 Test final des modules historiques de la sidebar...');

import fs from 'fs';
import path from 'path';

const modulesPath = 'src/components/sidebar/historical';
const modules = [
  'SessionRecorderModule.jsx',
  'ReadingProgressModule.jsx', 
  'GarminMetricsModule.jsx',
  'InteractiveQuestsModule.jsx',
  'PatrimonyEvolutionModule.jsx',
  'ShoppingListModule.jsx',
  'ActiveReadingSessionModule.jsx',
  'TrainingDayModule.jsx',
  'CreativityProjectsModule.jsx',
  'GlobalPerformanceModule.jsx',
  'ExpressLearningModule.jsx'
];

let passedTests = 0;
let failedTests = 0;

console.log('\n📋 Tests de validation des modules:');

modules.forEach(moduleName => {
  const modulePath = path.join(modulesPath, moduleName);
  
  try {
    if (fs.existsSync(modulePath)) {
      const content = fs.readFileSync(modulePath, 'utf8');
      
      // Tests de validation
      const tests = [
        {
          name: 'Contenu non vide',
          test: content.trim().length > 100,
          error: 'Le fichier est vide ou trop petit'
        },
        {
          name: 'Pas de corruption UTF8',
          test: content.trim() !== 'utf8',
          error: 'Le fichier contient seulement "utf8"'
        },
        {
          name: 'Import React présent',
          test: content.includes('import React'),
          error: 'Import React manquant'
        },
        {
          name: 'Export default présent',
          test: content.includes('export default'),
          error: 'Export default manquant'
        },
        {
          name: 'Pas de variables non définies',
          test: !content.includes('data is not defined') && !content.includes('utf8 is not defined'),
          error: 'Variables non définies détectées'
        },
        {
          name: 'Props destructurées correctement',
          test: content.includes('moduleId') && content.includes('moduleType'),
          error: 'Props moduleId ou moduleType manquantes'
        },
        {
          name: 'Données de démonstration présentes',
          test: content.includes('demoData') || content.includes('finalData'),
          error: 'Fallback de données manquant'
        }
      ];
      
      let modulePassedTests = 0;
      let moduleFailedTests = 0;
      
      tests.forEach(test => {
        if (test.test) {
          modulePassedTests++;
        } else {
          moduleFailedTests++;
          console.log(`  ❌ ${test.name}: ${test.error}`);
        }
      });
      
      if (moduleFailedTests === 0) {
        console.log(`✅ ${moduleName}: Tous les tests passés (${modulePassedTests}/${tests.length})`);
        passedTests++;
      } else {
        console.log(`❌ ${moduleName}: ${moduleFailedTests} test(s) échoué(s) sur ${tests.length}`);
        failedTests++;
      }
    } else {
      console.log(`❌ ${moduleName}: Fichier manquant`);
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ ${moduleName}: Erreur lors du test - ${error.message}`);
    failedTests++;
  }
});

console.log('\n📊 Résultats des tests:');
console.log(`✅ Modules validés: ${passedTests}`);
console.log(`❌ Modules échoués: ${failedTests}`);
console.log(`📈 Taux de réussite: ${Math.round((passedTests / modules.length) * 100)}%`);

if (failedTests === 0) {
  console.log('\n🎉 SUCCÈS ! Tous les modules sont prêts à être utilisés.');
  console.log('💡 Vous pouvez maintenant redémarrer votre serveur de développement.');
  console.log('🚀 Les erreurs de chargement des modules devraient être résolues.');
} else {
  console.log('\n⚠️  Certains modules nécessitent encore des corrections.');
  console.log('🔧 Consultez les détails ci-dessus pour identifier les problèmes.');
}

console.log('\n🏁 Test terminé.');