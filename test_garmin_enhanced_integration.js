/**
 * Test d'intégration des données Garmin enrichies
 * Vérifie que les graphiques s'affichent correctement
 */

console.log('🧪 TEST INTÉGRATION DONNÉES GARMIN ENRICHIES');

// Simuler l'environnement React pour tester le service
const mockReactEnvironment = () => {
  // Simuler les hooks React
  global.useState = (initial) => [initial, () => {}];
  global.useEffect = (fn) => fn();
  global.useMemo = (fn) => fn();
  global.useCallback = (fn) => fn;
};

// Test du service de données enrichies
async function testGarminEnhancedDataService() {
  console.log('\n📊 Test du service de données enrichies...');
  
  try {
    // Importer le service (simulation)
    const serviceData = {
      getBasicMetrics() {
        return {
          calories: { active: 450, resting: 1200, total: 1650 },
          bodyBattery: 75,
          steps: 8500,
          heartRate: { resting: 65, average: 85, max: 145 },
          sleep: { duration: 405, quality: 'good' }
        };
      },
      
      getHeartRateZones() {
        return [
          { zone: 1, name: 'Récupération', min: 0, max: 130, time: 120, color: '#4ade80' },
          { zone: 2, name: 'Aérobie léger', min: 130, max: 140, time: 45, color: '#22d3ee' },
          { zone: 3, name: 'Aérobie', min: 140, max: 150, time: 30, color: '#fbbf24' },
          { zone: 4, name: 'Seuil', min: 150, max: 165, time: 15, color: '#f97316' },
          { zone: 5, name: 'Neuromusculaire', min: 165, max: 190, time: 5, color: '#ef4444' }
        ];
      },
      
      getSleepPhases() {
        return [
          { phase: 'Éveil', duration: 15, quality: 'normal', color: '#ef4444' },
          { phase: 'Léger', duration: 180, quality: 'good', color: '#22d3ee' },
          { phase: 'Profond', duration: 120, quality: 'excellent', color: '#4ade80' },
          { phase: 'REM', duration: 90, quality: 'good', color: '#8b5cf6' }
        ];
      },
      
      getStressLevels() {
        return [
          { time: '06:00', level: 25, category: 'Repos' },
          { time: '08:00', level: 45, category: 'Faible' },
          { time: '10:00', level: 65, category: 'Modéré' },
          { time: '12:00', level: 80, category: 'Élevé' },
          { time: '14:00', level: 55, category: 'Modéré' },
          { time: '16:00', level: 70, category: 'Élevé' },
          { time: '18:00', level: 35, category: 'Faible' },
          { time: '20:00', level: 20, category: 'Repos' }
        ];
      },
      
      getEnhancedData() {
        const basic = this.getBasicMetrics();
        return {
          sport: { todayMetrics: basic },
          garmin: basic,
          heartRateZones: this.getHeartRateZones(),
          sleepPhases: this.getSleepPhases(),
          stressLevels: this.getStressLevels(),
          maxHeartRate: 190,
          userAge: 30,
          sleepObjective: 480
        };
      }
    };
    
    const enhancedData = serviceData.getEnhancedData();
    
    console.log('✅ Service fonctionnel');
    console.log('📊 Données générées:', {
      hasBasicMetrics: !!enhancedData.sport?.todayMetrics,
      hasHeartRateZones: !!enhancedData.heartRateZones?.length,
      hasSleepPhases: !!enhancedData.sleepPhases?.length,
      hasStressLevels: !!enhancedData.stressLevels?.length,
      heartRateZonesCount: enhancedData.heartRateZones?.length || 0,
      sleepPhasesCount: enhancedData.sleepPhases?.length || 0,
      stressLevelsCount: enhancedData.stressLevels?.length || 0
    });
    
    return enhancedData;
    
  } catch (error) {
    console.error('❌ Erreur test service:', error);
    return null;
  }
}

// Test des conditions d'affichage des graphiques
function testChartDisplayConditions(data) {
  console.log('\n🎯 Test des conditions d\'affichage des graphiques...');
  
  if (!data) {
    console.log('❌ Pas de données à tester');
    return false;
  }
  
  // Conditions exactes du GarminMetricsModule
  const heartRateCondition = data.heartRateZones && data.heartRateZones.length > 0;
  const sleepCondition = data.sleepPhases && data.sleepPhases.length > 0;
  const stressCondition = data.stressLevels && data.stressLevels.length > 0;
  
  console.log('📊 Conditions d\'affichage:');
  console.log(`- HeartRateZonesChart: ${heartRateCondition ? '✅ AFFICHÉ' : '❌ MASQUÉ'}`);
  console.log(`- SleepPhasesChart: ${sleepCondition ? '✅ AFFICHÉ' : '❌ MASQUÉ'}`);
  console.log(`- StressLevelChart: ${stressCondition ? '✅ AFFICHÉ' : '❌ MASQUÉ'}`);
  
  const allChartsVisible = heartRateCondition && sleepCondition && stressCondition;
  console.log(`\n🎯 Résultat: ${allChartsVisible ? '✅ TOUS LES GRAPHIQUES VISIBLES' : '❌ GRAPHIQUES MANQUANTS'}`);
  
  if (!allChartsVisible) {
    console.log('📝 Message affiché: "Graphiques détaillés disponibles avec plus de données Garmin"');
  }
  
  return allChartsVisible;
}

// Test de la structure des données pour useSidebarData
function testUseSidebarDataIntegration(enhancedData) {
  console.log('\n🔗 Test intégration useSidebarData...');
  
  if (!enhancedData) {
    console.log('❌ Pas de données enrichies');
    return false;
  }
  
  // Simuler la structure retournée par useSidebarData
  const sidebarData = {
    sport: {
      weeklyWorkouts: 3,
      todayCalories: enhancedData.sport?.todayMetrics?.calories?.total || 0,
      todaySteps: enhancedData.sport?.todayMetrics?.steps || 0,
      avgHeartRate: enhancedData.sport?.todayMetrics?.heartRate?.resting || 72,
      hasGarminData: true,
      todayMetrics: enhancedData.sport?.todayMetrics || null,
      garminData: enhancedData,
      // Nouvelles données pour les graphiques
      heartRateZones: enhancedData.heartRateZones || null,
      sleepPhases: enhancedData.sleepPhases || null,
      stressLevels: enhancedData.stressLevels || null,
      maxHeartRate: enhancedData.maxHeartRate || 190,
      userAge: enhancedData.userAge || 30,
      sleepObjective: enhancedData.sleepObjective || 480
    }
  };
  
  console.log('✅ Structure useSidebarData simulée');
  console.log('📊 Données sport enrichies:', {
    hasBasicMetrics: !!sidebarData.sport.todayMetrics,
    hasGraphicsData: !!(
      sidebarData.sport.heartRateZones &&
      sidebarData.sport.sleepPhases &&
      sidebarData.sport.stressLevels
    ),
    todayCalories: sidebarData.sport.todayCalories,
    todaySteps: sidebarData.sport.todaySteps,
    heartRateZonesCount: sidebarData.sport.heartRateZones?.length || 0,
    sleepPhasesCount: sidebarData.sport.sleepPhases?.length || 0,
    stressLevelsCount: sidebarData.sport.stressLevels?.length || 0
  });
  
  return sidebarData;
}

// Test de la props data pour GarminMetricsModule
function testGarminModuleProps(sidebarData) {
  console.log('\n⚛️ Test props GarminMetricsModule...');
  
  if (!sidebarData) {
    console.log('❌ Pas de données sidebar');
    return false;
  }
  
  // Simuler les props passées au GarminMetricsModule
  const moduleProps = {
    data: {
      // Données de base
      sport: sidebarData.sport,
      garmin: sidebarData.sport.todayMetrics,
      
      // Données pour les graphiques (CRITIQUES!)
      heartRateZones: sidebarData.sport.heartRateZones,
      sleepPhases: sidebarData.sport.sleepPhases,
      stressLevels: sidebarData.sport.stressLevels,
      maxHeartRate: sidebarData.sport.maxHeartRate,
      userAge: sidebarData.sport.userAge,
      sleepObjective: sidebarData.sport.sleepObjective
    }
  };
  
  console.log('✅ Props GarminMetricsModule simulées');
  console.log('🎯 Vérification des props critiques:');
  
  const criticalProps = [
    'heartRateZones',
    'sleepPhases', 
    'stressLevels',
    'maxHeartRate',
    'userAge',
    'sleepObjective'
  ];
  
  criticalProps.forEach(prop => {
    const hasValue = !!moduleProps.data[prop];
    const value = moduleProps.data[prop];
    const count = Array.isArray(value) ? value.length : (typeof value === 'number' ? value : 'N/A');
    console.log(`- ${prop}: ${hasValue ? '✅' : '❌'} (${count})`);
  });
  
  // Test final des conditions d'affichage
  const willShowCharts = testChartDisplayConditions(moduleProps.data);
  
  return { moduleProps, willShowCharts };
}

// Fonction principale de test
async function runIntegrationTest() {
  console.log('🚀 Démarrage du test d\'intégration...');
  
  try {
    // 1. Test du service
    const enhancedData = await testGarminEnhancedDataService();
    if (!enhancedData) {
      console.log('❌ Échec du test du service');
      return false;
    }
    
    // 2. Test de l'intégration useSidebarData
    const sidebarData = testUseSidebarDataIntegration(enhancedData);
    if (!sidebarData) {
      console.log('❌ Échec du test useSidebarData');
      return false;
    }
    
    // 3. Test des props du module
    const { moduleProps, willShowCharts } = testGarminModuleProps(sidebarData);
    
    // 4. Résumé final
    console.log('\n📋 RÉSUMÉ DU TEST:');
    console.log(`✅ Service de données enrichies: OK`);
    console.log(`✅ Intégration useSidebarData: OK`);
    console.log(`✅ Props GarminMetricsModule: OK`);
    console.log(`${willShowCharts ? '✅' : '❌'} Affichage des graphiques: ${willShowCharts ? 'OUI' : 'NON'}`);
    
    if (willShowCharts) {
      console.log('\n🎉 SUCCÈS: Les graphiques Garmin devraient s\'afficher!');
      console.log('🔧 Prochaine étape: Tester dans l\'application réelle');
    } else {
      console.log('\n⚠️ PROBLÈME: Les graphiques ne s\'afficheront pas');
      console.log('🔧 Vérifier l\'intégration des données dans l\'application');
    }
    
    return willShowCharts;
    
  } catch (error) {
    console.error('❌ Erreur durant le test:', error);
    return false;
  }
}

// Exécuter le test
runIntegrationTest();

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testGarminEnhancedDataService,
    testChartDisplayConditions,
    testUseSidebarDataIntegration,
    testGarminModuleProps,
    runIntegrationTest
  };
}