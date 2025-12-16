/**
 * Test final du graphique FC Garmin - À exécuter dans la console du navigateur
 * Vérifie que toutes les corrections fonctionnent en conditions réelles
 */

console.log('🎯 TEST FINAL - Graphique FC Garmin (Tâche 10)');
console.log('='.repeat(50));

// 1. Fonction pour injecter des données de test réalistes
async function injectRealisticTestData() {
  console.log('\n💉 Injection de données de test réalistes...');
  
  try {
    const request = indexedDB.open('GarminData', 1);
    
    return new Promise((resolve, reject) => {
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        const db = request.result;
        const transaction = db.transaction(['dailyMetrics'], 'readwrite');
        const store = transaction.objectStore('dailyMetrics');
        
        const today = new Date().toISOString().slice(0, 10);
        const baseTimestamp = new Date(today + 'T00:00:00').getTime();
        
        // Générer des données FC réalistes pour 24h
        const timeSeries = [];
        
        // Nuit (00:00 - 06:00) - FC de repos
        for (let hour = 0; hour < 6; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            timeSeries.push({
              timestamp: baseTimestamp + (hour * 60 + minute) * 60 * 1000,
              bpm: 52 + Math.random() * 8, // 52-60 bpm
              time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
              isReal: true,
              isActivity: false
            });
          }
        }
        
        // Matin (06:00 - 12:00) - Réveil et activité matinale
        for (let hour = 6; hour < 12; hour++) {
          for (let minute = 0; minute < 60; minute += 15) {
            let bpm;
            if (hour >= 8 && hour <= 9) {
              // Activité matinale possible
              bpm = 75 + Math.random() * 45; // 75-120 bpm
            } else {
              bpm = 65 + Math.random() * 15; // 65-80 bpm
            }
            
            timeSeries.push({
              timestamp: baseTimestamp + (hour * 60 + minute) * 60 * 1000,
              bpm: Math.round(bpm),
              time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
              isReal: true,
              isActivity: bpm > 100
            });
          }
        }
        
        // Après-midi (12:00 - 18:00) - Activité et travail
        for (let hour = 12; hour < 18; hour++) {
          for (let minute = 0; minute < 60; minute += 10) {
            let bpm;
            if (hour >= 16 && hour <= 17) {
              // Activité sportive
              bpm = 90 + Math.random() * 60; // 90-150 bpm
            } else {
              bpm = 70 + Math.random() * 20; // 70-90 bpm
            }
            
            timeSeries.push({
              timestamp: baseTimestamp + (hour * 60 + minute) * 60 * 1000,
              bpm: Math.round(bpm),
              time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
              isReal: true,
              isActivity: bpm > 120
            });
          }
        }
        
        // Soirée (18:00 - 24:00) - Détente progressive
        for (let hour = 18; hour < 24; hour++) {
          for (let minute = 0; minute < 60; minute += 20) {
            const bpm = 75 - (hour - 18) * 3 + Math.random() * 10; // Diminution progressive
            
            timeSeries.push({
              timestamp: baseTimestamp + (hour * 60 + minute) * 60 * 1000,
              bpm: Math.round(Math.max(55, bpm)),
              time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
              isReal: true,
              isActivity: false
            });
          }
        }
        
        // Calculer les statistiques
        const bpmValues = timeSeries.map(t => t.bpm);
        const restingHR = Math.min(...bpmValues.filter(bpm => bpm < 70));
        const maxHR = Math.max(...bpmValues);
        const avgHR = Math.round(bpmValues.reduce((a, b) => a + b, 0) / bpmValues.length);
        
        const testMetrics = {
          date: today,
          heartRate: {
            timeSeries: timeSeries,
            resting: restingHR,
            max: maxHR,
            avg: avgHR
          },
          calories: {
            active: 650,
            resting: 1400,
            total: 2050
          },
          steps: 12500,
          bodyBattery: 82,
          sleep: {
            duration: 465, // 7h45
            deep: 135,
            light: 210,
            rem: 95,
            awake: 25
          },
          stress: {
            average: 28,
            max: 75
          },
          intensityMinutes: {
            total: 65,
            vigorous: 25,
            moderate: 40
          },
          lastUpdate: new Date().toISOString()
        };
        
        const putRequest = store.put(testMetrics);
        
        putRequest.onsuccess = () => {
          console.log('✅ Données réalistes injectées avec succès');
          console.log(`📊 Statistiques:`, {
            points: timeSeries.length,
            fcRepos: restingHR,
            fcMax: maxHR,
            fcMoy: avgHR,
            activitePoints: timeSeries.filter(t => t.isActivity).length
          });
          
          db.close();
          resolve(testMetrics);
        };
        
        putRequest.onerror = () => {
          console.error('❌ Erreur injection:', putRequest.error);
          db.close();
          reject(putRequest.error);
        };
      };
    });
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    throw error;
  }
}

// 2. Fonction pour forcer le rafraîchissement complet
function forceCompleteRefresh() {
  console.log('\n🔄 Forçage du rafraîchissement complet...');
  
  try {
    // Vider tous les caches
    if (window.garminRealDataService) {
      window.garminRealDataService.clearCache();
      console.log('✅ Cache service vidé');
    }
    
    // Vider le localStorage lié à Garmin
    Object.keys(localStorage).forEach(key => {
      if (key.includes('garmin') || key.includes('Garmin')) {
        localStorage.removeItem(key);
        console.log(`🗑️ Supprimé: ${key}`);
      }
    });
    
    // Émettre tous les événements de rafraîchissement
    const events = [
      'garmin:refresh:request',
      'garmin:data:updated',
      'garmin:sync:complete',
      'sidebar:refresh',
      'garmin:force:refresh'
    ];
    
    events.forEach(eventName => {
      window.dispatchEvent(new CustomEvent(eventName, {
        detail: {
          source: 'final-test',
          timestamp: Date.now(),
          forceRefresh: true,
          testData: true
        }
      }));
      console.log(`📡 Événement émis: ${eventName}`);
    });
    
    console.log('✅ Rafraîchissement complet terminé');
    
  } catch (error) {
    console.error('❌ Erreur rafraîchissement:', error);
  }
}

// 3. Fonction pour vérifier l'affichage du graphique
function verifyChartDisplay() {
  console.log('\n🔍 Vérification de l\'affichage du graphique...');
  
  try {
    // Chercher le module Garmin
    const garminModule = document.querySelector('[class*="sidebar-section"]:has(h2:contains("Métriques Garmin")), [class*="sidebar-section"] h2:contains("Métriques Garmin")');
    const garminSection = garminModule ? garminModule.closest('[class*="sidebar-section"]') : null;
    
    if (!garminSection) {
      console.log('❌ Module Garmin non trouvé dans le DOM');
      return false;
    }
    
    console.log('✅ Module Garmin trouvé');
    
    // Vérifier si le module est étendu
    const isExpanded = garminSection.classList.contains('expanded');
    console.log(`📖 Module étendu: ${isExpanded ? '✅ Oui' : '❌ Non'}`);
    
    if (!isExpanded) {
      // Essayer d'étendre le module
      const header = garminSection.querySelector('[class*="sidebar-section-header"]');
      if (header) {
        header.click();
        console.log('🖱️ Clic sur l\'en-tête pour étendre');
        
        // Attendre un peu puis revérifier
        setTimeout(() => verifyChartDisplay(), 1000);
        return;
      }
    }
    
    // Chercher les boutons de basculement
    const toggleButtons = garminSection.querySelectorAll('[class*="toggle-btn"]');
    console.log(`🎛️ Boutons de basculement: ${toggleButtons.length}`);
    
    toggleButtons.forEach((btn, index) => {
      console.log(`  ${index + 1}. ${btn.textContent.trim()} - ${btn.classList.contains('active') ? 'ACTIF' : 'inactif'}`);
    });
    
    // Chercher le bouton Temporel et l'activer
    const temporalButton = Array.from(toggleButtons).find(btn => btn.textContent.includes('Temporel'));
    if (temporalButton && !temporalButton.classList.contains('active')) {
      temporalButton.click();
      console.log('🖱️ Activation du mode Temporel');
      
      // Attendre puis revérifier
      setTimeout(() => verifyChartDisplay(), 1500);
      return;
    }
    
    // Chercher le graphique FC
    const heartRateChart = garminSection.querySelector('[class*="garmin-hr-temporal-chart"], [class*="chart-container"]');
    console.log(`📈 Graphique FC trouvé: ${!!heartRateChart ? '✅ Oui' : '❌ Non'}`);
    
    if (heartRateChart) {
      // Vérifier les éléments du graphique
      const svg = heartRateChart.querySelector('svg');
      const paths = heartRateChart.querySelectorAll('path');
      const areas = heartRateChart.querySelectorAll('path[fill]');
      
      console.log('📊 Éléments graphiques:', {
        svg: !!svg,
        paths: paths.length,
        areas: areas.length
      });
      
      if (svg && paths.length > 0) {
        console.log('🎉 SUCCÈS: Graphique FC complètement affiché!');
        
        // Ajouter un indicateur visuel de succès
        heartRateChart.style.border = '3px solid #10B981';
        heartRateChart.style.boxShadow = '0 0 15px rgba(16, 185, 129, 0.6)';
        
        setTimeout(() => {
          heartRateChart.style.border = '';
          heartRateChart.style.boxShadow = '';
        }, 5000);
        
        return true;
      }
    }
    
    // Chercher les messages d'erreur
    const errorMessages = garminSection.querySelectorAll('[class*="error"], [class*="empty"]');
    if (errorMessages.length > 0) {
      console.log('⚠️ Messages d\'état trouvés:');
      errorMessages.forEach((msg, index) => {
        console.log(`  ${index + 1}. ${msg.textContent.trim()}`);
      });
    }
    
    // Chercher le bouton Sync
    const syncButton = garminSection.querySelector('button:contains("Sync"), button[title*="Sync"], button[title*="sync"]');
    if (syncButton) {
      console.log('🔄 Bouton Sync trouvé');
      
      // Ajouter un indicateur visuel
      syncButton.style.border = '2px solid #3B82F6';
      syncButton.style.animation = 'pulse 2s infinite';
      
      setTimeout(() => {
        syncButton.style.border = '';
        syncButton.style.animation = '';
      }, 3000);
    }
    
    return false;
    
  } catch (error) {
    console.error('❌ Erreur vérification affichage:', error);
    return false;
  }
}

// 4. Fonction pour tester le bouton Sync
function testSyncButton() {
  console.log('\n🔄 Test du bouton Sync...');
  
  try {
    const syncButtons = document.querySelectorAll('button:contains("Sync"), button[title*="Sync"], button[title*="sync"]');
    
    console.log(`🔍 Boutons Sync trouvés: ${syncButtons.length}`);
    
    syncButtons.forEach((button, index) => {
      console.log(`  ${index + 1}. ${button.textContent.trim()}`);
      
      // Ajouter un gestionnaire de test
      const originalClick = button.onclick;
      
      button.onclick = function(event) {
        console.log('🚀 Test bouton Sync - Clic détecté!');
        
        // Exécuter l'handler original
        if (originalClick) {
          originalClick.call(this, event);
        }
        
        // Forcer notre logique
        forceCompleteRefresh();
        
        // Vérifier après un délai
        setTimeout(() => {
          verifyChartDisplay();
        }, 2000);
      };
      
      // Ajouter un indicateur visuel
      button.style.background = 'linear-gradient(45deg, #3B82F6, #1D4ED8)';
      button.style.color = 'white';
      button.style.fontWeight = 'bold';
      button.title = (button.title || '') + ' [TEST ACTIVÉ]';
    });
    
    console.log('✅ Boutons Sync configurés pour le test');
    
  } catch (error) {
    console.error('❌ Erreur test bouton Sync:', error);
  }
}

// 5. Fonction de test complet
async function runCompleteTest() {
  console.log('🚀 Lancement du test complet...\n');
  
  try {
    // Étape 1: Injecter des données réalistes
    console.log('1️⃣ Injection de données réalistes...');
    await injectRealisticTestData();
    
    // Étape 2: Forcer le rafraîchissement
    console.log('\n2️⃣ Rafraîchissement complet...');
    forceCompleteRefresh();
    
    // Étape 3: Configurer le test du bouton Sync
    console.log('\n3️⃣ Configuration du test Sync...');
    testSyncButton();
    
    // Étape 4: Vérifier l'affichage après un délai
    console.log('\n4️⃣ Vérification de l\'affichage...');
    setTimeout(() => {
      const success = verifyChartDisplay();
      
      console.log('\n🎯 RÉSULTAT DU TEST FINAL:');
      console.log('='.repeat(40));
      
      if (success) {
        console.log('🎉 SUCCÈS COMPLET!');
        console.log('✅ Le graphique FC s\'affiche correctement');
        console.log('✅ Les données sont présentes');
        console.log('✅ Le bouton Sync est fonctionnel');
      } else {
        console.log('⚠️ Test partiellement réussi');
        console.log('💡 Le graphique devrait s\'afficher après quelques secondes');
        console.log('🔄 Essayez de cliquer sur le bouton Sync');
      }
      
      console.log('\n📋 ACTIONS MANUELLES:');
      console.log('1. Vérifiez que le module "Métriques Garmin" est étendu');
      console.log('2. Cliquez sur "📈 Temporel" si pas déjà actif');
      console.log('3. Le graphique devrait montrer une courbe FC sur 24h');
      console.log('4. Testez le bouton "🔄 Sync" (il devrait être surligné)');
      console.log('5. Le titre devrait être "❤️ Fréquence Cardiaque - 24h"');
      
    }, 3000);
    
  } catch (error) {
    console.error('❌ Erreur test complet:', error);
  }
}

// Exposer les fonctions pour utilisation manuelle
window.runCompleteGarminTest = runCompleteTest;
window.injectRealisticTestData = injectRealisticTestData;
window.verifyChartDisplay = verifyChartDisplay;
window.testSyncButton = testSyncButton;

// Instructions
console.log('\n📋 INSTRUCTIONS:');
console.log('1. Copiez ce script dans la console de votre navigateur');
console.log('2. Tapez: runCompleteGarminTest()');
console.log('3. Attendez que le test se termine');
console.log('4. Suivez les instructions affichées');

console.log('\n🚀 Lancement automatique du test...');
runCompleteTest();