/**
 * Service pour récupérer les données de marché (indices, commodities, crypto)
 * 
 * Gère intelligemment les quotas et utilise le cache pour éviter les appels inutiles
 * 
 * @module services/finance/marketDataService
 */

import { financeQuotaManager } from './financeQuotaManager';
import { financeStorage } from './financeStorage';
import { yahooFinanceService } from './yahooFinanceService';
import { getApiKey, hasApiKey } from '../../config/apiKeys';
import logger from '../../utils/logger';

const log = logger.module('marketDataService');

/**
 * Normalise la variation (peut être un nombre ou une chaîne)
 */
const normalizeVariation = (variation) => {
  if (variation === null || variation === undefined) return '0.0%';
  
  if (typeof variation === 'string') {
    return variation.includes('%') ? variation : `${variation}%`;
  }
  
  if (typeof variation === 'number') {
    const sign = variation >= 0 ? '+' : '';
    return `${sign}${variation.toFixed(2)}%`;
  }
  
  return '0.0%';
};

/**
 * Tickers des indices boursiers majeurs
 */
const MARKET_INDICES = {
  CAC40: '^FCHI',
  SP500: '^GSPC',
  NASDAQ: '^IXIC',
  DOWJONES: '^DJI'
};

/**
 * Tickers des matières premières
 */
const COMMODITIES = {
  GOLD: 'GC=F',      // Gold Futures
  OIL: 'CL=F',       // Crude Oil Futures
  SILVER: 'SI=F'     // Silver Futures
};

/**
 * IDs des cryptomonnaies pour CoinGecko/CoinCap
 */
const CRYPTO_IDS = {
  BTC: { coingecko: 'bitcoin', coincap: 'bitcoin' },
  ETH: { coingecko: 'ethereum', coincap: 'ethereum' },
  SOL: { coingecko: 'solana', coincap: 'solana' }
};

/**
 * Récupère les données d'un indice boursier
 */
export const getMarketIndex = async (indexName) => {
  const ticker = MARKET_INDICES[indexName];
  if (!ticker) {
    throw new Error(`Unknown market index: ${indexName}`);
  }
  
  const cacheKey = `market_index_${indexName}`;
  const ttl = financeQuotaManager.getCacheTTL('MARKET_INDICES');
  
  // Vérifier cache
  const cached = await financeStorage.getYahooCache(cacheKey, { ttl, allowStale: false });
  if (cached) {
    // getYahooCache retourne déjà cached.data directement
    return cached;
  }
  
  // Utiliser yahooFinanceService directement (gère déjà Alpha Vantage, Finnhub, Polygon)
  try {
    const data = await yahooFinanceService.getQuoteData(ticker, { forceRefresh: false });
    
    // Vérifier que les données sont valides
    if (!data || !data.prixActuel || data.prixActuel <= 0) {
      if (log.debug) {
        log.debug(`Invalid data for market index ${indexName} (${ticker}):`, data);
      }
      return null;
    }
    
    // Formater pour SurveillanceBlock
    const formatted = {
      name: indexName,
      value: data.prixActuel.toFixed(2),
      change: normalizeVariation(data.variationJour),
      trend: (typeof data.variationJour === 'number' ? data.variationJour >= 0 : 
              (typeof data.variationJour === 'string' && !data.variationJour.startsWith('-'))) ? 'up' : 'down'
    };
    
    // Mettre en cache
    await financeStorage.setYahooCache(cacheKey, formatted);
    
    if (log.debug) {
      log.debug(`Successfully fetched market index ${indexName}:`, formatted);
    }
    
    return formatted;
  } catch (error) {
    // Logger l'erreur pour diagnostic
    log.warn(`Failed to fetch market index ${indexName} (${ticker}):`, error.message);
    return null;
  }
};

/**
 * Récupère tous les indices boursiers majeurs
 */
export const getAllMarketIndices = async () => {
  const indices = ['CAC40', 'SP500', 'NASDAQ', 'DOWJONES'];
  
  // Vérifier quelles APIs sont disponibles
  const availableApis = {
    alphaVantage: hasApiKey('ALPHA_VANTAGE'),
    finnhub: hasApiKey('FINNHUB'),
    polygon: hasApiKey('POLYGON')
  };
  
  if (log.debug) {
    log.debug('Available APIs for market indices:', availableApis);
  }
  
  // Récupérer en parallèle mais avec gestion de quota
  // Limiter à 2-3 requêtes simultanées pour éviter surcharge
  const results = await Promise.allSettled(
    indices.map(index => getMarketIndex(index).catch(err => {
      if (log.debug) {
        log.debug(`Failed to fetch index ${index}:`, err.message);
      }
      return null;
    }))
  );
  
  const fetched = results
    .map((result) => {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
      return null;
    })
    .filter(Boolean);
  
  // Si aucune donnée récupérée, retourner données mock pour éviter affichage vide
  if (fetched.length === 0) {
    // Ne pas logger en warn pour éviter spam - utiliser debug
    if (log.debug) {
      log.debug('No indices data fetched, using fallback mock data');
    }
    return indices.map(name => ({
      name,
      value: '0.00',
      change: '0.0%',
      trend: 'up'
    }));
  }
  
  return fetched;
};

/**
 * Récupère les données d'une matière première
 */
export const getCommodity = async (commodityName) => {
  const ticker = COMMODITIES[commodityName];
  if (!ticker) {
    throw new Error(`Unknown commodity: ${commodityName}`);
  }
  
  const cacheKey = `commodity_${commodityName}`;
  const ttl = financeQuotaManager.getCacheTTL('COMMODITIES');
  
  // Vérifier cache
  const cached = await financeStorage.getYahooCache(cacheKey, { ttl, allowStale: false });
  if (cached) {
    // getYahooCache retourne déjà cached.data directement
    return cached;
  }
  
  // Utiliser Yahoo Finance directement (plus fiable pour commodities)
  try {
    const data = await yahooFinanceService.getQuoteData(ticker, { forceRefresh: false });
    
    // Vérifier que les données sont valides
    if (!data || !data.prixActuel || data.prixActuel <= 0) {
      if (log.debug) {
        log.debug(`Invalid data for commodity ${commodityName} (${ticker}):`, data);
      }
      return null;
    }
    
    const formatted = {
      name: commodityName,
      value: `${data.prixActuel.toFixed(2)} $`,
      change: normalizeVariation(data.variationJour),
      trend: (typeof data.variationJour === 'number' ? data.variationJour >= 0 : 
              (typeof data.variationJour === 'string' && !data.variationJour.startsWith('-'))) ? 'up' : 'down',
      type: 'commodity'
    };
    
    await financeStorage.setYahooCache(cacheKey, formatted);
    
    if (log.debug) {
      log.debug(`Successfully fetched commodity ${commodityName}:`, formatted);
    }
    
    return formatted;
  } catch (error) {
    // Logger l'erreur pour diagnostic
    log.warn(`Failed to fetch commodity ${commodityName} (${ticker}):`, error.message);
    return null;
  }
};

/**
 * Récupère les données d'une cryptomonnaie
 */
export const getCrypto = async (cryptoSymbol) => {
  const cryptoId = CRYPTO_IDS[cryptoSymbol];
  if (!cryptoId) {
    throw new Error(`Unknown crypto: ${cryptoSymbol}`);
  }
  
  const cacheKey = `crypto_${cryptoSymbol}`;
  const ttl = financeQuotaManager.getCacheTTL('CRYPTO');
  
  // Vérifier cache
  const cached = await financeStorage.getYahooCache(cacheKey, { ttl, allowStale: false });
  if (cached) {
    // getYahooCache retourne déjà cached.data directement
    return cached;
  }
  
  // Utiliser Yahoo Finance directement comme source principale pour crypto
  // CoinCap a des problèmes réseau (ERR_NAME_NOT_RESOLVED) - désactivé temporairement
  // Yahoo Finance fonctionne bien pour BTC-USD, ETH-USD
  try {
    const ticker = `${cryptoSymbol}-USD`;
    const yahooData = await yahooFinanceService.getQuoteData(ticker, { forceRefresh: false });
    
    // Vérifier que les données sont valides
    if (!yahooData || !yahooData.prixActuel || yahooData.prixActuel <= 0) {
      if (log.debug) {
        log.debug(`Invalid data for crypto ${cryptoSymbol} (${ticker}):`, yahooData);
      }
      // Essayer CoinCap en fallback
      try {
        const data = await fetchCoinCap(cryptoId.coincap);
        if (data && data.price > 0) {
          const formatted = {
            name: cryptoSymbol,
            value: `${data.price.toFixed(2)} $`,
            change: typeof data.change24h === 'number' 
              ? `${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%`
              : (data.change24h || '0.0%'),
            trend: (typeof data.change24h === 'number' ? data.change24h >= 0 : 
                    (typeof data.change24h === 'string' && !data.change24h.startsWith('-'))) ? 'up' : 'down',
            type: 'crypto'
          };
          await financeStorage.setYahooCache(cacheKey, formatted);
          return formatted;
        }
      } catch (coinCapError) {
        // Ignorer erreur CoinCap
      }
      return null;
    }
    
    const formatted = {
      name: cryptoSymbol,
      value: `${yahooData.prixActuel.toFixed(2)} $`,
      change: normalizeVariation(yahooData.variationJour),
      trend: (typeof yahooData.variationJour === 'number' ? yahooData.variationJour >= 0 : 
              (typeof yahooData.variationJour === 'string' && !yahooData.variationJour.startsWith('-'))) ? 'up' : 'down',
      type: 'crypto'
    };
    
    await financeStorage.setYahooCache(cacheKey, formatted);
    
    if (log.debug) {
      log.debug(`Successfully fetched crypto ${cryptoSymbol}:`, formatted);
    }
    
    return formatted;
  } catch (error) {
    // Logger l'erreur pour diagnostic
    log.warn(`Failed to fetch crypto ${cryptoSymbol}:`, error.message);
    
    // Essayer CoinCap en dernier recours
    try {
      const data = await fetchCoinCap(cryptoId.coincap);
      if (data && data.price > 0) {
        const formatted = {
          name: cryptoSymbol,
          value: `${data.price.toFixed(2)} $`,
          change: typeof data.change24h === 'number' 
            ? `${data.change24h >= 0 ? '+' : ''}${data.change24h.toFixed(2)}%`
            : (data.change24h || '0.0%'),
          trend: (typeof data.change24h === 'number' ? data.change24h >= 0 : 
                  (typeof data.change24h === 'string' && !data.change24h.startsWith('-'))) ? 'up' : 'down',
          type: 'crypto'
        };
        await financeStorage.setYahooCache(cacheKey, formatted);
        return formatted;
      }
    } catch (coinCapError) {
      // Ignorer erreur CoinCap
    }
    
    return null;
  }
};

/**
 * Fetch depuis CoinCap API
 * Note: CoinCap peut avoir des problèmes réseau (ERR_NAME_NOT_RESOLVED)
 * Utilisé uniquement en fallback si Yahoo Finance échoue
 */
async function fetchCoinCap(cryptoId) {
  try {
    const response = await fetch(`https://api.coincap.io/v2/assets/${cryptoId}`, {
      signal: AbortSignal.timeout(5000) // Timeout 5s
    });
    
    if (!response.ok) {
      throw new Error(`CoinCap API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.data) {
      throw new Error('CoinCap API: No data in response');
    }
    
    return {
      price: parseFloat(data.data?.priceUsd || 0),
      change24h: parseFloat(data.data?.changePercent24Hr || 0)
    };
  } catch (error) {
    // Si erreur réseau, ne pas logger en error (éviter spam)
    if (error.name === 'AbortError' || error.message.includes('ERR_NAME_NOT_RESOLVED')) {
      throw new Error('CoinCap network error');
    }
    throw error;
  }
}

/**
 * Fetch depuis CoinGecko API
 */
async function fetchCoinGecko(cryptoId) {
  const apiKey = getApiKey('COINGECKO');
  const url = apiKey 
    ? `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true&x_cg_demo_api_key=${apiKey}`
    : `https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=usd&include_24hr_change=true`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }
  const data = await response.json();
  const cryptoData = data[cryptoId];
  
  return {
    price: cryptoData?.usd || 0,
    change24h: cryptoData?.usd_24h_change || 0
  };
}

/**
 * Récupère toutes les commodities et cryptos populaires
 */
export const getCommoditiesAndCrypto = async () => {
  const commodities = ['GOLD', 'OIL'];
  const cryptos = ['BTC', 'ETH'];
  
  // Vérifier quelles APIs sont disponibles
  const availableApis = {
    alphaVantage: hasApiKey('ALPHA_VANTAGE'),
    finnhub: hasApiKey('FINNHUB'),
    polygon: hasApiKey('POLYGON'),
    coingecko: hasApiKey('COINGECKO'),
    coincap: hasApiKey('COINCAP')
  };
  
  if (log.debug) {
    log.debug('Available APIs for commodities/crypto:', availableApis);
  }
  
  // Récupérer en parallèle avec gestion de quota
  // Limiter les appels simultanés pour éviter surcharge
  const results = await Promise.allSettled([
    ...commodities.map(c => getCommodity(c).catch(err => {
      if (log.debug) {
        log.debug(`Failed to fetch commodity ${c}:`, err.message);
      }
      return null;
    })),
    ...cryptos.map(c => getCrypto(c).catch(err => {
      if (log.debug) {
        log.debug(`Failed to fetch crypto ${c}:`, err.message);
      }
      return null;
    }))
  ]);
  
  const fetched = results
    .map((result) => {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
      return null;
    })
    .filter(Boolean);
  
  // Si aucune donnée récupérée, retourner données mock pour éviter affichage vide
  if (fetched.length === 0) {
    // Ne pas logger en warn pour éviter spam - utiliser debug
    if (log.debug) {
      log.debug('No market data fetched, using fallback mock data');
    }
    return [
      { name: 'GOLD', value: '2,045.30 $', change: '+0.5%', trend: 'up', type: 'commodity' },
      { name: 'OIL', value: '78.45 $', change: '-1.2%', trend: 'down', type: 'commodity' },
      { name: 'BTC', value: '43,250 $', change: '+3.2%', trend: 'up', type: 'crypto' },
      { name: 'ETH', value: '2,285 $', change: '+2.8%', trend: 'up', type: 'crypto' }
    ];
  }
  
  return fetched;
};
