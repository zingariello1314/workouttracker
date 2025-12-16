/**
 * Test simple des APIs financières
 */

// Simuler les variables d'environnement
const API_KEYS = {
  ALPHA_VANTAGE: 'A8QSTFQ5LNJDKTH1',
  FINNHUB: 'd50533pr01qsabpr787gd50533pr01qsabpr7880',
  POLYGON: 'SWHS9DVcIGtH5pBVZgR1K5Ckr_SMD18A'
};

console.log('=== TEST DIRECT DES APIs ===');

// Test Alpha Vantage
async function testAlphaVantage() {
  console.log('\n🔍 Test Alpha Vantage...');
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NVDA&apikey=${API_KEYS.ALPHA_VANTAGE}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Réponse Alpha Vantage:', JSON.stringify(data, null, 2));
    
    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      console.log('✅ Alpha Vantage OK - Prix NVDA:', data['Global Quote']['05. price']);
      return true;
    } else if (data['Error Message']) {
      console.log('❌ Alpha Vantage Erreur:', data['Error Message']);
      return false;
    } else if (data['Note']) {
      console.log('⚠️ Alpha Vantage Rate Limit:', data['Note']);
      return false;
    } else {
      console.log('❌ Alpha Vantage - Réponse inattendue');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur réseau Alpha Vantage:', error.message);
    return false;
  }
}

// Test Finnhub
async function testFinnhub() {
  console.log('\n🔍 Test Finnhub...');
  const url = `https://finnhub.io/api/v1/quote?symbol=NVDA&token=${API_KEYS.FINNHUB}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Réponse Finnhub:', JSON.stringify(data, null, 2));
    
    if (data.c && data.c > 0) {
      console.log('✅ Finnhub OK - Prix NVDA:', data.c);
      return true;
    } else if (data.error) {
      console.log('❌ Finnhub Erreur:', data.error);
      return false;
    } else {
      console.log('❌ Finnhub - Réponse invalide');
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur réseau Finnhub:', error.message);
    return false;
  }
}

// Test Polygon
async function testPolygon() {
  console.log('\n🔍 Test Polygon...');
  const url = `https://api.polygon.io/v2/aggs/ticker/NVDA/prev?adjusted=true&apikey=${API_KEYS.POLYGON}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Réponse Polygon:', JSON.stringify(data, null, 2));
    
    if (data.status === 'OK' && data.results && data.results[0]) {
      console.log('✅ Polygon OK - Prix NVDA:', data.results[0].c);
      return true;
    } else {
      console.log('❌ Polygon - Status:', data.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur réseau Polygon:', error.message);
    return false;
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Début des tests API...\n');
  
  const results = {
    alphaVantage: await testAlphaVantage(),
    finnhub: await testFinnhub(),
    polygon: await testPolygon()
  };
  
  console.log('\n=== RÉSULTATS ===');
  console.log('Alpha Vantage:', results.alphaVantage ? '✅ OK' : '❌ ÉCHEC');
  console.log('Finnhub:', results.finnhub ? '✅ OK' : '❌ ÉCHEC');
  console.log('Polygon:', results.polygon ? '✅ OK' : '❌ ÉCHEC');
  
  const workingApis = Object.values(results).filter(Boolean).length;
  console.log(`\n📊 ${workingApis}/3 APIs fonctionnelles`);
  
  if (workingApis === 0) {
    console.log('🚨 AUCUNE API ne fonctionne - Problème critique !');
  } else if (workingApis < 3) {
    console.log('⚠️ Certaines APIs ont des problèmes - Le fallback devrait fonctionner');
  } else {
    console.log('🎉 Toutes les APIs fonctionnent parfaitement !');
  }
}

runAllTests().catch(console.error);