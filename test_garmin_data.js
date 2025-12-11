/**
 * Script de test pour vérifier les données Garmin dans la sidebar
 */

console.log('=== TEST DONNÉES GARMIN SIDEBAR ===');

// Attendre que la page soit chargée
setTimeout(() => {
  try {
    // 1. Vérifier la présence du module Garmin
    const garminModule = document.querySelector('[data-module-id*="garmin"]');
    console.log('Module Garmin trouvé:', !!garminModule);
    
    if (garminModule) {
      console.log('Module Garmin ID:', garminModule.getAttribute('data-module-id'));
      console.log('Module Garmin Type:', garminModule.getAttribute('data-module-type'));
      console.log('Module Garmin Position:', garminModule.getAttribute('data-module-position'));
    }

    // 2. Vérifier le contenu du module
    const garminContent = document.querySelector('.garmin-metrics-module .sidebar-section-content');
    if (garminContent) {
      console.log('Contenu du module Garmin:');
      console.log('- Nombre d\'éléments:', garminContent.children.length);
      
      // Vérifier les métriques spécifiques
      const caloriesGroup = garminContent.querySelector('.calories-group');
      const stepsGroup = garminContent.querySelector('.steps-group');
      const heartRateGroup = garminContent.querySelector('.heart-rate-group');
      const bodyBatteryGroup = garminContent.querySelector('.body-battery-group');
      
      console.log('- Groupe Calories:', !!caloriesGroup);
      console.log('- Groupe Pas:', !!stepsGroup);
      console.log('- Groupe FC:', !!heartRateGroup);
      console.log('- Groupe Body Battery:', !!bodyBatteryGroup);
      
      if (caloriesGroup) {
        const caloriesValues = caloriesGroup.querySelectorAll('.metric-value');
        console.log('- Valeurs calories:', Array.from(caloriesValues).map(v => v.textContent));
      }
      
      if (stepsGroup) {
        const stepsValue = stepsGroup.querySelector('.value');
        console.log('- Valeur pas:', stepsValue?.textContent);
      }
    }

    // 3. Vérifier les états d'erreur ou de chargement
    const loadingState = document.querySelector('.garmin-loading');
    const errorState = document.querySelector('.garmin-error');
    const noDataState = document.querySelector('.garmin-no-data');
    
    console.log('États du module:');
    console.log('- Chargement:', !!loadingState);
    console.log('- Erreur:', !!errorState);
    console.log('- Pas de données:', !!noDataState);
    
    if (errorState) {
      const errorMessage = errorState.querySelector('small');
      console.log('- Message d\'erreur:', errorMessage?.textContent);
    }

    // 4. Vérifier les données dans React DevTools (si disponible)
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('React DevTools détecté - vérification des props...');
      
      // Essayer de trouver le composant React
      const reactFiber = garminModule?._reactInternalFiber || garminModule?.__reactInternalInstance;
      if (reactFiber) {
        console.log('Fiber React trouvé');
      }
    }

    // 5. Vérifier les données dans le localStorage/sessionStorage
    console.log('Données de stockage:');
    const garminStorage = localStorage.getItem('garmin_data');
    console.log('- localStorage garmin_data:', !!garminStorage);
    
    if (garminStorage) {
      try {
        const parsed = JSON.parse(garminStorage);
        console.log('- Clés dans garmin_data:', Object.keys(parsed));
      } catch (e) {
        console.log('- Erreur parsing garmin_data:', e.message);
      }
    }

  } catch (error) {
    console.error('Erreur lors du test:', error);
  }
}, 2000);

// Test périodique
let testCount = 0;
const periodicTest = setInterval(() => {
  testCount++;
  console.log(`\n=== TEST PÉRIODIQUE ${testCount} ===`);
  
  const garminModule = document.querySelector('.garmin-metrics-module');
  if (garminModule) {
    const hasContent = garminModule.querySelector('.metric-group');
    console.log(`Module présent: ${!!garminModule}, Contenu: ${!!hasContent}`);
    
    if (hasContent) {
      console.log('✅ Module Garmin fonctionne correctement');
      clearInterval(periodicTest);
    } else {
      console.log('⚠️ Module présent mais pas de contenu');
    }
  } else {
    console.log('❌ Module Garmin non trouvé');
  }
  
  if (testCount >= 10) {
    console.log('🔄 Arrêt des tests périodiques après 10 tentatives');
    clearInterval(periodicTest);
  }
}, 3000);

console.log('Script de test chargé. Vérification en cours...');