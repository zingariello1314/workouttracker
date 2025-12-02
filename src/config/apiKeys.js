/**
 * Configuration des clés API pour l'onglet Finance
 * 
 * Les clés sont chargées depuis les variables d'environnement
 * Ne jamais commiter les vraies clés dans le code !
 * 
 * Les clés sont stockées dans le fichier .env à la racine du projet
 */

const API_KEYS = {
  // Alpha Vantage - Bourse et Indices (PRIORITÉ HAUTE)
  ALPHA_VANTAGE: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || null,
  
  // Finnhub - Alternative Bourse (données financières)
  FINNHUB: import.meta.env.VITE_FINNHUB_API_KEY || null,
  
  // Polygon.io - Données boursières historiques
  POLYGON: import.meta.env.VITE_POLYGON_API_KEY || null,
  
  // Fixer.io - Taux de change et métaux précieux
  FIXER: import.meta.env.VITE_FIXER_API_KEY || null,
  
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
  return API_KEYS[keyName];
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

