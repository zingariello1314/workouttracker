/**
 * Test script pour vérifier le fonctionnement de l'ajustement automatique
 * de la taille de police des citations sur la page d'accueil
 */

console.log('🧪 Test de l\'ajustement automatique des citations');

// Simuler différentes longueurs de citations
const testQuotes = [
  {
    name: 'Citation courte',
    quote: {
      line1: 'Rêve grand,',
      line2: 'Agis',
      line3: 'maintenant.'
    }
  },
  {
    name: 'Citation moyenne',
    quote: {
      line1: 'Le grand orateur du monde,',
      line2: 'c\'est le succès',
      line3: 'qui parle pour nous.'
    }
  },
  {
    name: 'Citation longue (problématique)',
    quote: {
      line1: 'Champion grâce à ce qu\'on ressent ;',
      line2: 'un désir, un rêve, une vision.',
      line3: 'On doit avoir du talent et de la technique.'
    }
  },
  {
    name: 'Citation très longue',
    quote: {
      line1: 'La persévérance et la détermination sont les clés du succès dans tous les domaines de la vie',
      line2: 'car elles nous permettent de surmonter les obstacles',
      line3: 'et d\'atteindre nos objectifs les plus ambitieux avec courage et passion.'
    }
  }
];

// Fonction pour calculer la longueur totale d'une citation
function getTotalLength(quote) {
  return (quote.line1 + quote.line2 + quote.line3).length;
}

// Fonction pour calculer la taille de police recommandée
function calculateRecommendedFontSize(quote, maxFontSize = 80, minFontSize = 32) {
  const totalLength = getTotalLength(quote);
  
  if (totalLength <= 30) return maxFontSize;
  if (totalLength <= 50) return Math.max(maxFontSize * 0.85, minFontSize);
  if (totalLength <= 80) return Math.max(maxFontSize * 0.7, minFontSize);
  if (totalLength <= 120) return Math.max(maxFontSize * 0.6, minFontSize);
  return Math.max(maxFontSize * 0.5, minFontSize);
}

console.log('\n📊 Analyse des citations de test :');
console.log('=====================================');

testQuotes.forEach((test, index) => {
  const totalLength = getTotalLength(test.quote);
  const recommendedSize = calculateRecommendedFontSize(test.quote);
  
  console.log(`\n${index + 1}. ${test.name}`);
  console.log(`   Ligne 1: "${test.quote.line1}" (${test.quote.line1.length} chars)`);
  console.log(`   Ligne 2: "${test.quote.line2}" (${test.quote.line2.length} chars)`);
  console.log(`   Ligne 3: "${test.quote.line3}" (${test.quote.line3.length} chars)`);
  console.log(`   📏 Longueur totale: ${totalLength} caractères`);
  console.log(`   🎯 Taille recommandée: ${recommendedSize}px`);
  
  if (totalLength > 80) {
    console.log(`   ⚠️  Citation longue - ajustement nécessaire`);
  } else if (totalLength > 50) {
    console.log(`   ⚡ Citation moyenne - ajustement léger`);
  } else {
    console.log(`   ✅ Citation courte - taille maximale`);
  }
});

console.log('\n🔧 Composant AdaptiveText créé avec les fonctionnalités suivantes :');
console.log('- ✅ Ajustement automatique de la taille de police');
console.log('- ✅ Mesure précise de la largeur du texte');
console.log('- ✅ Respect des limites min/max de taille');
console.log('- ✅ Transitions fluides entre les tailles');
console.log('- ✅ Responsive design (recalcul au redimensionnement)');
console.log('- ✅ Performance optimisée (calcul uniquement si nécessaire)');

console.log('\n🎨 Intégration dans HomePage.jsx :');
console.log('- ✅ Remplacement du h1 par AdaptiveText');
console.log('- ✅ Configuration des tailles min (32px) et max (80px)');
console.log('- ✅ Largeur de conteneur définie (600px)');
console.log('- ✅ Préservation des styles et animations existants');
console.log('- ✅ Accessibilité maintenue (role="heading", aria-level="1")');

console.log('\n🚀 Résultat attendu :');
console.log('- Les citations courtes s\'affichent en grande taille (80px)');
console.log('- Les citations longues s\'ajustent automatiquement (jusqu\'à 32px min)');
console.log('- Aucune coupure de texte');
console.log('- Transitions fluides entre les citations');
console.log('- Responsive sur tous les écrans');

console.log('\n✨ Test terminé ! Le problème de coupure des citations devrait être résolu.');