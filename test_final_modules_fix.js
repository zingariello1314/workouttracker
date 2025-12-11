/**
 * TEST FINAL - Vérification du fix des modules historiques
 * Script à exécuter dans la console du navigateur pour valider la correction
 */

console.log('🎯 TEST FINAL - VÉRIFICATION FIX MODULES HISTORIQUES');

// Fonction pour analyser l'état actuel des modules
function analyzeCurrentState() {
  console.log('\n📊 ANALYSE ÉTAT ACTUEL:');
  
  // Trouver tous les modules
  const legacyModules = document.querySelectorAll('[data-module-type="legacy"]');
  const historicalModules = document.querySelectorAll('[data-module-type="historical"]');
  
  console.log(`Modules legacy: ${legacyModules.length}`);
  console.log(`Modules historiques: ${historicalModules.length}`);
  
  // Analyser les modules legacy (référence)
  console.log('\n🔵 MODULES LEGACY (référence):');
  let legacyWithContent = 0;
  
  legacyModules.forEach((module, index) => {
    const moduleClass = Array.from(module.classList).find(c => c.includes('-section'));
    const content = module.querySelector('.sidebar-section-content');
    const hasContent = content && content.innerHTML.trim().length > 100;
    
    if (hasContent) legacyWithContent++;
    
    console.log(`${index + 1}. ${moduleClass}: ${hasContent ? '✅' : '❌'} (${content ? content.innerHTML.trim().length : 0} chars)`);
  });
  
  // Analyser les modules historiques
  console.log('\n🟢 MODULES HISTORIQUES:');
  let historicalWithContent = 0;
  
  historicalModules.forEach((module, index) => {
    const moduleId = module.getAttribute('data-module-id');
    const content = module.querySelector('.sidebar-section-content');
    const hasContent = content && content.innerHTML.trim().length > 100;
    
    if (hasContent) historicalWithContent++;
    
    console.log(`${index + 1}. ${moduleId}: ${hasContent ? '✅' : '❌'} (${content ? content.innerHTML.trim().length : 0} chars)`);
    
    // Analyser le contenu plus en détail
    if (content) {
      const buttons = content.querySelectorAll('button').length;
      const inputs = content.querySelectorAll('input, select').length;
      const stats = content.querySelectorAll('.stat-item, .metric-item, .quest-item').length;
      
      if (buttons > 0 || inputs > 0 || stats > 0) {
        console.log(`   └─ Éléments: ${buttons} boutons, ${inputs} inputs, ${stats} stats`);
      }
    }
  });
  
  return {
    legacy: { total: legacyModules.length, withContent: legacyWithContent },
    historical: { total: historicalModules.length, withContent: historicalWithContent }
  };
}

// Fonction pour tester l'interactivité
function testInteractivity() {
  console.log('\n🖱️ TEST INTERACTIVITÉ:');
  
  const historicalButtons = document.querySelectorAll('[data-module-type="historical"] button');
  console.log(`Boutons dans modules historiques: ${historicalButtons.length}`);
  
  let interactiveButtons = 0;
  
  historicalButtons.forEach((button, index) => {
    const hasHover = window.getComputedStyle(button).cursor === 'pointer';
    const hasTransition = window.getComputedStyle(button).transition.includes('all') || 
                         window.getComputedStyle(button).transition.includes('background');
    
    if (hasHover || hasTransition) {
      interactiveButtons++;
    }
    
    if (index < 5) { // Afficher seulement les 5 premiers pour éviter le spam
      console.log(`Bouton ${index + 1}: ${hasHover ? '✅' : '❌'} cursor, ${hasTransition ? '✅' : '❌'} transition`);
    }
  });
  
  console.log(`Boutons interactifs: ${interactiveButtons}/${historicalButtons.length}`);
  
  return interactiveButtons;
}

// Fonction pour vérifier la navigation
function testNavigation() {
  console.log('\n🧭 TEST NAVIGATION:');
  
  const navButtons = document.querySelectorAll('[data-module-type="historical"] button[aria-label*="Naviguer"], [data-module-type="historical"] .nav-button');
  console.log(`Boutons de navigation: ${navButtons.length}`);
  
  navButtons.forEach((button, index) => {
    const ariaLabel = button.getAttribute('aria-label');
    const hasNavigation = ariaLabel && ariaLabel.includes('Naviguer');
    console.log(`Nav ${index + 1}: ${hasNavigation ? '✅' : '❌'} ${ariaLabel || 'Pas de label'}`);
  });
  
  return navButtons.length;
}

// Fonction pour vérifier les données
function testDataFlow() {
  console.log('\n📊 TEST FLUX DE DONNÉES:');
  
  const historicalModules = document.querySelectorAll('[data-module-type="historical"]');
  let modulesWithData = 0;
  
  historicalModules.forEach((module, index) => {
    const moduleId = module.getAttribute('data-module-id');
    
    // Essayer d'accéder aux props React
    const reactKeys = Object.keys(module).filter(key => 
      key.startsWith('__reactFiber') || 
      key.startsWith('_reactInternalFiber') ||
      key.startsWith('__reactInternalInstance')
    );
    
    if (reactKeys.length > 0) {
      try {
        const fiber = module[reactKeys[0]];
        const props = fiber?.memoizedProps || fiber?.return?.memoizedProps;
        
        if (props && props.data) {
          modulesWithData++;
          const dataKeys = Object.keys(props.data);
          console.log(`${index + 1}. ${moduleId}: ✅ Data (${dataKeys.length} clés: ${dataKeys.join(', ')})`);
        } else {
          console.log(`${index + 1}. ${moduleId}: ❌ Pas de data dans les props`);
        }
      } catch (error) {
        console.log(`${index + 1}. ${moduleId}: ❌ Erreur accès props: ${error.message}`);
      }
    } else {
      console.log(`${index + 1}. ${moduleId}: ❌ Pas de props React accessibles`);
    }
  });
  
  console.log(`Modules avec données: ${modulesWithData}/${historicalModules.length}`);
  
  return modulesWithData;
}

// Fonction principale de test
function runFinalTest() {
  console.log('🚀 DÉMARRAGE TEST FINAL\n');
  
  try {
    // 1. Analyser l'état actuel
    const state = analyzeCurrentState();
    
    // 2. Tester l'interactivité
    const interactiveButtons = testInteractivity();
    
    // 3. Tester la navigation
    const navButtons = testNavigation();
    
    // 4. Tester le flux de données
    const modulesWithData = testDataFlow();
    
    // 5. Calculer les scores
    console.log('\n🏆 SCORES FINAUX:');
    
    const legacyScore = state.legacy.total > 0 ? Math.round((state.legacy.withContent / state.legacy.total) * 100) : 0;
    const historicalScore = state.historical.total > 0 ? Math.round((state.historical.withContent / state.historical.total) * 100) : 0;
    const interactivityScore = historicalButtons > 0 ? Math.round((interactiveButtons / historicalButtons) * 100) : 0;
    const dataScore = state.historical.total > 0 ? Math.round((modulesWithData / state.historical.total) * 100) : 0;
    
    console.log(`📊 Modules legacy avec contenu: ${legacyScore}% (${state.legacy.withContent}/${state.legacy.total})`);
    console.log(`📊 Modules historiques avec contenu: ${historicalScore}% (${state.historical.withContent}/${state.historical.total})`);
    console.log(`🖱️ Boutons interactifs: ${interactivityScore}%`);
    console.log(`📊 Modules avec données: ${dataScore}%`);
    
    // Score global
    const globalScore = Math.round((historicalScore + interactivityScore + dataScore) / 3);
    console.log(`\n🎯 SCORE GLOBAL: ${globalScore}%`);
    
    // Évaluation
    if (globalScore >= 90) {
      console.log('🎉 EXCELLENT! Le fix fonctionne parfaitement!');
    } else if (globalScore >= 70) {
      console.log('✅ TRÈS BIEN! Le fix fonctionne bien');
    } else if (globalScore >= 50) {
      console.log('⚠️ CORRECT! Le fix fonctionne partiellement');
    } else {
      console.log('❌ PROBLÈME! Le fix ne fonctionne pas correctement');
    }
    
    // Comparaison avec les modules legacy
    if (historicalScore >= legacyScore - 10) {
      console.log('✅ Les modules historiques sont au niveau des modules legacy');
    } else {
      console.log('⚠️ Les modules historiques sont en retard par rapport aux modules legacy');
    }
    
    // Recommandations
    if (historicalScore < 80) {
      console.log('\n💡 RECOMMANDATIONS:');
      if (dataScore < 80) {
        console.log('- Vérifier que ModuleRenderer passe bien les données aux modules');
      }
      if (interactivityScore < 80) {
        console.log('- Vérifier les styles CSS des boutons et interactions');
      }
      if (historicalScore < 50) {
        console.log('- Vérifier que les modules utilisent bien les props.data');
        console.log('- Ajouter des fallbacks pour les données manquantes');
      }
    }
    
    return {
      legacyScore,
      historicalScore,
      interactivityScore,
      dataScore,
      globalScore,
      success: globalScore >= 70
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return null;
  }
}

// Variables globales pour les tests
let historicalButtons = 0;

// Compter les boutons historiques
setTimeout(() => {
  historicalButtons = document.querySelectorAll('[data-module-type="historical"] button').length;
}, 100);

// Lancer le test automatiquement
setTimeout(() => {
  const result = runFinalTest();
  
  if (result) {
    console.log('\n📋 RÉSUMÉ:');
    console.log(`Le fix des modules historiques est ${result.success ? 'RÉUSSI' : 'PARTIELLEMENT RÉUSSI'}`);
    console.log(`Score global: ${result.globalScore}%`);
    
    // Sauvegarder les résultats
    window.testResults = {
      timestamp: new Date().toISOString(),
      ...result
    };
  }
}, 2000);

// Fonctions utilitaires
window.runFinalTest = runFinalTest;
window.analyzeCurrentState = analyzeCurrentState;

console.log('\n💡 COMMANDES DISPONIBLES:');
console.log('- runFinalTest() : Lancer le test complet');
console.log('- analyzeCurrentState() : Analyser l\'état actuel');
console.log('- window.testResults : Voir les derniers résultats');