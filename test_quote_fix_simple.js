/**
 * Test simple pour vérifier le fix des citations adaptatives
 * À exécuter dans la console du navigateur sur la page d'accueil
 */

console.log('🔧 Test du fix des citations adaptatives (version CSS)');

function testQuoteFix() {
  console.log('\n📋 Vérification de l\'implémentation...');
  
  // Vérifier que l'élément avec la classe adaptive-quote-text existe
  const quoteElement = document.querySelector('.adaptive-quote-text');
  
  if (!quoteElement) {
    console.error('❌ Élément .adaptive-quote-text non trouvé');
    return false;
  }
  
  console.log('✅ Élément .adaptive-quote-text trouvé');
  
  // Vérifier les styles CSS
  const computedStyle = window.getComputedStyle(quoteElement);
  const fontSize = parseFloat(computedStyle.fontSize);
  const maxWidth = computedStyle.maxWidth;
  
  console.log(`📏 Taille de police actuelle: ${fontSize}px`);
  console.log(`📐 Largeur maximale: ${maxWidth}`);
  
  // Vérifier le contenu
  const textContent = quoteElement.textContent || '';
  const textLength = textContent.length;
  
  console.log(`📝 Contenu: "${textContent.substring(0, 50)}..."`);
  console.log(`📏 Longueur du texte: ${textLength} caractères`);
  
  // Vérifier que le texte ne déborde pas
  const elementWidth = quoteElement.offsetWidth;
  const scrollWidth = quoteElement.scrollWidth;
  
  console.log(`📐 Largeur élément: ${elementWidth}px`);
  console.log(`📐 Largeur contenu: ${scrollWidth}px`);
  
  if (scrollWidth <= elementWidth + 5) { // 5px de tolérance
    console.log('✅ Texte s\'affiche complètement sans débordement');
  } else {
    console.warn(`⚠️ Texte déborde: ${scrollWidth - elementWidth}px de trop`);
  }
  
  // Tester l'ajustement selon la longueur
  let expectedSize;
  if (textLength > 120) {
    expectedSize = 'très petite (< 32px)';
  } else if (textLength > 80) {
    expectedSize = 'petite (32-40px)';
  } else if (textLength > 50) {
    expectedSize = 'moyenne (40-56px)';
  } else {
    expectedSize = 'grande (56-80px)';
  }
  
  console.log(`🎯 Taille attendue pour ${textLength} caractères: ${expectedSize}`);
  console.log(`📊 Taille actuelle: ${fontSize}px`);
  
  // Vérifier les attributs data
  const isLong = quoteElement.hasAttribute('data-long');
  const isVeryLong = quoteElement.hasAttribute('data-very-long');
  
  if (isVeryLong) {
    console.log('🏷️ Citation marquée comme très longue');
  } else if (isLong) {
    console.log('🏷️ Citation marquée comme longue');
  } else {
    console.log('🏷️ Citation de taille normale');
  }
  
  return true;
}

// Fonction pour simuler différentes longueurs de citations
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
      testQuoteFix();
    }, 1000);
  }
}

// Fonction pour tester le responsive
function testResponsive() {
  console.log('\n📱 Test du comportement responsive...');
  
  const quoteElement = document.querySelector('.adaptive-quote-text');
  if (!quoteElement) return;
  
  const originalWidth = window.innerWidth;
  console.log(`📐 Largeur actuelle: ${originalWidth}px`);
  
  // Simuler un redimensionnement
  window.dispatchEvent(new Event('resize'));
  
  setTimeout(() => {
    testQuoteFix();
  }, 500);
}

// Exécuter les tests
console.log('🚀 Démarrage des tests...');

if (testQuoteFix()) {
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
console.log('4. Vérifiez que les tailles s\'ajustent selon la longueur');

console.log('\n✨ La solution CSS devrait maintenant fonctionner !');

// Auto-exécution du test
testQuoteFix();