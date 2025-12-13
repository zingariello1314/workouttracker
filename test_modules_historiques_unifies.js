/**
 * Script de test pour vérifier l'unification des modules historiques
 * Vérifie que tous les modules utilisent la même esthétique
 */

console.log('🔧 TEST MODULES HISTORIQUES UNIFIÉS');
console.log('=====================================');

// Fonction pour tester la présence des éléments
function testModuleStructure(moduleName, selector) {
  const module = document.querySelector(selector);
  
  if (!module) {
    console.log(`❌ ${moduleName}: Module non trouvé`);
    return false;
  }

  // Vérifier la structure de base
  const header = module.querySelector('.sidebar-section-header');
  const title = module.querySelector('.sidebar-section-title');
  const icon = module.querySelector('.sidebar-section-icon');
  const content = module.querySelector('.sidebar-section-content');
  const dataGrid = module.querySelector('.sidebar-data-grid');

  console.log(`\n📊 ${moduleName}:`);
  console.log(`  - Header: ${header ? '✅' : '❌'}`);
  console.log(`  - Title: ${title ? '✅' : '❌'}`);
  console.log(`  - Icon: ${icon ? '✅' : '❌'}`);
  console.log(`  - Content: ${content ? '✅' : '❌'}`);
  console.log(`  - Data Grid: ${dataGrid ? '✅' : '❌'}`);

  // Vérifier les classes CSS
  const hasOnlyBasicClasses = module.classList.contains('sidebar-section');
  const hasNoSpecificClasses = !Array.from(module.classList).some(cls => 
    cls.includes('garmin-') || cls.includes('reading-') || cls.includes('patrimony-')
  );

  console.log(`  - Classe de base: ${hasOnlyBasicClasses ? '✅' : '❌'}`);
  console.log(`  - Pas de classes spécifiques: ${hasNoSpecificClasses ? '✅' : '❌'}`);

  return header && title && icon && content && hasOnlyBasicClasses && hasNoSpecificClasses;
}

// Fonction pour tester l'esthétique uniforme
function testUniformStyling() {
  console.log('\n🎨 TEST ESTHÉTIQUE UNIFORME');
  console.log('============================');

  const modules = document.querySelectorAll('.sidebar-section');
  
  if (modules.length === 0) {
    console.log('❌ Aucun module trouvé');
    return false;
  }

  console.log(`📊 ${modules.length} modules trouvés`);

  // Vérifier que tous les modules ont les mêmes styles de base
  let uniformStyling = true;
  const firstModuleStyles = window.getComputedStyle(modules[0]);
  
  modules.forEach((module, index) => {
    const moduleStyles = window.getComputedStyle(module);
    
    // Vérifier les propriétés critiques
    const properties = ['background', 'border', 'borderRadius', 'marginBottom'];
    
    properties.forEach(prop => {
      if (moduleStyles[prop] !== firstModuleStyles[prop]) {
        console.log(`❌ Module ${index}: Propriété ${prop} différente`);
        uniformStyling = false;
      }
    });
  });

  if (uniformStyling) {
    console.log('✅ Tous les modules ont une esthétique uniforme');
  }

  return uniformStyling;
}

// Fonction pour tester le contenu des modules
function testModuleContent() {
  console.log('\n📋 TEST CONTENU DES MODULES');
  console.log('============================');

  const modulesToTest = [
    { name: 'Métriques Garmin', selector: '.sidebar-section:has(.sidebar-section-title:contains("Métriques Garmin"))' },
    { name: 'Progression Lecture', selector: '.sidebar-section:has(.sidebar-section-title:contains("Progression Lecture"))' },
    { name: 'Évolution Patrimoine', selector: '.sidebar-section:has(.sidebar-section-title:contains("Évolution Patrimoine"))' }
  ];

  let allModulesHaveContent = true;

  modulesToTest.forEach(({ name, selector }) => {
    // Utiliser une approche plus simple pour trouver les modules
    const modules = Array.from(document.querySelectorAll('.sidebar-section'));
    const module = modules.find(m => {
      const title = m.querySelector('.sidebar-section-title');
      return title && title.textContent.includes(name.split(' ')[1]); // Chercher par mot-clé
    });

    if (module) {
      const dataCards = module.querySelectorAll('.sidebar-data-card');
      const hasContent = dataCards.length > 0;
      
      console.log(`  ${name}: ${hasContent ? '✅' : '❌'} (${dataCards.length} cartes)`);
      
      if (!hasContent) {
        allModulesHaveContent = false;
      }
    } else {
      console.log(`  ${name}: ❌ Module non trouvé`);
      allModulesHaveContent = false;
    }
  });

  return allModulesHaveContent;
}

// Exécuter les tests
function runTests() {
  console.log('🚀 DÉBUT DES TESTS');
  console.log('==================');

  // Attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runTests);
    return;
  }

  setTimeout(() => {
    const uniformStyling = testUniformStyling();
    const moduleContent = testModuleContent();

    console.log('\n📊 RÉSULTATS FINAUX');
    console.log('===================');
    console.log(`Esthétique uniforme: ${uniformStyling ? '✅' : '❌'}`);
    console.log(`Contenu des modules: ${moduleContent ? '✅' : '❌'}`);

    if (uniformStyling && moduleContent) {
      console.log('\n🎉 SUCCÈS: Tous les modules sont unifiés et fonctionnels!');
    } else {
      console.log('\n⚠️  ATTENTION: Des problèmes ont été détectés');
    }
  }, 2000); // Attendre 2 secondes pour que les modules se chargent
}

// Lancer les tests
runTests();

// Exporter pour utilisation dans la console
window.testModulesHistoriques = {
  runTests,
  testUniformStyling,
  testModuleContent
};