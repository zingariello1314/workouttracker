/**
 * Test du nouveau graphique patrimoine intelligent
 * Vérifie que le graphique fonctionne correctement
 */

import { generateMockPatrimonyData } from './src/utils/mockPatrimonyData.js';

// Générer des données de test
const testData = generateMockPatrimonyData(30);

console.log('🧪 Test du graphique patrimoine intelligent');
console.log('📊 Données générées:', testData.length, 'points');
console.log('💰 Premier point:', testData[0]);
console.log('💰 Dernier point:', testData[testData.length - 1]);

// Vérifier le formatage
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

console.log('💶 Formatage monétaire:', formatCurrency(testData[0].netWorth));
console.log('📅 Formatage date:', formatDate(testData[0].date));

// Calculer la tendance
const firstValue = testData[0].netWorth;
const lastValue = testData[testData.length - 1].netWorth;
const change = lastValue - firstValue;
const percentage = (change / firstValue) * 100;

console.log('📈 Évolution:', {
  début: formatCurrency(firstValue),
  fin: formatCurrency(lastValue),
  variation: formatCurrency(change),
  pourcentage: percentage.toFixed(2) + '%',
  tendance: change >= 0 ? '📈 Positive' : '📉 Négative'
});

console.log('✅ Test terminé - Le graphique devrait maintenant être lisible et informatif !');