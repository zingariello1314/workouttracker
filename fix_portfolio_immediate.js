/**
 * Fix immédiat du problème de portefeuille
 * Force le rechargement des données avec les nouvelles APIs
 */

import { financeStorage } from './src/services/finance/financeStorage.js';

async function fixPortfolioData() {
  console.log('🔧 Correction du portefeuille...');
  
  try {
    // 1. Charger le portefeuille existant
    const portfolio = await financeStorage.loadPortfolio();
    console.log(`📊 ${portfolio.length} positions trouvées`);
    
    // 2. Vider le cache Yahoo pour forcer le refresh
    console.log('🗑️ Nettoyage du cache...');
    await financeStorage.clearYahooCache();
    
    // 3. Afficher les positions qui vont être mises à jour
    portfolio.forEach(pos => {
      console.log(`📈 ${pos.ticker} - Prix d'entrée: ${pos.prixEntree}€`);
    });
    
    console.log('\n✅ Cache nettoyé !');
    console.log('🔄 Redémarrez votre application pour voir les vraies données de marché');
    console.log('💡 Vos positions NVDA et autres afficheront maintenant les prix réels');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

fixPortfolioData();