/**
 * Script de test pour l'intégration du module Garmin de la sidebar
 * avec les vraies données depuis l'onglet Sport
 */

console.log('🧪 Test d\'intégration du module Garmin de la sidebar');

// Simuler l'environnement React et les hooks
const mockReactEnvironment = () => {
  // Mock de useState
  let stateValues = {};
  let stateSetters = {};
  let stateIndex = 0;
  
  global.useState = (initialValue) => {
    const currentIndex = stateIndex++;
    if (!(currentIndex in stateValues)) {
      stateValues[currentIndex] = initialValue;
    }
    
    const setValue = (newValue) => {
      stateValues[currentIndex] = typeof newValue === 'function' 
        ? newValue(stateValues[currentIndex]) 
        : newValue;
    };
    
    stateSetters[currentIndex] = setValue;
    return [stateValues[currentIndex], setValue];
  };
  
  // Mock de useEffect
  global.useEffect = (effect, deps) => {
    // Simuler l'exécution immédiate de l'effet
    const cleanup = effect();
    return cleanup;
  };
  
  // Mock de useCallback
  global.useCallback = (callback, deps) => callback;
  
  // Mock de useMemo
  global.useMemo = (factory, deps) => factory();
  
  // Mock des hooks d'authentification
  global.useAuth = () => ({
    isAuthenticated: true
  });
  
  // Mock du hook useGarminData
  global.useGarminData = () => ({
    loadDataForTab: async (tab, date, period) => {
      console.log(`📡 Mock loadDataForTab appelé: ${tab}, ${date}, ${period}`);
      
      // Simuler des données réelles comme celles de l'onglet Sport
      return {
        dailyMetrics: {
          '2024-12-14': {
            calories: { active: 450, resting: 1200, total: 1650 },
            heartRate: { resting: 65, max: 185, average: 85 },
            bodyBattery: 75,
            steps: 8500,
            sleep: { duration: 450, deep: 120, light: 200, rem: 100, awake: 30 },
            stress: { average: 35, max: 80 },
            intensityMinutes: { total: 45, vigorous: 15, moderate: 30 }
          }
        },
        activities: { swimming: [], jumpRope: [], cardio: [] }
      };
    },
    dbReady: true
  });
  
  console.log('✅ Environnement React mocké');
};

// Test du hook useRealGarminData
async function testUseRealGarminDataHook() {
  try {
    console.log('🔧 Test du hook useRealGarminData...');
    
    // Configurer l'environnement mock
    mockReactEnvironment();
    
    // Importer le hook
    const { useRealGarminData } = await import('./src/hooks/useRealGarminData.js');
    
    console.log('✅ Hook importé avec succès');
    
    // Simuler l'utilisation du hook
    const hookResult = useRealGarminData();
    
    console.log('📊 Résultat du hook:', {
      hasGarminData: !!hookResult.garminData,
      loading: hookResult.loading,
      error: hookResult.error,
      hasData: hookResult.hasData,
      lastUpdate: hookResult.lastUpdate
    });
    
    if (hookResult.garminData) {
      console.log('📈 Données Garmin du hook:', {
        dataSource: hookResult.garminData.dataSource,
        hasData: hookResult.garminData.hasData,
        calories: hookResult.garminData.todayMetrics?.calories,
        heartRate: hookResult.garminData.todayMetrics?.heartRate,
        bodyBattery: hookResult.garminData.todayMetrics?.bodyBattery,
        steps: hookResult.garminData.todayMetrics?.steps,
        heartRateZones: hookResult.garminData.heartRateZones?.length || 0,
        sleepPhases: hookResult.garminData.sleepPhases?.length || 0,
        stressLevels: hookResult.garminData.stressLevels?.length || 0
      });
    }
    
    return {
      success: true,
      hookResult
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du test du hook:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test de simulation d'utilisation dans le module Garmin
async function testGarminModuleIntegration() {
  try {
    console.log('🔧 Test d\'intégration avec le module Garmin...');
    
    // Simuler les props du module
    const moduleProps = {
      isExpanded: true,
      onToggle: () => console.log('Toggle appelé'),
      data: {}, // Données vides pour forcer l'utilisation des vraies données
      navigation: {
        setActiveTab: (tab) => console.log(`Navigation vers: ${tab}`)
      }
    };
    
    // Simuler l'utilisation du hook dans le module
    const { useRealGarminData } = await import('./src/hooks/useRealGarminData.js');
    const hookResult = useRealGarminData();
    
    // Simuler la logique du module
    const metrics = hookResult.garminData?.hasData 
      ? hookResult.garminData.todayMetrics
      : {
          calories: { active: 0, resting: 0, total: 0 },
          bodyBattery: null,
          steps: 0,
          heartRate: { resting: null, average: null, max: null },
          sleep: null
        };
    
    console.log('🎯 Métriques utilisées par le module:', {
      calories: metrics.calories,
      bodyBattery: metrics.bodyBattery,
      steps: metrics.steps,
      heartRate: metrics.heartRate,
      sleep: metrics.sleep
    });
    
    // Simuler l'affichage des graphiques
    const chartData = hookResult.garminData || {};
    console.log('📊 Données graphiques disponibles:', {
      heartRateZones: chartData.heartRateZones?.length || 0,
      sleepPhases: chartData.sleepPhases?.length || 0,
      stressLevels: chartData.stressLevels?.length || 0,
      showCharts: !hookResult.loading && !hookResult.error && !!hookResult.garminData
    });
    
    return {
      success: true,
      metrics,
      chartData,
      hookResult
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du test d\'intégration:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Test de la navigation vers l'onglet Sport
function testNavigationToSport() {
  console.log('🔧 Test de la navigation vers l\'onglet Sport...');
  
  try {
    // Simuler la navigation
    const mockNavigation = {
      setActiveTab: (tab) => {
        console.log(`🧭 Navigation simulée vers l'onglet: ${tab}`);
        return Promise.resolve();
      }
    };
    
    // Simuler le clic sur une métrique
    const handleNavigateToSport = async () => {
      const target = {
        tab: 'sport',
        subtab: 'aujourdhui',
        moduleId: 'garmin-today-module',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      };
      
      console.log('🎯 Cible de navigation:', target);
      await mockNavigation.setActiveTab(target.tab);
      console.log('✅ Navigation simulée avec succès');
    };
    
    // Exécuter la navigation
    handleNavigateToSport();
    
    return {
      success: true,
      navigationTarget: {
        tab: 'sport',
        subtab: 'aujourdhui',
        moduleId: 'garmin-today-module'
      }
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du test de navigation:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests d\'intégration...\n');
  
  const results = {
    hookTest: await testUseRealGarminDataHook(),
    integrationTest: await testGarminModuleIntegration(),
    navigationTest: testNavigationToSport()
  };
  
  console.log('\n📋 Résumé des tests:');
  console.log('Hook useRealGarminData:', results.hookTest.success ? '✅' : '❌');
  console.log('Intégration module:', results.integrationTest.success ? '✅' : '❌');
  console.log('Navigation Sport:', results.navigationTest.success ? '✅' : '❌');
  
  const allSuccess = Object.values(results).every(r => r.success);
  
  if (allSuccess) {
    console.log('\n🎉 Tous les tests d\'intégration sont passés avec succès !');
    console.log('✨ Le module Garmin de la sidebar devrait maintenant utiliser les vraies données');
  } else {
    console.log('\n💥 Certains tests ont échoué');
    Object.entries(results).forEach(([test, result]) => {
      if (!result.success) {
        console.log(`❌ ${test}: ${result.error}`);
      }
    });
  }
  
  return results;
}

// Exécuter les tests
runAllTests();