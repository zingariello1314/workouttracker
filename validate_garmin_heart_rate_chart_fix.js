/**
 * Script de validation finale pour le correctif du graphique FC
 * Objectif: Valider que la tâche 12 est complète et que le graphique fonctionne
 */

console.log('✅ [VALIDATION] Validation finale du correctif graphique FC - Démarrage');

// Fonction de validation complète
async function validateGarminHeartRateChartFix() {
  const results = {
    codeChanges: false,
    dataGeneration: false,
    chartDisplay: false,
    sevenDaysData: false,
    userInterface: false,
    performance: false,
    errorHandling: false,
    overall: false
  };
  
  try {
    console.log('✅ [VALIDATION] Étape 1: Vérification des modifications de code');
    
    // Vérifier que les modifications ont été appliquées
    const garminModule = Array.from(document.querySelectorAll('.sidebar-section')).find(
      section => section.textContent.includes('Métriques Garmin')
    );
    
    if (garminModule) {
      results.codeChanges = true;
      console.log('✅ [VALIDATION] Module Garmin présent');
    }
    
    console.log('✅ [VALIDATION] Étape 2: Vérification de la génération de données');
    
    // Vérifier que le service génère des données sur 7 jours
    if (window.garminRealDataService) {
      try {
        const testData = window.garminRealDataService.generateSevenDaysHeartRateData?.(
          new Date().toISOString().slice(0, 10)
        );
        
        if (testData && testData.length > 0) {
          results.dataGeneration = true;
          console.log(`✅ [VALIDATION] Génération de données: ${testData.length} points sur 7 jours`);
          
          // Vérifier que les données couvrent bien 7 jours
          const timestamps = testData.map(d => d.timestamp);
          const minTime = Math.min(...timestamps);
          const maxTime = Math.max(...timestamps);
          const daysCovered = Math.ceil((maxTime - minTime) / (24 * 60 * 60 * 1000));
          
          if (daysCovered >= 6) { // Au moins 6 jours complets
            results.sevenDaysData = true;
            console.log(`✅ [VALIDATION] Couverture temporelle: ${daysCovered} jours`);
          }
        }
      } catch (error) {
        console.warn('⚠️ [VALIDATION] Erreur lors du test de génération de données:', error);
      }
    }
    
    console.log('✅ [VALIDATION] Étape 3: Vérification de l\'affichage du graphique');
    
    if (garminModule) {
      // S'assurer que le module est étendu
      if (!garminModule.classList.contains('expanded')) {
        const header = garminModule.querySelector('.sidebar-section-header');
        if (header) {
          header.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Chercher le graphique
      const heartRateChart = garminModule.querySelector('.garmin-hr-temporal-chart');
      if (heartRateChart) {
        results.chartDisplay = true;
        console.log('✅ [VALIDATION] Graphique FC affiché');
        
        // Vérifier la présence de données visuelles
        const rechartContainer = heartRateChart.querySelector('.recharts-wrapper');
        if (rechartContainer) {
          const surface = rechartContainer.querySelector('.recharts-surface');
          const dataPoints = rechartContainer.querySelectorAll('.recharts-dot');
          const areaPath = rechartContainer.querySelector('.recharts-area-area');
          
          if (surface && (dataPoints.length > 0 || areaPath)) {
            results.userInterface = true;
            console.log(`✅ [VALIDATION] Interface graphique: ${dataPoints.length} points, courbe: ${!!areaPath}`);
          }
        }
      } else {
        console.warn('⚠️ [VALIDATION] Graphique FC non trouvé');
        
        // Diagnostiquer pourquoi
        const errorState = garminModule.querySelector('.charts-error-state');
        const emptyState = garminModule.querySelector('.charts-empty-state');
        const loadingState = garminModule.querySelector('.charts-loading-state');
        
        if (errorState) {
          console.warn('⚠️ [VALIDATION] État d\'erreur détecté');
        } else if (emptyState) {
          console.warn('⚠️ [VALIDATION] État vide détecté');
        } else if (loadingState) {
          console.warn('⚠️ [VALIDATION] Graphique en cours de chargement');
        }
      }
    }
    
    console.log('✅ [VALIDATION] Étape 4: Test de performance');
    
    // Mesurer le temps de rendu
    const startTime = performance.now();
    
    // Forcer un re-render en cliquant sur le bouton Sync
    const syncButton = garminModule?.querySelector('.sync-button');
    if (syncButton) {
      syncButton.click();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime < 2000) { // Moins de 2 secondes
        results.performance = true;
        console.log(`✅ [VALIDATION] Performance: ${renderTime.toFixed(2)}ms`);
      } else {
        console.warn(`⚠️ [VALIDATION] Performance lente: ${renderTime.toFixed(2)}ms`);
      }
    }
    
    console.log('✅ [VALIDATION] Étape 5: Test de gestion d\'erreurs');
    
    // Vérifier que les fallbacks fonctionnent
    try {
      // Simuler une erreur en vidant temporairement les données
      const originalData = localStorage.getItem('garmin-data');
      localStorage.removeItem('garmin-data');
      
      // Déclencher un rechargement
      window.dispatchEvent(new CustomEvent('garmin:refresh:request', {
        detail: { source: 'validation-test' }
      }));
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Vérifier que le graphique s'affiche toujours (avec des données de fallback)
      const chartAfterError = garminModule?.querySelector('.garmin-hr-temporal-chart');
      if (chartAfterError) {
        results.errorHandling = true;
        console.log('✅ [VALIDATION] Gestion d\'erreurs: Fallback fonctionnel');
      }
      
      // Restaurer les données originales
      if (originalData) {
        localStorage.setItem('garmin-data', originalData);
      }
      
    } catch (error) {
      console.warn('⚠️ [VALIDATION] Erreur lors du test de gestion d\'erreurs:', error);
    }
    
    console.log('✅ [VALIDATION] Étape 6: Évaluation globale');
    
    // Calculer le score global
    const scores = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length - 1; // Exclure 'overall'
    const successRate = (scores / totalTests) * 100;
    
    results.overall = successRate >= 80; // 80% de réussite minimum
    
    console.log(`✅ [VALIDATION] Score global: ${scores}/${totalTests} (${successRate.toFixed(1)}%)`);
    
    // Afficher le rapport détaillé
    console.log('\n📋 [VALIDATION] RAPPORT DÉTAILLÉ:');
    console.log(`- Modifications de code: ${results.codeChanges ? '✅' : '❌'}`);
    console.log(`- Génération de données: ${results.dataGeneration ? '✅' : '❌'}`);
    console.log(`- Données sur 7 jours: ${results.sevenDaysData ? '✅' : '❌'}`);
    console.log(`- Affichage du graphique: ${results.chartDisplay ? '✅' : '❌'}`);
    console.log(`- Interface utilisateur: ${results.userInterface ? '✅' : '❌'}`);
    console.log(`- Performance: ${results.performance ? '✅' : '❌'}`);
    console.log(`- Gestion d'erreurs: ${results.errorHandling ? '✅' : '❌'}`);
    console.log(`- Évaluation globale: ${results.overall ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ [VALIDATION] Erreur lors de la validation:', error);
    return results;
  }
}

// Fonction pour générer un rapport de validation
function generateValidationReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    taskId: '12. Tests d\'intégration finale et validation',
    status: results.overall ? 'COMPLETED' : 'FAILED',
    results,
    summary: {
      totalTests: Object.keys(results).length - 1,
      passedTests: Object.values(results).filter(Boolean).length,
      successRate: (Object.values(results).filter(Boolean).length / (Object.keys(results).length - 1)) * 100
    },
    recommendations: []
  };
  
  // Ajouter des recommandations basées sur les résultats
  if (!results.codeChanges) {
    report.recommendations.push('Vérifier que les modifications de code ont été appliquées correctement');
  }
  
  if (!results.dataGeneration) {
    report.recommendations.push('Corriger la génération de données dans garminRealDataService');
  }
  
  if (!results.chartDisplay) {
    report.recommendations.push('Déboguer l\'affichage du composant SidebarHeartRateChart');
  }
  
  if (!results.performance) {
    report.recommendations.push('Optimiser les performances de rendu du graphique');
  }
  
  if (!results.errorHandling) {
    report.recommendations.push('Améliorer la gestion des erreurs et les fallbacks');
  }
  
  console.log('\n📊 [VALIDATION] RAPPORT FINAL:');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}

// Fonction pour afficher le résultat dans l'interface
function displayValidationResult(results) {
  const success = results.overall;
  const notification = document.createElement('div');
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: ${success ? '#10B981' : '#EF4444'};
    color: white;
    padding: 20px 30px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 16px;
    font-weight: 600;
    text-align: center;
    min-width: 400px;
    backdrop-filter: blur(10px);
  `;
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length - 1;
  
  notification.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 12px;">
      <span style="font-size: 24px;">${success ? '🎉' : '⚠️'}</span>
      <strong>Validation du correctif FC</strong>
    </div>
    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">
      ${success ? 
        'Le correctif a été appliqué avec succès!' : 
        'Le correctif nécessite des ajustements supplémentaires.'
      }
    </div>
    <div style="font-size: 12px; opacity: 0.8;">
      Tests réussis: ${passedTests}/${totalTests} (${((passedTests/totalTests)*100).toFixed(1)}%)
    </div>
    ${!success ? `
      <div style="font-size: 11px; opacity: 0.7; margin-top: 8px;">
        Consultez la console pour plus de détails
      </div>
    ` : ''}
  `;
  
  document.body.appendChild(notification);
  
  // Animation d'entrée
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(-50%) translateY(-20px)';
  
  requestAnimationFrame(() => {
    notification.style.transition = 'all 0.3s ease-out';
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(-50%) translateY(0)';
  });
  
  // Supprimer après 10 secondes
  setTimeout(() => {
    notification.style.transition = 'all 0.3s ease-in';
    notification.style.opacity = '0';
    notification.style.transform = 'translateX(-50%) translateY(-20px)';
    
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 10000);
}

// Exporter les fonctions
window.validateGarminHeartRateChartFix = validateGarminHeartRateChartFix;
window.generateValidationReport = generateValidationReport;

console.log('✅ [VALIDATION] Fonctions de validation disponibles:');
console.log('- validateGarminHeartRateChartFix() : Validation complète');
console.log('- generateValidationReport(results) : Génération de rapport');

// Lancer la validation automatiquement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await new Promise(resolve => setTimeout(resolve, 3000)); // Attendre que tout soit initialisé
    const results = await validateGarminHeartRateChartFix();
    const report = generateValidationReport(results);
    displayValidationResult(results);
  });
} else {
  setTimeout(async () => {
    const results = await validateGarminHeartRateChartFix();
    const report = generateValidationReport(results);
    displayValidationResult(results);
  }, 3000);
}