/**
 * Script pour corriger l'affichage des modules historiques
 */

console.log('=== CORRECTION AFFICHAGE MODULES HISTORIQUES ===');

// Fonction pour forcer le re-render d'un composant React
function forceReactRerender(element) {
  if (!element) return false;
  
  try {
    // Essayer de déclencher un re-render en modifiant une prop
    const reactKeys = Object.keys(element).filter(key => 
      key.startsWith('__reactInternalInstance') || 
      key.startsWith('_reactInternalFiber') ||
      key.startsWith('__reactFiber')
    );
    
    for (const key of reactKeys) {
      const fiber = element[key];
      if (fiber && fiber.stateNode && fiber.stateNode.forceUpdate) {
        fiber.stateNode.forceUpdate();
        return true;
      }
    }
    
    // Méthode alternative : déclencher un événement
    element.dispatchEvent(new Event('focus'));
    element.dispatchEvent(new Event('blur'));
    
    return false;
  } catch (error) {
    console.error('Erreur lors du force re-render:', error);
    return false;
  }
}

// Fonction pour injecter des données de test
function injectTestData() {
  const today = new Date().toISOString().split('T')[0];
  
  return {
    sport: {
      weeklyWorkouts: 3,
      todayCalories: 2200,
      todaySteps: 8500,
      avgHeartRate: 72,
      hasGarminData: true,
      todayMetrics: {
        calories: { active: 800, resting: 1400, total: 2200 },
        bodyBattery: 85,
        steps: 8500,
        heartRate: { resting: 58, max: 165, avg: 120 },
        sleep: { duration: 480, quality: 'good' }
      },
      garminData: {
        dailyMetrics: {
          [today]: {
            calories: { active: 800, resting: 1400, total: 2200 },
            bodyBattery: 85,
            steps: 8500,
            heartRate: { resting: 58, max: 165, avg: 120 },
            sleep: { duration: 480, quality: 'good' }
          }
        }
      }
    },
    metrics: { xp: 1250, level: 5, streak: 7, focus: 85 },
    quests: [
      { id: 1, title: 'Faire du sport', icon: '🏃‍♂️', completed: false },
      { id: 2, title: 'Lire 30 minutes', icon: '📚', completed: true }
    ]
  };
}

// Attendre que la page soit chargée
setTimeout(() => {
  try {
    console.log('Recherche des modules à corriger...');
    
    // 1. Trouver tous les modules historiques
    const historicalModules = document.querySelectorAll('[data-module-type="historical"]');
    console.log(`Modules historiques trouvés: ${historicalModules.length}`);
    
    if (historicalModules.length === 0) {
      console.log('❌ Aucun module historique trouvé');
      return;
    }
    
    // 2. Vérifier l'état actuel
    let modulesWithContent = 0;
    let modulesWithoutContent = 0;
    
    historicalModules.forEach((module) => {
      const content = module.querySelector('.metric-group, .module-content');
      if (content) {
        modulesWithContent++;
      } else {
        modulesWithoutContent++;
      }
    });
    
    console.log(`Modules avec contenu: ${modulesWithContent}`);
    console.log(`Modules sans contenu: ${modulesWithoutContent}`);
    
    // 3. Si des modules n'ont pas de contenu, essayer de les corriger
    if (modulesWithoutContent > 0) {
      console.log('🔧 Tentative de correction...');
      
      // Méthode 1: Forcer le re-render
      historicalModules.forEach((module, index) => {
        const moduleId = module.getAttribute('data-module-id');
        console.log(`Correction du module ${moduleId}...`);
        
        const success = forceReactRerender(module);
        console.log(`- Force re-render: ${success ? '✅' : '❌'}`);
      });
      
      // Attendre un peu puis vérifier
      setTimeout(() => {
        console.log('\n=== VÉRIFICATION APRÈS CORRECTION ===');
        
        let fixedModules = 0;
        historicalModules.forEach((module) => {
          const content = module.querySelector('.metric-group, .module-content');
          if (content) {
            fixedModules++;
          }
        });
        
        console.log(`Modules corrigés: ${fixedModules}/${historicalModules.length}`);
        
        if (fixedModules < historicalModules.length) {
          console.log('⚠️ Certains modules n\'ont toujours pas de contenu');
          console.log('💡 Suggestions:');
          console.log('1. Vérifier que useSidebarData charge bien les données');
          console.log('2. Vérifier que les props sont bien passées aux modules');
          console.log('3. Vérifier les conditions de rendu dans les modules');
          console.log('4. Ouvrir la console React DevTools pour plus de détails');
        } else {
          console.log('✅ Tous les modules ont été corrigés !');
        }
      }, 2000);
    } else {
      console.log('✅ Tous les modules ont déjà du contenu');
    }
    
    // 4. Diagnostic approfondi pour le module Garmin
    const garminModule = document.querySelector('.garmin-metrics-module');
    if (garminModule) {
      console.log('\n=== DIAGNOSTIC MODULE GARMIN ===');
      
      const loadingState = garminModule.querySelector('.garmin-loading');
      const errorState = garminModule.querySelector('.garmin-error');
      const noDataState = garminModule.querySelector('.garmin-no-data');
      const contentState = garminModule.querySelector('.metric-group');
      
      console.log('États détectés:');
      console.log('- Chargement:', !!loadingState);
      console.log('- Erreur:', !!errorState);
      console.log('- Pas de données:', !!noDataState);
      console.log('- Contenu:', !!contentState);
      
      if (errorState) {
        const errorMsg = errorState.textContent;
        console.log('- Message d\'erreur:', errorMsg);
      }
      
      if (noDataState) {
        console.log('- Le module indique qu\'il n\'y a pas de données');
        console.log('- Vérifier la connexion à la base de données Garmin');
      }
      
      if (loadingState) {
        console.log('- Le module est en cours de chargement');
        console.log('- Attendre quelques secondes...');
      }
    }
    
  } catch (error) {
    console.error('Erreur lors de la correction:', error);
  }
}, 1000);

// Test de connectivité des données
setTimeout(() => {
  console.log('\n=== TEST CONNECTIVITÉ DONNÉES ===');
  
  // Vérifier IndexedDB
  if ('indexedDB' in window) {
    console.log('✅ IndexedDB disponible');
    
    // Essayer d'ouvrir la DB Garmin
    const request = indexedDB.open('GarminData');
    request.onsuccess = () => {
      console.log('✅ Base de données Garmin accessible');
      request.result.close();
    };
    request.onerror = () => {
      console.log('❌ Erreur d\'accès à la base de données Garmin');
    };
  } else {
    console.log('❌ IndexedDB non disponible');
  }
  
  // Vérifier le localStorage
  try {
    const testKey = 'test_' + Date.now();
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    console.log('✅ localStorage fonctionnel');
  } catch (e) {
    console.log('❌ localStorage non accessible');
  }
  
}, 5000);

console.log('Script de correction chargé. Analyse en cours...');