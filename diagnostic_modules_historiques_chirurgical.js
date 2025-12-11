/**
 * DIAGNOSTIC CHIRURGICAL - Modules Historiques Vides
 * Analyse précise du problème d'affichage des nouveaux modules
 */

console.log('🔍 DIAGNOSTIC CHIRURGICAL - MODULES HISTORIQUES');

// Fonction pour analyser un module spécifique
function analyzeModule(moduleSelector, moduleName) {
  console.log(`\n=== ANALYSE ${moduleName.toUpperCase()} ===`);
  
  const module = document.querySelector(moduleSelector);
  if (!module) {
    console.log(`❌ Module ${moduleName} non trouvé`);
    return false;
  }
  
  console.log(`✅ Module ${moduleName} trouvé`);
  
  // Analyser la structure
  const header = module.querySelector('.sidebar-section-header');
  const content = module.querySelector('.sidebar-section-content');
  
  console.log(`- Header: ${!!header}`);
  console.log(`- Content: ${!!content}`);
  
  if (content) {
    const contentHTML = content.innerHTML;
    const contentText = content.textContent.trim();
    
    console.log(`- Contenu HTML length: ${contentHTML.length}`);
    console.log(`- Contenu text length: ${contentText.length}`);
    console.log(`- Contenu text: "${contentText.substring(0, 100)}..."`);
    
    // Vérifier si le contenu est vide ou minimal
    if (contentHTML.length < 50 || contentText.length < 10) {
      console.log(`⚠️ PROBLÈME: Contenu très minimal détecté`);
      return false;
    }
  }
  
  // Analyser les props React
  const reactKeys = Object.keys(module).filter(key => 
    key.startsWith('__reactFiber') || 
    key.startsWith('_reactInternalFiber') ||
    key.startsWith('__reactInternalInstance')
  );
  
  if (reactKeys.length > 0) {
    try {
      const fiber = module[reactKeys[0]];
      const props = fiber?.memoizedProps || fiber?.return?.memoizedProps;
      
      if (props) {
        console.log(`✅ Props React trouvées:`);
        console.log(`- moduleId: ${props.moduleId}`);
        console.log(`- moduleType: ${props.moduleType}`);
        console.log(`- data: ${!!props.data}`);
        console.log(`- navigation: ${!!props.navigation}`);
        
        if (props.data) {
          console.log(`- data keys: ${Object.keys(props.data).join(', ')}`);
          
          // Analyser les données spécifiques
          Object.keys(props.data).forEach(key => {
            const value = props.data[key];
            if (typeof value === 'object' && value !== null) {
              console.log(`  - ${key}: ${Object.keys(value).length} propriétés`);
            } else {
              console.log(`  - ${key}: ${value}`);
            }
          });
        }
        
        return true;
      }
    } catch (error) {
      console.log(`❌ Erreur analyse props: ${error.message}`);
    }
  }
  
  console.log(`❌ Impossible d'analyser les props React`);
  return false;
}

// Fonction principale de diagnostic
function runDiagnostic() {
  console.log('🚀 Démarrage du diagnostic chirurgical...\n');
  
  // Analyser tous les modules historiques
  const historicalModules = [
    { selector: '[data-module-id="session-recorder-module"]', name: 'Session Recorder' },
    { selector: '[data-module-id="reading-progress-module"]', name: 'Reading Progress' },
    { selector: '[data-module-id="garmin-metrics-module"]', name: 'Garmin Metrics' },
    { selector: '[data-module-id="interactive-quests-module"]', name: 'Interactive Quests' },
    { selector: '[data-module-id="patrimony-evolution-module"]', name: 'Patrimony Evolution' },
    { selector: '[data-module-id="shopping-list-module"]', name: 'Shopping List' },
    { selector: '[data-module-id="active-reading-session-module"]', name: 'Active Reading Session' },
    { selector: '[data-module-id="daily-training-module"]', name: 'Daily Training' },
    { selector: '[data-module-id="creativity-projects-module"]', name: 'Creativity Projects' },
    { selector: '[data-module-id="global-performance-module"]', name: 'Global Performance' },
    { selector: '[data-module-id="express-learning-module"]', name: 'Express Learning' }
  ];
  
  let workingModules = 0;
  let brokenModules = 0;
  
  historicalModules.forEach(({ selector, name }) => {
    const isWorking = analyzeModule(selector, name);
    if (isWorking) {
      workingModules++;
    } else {
      brokenModules++;
    }
  });
  
  console.log(`\n=== RÉSUMÉ DIAGNOSTIC ===`);
  console.log(`✅ Modules fonctionnels: ${workingModules}`);
  console.log(`❌ Modules cassés: ${brokenModules}`);
  
  // Analyser les modules legacy pour comparaison
  console.log(`\n=== COMPARAISON MODULES LEGACY ===`);
  const legacyModules = [
    { selector: '.actions-rapides-section', name: 'Actions Rapides' },
    { selector: '.nutrition-section', name: 'Nutrition' }
  ];
  
  legacyModules.forEach(({ selector, name }) => {
    analyzeModule(selector, name);
  });
  
  // Diagnostic des données globales
  console.log(`\n=== DIAGNOSTIC DONNÉES GLOBALES ===`);
  
  // Vérifier useSidebarData
  const sidebarPremium = document.querySelector('.sidebar-premium');
  if (sidebarPremium) {
    const reactKeys = Object.keys(sidebarPremium).filter(key => 
      key.startsWith('__reactFiber') || 
      key.startsWith('_reactInternalFiber') ||
      key.startsWith('__reactInternalInstance')
    );
    
    if (reactKeys.length > 0) {
      try {
        const fiber = sidebarPremium[reactKeys[0]];
        let currentFiber = fiber;
        
        // Chercher le composant SidebarPremium
        while (currentFiber) {
          if (currentFiber.type?.name === 'SidebarPremium' || 
              currentFiber.elementType?.name === 'SidebarPremium') {
            const props = currentFiber.memoizedProps;
            console.log(`✅ SidebarPremium props trouvées:`);
            console.log(`- data: ${!!props?.data}`);
            
            if (props?.data) {
              console.log(`- data keys: ${Object.keys(props.data).join(', ')}`);
              
              // Vérifier chaque section de données
              ['metrics', 'quests', 'sport', 'finance', 'nutrition', 'learning', 'today'].forEach(key => {
                const value = props.data[key];
                if (value) {
                  console.log(`  - ${key}: ${typeof value === 'object' ? Object.keys(value).length + ' propriétés' : value}`);
                } else {
                  console.log(`  - ${key}: MANQUANT`);
                }
              });
            }
            break;
          }
          currentFiber = currentFiber.child || currentFiber.sibling || currentFiber.return;
        }
      } catch (error) {
        console.log(`❌ Erreur analyse SidebarPremium: ${error.message}`);
      }
    }
  }
  
  // Recommandations
  console.log(`\n=== RECOMMANDATIONS ===`);
  
  if (brokenModules > 0) {
    console.log(`🔧 PROBLÈME IDENTIFIÉ: ${brokenModules} modules historiques ne fonctionnent pas`);
    console.log(`\n💡 CAUSES POSSIBLES:`);
    console.log(`1. Les modules ne utilisent pas les props.data correctement`);
    console.log(`2. Les données ne sont pas passées par ModuleRenderer`);
    console.log(`3. Les modules ont des conditions de rendu trop strictes`);
    console.log(`4. Les modules attendent des données dans un format différent`);
    
    console.log(`\n🔧 ACTIONS RECOMMANDÉES:`);
    console.log(`1. Vérifier que chaque module utilise props.data`);
    console.log(`2. Ajouter des console.log dans les modules pour tracer les données`);
    console.log(`3. Vérifier les conditions de rendu (if/else)`);
    console.log(`4. S'assurer que les modules ont des fallbacks pour données manquantes`);
  } else {
    console.log(`✅ Tous les modules semblent fonctionner correctement`);
  }
}

// Lancer le diagnostic
runDiagnostic();

// Fonction utilitaire pour forcer le re-render des modules cassés
window.forceRefreshHistoricalModules = function() {
  console.log('🔄 Force refresh des modules historiques...');
  
  const historicalModules = document.querySelectorAll('[data-module-type="historical"]');
  console.log(`Modules trouvés: ${historicalModules.length}`);
  
  historicalModules.forEach((module, index) => {
    const moduleId = module.getAttribute('data-module-id');
    console.log(`Refresh module ${index + 1}: ${moduleId}`);
    
    // Force re-render
    module.style.display = 'none';
    setTimeout(() => {
      module.style.display = '';
    }, 100 * (index + 1));
  });
  
  console.log('✅ Refresh terminé');
};

console.log(`\n💡 COMMANDES DISPONIBLES:`);
console.log(`- runDiagnostic() : Relancer le diagnostic`);
console.log(`- forceRefreshHistoricalModules() : Force le refresh des modules`);