/**
 * Script de diagnostic et correction rapide pour SessionRecorderModule
 */

console.log('🔧 CORRECTION RAPIDE - SessionRecorderModule');
console.log('===============================================');

// Vérifier que la correction a été appliquée
const fs = require('fs');

try {
  const filePath = 'src/components/sidebar/historical/SessionRecorderModule.jsx';
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log('✅ Vérifications de syntaxe:');
    
    // Vérifier les balises JSX
    const openingSections = (content.match(/<section/g) || []).length;
    const closingSections = (content.match(/<\/section>/g) || []).length;
    console.log(`   Balises <section>: ${openingSections} ouvertures, ${closingSections} fermetures`);
    
    const openingDivs = (content.match(/<div/g) || []).length;
    const closingDivs = (content.match(/<\/div>/g) || []).length;
    console.log(`   Balises <div>: ${openingDivs} ouvertures, ${closingDivs} fermetures`);
    
    // Vérifier les accolades
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    console.log(`   Accolades: ${openBraces} ouvertures, ${closeBraces} fermetures`);
    
    // Vérifier les imports problématiques
    const hasUseNavigation = content.includes('useNavigation');
    const hasModuleId = content.includes('moduleId');
    const hasModuleType = content.includes('moduleType');
    
    console.log('✅ Vérifications des imports:');
    console.log(`   useNavigation importé: ${hasUseNavigation ? '❌ Oui (à supprimer)' : '✅ Non'}`);
    console.log(`   moduleId utilisé: ${hasModuleId ? '❌ Oui (à supprimer)' : '✅ Non'}`);
    console.log(`   moduleType utilisé: ${hasModuleType ? '❌ Oui (à supprimer)' : '✅ Non'}`);
    
    // Vérifier la structure du pattern legacy
    const hasIsExpanded = content.includes('isExpanded');
    const hasOnToggle = content.includes('onToggle');
    const hasConditionalRendering = content.includes('{isExpanded &&');
    const hasExpandedClass = content.includes('${isExpanded ? \'expanded\' : \'\'}');
    
    console.log('✅ Vérifications du pattern legacy:');
    console.log(`   Props isExpanded: ${hasIsExpanded ? '✅ Oui' : '❌ Non'}`);
    console.log(`   Props onToggle: ${hasOnToggle ? '✅ Oui' : '❌ Non'}`);
    console.log(`   Rendu conditionnel: ${hasConditionalRendering ? '✅ Oui' : '❌ Non'}`);
    console.log(`   Classe expanded: ${hasExpandedClass ? '✅ Oui' : '❌ Non'}`);
    
    if (openingSections === closingSections && 
        openingDivs === closingDivs && 
        openBraces === closeBraces &&
        !hasUseNavigation &&
        !hasModuleId &&
        !hasModuleType &&
        hasIsExpanded &&
        hasOnToggle &&
        hasConditionalRendering &&
        hasExpandedClass) {
      console.log('\n🎉 SUCCÈS: SessionRecorderModule est maintenant correct!');
      console.log('   - Syntaxe JSX valide');
      console.log('   - Pattern legacy appliqué');
      console.log('   - Imports nettoyés');
      console.log('   - Prêt pour le test dans le navigateur');
    } else {
      console.log('\n⚠️  ATTENTION: Quelques problèmes détectés');
      console.log('   Vérifiez les points marqués ❌ ci-dessus');
    }
    
  } else {
    console.log('❌ Fichier SessionRecorderModule.jsx non trouvé');
  }
  
} catch (error) {
  console.log('❌ Erreur lors de la vérification:', error.message);
}

console.log('\n📋 PROCHAINES ÉTAPES:');
console.log('1. Redémarrer le serveur de développement si nécessaire');
console.log('2. Vérifier que le module s\'affiche avec une flèche de toggle');
console.log('3. Tester l\'expansion/contraction du module');
console.log('4. Confirmer que le contenu s\'affiche quand ouvert');

console.log('\n✨ Diagnostic terminé');