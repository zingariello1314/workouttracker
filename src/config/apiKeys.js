/**
 * Configuration des clés API pour l'onglet Finance
 * 
 * Les clés sont chargées depuis les variables d'environnement
 * Ne jamais commiter les vraies clés dans le code !
 * 
 * Les clés sont stockées dans le fichier .env à la racine du projet
 */

// 🔍 DIAGNOSTIC : Vérifier les variables d'environnement au chargement du module
const envDiagnostics = {
  hasEnv: typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined',
  golpricez: import.meta.env?.VITE_GOLDPRICEZ_API_KEY,
  goldApi: import.meta.env?.VITE_GOLD_API_KEY,
  allEnvKeys: typeof import.meta.env !== 'undefined' ? Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')) : []
};

// 🔍 DIAGNOSTIC : Vérifier les variables d'environnement au chargement (une seule fois)
// Logs réduits - visible uniquement si clés absentes
if (!envDiagnostics.golpricez || !envDiagnostics.goldApi) {
  console.warn('%c⚠️ ATTENTION: Les clés API or ne sont PAS chargées !', 'color: #ff9900; font-weight: bold;');
  console.warn('💡 SOLUTION: Vérifiez que le fichier .env existe et redémarrez le serveur avec: npm run dev');
  console.log('📋 Variables présentes:', envDiagnostics.allEnvKeys.length > 0 ? envDiagnostics.allEnvKeys : 'AUCUNE');
}

const API_KEYS = {
  // Alpha Vantage - Bourse et Indices (PRIORITÉ HAUTE)
  ALPHA_VANTAGE: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || null,
  
  // Finnhub - Alternative Bourse (données financières)
  FINNHUB: import.meta.env.VITE_FINNHUB_API_KEY || null,
  
  // Polygon.io - Données boursières historiques
  POLYGON: import.meta.env.VITE_POLYGON_API_KEY || null,
  
  // Fixer.io - Taux de change et métaux précieux
  FIXER: import.meta.env.VITE_FIXER_API_KEY || null,
  
  // Metals API - Métaux précieux (optionnel)
  METALS_API: import.meta.env.VITE_METALS_API_KEY || null,
  
  // GoldPriceZ - Prix de l'or (gratuit, 30-60 req/heure)
  GOLDPRICEZ: import.meta.env.VITE_GOLDPRICEZ_API_KEY || null,
  
  // Gold-API.com - Prix de l'or (gratuit)
  GOLD_API: import.meta.env.VITE_GOLD_API_KEY || null,
  
  // CoinGecko - Cryptomonnaies
  COINGECKO: import.meta.env.VITE_COINGECKO_API_KEY || null,
  
  // CoinCap - Cryptomonnaies (alternative)
  COINCAP: import.meta.env.VITE_COINCAP_API_KEY || null,
};

/**
 * Vérifie si une clé API est disponible
 */
export const hasApiKey = (keyName) => {
  return API_KEYS[keyName] !== null && API_KEYS[keyName] !== undefined;
};

/**
 * Récupère une clé API
 */
export const getApiKey = (keyName) => {
  const key = API_KEYS[keyName];
  // Logs de diagnostic supprimés (visible uniquement dans le diagnostic initial au chargement)
  return key;
};

/**
 * Vérifie toutes les clés API nécessaires
 */
export const checkApiKeys = () => {
  const missing = [];
  const optional = [];
  
  // Clés essentielles
  if (!hasApiKey('ALPHA_VANTAGE')) {
    missing.push('ALPHA_VANTAGE');
  }
  
  // Clés optionnelles mais recommandées
  if (!hasApiKey('COINGECKO') && !hasApiKey('COINCAP')) {
    optional.push('COINGECKO ou COINCAP (au moins une pour crypto)');
  }
  
  if (!hasApiKey('FIXER')) {
    optional.push('FIXER (pour prix or)');
  }
  
  return {
    allPresent: missing.length === 0,
    missing,
    optional,
  };
};

export default API_KEYS;

