/**
 * TEST DU FIX - Modules Historiques
 * Validation que la correction fonctionne correctement
 */

console.log('🧪 TEST DU FIX - MODULES HISTORIQUES');

// Fonction pour attendre un délai
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction pour capturer l'état avant fix
function captureBeforeState() {
  console.log('\n📸 Capture état AVANT fix...');
  
  const historicalModules = document.querySelectorAll('[data-module-type="historical"]');
  const beforeState = [];
  
  historicalModules.forEach(module => {
    const moduleId = module.getAttribute('data-module-id');
    const content = module.querySelector('.sidebar-section-content');
    const contentLength = content ? content.innerHTML.trim().length : 0;
    
    beforeState.push({
      moduleId,
      hasContent: contentLength > 100,
      contentLength
    });
    
    console.log(`- ${moduleId}: ${contentLength} chars, contenu: ${contentLength > 100 ? '✅' : '❌'}`);
  });
  
  return beforeState;
}

// Fonction pour capturer l'état après fix
function captureAfterState() {
  console.log('\n📸 Capture état APRÈS fix...');
  
  const historicalModules = document.querySelectorAll('[data-module-type="historical"]');
  const afterState = [];
  
  historicalModules.forEach(module => {
    const moduleId = module.getAttribute('data-module-id');
    const content = module.querySelector('.sidebar-section-content');
    const contentLength = content ? content.innerHTML.trim().length : 0;
    
    afterState.push({
      moduleId,
      hasContent: contentLength > 100,
      contentLength
    });
    
    console.log(`- ${moduleId}: ${contentLength} chars, contenu: ${contentLength > 100 ? '✅' : '❌'}`);
  });
  
  return afterState;
}

// Fonction pour comparer les états
function compareStates(beforeState, afterState) {
  console.log('\n📊 COMPARAISON AVANT/APRÈS:');
  
  let fixedModules = 0;
  let alreadyWorkingModules = 0;
  let stillBrokenModules = 0;
  
  beforeState.forEach((before, index) => {
    const after = afterState[index];
    
    if (!before.hasContent && after.hasContent) {
      console.log(`✅ CORRIGÉ: ${before.moduleId} (${before.contentLength} → ${after.contentLength} chars)`);
      fixedModules++;
    } else if (before.hasContent && after.hasContent) {
      console.log(`✅ DÉJÀ OK: ${before.moduleId} (${after.contentLength} chars)`);
      alreadyWorkingModules++;
    } else if (!before.hasContent && !after.hasContent) {
      console.log(`❌ TOUJOURS CASSÉ: ${before.moduleId} (${after.contentLength} chars)`);
      stillBrokenModules++;
    } else {
      console.log(`⚠️ RÉGRESSION: ${before.moduleId} (${before.contentLength} → ${after.contentLength} chars)`);
      stillBrokenModules++;
    }
  });
  
  return {
    fixedModules,
    alreadyWorkingModules,
    stillBrokenModules,
    totalModules: beforeState.length
  };
}

// Fonction pour valider visuellement les modules
function validateVisualContent() {
  console.log('\n👀 VALIDATION VISUELLE:');
  
  const historicalModules = document.querySelectorAll('[data-module-type="historical"]');
  let validModules = 0;
  
  historicalModules.forEach(module => {
    const moduleId = module.getAttribute('data-module-id');
    const content = module.querySelector('.sidebar-section-content');
    
    if (!content) {
      console.log(`❌ ${moduleId}: Pas de contenu`);
      return;
    }
    
    // Vérifier la présence d'éléments visuels
    const hasButtons = content.querySelectorAll('button').length > 0;
    const hasStats = content.querySelectorAll('.stat-item, .quest-item, .project-item').length > 0;
    const hasVisualElements = content.querySelectorAll('.bar, .circle, .progress').length > 0;
    const hasText = content.textContent.trim().length > 20;
    
    const score = [hasButtons, hasStats, hasVisualElements, hasText].filter(Boolean).length;
    
    if (score >= 2) {
      console.log(`✅ ${moduleId}: Score ${score}/4 (Boutons:${hasButtons}, Stats:${hasStats}, Visuels:${hasVisualElements}, Texte:${hasText})`);
      validModules++;
    } else {
      console.log(`❌ ${moduleId}: Score ${score}/4 - Contenu insuffisant`);
    }
  });
  
  console.log(`\nModules visuellement valides: ${validModules}/${historicalModules.length}`);
  return validModules;
}

// Fonction pour tester l'interactivité
function testInteractivity() {
  console.log('\n🖱️ TEST INTERACTIVITÉ:');
  
  const buttons = document.querySelectorAll('[data-module-type="historical"] button');
  console.log(`Boutons trouvés: ${buttons.length}`);
  
  let workingButtons = 0;
  
  buttons.forEach((button, index) => {
    try {
      // Simuler un hover
      button.dispatchEvent(new MouseEvent('mouseenter'));
      button.dispatchEvent(new MouseEvent('mouseleave'));
      
      // Vérifier si le bouton a des styles hover
      const computedStyle = window.getComputedStyle(button);
      const hasHoverStyles = computedStyle.cursor === 'pointer' || 
                           computedStyle.transition.includes('all') ||
                           button.classList.contains('session-btn') ||
                           button.classList.contains('create-quest-btn');
      
      if (hasHoverStyles) {
        workingButtons++;
        console.log(`✅ Bouton ${index + 1}: Interactif`);
      } else {
        console.log(`⚠️ Bouton ${index + 1}: Pas d'interaction détectée`);
      }
    } catch (error) {
      console.log(`❌ Bouton ${index + 1}: Erreur - ${error.message}`);
    }
  });
  
  console.log(`Boutons interactifs: ${workingButtons}/${buttons.length}`);
  return workingButtons;
}

// Fonction principale de test
async function runCompleteTest() {
  console.log('🚀 DÉMARRAGE TEST COMPLET\n');
  
  try {
    // 1. Capturer l'état initial
    const beforeState = captureBeforeState();
    
    // 2. Appliquer le fix
    console.log('\n🔧 Application du fix...');
    if (typeof applyChirurgicalFix === 'function') {
      applyChirurgicalFix();
    } else {
      console.log('⚠️ Fonction applyChirurgicalFix non disponible, chargement du script...');
      
      // Charger le script de fix
      try {
        const response = await fetch('/fix_modules_historiques_chirurgical.js');
        const script = await response.text();
        eval(script);
        
        // Attendre un peu puis appliquer
        await wait(1000);
        if (typeof applyChirurgicalFix === 'function') {
          applyChirurgicalFix();
        }
      } catch (error) {
        console.log('❌ Impossible de charger le script de fix:', error.message);
        return;
      }
    }
    
    // 3. Attendre que le fix s'applique
    console.log('\n⏳ Attente application du fix...');
    await wait(2000);
    
    // 4. Capturer l'état après fix
    const afterState = captureAfterState();
    
    // 5. Comparer les états
    const comparison = compareStates(beforeState, afterState);
    
    // 6. Validation visuelle
    const validModules = validateVisualContent();
    
    // 7. Test d'interactivité
    const workingButtons = testInteractivity();
    
    // 8. Résumé final
    console.log('\n🏁 RÉSUMÉ FINAL:');
    console.log(`📊 Modules corrigés: ${comparison.fixedModules}`);
    console.log(`✅ Modules déjà OK: ${comparison.alreadyWorkingModules}`);
    console.log(`❌ Modules encore cassés: ${comparison.stillBrokenModules}`);
    console.log(`👀 Modules visuellement valides: ${validModules}`);
    console.log(`🖱️ Boutons interactifs: ${workingButtons}`);
    
    // Calcul du score de succès
    const totalModules = comparison.totalModules;
    const workingModules = comparison.fixedModules + comparison.alreadyWorkingModules;
    const successRate = Math.round((workingModules / totalModules) * 100);
    
    console.log(`\n🎯 TAUX DE SUCCÈS: ${successRate}%`);
    
    if (successRate >= 90) {
      console.log('🎉 EXCELLENT! Le fix fonctionne parfaitement!');
    } else if (successRate >= 70) {
      console.log('✅ BON! Le fix fonctionne bien avec quelques améliorations possibles');
    } else if (successRate >= 50) {
      console.log('⚠️ MOYEN! Le fix fonctionne partiellement');
    } else {
      console.log('❌ ÉCHEC! Le fix ne fonctionne pas correctement');
    }
    
    // Recommandations
    if (comparison.stillBrokenModules > 0) {
      console.log('\n💡 RECOMMANDATIONS:');
      console.log('1. Vérifier que les modules utilisent bien les props.data');
      console.log('2. Ajouter des fallbacks pour les données manquantes');
      console.log('3. Vérifier les conditions de rendu dans les composants');
      console.log('4. S\'assurer que ModuleRenderer passe les bonnes données');
    }
    
    return {
      successRate,
      comparison,
      validModules,
      workingButtons
    };
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return null;
  }
}

// Lancer le test automatiquement
setTimeout(() => {
  runCompleteTest();
}, 1000);

// Fonction utilitaire pour relancer le test
window.runCompleteTest = runCompleteTest;

console.log('\n💡 COMMANDES DISPONIBLES:');
console.log('- runCompleteTest() : Lancer le test complet');