/**
 * Script de test pour vérifier le fix CSS des modules historiques
 * Vérifie que les nouveaux modules s'affichent correctement avec les styles harmonisés
 */

console.log('🔧 Test du fix CSS pour les modules historiques de la sidebar');

// Fonction pour vérifier les styles CSS appliqués
function checkModuleStyles() {
  const modules = document.querySelectorAll('.historical-module');
  
  console.log(`📊 Nombre de modules historiques trouvés: ${modules.length}`);
  
  modules.forEach((module, index) => {
    const moduleId = module.getAttribute('data-module-id');
    const moduleType = module.getAttribute('data-module-type');
    
    console.log(`\n🔍 Module ${index + 1}: ${moduleId} (${moduleType})`);
    
    // Vérifier les styles de base
    const computedStyle = window.getComputedStyle(module);
    
    const checks = {
      'Background': computedStyle.backgroundColor,
      'Border': computedStyle.border,
      'Border Radius': computedStyle.borderRadius,
      'Margin Bottom': computedStyle.marginBottom,
      'Transition': computedStyle.transition
    };
    
    Object.entries(checks).forEach(([property, value]) => {
      console.log(`  ${property}: ${value}`);
    });
    
    // Vérifier la structure interne
    const header = module.querySelector('.sidebar-section-header');
    const content = module.querySelector('.sidebar-section-content');
    const title = module.querySelector('.sidebar-section-title');
    const icon = module.querySelector('.sidebar-section-icon');
    
    console.log(`  ✅ Header: ${header ? 'Présent' : '❌ Manquant'}`);
    console.log(`  ✅ Content: ${content ? 'Présent' : '❌ Manquant'}`);
    console.log(`  ✅ Title: ${title ? 'Présent' : '❌ Manquant'}`);
    console.log(`  ✅ Icon: ${icon ? 'Présent' : '❌ Manquant'}`);
    
    // Vérifier les styles hover
    if (header) {
      const headerStyle = window.getComputedStyle(header);
      console.log(`  Header Background: ${headerStyle.backgroundColor}`);
      console.log(`  Header Padding: ${headerStyle.padding}`);
    }
  });
}

// Fonction pour comparer avec les anciens modules
function compareWithLegacyModules() {
  const legacyModules = document.querySelectorAll('.sidebar-section:not(.historical-module)');
  const historicalModules = document.querySelectorAll('.historical-module');
  
  console.log(`\n📊 Comparaison des styles:`);
  console.log(`  Modules legacy: ${legacyModules.length}`);
  console.log(`  Modules historiques: ${historicalModules.length}`);
  
  if (legacyModules.length > 0 && historicalModules.length > 0) {
    const legacyStyle = window.getComputedStyle(legacyModules[0]);
    const historicalStyle = window.getComputedStyle(historicalModules[0]);
    
    const comparisons = [
      'backgroundColor',
      'border',
      'borderRadius',
      'marginBottom',
      'transition'
    ];
    
    comparisons.forEach(prop => {
      const legacyValue = legacyStyle[prop];
      const historicalValue = historicalStyle[prop];
      const match = legacyValue === historicalValue;
      
      console.log(`  ${prop}: ${match ? '✅' : '❌'} ${match ? 'Identique' : 'Différent'}`);
      if (!match) {
        console.log(`    Legacy: ${legacyValue}`);
        console.log(`    Historical: ${historicalValue}`);
      }
    });
  }
}

// Fonction pour tester les interactions hover
function testHoverEffects() {
  console.log(`\n🎯 Test des effets hover:`);
  
  const modules = document.querySelectorAll('.historical-module');
  
  modules.forEach((module, index) => {
    const moduleId = module.getAttribute('data-module-id');
    
    // Simuler hover
    module.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    
    setTimeout(() => {
      const style = window.getComputedStyle(module);
      console.log(`  Module ${moduleId}:`);
      console.log(`    Transform: ${style.transform}`);
      console.log(`    Box Shadow: ${style.boxShadow}`);
      console.log(`    Border Color: ${style.borderColor}`);
      
      // Retirer hover
      module.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    }, 100);
  });
}

// Fonction pour vérifier les animations
function checkAnimations() {
  console.log(`\n🎬 Vérification des animations:`);
  
  const contents = document.querySelectorAll('.historical-module .sidebar-section-content > *');
  
  contents.forEach((element, index) => {
    const style = window.getComputedStyle(element);
    console.log(`  Élément ${index + 1}:`);
    console.log(`    Animation: ${style.animation}`);
    console.log(`    Animation Delay: ${style.animationDelay}`);
  });
}

// Fonction principale de test
function runTests() {
  console.log('🚀 Démarrage des tests CSS...\n');
  
  // Attendre que le DOM soit chargé
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        checkModuleStyles();
        compareWithLegacyModules();
        testHoverEffects();
        checkAnimations();
        
        console.log('\n✅ Tests terminés !');
      }, 1000);
    });
  } else {
    setTimeout(() => {
      checkModuleStyles();
      compareWithLegacyModules();
      testHoverEffects();
      checkAnimations();
      
      console.log('\n✅ Tests terminés !');
    }, 1000);
  }
}

// Fonction pour générer un rapport de diagnostic
function generateDiagnosticReport() {
  const report = {
    timestamp: new Date().toISOString(),
    modules: [],
    issues: [],
    recommendations: []
  };
  
  const modules = document.querySelectorAll('.historical-module');
  
  modules.forEach(module => {
    const moduleId = module.getAttribute('data-module-id');
    const computedStyle = window.getComputedStyle(module);
    
    const moduleReport = {
      id: moduleId,
      hasCorrectBackground: computedStyle.backgroundColor.includes('rgba(255, 255, 255, 0.03)'),
      hasCorrectBorder: computedStyle.border.includes('rgba(255, 215, 0, 0.15)'),
      hasCorrectBorderRadius: computedStyle.borderRadius !== '0px',
      hasCorrectMargin: computedStyle.marginBottom !== '0px'
    };
    
    report.modules.push(moduleReport);
    
    // Identifier les problèmes
    if (!moduleReport.hasCorrectBackground) {
      report.issues.push(`Module ${moduleId}: Background incorrect`);
    }
    if (!moduleReport.hasCorrectBorder) {
      report.issues.push(`Module ${moduleId}: Border incorrect`);
    }
  });
  
  // Recommandations
  if (report.issues.length === 0) {
    report.recommendations.push('✅ Tous les modules utilisent les styles corrects');
  } else {
    report.recommendations.push('❌ Certains modules nécessitent des corrections CSS');
    report.recommendations.push('💡 Vérifier que historical-modules-fix.css est bien importé');
    report.recommendations.push('💡 Vérifier l\'ordre d\'import des CSS (fix doit être en dernier)');
  }
  
  console.log('\n📋 Rapport de diagnostic:');
  console.log(JSON.stringify(report, null, 2));
  
  return report;
}

// Exporter les fonctions pour utilisation dans la console
window.testModulesCSS = {
  runTests,
  checkModuleStyles,
  compareWithLegacyModules,
  testHoverEffects,
  checkAnimations,
  generateDiagnosticReport
};

// Lancer les tests automatiquement
runTests();

console.log('\n💡 Fonctions disponibles dans window.testModulesCSS:');
console.log('  - runTests(): Lance tous les tests');
console.log('  - checkModuleStyles(): Vérifie les styles des modules');
console.log('  - compareWithLegacyModules(): Compare avec les anciens modules');
console.log('  - testHoverEffects(): Test les effets hover');
console.log('  - checkAnimations(): Vérifie les animations');
console.log('  - generateDiagnosticReport(): Génère un rapport détaillé');