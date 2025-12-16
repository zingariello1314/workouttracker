/**
 * Test de validation du correctif du graphique FC dans la sidebar
 * Objectif: Vérifier que le graphique s'affiche maintenant avec les données sur 7 jours
 */

console.log('🧪 [TEST] Test du correctif graphique FC sidebar - Démarrage');

// Fonction de test principal
async function testGarminSidebarChartFix() {
  try {
    console.log('🧪 [TEST] Étape 1: Vérification de l\'état initial');
    
    // Attendre que la page soit chargée
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        window.addEventListener('load', resolve);
      });
    }
    
    // Chercher le module Garmin dans la sidebar
    const garminModule = Array.from(document.querySelectorAll('.sidebar-section')).find(
      section => section.textContent.includes('Métriques Garmin')
    );
    
    if (!garminModule) {
      console.error('❌ [TEST] Module Garmin non trouvé dans la sidebar');
      return false;
    }
    
    console.log('✅ [TEST] Module Garmin trouvé');
    
    // S'assurer que le module est étendu
    if (!garminModule.classList.contains('expanded')) {
      console.log('🔄 [TEST] Extension du module Garmin...');
      const header = garminModule.querySelector('.sidebar-section-header');
      if (header) {
        header.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log('🧪 [TEST] Étape 2: Vérification de l\'activation du mode temporel');
    
    // Chercher les boutons de basculement
    const toggleButtons = garminModule.querySelectorAll('.toggle-btn');
    const temporalButton = Array.from(toggleButtons).find(btn => btn.textContent.includes('Temporel'));
    
    if (temporalButton) {
      console.log('✅ [TEST] Bouton temporel trouvé');
      
      if (!temporalButton.classList.contains('active')) {
        console.log('🔄 [TEST] Activation du mode temporel...');
        temporalButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } else {
      console.log('⚠️ [TEST] Bouton temporel non trouvé, le graphique devrait s\'afficher par défaut');
    }
    
    console.log('🧪 [TEST] Étape 3: Vérification de l\'affichage du graphique');
    
    // Chercher le graphique FC
    let heartRateChart = garminModule.querySelector('.garmin-hr-temporal-chart');
    let attempts = 0;
    const maxAttempts = 5;
    
    // Attendre que le graphique apparaisse (avec retry)
    while (!heartRateChart && attempts < maxAttempts) {
      console.log(`🔄 [TEST] Tentative ${attempts + 1}/${maxAttempts} - Recherche du graphique...`);
      
      // Forcer le rechargement des données
      const syncButton = garminModule.querySelector('.sync-button');
      if (syncButton) {
        syncButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      heartRateChart = garminModule.querySelector('.garmin-hr-temporal-chart');
      attempts++;
      
      if (!heartRateChart) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    if (!heartRateChart) {
      console.error('❌ [TEST] Graphique FC non trouvé après plusieurs tentatives');
      
      // Diagnostiquer les états d'erreur
      const errorState = garminModule.querySelector('.charts-error-state');
      const emptyState = garminModule.querySelector('.charts-empty-state');
      const loadingState = garminModule.querySelector('.charts-loading-state');
      
      if (errorState) {
        const errorMessage = errorState.querySelector('.error-message');
        console.error(`🚨 [TEST] État d'erreur: ${errorMessage?.textContent}`);
      }
      
      if (emptyState) {
        const emptyMessage = emptyState.querySelector('.empty-state-message');
        console.error(`📭 [TEST] État vide: ${emptyMessage?.textContent}`);
      }
      
      if (loadingState) {
        console.log('⏳ [TEST] Graphique en cours de chargement...');
      }
      
      return false;
    }
    
    console.log('✅ [TEST] Graphique FC trouvé!');
    
    console.log('🧪 [TEST] Étape 4: Vérification des données du graphique');
    
    // Vérifier la présence du container Recharts
    const rechartContainer = heartRateChart.querySelector('.recharts-wrapper');
    if (!rechartContainer) {
      console.error('❌ [TEST] Container Recharts non trouvé');
      return false;
    }
    
    console.log('✅ [TEST] Container Recharts trouvé');
    
    // Vérifier la présence de la surface graphique
    const surface = rechartContainer.querySelector('.recharts-surface');
    if (!surface) {
      console.error('❌ [TEST] Surface graphique non trouvée');
      return false;
    }
    
    console.log('✅ [TEST] Surface graphique trouvée');
    
    // Vérifier la présence de points de données
    const dataPoints = rechartContainer.querySelectorAll('.recharts-dot');
    console.log(`📍 [TEST] Points de données trouvés: ${dataPoints.length}`);
    
    if (dataPoints.length === 0) {
      console.warn('⚠️ [TEST] Aucun point de données visible, vérification de la courbe...');
      
      // Vérifier la présence de la courbe area
      const areaPath = rechartContainer.querySelector('.recharts-area-area');
      if (areaPath) {
        console.log('✅ [TEST] Courbe area trouvée');
      } else {
        console.error('❌ [TEST] Aucune courbe area trouvée');
        return false;
      }
    }
    
    console.log('🧪 [TEST] Étape 5: Vérification de l\'en-tête du graphique');
    
    // Vérifier l'en-tête "7 jours"
    const chartHeader = heartRateChart.querySelector('.chart-header h4');
    if (chartHeader && chartHeader.textContent.includes('7 jours')) {
      console.log('✅ [TEST] En-tête "7 jours" confirmé');
    } else {
      console.warn('⚠️ [TEST] En-tête "7 jours" non trouvé ou incorrect');
    }
    
    console.log('🧪 [TEST] Étape 6: Test d\'interactivité');
    
    // Tester le bouton Sync
    const syncButton = garminModule.querySelector('.sync-button');
    if (syncButton) {
      console.log('✅ [TEST] Bouton Sync trouvé');
      
      // Simuler un clic sur le bouton Sync
      console.log('🔄 [TEST] Test du bouton Sync...');
      syncButton.click();
      
      // Attendre et vérifier que le graphique est toujours là
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const chartAfterSync = garminModule.querySelector('.garmin-hr-temporal-chart');
      if (chartAfterSync) {
        console.log('✅ [TEST] Graphique toujours présent après Sync');
      } else {
        console.warn('⚠️ [TEST] Graphique disparu après Sync');
      }
    }
    
    console.log('🧪 [TEST] Étape 7: Comparaison avec le sous-onglet Garmin');
    
    // Naviguer vers l'onglet Sport pour comparer
    const sportTab = document.querySelector('[data-tab="sport"]');
    if (sportTab) {
      const wasActive = sportTab.classList.contains('active');
      
      if (!wasActive) {
        console.log('🏃 [TEST] Navigation vers l\'onglet Sport...');
        sportTab.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Chercher le sous-onglet Garmin
      const garminSubTab = document.querySelector('[data-subtab="garmin"]') || 
                          Array.from(document.querySelectorAll('button')).find(
                            btn => btn.textContent.includes('Garmin')
                          );
      
      if (garminSubTab) {
        const wasSubTabActive = garminSubTab.classList.contains('active');
        
        if (!wasSubTabActive) {
          console.log('⌚ [TEST] Navigation vers le sous-onglet Garmin...');
          garminSubTab.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Chercher le graphique dans le sous-onglet
        const subTabChart = document.querySelector('.garmin-heart-rate-chart') ||
                           document.querySelector('[class*="heart-rate"]');
        
        if (subTabChart) {
          const subTabDataPoints = subTabChart.querySelectorAll('.recharts-dot');
          console.log(`📊 [TEST] Points dans sous-onglet: ${subTabDataPoints.length}`);
          console.log(`📊 [TEST] Points dans sidebar: ${dataPoints.length}`);
          
          if (subTabDataPoints.length > 0 && dataPoints.length > 0) {
            console.log('✅ [TEST] Les deux graphiques ont des données');
          } else if (subTabDataPoints.length > 0 && dataPoints.length === 0) {
            console.warn('⚠️ [TEST] Le sous-onglet a des données mais pas la sidebar');
          } else if (subTabDataPoints.length === 0 && dataPoints.length > 0) {
            console.log('✅ [TEST] La sidebar a des données même si le sous-onglet n\'en a pas');
          }
        }
        
        // Revenir à l'onglet précédent si nécessaire
        if (!wasActive) {
          const dashboardTab = document.querySelector('[data-tab="dashboard"]');
          if (dashboardTab) {
            dashboardTab.click();
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }
    
    console.log('✅ [TEST] Test terminé avec succès!');
    
    // Résumé des résultats
    console.log('\n📋 [TEST] RÉSUMÉ DES RÉSULTATS:');
    console.log(`- Module Garmin: ✅`);
    console.log(`- Graphique FC: ✅`);
    console.log(`- Container Recharts: ✅`);
    console.log(`- Surface graphique: ✅`);
    console.log(`- Points de données: ${dataPoints.length > 0 ? '✅' : '⚠️'} (${dataPoints.length})`);
    console.log(`- En-tête "7 jours": ${chartHeader?.textContent.includes('7 jours') ? '✅' : '⚠️'}`);
    console.log(`- Bouton Sync: ${syncButton ? '✅' : '⚠️'}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ [TEST] Erreur lors du test:', error);
    return false;
  }
}

// Fonction pour tester les données en mémoire
function testDataInMemory() {
  console.log('🧪 [TEST] Test des données en mémoire...');
  
  // Vérifier les données dans localStorage
  const garminKeys = Object.keys(localStorage).filter(key => 
    key.includes('garmin') || key.includes('sport') || key.includes('heartRate')
  );
  
  console.log(`💾 [TEST] Clés Garmin dans localStorage: ${garminKeys.length}`);
  
  garminKeys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log(`🔑 [TEST] ${key}:`, {
          hasHeartRateTimeSeries: !!parsed.heartRateTimeSeries,
          timeSeriesLength: parsed.heartRateTimeSeries?.length || 0,
          hasData: parsed.hasData
        });
      } catch (e) {
        console.log(`🔑 [TEST] ${key}: ${data.substring(0, 50)}...`);
      }
    }
  });
  
  // Vérifier les services globaux
  if (window.garminRealDataService) {
    console.log('✅ [TEST] Service garminRealDataService disponible');
    
    if (window.garminRealDataService.cache) {
      console.log(`💾 [TEST] Cache du service: ${window.garminRealDataService.cache.size || 0} entrées`);
    }
  } else {
    console.warn('⚠️ [TEST] Service garminRealDataService non disponible');
  }
}

// Fonction pour afficher un rapport de test
function displayTestReport(success) {
  const report = document.createElement('div');
  report.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${success ? '#10B981' : '#EF4444'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 500;
    max-width: 300px;
  `;
  
  report.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
      <span style="font-size: 18px;">${success ? '✅' : '❌'}</span>
      <strong>Test du correctif FC</strong>
    </div>
    <div style="font-size: 12px; opacity: 0.9;">
      ${success ? 
        'Le graphique FC s\'affiche correctement dans la sidebar avec les données sur 7 jours.' : 
        'Le graphique FC ne s\'affiche toujours pas correctement. Vérifiez la console pour plus de détails.'
      }
    </div>
  `;
  
  document.body.appendChild(report);
  
  setTimeout(() => {
    report.remove();
  }, 8000);
}

// Exporter les fonctions de test
window.testGarminSidebarChartFix = testGarminSidebarChartFix;
window.testDataInMemory = testDataInMemory;

console.log('🧪 [TEST] Fonctions de test disponibles:');
console.log('- testGarminSidebarChartFix() : Test complet du correctif');
console.log('- testDataInMemory() : Test des données en mémoire');

// Lancer le test automatiquement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre que tout soit chargé
    const success = await testGarminSidebarChartFix();
    displayTestReport(success);
  });
} else {
  setTimeout(async () => {
    const success = await testGarminSidebarChartFix();
    displayTestReport(success);
  }, 2000);
}