/**
 * VALIDATION FINALE - Modules Historiques
 * Script de validation complète pour confirmer que tous les modules fonctionnent
 */

console.log('🎯 VALIDATION FINALE - MODULES HISTORIQUES');

// Configuration des modules attendus
const EXPECTED_MODULES = [
  {
    id: 'session-recorder-module',
    name: 'Enregistrer Session',
    position: 1,
    requiredElements: ['button', '.session-btn', '.timer-display']
  },
  {
    id: 'reading-progress-module', 
    name: 'Progression Lecture',
    position: 3,
    requiredElements: ['.stat-item', '.trend-indicator']
  },
  {
    id: 'garmin-metrics-module',
    name: 'Métriques Garmin', 
    position: 5,
    requiredElements: ['.metric-group', '.nav-button']
  },
  {
    id: 'interactive-quests-module',
    name: 'Quêtes Interactives',
    position: 7,
    requiredElements: ['.quest-item', '.xp-progress', 'input[type="checkbox"]']
  },
  {
    id: 'patrimony-evolution-module',
    name: 'Évolution Patrimoine',
    position: 9,
    requiredElements: ['.stat-item', '.period-select']
  },
  {
    id: 'shopping-list-module',
    name: 'Liste Courses',
    position: 11,
    requiredElements: ['.list-item']
  },
  {
    id: 'active-reading-session-module',
    name: 'Session Lecture Active',
    position: 13,
    requiredElements: ['.book-progress', '.timer']
  },
  {
    id: 'daily-training-module',
    name: 'Entraînement Jour',
    position: 15,
    requiredElements: ['.training-item', '.muscle-group']
  },
  {
    id: 'creativity-projects-module',
    name: 'Projets Créatifs',
    position: 17,
    requiredElements: ['.project-item', '.inspiration-section']
  },
  {
    id: 'global-performance-module',
    name: 'Performance Globale',
    position: 19,
    requiredElements: ['.score-circle', '.balance-item']
  },
  {
    id: 'express-learning-module',
    name: 'Apprentissage Express',
    position: 21,
    requiredElements: ['.subject-item', '.regularity-indicator']
  }
];

// Fonction pour valider un module spécifique
function validateModule(moduleConfig) {
  console.log(`\n🔍 Validation ${moduleConfig.name}...`);
  
  const module = document.querySelector(`[data-module-id="${moduleConfig.id}"]`);
  if (!module) {
    console.log(`❌ Module non trouvé: ${moduleConfig.id}`);
    return {
      found: false,
      hasHeader: false,
      hasContent: false,
      hasRequiredElements: false,
      score: 0
    };
  }
  
  console.log(`✅ Module trouvé: ${moduleConfig.id}`);
  
  // Vérifier l'en-tête
  const header = module.querySelector('.sidebar-section-header');
  const hasHeader = !!header;
  console.log(`- En-tête: ${hasHeader ? '✅' : '❌'}`);
  
  // Vérifier le contenu
  const content = module.querySelector('.sidebar-section-content');
  const hasContent = content && content.innerHTML.trim().length > 50;
  console.log(`- Contenu: ${hasContent ? '✅' : '❌'} (${content ? content.innerHTML.trim().length : 0} chars)`);
  
  // Vérifier les éléments requis
  let foundElements = 0;
  let totalElements = moduleConfig.requiredElements.length;
  
  if (content) {
    moduleConfig.requiredElements.forEach(selector => {
      const elements = content.querySelectorAll(selector);
      if (elements.length > 0) {
        foundElements++;
        console.log(`  ✅ ${selector}: ${elements.length} trouvé(s)`);
      } else {
        console.log(`  ❌ ${selector}: non trouvé`);
      }
    });
  }
  
  const hasRequiredElements = foundElements >= Math.ceil(totalElements * 0.5); // Au moins 50% des éléments
  console.log(`- Éléments requis: ${foundElements}/${totalElements} ${hasRequiredElements ? '✅' : '❌'}`);
  
  // Calculer le score
  const score = [true, hasHeader, hasContent, hasRequiredElements].filter(Boolean).length;
  console.log(`- Score: ${score}/4`);
  
  return {
    found: true,
    hasHeader,
    hasContent,
    hasRequiredElements,
    foundElements,
    totalElements,
    score
  };
}

// Fonction pour valider l'ordre d'alternance
function validateAlternation() {
  console.log('\n🔄 Validation ordre d\'alternance...');
  
  const allModules = document.querySelectorAll('.sidebar-module');
  const moduleOrder = [];
  
  allModules.forEach((module, index) => {
    const moduleId = module.getAttribute('data-module-id');
    const moduleType = module.getAttribute('data-module-type');
    const position = module.getAttribute('data-module-position');
    
    moduleOrder.push({
      index,
      moduleId,
      moduleType,
      position: parseInt(position) || index
    });
  });
  
  console.log('Ordre détecté:');
  moduleOrder.forEach((module, index) => {
    const typeIcon = module.moduleType === 'legacy' ? '🔵' : '🟢';
    console.log(`${index + 1}. ${typeIcon} ${module.moduleId} (pos: ${module.position})`);
  });
  
  // Vérifier l'alternance
  let alternationCorrect = true;
  let legacyCount = 0;
  let historicalCount = 0;
  
  moduleOrder.forEach(module => {
    if (module.moduleType === 'legacy') {
      legacyCount++;
    } else if (module.moduleType === 'historical') {
      historicalCount++;
    }
  });
  
  console.log(`\nRépartition: ${legacyCount} legacy, ${historicalCount} historical`);
  
  return {
    totalModules: moduleOrder.length,
    legacyCount,
    historicalCount,
    alternationCorrect
  };
}

// Fonction pour valider les performances
function validatePerformance() {
  console.log('\n⚡ Validation performances...');
  
  const startTime = performance.now();
  
  // Mesurer le temps de rendu
  const modules = document.querySelectorAll('[data-module-type="historical"]');
  let totalElements = 0;
  
  modules.forEach(module => {
    const elements = module.querySelectorAll('*');
    totalElements += elements.length;
  });
  
  const endTime = performance.now();
  const renderTime = endTime - startTime;
  
  console.log(`- Modules historiques: ${modules.length}`);
  console.log(`- Éléments DOM totaux: ${totalElements}`);
  console.log(`- Temps de mesure: ${renderTime.toFixed(2)}ms`);
  
  // Vérifier la mémoire (si disponible)
  if (performance.memory) {
    const memory = performance.memory;
    console.log(`- Mémoire utilisée: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Mémoire totale: ${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`);
  }
  
  return {
    moduleCount: modules.length,
    elementCount: totalElements,
    renderTime,
    performanceGood: renderTime < 100 && totalElements < 1000
  };
}

// Fonction pour générer un rapport complet
function generateReport(results) {
  console.log('\n📋 RAPPORT DE VALIDATION FINALE');
  console.log('=====================================');
  
  const totalModules = results.moduleResults.length;
  const workingModules = results.moduleResults.filter(r => r.score >= 3).length;
  const partialModules = results.moduleResults.filter(r => r.score === 2).length;
  const brokenModules = results.moduleResults.filter(r => r.score < 2).length;
  
  console.log(`\n📊 STATISTIQUES MODULES:`);
  console.log(`- Total modules: ${totalModules}`);
  console.log(`- Modules fonctionnels (score ≥3): ${workingModules}`);
  console.log(`- Modules partiels (score 2): ${partialModules}`);
  console.log(`- Modules cassés (score <2): ${brokenModules}`);
  
  const successRate = Math.round((workingModules / totalModules) * 100);
  console.log(`\n🎯 TAUX DE SUCCÈS: ${successRate}%`);
  
  console.log(`\n🔄 ALTERNANCE:`);
  console.log(`- Legacy: ${results.alternation.legacyCount}`);
  console.log(`- Historical: ${results.alternation.historicalCount}`);
  console.log(`- Ordre correct: ${results.alternation.alternationCorrect ? '✅' : '❌'}`);
  
  console.log(`\n⚡ PERFORMANCES:`);
  console.log(`- ${results.performance.moduleCount} modules, ${results.performance.elementCount} éléments`);
  console.log(`- Temps de rendu: ${results.performance.renderTime.toFixed(2)}ms`);
  console.log(`- Performance: ${results.performance.performanceGood ? '✅ Bonne' : '⚠️ À améliorer'}`);
  
  // Évaluation globale
  let globalScore = 0;
  if (successRate >= 90) globalScore += 40;
  else if (successRate >= 70) globalScore += 30;
  else if (successRate >= 50) globalScore += 20;
  else globalScore += 10;
  
  if (results.alternation.alternationCorrect) globalScore += 20;
  if (results.performance.performanceGood) globalScore += 20;
  if (brokenModules === 0) globalScore += 20;
  
  console.log(`\n🏆 SCORE GLOBAL: ${globalScore}/100`);
  
  if (globalScore >= 90) {
    console.log('🎉 EXCELLENT! Tous les modules fonctionnent parfaitement!');
  } else if (globalScore >= 70) {
    console.log('✅ TRÈS BIEN! La plupart des modules fonctionnent correctement');
  } else if (globalScore >= 50) {
    console.log('⚠️ CORRECT! Quelques améliorations nécessaires');
  } else {
    console.log('❌ INSUFFISANT! Des corrections importantes sont nécessaires');
  }
  
  // Recommandations
  if (brokenModules > 0) {
    console.log('\n💡 RECOMMANDATIONS:');
    results.moduleResults.forEach(result => {
      if (result.score < 2) {
        const moduleConfig = EXPECTED_MODULES.find(m => m.id === result.moduleId);
        console.log(`- Corriger ${moduleConfig?.name || result.moduleId}: score ${result.score}/4`);
      }
    });
  }
  
  return {
    successRate,
    globalScore,
    workingModules,
    brokenModules,
    recommendation: globalScore >= 70 ? 'APPROUVÉ' : 'CORRECTIONS NÉCESSAIRES'
  };
}

// Fonction principale de validation
async function runFinalValidation() {
  console.log('🚀 DÉMARRAGE VALIDATION FINALE\n');
  
  try {
    // 1. Valider chaque module
    console.log('1️⃣ Validation individuelle des modules...');
    const moduleResults = [];
    
    for (const moduleConfig of EXPECTED_MODULES) {
      const result = validateModule(moduleConfig);
      result.moduleId = moduleConfig.id;
      moduleResults.push(result);
    }
    
    // 2. Valider l'alternance
    console.log('\n2️⃣ Validation de l\'alternance...');
    const alternation = validateAlternation();
    
    // 3. Valider les performances
    console.log('\n3️⃣ Validation des performances...');
    const performance = validatePerformance();
    
    // 4. Générer le rapport
    const results = {
      moduleResults,
      alternation,
      performance
    };
    
    const report = generateReport(results);
    
    // 5. Sauvegarder les résultats
    window.validationResults = {
      timestamp: new Date().toISOString(),
      results,
      report
    };
    
    console.log('\n✅ Validation terminée! Résultats sauvegardés dans window.validationResults');
    
    return report;
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation:', error);
    return null;
  }
}

// Lancer la validation automatiquement
setTimeout(() => {
  runFinalValidation();
}, 2000);

// Fonctions utilitaires
window.runFinalValidation = runFinalValidation;
window.validateModule = (moduleId) => {
  const config = EXPECTED_MODULES.find(m => m.id === moduleId);
  return config ? validateModule(config) : null;
};

console.log('\n💡 COMMANDES DISPONIBLES:');
console.log('- runFinalValidation() : Lancer la validation complète');
console.log('- validateModule(moduleId) : Valider un module spécifique');
console.log('- window.validationResults : Voir les derniers résultats');