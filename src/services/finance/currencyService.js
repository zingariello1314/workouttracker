/**
 * currencyService.js
 * 
 * Service de gestion multi-devises pour le module Finance.
 * Gère la détection automatique des devises, la conversion et le formatage.
 * 
 * ✅ PHASE 4 - Étape 4.9 : Système multi-devises
 * 
 * Architecture :
 * - Détection automatique devise depuis ticker
 * - Conversion automatique vers devise de référence (EUR)
 * - Cache des taux de change avec TTL
 * - Support devises majeures (USD, GBP, JPY, CHF, CAD, AUD, etc.)
 * - Formatage selon locale et devise
 * 
 * @module services/finance/currencyService
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Phase 4, Étape 29
 */

import logger from '../../utils/logger';
import { financeStorage } from './financeStorage';

const log = logger.module('currencyService');

// Devise de référence (toutes les valeurs sont converties en cette devise)
const REFERENCE_CURRENCY = 'EUR';

// Cache des taux de change
const exchangeRateCache = new Map();
const EXCHANGE_RATE_CACHE_TTL = 60 * 60 * 1000; // 1 heure

/**
 * Mapping ticker → devise (détection automatique)
 * 
 * Format : { pattern: regex, currency: 'USD' }
 * Patterns sont testés dans l'ordre, premier match gagne
 */
const TICKER_CURRENCY_MAP = [
  // US Markets (NYSE, NASDAQ)
  { pattern: /^[A-Z]{1,5}$/, exchanges: ['NYSE', 'NASDAQ', 'AMEX'], currency: 'USD' },
  
  // Tickers avec suffixe explicite
  { pattern: /\.(US|NYSE|NASDAQ)$/i, currency: 'USD' },
  { pattern: /\.(L|LN|LON)$/i, currency: 'GBP' }, // London Stock Exchange
  { pattern: /\.(TO|TSE)$/i, currency: 'CAD' }, // Toronto Stock Exchange
  { pattern: /\.(ASX|AX)$/i, currency: 'AUD' }, // Australian Stock Exchange
  { pattern: /\.(T|TYO)$/i, currency: 'JPY' }, // Tokyo Stock Exchange
  { pattern: /\.(SW|SWX)$/i, currency: 'CHF' }, // Swiss Exchange
  { pattern: /\.(PA|EPA)$/i, currency: 'EUR' }, // Euronext Paris
  { pattern: /\.(DE|XETR|XETRA)$/i, currency: 'EUR' }, // XETRA
  { pattern: /\.(MI|BIT)$/i, currency: 'EUR' }, // Borsa Italiana
  { pattern: /\.(MC|BME)$/i, currency: 'EUR' }, // Bolsas y Mercados Españoles
  { pattern: /\.(AMS)$/i, currency: 'EUR' }, // Euronext Amsterdam
  { pattern: /\.(BRU)$/i, currency: 'EUR' }, // Euronext Brussels
  { pattern: /\.(LIS)$/i, currency: 'EUR' }, // Euronext Lisbon
  
  // Crypto (si supporté)
  { pattern: /^BTC|ETH|USDT|USDC/i, currency: 'USD' }, // Crypto généralement en USD
  
  // Par défaut : EUR (pour compatibilité)
  { pattern: /.*/, currency: 'EUR' }
];

/**
 * Codes ISO des devises supportées
 */
export const SUPPORTED_CURRENCIES = [
  'EUR', 'USD', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
  'CNY', 'HKD', 'SGD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK'
];

/**
 * Symboles des devises pour affichage
 */
export const CURRENCY_SYMBOLS = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
  CHF: 'CHF',
  CAD: 'C$',
  AUD: 'A$',
  NZD: 'NZ$',
  CNY: '¥',
  HKD: 'HK$',
  SGD: 'S$',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  CZK: 'Kč'
};

/**
 * Détecter la devise d'un ticker
 * 
 * ✅ PHASE 4 - Étape 4.9 : Détection automatique devise
 * 
 * @param {string} ticker - Ticker de l'action (ex: 'AAPL', 'TSLA', 'ASML.AS')
 * @returns {string} Code devise ISO (EUR, USD, GBP, etc.)
 * 
 * @example
 * detectCurrency('AAPL'); // Retourne: 'USD'
 * detectCurrency('ASML.AS'); // Retourne: 'EUR'
 * detectCurrency('TSLA'); // Retourne: 'USD'
 */
export function detectCurrency(ticker) {
  if (!ticker || typeof ticker !== 'string') {
    return REFERENCE_CURRENCY; // Par défaut EUR
  }

  const upperTicker = ticker.toUpperCase();

  // Tester chaque pattern dans l'ordre
  for (const mapping of TICKER_CURRENCY_MAP) {
    if (mapping.pattern.test(upperTicker)) {
      // Vérifier si exchanges spécifiés (pour patterns génériques)
      if (mapping.exchanges) {
        // Pour l'instant, on assume que les tickers US sont sur NYSE/NASDAQ
        // On pourrait améliorer avec une API de détection d'exchange
        if (upperTicker.length <= 5 && /^[A-Z]+$/.test(upperTicker)) {
          return mapping.currency;
        }
      } else {
        return mapping.currency;
      }
    }
  }

  // Par défaut : EUR
  return REFERENCE_CURRENCY;
}

/**
 * Obtenir taux de change depuis API ou cache
 * 
 * ✅ PHASE 4 - Étape 4.9 : Cache taux de change avec TTL
 * 
 * @param {string} fromCurrency - Devise source (ex: 'USD')
 * @param {string} toCurrency - Devise cible (ex: 'EUR')
 * @param {boolean} [useCache=true] - Utiliser cache si disponible
 * @returns {Promise<number>} Taux de change (1 fromCurrency = X toCurrency)
 * 
 * @example
 * const rate = await getExchangeRate('USD', 'EUR');
 * // Retourne: 0.92 (1 USD = 0.92 EUR)
 */
export async function getExchangeRate(fromCurrency, toCurrency, useCache = true) {
  // Si même devise, retourner 1
  if (fromCurrency === toCurrency) {
    return 1;
  }

  // Vérifier cache
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  if (useCache) {
    const cached = exchangeRateCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < EXCHANGE_RATE_CACHE_TTL) {
      log.debug(`Exchange rate from cache: ${cacheKey} = ${cached.rate}`);
      return cached.rate;
    }
  }

  try {
    // Essayer de charger depuis IndexedDB
    const cachedFromDB = await financeStorage.getExchangeRate(cacheKey);
    if (cachedFromDB && (Date.now() - cachedFromDB.timestamp) < EXCHANGE_RATE_CACHE_TTL) {
      exchangeRateCache.set(cacheKey, cachedFromDB);
      log.debug(`Exchange rate from DB: ${cacheKey} = ${cachedFromDB.rate}`);
      return cachedFromDB.rate;
    }
  } catch (err) {
    log.debug('Error loading exchange rate from DB:', err);
  }

  // Récupérer depuis API (Fixer.io ou alternative)
  try {
    const rate = await fetchExchangeRateFromAPI(fromCurrency, toCurrency);
    
    // Mettre en cache
    const cacheEntry = {
      rate,
      timestamp: Date.now()
    };
    exchangeRateCache.set(cacheKey, cacheEntry);
    
    // Sauvegarder dans IndexedDB
    try {
      await financeStorage.setExchangeRate(cacheKey, cacheEntry);
    } catch (err) {
      log.warn('Error saving exchange rate to DB:', err);
    }
    
    log.debug(`Exchange rate from API: ${cacheKey} = ${rate}`);
    return rate;
  } catch (error) {
    log.error(`Error fetching exchange rate ${cacheKey}:`, error);
    
    // Fallback : utiliser taux par défaut si disponible en cache (même expiré)
    const cached = exchangeRateCache.get(cacheKey);
    if (cached) {
      log.warn(`Using expired cache for ${cacheKey}: ${cached.rate}`);
      return cached.rate;
    }
    
    // Dernier fallback : taux approximatif (ne devrait jamais arriver en production)
    log.warn(`No exchange rate available for ${cacheKey}, using default 1.0`);
    return 1.0;
  }
}

/**
 * Récupérer taux de change depuis API externe
 * 
 * @param {string} fromCurrency - Devise source
 * @param {string} toCurrency - Devise cible
 * @returns {Promise<number>} Taux de change
 * @private
 */
async function fetchExchangeRateFromAPI(fromCurrency, toCurrency) {
  // Essayer Fixer.io d'abord (si clé API disponible)
  try {
    const { getApiKey, hasApiKey } = await import('../../config/apiKeys');
    
    if (hasApiKey('FIXER')) {
      const apiKey = getApiKey('FIXER');
      const url = `https://api.fixer.io/latest?access_key=${apiKey}&base=${fromCurrency}&symbols=${toCurrency}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Fixer API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success && data.rates && data.rates[toCurrency]) {
        return data.rates[toCurrency];
      }
    }
  } catch (err) {
    log.debug('Fixer API not available, trying alternative:', err);
  }

  // Alternative : exchangerate-api.com (gratuit, pas de clé requise)
  try {
    const url = `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`ExchangeRate API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.rates && data.rates[toCurrency]) {
      return data.rates[toCurrency];
    }
  } catch (err) {
    log.warn('ExchangeRate API failed:', err);
  }

  // Si toutes les APIs échouent, throw error
  throw new Error(`Unable to fetch exchange rate ${fromCurrency} → ${toCurrency}`);
}

/**
 * Convertir un montant d'une devise vers une autre (version synchrone si cache disponible)
 * 
 * ✅ PHASE 4 - Étape 4.9 : Conversion automatique avec fallback synchrone
 * 
 * @param {number} amount - Montant à convertir
 * @param {string} fromCurrency - Devise source
 * @param {string} toCurrency - Devise cible (défaut: REFERENCE_CURRENCY)
 * @param {boolean} [useCache=true] - Utiliser cache pour taux de change
 * @returns {number|Promise<number>} Montant converti (synchrone si cache, sinon Promise)
 * 
 * @example
 * const converted = convertCurrencySync(100, 'USD', 'EUR');
 * // Retourne: 92.00 (si taux en cache)
 */
export function convertCurrencySync(amount, fromCurrency, toCurrency = REFERENCE_CURRENCY) {
  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  if (fromCurrency === toCurrency) {
    return Math.round(amount * 100) / 100;
  }

  // Vérifier cache synchrone
  const cacheKey = `${fromCurrency}_${toCurrency}`;
  const cached = exchangeRateCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < EXCHANGE_RATE_CACHE_TTL) {
    const converted = amount * cached.rate;
    return Math.round(converted * 100) / 100;
  }

  // Si pas en cache, retourner valeur originale (conversion async en arrière-plan)
  log.debug(`Exchange rate not in cache for ${cacheKey}, using original value`);
  return amount;
}

/**
 * Convertir un montant d'une devise vers une autre (version asynchrone)
 * 
 * ✅ PHASE 4 - Étape 4.9 : Conversion automatique
 * 
 * @param {number} amount - Montant à convertir
 * @param {string} fromCurrency - Devise source
 * @param {string} toCurrency - Devise cible (défaut: REFERENCE_CURRENCY)
 * @param {boolean} [useCache=true] - Utiliser cache pour taux de change
 * @returns {Promise<number>} Montant converti, arrondi à 2 décimales
 * 
 * @example
 * const converted = await convertCurrency(100, 'USD', 'EUR');
 * // Retourne: 92.00 (si 1 USD = 0.92 EUR)
 */
export async function convertCurrency(amount, fromCurrency, toCurrency = REFERENCE_CURRENCY, useCache = true) {
  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }

  if (fromCurrency === toCurrency) {
    return Math.round(amount * 100) / 100;
  }

  const rate = await getExchangeRate(fromCurrency, toCurrency, useCache);
  const converted = amount * rate;
  
  return Math.round(converted * 100) / 100;
}

/**
 * Formater un montant selon devise et locale
 * 
 * ✅ PHASE 4 - Étape 4.9 : Formatage selon devise
 * 
 * @param {number} amount - Montant à formater
 * @param {string} [currency='EUR'] - Code devise ISO
 * @param {string} [locale='fr-FR'] - Locale pour formatage
 * @returns {string} Montant formaté (ex: "1 234,56 €")
 * 
 * @example
 * formatCurrency(1234.56, 'EUR', 'fr-FR'); // Retourne: "1 234,56 €"
 * formatCurrency(1234.56, 'USD', 'en-US'); // Retourne: "$1,234.56"
 */
export function formatCurrency(amount, currency = REFERENCE_CURRENCY, locale = 'fr-FR') {
  if (!Number.isFinite(amount)) {
    return '0,00';
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback si devise non supportée par Intl
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    return `${amount.toFixed(2)} ${symbol}`;
  }
}

/**
 * Obtenir symbole devise
 * 
 * @param {string} currency - Code devise ISO
 * @returns {string} Symbole devise (€, $, £, etc.)
 */
export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Convertir prix d'une position vers devise de référence
 * 
 * ✅ PHASE 4 - Étape 4.9 : Conversion automatique pour calculs
 * 
 * @param {Object} position - Position à convertir
 * @param {string} [targetCurrency=REFERENCE_CURRENCY] - Devise cible
 * @returns {Promise<Object>} Position avec prix convertis
 * 
 * @example
 * const converted = await convertPositionCurrency(position, 'EUR');
 * // Retourne: position avec prixEntree et prixActuel convertis en EUR
 */
export async function convertPositionCurrency(position, targetCurrency = REFERENCE_CURRENCY) {
  if (!position) {
    return position;
  }

  // Détecter devise de la position
  const positionCurrency = position.currency || detectCurrency(position.ticker);
  
  if (positionCurrency === targetCurrency) {
    return position; // Pas de conversion nécessaire
  }

  // Convertir prix d'achat
  const prixEntreeConverti = await convertCurrency(
    position.prixEntree,
    positionCurrency,
    targetCurrency
  );

  // Convertir prix actuel si disponible
  let prixActuelConverti = null;
  if (position.yahooData?.prixActuel) {
    prixActuelConverti = await convertCurrency(
      position.yahooData.prixActuel,
      positionCurrency,
      targetCurrency
    );
  }

  // Retourner position avec prix convertis
  return {
    ...position,
    currency: positionCurrency, // Conserver devise originale
    prixEntreeOriginal: position.prixEntree, // Conserver prix original
    prixEntree: prixEntreeConverti,
    yahooData: position.yahooData ? {
      ...position.yahooData,
      prixActuelOriginal: position.yahooData.prixActuel, // Conserver prix original
      prixActuel: prixActuelConverti
    } : null
  };
}

/**
 * Précharger taux de change pour devises courantes
 * 
 * @param {Array<string>} currencies - Liste des devises à précharger
 * @returns {Promise<void>}
 */
export async function preloadExchangeRates(currencies = ['USD', 'GBP', 'JPY', 'CHF']) {
  const promises = currencies.map(currency => 
    getExchangeRate(currency, REFERENCE_CURRENCY).catch(err => {
      log.warn(`Failed to preload exchange rate for ${currency}:`, err);
    })
  );
  
  await Promise.allSettled(promises);
  log.info(`Preloaded exchange rates for ${currencies.length} currencies`);
}
