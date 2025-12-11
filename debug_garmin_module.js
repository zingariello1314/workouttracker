/**
 * Script de debug spécifique pour le module Garmin
 */

console.log('🔍 DEBUG MODULE GARMIN - DÉMARRAGE');

// Fonction utilitaire pour attendre un élément
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Élément ${selector} non trouvé après ${timeout}ms`));
    }, timeout);
  });
}

// Fonction pour extraire les props React
function getReactProps(element) {
  const reactFiberKey = Object.keys(element).find(key => 
    key.startsWith('__reactFiber') || 
    key.startsWith('_reactInternalFiber') ||
    key.startsWith('__reactInternalInstance')
  );
  
  if (reactFiberKey) {
    const fiber = element[reactFiberKey];
    return fiber?.memoizedProps || fiber?.return?.memoizedProps || null;
  }
  
  return null;
}

// Test principal
async function debugGarminModule() {
  try {
    console.log('1️⃣ Recherche du module Garmin...');
    
    // Attendre que le module soit présent
    const garminModule = await waitForElement('.garmin-metrics-module', 15000);
    console.log('✅ Module Garmin trouvé');
    
    // Analyser la structure
    console.log('2️⃣ Analyse de la structure...');
    const header = garminModule.querySelector('.sidebar-section-header');
    const content = garminModule.querySelector('.sidebar-section-content');
    
    console.log('- En-tête présent:', !!header);
    console.log('- Contenu présent:', !!content);
    
    if (header) {
      const title = header.querySelector('.sidebar-section-title');
      const badge = header.querySelector('.sidebar-module-badge');
      console.log('  - Titre:', title?.textContent);
      console.log('  - Badge:', badge?.textContent);
    }
    
    if (content) {
      console.log('3️⃣ Analyse du contenu...');
      
      // Vérifier les différents états possibles
      const loadingState = content.querySelector('.garmin-loading');
      const errorState = content.querySelector('.garmin-error');
      const noDataState = content.querySelector('.garmin-no-data');
      const metricGroups = content.querySelectorAll('.metric-group');
      
      console.log('États du module:');
      console.log('- Chargement:', !!loadingState);
      console.log('- Erreur:', !!errorState);
      console.log('- Pas de données:', !!noDataState);
      console.log('- Groupes de métriques:', metricGroups.length);
      
      if (loadingState) {
        console.log('⏳ Module en cours de chargement');
        const loadingText = loadingState.textContent;
        console.log('  Message:', loadingText);
      }
      
      if (errorState) {
        console.log('❌ Module en erreur');
        const errorText = errorState.textContent;
        console.log('  Message d\'erreur:', errorText);
      }
      
      if (noDataState) {
        console.log('📭 Module sans données');
        const noDataText = noDataState.textContent;
        console.log('  Message:', noDataText);
      }
      
      if (metricGroups.length > 0) {
        console.log('📊 Module avec données:');
        metricGroups.forEach((group, index) => {
          const groupClass = Array.from(group.classList).find(c => c.includes('-group'));
          const values = group.querySelectorAll('.metric-value, .value, .hr-value');
          console.log(`  Groupe ${index + 1} (${groupClass}): ${values.length} valeurs`);
          
          values.forEach((value, i) => {
            console.log(`    Valeur ${i + 1}: ${value.textContent}`);
          });
        });
      }
    }
    
    // Analyser les props React
    console.log('4️⃣ Analyse des props React...');
    const props = getReactProps(garminModule);
    
    if (props) {
      console.log('✅ Props React trouvées:');
      console.log('- moduleId:', props.moduleId);
      console.log('- moduleType:', props.moduleType);
      console.log('- navigation:', !!props.navigation);
      console.log('- data:', !!props.data);
      
      if (props.data) {
        console.log('- data.sport:', !!props.data.sport);
        
        if (props.data.sport) {
          const sport = props.data.sport;
          console.log('  Données sport:');
          console.log('  - hasGarminData:', sport.hasGarminData);
          console.log('  - todayMetrics:', !!sport.todayMetrics);
          console.log('  - garminData:', !!sport.garminData);
          console.log('  - todaySteps:', sport.todaySteps);
          console.log('  - todayCalories:', sport.todayCalories);
          
          if (sport.todayMetrics) {
            console.log('  Métriques du jour:');
            console.log('  - calories:', sport.todayMetrics.calories);
            console.log('  - steps:', sport.todayMetrics.steps);
            console.log('  - bodyBattery:', sport.todayMetrics.bodyBattery);
            console.log('  - heartRate:', sport.todayMetrics.heartRate);
          }
        }
      }
    } else {
      console.log('❌ Impossible d\'accéder aux props React');
    }
    
    // Test de la base de données
    console.log('5️⃣ Test de la base de données...');
    
    try {
      const dbRequest = indexedDB.open('GarminData');
      dbRequest.onsuccess = () => {
        console.log('✅ Base de données Garmin accessible');
        
        const db = dbRequest.result;
        const stores = Array.from(db.objectStoreNames);
        console.log('- Object stores:', stores);
        
        if (stores.includes('dailyMetrics')) {
          const transaction = db.transaction(['dailyMetrics'], 'readonly');
          const store = transaction.objectStore('dailyMetrics');
          const countRequest = store.count();
          
          countRequest.onsuccess = () => {
            console.log('- Nombre d\'entrées dailyMetrics:', countRequest.result);
          };
        }
        
        db.close();
      };
      
      dbRequest.onerror = () => {
        console.log('❌ Erreur d\'accès à la base de données Garmin');
      };
    } catch (dbError) {
      console.log('❌ Erreur IndexedDB:', dbError.message);
    }
    
    // Recommandations
    console.log('6️⃣ Recommandations:');
    
    if (!content || content.children.length === 0) {
      console.log('🔧 PROBLÈME: Module vide');
      console.log('   Solutions:');
      console.log('   1. Vérifier que useSidebarData charge les données');
      console.log('   2. Vérifier les conditions de rendu dans GarminMetricsModule');
      console.log('   3. Forcer un re-render du composant');
    } else if (loadingState) {
      console.log('⏳ Module en chargement - attendre ou vérifier la connectivité');
    } else if (errorState) {
      console.log('🔧 ERREUR: Vérifier les logs de la console pour plus de détails');
    } else if (noDataState) {
      console.log('📭 PAS DE DONNÉES: Vérifier la synchronisation Garmin');
    } else {
      console.log('✅ Module semble fonctionner correctement');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du debug:', error);
  }
}

// Lancer le debug
debugGarminModule();

// Test périodique pour surveiller les changements
let checkCount = 0;
const periodicCheck = setInterval(() => {
  checkCount++;
  
  const garminModule = document.querySelector('.garmin-metrics-module');
  if (garminModule) {
    const hasContent = garminModule.querySelector('.metric-group');
    const isLoading = garminModule.querySelector('.garmin-loading');
    const hasError = garminModule.querySelector('.garmin-error');
    
    console.log(`🔄 Check ${checkCount}: Contenu=${!!hasContent}, Chargement=${!!isLoading}, Erreur=${!!hasError}`);
    
    if (hasContent) {
      console.log('✅ Module Garmin maintenant fonctionnel !');
      clearInterval(periodicCheck);
    }
  }
  
  if (checkCount >= 20) {
    console.log('⏹️ Arrêt de la surveillance après 20 vérifications');
    clearInterval(periodicCheck);
  }
}, 2000);

console.log('🚀 Script de debug Garmin lancé - surveillance active...');