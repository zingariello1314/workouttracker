/**
 * Test en temps réel des graphiques Garmin
 * À exécuter dans la console du navigateur pour vérifier l'affichage
 */

console.log('🔍 TEST EN TEMPS RÉEL - GRAPHIQUES GARMIN');

// Fonction pour injecter les données de test dans l'application
function injectGarminTestData() {
  console.log('💉 Injection des données de test Garmin...');
  
  // Données de test complètes
  const testData = {
    sport: {
      todayMetrics: {
        calories: { active: 450, resting: 1200, total: 1650 },
        bodyBattery: 75,
        steps: 8500,
        heartRate: { resting: 65, average: 85, max: 145 },
        sleep: { duration: 405, quality: 'good' }
      }
    },
    garmin: {
      calories: { active: 450, resting: 1200, total: 1650 },
      bodyBattery: 75,
      steps: 8500,
      heartRate: { resting: 65, average: 85, max: 145 },
      sleep: { duration: 405, quality: 'good' }
    },
    // DONNÉES CRITIQUES pour les graphiques
    heartRateZones: [
      { zone: 1, name: 'Récupération', min: 0, max: 130, time: 120, color: '#4ade80' },
      { zone: 2, name: 'Aérobie léger', min: 130, max: 140, time: 45, color: '#22d3ee' },
      { zone: 3, name: 'Aérobie', min: 140, max: 150, time: 30, color: '#fbbf24' },
      { zone: 4, name: 'Seuil', min: 150, max: 165, time: 15, color: '#f97316' },
      { zone: 5, name: 'Neuromusculaire', min: 165, max: 190, time: 5, color: '#ef4444' }
    ],
    sleepPhases: [
      { phase: 'Éveil', duration: 15, quality: 'normal', color: '#ef4444' },
      { phase: 'Léger', duration: 180, quality: 'good', color: '#22d3ee' },
      { phase: 'Profond', duration: 120, quality: 'excellent', color: '#4ade80' },
      { phase: 'REM', duration: 90, quality: 'good', color: '#8b5cf6' }
    ],
    stressLevels: [
      { time: '06:00', level: 25, category: 'Repos' },
      { time: '08:00', level: 45, category: 'Faible' },
      { time: '10:00', level: 65, category: 'Modéré' },
      { time: '12:00', level: 80, category: 'Élevé' },
      { time: '14:00', level: 55, category: 'Modéré' },
      { time: '16:00', level: 70, category: 'Élevé' },
      { time: '18:00', level: 35, category: 'Faible' },
      { time: '20:00', level: 20, category: 'Repos' }
    ],
    maxHeartRate: 190,
    userAge: 30,
    sleepObjective: 480
  };
  
  // Émettre un événement personnalisé pour forcer la mise à jour
  const event = new CustomEvent('garmin:test:data:inject', {
    detail: testData
  });
  
  window.dispatchEvent(event);
  
  console.log('✅ Données injectées:', testData);
  return testData;
}

// Fonction pour vérifier l'état actuel des graphiques
function checkGarminChartsStatus() {
  console.log('🔍 Vérification de l\'état des graphiques Garmin...');
  
  // Chercher le module Garmin
  const garminModule = document.querySelector('[class*="sidebar-section"]:has([class*="sidebar-section-title"]:contains("Métriques Garmin"))') ||
                     document.querySelector('.sidebar-section:has(.sidebar-section-title)') ||
                     document.querySelector('[data-module="garmin-metrics"]');
  
  if (!garminModule) {
    console.log('❌ Module Garmin non trouvé dans le DOM');
    return false;
  }
  
  console.log('✅ Module Garmin trouvé:', garminModule);
  
  // Vérifier si le module est étendu
  const isExpanded = garminModule.classList.contains('expanded') || 
                    garminModule.querySelector('.sidebar-section-content');
  
  console.log(`📊 Module étendu: ${isExpanded ? 'OUI' : 'NON'}`);
  
  if (!isExpanded) {
    console.log('💡 Cliquer sur le module pour l\'étendre');
    const header = garminModule.querySelector('.sidebar-section-header');
    if (header) {
      header.click();
      console.log('🖱️ Clic simulé sur l\'en-tête');
    }
  }
  
  // Attendre un peu puis vérifier les graphiques
  setTimeout(() => {
    checkChartsInModule(garminModule);
  }, 500);
  
  return true;
}

// Fonction pour vérifier les graphiques dans le module
function checkChartsInModule(module) {
  console.log('📊 Vérification des graphiques dans le module...');
  
  // Chercher les conteneurs de graphiques
  const chartContainers = module.querySelectorAll('.chart-container');
  const garminChartsSection = module.querySelector('.garmin-charts-section');
  const emptyState = module.querySelector('.charts-empty-state');
  
  console.log(`📈 Conteneurs de graphiques trouvés: ${chartContainers.length}`);
  console.log(`📊 Section graphiques Garmin: ${garminChartsSection ? 'TROUVÉE' : 'NON TROUVÉE'}`);
  console.log(`📝 État vide: ${emptyState ? 'AFFICHÉ' : 'MASQUÉ'}`);
  
  if (emptyState && !emptyState.style.display === 'none') {
    console.log('⚠️ PROBLÈME: Message d\'état vide affiché');
    console.log('📝 Message:', emptyState.textContent);
    return false;
  }
  
  if (chartContainers.length === 0) {
    console.log('❌ PROBLÈME: Aucun graphique trouvé');
    return false;
  }
  
  // Vérifier chaque graphique
  const expectedCharts = [
    'HeartRateZonesChart',
    'SleepPhasesChart', 
    'StressLevelChart'
  ];
  
  expectedCharts.forEach((chartName, index) => {
    const container = chartContainers[index];
    if (container) {
      const chart = container.querySelector('svg') || container.querySelector('canvas') || container.querySelector('[class*="chart"]');
      console.log(`📊 ${chartName}: ${chart ? '✅ RENDU' : '❌ NON RENDU'}`);
      
      if (chart) {
        const rect = chart.getBoundingClientRect();
        console.log(`   Dimensions: ${rect.width}x${rect.height}`);
      }
    } else {
      console.log(`📊 ${chartName}: ❌ CONTENEUR MANQUANT`);
    }
  });
  
  return chartContainers.length === 3;
}

// Fonction pour forcer le re-render du module
function forceGarminModuleRerender() {
  console.log('🔄 Forçage du re-render du module Garmin...');
  
  // Émettre des événements de mise à jour
  const events = [
    'garmin:refresh:request',
    'sidebar:data:refresh',
    'garmin:data:updated'
  ];
  
  events.forEach(eventName => {
    const event = new CustomEvent(eventName, {
      detail: { source: 'test', timestamp: Date.now() }
    });
    window.dispatchEvent(event);
    console.log(`📡 Événement émis: ${eventName}`);
  });
  
  // Attendre puis vérifier
  setTimeout(() => {
    checkGarminChartsStatus();
  }, 1000);
}

// Fonction principale de test
function runLiveTest() {
  console.log('🚀 Démarrage du test en temps réel...');
  
  // 1. Injecter les données de test
  const testData = injectGarminTestData();
  
  // 2. Attendre un peu puis vérifier
  setTimeout(() => {
    console.log('\n🔍 Vérification après injection...');
    const success = checkGarminChartsStatus();
    
    if (!success) {
      console.log('\n🔄 Tentative de forçage du re-render...');
      forceGarminModuleRerender();
    }
  }, 1000);
  
  // 3. Instructions pour l'utilisateur
  console.log('\n📋 INSTRUCTIONS:');
  console.log('1. Ouvrir la sidebar premium');
  console.log('2. Chercher le module "Métriques Garmin"');
  console.log('3. Cliquer pour l\'étendre');
  console.log('4. Vérifier la présence des 3 graphiques');
  console.log('\n🔧 Si les graphiques ne s\'affichent pas:');
  console.log('- Exécuter: forceGarminModuleRerender()');
  console.log('- Vérifier la console pour les erreurs');
  console.log('- Rafraîchir la page et réessayer');
}

// Fonctions utilitaires pour le debug
window.garminTestUtils = {
  injectTestData: injectGarminTestData,
  checkStatus: checkGarminChartsStatus,
  forceRerender: forceGarminModuleRerender,
  runTest: runLiveTest
};

// Message d'aide
console.log('\n🛠️ UTILITAIRES DISPONIBLES:');
console.log('- garminTestUtils.runTest() - Lancer le test complet');
console.log('- garminTestUtils.injectTestData() - Injecter les données');
console.log('- garminTestUtils.checkStatus() - Vérifier l\'état');
console.log('- garminTestUtils.forceRerender() - Forcer le re-render');

// Lancer automatiquement le test
runLiveTest();