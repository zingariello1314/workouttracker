/**
 * Test diagnostic des APIs financières
 */

import { hasApiKey, getApiKey } from './src/config/apiKeys.js';

console.log('=== DIAGNOSTIC API KEYS ===');
console.log('Alpha Vantage:', hasApiKey('ALPHA_VANTAGE') ? 'CONFIGURÉ' : 'MANQUANT');
console.log('Finnhub:', hasApiKey('FINNHUB') ? 'CONFIGURÉ' : 'MANQUANT');
console.log('Polygon:', hasApiKey('POLYGON') ? 'CONFIGURÉ' : 'MANQUANT');

// Test Alpha Vantage
if (hasApiKey('ALPHA_VANTAGE')) {
  console.log('\n=== TEST ALPHA VANTAGE ===');
  const apiKey = getApiKey('ALPHA_VANTAGE');
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NVDA&apikey=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log('Réponse Alpha Vantage:', JSON.stringify(data, null, 2));
    
    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      console.log('✅ Alpha Vantage fonctionne - Prix NVDA:', data['Global Quote']['05. price']);
    } else {
      console.log('❌ Alpha Vantage - Réponse invalide');
    }
  } catch (error) {
    console.error('❌ Erreur Alpha Vantage:', error.message);
  }
}

// Test du service Yahoo Finance
console.log('\n=== TEST SERVICE YAHOO FINANCE ===');
try {
  const { yahooFinanceService } = await import('./src/services/finance/yahooFinanceService.js');
  
  console.log('Service Yahoo Finance importé avec succès');
  
  // Test avec NVDA
  const quoteData = await yahooFinanceService.getQuoteData('NVDA');
  console.log('✅ Données NVDA récupérées:', JSON.stringify(quoteData, null, 2));
  
} catch (error) {
  console.error('❌ Erreur service Yahoo Finance:', error.message);
  console.error('Stack:', error.stack);
}