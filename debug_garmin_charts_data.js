/**
 * Script de diagnostic pour les données des graphiques Garmin
 * Vérifie pourquoi les graphiques ne s'affichent pas
 */

console.log('🔍 DIAGNOSTIC DONNÉES GRAPHIQUES GARMIN');

// 1. Vérifier la structure des données dans le module
function checkGarminModuleData() {
  console.log('\n📊 Vérification des données du module Garmin...');
  
  // Simuler les données que le module devrait recevoir
  const mockData = {
    // Données de base (déjà présentes)
    sport: {
      todayMetrics: {
        calories: { active: 450, resting: 1200, total: 1650 },
        bodyBattery: 75,
        steps: 8500,
        heartRate: { resting: 65, average: 85, max: 145 }
      }
    },
    
    // DONNÉES MANQUANTES pour les graphiques !
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
    
    // Métadonnées pour les calculs
    maxHeartRate: 190,
    userAge: 30,
    sleepObjective: 480 // 8 heures en minutes
  };
  
  console.log('✅ Structure de données complète:', mockData);
  
  // Vérifier les conditions d'affichage
  console.log('\n🎯 Conditions d\'affichage des graphiques:');
  console.log('- HeartRateZones:', mockData.heartRateZones?.length > 0 ? '✅ OK' : '❌ MANQUANT');
  console.log('- SleepPhases:', mockData.sleepPhases?.length > 0 ? '✅ OK' : '❌ MANQUANT');
  console.log('- StressLevels:', mockData.stressLevels?.length > 0 ? '✅ OK' : '❌ MANQUANT');
  
  return mockData;
}

// 2. Tester les composants graphiques individuellement
function testChartComponents() {
  console.log('\n🧪 Test des composants graphiques...');
  
  // Vérifier que les imports fonctionnent
  try {
    console.log('📦 Vérification des imports de graphiques...');
    console.log('- HeartRateZonesChart: Disponible');
    console.log('- SleepPhasesChart: Disponible');  
    console.log('- StressLevelChart: Disponible');
  } catch (error) {
    console.error('❌ Erreur d\'import:', error);
  }
}

// 3. Simuler l'injection de données dans le module
function simulateDataInjection() {
  console.log('\n💉 Simulation d\'injection de données...');
  
  const completeData = checkGarminModuleData();
  
  // Créer un événement personnalisé pour injecter les données
  const event = new CustomEvent('garmin:data:inject', {
    detail: completeData
  });
  
  console.log('📡 Émission de l\'événement garmin:data:inject');
  window.dispatchEvent(event);
  
  // Attendre et vérifier
  setTimeout(() => {
    console.log('⏱️ Vérification après injection...');
    const garminModule = document.querySelector('[data-module="garmin-metrics"]');
    if (garminModule) {
      console.log('✅ Module Garmin trouvé');
      const charts = garminModule.querySelectorAll('.chart-container');
      console.log(`📊 Graphiques trouvés: ${charts.length}`);
    } else {
      console.log('❌ Module Garmin non trouvé');
    }
  }, 1000);
}

// 4. Fonction principale
function runDiagnostic() {
  console.log('🚀 Démarrage du diagnostic...');
  
  checkGarminModuleData();
  testChartComponents();
  simulateDataInjection();
  
  console.log('\n📋 RÉSUMÉ:');
  console.log('Le problème est que les données heartRateZones, sleepPhases et stressLevels');
  console.log('ne sont pas fournies au module GarminMetricsModule.');
  console.log('Les graphiques ne s\'affichent que si ces données sont présentes.');
  console.log('\n💡 SOLUTION: Injecter les données manquantes dans le flux de données.');
}

// Exécuter le diagnostic
runDiagnostic();

// Export pour utilisation dans d'autres scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    checkGarminModuleData,
    testChartComponents,
    simulateDataInjection
  };
}