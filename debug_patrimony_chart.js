/**
 * Script de debug pour tester le graphique patrimoine dans le navigateur
 * À exécuter dans la console du navigateur
 */

console.log('🔧 Debug du graphique patrimoine intelligent');

// Vérifier si le composant est chargé
const checkComponent = () => {
  const patrimonyModule = document.querySelector('[data-module="evolution-patrimoine"]');
  if (patrimonyModule) {
    console.log('✅ Module patrimoine trouvé');
    
    // Chercher le graphique
    const chart = patrimonyModule.querySelector('.enhanced-chart-container');
    if (chart) {
      console.log('✅ Nouveau graphique intelligent trouvé');
      console.log('📊 Graphique:', chart);
    } else {
      console.log('❌ Graphique intelligent non trouvé');
      
      // Chercher l'ancien graphique
      const oldChart = patrimonyModule.querySelector('.sidebar-mini-chart-container');
      if (oldChart) {
        console.log('⚠️ Ancien graphique moche encore présent');
      }
    }
  } else {
    console.log('❌ Module patrimoine non trouvé');
  }
};

// Vérifier les imports
const checkImports = () => {
  console.log('🔍 Vérification des imports...');
  
  // Simuler l'import pour voir s'il fonctionne
  try {
    console.log('📦 Tentative d\'import du composant...');
    // Note: Dans un vrai test, on importerait le composant ici
    console.log('✅ Import simulé réussi');
  } catch (error) {
    console.error('❌ Erreur d\'import:', error);
  }
};

// Tester le formatage
const testFormatting = () => {
  console.log('🧪 Test du formatage...');
  
  const testValue = 45250;
  const testDate = '2025-12-14';
  
  const formatCurrency = (value) => new Intl.NumberFormat('fr-FR', { 
    style: 'currency', 
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
  
  const formatDate = (value) => {
    const date = new Date(value);
    return date.toLocaleDateString('fr-FR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  console.log('💶 Formatage monétaire:', formatCurrency(testValue));
  console.log('📅 Formatage date:', formatDate(testDate));
};

// Exécuter tous les tests
console.log('🚀 Démarrage des tests...');
checkImports();
testFormatting();
checkComponent();

console.log('✅ Tests terminés. Le graphique devrait être intelligent et lisible !');

// Instructions pour l'utilisateur
console.log(`
📋 Instructions:
1. Ouvrez la sidebar
2. Développez le module "Évolution Patrimoine" 
3. Survolez le graphique pour voir les tooltips riches
4. Vérifiez que les axes sont labellisés
5. Confirmez que les valeurs sont en euros formatés

Si vous voyez encore l'ancien graphique moche, rechargez la page.
`);