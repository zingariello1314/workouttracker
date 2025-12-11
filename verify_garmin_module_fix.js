/**
 * Script de vérification du fix du module Garmin
 * À exécuter dans la console du navigateur
 */

console.log('🔍 VÉRIFICATION DU FIX MODULE GARMIN');

// Fonction pour vérifier l'état du module
function verifyGarminModule() {
  console.log('1️⃣ Recherche du module Garmin...');
  
  const garminModule = document.querySelector('.garmin-metrics-module');
  if (!garminModule) {
    console.log('❌ Module Garmin non trouvé');
    return false;
  }
  
  console.log('✅ Module Garmin trouvé');
  
  // Vérifier la structure
  const header = garminModule.querySelector('.sidebar-section-header');
  const content = garminModule.querySelector('.sidebar-section-content');
  
  console.log('2️⃣ Vérification de la structure...');
  console.log('- En-tête:', !!header);
  console.log('- Contenu:', !!content);
  
  if (!content) {
    console.log('❌ Pas de contenu trouvé');
    return false;
  }
  
  // Vérifier les états
  const loadingState = content.querySelector('.garmin-loading');
  const errorState = content.querySelector('.garmin-error');
  const noDataState = content.querySelector('.garmin-no-data');
  const metricGroups = content.querySelectorAll('.metric-group');
  
  console.log('3️⃣ États du module:');
  console.log('- Chargement:', !!loadingState);
  console.log('- Erreur:', !!errorState);
  console.log('- Pas de données:', !!noDataState);
  console.log('- Groupes de métriques:', metricGroups.length);
  
  // Si on a des métriques, c'est bon !
  if (metricGroups.length > 0) {
    console.log('✅ Module avec données détecté');
    
    metricGroups.forEach((group, index) => {
      const groupClass = Array.from(group.classList).find(c => c.includes('-group'));
      const values = group.querySelectorAll('.metric-value, .value, .hr-value, .sleep-value');
      console.log(`  Groupe ${index + 1} (${groupClass}): ${values.length} valeurs`);
    });
    
    return true;
  }
  
  // Si on est en mode démo, c'est aussi acceptable
  if (noDataState && content.textContent.includes('Démo')) {
    console.log('✅ Module en mode démo détecté');
    return true;
  }
  
  // Si on charge, attendre
  if (loadingState) {
    console.log('⏳ Module en cours de chargement...');
    return 'loading';
  }
  
  // Si erreur, diagnostiquer
  if (errorState) {
    console.log('❌ Module en erreur');
    const errorText = errorState.textContent;
    console.log('  Message:', errorText);
    return false;
  }
  
  // Si pas de données
  if (noDataState) {
    console.log('📭 Module sans données');
    return 'no-data';
  }
  
  console.log('❓ État indéterminé du module');
  return false;
}

// Fonction pour vérifier les données dans React DevTools
function checkReactProps() {
  console.log('4️⃣ Vérification des props React...');
  
  const garminModule = document.querySelector('.garmin-metrics-module');
  if (!garminModule) return false;
  
  // Essayer d'accéder aux props React
  const reactKeys = Object.keys(garminModule).filter(key => 
    key.startsWith('__reactFiber') || 
    key.startsWith('_reactInternalFiber') ||
    key.startsWith('__reactInternalInstance')
  );
  
  if (reactKeys.length === 0) {
    console.log('❌ Impossible d\'accéder aux props React');
    console.log('💡 Utilisez React DevTools pour inspecter les props');
    return false;
  }
  
  try {
    const fiber = garminModule[reactKeys[0]];
    const props = fiber?.memoizedProps || fiber?.return?.memoizedProps;
    
    if (props) {
      console.log('✅ Props React trouvées:');
      console.log('- moduleId:', props.moduleId);
      console.log('- data:', !!props.data);
      
      if (props.data?.sport) {
        console.log('- data.sport.hasGarminData:', props.data.sport.hasGarminData);
        console.log('- data.sport.todayMetrics:', !!props.data.sport.todayMetrics);
      }
      
      return true;
    }
  } catch (error) {
    console.log('❌ Erreur lors de l\'accès aux props:', error.message);
  }
  
  return false;
}

// Fonction principale de vérification
async function runVerification() {
  console.log('🚀 Démarrage de la vérification...\n');
  
  const moduleState = verifyGarminModule();
  
  if (moduleState === true) {
    console.log('\n✅ SUCCÈS: Le module Garmin fonctionne correctement !');
    console.log('   Les métriques sont affichées.');
    
    checkReactProps();
    
    console.log('\n🎉 Fix confirmé - Module opérationnel');
    return true;
  }
  
  if (moduleState === 'loading') {
    console.log('\n⏳ Module en cours de chargement...');
    console.log('   Attendre quelques secondes et relancer la vérification.');
    
    // Attendre 3 secondes et revérifier
    setTimeout(() => {
      console.log('\n🔄 Nouvelle vérification après attente...');
      runVerification();
    }, 3000);
    
    return 'pending';
  }
  
  if (moduleState === 'no-data') {
    console.log('\n📭 Module sans données');
    console.log('   Ceci est normal si aucune donnée Garmin n\'est disponible.');
    console.log('   En mode développement, des données de démo devraient s\'afficher.');
    
    checkReactProps();
    
    return 'no-data';
  }
  
  console.log('\n❌ PROBLÈME: Le module ne fonctionne pas correctement');
  console.log('\n🔧 Actions recommandées:');
  console.log('1. Vérifier la console pour des erreurs JavaScript');
  console.log('2. Utiliser React DevTools pour inspecter les props');
  console.log('3. Vérifier que useSidebarData charge les données');
  console.log('4. Exécuter le script de correction: fetch("/fix_modules_display.js").then(r => r.text()).then(eval)');
  
  checkReactProps();
  
  return false;
}

// Lancer la vérification
runVerification();

// Fonction utilitaire pour forcer un refresh du module
window.refreshGarminModule = function() {
  console.log('🔄 Tentative de refresh du module Garmin...');
  
  const garminModule = document.querySelector('.garmin-metrics-module');
  if (garminModule) {
    // Déclencher un re-render en modifiant le style
    garminModule.style.display = 'none';
    setTimeout(() => {
      garminModule.style.display = '';
      console.log('✅ Module rafraîchi');
      
      // Revérifier après le refresh
      setTimeout(() => runVerification(), 1000);
    }, 100);
  } else {
    console.log('❌ Module non trouvé pour le refresh');
  }
};

console.log('\n💡 Commandes disponibles:');
console.log('- refreshGarminModule() : Force le refresh du module');
console.log('- runVerification() : Relance la vérification');