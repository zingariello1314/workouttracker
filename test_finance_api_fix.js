/**
 * Test de connectivité des APIs Finance pour NVDA
 * Vérifie que les clés API fonctionnent correctement
 */

// Test direct des APIs sans passer par le service
async function testAlphaVantage() {
  console.log('🔍 Test Alpha Vantage...');
  try {
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NVDA&apikey=A8QSTFQ5LNJDKTH1`);
    const data = await response.json();
    
    if (data['Error Message']) {
      console.log('❌ Alpha Vantage Error:', data['Error Message']);
      return false;
    }
    
    if (data['Note']) {
      console.log('⚠️ Alpha Vantage Rate Limit:', data['Note']);
      return false;
    }
    
    const quote = data['Global Quote'];
    if (quote && quote['05. price']) {
      console.log('✅ Alpha Vantage OK - NVDA Prix:', quote['05. price']);
      return true;
    } else {
      console.log('❌ Alpha Vantage - Pas de données:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Alpha Vantage Exception:', error.message);
    return false;
  }
}

async function testFinnhub() {
  console.log('🔍 Test Finnhub...');
  try {
    const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=NVDA&token=d50533pr01qsabpr787gd50533pr01qsabpr7880`);
    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Finnhub Error:', data.error);
      return false;
    }
    
    if (data.c) {
      console.log('✅ Finnhub OK - NVDA Prix:', data.c);
      return true;
    } else {
      console.log('❌ Finnhub - Pas de données:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Finnhub Exception:', error.message);
    return false;
  }
}

async function testPolygon() {
  console.log('🔍 Test Polygon...');
  try {
    const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/NVDA/prev?adjusted=true&apikey=SWHS9DVcIGtH5pBVZgR1K5Ckr_SMD18A`);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      console.log('❌ Polygon Error:', data.status);
      return false;
    }
    
    if (data.results && data.results[0] && data.results[0].c) {
      console.log('✅ Polygon OK - NVDA Prix:', data.results[0].c);
      return true;
    } else {
      console.log('❌ Polygon - Pas de données:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Polygon Exception:', error.message);
    return false;
  }
}

async function testAllAPIs() {
  console.log('🚀 Test des APIs Finance pour NVDA\n');
  
  const results = {
    alphaVantage: await testAlphaVantage(),
    finnhub: await testFinnhub(),
    polygon: await testPolygon()
  };
  
  console.log('\n📊 Résultats:');
  console.log('Alpha Vantage:', results.alphaVantage ? '✅' : '❌');
  console.log('Finnhub:', results.finnhub ? '✅' : '❌');
  console.log('Polygon:', results.polygon ? '✅' : '❌');
  
  const workingAPIs = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 ${workingAPIs}/3 APIs fonctionnelles`);
  
  if (workingAPIs > 0) {
    console.log('✅ Votre portefeuille devrait maintenant fonctionner !');
  } else {
    console.log('❌ Aucune API ne fonctionne - vérifiez vos clés');
  }
  
  return results;
}

// Exécuter le test
testAllAPIs().catch(console.error);