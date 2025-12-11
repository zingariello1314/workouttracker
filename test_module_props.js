/**
 * Script pour tester les props passées aux modules historiques
 */

console.log('=== TEST PROPS MODULES HISTORIQUES ===');

// Fonction pour inspecter les props d'un composant React
function inspectReactProps(element) {
  if (!element) return null;
  
  // Essayer différentes méthodes pour accéder aux props React
  const reactKeys = Object.keys(element).filter(key => 
    key.startsWith('__reactInternalInstance') || 
    key.startsWith('_reactInternalFiber') ||
    key.startsWith('__reactFiber')
  );
  
  for (const key of reactKeys) {
    const fiber = element[key];
    if (fiber && fiber.memoizedProps) {
      return fiber.memoizedProps;
    }
    if (fiber && fiber.return && fiber.return.memoizedProps) {
      return fiber.return.memoizedProps;
    }
  }
  
  return null;
}

// Attendre que React soit chargé
setTimeout(() => {
  try {
    console.log('Recherche des modules historiques...');
    
    // Trouver tous les modules historiques
    const historicalModules = document.querySelectorAll('[data-module-type="historical"]');
    console.log(`Modules historiques trouvés: ${historicalModules.length}`);
    
    historicalModules.forEach((module, index) => {
      const moduleId = module.getAttribute('data-module-id');
      const position = module.getAttribute('data-module-position');
      
      console.log(`\n--- Module ${index + 1}: ${moduleId} (Position ${position}) ---`);
      
      // Essayer d'inspecter les props
      const props = inspectReactProps(module);
      if (props) {
        console.log('Props trouvées:');
        console.log('- moduleId:', props.moduleId);
        console.log('- moduleType:', props.moduleType);
        console.log('- navigation:', !!props.navigation);
        console.log('- data:', !!props.data);
        
        if (props.data) {
          console.log('- data.sport:', !!props.data.sport);
          console.log('- data.metrics:', !!props.data.metrics);
          console.log('- data.quests:', !!props.data.quests);
          
          if (props.data.sport) {
            console.log('  - sport.hasGarminData:', props.data.sport.hasGarminData);
            console.log('  - sport.todayMetrics:', !!props.data.sport.todayMetrics);
            console.log('  - sport.garminData:', !!props.data.sport.garminData);
          }
        }
      } else {
        console.log('❌ Impossible d\'accéder aux props React');
      }
      
      // Vérifier le contenu visible
      const content = module.querySelector('.sidebar-section-content');
      if (content) {
        const hasMetricGroups = content.querySelectorAll('.metric-group').length;
        const hasLoadingState = content.querySelector('.garmin-loading, .module-loading');
        const hasErrorState = content.querySelector('.garmin-error, .module-error');
        const hasNoDataState = content.querySelector('.garmin-no-data, .module-no-data');
        
        console.log('Contenu visible:');
        console.log('- Groupes de métriques:', hasMetricGroups);
        console.log('- État de chargement:', !!hasLoadingState);
        console.log('- État d\'erreur:', !!hasErrorState);
        console.log('- État sans données:', !!hasNoDataState);
      }
    });
    
    // Vérifier spécifiquement le module Garmin
    const garminModule = document.querySelector('.garmin-metrics-module');
    if (garminModule) {
      console.log('\n=== FOCUS SUR MODULE GARMIN ===');
      
      const garminProps = inspectReactProps(garminModule);
      if (garminProps && garminProps.data && garminProps.data.sport) {
        const sport = garminProps.data.sport;
        console.log('Données sport détaillées:');
        console.log('- weeklyWorkouts:', sport.weeklyWorkouts);
        console.log('- todayCalories:', sport.todayCalories);
        console.log('- todaySteps:', sport.todaySteps);
        console.log('- avgHeartRate:', sport.avgHeartRate);
        console.log('- hasGarminData:', sport.hasGarminData);
        
        if (sport.todayMetrics) {
          console.log('- todayMetrics keys:', Object.keys(sport.todayMetrics));
        }
        
        if (sport.garminData) {
          console.log('- garminData keys:', Object.keys(sport.garminData));
          if (sport.garminData.dailyMetrics) {
            const today = new Date().toISOString().split('T')[0];
            console.log('- dailyMetrics pour aujourd\'hui:', !!sport.garminData.dailyMetrics[today]);
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'inspection:', error);
  }
}, 3000);

console.log('Script d\'inspection des props chargé...');