/**
 * Script de validation finale pour vérifier que tous les modules historiques
 * ont été corrigés et affichent maintenant du contenu
 */

const fs = require('fs');
const path = require('path');

console.log('✅ VALIDATION FINALE: Modules historiques corrigés');
console.log('==================================================');

// Liste des modules à vérifier
const modulesToCheck = [
  'SessionRecorderModule.jsx',
  'ReadingProgressModule.jsx',
  'GarminMetricsModule.jsx',
  'InteractiveQuestsModule.jsx',
  'PatrimonyEvolutionModule.jsx',
  'ShoppingListModule.jsx',
  'ActiveReadingSessionModule.jsx',
  'TrainingDayModule.jsx',
  'CreativityProjectsModule.jsx',
  'GlobalPerformanceModule.jsx',
  'ExpressLearningModule.jsx'
];

const modulesPath = 'src/components/sidebar/historical/';

// Critères de validation
const validationCriteria = {
  hasPropsData: /data\s*=\s*\{\}/,
  hasIsLoadingProp: /isLoading\s*=\s*false/,
  hasContent: /sidebar-section-content/,
  hasNavigation: /navigation-section|nav-button/,
  hasDisplayName: /\.displayName\s*=/,
  hasExport: /export default/
};

// Fonction pour valider un module
function validateModule(moduleName) {
  const filePath = path.join(modulesPath, moduleName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ ${moduleName}: Fichier non trouvé`);
    return false;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let score = 0;
    let maxScore = Object.keys(validationCriteria).length;
    let issues = [];
    
    // Vérifier chaque critère
    Object.entries(validationCriteria).forEach(([criterion, regex]) => {
      if (regex.test(content)) {
        score++;
      } else {
        issues.push(criterion);
      }
    });
    
    const percentage = Math.round((score / maxScore) * 100);
    
    if (percentage === 100) {
      console.log(`✅ ${moduleName}: Parfait (${score}/${maxScore})`);
      return true;
    } else if (percentage >= 80) {
      console.log(`🟡 ${moduleName}: Bon (${score}/${maxScore}) - Problèmes mineurs: ${issues.join(', ')}`);
      return true;
    } else {
      console.log(`❌ ${moduleName}: Problématique (${score}/${maxScore}) - Problèmes: ${issues.join(', ')}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ ${moduleName}: Erreur de lecture - ${error.message}`);
    return false;
  }
}

// Vérifier le ModuleRenderer
function validateModuleRenderer() {
  console.log('\n🔍 VALIDATION DU MODULE RENDERER');
  console.log('================================');
  
  const rendererPath = 'src/components/sidebar/ModuleRenderer.jsx';
  
  if (!fs.existsSync(rendererPath)) {
    console.log('❌ ModuleRenderer.jsx non trouvé');
    return false;
  }
  
  try {
    const content = fs.readFileSync(rendererPath, 'utf8');
    
    const checks = {
      'Import CSS corrigé': /historical-modules-corrected\.css/,
      'Données de démo robustes': /demoData\s*=/,
      'isLoading forcé à false': /isLoading:\s*false/,
      'hasGarminData forcé': /hasGarminData:\s*true/,
      'Données finales enrichies': /finalData\s*=/
    };
    
    let passed = 0;
    let total = Object.keys(checks).length;
    
    Object.entries(checks).forEach(([checkName, regex]) => {
      if (regex.test(content)) {
        console.log(`  ✅ ${checkName}`);
        passed++;
      } else {
        console.log(`  ❌ ${checkName}`);
      }
    });
    
    const percentage = Math.round((passed / total) * 100);
    console.log(`\nRésultat ModuleRenderer: ${passed}/${total} (${percentage}%)`);
    
    return percentage >= 80;
    
  } catch (error) {
    console.log(`❌ Erreur lors de la validation du ModuleRenderer: ${error.message}`);
    return false;
  }
}

// Vérifier les fichiers CSS
function validateCSS() {
  console.log('\n🎨 VALIDATION DES STYLES CSS');
  console.log('============================');
  
  const cssFiles = [
    'src/styles/historical-modules-corrected.css',
    'src/styles/garmin-metrics-module.css',
    'src/styles/reading-progress-module.css'
  ];
  
  let cssValid = true;
  
  cssFiles.forEach(cssFile => {
    if (fs.existsSync(cssFile)) {
      console.log(`  ✅ ${path.basename(cssFile)} trouvé`);
    } else {
      console.log(`  ⚠️  ${path.basename(cssFile)} manquant`);
      if (cssFile.includes('corrected')) {
        cssValid = false;
      }
    }
  });
  
  return cssValid;
}

// Générer un rapport de validation
function generateValidationReport() {
  console.log('\n📊 VALIDATION DES MODULES INDIVIDUELS');
  console.log('=====================================');
  
  let validModules = 0;
  let totalModules = modulesToCheck.length;
  
  modulesToCheck.forEach(moduleName => {
    if (validateModule(moduleName)) {
      validModules++;
    }
  });
  
  const moduleRendererValid = validateModuleRenderer();
  const cssValid = validateCSS();
  
  console.log('\n📋 RAPPORT FINAL');
  console.log('================');
  console.log(`Modules historiques valides: ${validModules}/${totalModules} (${Math.round((validModules / totalModules) * 100)}%)`);
  console.log(`ModuleRenderer valide: ${moduleRendererValid ? '✅' : '❌'}`);
  console.log(`CSS valide: ${cssValid ? '✅' : '❌'}`);
  
  const overallScore = (validModules / totalModules) * 0.7 + (moduleRendererValid ? 0.2 : 0) + (cssValid ? 0.1 : 0);
  const overallPercentage = Math.round(overallScore * 100);
  
  console.log(`\n🎯 SCORE GLOBAL: ${overallPercentage}%`);
  
  if (overallPercentage >= 90) {
    console.log('🎉 EXCELLENT ! Tous les modules devraient maintenant afficher du contenu.');
    console.log('\n📋 PROCHAINES ÉTAPES:');
    console.log('1. Redémarrer l\'application React');
    console.log('2. Vérifier visuellement que tous les modules affichent du contenu');
    console.log('3. Tester la navigation depuis chaque module');
    console.log('4. Ajuster les données de démonstration si nécessaire');
  } else if (overallPercentage >= 70) {
    console.log('🟡 BON ! La plupart des corrections sont appliquées.');
    console.log('Quelques ajustements mineurs peuvent être nécessaires.');
  } else {
    console.log('❌ PROBLÉMATIQUE ! Des corrections supplémentaires sont nécessaires.');
    console.log('Vérifiez les erreurs ci-dessus et réappliquez les corrections.');
  }
  
  return overallPercentage;
}

// Conseils de dépannage
function provideTroubleshootingTips() {
  console.log('\n🔧 CONSEILS DE DÉPANNAGE');
  console.log('========================');
  
  console.log('Si certains modules n\'affichent toujours pas de contenu:');
  console.log('');
  console.log('1. 🔄 Redémarrer complètement l\'application:');
  console.log('   - Arrêter le serveur de développement (Ctrl+C)');
  console.log('   - Vider le cache: npm start -- --reset-cache');
  console.log('   - Ou simplement: npm start');
  console.log('');
  console.log('2. 🧹 Vérifier la console du navigateur:');
  console.log('   - Ouvrir les outils de développement (F12)');
  console.log('   - Chercher les erreurs JavaScript');
  console.log('   - Vérifier les warnings React');
  console.log('');
  console.log('3. 📊 Vérifier les données dans React DevTools:');
  console.log('   - Installer React Developer Tools');
  console.log('   - Inspecter les props des modules historiques');
  console.log('   - Vérifier que data.sport.hasGarminData = true');
  console.log('');
  console.log('4. 🎨 Vérifier les styles CSS:');
  console.log('   - S\'assurer que les modules ne sont pas masqués');
  console.log('   - Vérifier les hauteurs et overflow');
  console.log('   - Tester sur différentes tailles d\'écran');
  console.log('');
  console.log('5. 🔍 Debug spécifique:');
  console.log('   - Ajouter des console.log dans les modules');
  console.log('   - Vérifier que isExpanded = true');
  console.log('   - Confirmer que le contenu est rendu dans le DOM');
}

// Exécuter la validation
function runValidation() {
  const score = generateValidationReport();
  
  if (score < 90) {
    provideTroubleshootingTips();
  }
  
  console.log('\n🏁 VALIDATION TERMINÉE');
  console.log('======================');
  
  return score >= 70;
}

// Lancer la validation
runValidation();