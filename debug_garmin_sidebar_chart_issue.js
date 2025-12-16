/**
 * Script de diagnostic pour le problème du graphique FC dans la sidebar
 * Objectif: Identifier pourquoi le graphique ne s'affiche pas dans le module sidebar
 * alors qu'il fonctionne dans le sous-onglet Garmin
 */

console.log('🔍 [DEBUG] Diagnostic du graphique FC sidebar - Démarrage');

// Fonction pour tester les données Garmin dans la sidebar
async function debugGarminSidebarChart() {
  try {
    console.log('📊 [DEBUG] Test 1: Vérification des données dans le module sidebar');
    
    // Simuler l'ouverture de l'application et navigation vers la sidebar
    const sidebarModule = document.querySelector('.sidebar-section');
    if (!sidebarModule) {
      console.error('❌ [DEBUG] Module sidebar non trouvé');
      return;
    }
    
    // Chercher le module Garmin spécifiquement
    const garminModule = Array.from(document.querySelectorAll('.sidebar-section')).find(
      section => section.textContent.includes('Métriques Garmin')
    );
    
    if (!garminModule) {
      console.error('❌ [DEBUG] Module Garmin non trouvé dans la sidebar');
      return;
    }
    
    console.log('✅ [DEBUG] Module Garmin trouvé:', garminModule);
    
    // Vérifier si le module est étendu
    const isExpanded = garminModule.classList.contains('expanded');
    console.log(`📋 [DEBUG] Module étendu: ${isExpanded}`);
    
    if (!isExpanded) {
      console.log('🔄 [DEBUG] Extension du module Garmin...');
      const header = garminModule.querySelector('.sidebar-section-header');
      if (header) {
        header.click();
        await new Promise(resolve => setTimeout(resolve, 500)); // Attendre l'animation
      }
    }
    
    // Chercher le graphique FC
    const heartRateChart = garminModule.querySelector('.garmin-hr-temporal-chart');
    console.log(`📈 [DEBUG] Graphique FC trouvé: ${!!heartRateChart}`);
    
    if (heartRateChart) {
      console.log('✅ [DEBUG] Graphique présent dans le DOM');
      
      // Vérifier les données du graphique
      const rechartContainer = heartRateChart.querySelector('.recharts-wrapper');
      console.log(`📊 [DEBUG] Container Recharts: ${!!rechartContainer}`);
      
      if (rechartContainer) {
        const areaChart = rechartContainer.querySelector('.recharts-surface');
        console.log(`🎨 [DEBUG] Surface graphique: ${!!areaChart}`);
        
        const dataPoints = rechartContainer.querySelectorAll('.recharts-dot');
        console.log(`📍 [DEBUG] Points de données: ${dataPoints.length}`);
        
        const areaPath = rechartContainer.querySelector('.recharts-area-area');
        console.log(`📈 [DEBUG] Courbe area: ${!!areaPath}`);
      }
    } else {
      console.log('❌ [DEBUG] Graphique FC non trouvé - Recherche des fallbacks...');
      
      // Chercher les états d'erreur ou de chargement
      const loadingState = garminModule.querySelector('.charts-loading-state');
      const errorState = garminModule.querySelector('.charts-error-state');
      const emptyState = garminModule.querySelector('.charts-empty-state');
      
      console.log(`⏳ [DEBUG] État de chargement: ${!!loadingState}`);
      console.log(`❌ [DEBUG] État d'erreur: ${!!errorState}`);
      console.log(`📭 [DEBUG] État vide: ${!!emptyState}`);
      
      if (errorState) {
        const errorMessage = errorState.querySelector('.error-message');
        console.log(`🚨 [DEBUG] Message d'erreur: ${errorMessage?.textContent}`);
      }
      
      if (emptyState) {
        const emptyMessage = emptyState.querySelector('.empty-state-message');
        console.log(`📭 [DEBUG] Message état vide: ${emptyMessage?.textContent}`);
      }
    }
    
    console.log('📊 [DEBUG] Test 2: Vérification des données dans le sous-onglet Garmin');
    
    // Naviguer vers l'onglet Sport pour comparer
    const sportTab = document.querySelector('[data-tab="sport"]');
    if (sportTab && !sportTab.classList.contains('active')) {
      console.log('🏃 [DEBUG] Navigation vers l\'onglet Sport...');
      sportTab.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Chercher le sous-onglet Garmin
    const garminSubTab = document.querySelector('[data-subtab="garmin"]') || 
                        Array.from(document.querySelectorAll('button')).find(
                          btn => btn.textContent.includes('Garmin')
                        );
    
    if (garminSubTab && !garminSubTab.classList.contains('active')) {
      console.log('⌚ [DEBUG] Navigation vers le sous-onglet Garmin...');
      garminSubTab.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Chercher le graphique FC dans le sous-onglet
    const subTabChart = document.querySelector('.garmin-heart-rate-chart') ||
                       document.querySelector('[class*="heart-rate"]');
    
    console.log(`📈 [DEBUG] Graphique dans sous-onglet: ${!!subTabChart}`);
    
    if (subTabChart) {
      const subTabDataPoints = subTabChart.querySelectorAll('.recharts-dot');
      console.log(`📍 [DEBUG] Points dans sous-onglet: ${subTabDataPoints.length}`);
      
      // Comparer les données
      if (subTabDataPoints.length > 0) {
        console.log('✅ [DEBUG] Le sous-onglet a des données FC');
        console.log('🔍 [DEBUG] Problème identifié: Les données ne remontent pas vers la sidebar');
      }
    }
    
    console.log('📊 [DEBUG] Test 3: Vérification des données en mémoire');
    
    // Vérifier les données dans le localStorage ou IndexedDB
    const garminDataKeys = Object.keys(localStorage).filter(key => 
      key.includes('garmin') || key.includes('sport') || key.includes('heartRate')
    );
    
    console.log(`💾 [DEBUG] Clés Garmin dans localStorage: ${garminDataKeys.length}`);
    garminDataKeys.forEach(key => {
      const data = localStorage.getItem(key);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          console.log(`🔑 [DEBUG] ${key}:`, Object.keys(parsed));
        } catch (e) {
          console.log(`🔑 [DEBUG] ${key}: ${data.substring(0, 100)}...`);
        }
      }
    });
    
    // Vérifier IndexedDB
    if ('indexedDB' in window) {
      console.log('🗄️ [DEBUG] Vérification IndexedDB...');
      
      try {
        const databases = await indexedDB.databases();
        const garminDbs = databases.filter(db => 
          db.name.includes('garmin') || db.name.includes('sport') || db.name.includes('QuietQuest')
        );
        
        console.log(`🗄️ [DEBUG] Bases de données Garmin: ${garminDbs.length}`);
        garminDbs.forEach(db => console.log(`📊 [DEBUG] DB: ${db.name} v${db.version}`));
        
      } catch (error) {
        console.log(`🗄️ [DEBUG] Erreur IndexedDB: ${error.message}`);
      }
    }
    
    console.log('📊 [DEBUG] Test 4: Simulation de données pour forcer l\'affichage');
    
    // Créer des données de test pour forcer l'affichage du graphique
    const testHeartRateData = [];
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Générer 24 points (un par heure)
    for (let hour = 0; hour < 24; hour++) {
      const timestamp = startOfDay.getTime() + (hour * 60 * 60 * 1000);
      const bpm = 60 + Math.sin(hour / 24 * Math.PI * 2) * 20 + Math.random() * 10;
      
      testHeartRateData.push({
        timestamp,
        bpm: Math.round(bpm),
        time: new Date(timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        isReal: true,
        isActivity: hour >= 8 && hour <= 18 && Math.random() > 0.7
      });
    }
    
    console.log(`🧪 [DEBUG] Données de test générées: ${testHeartRateData.length} points`);
    
    // Essayer d'injecter les données dans le composant React
    const reactFiberKey = Object.keys(garminModule).find(key => key.startsWith('__reactFiber'));
    if (reactFiberKey) {
      console.log('⚛️ [DEBUG] Composant React trouvé, tentative d\'injection des données...');
      
      // Émettre un événement personnalisé avec les données de test
      window.dispatchEvent(new CustomEvent('garmin:test:data', {
        detail: {
          heartRateTimeSeries: testHeartRateData,
          hasData: true,
          selectedDate: now.toISOString().slice(0, 10)
        }
      }));
      
      console.log('📡 [DEBUG] Événement de test émis');
    }
    
    console.log('✅ [DEBUG] Diagnostic terminé');
    
    // Résumé des findings
    console.log('\n📋 [DEBUG] RÉSUMÉ DU DIAGNOSTIC:');
    console.log(`- Module Garmin sidebar: ${!!garminModule ? '✅' : '❌'}`);
    console.log(`- Graphique FC sidebar: ${!!heartRateChart ? '✅' : '❌'}`);
    console.log(`- Graphique FC sous-onglet: ${!!subTabChart ? '✅' : '❌'}`);
    console.log(`- Données localStorage: ${garminDataKeys.length} clés`);
    
    if (!heartRateChart && subTabChart) {
      console.log('\n🎯 [DEBUG] PROBLÈME IDENTIFIÉ:');
      console.log('Le graphique fonctionne dans le sous-onglet mais pas dans la sidebar.');
      console.log('Causes possibles:');
      console.log('1. Les données ne sont pas transmises au composant sidebar');
      console.log('2. Le hook useRealGarminData ne récupère pas les bonnes données');
      console.log('3. Le composant SidebarHeartRateChart a un problème de rendu');
      console.log('4. Les données sont dans un format incompatible');
    }
    
  } catch (error) {
    console.error('❌ [DEBUG] Erreur lors du diagnostic:', error);
  }
}

// Fonction pour forcer l'affichage du graphique avec des données de test
function forceDisplayChart() {
  console.log('🚀 [DEBUG] Forçage de l\'affichage du graphique...');
  
  // Générer des données de test réalistes
  const testData = {
    hasData: true,
    heartRateTimeSeries: [],
    dailyMetrics: {},
    todayMetrics: {
      calories: { active: 300, resting: 1200, total: 1500 },
      heartRate: { resting: 65, max: 150, average: 85 },
      bodyBattery: 75,
      steps: 8500,
      sleep: { duration: 450, quality: 'Bonne' }
    }
  };
  
  // Générer des données de série temporelle pour les 7 derniers jours
  const today = new Date();
  for (let day = 0; day < 7; day++) {
    const date = new Date(today);
    date.setDate(date.getDate() - day);
    const dateStr = date.toISOString().slice(0, 10);
    
    const dayData = [];
    // Générer des points toutes les heures
    for (let hour = 6; hour < 23; hour++) {
      const timestamp = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour).getTime();
      const baseBpm = 65 + Math.sin(hour / 24 * Math.PI * 2) * 25;
      const bpm = Math.round(baseBpm + (Math.random() - 0.5) * 20);
      
      dayData.push({
        timestamp,
        bpm: Math.max(50, Math.min(180, bpm)),
        time: `${hour.toString().padStart(2, '0')}:00`,
        isReal: true,
        isActivity: hour >= 9 && hour <= 18 && Math.random() > 0.8
      });
    }
    
    testData.heartRateTimeSeries.push(...dayData);
    testData.dailyMetrics[dateStr] = {
      heartRate: {
        timeSeries: dayData,
        resting: 65,
        max: Math.max(...dayData.map(d => d.bpm)),
        avg: Math.round(dayData.reduce((sum, d) => sum + d.bpm, 0) / dayData.length)
      }
    };
  }
  
  console.log(`🧪 [DEBUG] Données de test créées: ${testData.heartRateTimeSeries.length} points sur 7 jours`);
  
  // Stocker les données dans localStorage pour que le hook les récupère
  localStorage.setItem('garmin-test-data', JSON.stringify(testData));
  
  // Émettre des événements pour déclencher le rechargement
  window.dispatchEvent(new CustomEvent('garmin:refresh:request', {
    detail: { source: 'debug-script', testData }
  }));
  
  window.dispatchEvent(new CustomEvent('garmin:data:updated', {
    detail: { source: 'debug-script', testData }
  }));
  
  console.log('📡 [DEBUG] Événements de rechargement émis');
  
  // Attendre un peu puis vérifier si le graphique s'affiche
  setTimeout(() => {
    const garminModule = Array.from(document.querySelectorAll('.sidebar-section')).find(
      section => section.textContent.includes('Métriques Garmin')
    );
    
    if (garminModule) {
      const heartRateChart = garminModule.querySelector('.garmin-hr-temporal-chart');
      if (heartRateChart) {
        console.log('✅ [DEBUG] Succès! Le graphique s\'affiche maintenant');
      } else {
        console.log('❌ [DEBUG] Le graphique ne s\'affiche toujours pas');
        
        // Chercher les messages d'erreur
        const errorState = garminModule.querySelector('.charts-error-state');
        const emptyState = garminModule.querySelector('.charts-empty-state');
        
        if (errorState) {
          console.log('🚨 [DEBUG] État d\'erreur détecté');
        }
        if (emptyState) {
          console.log('📭 [DEBUG] État vide détecté');
        }
      }
    }
  }, 2000);
}

// Fonction pour nettoyer les données de test
function cleanupTestData() {
  console.log('🧹 [DEBUG] Nettoyage des données de test...');
  localStorage.removeItem('garmin-test-data');
  
  // Émettre un événement de nettoyage
  window.dispatchEvent(new CustomEvent('garmin:cleanup:test', {
    detail: { source: 'debug-script' }
  }));
  
  console.log('✅ [DEBUG] Données de test supprimées');
}

// Exporter les fonctions pour utilisation dans la console
window.debugGarminSidebarChart = debugGarminSidebarChart;
window.forceDisplayChart = forceDisplayChart;
window.cleanupTestData = cleanupTestData;

console.log('🔧 [DEBUG] Fonctions disponibles:');
console.log('- debugGarminSidebarChart() : Diagnostic complet');
console.log('- forceDisplayChart() : Forcer l\'affichage avec des données de test');
console.log('- cleanupTestData() : Nettoyer les données de test');

// Lancer le diagnostic automatiquement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', debugGarminSidebarChart);
} else {
  debugGarminSidebarChart();
}