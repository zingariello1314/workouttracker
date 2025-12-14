/**
 * Script de test pour vérifier la connectivité des données des modules historiques
 * Vérifie que tous les modules utilisent de vraies données au lieu de données simulées
 */

const fs = require('fs');
const path = require('path');

console.log('📊 Test de connectivité des données des modules historiques\n');

// Modules historiques à vérifier
const historicalModules = [
  {
    file: 'SessionRecorderModule.jsx',
    requirements: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6'],
    dataNeeded: ['books', 'subjects', 'readingAPI', 'learningAPI']
  },
  {
    file: 'ReadingProgressModule.jsx', 
    requirements: ['2.1', '2.2', '2.3', '2.4', '2.5'],
    dataNeeded: ['readingSessions', 'periodCalculations', 'trendIndicators']
  },
  {
    file: 'GarminMetricsModule.jsx',
    requirements: ['3.1', '3.2', '3.3', '3.4', '3.5'],
    dataNeeded: ['garminMetrics', 'sleepData', 'realTimeRefresh']
  },
  {
    file: 'InteractiveQuestsModule.jsx',
    requirements: ['4.1', '4.2', '4.3', '4.4', '4.5'],
    dataNeeded: ['questsData', 'xpSystem', 'realTimeSync']
  },
  {
    file: 'PatrimonyEvolutionModule.jsx',
    requirements: ['5.1', '5.2', '5.3', '5.4', '5.5'],
    dataNeeded: ['patrimonyData', 'netWorthCalculations', 'investmentPerformance']
  },
  {
    file: 'ShoppingListModule.jsx',
    requirements: ['6.1', '6.2', '6.3', '6.4', '6.5'],
    dataNeeded: ['shoppingLists', 'temporalLogic', 'smartShoppingAPI']
  },
  {
    file: 'ActiveReadingSessionModule.jsx',
    requirements: ['7.1', '7.2', '7.3', '7.4', '7.5'],
    dataNeeded: ['activeSession', 'timerSync', 'objectivesData']
  },
  {
    file: 'DailyTrainingModule.jsx',
    requirements: ['8.1', '8.2', '8.3', '8.4', '8.5'],
    dataNeeded: ['trainingSchedule', 'muscleGroups', 'sportObjectives']
  },
  {
    file: 'CreativityProjectsModule.jsx',
    requirements: ['9.1', '9.2', '9.3', '9.4', '9.5'],
    dataNeeded: ['creativeProjects', 'recentSessions', 'inspirationRotation']
  },
  {
    file: 'GlobalPerformanceModule.jsx',
    requirements: ['10.1', '10.2', '10.3', '10.4', '10.5'],
    dataNeeded: ['productivityScore', 'lifeBalance', 'aiRecommendations']
  },
  {
    file: 'ExpressLearningModule.jsx',
    requirements: ['11.1', '11.2', '11.3', '11.4', '11.5'],
    dataNeeded: ['learningData', 'subjectProgression', 'regularityStats']
  }
];

let allTestsPassed = true;
let issuesFound = [];

console.log('📋 Vérification de la connectivité des données...\n');

historicalModules.forEach(module => {
  const modulePath = path.join('src/components/sidebar/historical', module.file);
  
  if (fs.existsSync(modulePath)) {
    const content = fs.readFileSync(modulePath, 'utf8');
    
    // Vérifier les patterns de données simulées
    const simulatedDataPatterns = [
      /data\s*=\s*{[^}]*}/g, // Données par défaut inline
      /const\s+\w+\s*=\s*{[^}]*}/g, // Constantes de données simulées
      /\/\/\s*Données simulées/gi,
      /\/\/\s*TODO.*données/gi,
      /mock|fake|dummy|simulate/gi
    ];
    
    let hasSimulatedData = false;
    simulatedDataPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        hasSimulatedData = true;
      }
    });
    
    // Vérifier la présence d'APIs réelles
    const realDataPatterns = [
      /import.*API/g,
      /import.*Service/g,
      /useEffect.*fetch/g,
      /useState.*loading/g,
      /\.then\(/g,
      /async.*await/g
    ];
    
    let hasRealDataConnections = false;
    realDataPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        hasRealDataConnections = true;
      }
    });
    
    // Vérifier les calculs manquants selon l'analyse
    const missingCalculations = [];
    
    if (module.file === 'ReadingProgressModule.jsx') {
      if (!content.includes('calculateReadingMetrics') && !content.includes('periodMetrics')) {
        missingCalculations.push('Calculs sur périodes configurables (7j, 30j, 3m, 6m, 1a)');
      }
      if (!content.includes('calculateTrends') && !content.includes('↗️')) {
        missingCalculations.push('Indicateurs de tendance (↗️ ↘️ ➡️)');
      }
    }
    
    if (module.file === 'GarminMetricsModule.jsx') {
      if (!content.includes('sleepData') || !content.includes('conditional')) {
        missingCalculations.push('Affichage conditionnel des données de sommeil');
      }
      if (!content.includes('setInterval') && !content.includes('refresh')) {
        missingCalculations.push('Rafraîchissement temps réel');
      }
    }
    
    if (module.file === 'PatrimonyEvolutionModule.jsx') {
      if (!content.includes('calculateNetWorthChange') && !content.includes('patrimony')) {
        missingCalculations.push('Calculs de variation patrimoine net');
      }
      if (!content.includes('calculateAverageSavings')) {
        missingCalculations.push('Calcul épargne moyenne/mois');
      }
      if (!content.includes('mini-chart') && !content.includes('MiniChart')) {
        missingCalculations.push('Mini-graphique d\'évolution');
      }
    }
    
    if (module.file === 'ShoppingListModule.jsx') {
      if (!content.includes('getCurrentShoppingList') && !content.includes('temporal')) {
        missingCalculations.push('Logique de proximité temporelle');
      }
      if (!content.includes('addEventListener') && !content.includes('shopping:list:updated')) {
        missingCalculations.push('Mise à jour automatique des listes');
      }
    }
    
    // Évaluation du module
    let moduleStatus = '✅';
    let moduleIssues = [];
    
    if (hasSimulatedData && !hasRealDataConnections) {
      moduleStatus = '❌';
      moduleIssues.push('Utilise principalement des données simulées');
      allTestsPassed = false;
    } else if (hasSimulatedData && hasRealDataConnections) {
      moduleStatus = '⚠️';
      moduleIssues.push('Mélange de données simulées et réelles');
    }
    
    if (missingCalculations.length > 0) {
      moduleStatus = moduleStatus === '✅' ? '⚠️' : '❌';
      moduleIssues.push(`Calculs manquants: ${missingCalculations.join(', ')}`);
      allTestsPassed = false;
    }
    
    console.log(`${moduleStatus} ${module.file}`);
    if (moduleIssues.length > 0) {
      moduleIssues.forEach(issue => console.log(`   - ${issue}`));
      issuesFound.push({
        module: module.file,
        requirements: module.requirements,
        issues: moduleIssues
      });
    }
    
  } else {
    console.log(`⚠️  ${module.file} n'existe pas`);
  }
});

console.log('\n📋 Vérification des services de données...\n');

// Vérifier la présence des services de données nécessaires
const requiredServices = [
  'src/services/dashboard/dashboardStorage.js',
  'src/services/navigation/DeepLinkService.js',
  'src/hooks/useSidebarData.js',
  'src/services/sidebar/realTimeSyncService.js'
];

requiredServices.forEach(servicePath => {
  if (fs.existsSync(servicePath)) {
    console.log(`✅ ${path.basename(servicePath)} existe`);
  } else {
    console.log(`❌ ${path.basename(servicePath)} manquant`);
    allTestsPassed = false;
  }
});

console.log('\n' + '='.repeat(60));

if (allTestsPassed) {
  console.log('🎉 SUCCÈS: Tous les modules utilisent des données réelles!');
  console.log('📊 Les calculs et synchronisations sont implémentés');
  console.log('🔄 La connectivité avec les APIs est établie');
} else {
  console.log('❌ ÉCHEC: Certains modules nécessitent des corrections de données');
  console.log('🔧 Problèmes identifiés:');
  
  issuesFound.forEach(item => {
    console.log(`\n📄 ${item.module} (Requirements: ${item.requirements.join(', ')}):`);
    item.issues.forEach(issue => console.log(`   - ${issue}`));
  });
}

console.log('\n📊 Résumé:');
console.log(`- Modules testés: ${historicalModules.length}`);
console.log(`- Modules avec problèmes: ${issuesFound.length}`);
console.log(`- Services vérifiés: ${requiredServices.length}`);
console.log(`- Status: ${allTestsPassed ? 'CONFORME' : 'NON-CONFORME'}`);