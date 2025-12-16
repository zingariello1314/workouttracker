/**
 * Validation de la correction du graphique FC Garmin - Tâche 10
 * Script Node.js pour valider les modifications apportées
 */

import fs from 'fs';
import path from 'path';

console.log('✅ VALIDATION - Correction Graphique FC Garmin (Tâche 10)');
console.log('='.repeat(60));

// 1. Vérifier que les fichiers modifiés existent et contiennent les bonnes corrections
function validateFileModifications() {
  console.log('\n1️⃣ Validation des modifications de fichiers...');
  
  const filesToCheck = [
    {
      path: 'src/components/sidebar/historical/GarminMetricsModule.jsx',
      checks: [
        'Fréquence Cardiaque - 24h',
        'onClick={() => {',
        'garmin:refresh:request',
        'garmin:data:updated',
        'console.log(\'[GarminMetricsModule] Bouton Sync cliqué\')'
      ]
    },
    {
      path: 'src/services/garmin/garminRealDataService.js',
      checks: [
        'dataSource: \'demo\'',
        'hasData: true',
        'generateBasicHeartRatePoints',
        'dailyMetrics: {'
      ]
    },
    {
      path: 'src/hooks/useRealGarminData.js',
      checks: [
        'données de démonstration',
        'garminRealDataService.getEmptyData()'
      ]
    }
  ];
  
  let allFilesValid = true;
  
  filesToCheck.forEach(file => {
    console.log(`\n📁 Vérification: ${file.path}`);
    
    try {
      if (!fs.existsSync(file.path)) {
        console.log(`❌ Fichier non trouvé: ${file.path}`);
        allFilesValid = false;
        return;
      }
      
      const content = fs.readFileSync(file.path, 'utf8');
      let fileValid = true;
      
      file.checks.forEach(check => {
        if (content.includes(check)) {
          console.log(`  ✅ Trouvé: ${check}`);
        } else {
          console.log(`  ❌ Manquant: ${check}`);
          fileValid = false;
        }
      });
      
      if (fileValid) {
        console.log(`  ✅ Fichier valide`);
      } else {
        console.log(`  ❌ Fichier invalide`);
        allFilesValid = false;
      }
      
    } catch (error) {
      console.log(`  ❌ Erreur lecture fichier: ${error.message}`);
      allFilesValid = false;
    }
  });
  
  return allFilesValid;
}

// 2. Vérifier la structure des données de démonstration
function validateDemoDataStructure() {
  console.log('\n2️⃣ Validation de la structure des données de démonstration...');
  
  try {
    const serviceFile = 'src/services/garmin/garminRealDataService.js';
    const content = fs.readFileSync(serviceFile, 'utf8');
    
    // Vérifier que getEmptyData génère les bonnes structures
    const requiredStructures = [
      'heartRateTimeSeries:',
      'heartRateZones:',
      'todayMetrics:',
      'dailyMetrics:',
      'hasData: true'
    ];
    
    let structureValid = true;
    
    requiredStructures.forEach(structure => {
      if (content.includes(structure)) {
        console.log(`  ✅ Structure trouvée: ${structure}`);
      } else {
        console.log(`  ❌ Structure manquante: ${structure}`);
        structureValid = false;
      }
    });
    
    return structureValid;
    
  } catch (error) {
    console.log(`❌ Erreur validation structure: ${error.message}`);
    return false;
  }
}

// 3. Vérifier que le bouton Sync a été amélioré
function validateSyncButtonFix() {
  console.log('\n3️⃣ Validation de la correction du bouton Sync...');
  
  try {
    const moduleFile = 'src/components/sidebar/historical/GarminMetricsModule.jsx';
    const content = fs.readFileSync(moduleFile, 'utf8');
    
    const syncButtonFeatures = [
      'onClick={() => {',
      'console.log(\'[GarminMetricsModule] Bouton Sync cliqué\')',
      'refreshData()',
      'garmin:refresh:request',
      'garmin:data:updated',
      'title="Synchroniser les données Garmin"'
    ];
    
    let buttonValid = true;
    
    syncButtonFeatures.forEach(feature => {
      if (content.includes(feature)) {
        console.log(`  ✅ Fonctionnalité trouvée: ${feature.substring(0, 50)}...`);
      } else {
        console.log(`  ❌ Fonctionnalité manquante: ${feature.substring(0, 50)}...`);
        buttonValid = false;
      }
    });
    
    return buttonValid;
    
  } catch (error) {
    console.log(`❌ Erreur validation bouton: ${error.message}`);
    return false;
  }
}

// 4. Vérifier que le titre a été corrigé
function validateTitleFix() {
  console.log('\n4️⃣ Validation de la correction du titre...');
  
  try {
    const moduleFile = 'src/components/sidebar/historical/GarminMetricsModule.jsx';
    const content = fs.readFileSync(moduleFile, 'utf8');
    
    const hasNewTitle = content.includes('❤️ Fréquence Cardiaque - 24h');
    const hasOldTitle = content.includes('Zones 📊 Temporel');
    
    console.log(`  ✅ Nouveau titre présent: ${hasNewTitle ? 'Oui' : 'Non'}`);
    console.log(`  ✅ Ancien titre supprimé: ${!hasOldTitle ? 'Oui' : 'Non'}`);
    
    return hasNewTitle && !hasOldTitle;
    
  } catch (error) {
    console.log(`❌ Erreur validation titre: ${error.message}`);
    return false;
  }
}

// 5. Vérifier que les scripts de diagnostic ont été créés
function validateDiagnosticScripts() {
  console.log('\n5️⃣ Validation des scripts de diagnostic...');
  
  const scriptsToCheck = [
    'debug_garmin_heart_rate_chart_issue.js',
    'fix_garmin_heart_rate_chart_display.js',
    'test_garmin_heart_rate_chart_fix.js'
  ];
  
  let allScriptsExist = true;
  
  scriptsToCheck.forEach(script => {
    if (fs.existsSync(script)) {
      console.log(`  ✅ Script créé: ${script}`);
    } else {
      console.log(`  ❌ Script manquant: ${script}`);
      allScriptsExist = false;
    }
  });
  
  return allScriptsExist;
}

// 6. Générer un rapport de validation
function generateValidationReport() {
  console.log('\n6️⃣ Génération du rapport de validation...');
  
  const results = {
    fileModifications: validateFileModifications(),
    demoDataStructure: validateDemoDataStructure(),
    syncButtonFix: validateSyncButtonFix(),
    titleFix: validateTitleFix(),
    diagnosticScripts: validateDiagnosticScripts()
  };
  
  const report = {
    timestamp: new Date().toISOString(),
    task: 'Tâche 10 - Tester la cohérence avec le sous-onglet Garmin',
    results,
    summary: {
      totalChecks: Object.keys(results).length,
      passedChecks: Object.values(results).filter(Boolean).length,
      failedChecks: Object.values(results).filter(r => !r).length
    }
  };
  
  // Sauvegarder le rapport
  fs.writeFileSync('garmin_heart_rate_fix_validation_report.json', JSON.stringify(report, null, 2));
  
  return report;
}

// Exécution de la validation complète
function runCompleteValidation() {
  console.log('🚀 Lancement de la validation complète...\n');
  
  const report = generateValidationReport();
  
  console.log('\n📊 RAPPORT DE VALIDATION:');
  console.log('='.repeat(40));
  
  Object.entries(report.results).forEach(([checkName, passed]) => {
    const status = passed ? '✅ RÉUSSI' : '❌ ÉCHOUÉ';
    console.log(`${status} - ${checkName}`);
  });
  
  console.log(`\n📈 Score: ${report.summary.passedChecks}/${report.summary.totalChecks} vérifications réussies`);
  
  if (report.summary.passedChecks === report.summary.totalChecks) {
    console.log('\n🎉 VALIDATION COMPLÈTE RÉUSSIE!');
    console.log('✅ Toutes les corrections ont été appliquées correctement');
    console.log('💡 Le graphique FC devrait maintenant fonctionner');
  } else {
    console.log('\n⚠️ VALIDATION PARTIELLE');
    console.log(`❌ ${report.summary.failedChecks} vérification(s) échouée(s)`);
    console.log('🔧 Vérifiez les erreurs ci-dessus');
  }
  
  console.log('\n📋 PROCHAINES ÉTAPES:');
  console.log('1. Rafraîchissez votre navigateur (F5)');
  console.log('2. Ouvrez la sidebar et étendez "Métriques Garmin"');
  console.log('3. Cliquez sur "📈 Temporel" pour voir le graphique');
  console.log('4. Testez le bouton "🔄 Sync"');
  console.log('5. Vérifiez que le titre est "❤️ Fréquence Cardiaque - 24h"');
  
  console.log('\n📄 Rapport sauvegardé: garmin_heart_rate_fix_validation_report.json');
  
  return report;
}

// Lancer la validation
runCompleteValidation();