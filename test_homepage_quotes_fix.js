/**
 * Script de test pour vérifier le fix des citations sur la page d'accueil
 * À exécuter dans la console du navigateur sur la page d'accueil
 */

console.log('🔧 Test du fix des citations adaptatives');

// Fonction pour tester l'ajustement des citations
function testAdaptiveQuotes() {
  console.log('\n📋 Vérification de l\'implémentation...');
  
  // Vérifier que le composant AdaptiveText est présent
  const adaptiveTextElement = document.querySelector('[role="heading"][aria-level="1"]');
  
  if (!adaptiveTextElement) {
    console.error('❌ Composant AdaptiveText non trouvé');
    return false;
  }
  
  console.log('✅ Composant AdaptiveText trouvé');
  
  // Vérifier les styles
  const computedStyle = window.getComputedStyle(adaptiveTextElement);
  const fontSize = parseFloat(computedStyle.fontSize);
  
  console.log(`📏 Taille de police actuelle: ${fontSize}px`);
  
  // Vérifier que la taille est dans la plage attendue
  if (fontSize >= 32 && fontSize <= 80) {
    console.log('✅ Taille de police dans la plage attendue (32-80px)');
  } else {
    console.warn(`⚠️ Taille de police hors plage: ${fontSize}px`);
  }
  
  // Vérifier le contenu
  const textContent = adaptiveTextElement.textContent;
  console.log(`📝 Contenu: "${textContent.substring(0, 50)}..."`);
  console.log(`📏 Longueur du texte: ${textContent.length} caractères`);
  
  // Vérifier que le texte n'est pas coupé
  const containerWidth = adaptiveTextElement.parentElement.clientWidth;
  const textWidth = adaptiveTextElement.scrollWidth;
  
  console.log(`📐 Largeur conteneur: ${containerWidth}px`);
  console.log(`📐 Largeur texte: ${textWidth}px`);
  
  if (textWidth <= containerWidth) {
    console.log('✅ Texte s\'affiche complètement sans débordement');
  } else {
    console.warn(`⚠️ Texte déborde: ${textWidth - containerWidth}px de trop`);
  }
  
  // Vérifier les transitions
  const transition = computedStyle.transition;
  if (transition.includes('font-size')) {
    console.log('✅ Transitions fluides configurées');
  }
  
  return true;
}

// Fonction pour simuler différentes citations
function simulateQuoteChange() {
  console.log('\n🔄 Simulation de changement de citation...');
  
  // Simuler un clic pour changer la citation
  const homePage = document.querySelector('[role="main"]');
  if (homePage) {
    console.log('🖱️ Simulation d\'un clic pour changer la citation...');
    homePage.click();
    
    // Attendre un peu puis re-tester
    setTimeout(() => {
      console.log('\n📊 Re-test après changement de citation:');
      testAdaptiveQuotes();
    }, 1000);
  }
}

// Fonction pour tester le responsive
function testResponsive() {
  console.log('\n📱 Test du comportement responsive...');
  
  const originalWidth = window.innerWidth;
  console.log(`📐 Largeur actuelle: ${originalWidth}px`);
  
  // Simuler un redimensionnement (ne peut pas vraiment redimensionner la fenêtre)
  window.dispatchEvent(new Event('resize'));
  
  setTimeout(() => {
    testAdaptiveQuotes();
  }, 500);
}

// Exécuter les tests
console.log('🚀 Démarrage des tests...');

// Test initial
if (testAdaptiveQuotes()) {
  // Test de changement de citation
  setTimeout(() => {
    simulateQuoteChange();
  }, 1000);
  
  // Test responsive
  setTimeout(() => {
    testResponsive();
  }, 3000);
}

console.log('\n📋 Instructions pour test manuel:');
console.log('1. Vérifiez que les citations s\'affichent sans coupure');
console.log('2. Cliquez sur la page pour changer de citation');
console.log('3. Redimensionnez la fenêtre pour tester le responsive');
console.log('4. Vérifiez que les transitions sont fluides');

console.log('\n✨ Si tout fonctionne, le problème de coupure des citations est résolu !');