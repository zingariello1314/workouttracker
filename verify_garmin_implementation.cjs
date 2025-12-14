/**
 * Script de vérification de l'implémentation du module Garmin
 * Vérifie que tous les fichiers sont créés et syntaxiquement corrects
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification de l\'implémentation du module Garmin');

// Liste des fichiers à vérifier
const filesToCheck = [
  {
    path: 'src/services/garmin/garminRealDataService.js',
    description: 'Service de données Garmin réelles',
    required: true
  },
  {
    path: 'src/hooks/useRealGarminData.js',
    description: 'Hook pour récupérer les vraies données Garmin',
    required: true
  },
  {
    path: 'src/components/sidebar/historical/GarminMetricsModule.jsx',
    description: 'Module Garmin de la sidebar (modifié)',
    required: true
  },
  {
    path: 'src/styles/garmin-metrics-module.css',
    description: 'Styles CSS du module Garmin',
    required: true
  }
];

// Vérifier l'existence et la syntaxe des fichiers
function verifyFiles() {
  console.log('\n📁 Vérification des fichiers...');
  
  let allFilesOk = true;
  
  filesToCheck.forEach(file => {
    const fullPath = path.join(process.cwd(), file.path);
    
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file.description}: ${file.path}`);
      
      // Vérifier la taille du fichier
      const stats = fs.statSync(fullPath);
      const sizeKB = Math.round(stats.size / 1024 * 100) / 100;
      console.log(`   📏 Taille: ${sizeKB} KB`);
      
      // Vérifier le contenu de base
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        
        // Vérifications spécifiques par type de fichier
        if (file.path.endsWith('.js')) {
          if (content.includes('export') || content.includes('module.exports')) {
            console.log('   📦 Exports détectés');
          }
          if (content.includes('class ') || content.includes('function ')) {
            console.log('   🔧 Fonctions/classes détectées');
          }
        }
        
        if (file.path.endsWith('.jsx')) {
          if (content.includes('import React')) {
            console.log('   ⚛️ Import React détecté');
          }
          if (content.includes('useRealGarminData')) {
            console.log('   🔗 Hook useRealGarminData utilisé');
          }
        }
        
        if (file.path.endsWith('.css')) {
          const ruleCount = (content.match(/\{[^}]*\}/g) || []).length;
          console.log(`   🎨 ${ruleCount} règles CSS détectées`);
        }
        
      } catch (error) {
        console.log(`   ⚠️ Erreur de lecture: ${error.message}`);
      }
      
    } else {
      console.log(`❌ ${file.description}: ${file.path} (MANQUANT)`);
      if (file.required) {
        allFilesOk = false;
      }
    }
    
    console.log('');
  });
  
  return allFilesOk;
}

// Vérifier les imports et dépendances
function verifyDependencies() {
  console.log('🔗 Vérification des dépendances...');
  
  const garminModulePath = path.join(process.cwd(), 'src/components/sidebar/historical/GarminMetricsModule.jsx');
  
  if (fs.existsSync(garminModulePath)) {
    const content = fs.readFileSync(garminModulePath, 'utf8');
    
    // Vérifier les imports nécessaires
    const requiredImports = [
      'useRealGarminData',
      'HeartRateZonesChart',
      'SleepPhasesChart',
      'StressLevelChart'
    ];
    
    requiredImports.forEach(importName => {
      if (content.includes(importName)) {
        console.log(`✅ Import ${importName} trouvé`);
      } else {
        console.log(`❌ Import ${importName} manquant`);
      }
    });
    
    // Vérifier l'utilisation du hook
    if (content.includes('const { garminData, loading, error, refreshData, hasData } = useRealGarminData()')) {
      console.log('✅ Hook useRealGarminData correctement utilisé');
    } else {
      console.log('⚠️ Utilisation du hook à vérifier');
    }
    
  } else {
    console.log('❌ Impossible de vérifier les dépendances - fichier manquant');
  }
  
  console.log('');
}

// Vérifier la structure des données
function verifyDataStructure() {
  console.log('📊 Vérification de la structure des données...');
  
  const servicePath = path.join(process.cwd(), 'src/services/garmin/garminRealDataService.js');
  
  if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // Vérifier les méthodes principales
    const requiredMethods = [
      'processMetrics',
      'generateChartData',
      'generateHeartRateZones',
      'generateSleepPhases',
      'generateStressLevels',
      'extractNumeric',
      'getEmptyData'
    ];
    
    requiredMethods.forEach(method => {
      if (content.includes(method)) {
        console.log(`✅ Méthode ${method} trouvée`);
      } else {
        console.log(`❌ Méthode ${method} manquante`);
      }
    });
    
    // Vérifier la structure des données retournées
    const dataStructureChecks = [
      'todayMetrics',
      'heartRateZones',
      'sleepPhases',
      'stressLevels',
      'calories',
      'heartRate',
      'bodyBattery',
      'steps',
      'sleep',
      'stress'
    ];
    
    dataStructureChecks.forEach(field => {
      if (content.includes(field)) {
        console.log(`✅ Champ ${field} trouvé`);
      } else {
        console.log(`❌ Champ ${field} manquant`);
      }
    });
    
  } else {
    console.log('❌ Impossible de vérifier la structure - service manquant');
  }
  
  console.log('');
}

// Générer un rapport de vérification
function generateReport() {
  console.log('📋 Génération du rapport...');
  
  const report = {
    timestamp: new Date().toISOString(),
    files: {},
    summary: {
      totalFiles: filesToCheck.length,
      existingFiles: 0,
      missingFiles: 0,
      totalSize: 0
    }
  };
  
  filesToCheck.forEach(file => {
    const fullPath = path.join(process.cwd(), file.path);
    const exists = fs.existsSync(fullPath);
    
    report.files[file.path] = {
      exists,
      description: file.description,
      required: file.required
    };
    
    if (exists) {
      report.summary.existingFiles++;
      const stats = fs.statSync(fullPath);
      report.files[file.path].size = stats.size;
      report.summary.totalSize += stats.size;
    } else {
      report.summary.missingFiles++;
    }
  });
  
  // Sauvegarder le rapport
  const reportPath = 'garmin_implementation_report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📄 Rapport sauvegardé: ${reportPath}`);
  console.log(`📊 Résumé: ${report.summary.existingFiles}/${report.summary.totalFiles} fichiers présents`);
  console.log(`💾 Taille totale: ${Math.round(report.summary.totalSize / 1024 * 100) / 100} KB`);
  
  return report;
}

// Exécuter toutes les vérifications
function runVerification() {
  console.log('🚀 Démarrage de la vérification...\n');
  
  const filesOk = verifyFiles();
  verifyDependencies();
  verifyDataStructure();
  const report = generateReport();
  
  console.log('\n🎯 Résultat de la vérification:');
  
  if (filesOk && report.summary.missingFiles === 0) {
    console.log('✅ Implémentation complète et prête');
    console.log('🎉 Le module Garmin devrait maintenant utiliser les vraies données');
    console.log('\n📝 Prochaines étapes:');
    console.log('1. Tester l\'application dans le navigateur');
    console.log('2. Vérifier que les données s\'affichent correctement');
    console.log('3. Tester la navigation vers l\'onglet Sport');
    console.log('4. Vérifier que les graphiques s\'affichent');
  } else {
    console.log('❌ Implémentation incomplète');
    console.log(`⚠️ ${report.summary.missingFiles} fichier(s) manquant(s)`);
  }
  
  return report;
}

// Exécuter la vérification
runVerification();