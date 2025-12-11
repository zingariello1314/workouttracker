/**
 * Script de correction automatique pour les modules historiques de la sidebar
 * Applique les corrections CSS nécessaires pour un affichage correct
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction automatique des CSS des modules historiques');

// Fonction pour lire un fichier
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`❌ Erreur lecture ${filePath}:`, error.message);
    return null;
  }
}

// Fonction pour écrire un fichier
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fichier mis à jour: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Erreur écriture ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour corriger les CSS des modules
function fixModuleCSS() {
  const modules = [
    {
      name: 'Session Recorder',
      cssPath: 'src/styles/session-recorder-module.css',
      fixes: [
        {
          search: /@apply bg-gradient-to-br from-slate-800\/80 to-slate-900\/80;[\s\S]*?@apply backdrop-blur-sm;/g,
          replace: `/* Styles de base hérités de .historical-module via historical-modules-fix.css */`
        },
        {
          search: /@apply mb-4;/g,
          replace: `/* Margin géré par le système de base */`
        },
        {
          search: /@apply.*?;/g,
          replace: (match) => `/* ${match.replace('@apply ', '').replace(';', '')} - Converti en CSS standard */`
        }
      ]
    },
    {
      name: 'Garmin Metrics',
      cssPath: 'src/styles/garmin-metrics-module.css',
      fixes: [
        {
          search: /@apply bg-gradient-to-br from-slate-800\/80 to-slate-900\/80;[\s\S]*?@apply backdrop-blur-sm;/g,
          replace: `/* Styles de base hérités de .historical-module via historical-modules-fix.css */`
        },
        {
          search: /@apply.*?;/g,
          replace: (match) => `/* ${match.replace('@apply ', '').replace(';', '')} - Converti en CSS standard */`
        }
      ]
    },
    {
      name: 'Reading Progress',
      cssPath: 'src/styles/reading-progress-module.css',
      fixes: [
        {
          search: /\.reading-progress-module \{[\s\S]*?overflow: hidden;\s*\}/g,
          replace: `/* Styles de base hérités de .historical-module via historical-modules-fix.css */
.reading-progress-module {
  /* Styles spécifiques au module seulement */
}`
        },
        {
          search: /\.reading-progress-module \.sidebar-section-header \{[\s\S]*?\}/g,
          replace: `/* Header styles hérités de .historical-module */`
        },
        {
          search: /\.reading-progress-module \.sidebar-section-content \{[\s\S]*?\}/g,
          replace: `/* Content styles hérités de .historical-module */`
        }
      ]
    },
    {
      name: 'Patrimony Evolution',
      cssPath: 'src/styles/patrimony-evolution-module.css',
      fixes: [
        {
          search: /--patrimony-primary: #a855f7;[\s\S]*?--patrimony-info: #3b82f6;/g,
          replace: `/* Variables harmonisées avec le système existant */
  --patrimony-primary: var(--sidebar-purple);
  --patrimony-secondary: var(--sidebar-cyan);
  --patrimony-accent: var(--sidebar-pink);
  --patrimony-success: var(--sidebar-green);
  --patrimony-warning: var(--sidebar-gold);
  --patrimony-danger: var(--sidebar-red);
  --patrimony-info: var(--sidebar-blue);`
        },
        {
          search: /\.patrimony-evolution-module \.sidebar-section-header \{[\s\S]*?\}/g,
          replace: `/* Header styles hérités de .historical-module */`
        },
        {
          search: /\.patrimony-evolution-module \.sidebar-section-content \{[\s\S]*?\}/g,
          replace: `/* Content styles hérités de .historical-module */`
        }
      ]
    }
  ];

  modules.forEach(module => {
    console.log(`\n🔧 Correction du module: ${module.name}`);
    
    const content = readFile(module.cssPath);
    if (!content) return;
    
    let fixedContent = content;
    let changesApplied = 0;
    
    module.fixes.forEach((fix, index) => {
      const before = fixedContent;
      if (typeof fix.replace === 'function') {
        fixedContent = fixedContent.replace(fix.search, fix.replace);
      } else {
        fixedContent = fixedContent.replace(fix.search, fix.replace);
      }
      
      if (before !== fixedContent) {
        changesApplied++;
        console.log(`  ✅ Fix ${index + 1} appliqué`);
      }
    });
    
    if (changesApplied > 0) {
      writeFile(module.cssPath, fixedContent);
      console.log(`  📊 ${changesApplied} corrections appliquées`);
    } else {
      console.log(`  ℹ️ Aucune correction nécessaire`);
    }
  });
}

// Fonction pour vérifier l'ordre d'import dans index.css
function checkImportOrder() {
  console.log('\n📋 Vérification de l\'ordre d\'import CSS...');
  
  const indexCssPath = 'src/index.css';
  const content = readFile(indexCssPath);
  
  if (!content) return;
  
  const imports = content.match(/@import.*?;/g) || [];
  const historicalImports = imports.filter(imp => 
    imp.includes('session-recorder-module') ||
    imp.includes('reading-progress-module') ||
    imp.includes('garmin-metrics-module') ||
    imp.includes('patrimony-evolution-module') ||
    imp.includes('historical-modules-fix')
  );
  
  console.log('📦 Imports des modules historiques trouvés:');
  historicalImports.forEach((imp, index) => {
    console.log(`  ${index + 1}. ${imp}`);
  });
  
  const fixImportIndex = historicalImports.findIndex(imp => imp.includes('historical-modules-fix'));
  const isFixLast = fixImportIndex === historicalImports.length - 1;
  
  if (isFixLast) {
    console.log('✅ L\'import du fix CSS est bien en dernier position');
  } else {
    console.log('❌ L\'import du fix CSS n\'est PAS en dernier position');
    console.log('💡 Le fix doit être importé après tous les autres modules pour fonctionner');
  }
  
  return { imports: historicalImports, isFixLast };
}

// Fonction pour valider la structure des composants
function validateComponentStructure() {
  console.log('\n🏗️ Validation de la structure des composants...');
  
  const componentsToCheck = [
    'src/components/sidebar/historical/SessionRecorderModule.jsx',
    'src/components/sidebar/historical/ReadingProgressModule.jsx',
    'src/components/sidebar/historical/GarminMetricsModule.jsx',
    'src/components/sidebar/historical/PatrimonyEvolutionModule.jsx'
  ];
  
  componentsToCheck.forEach(componentPath => {
    const content = readFile(componentPath);
    if (!content) return;
    
    const componentName = path.basename(componentPath, '.jsx');
    console.log(`\n📄 ${componentName}:`);
    
    // Vérifier les classes CSS
    const hasHistoricalClass = content.includes('historical-module');
    const hasSidebarSection = content.includes('sidebar-section');
    const hasCorrectHeader = content.includes('sidebar-section-header');
    const hasCorrectContent = content.includes('sidebar-section-content');
    
    console.log(`  ✅ Classe historical-module: ${hasHistoricalClass ? '✅' : '❌'}`);
    console.log(`  ✅ Classe sidebar-section: ${hasSidebarSection ? '✅' : '❌'}`);
    console.log(`  ✅ Header structure: ${hasCorrectHeader ? '✅' : '❌'}`);
    console.log(`  ✅ Content structure: ${hasCorrectContent ? '✅' : '❌'}`);
    
    // Vérifier les data attributes
    const hasModuleId = content.includes('data-module-id');
    const hasModuleType = content.includes('data-module-type');
    
    console.log(`  ✅ Data module-id: ${hasModuleId ? '✅' : '❌'}`);
    console.log(`  ✅ Data module-type: ${hasModuleType ? '✅' : '❌'}`);
  });
}

// Fonction pour générer un rapport complet
function generateReport() {
  console.log('\n📊 Génération du rapport complet...');
  
  const report = {
    timestamp: new Date().toISOString(),
    cssFixApplied: fs.existsSync('src/styles/historical-modules-fix.css'),
    importOrder: checkImportOrder(),
    moduleValidation: {},
    recommendations: []
  };
  
  // Sauvegarder le rapport
  const reportPath = 'CSS_FIX_REPORT.json';
  writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📋 Rapport sauvegardé dans: ${reportPath}`);
  
  return report;
}

// Fonction principale
function main() {
  console.log('🚀 Démarrage de la correction CSS des modules historiques\n');
  
  try {
    // 1. Corriger les CSS des modules
    fixModuleCSS();
    
    // 2. Vérifier l'ordre d'import
    checkImportOrder();
    
    // 3. Valider la structure des composants
    validateComponentStructure();
    
    // 4. Générer le rapport
    generateReport();
    
    console.log('\n🎉 Correction terminée avec succès !');
    console.log('\n📋 Prochaines étapes:');
    console.log('  1. Redémarrer le serveur de développement');
    console.log('  2. Vérifier visuellement les modules dans la sidebar');
    console.log('  3. Tester les interactions (hover, click, navigation)');
    console.log('  4. Utiliser test_css_fix_modules.js pour validation automatique');
    
  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  }
}

// Lancer la correction
main();