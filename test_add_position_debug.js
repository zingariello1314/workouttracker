/**
 * Test debug pour l'ajout de positions
 */

// Simuler l'environnement Vite
global.import = {
  meta: {
    env: {
      VITE_ALPHA_VANTAGE_API_KEY: 'A8QSTFQ5LNJDKTH1',
      VITE_FINNHUB_API_KEY: 'd50533pr01qsabpr787gd50533pr01qsabpr7880',
      VITE_POLYGON_API_KEY: 'SWHS9DVcIGtH5pBVZgR1K5Ckr_SMD18A'
    }
  }
};

// Simuler crypto.randomUUID si nécessaire
if (!global.crypto) {
  global.crypto = {};
}
if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = () => 'test-uuid-' + Date.now();
}

console.log('=== TEST AJOUT POSITION ===');

async function testAddPosition() {
  try {
    // Importer les modules nécessaires
    const { yahooFinanceService } = await import('./src/services/finance/yahooFinanceService.js');
    const { calculateBatchMetrics } = await import('./src/services/finance/financeCalculations.js');
    
    console.log('✅ Modules importés avec succès');
    
    // Test position
    const newPosition = {
      ticker: 'NVDA',
      entreprise: 'NVIDIA Corporation',
      quantite: 10,
      prixEntree: 175.50,
      dateAchat: '2025-12-15'
    };
    
    console.log('📝 Position à ajouter:', newPosition);
    
    // Normalisation (comme dans useFinance)
    const normalized = {
      ...newPosition,
      ticker: newPosition.ticker.toUpperCase().trim(),
      id: crypto.randomUUID(),
      dateAchat: newPosition.dateAchat || new Date().toISOString().split('T')[0],
      investissementTotal: newPosition.quantite * newPosition.prixEntree
    };
    
    console.log('🔄 Position normalisée:', normalized);
    
    // Test récupération données Yahoo
    console.log('🌐 Récupération données Yahoo...');
    try {
      const yahooData = await yahooFinanceService.getQuoteData(normalized.ticker);
      console.log('✅ Données Yahoo récupérées:', yahooData);
      
      normalized.yahooData = {
        ...yahooData,
        ma20: yahooData.prixActuel * 0.98,
        ma50: yahooData.prixActuel * 0.95,
        ma200: yahooData.prixActuel * 0.90
      };
      
      console.log('📊 Données Yahoo enrichies:', normalized.yahooData);
    } catch (err) {
      console.warn('⚠️ Yahoo data unavailable, using defaults:', err.message);
      normalized.yahooData = { 
        prixActuel: normalized.prixEntree,
        variationJour: 0
      };
    }
    
    // Test calculs
    console.log('🧮 Calcul des métriques...');
    const portfolio = []; // Portfolio vide pour le test
    const withCalculations = calculateBatchMetrics([...portfolio, normalized]);
    const updated = withCalculations[withCalculations.length - 1];
    
    console.log('✅ Position finale:', JSON.stringify(updated, null, 2));
    
    // Test sauvegarde (simulation)
    console.log('💾 Simulation sauvegarde...');
    const newPortfolio = [...portfolio, updated];
    console.log('📋 Nouveau portfolio:', newPortfolio.length, 'positions');
    
    console.log('\n🎉 Test d\'ajout de position réussi !');
    return updated;
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

testAddPosition().catch(console.error);