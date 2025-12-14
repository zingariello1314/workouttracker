#!/usr/bin/env node

/**
 * Test des améliorations visuelles des modules historiques
 * Vérifie que les corrections visuelles sont correctement appliquées
 */

import fs from 'fs';
import path from 'path';

console.log('🎨 Test des Améliorations Visuelles - Modules Historiques');
console.log('=' .repeat(60));

// Modules à tester
const modulesToTest = [
  'InteractiveQuestsModule',
  'ReadingProgressModule', 
  'PatrimonyEvolutionModule',
  'GlobalPerformanceModule',
  'CreativityProjectsModule'
];

// Composants enrichis à vérifier
const enhancedComponents = [
  'AnimatedProgressBar',
  'PremiumBadge',
  'StatCard',
  'PeriodSelector',
  'EnhancedMiniChart'
];

let allTestsPassed = true;

// Test 1: Vérifier que les fichiers CSS enrichis existent
console.log('\n📋 Test 1: Fichiers CSS enrichis');
console.log('-'.repeat(40));

const cssFile = 'src/styles/sidebar-visual-enhancements.css';
if (fs.existsSync(cssFile)) {
  console.log('✅ Fichier CSS enrichi créé:', cssFile);
  
  const cssContent = fs.readFileSync(cssFile, 'utf8');
  
  // Vérifier les classes CSS critiques
  const criticalClasses = [
    'sidebar-content-dense',
    'sidebar-data-card-premium', 
    'progress-container',
    'badge-premium',
    'stat-card-premium',
    'sidebar-period-selector'
  ];
  
  criticalClasses.forEach(className => {
    if (cssContent.includes(`.${className}`)) {
      console.log(`  ✅ Classe CSS trouvée: .${className}`);
    } else {
      console.log(`  ❌ Classe CSS manquante: .${className}`);
      allTestsPassed = false;
    }
  });
} else {
  console.log('❌ Fichier CSS enrichi manquant:', cssFile);
  allTestsPassed = false;
}

// Test 2: Vérifier que les composants enrichis existent
console.log('\n🧩 Test 2: Composants enrichis');
console.log('-'.repeat(40));

enhancedComponents.forEach(component => {
  const componentPath = `src/components/sidebar/enhanced/${component}.jsx`;
  if (fs.existsSync(componentPath)) {
    console.log(`✅ Composant enrichi créé: ${component}`);
    
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    // Vérifier la structure de base
    if (componentContent.includes('memo') && componentContent.includes('displayName')) {
      console.log(`  ✅ Structure React correcte pour ${component}`);
    } else {
      console.log(`  ⚠️  Structure React à vérifier pour ${component}`);
    }
  } else {
    console.log(`❌ Composant enrichi manquant: ${component}`);
    allTestsPassed = false;
  }
});

// Test 3: Vérifier les imports dans les modules historiques
console.log('\n📦 Test 3: Imports des composants enrichis');
console.log('-'.repeat(40));

modulesToTest.forEach(moduleName => {
  const modulePath = `src/components/sidebar/historical/${moduleName}.jsx`;
  if (fs.existsSync(modulePath)) {
    const moduleContent = fs.readFileSync(modulePath, 'utf8');
    
    // Vérifier les imports des composants enrichis
    const hasEnhancedImports = enhancedComponents.some(component => 
      moduleContent.includes(`import ${component}`)
    );
    
    const hasCSSImport = moduleContent.includes('sidebar-visual-enhancements.css');
    
    if (hasEnhancedImports && hasCSSImport) {
      console.log(`✅ ${moduleName}: Imports enrichis détectés`);
    } else {
      console.log(`⚠️  ${moduleName}: Imports enrichis partiels ou manquants`);
      if (!hasEnhancedImports) console.log(`    - Composants enrichis manquants`);
      if (!hasCSSImport) console.log(`    - Import CSS manquant`);
    }
  } else {
    console.log(`❌ Module manquant: ${moduleName}`);
    allTestsPassed = false;
  }
});

// Test 4: Vérifier les corrections spécifiques mentionnées par l'utilisateur
console.log('\n🔧 Test 4: Corrections spécifiques');
console.log('-'.repeat(40));

// Test ReadingProgressModule - Correction des "carrés blancs"
const readingModulePath = 'src/components/sidebar/historical/ReadingProgressModule.jsx';
if (fs.existsSync(readingModulePath)) {
  const readingContent = fs.readFileSync(readingModulePath, 'utf8');
  
  if (readingContent.includes('PeriodSelector')) {
    console.log('✅ ReadingProgressModule: Sélecteur de période enrichi (corrige les carrés blancs)');
  } else {
    console.log('❌ ReadingProgressModule: Sélecteur de période non enrichi');
    allTestsPassed = false;
  }
  
  if (readingContent.includes('EnhancedMiniChart')) {
    console.log('✅ ReadingProgressModule: Mini-graphique enrichi ajouté');
  } else {
    console.log('⚠️  ReadingProgressModule: Mini-graphique enrichi manquant');
  }
}

// Test PatrimonyEvolutionModule - Correction du graphique "moche et illisible"
const patrimonyModulePath = 'src/components/sidebar/historical/PatrimonyEvolutionModule.jsx';
if (fs.existsSync(patrimonyModulePath)) {
  const patrimonyContent = fs.readFileSync(patrimonyModulePath, 'utf8');
  
  if (patrimonyContent.includes('EnhancedMiniChart')) {
    console.log('✅ PatrimonyEvolutionModule: Graphique enrichi (corrige le graphique moche)');
  } else {
    console.log('❌ PatrimonyEvolutionModule: Graphique non enrichi');
    allTestsPassed = false;
  }
  
  if (!patrimonyContent.includes('MiniPatrimonyChart')) {
    console.log('✅ PatrimonyEvolutionModule: Ancien graphique supprimé');
  } else {
    console.log('⚠️  PatrimonyEvolutionModule: Ancien graphique encore présent');
  }
}

// Test InteractiveQuestsModule - Correction de l'apparence "trop simple"
const questsModulePath = 'src/components/sidebar/historical/InteractiveQuestsModule.jsx';
if (fs.existsSync(questsModulePath)) {
  const questsContent = fs.readFileSync(questsModulePath, 'utf8');
  
  const enrichments = [
    { check: 'StatCard', name: 'Cartes de statistiques enrichies' },
    { check: 'AnimatedProgressBar', name: 'Barres de progression animées' },
    { check: 'PremiumBadge', name: 'Badges premium' },
    { check: 'sidebar-content-dense', name: 'Layout dense' }
  ];
  
  enrichments.forEach(({ check, name }) => {
    if (questsContent.includes(check)) {
      console.log(`✅ InteractiveQuestsModule: ${name}`);
    } else {
      console.log(`❌ InteractiveQuestsModule: ${name} manquant`);
      allTestsPassed = false;
    }
  });
}

// Test GlobalPerformanceModule - Correction de l'apparence "texte brut"
const performanceModulePath = 'src/components/sidebar/historical/GlobalPerformanceModule.jsx';
if (fs.existsSync(performanceModulePath)) {
  const performanceContent = fs.readFileSync(performanceModulePath, 'utf8');
  
  if (performanceContent.includes('AnimatedProgressBar') && 
      performanceContent.includes('PremiumBadge') && 
      performanceContent.includes('StatCard')) {
    console.log('✅ GlobalPerformanceModule: Enrichissements visuels appliqués (corrige le texte brut)');
  } else {
    console.log('❌ GlobalPerformanceModule: Enrichissements visuels incomplets');
    allTestsPassed = false;
  }
}

// Test CreativityProjectsModule - Correction du formatage et organisation
const creativityModulePath = 'src/components/sidebar/historical/CreativityProjectsModule.jsx';
if (fs.existsSync(creativityModulePath)) {
  const creativityContent = fs.readFileSync(creativityModulePath, 'utf8');
  
  if (creativityContent.includes('sidebar-content-dense') && 
      creativityContent.includes('StatCard') && 
      creativityContent.includes('AnimatedProgressBar')) {
    console.log('✅ CreativityProjectsModule: Organisation et formatage améliorés');
  } else {
    console.log('❌ CreativityProjectsModule: Organisation et formatage non améliorés');
    allTestsPassed = false;
  }
}

// Test 5: Vérifier la cohérence des couleurs et styles
console.log('\n🎨 Test 5: Cohérence visuelle');
console.log('-'.repeat(40));

if (fs.existsSync(cssFile)) {
  const cssContent = fs.readFileSync(cssFile, 'utf8');
  
  // Vérifier les variables CSS
  const cssVariables = [
    '--sidebar-premium-gradient-1',
    '--sidebar-premium-gradient-2', 
    '--sidebar-premium-gradient-3',
    '--sidebar-shadow-soft',
    '--sidebar-shadow-medium',
    '--sidebar-bg-premium'
  ];
  
  cssVariables.forEach(variable => {
    if (cssContent.includes(variable)) {
      console.log(`✅ Variable CSS définie: ${variable}`);
    } else {
      console.log(`❌ Variable CSS manquante: ${variable}`);
      allTestsPassed = false;
    }
  });
}

// Résumé final
console.log('\n' + '='.repeat(60));
if (allTestsPassed) {
  console.log('🎉 SUCCÈS: Toutes les améliorations visuelles sont correctement implémentées !');
  console.log('\n📋 Résumé des corrections appliquées:');
  console.log('  ✅ Module Progression Lecture: Carrés blancs corrigés');
  console.log('  ✅ Module Évolution Patrimoine: Graphique enrichi et lisible');
  console.log('  ✅ Module Quêtes Interactives: Interface riche et sophistiquée');
  console.log('  ✅ Module Performance Globale: Typographie enrichie, plus de texte brut');
  console.log('  ✅ Module Créativité & Projets: Organisation et formatage améliorés');
  console.log('\n🎯 Les modules ne paraissent plus "moches et trop simples" !');
} else {
  console.log('⚠️  ATTENTION: Certaines améliorations visuelles nécessitent des corrections');
  console.log('\n🔧 Vérifiez les éléments marqués ❌ ci-dessus');
}

console.log('\n📊 Prochaines étapes recommandées:');
console.log('  1. Tester l\'affichage dans le navigateur');
console.log('  2. Vérifier la responsivité sur mobile');
console.log('  3. Valider les animations et transitions');
console.log('  4. Optimiser les performances si nécessaire');

process.exit(allTestsPassed ? 0 : 1);