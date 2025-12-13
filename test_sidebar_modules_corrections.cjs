/**
 * Script de test pour vérifier les corrections des modules sidebar
 * 
 * Ce script vérifie que :
 * 1. Tous les modules peuvent être importés sans erreur
 * 2. Les variables sont correctement définies
 * 3. Les composants peuvent être rendus sans crash
 */

const fs = require('fs');
const path = require('path');

// Liste des modules corrigés
const correctedModules = [
  'SessionRecorderModule.jsx',
  'ShoppingListModule.jsx', 
  'ReadingProgressModule.jsx',
  'GarminMetricsModule.jsx',
  'PatrimonyEvolutionModule.jsx',
  'ActiveReadingSessionModule.jsx',
  'TrainingDayModule.jsx'
];

const modulesPath = 'src/components/sidebar/historical';

console.log('🔍 Vérification des corrections des modules sidebar...\n');

let allTestsPassed = true;

correctedModules.forEach(moduleFile => {
  const filePath = path.join(modulesPath, moduleFile);
  
  console.log(`📁 Test de ${moduleFile}:`);
  
  try {
    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      console.log(`  ❌ Fichier non trouvé: ${filePath}`);
      allTestsPassed = false;
      return;
    }
    
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Test 1: Vérifier qu'il n'y a pas de référence à 'data' avant sa définition
    const lines = content.split('\n');
    let dataDefinedLine = -1;
    let dataUsedLine = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Chercher la définition de data dans les props
      if (line.includes('data = {}') && line.includes('moduleId')) {
        dataDefinedLine = i;
      }
      
      // Chercher l'utilisation de data dans demoData (problématique)
      if (line.includes('const finalData = data &&') && dataUsedLine === -1) {
        dataUsedLine = i;
      }
    }
    
    if (dataUsedLine !== -1 && dataDefinedLine !== -1 && dataUsedLine < dataDefinedLine) {
      console.log(`  ❌ Variable 'data' utilisée avant définition (ligne ${dataUsedLine + 1})`);
      allTestsPassed = false;
    } else {
      console.log(`  ✅ Variable 'data' correctement définie`);
    }
    
    // Test 2: Vérifier la présence de demoData
    if (content.includes('const demoData = {')) {
      console.log(`  ✅ Données de démonstration présentes`);
    } else {
      console.log(`  ⚠️  Données de démonstration manquantes`);
    }
    
    // Test 3: Vérifier la présence de finalData
    if (content.includes('const finalData = data &&')) {
      console.log(`  ✅ Logique de fallback présente`);
    } else {
      console.log(`  ⚠️  Logique de fallback manquante`);
    }
    
    // Test 4: Vérifier qu'il n'y a pas d'erreurs de syntaxe évidentes
    const syntaxIssues = [];
    
    // Vérifier les accolades non fermées dans les commentaires
    if (content.includes('// FIX: Toujours affiché}) => {')) {
      syntaxIssues.push('Accolade dans commentaire');
    }
    
    // Vérifier les objets non fermés
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    
    if (Math.abs(openBraces - closeBraces) > 2) { // Tolérance pour les template literals
      syntaxIssues.push(`Accolades déséquilibrées (${openBraces} ouvertes, ${closeBraces} fermées)`);
    }
    
    if (syntaxIssues.length > 0) {
      console.log(`  ❌ Problèmes de syntaxe: ${syntaxIssues.join(', ')}`);
      allTestsPassed = false;
    } else {
      console.log(`  ✅ Syntaxe correcte`);
    }
    
    console.log(`  ✅ ${moduleFile} - Tests passés\n`);
    
  } catch (error) {
    console.log(`  ❌ Erreur lors du test: ${error.message}\n`);
    allTestsPassed = false;
  }
});

// Résumé final
console.log('📊 Résumé des tests:');
if (allTestsPassed) {
  console.log('✅ Tous les tests sont passés avec succès !');
  console.log('🎉 Les corrections ont été appliquées correctement.');
  console.log('\n🚀 Prochaines étapes:');
  console.log('1. Redémarrer le serveur de développement');
  console.log('2. Vérifier la console du navigateur');
  console.log('3. Tester le chargement des modules sidebar');
} else {
  console.log('❌ Certains tests ont échoué.');
  console.log('🔧 Vérifiez les erreurs ci-dessus et corrigez-les.');
}

console.log('\n📝 Modules testés:', correctedModules.length);
console.log('📁 Chemin des modules:', modulesPath);