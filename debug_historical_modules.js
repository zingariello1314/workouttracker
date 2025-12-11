/**
 * Script de diagnostic pour les modules historiques
 * Vérifie que les données sont correctement passées aux modules
 */

console.log('=== DIAGNOSTIC MODULES HISTORIQUES ===');

// Vérifier si les modules historiques sont présents dans le DOM
const historicalModules = document.querySelectorAll('[data-module-type="historical"]');
console.log(`Nombre de modules historiques trouvés: ${historicalModules.length}`);

historicalModules.forEach((module, index) => {
  const moduleId = module.getAttribute('data-module-id');
  const modulePosition = module.getAttribute('data-module-position');
  
  console.log(`\n--- Module ${index + 1}: ${moduleId} (Position ${modulePosition}) ---`);
  
  // Vérifier la structure du module
  const header = module.querySelector('.sidebar-section-header');
  const content = module.querySelector('.sidebar-section-content');
  
  console.log(`Header présent: ${!!header}`);
  console.log(`Content présent: ${!!content}`);
  
  if (header) {
    const title = header.querySelector('.sidebar-section-title');
    console.log(`Titre: ${title?.textContent || 'Non trouvé'}`);
  }
  
  if (content) {
    const contentElements = content.children.length;
    console.log(`Éléments dans le contenu: ${contentElements}`);
    
    // Vérifier si le contenu est vide ou contient seulement du loading
    const hasLoadingSpinner = content.querySelector('.animate-spin');
    const hasErrorMessage = content.querySelector('.error-message');
    
    console.log(`Loading spinner: ${!!hasLoadingSpinner}`);
    console.log(`Message d'erreur: ${!!hasErrorMessage}`);
    
    if (contentElements === 0) {
      console.log('⚠️ PROBLÈME: Contenu vide');
    } else if (hasLoadingSpinner) {
      console.log('⏳ État: Chargement en cours');
    } else if (hasErrorMessage) {
      console.log('❌ État: Erreur détectée');
    } else {
      console.log('✅ État: Contenu présent');
    }
  } else {
    console.log('❌ PROBLÈME: Pas de section content');
  }
});

// Vérifier les données dans React DevTools si disponible
if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('\n=== REACT DEVTOOLS DISPONIBLE ===');
  console.log('Vous pouvez inspecter les props des composants dans React DevTools');
} else {
  console.log('\n=== REACT DEVTOOLS NON DISPONIBLE ===');
}

// Vérifier les erreurs dans la console
const errors = [];
const originalError = console.error;
console.error = function(...args) {
  errors.push(args.join(' '));
  originalError.apply(console, args);
};

setTimeout(() => {
  if (errors.length > 0) {
    console.log('\n=== ERREURS DÉTECTÉES ===');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  } else {
    console.log('\n✅ Aucune erreur détectée');
  }
}, 2000);

console.log('\n=== FIN DU DIAGNOSTIC ===');