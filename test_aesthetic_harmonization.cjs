/**
 * Script de test pour vérifier l'harmonisation esthétique des modules historiques
 * Vérifie que tous les modules utilisent les classes de base .sidebar-section
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Test d\'harmonisation esthétique des modules historiques\n');

// Modules historiques à vérifier
const historicalModules = [
  'SessionRecorderModule.jsx',
  'ReadingProgressModule.jsx', 
  'GarminMetricsModule.jsx',
  'InteractiveQuestsModule.jsx',
  'PatrimonyEvolutionModule.jsx',
  'ShoppingListModule.jsx',
  'ActiveReadingSessionModule.jsx',
  'DailyTrainingModule.jsx',
  'CreativityProjectsModule.jsx',
  'GlobalPerformanceModule.jsx',
  'ExpressLearningModule.jsx'
];

// Fichiers CSS spécifiques qui doivent être vides
const cssFiles = [
  'session-recorder-module.css',
  'reading-progress-module.css',
  'garmin-metrics-module.css', 
  'interactive-quests-module.css',
  'patrimony-evolution-module.css',
  'shopping-list-module.css',
  'creativity-projects-module.css',
  'global-performance-module.css',
  'express-learning-module.css',
  'training-day-module.css'
];

let allTestsPassed = true;

console.log('📋 Vérification des fichiers CSS spécifiques...\n');

// Vérifier que les fichiers CSS sont vides ou ne contiennent que des commentaires
cssFiles.forEach(cssFile => {
  const cssPath = path.join('src/styles', cssFile);
  
  if (fs.existsSync(cssPath)) {
    const content = fs.readFileSync(cssPath, 'utf8');
    const contentWithoutComments = content
      .replace(/\/\*[\s\S]*?\*\//g, '') // Supprimer les commentaires
      .replace(/\s+/g, '') // Supprimer les espaces
      .trim();
    
    if (contentWithoutComments.length > 0) {
      console.log(`❌ ${cssFile} contient encore des styles spécifiques`);
      allTestsPassed = false;
    } else {
      console.log(`✅ ${cssFile} est vide (styles supprimés)`);
    }
  } else {
    console.log(`⚠️  ${cssFile} n'existe pas`);
  }
});

console.log('\n📋 Vérification des imports CSS dans les composants...\n');

// Vérifier que les composants n'importent plus leurs styles CSS spécifiques
historicalModules.forEach(moduleFile => {
  const modulePath = path.join('src/components/sidebar/historical', moduleFile);
  
  if (fs.existsSync(modulePath)) {
    const content = fs.readFileSync(modulePath, 'utf8');
    
    // Chercher les imports de styles CSS spécifiques
    const cssImportRegex = /import\s+['"](.*\.css)['"];?/g;
    const cssImports = [];
    let match;
    
    while ((match = cssImportRegex.exec(content)) !== null) {
      cssImports.push(match[1]);
    }
    
    if (cssImports.length > 0) {
      console.log(`❌ ${moduleFile} importe encore des styles CSS:`);
      cssImports.forEach(imp => console.log(`   - ${imp}`));
      allTestsPassed = false;
    } else {
      console.log(`✅ ${moduleFile} n'importe plus de styles CSS spécifiques`);
    }
  } else {
    console.log(`⚠️  ${moduleFile} n'existe pas`);
  }
});

console.log('\n📋 Vérification des badges "NOUVEAU", "DEMO", etc...\n');

// Vérifier qu'il n'y a plus de badges indésirables
historicalModules.forEach(moduleFile => {
  const modulePath = path.join('src/components/sidebar/historical', moduleFile);
  
  if (fs.existsSync(modulePath)) {
    const content = fs.readFileSync(modulePath, 'utf8');
    
    // Chercher les badges indésirables (plus précis)
    const badgePatterns = [
      /badge.*NOUVEAU/gi,
      /badge.*DEMO/gi,
      /badge.*NEW/gi,
      /sidebar-module-badge/gi
    ];
    
    let foundBadges = false;
    badgePatterns.forEach(pattern => {
      if (pattern.test(content)) {
        if (!foundBadges) {
          console.log(`❌ ${moduleFile} contient encore des badges indésirables`);
          foundBadges = true;
          allTestsPassed = false;
        }
      }
    });
    
    if (!foundBadges) {
      console.log(`✅ ${moduleFile} ne contient plus de badges indésirables`);
    }
  }
});

console.log('\n📋 Vérification de l\'utilisation des classes de base...\n');

// Vérifier que les composants utilisent les classes de base
const requiredClasses = [
  'sidebar-section',
  'sidebar-section-header', 
  'sidebar-section-title',
  'sidebar-section-icon',
  'sidebar-section-content'
];

historicalModules.forEach(moduleFile => {
  const modulePath = path.join('src/components/sidebar/historical', moduleFile);
  
  if (fs.existsSync(modulePath)) {
    const content = fs.readFileSync(modulePath, 'utf8');
    
    let missingClasses = [];
    requiredClasses.forEach(className => {
      if (!content.includes(className)) {
        missingClasses.push(className);
      }
    });
    
    if (missingClasses.length > 0) {
      console.log(`❌ ${moduleFile} ne utilise pas toutes les classes de base:`);
      missingClasses.forEach(cls => console.log(`   - Manque: ${cls}`));
      allTestsPassed = false;
    } else {
      console.log(`✅ ${moduleFile} utilise les classes de base requises`);
    }
  }
});

console.log('\n' + '='.repeat(60));

if (allTestsPassed) {
  console.log('🎉 SUCCÈS: Tous les modules historiques sont harmonisés esthétiquement!');
  console.log('✨ Les 11 nouveaux modules utilisent maintenant les mêmes styles que les 8 anciens');
  console.log('🎨 Aucune différence visuelle ne devrait être perceptible');
} else {
  console.log('❌ ÉCHEC: Certains modules nécessitent encore des corrections');
  console.log('🔧 Veuillez corriger les problèmes identifiés ci-dessus');
}

console.log('\n📊 Résumé:');
console.log(`- Modules testés: ${historicalModules.length}`);
console.log(`- Fichiers CSS testés: ${cssFiles.length}`);
console.log(`- Status: ${allTestsPassed ? 'CONFORME' : 'NON-CONFORME'}`);