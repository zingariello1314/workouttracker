/**
 * Script de diagnostic pour le problème du graphique FC Garmin
 * Identifie pourquoi le graphique ne s'affiche pas et pourquoi le bouton Sync ne fonctionne pas
 */

console.log('🔍 DIAGNOSTIC - Problème Graphique FC Garmin');
console.log('='.repeat(50));

// 1. Vérifier l'état de la base de données Garmin
async function checkGarminDatabase() {
  console.log('\n📊 1. Vérification de la base de données Garmin...');
  
  try {
    // Ouvrir IndexedDB
    const request = indexedDB.open('GarminData', 1);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => {
        console.error('❌ Erreur ouverture IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        const db = request.result;
        console.log('✅ IndexedDB ouverte avec succès');
        console.log('📋 Object stores disponibles:', Array.from(db.objectStoreNames));
        
        // Vérifier les données dans dailyMetrics
        const transaction = db.transaction(['dailyMetrics'], 'readonly');
        const store = transaction.objectStore('dailyMetrics');
        const getAllRequest = store.getAll();
        
        getAllRequest.onsuccess = () => {
          const allMetrics = getAllRequest.result;
          console.log(`📈 Nombre d'entrées dans dailyMetrics: ${allMetrics.length}`);
          
          if (allMetrics.length > 0) {
            const today = new Date().toISOString().slice(0, 10);
            const todayMetrics = allMetrics.find(m => m.date === today);
            
            console.log(`📅 Données pour aujourd'hui (${today}):`, todayMetrics ? '✅ Trouvées' : '❌ Manquantes');
            
            if (todayMetrics) {
              console.log('❤️ Données FC disponibles:', {
                heartRate: !!todayMetrics.heartRate,
                timeSeries: !!todayMetrics.heartRate?.timeSeries,
                timeSeriesLength: todayMetrics.heartRate?.timeSeries?.length || 0,
                resting: todayMetrics.heartRate?.resting,
                max: todayMetrics.heartRate?.max,
                avg: todayMetrics.heartRate?.avg
              });
            }
            
            // Afficher les 3 dernières entrées
            const recentEntries = allMetrics.slice(-3);
            console.log('📋 Dernières entrées:');
            recentEntries.forEach(entry => {
              console.log(`  - ${entry.date}: FC=${!!entry.heartRate}, Steps=${entry.steps || 0}, Calories=${entry.calories?.total || 0}`);
            });
          } else {
            console.log('⚠️ Aucune donnée dans dailyMetrics');
          }
          
          db.close();
          resolve(allMetrics);
        };
        
        getAllRequest.onerror = () => {
          console.error('❌ Erreur lecture dailyMetrics:', getAllRequest.error);
          db.close();
          reject(getAllRequest.error);
        };
      };
    });
  } catch (error) {
    console.error('❌ Erreur générale IndexedDB:', error);
    throw error;
  }
}

// 2. Vérifier l'état du hook useRealGarminData
async function checkGarminDataHook() {
  console.log('\n🔗 2. Vérification du hook useRealGarminData...');
  
  try {
    // Simuler l'appel du hook
    const selectedDate = new Date().toISOString().slice(0, 10);
    console.log(`📅 Date sélectionnée: ${selectedDate}`);
    
    // Vérifier le service garminRealDataService
    if (window.garminRealDataService) {
      console.log('✅ Service garminRealDataService disponible');
      
      const emptyData = window.garminRealDataService.getEmptyData();
      console.log('📊 Structure données vides:', {
        hasHeartRateTimeSeries: !!emptyData.heartRateTimeSeries,
        hasHeartRateZones: !!emptyData.heartRateZones,
        hasTodayMetrics: !!emptyData.todayMetrics
      });
    } else {
      console.log('❌ Service garminRealDataService non disponible');
    }
    
    // Vérifier le cache
    const cacheKey = `${selectedDate}-true-true`;
    console.log(`🗄️ Clé de cache: ${cacheKey}`);
    
  } catch (error) {
    console.error('❌ Erreur vérification hook:', error);
  }
}

// 3. Vérifier l'état du composant GarminMetricsModule
function checkGarminModule() {
  console.log('\n🧩 3. Vérification du composant GarminMetricsModule...');
  
  try {
    // Chercher le module dans le DOM
    const moduleElement = document.querySelector('[class*="sidebar-section"]:has([class*="garmin"], [class*="Garmin"])');
    
    if (moduleElement) {
      console.log('✅ Module Garmin trouvé dans le DOM');
      
      // Vérifier l'état d'expansion
      const isExpanded = moduleElement.classList.contains('expanded');
      console.log(`📖 Module étendu: ${isExpanded ? '✅ Oui' : '❌ Non'}`);
      
      // Chercher les éléments de graphique
      const chartContainer = moduleElement.querySelector('[class*="chart-container"]');
      const toggleButtons = moduleElement.querySelectorAll('[class*="toggle-btn"]');
      const syncButton = moduleElement.querySelector('button:has([class*="sync"], [title*="sync"], [title*="Sync"])');
      
      console.log('🎛️ Éléments d\'interface:', {
        chartContainer: !!chartContainer,
        toggleButtons: toggleButtons.length,
        syncButton: !!syncButton
      });
      
      // Vérifier les messages d'erreur
      const errorMessages = moduleElement.querySelectorAll('[class*="error"], [class*="empty"]');
      if (errorMessages.length > 0) {
        console.log('⚠️ Messages d\'erreur trouvés:');
        errorMessages.forEach((msg, index) => {
          console.log(`  ${index + 1}. ${msg.textContent.trim()}`);
        });
      }
      
      // Vérifier les données affichées
      const dataCards = moduleElement.querySelectorAll('[class*="sidebar-data-card"]');
      console.log(`📊 Cartes de données: ${dataCards.length}`);
      dataCards.forEach((card, index) => {
        const label = card.querySelector('[class*="sidebar-data-label"]')?.textContent;
        const value = card.querySelector('[class*="sidebar-data-value"]')?.textContent;
        console.log(`  ${index + 1}. ${label}: ${value}`);
      });
      
    } else {
      console.log('❌ Module Garmin non trouvé dans le DOM');
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification module:', error);
  }
}

// 4. Vérifier la synchronisation Garmin
async function checkGarminSync() {
  console.log('\n🔄 4. Vérification de la synchronisation Garmin...');
  
  try {
    // Vérifier si le serveur Garmin est accessible
    const garminServerUrl = 'http://localhost:3001';
    
    try {
      const response = await fetch(`${garminServerUrl}/health`, { 
        method: 'GET',
        timeout: 5000 
      });
      
      if (response.ok) {
        console.log('✅ Serveur Garmin accessible');
        const healthData = await response.json();
        console.log('📊 État du serveur:', healthData);
      } else {
        console.log(`⚠️ Serveur Garmin répond avec erreur: ${response.status}`);
      }
    } catch (fetchError) {
      console.log('❌ Serveur Garmin non accessible:', fetchError.message);
      console.log('💡 Suggestion: Vérifiez que le serveur Garmin est démarré (npm run garmin-server)');
    }
    
    // Vérifier les événements de synchronisation
    console.log('🎧 Vérification des événements de sync...');
    
    // Simuler un événement de sync pour voir s'il est écouté
    const testEvent = new CustomEvent('garmin:refresh:request', {
      detail: { source: 'diagnostic', timestamp: Date.now() }
    });
    
    console.log('📡 Émission d\'un événement de test...');
    window.dispatchEvent(testEvent);
    
    // Attendre un peu pour voir si quelque chose se passe
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.error('❌ Erreur vérification sync:', error);
  }
}

// 5. Proposer des solutions
function proposeSolutions() {
  console.log('\n💡 5. Solutions proposées...');
  console.log('='.repeat(30));
  
  const solutions = [
    {
      probleme: 'Pas de données FC',
      solutions: [
        'Vérifier que le serveur Garmin est démarré',
        'Synchroniser les données depuis l\'onglet Sport > Garmin',
        'Vérifier la connexion à votre montre Garmin',
        'Forcer une synchronisation complète'
      ]
    },
    {
      probleme: 'Bouton Sync ne fonctionne pas',
      solutions: [
        'Vérifier que les événements de sync sont bien écoutés',
        'Redémarrer l\'application',
        'Vider le cache du navigateur',
        'Vérifier la console pour les erreurs JavaScript'
      ]
    },
    {
      probleme: 'Graphique ne s\'affiche pas',
      solutions: [
        'Vérifier que le composant SidebarHeartRateChart est bien chargé',
        'Vérifier les données enrichies dans useRealGarminData',
        'Activer le mode debug pour voir les logs détaillés',
        'Vérifier les erreurs dans la console du navigateur'
      ]
    }
  ];
  
  solutions.forEach((item, index) => {
    console.log(`\n${index + 1}. ${item.probleme}:`);
    item.solutions.forEach((solution, sIndex) => {
      console.log(`   ${sIndex + 1}. ${solution}`);
    });
  });
}

// 6. Fonction de réparation automatique
async function attemptAutoFix() {
  console.log('\n🔧 6. Tentative de réparation automatique...');
  
  try {
    // 1. Vider le cache
    console.log('🗑️ Vidage du cache...');
    if (window.garminRealDataService) {
      window.garminRealDataService.clearCache();
      console.log('✅ Cache vidé');
    }
    
    // 2. Forcer un événement de rafraîchissement
    console.log('🔄 Déclenchement du rafraîchissement...');
    window.dispatchEvent(new CustomEvent('garmin:data:updated'));
    window.dispatchEvent(new CustomEvent('garmin:refresh:request'));
    
    // 3. Recharger les données si possible
    console.log('📊 Tentative de rechargement des données...');
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Réparation automatique terminée');
    console.log('💡 Vérifiez maintenant si le graphique s\'affiche');
    
  } catch (error) {
    console.error('❌ Erreur lors de la réparation:', error);
  }
}

// Exécution du diagnostic complet
async function runFullDiagnostic() {
  try {
    await checkGarminDatabase();
    await checkGarminDataHook();
    checkGarminModule();
    await checkGarminSync();
    proposeSolutions();
    
    console.log('\n🤔 Voulez-vous tenter une réparation automatique ?');
    console.log('Tapez: runAutoFix() dans la console');
    
  } catch (error) {
    console.error('❌ Erreur lors du diagnostic:', error);
  }
}

// Exposer les fonctions pour utilisation manuelle
window.runFullDiagnostic = runFullDiagnostic;
window.runAutoFix = attemptAutoFix;
window.checkGarminDatabase = checkGarminDatabase;
window.checkGarminModule = checkGarminModule;

// Lancer le diagnostic automatiquement
console.log('🚀 Lancement du diagnostic automatique...');
runFullDiagnostic();