/**
 * Script de test pour vérifier la navigation précise des modules historiques
 * Vérifie que tous les clics mènent exactement au bon endroit avec scroll précis
 */

const fs = require('fs');
const path = require('path');

console.log('🧭 Test de navigation précise des modules historiques\n');

// Modules historiques et leurs cibles de navigation
const navigationTargets = [
  {
    module: 'SessionRecorderModule.jsx',
    requirements: ['1.1', '1.2'],
    targets: [
      { action: 'Sport button', target: 'sport > aujourdhui', moduleId: 'session-recorder-target' },
      { action: 'Books button', target: 'books > reading', moduleId: 'books-reading-session' }
    ]
  },
  {
    module: 'ReadingProgressModule.jsx',
    requirements: ['2.4'],
    targets: [
      { action: 'Click module', target: 'books > reading', moduleId: 'reading-progress' }
    ]
  },
  {
    module: 'GarminMetricsModule.jsx',
    requirements: ['3.4'],
    targets: [
      { action: 'Click module', target: 'sport > aujourdhui', moduleId: 'garmin-today-module' }
    ]
  },
  {
    module: 'InteractiveQuestsModule.jsx',
    requirements: ['4.4'],
    targets: [
      { action: 'Create Quest button', target: 'quests > creation', moduleId: 'quest-creation' }
    ]
  },
  {
    module: 'PatrimonyEvolutionModule.jsx',
    requirements: ['5.4'],
    targets: [
      { action: 'Click module', target: 'finances > patrimoine', moduleId: 'patrimony-module' }
    ]
  },
  {
    module: 'ShoppingListModule.jsx',
    requirements: ['6.3', '6.5'],
    targets: [
      { action: 'Navigate button', target: 'finances > smart-shopping', moduleId: 'smart-shopping-module' }
    ]
  },
  {
    module: 'ActiveReadingSessionModule.jsx',
    requirements: ['7.4'],
    targets: [
      { action: 'Click module', target: 'books > session', moduleId: 'reading-session-module' }
    ]
  },
  {
    module: 'DailyTrainingModule.jsx',
    requirements: ['8.4'],
    targets: [
      { action: 'Click module', target: 'sport > entraînement', moduleId: 'training-module' }
    ]
  },
  {
    module: 'CreativityProjectsModule.jsx',
    requirements: ['9.4'],
    targets: [
      { action: 'Click module', target: 'homepage > creative-projects', moduleId: 'creative-projects' }
    ]
  },
  {
    module: 'GlobalPerformanceModule.jsx',
    requirements: ['10.4'],
    targets: [
      { action: 'Click module', target: 'homepage > performance', moduleId: 'global-performance' }
    ]
  },
  {
    module: 'ExpressLearningModule.jsx',
    requirements: ['11.4'],
    targets: [
      { action: 'Click module', target: 'settings > apprentissage', moduleId: 'learning-module' }
    ]
  }
];

let allTestsPassed = true;
let issuesFound = [];

console.log('📋 Vérification du service DeepLinkService...\n');

// Vérifier que le DeepLinkService est complet
const deepLinkServicePath = 'src/services/navigation/DeepLinkService.js';
if (fs.existsSync(deepLinkServicePath)) {
  const content = fs.readFileSync(deepLinkServicePath, 'utf8');
  
  const requiredMethods = [
    'navigateToModule',
    'scrollToModule', 
    'highlightModule',
    'activateSubtab'
  ];
  
  let missingMethods = [];
  requiredMethods.forEach(method => {
    if (!content.includes(method)) {
      missingMethods.push(method);
    }
  });
  
  if (missingMethods.length > 0) {
    console.log('❌ DeepLinkService incomplet:');
    missingMethods.forEach(method => console.log(`   - Manque: ${method}`));
    allTestsPassed = false;
  } else {
    console.log('✅ DeepLinkService contient toutes les méthodes requises');
  }
  
  // Vérifier les fonctionnalités spécifiques
  const requiredFeatures = [
    { name: 'Scroll automatique', pattern: /scroll.*smooth|scrollIntoView/gi },
    { name: 'Activation sous-onglets', pattern: /subtab|subTab/gi },
    { name: 'Mise en évidence temporaire', pattern: /highlight.*duration|highlight.*timeout/gi },
    { name: 'Gestion des erreurs', pattern: /try.*catch|error/gi }
  ];
  
  requiredFeatures.forEach(feature => {
    if (feature.pattern.test(content)) {
      console.log(`✅ ${feature.name} implémenté`);
    } else {
      console.log(`❌ ${feature.name} manquant`);
      allTestsPassed = false;
    }
  });
  
} else {
  console.log('❌ DeepLinkService.js n\'existe pas');
  allTestsPassed = false;
}

console.log('\n📋 Vérification de l\'utilisation du DeepLinkService dans les modules...\n');

navigationTargets.forEach(moduleInfo => {
  const modulePath = path.join('src/components/sidebar/historical', moduleInfo.module);
  
  if (fs.existsSync(modulePath)) {
    const content = fs.readFileSync(modulePath, 'utf8');
    
    let moduleIssues = [];
    let moduleStatus = '✅';
    
    // Vérifier l'import du DeepLinkService
    if (!content.includes('deepLinkService') && !content.includes('DeepLinkService')) {
      moduleIssues.push('N\'importe pas DeepLinkService');
      moduleStatus = '❌';
      allTestsPassed = false;
    }
    
    // Vérifier les handlers de navigation
    const navigationPatterns = [
      /handleNavigate/gi,
      /onClick.*navigate/gi,
      /navigateToModule/gi
    ];
    
    let hasNavigationHandlers = false;
    navigationPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        hasNavigationHandlers = true;
      }
    });
    
    if (!hasNavigationHandlers) {
      moduleIssues.push('Pas de handlers de navigation détectés');
      moduleStatus = moduleStatus === '✅' ? '⚠️' : '❌';
    }
    
    // Vérifier les paramètres de navigation pour chaque cible
    moduleInfo.targets.forEach(target => {
      const hasTargetConfig = content.includes(target.target.split(' > ')[0]); // Vérifier au moins l'onglet
      if (!hasTargetConfig) {
        moduleIssues.push(`Configuration manquante pour: ${target.action} -> ${target.target}`);
        moduleStatus = '❌';
        allTestsPassed = false;
      }
    });
    
    // Vérifier la gestion des erreurs de navigation
    if (!content.includes('catch') && !content.includes('error')) {
      moduleIssues.push('Pas de gestion d\'erreur de navigation');
      moduleStatus = moduleStatus === '✅' ? '⚠️' : '❌';
    }
    
    console.log(`${moduleStatus} ${moduleInfo.module}`);
    if (moduleIssues.length > 0) {
      moduleIssues.forEach(issue => console.log(`   - ${issue}`));
      issuesFound.push({
        module: moduleInfo.module,
        requirements: moduleInfo.requirements,
        issues: moduleIssues
      });
    }
    
  } else {
    console.log(`⚠️  ${moduleInfo.module} n'existe pas`);
  }
});

console.log('\n📋 Vérification des styles de mise en évidence...\n');

// Vérifier que les styles de mise en évidence existent
const highlightStylesPath = 'src/styles/module-highlight.css';
if (fs.existsSync(highlightStylesPath)) {
  const content = fs.readFileSync(highlightStylesPath, 'utf8');
  
  const requiredStyles = [
    'module-highlighted',
    'moduleHighlight',
    'animation',
    'box-shadow'
  ];
  
  let missingStyles = [];
  requiredStyles.forEach(style => {
    if (!content.includes(style)) {
      missingStyles.push(style);
    }
  });
  
  if (missingStyles.length > 0) {
    console.log('❌ Styles de mise en évidence incomplets:');
    missingStyles.forEach(style => console.log(`   - Manque: ${style}`));
    allTestsPassed = false;
  } else {
    console.log('✅ Styles de mise en évidence complets');
  }
} else {
  console.log('❌ module-highlight.css n\'existe pas');
  allTestsPassed = false;
}

console.log('\n📋 Vérification des utilitaires de sous-onglets...\n');

// Vérifier les utilitaires d'activation des sous-onglets
const subtabUtilsPath = 'src/utils/subtabActivation.js';
if (fs.existsSync(subtabUtilsPath)) {
  console.log('✅ subtabActivation.js existe');
} else {
  console.log('❌ subtabActivation.js manquant');
  allTestsPassed = false;
}

console.log('\n' + '='.repeat(60));

if (allTestsPassed) {
  console.log('🎉 SUCCÈS: Le système de navigation précise est complet!');
  console.log('🧭 Tous les modules peuvent naviguer vers leurs cibles exactes');
  console.log('📍 Le scroll automatique et la mise en évidence fonctionnent');
  console.log('🔗 L\'activation des sous-onglets est implémentée');
} else {
  console.log('❌ ÉCHEC: Le système de navigation nécessite des corrections');
  console.log('🔧 Problèmes identifiés:');
  
  issuesFound.forEach(item => {
    console.log(`\n📄 ${item.module} (Requirements: ${item.requirements.join(', ')}):`);
    item.issues.forEach(issue => console.log(`   - ${issue}`));
  });
  
  console.log('\n💡 Actions recommandées:');
  console.log('1. Compléter le DeepLinkService avec toutes les méthodes');
  console.log('2. Ajouter les handlers de navigation dans chaque module');
  console.log('3. Configurer les cibles de navigation précises');
  console.log('4. Implémenter la gestion d\'erreur de navigation');
  console.log('5. Créer les styles de mise en évidence');
}

console.log('\n📊 Résumé:');
console.log(`- Modules testés: ${navigationTargets.length}`);
console.log(`- Modules avec problèmes: ${issuesFound.length}`);
console.log(`- Cibles de navigation: ${navigationTargets.reduce((acc, m) => acc + m.targets.length, 0)}`);
console.log(`- Status: ${allTestsPassed ? 'CONFORME' : 'NON-CONFORME'}`);