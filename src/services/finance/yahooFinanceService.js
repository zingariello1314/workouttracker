/**
 * Service Yahoo Finance avec fallback multi-APIs
 * Supporte Alpha Vantage, Finnhub, Polygon avec normalisation
 */

import { getApiKey, hasApiKey } from '../../config/apiKeys';
import { financeStorage } from './financeStorage';
import { intelligentCache } from './intelligentCache';
import ImprovedCircuitBreaker from './improvedCircuitBreaker';
import logger from '../../utils/logger';

const log = logger.module('yahooFinanceService');

// ✅ PHASE 4 - Étape 4.1 : Métriques API pour validation
const apiMetrics = {
  calls: [],
  getStats: () => {
    if (apiMetrics.calls.length === 0) return null;
    const durations = apiMetrics.calls.map(c => c.duration);
    return {
      total: apiMetrics.calls.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations)
    };
  },
  record: (endpoint, duration) => {
    apiMetrics.calls.push({ endpoint, duration, timestamp: Date.now() });
    // Garder seulement les 100 derniers appels
    if (apiMetrics.calls.length > 100) {
      apiMetrics.calls.shift();
    }
  }
};

class YahooFinanceService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = {
      quote: 15 * 60 * 1000,      // 15 min pour données live
      historical: 60 * 60 * 1000, // 1h pour historique
      chart: 5 * 60 * 1000        // 5 min pour graphiques
    };
    this.retryConfig = {
      maxRetries: 3,
      backoffBase: 1000,
      backoffMultiplier: 2
    };
    // ✅ PHASE 3 - Étape 3.4 : Circuit breaker amélioré
    this.circuitBreaker = new ImprovedCircuitBreaker({
      threshold: 5,
      timeout: 60000,
      halfOpenTimeout: 30000,
      halfOpenMaxAttempts: 3,
      rateLimitTimeout: 5 * 60 * 1000,
      name: 'YahooFinanceService'
    });
    
    // ✅ FIX: Circuit breaker pour Finnhub (désactiver si 403 répété)
    this.finnhubDisabled = false;
    this.finnhub403ResetTime = null;
    this.FINNHUB_403_RESET_MS = 24 * 60 * 60 * 1000; // 24h
    this._finnhubCircuitBreakerLogged = false;
    this._loadFinnhubCircuitBreakerState();
  }

  /**
   * Charge l'état du circuit breaker Finnhub depuis localStorage
   * 
   * @private
   */
  _loadFinnhubCircuitBreakerState() {
    try {
      const stored = localStorage.getItem('finnhub_circuitBreaker');
      if (stored) {
        const state = JSON.parse(stored);
        this.finnhub403ResetTime = state.resetTime;
        
        // Vérifier si le circuit breaker est toujours actif
        if (this.finnhub403ResetTime && Date.now() < this.finnhub403ResetTime) {
          this.finnhubDisabled = true;
          log.debug('[yahooFinanceService] Circuit breaker Finnhub chargé depuis localStorage (actif)');
        } else {
          // Réinitialiser si période expirée
          this.finnhubDisabled = false;
          this.finnhub403ResetTime = null;
          this._saveFinnhubCircuitBreakerState();
        }
      } else {
        // État initial
        this.finnhubDisabled = false;
        this.finnhub403ResetTime = null;
      }
    } catch (error) {
      log.warn('[yahooFinanceService] Erreur chargement circuit breaker Finnhub:', error);
      this.finnhubDisabled = false;
      this.finnhub403ResetTime = null;
    }
  }

  /**
   * Sauvegarde l'état du circuit breaker Finnhub dans localStorage
   * 
   * @private
   */
  _saveFinnhubCircuitBreakerState() {
    try {
      const state = {
        disabled: this.finnhubDisabled,
        resetTime: this.finnhub403ResetTime,
        timestamp: Date.now()
      };
      localStorage.setItem('finnhub_circuitBreaker', JSON.stringify(state));
    } catch (error) {
      log.warn('[yahooFinanceService] Erreur sauvegarde circuit breaker Finnhub:', error);
    }
  }

  async getQuoteData(ticker, options = {}) {
    const { useCache = true, forceRefresh = false } = options;
    
    // ✅ PHASE 2 - Étape 2.3 : Cache intelligent avec comparaison deep
    if (useCache && !forceRefresh) {
      // Vérifier cache intelligent d'abord (plus rapide)
      const intelligentCached = intelligentCache.get(ticker, {
        ttl: this.cacheTTL.quote,
        allowStale: false
      });
      if (intelligentCached) {
        return intelligentCached;
      }

      // Fallback vers IndexedDB cache
      const cached = await financeStorage.getYahooCache(ticker, {
        ttl: this.cacheTTL.quote,
        allowStale: false // TTL strict : pas de cache expiré
      });
      if (cached) {
        // Mettre en cache intelligent aussi
        intelligentCache.set(ticker, cached, { ttl: this.cacheTTL.quote });
        return cached;
      }
    }

    // ✅ PHASE 3 - Étape 3.4 : Circuit breaker amélioré avec vérification
    if (!this.circuitBreaker.isAvailable()) {
      log.warn('Circuit breaker not available, trying stale cache as last resort');
      const cached = await financeStorage.getYahooCache(ticker, {
        ttl: this.cacheTTL.quote,
        allowStale: true // Circuit breaker : autoriser stale cache
      });
      if (cached) return cached;
      throw new Error('Circuit breaker is not available and no cache available');
    }

    // 3. Essayer Alpha Vantage (priorité)
    if (hasApiKey('ALPHA_VANTAGE')) {
      try {
        const data = await this.fetchAlphaVantage(ticker);
        // ✅ CORRECTION : Valider données normalisées avant cache
        const normalized = this.normalizeQuoteData(data, 'alphaVantage');
        if (!normalized || !normalized.prixActuel || normalized.prixActuel <= 0) {
          throw new Error(`Invalid normalized data from Alpha Vantage for ${ticker}`);
        }
        
        // ✅ PHASE 2 - Étape 2.3 : Vérifier si données identiques avant cache
        const existingCache = intelligentCache.get(ticker, { allowStale: true });
        if (!existingCache || !intelligentCache.get(ticker, { dataToCompare: normalized })) {
          // Données différentes ou pas de cache : mettre à jour
          await financeStorage.setYahooCache(ticker, normalized);
          intelligentCache.set(ticker, normalized, { ttl: this.cacheTTL.quote });
        } else {
          log.debug(`Data unchanged for ${ticker}, using existing cache`);
        }
        
        this.onSuccess();
        return normalized;
      } catch (error) {
        // ✅ CORRECTION : Logger seulement en debug si d'autres APIs disponibles (fallback normal)
        const hasOtherApis = hasApiKey('FINNHUB') || hasApiKey('POLYGON');
        if (hasOtherApis) {
          log.debug(`Alpha Vantage failed for ${ticker}, trying fallback:`, error.message);
        } else {
          // Seulement logger en warn si c'est la seule API et que l'erreur est critique
          if (error.message.includes('rate limit') || error.message.includes('API key')) {
            log.warn(`Alpha Vantage critical error for ${ticker}:`, error.message);
          } else {
            log.debug(`Alpha Vantage failed for ${ticker}:`, error.message);
          }
        }
        this.onFailure(error);
      }
    }

    // 4. Fallback Finnhub
    if (hasApiKey('FINNHUB')) {
      // ✅ FIX: Vérifier circuit breaker Finnhub AVANT requête
      if (this.finnhubDisabled) {
        // Vérifier si on peut réactiver (après 24h)
        if (this.finnhub403ResetTime && Date.now() > this.finnhub403ResetTime) {
          log.info('[yahooFinanceService] Réactivation Finnhub après période de désactivation (24h)');
          this.finnhubDisabled = false;
          this.finnhub403ResetTime = null;
          this._saveFinnhubCircuitBreakerState();
        } else {
          // Circuit breaker actif : skip Finnhub, essayer Polygon
          log.debug(`[yahooFinanceService] Circuit breaker Finnhub actif (403) - skip pour ${ticker}`);
        }
      }
      
      // Essayer seulement si circuit breaker non actif
      if (!this.finnhubDisabled) {
        try {
          const data = await this.fetchFinnhub(ticker);
          const normalized = this.normalizeQuoteData(data, 'finnhub');
          // ✅ PHASE 2 - Étape 2.3 : Cache intelligent
          await financeStorage.setYahooCache(ticker, normalized);
          intelligentCache.set(ticker, normalized, { ttl: this.cacheTTL.quote });
          this.onSuccess();
          return normalized;
        } catch (error) {
          // ✅ FIX: Désactiver Finnhub si erreur 403
          if (error.message && (error.message.includes('403') || error.message.includes('Forbidden'))) {
            this.finnhubDisabled = true;
            this.finnhub403ResetTime = Date.now() + this.FINNHUB_403_RESET_MS;
            this._saveFinnhubCircuitBreakerState();
            if (!this._finnhubCircuitBreakerLogged) {
              log.warn(`[yahooFinanceService] Circuit breaker Finnhub activé (erreur 403). Désactivation pour 24h.`);
              this._finnhubCircuitBreakerLogged = true;
            }
          }
          
          // ✅ OPTIMISATION : Logger seulement en debug si d'autres APIs disponibles
          const hasOtherApis = hasApiKey('POLYGON');
          if (hasOtherApis) {
            log.debug(`Finnhub failed for ${ticker}, trying fallback:`, error.message);
          } else {
            log.warn(`Finnhub failed for ${ticker}:`, error.message);
          }
          this.onFailure(error);
        }
      }
    }

    // 5. Fallback Polygon
    if (hasApiKey('POLYGON')) {
      try {
        const data = await this.fetchPolygon(ticker);
        const normalized = this.normalizeQuoteData(data, 'polygon');
        // ✅ PHASE 2 - Étape 2.3 : Cache intelligent
        await financeStorage.setYahooCache(ticker, normalized);
        intelligentCache.set(ticker, normalized, { ttl: this.cacheTTL.quote });
        this.onSuccess();
        return normalized;
      } catch (error) {
        log.warn(`Polygon failed for ${ticker}:`, error.message);
        this.onFailure(error);
      }
    }

    // ✅ PHASE 3.14 : Dernier recours : données locales (stale cache autorisé seulement ici)
    const cached = await financeStorage.getYahooCache(ticker, {
      ttl: this.cacheTTL.quote,
      allowStale: true // Dernier recours : autoriser stale cache
    });
    if (cached) {
      return cached;
    }

    throw new Error(`Unable to fetch data for ${ticker} from any source`);
  }

  async fetchAlphaVantage(ticker) {
    const apiKey = getApiKey('ALPHA_VANTAGE');
    
    // ✅ CORRECTION : Validation API key avant requête
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Alpha Vantage API key is missing or invalid');
    }
    
    // ✅ CORRECTION : Validation ticker avant requête
    if (!ticker || ticker.trim() === '') {
      throw new Error('Ticker symbol is required');
    }
    
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker.trim())}&apikey=${encodeURIComponent(apiKey.trim())}`;
    
    let response;
    try {
      response = await this.fetchWithRetry(url);
    } catch (error) {
      // ✅ CORRECTION : Gestion erreur réseau avec message clair
      throw new Error(`Network error fetching Alpha Vantage data: ${error.message}`);
    }
    
    // ✅ CORRECTION : Validation réponse existe et est un objet
    if (!response || typeof response !== 'object') {
      throw new Error('Alpha Vantage returned invalid response format');
    }
    
    // ✅ CORRECTION : Vérifier erreur API explicite
    if (response['Error Message']) {
      const errorMsg = response['Error Message'];
      // Ne pas throw si c'est juste un ticker invalide (on peut essayer fallback)
      if (errorMsg.includes('Invalid API call') || errorMsg.includes('symbol')) {
        throw new Error(`Invalid ticker symbol: ${ticker}`);
      }
      throw new Error(`Alpha Vantage API error: ${errorMsg}`);
    }
    
    // ✅ CORRECTION : Vérifier rate limit
    if (response['Note']) {
      const note = response['Note'];
      if (note.includes('rate limit') || note.includes('Thank you for using Alpha Vantage')) {
        throw new Error('Alpha Vantage API rate limit exceeded. Please try again later.');
      }
      throw new Error(`Alpha Vantage API note: ${note}`);
    }
    
    // ✅ CORRECTION : Validation Global Quote avec vérifications détaillées
    const quote = response['Global Quote'];
    
    if (!quote) {
      // Vérifier si c'est une réponse vide ou malformée
      if (Object.keys(response).length === 0) {
        throw new Error('Alpha Vantage returned empty response');
      }
      // Log pour debugging mais ne pas throw si on peut utiliser fallback
      log.debug(`Alpha Vantage: Global Quote missing for ${ticker}, response keys:`, Object.keys(response));
      throw new Error(`Alpha Vantage: Global Quote missing for ${ticker}`);
    }
    
    if (typeof quote !== 'object') {
      throw new Error(`Alpha Vantage: Global Quote is not an object for ${ticker}`);
    }
    
    // ✅ CORRECTION : Vérifier que le prix existe et est valide
    const priceStr = quote['05. price'];
    if (!priceStr || priceStr === '' || priceStr === 'N/A' || priceStr === 'null') {
      log.debug(`Alpha Vantage: Invalid price for ${ticker}, price value:`, priceStr);
      throw new Error(`Alpha Vantage: Invalid or missing price data for ${ticker}`);
    }
    
    // ✅ CORRECTION : Vérifier que le prix est un nombre valide
    const price = parseFloat(priceStr);
    if (isNaN(price) || price <= 0) {
      log.debug(`Alpha Vantage: Price is not a valid number for ${ticker}, parsed:`, price);
      throw new Error(`Alpha Vantage: Price is not a valid number for ${ticker}`);
    }
    
    // ✅ CORRECTION : Vérifier que le symbole correspond
    const symbol = quote['01. symbol'];
    if (symbol && symbol.toUpperCase() !== ticker.toUpperCase()) {
      log.debug(`Alpha Vantage: Symbol mismatch for ${ticker}, received:`, symbol);
      // Ne pas throw, juste log (certaines APIs retournent des variations)
    }
    
    return quote;
  }

  async fetchFinnhub(ticker) {
    // ✅ FIX: Vérifier circuit breaker Finnhub AVANT requête
    if (this.finnhubDisabled) {
      // Vérifier si on peut réactiver (après 24h)
      if (this.finnhub403ResetTime && Date.now() > this.finnhub403ResetTime) {
        log.info('[yahooFinanceService] Réactivation Finnhub après période de désactivation (24h)');
        this.finnhubDisabled = false;
        this.finnhub403ResetTime = null;
        this._saveFinnhubCircuitBreakerState();
      } else {
        // Circuit breaker actif : throw pour permettre fallback
        throw new Error('Finnhub circuit breaker active (403)');
      }
    }
    
    const apiKey = getApiKey('FINNHUB');
    const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`;
    
    try {
      const response = await this.fetchWithRetry(url);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response;
    } catch (error) {
      // ✅ FIX: Désactiver Finnhub si erreur 403
      if (error.message && (error.message.includes('403') || error.message.includes('Forbidden'))) {
        this.finnhubDisabled = true;
        this.finnhub403ResetTime = Date.now() + this.FINNHUB_403_RESET_MS;
        this._saveFinnhubCircuitBreakerState();
        if (!this._finnhubCircuitBreakerLogged) {
          log.warn(`[yahooFinanceService] Circuit breaker Finnhub activé (erreur 403). Désactivation pour 24h.`);
          this._finnhubCircuitBreakerLogged = true;
        }
      }
      throw error;
    }
  }

  async fetchPolygon(ticker) {
    const apiKey = getApiKey('POLYGON');
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apikey=${apiKey}`;
    
    const response = await this.fetchWithRetry(url);
    
    if (response.status !== 'OK') {
      throw new Error(response.status);
    }
    
    return response;
  }

  normalizeQuoteData(data, source) {
    const normalizers = {
      alphaVantage: (d) => {
        // ✅ CORRECTION : Validation et parsing robuste des données Alpha Vantage
        if (!d || typeof d !== 'object') {
          throw new Error('Invalid Alpha Vantage data: data is not an object');
        }
        
        const priceStr = d['05. price'];
        if (!priceStr || priceStr === '' || priceStr === 'N/A') {
          throw new Error('Invalid Alpha Vantage data: price is missing or invalid');
        }
        
        const prixActuel = parseFloat(priceStr);
        if (isNaN(prixActuel) || prixActuel <= 0) {
          throw new Error(`Invalid Alpha Vantage data: price is not a valid number (${priceStr})`);
        }
        
        // ✅ CORRECTION : Parsing robuste pour variationJour
        let variationJour = 0;
        const changePercentStr = d['10. change percent'];
        if (changePercentStr && changePercentStr !== 'N/A' && changePercentStr !== '') {
          const cleaned = String(changePercentStr).replace(/[%,\s]/g, '');
          const parsed = parseFloat(cleaned);
          if (!isNaN(parsed)) {
            variationJour = parsed;
          }
        }
        
        return {
          prixActuel,
          variationJour,
          volume: parseInt(d['06. volume'] || '0', 10) || 0,
          capitalisation: parseFloat(d['07. market cap'] || '0') || 0,
          previousClose: parseFloat(d['08. previous close'] || '0') || 0,
          open: parseFloat(d['02. open'] || '0') || 0,
          high: parseFloat(d['03. high'] || '0') || 0,
          low: parseFloat(d['04. low'] || '0') || 0
        };
      },
      finnhub: (d) => ({
        prixActuel: d.c || 0,
        variationJour: d.dp || 0,
        volume: d.v || 0,
        capitalisation: 0, // Non disponible dans quote
        previousClose: d.pc || 0,
        open: d.o || 0,
        high: d.h || 0,
        low: d.l || 0
      }),
      polygon: (d) => {
        const result = d.results?.[0];
        if (!result) throw new Error('No data in Polygon response');
        return {
          prixActuel: result.c || 0,
          variationJour: result.c && result.o ? ((result.c - result.o) / result.o) * 100 : 0,
          volume: result.v || 0,
          capitalisation: 0,
          previousClose: result.o || 0,
          open: result.o || 0,
          high: result.h || 0,
          low: result.l || 0
        };
      }
    };
    
    return normalizers[source](data);
  }

  async fetchWithRetry(url, options = {}) {
    const { maxRetries = 3, backoffBase = 1000, jitter = true } = { ...this.retryConfig, ...options };
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // ✅ CORRECTION : Gestion intelligente des codes HTTP
        if (!response.ok) {
          const status = response.status;
          
          // Erreurs permanentes : ne pas retry (401, 403, 404, 429 avec retry-after long)
          if (status === 401) {
            throw new Error(`HTTP 401 Unauthorized - Invalid API key or token expired`);
          }
          if (status === 403) {
            // ✅ FIX: Détecter si c'est une requête Finnhub pour activer circuit breaker
            if (url.includes('finnhub.io')) {
              // Ne pas retry, activer circuit breaker immédiatement
              throw new Error('HTTP 403 Forbidden - Finnhub API token invalid or expired');
            }
            
            // Essayer de récupérer le message d'erreur du body si disponible
            let errorMsg = 'HTTP 403 Forbidden';
            try {
              const errorBody = await response.text();
              if (errorBody) {
                try {
                  const errorJson = JSON.parse(errorBody);
                  if (errorJson.error || errorJson.message) {
                    errorMsg = `HTTP 403 Forbidden - ${errorJson.error || errorJson.message}`;
                  }
                } catch {
                  // Pas du JSON, garder le message par défaut
                }
              }
            } catch {
              // Ignorer les erreurs de lecture du body
            }
            throw new Error(errorMsg);
          }
          if (status === 404) {
            throw new Error(`HTTP 404 Not Found - Resource not found`);
          }
          if (status === 429) {
            // Rate limit : peut-être retry après un délai plus long
            const retryAfter = response.headers.get('Retry-After');
            if (retryAfter && parseInt(retryAfter) < 60 && attempt < maxRetries - 1) {
              // Retry après le délai indiqué si < 60s
              await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
              continue;
            }
            throw new Error(`HTTP 429 Too Many Requests - Rate limit exceeded${retryAfter ? ` (retry after ${retryAfter}s)` : ''}`);
          }
          
          // Autres erreurs serveur : retry possible
          throw new Error(`HTTP ${status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        // Si c'est une erreur permanente (401, 403, 404), ne pas retry
        if (error.message && (error.message.includes('401') || error.message.includes('403') || error.message.includes('404'))) {
          throw error;
        }
        
        if (attempt === maxRetries - 1) throw error;
        
        // Backoff exponentiel avec jitter
        const baseDelay = backoffBase * Math.pow(2, attempt);
        const jitterValue = jitter ? Math.random() * 0.3 * baseDelay : 0;
        const delay = baseDelay + jitterValue;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // ✅ PHASE 3 - Étape 3.4 : Circuit breaker amélioré
  onSuccess() {
    this.circuitBreaker.onSuccess();
  }

  onFailure(error = null) {
    this.circuitBreaker.onFailure(error);
  }

  async getHistoricalData(ticker, period = '1mo', options = {}) {
    const { useCache = true, forceRefresh = false } = options;
    
    // ✅ PHASE 3 - Étape 3.14 : Vérifier cache avec TTL strict
    const cacheKey = `historical_${ticker}_${period}`;
    if (useCache && !forceRefresh) {
      const cached = await financeStorage.getYahooCache(cacheKey, {
        ttl: this.cacheTTL.historical,
        allowStale: false // TTL strict : pas de cache expiré
      });
      if (cached) {
        return cached;
      }
    }

    try {
      // Essayer Alpha Vantage TIME_SERIES_DAILY
      if (hasApiKey('ALPHA_VANTAGE')) {
        try {
          const data = await this.fetchAlphaVantageHistorical(ticker, period);
          await financeStorage.setYahooCache(cacheKey, data);
          this.onSuccess();
          return this.normalizeHistoricalData(data, 'alphaVantage');
        } catch (error) {
          // ✅ CORRECTION : Logger en debug si fallback disponible, error si pas de fallback
          const hasFallback = hasApiKey('FINNHUB') || hasApiKey('POLYGON');
          if (hasFallback) {
            log.debug(`Alpha Vantage historical failed for ${ticker}, trying fallback:`, error.message);
          } else {
            log.error(`Alpha Vantage historical failed for ${ticker}:`, error.message);
            throw error; // Re-throw si pas de fallback
          }
        }
      }

      // Fallback Finnhub
      if (hasApiKey('FINNHUB')) {
        try {
          const data = await this.fetchFinnhubHistorical(ticker, period);
          await financeStorage.setYahooCache(cacheKey, data);
          this.onSuccess();
          return this.normalizeHistoricalData(data, 'finnhub');
        } catch (error) {
          // ✅ CORRECTION : Logger en debug si fallback disponible, error si pas de fallback
          const hasFallback = hasApiKey('POLYGON');
          
          // ✅ CORRECTION : Gérer les erreurs 403 différemment (token invalide, logger en debug si fallback)
          if (error.message && error.message.includes('403')) {
            if (hasFallback) {
              // Fallback disponible = logger en debug seulement (pas de warning répétitif)
              log.debug(`Finnhub API token invalid or expired for ${ticker} (403), trying Polygon fallback`);
            } else {
              log.error(`Finnhub API token invalid or expired for ${ticker} (403) - ${error.message}`);
              throw error;
            }
          } else {
            if (hasFallback) {
              log.debug(`Finnhub historical failed for ${ticker}, trying fallback:`, error.message);
            } else {
              log.error(`Finnhub historical failed for ${ticker}:`, error.message);
              throw error; // Re-throw si pas de fallback
            }
          }
        }
      }

      // Fallback Polygon
      if (hasApiKey('POLYGON')) {
        try {
          const data = await this.fetchPolygonHistorical(ticker, period);
          await financeStorage.setYahooCache(cacheKey, data);
          this.onSuccess();
          return this.normalizeHistoricalData(data, 'polygon');
        } catch (error) {
          // ✅ CORRECTION : Gérer les erreurs DELAYED (temporaire, logger en debug)
          if (error.message && error.message.includes('DELAYED')) {
            // Erreur DELAYED = temporaire, logger en debug seulement
            log.debug(`Polygon historical data delayed for ${ticker}, may be available later:`, error.message);
          } else {
            log.error(`Polygon historical failed for ${ticker}:`, error.message);
          }
          throw error; // Dernier recours, re-throw
        }
      }

      return [];
    } catch (error) {
      // ✅ CORRECTION : Logger selon type d'erreur (rate limit/temporaire = warn, critique = error)
      const hasAnyApi = hasApiKey('ALPHA_VANTAGE') || hasApiKey('FINNHUB') || hasApiKey('POLYGON');
      const errorMsg = error?.message || String(error);
      
      // Erreurs temporaires (rate limit, delayed, network) = warn seulement
      const isTemporaryError = errorMsg.includes('rate limit') || 
                               errorMsg.includes('DELAYED') || 
                               errorMsg.includes('network') ||
                               errorMsg.includes('429') ||
                               errorMsg.includes('timeout');
      
      if (hasAnyApi) {
        if (isTemporaryError) {
          // ✅ CORRECTION : Erreur temporaire = logger en debug seulement (pas de warning répétitif)
          log.debug(`Temporary error fetching historical data for ${ticker}:`, errorMsg);
        } else {
          // Erreur critique : logger en error
          log.error(`Error fetching historical data for ${ticker} (no fallback available):`, errorMsg);
        }
      } else {
        // Aucune API configurée
        log.warn(`No API keys configured for historical data for ${ticker}`);
      }
      
      // Ne pas déclencher circuit breaker pour erreurs temporaires
      if (!isTemporaryError) {
        this.onFailure();
      }
      
      // ✅ CORRECTION : Fallback cache avec limite d'âge max (7 jours)
      const cached = await financeStorage.getYahooCache(cacheKey, {
        ttl: this.cacheTTL.historical,
        allowStale: true, // Erreur : autoriser stale cache comme fallback
        maxStaleAge: 7 * 24 * 60 * 60 * 1000 // Max 7 jours pour cache stale
      });
      if (cached) {
        log.debug(`Using stale cache as fallback for ${ticker}`);
        return cached;
      }
      
      // Retourner tableau vide plutôt que throw pour éviter de casser l'UI
      log.warn(`No historical data available for ${ticker}, returning empty array`);
      return [];
    }
  }

  async fetchAlphaVantageHistorical(ticker, period) {
    const apiKey = getApiKey('ALPHA_VANTAGE');
    
    // ✅ CORRECTION : Validation API key avant requête
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('Alpha Vantage API key is missing or invalid');
    }
    
    // ✅ CORRECTION : Validation ticker avant requête
    if (!ticker || ticker.trim() === '') {
      throw new Error('Ticker symbol is required');
    }
    
    const outputsize = period === 'Max' ? 'full' : 'compact';
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(ticker.trim())}&outputsize=${outputsize}&apikey=${encodeURIComponent(apiKey.trim())}`;
    
    let response;
    try {
      response = await this.fetchWithRetry(url);
    } catch (error) {
      // ✅ CORRECTION : Gestion erreur réseau avec message clair
      throw new Error(`Network error fetching Alpha Vantage historical data: ${error.message}`);
    }
    
    // ✅ CORRECTION : Validation réponse existe et est un objet
    if (!response || typeof response !== 'object') {
      throw new Error('Alpha Vantage returned invalid response format');
    }
    
    // ✅ CORRECTION : Vérifier erreur API explicite
    if (response['Error Message']) {
      const errorMsg = response['Error Message'];
      // Ne pas throw si c'est juste un ticker invalide (on peut essayer fallback)
      if (errorMsg.includes('Invalid API call') || errorMsg.includes('symbol')) {
        throw new Error(`Invalid ticker symbol: ${ticker}`);
      }
      throw new Error(`Alpha Vantage API error: ${errorMsg}`);
    }
    
    // ✅ CORRECTION : Vérifier rate limit
    if (response['Note']) {
      const note = response['Note'];
      if (note.includes('rate limit') || note.includes('Thank you for using Alpha Vantage')) {
        throw new Error('Alpha Vantage API rate limit exceeded. Please try again later.');
      }
      throw new Error(`Alpha Vantage API note: ${note}`);
    }
    
    // ✅ CORRECTION : Validation Time Series avec vérifications détaillées
    // Vérifier d'abord les messages d'erreur/limitation AVANT de chercher timeSeries
    if (response['Information']) {
      const infoMsg = response['Information'];
      // Message d'information/limitation = logger en debug seulement (pas de warning)
      log.debug(`Alpha Vantage API limitation for ${ticker}:`, infoMsg);
      throw new Error(`Alpha Vantage API limitation: ${infoMsg}`);
    }
    
    const timeSeries = response['Time Series (Daily)'];
    
    if (!timeSeries) {
      // Vérifier si c'est une réponse vide ou malformée
      if (Object.keys(response).length === 0) {
        throw new Error('Alpha Vantage returned empty response');
      }
      
      // Vérifier si métadonnées existent mais pas de données (ticker invalide ou autre problème)
      if (response['Meta Data']) {
        const metaData = response['Meta Data'];
        log.debug(`Alpha Vantage returned metadata but no time series for ${ticker}`);
        throw new Error(`No time series data available for ${ticker}`);
      }
      
      // Réponse inattendue - logger en debug seulement si fallback disponible
      const hasFallback = hasApiKey('FINNHUB') || hasApiKey('POLYGON');
      if (hasFallback) {
        log.debug(`Alpha Vantage unexpected response structure for ${ticker}, trying fallback`);
      } else {
        log.warn(`Alpha Vantage unexpected response structure for ${ticker}:`, Object.keys(response));
      }
      throw new Error('No time series data in response');
    }
    
    // ✅ CORRECTION : Vérifier que timeSeries est un objet et contient des données
    if (typeof timeSeries !== 'object' || Array.isArray(timeSeries)) {
      throw new Error('Time Series (Daily) is not a valid object');
    }
    
    // ✅ CORRECTION : Vérifier que timeSeries contient au moins une entrée
    const timeSeriesKeys = Object.keys(timeSeries);
    if (timeSeriesKeys.length === 0) {
      throw new Error('Time Series (Daily) is empty');
    }
    
    return timeSeries;
  }

  async fetchFinnhubHistorical(ticker, period) {
    // ✅ FIX: Vérifier circuit breaker Finnhub AVANT requête
    if (this.finnhubDisabled) {
      // Vérifier si on peut réactiver (après 24h)
      if (this.finnhub403ResetTime && Date.now() > this.finnhub403ResetTime) {
        log.info('[yahooFinanceService] Réactivation Finnhub après période de désactivation (24h)');
        this.finnhubDisabled = false;
        this.finnhub403ResetTime = null;
        this._saveFinnhubCircuitBreakerState();
      } else {
        // Circuit breaker actif : throw pour permettre fallback
        throw new Error('Finnhub circuit breaker active (403)');
      }
    }
    
    const apiKey = getApiKey('FINNHUB');
    const endDate = Math.floor(Date.now() / 1000);
    const startDateObj = this.getStartDateForPeriod(period);
    
    // ✅ CORRECTION : Extraire timestamp Unix (Finnhub attend un nombre, pas un objet)
    const startDate = startDateObj.unix || Math.floor(startDateObj.getTime() / 1000);
    
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${startDate}&to=${endDate}&token=${apiKey}`;
    
    try {
      const response = await this.fetchWithRetry(url);
      
      // ✅ CORRECTION : Gestion améliorée des erreurs Finnhub
      if (response.error) {
        const errorMsg = response.error;
        // Messages d'erreur plus informatifs
        if (errorMsg.includes('Invalid API key') || errorMsg.includes('token')) {
          throw new Error(`Finnhub API error: Invalid token or API key`);
        }
        if (errorMsg.includes('limit') || errorMsg.includes('rate')) {
          throw new Error(`Finnhub API error: Rate limit exceeded`);
        }
        throw new Error(`Finnhub API error: ${errorMsg}`);
      }
      
      return response;
    } catch (error) {
      // ✅ FIX: Désactiver Finnhub si erreur 403
      if (error.message && (error.message.includes('403') || error.message.includes('Forbidden'))) {
        this.finnhubDisabled = true;
        this.finnhub403ResetTime = Date.now() + this.FINNHUB_403_RESET_MS;
        this._saveFinnhubCircuitBreakerState();
        if (!this._finnhubCircuitBreakerLogged) {
          log.warn(`[yahooFinanceService] Circuit breaker Finnhub activé (erreur 403). Désactivation pour 24h.`);
          this._finnhubCircuitBreakerLogged = true;
        }
      }
      throw error;
    }
  }

  async fetchPolygonHistorical(ticker, period) {
    const apiKey = getApiKey('POLYGON');
    const startDateObj = this.getStartDateForPeriod(period);
    const endDate = new Date().toISOString().split('T')[0];
    
    // ✅ CORRECTION : Extraire date ISO (Polygon attend une string YYYY-MM-DD, pas un objet)
    const startDate = startDateObj.iso || startDateObj.toISOString().split('T')[0];
    
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&apikey=${apiKey}`;
    
    const response = await this.fetchWithRetry(url);
    
    // ✅ CORRECTION : Gestion améliorée des erreurs Polygon (DELAYED, etc.)
    if (response.status !== 'OK') {
      const statusMsg = response.status;
      if (statusMsg === 'DELAYED') {
        throw new Error('DELAYED - Data not yet available, may be delayed');
      }
      if (statusMsg === 'NOT_FOUND') {
        throw new Error('NOT_FOUND - Ticker or date range not found');
      }
      if (response.error) {
        throw new Error(`${statusMsg} - ${response.error}`);
      }
      throw new Error(statusMsg || 'Unknown Polygon API error');
    }
    
    return response;
  }

  getStartDateForPeriod(period) {
    const now = new Date();
    let daysBack = 30;
    
    switch (period) {
      case '1j':
        daysBack = 1;
        break;
      case '5j':
        daysBack = 5;
        break;
      case '1m':
        daysBack = 30;
        break;
      case '3m':
        daysBack = 90;
        break;
      case '6m':
        daysBack = 180;
        break;
      case '1a':
        daysBack = 365;
        break;
      case 'Max':
        daysBack = 365 * 5; // 5 ans max
        break;
    }
    
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);
    
    // Retourner timestamp Unix pour Finnhub, date ISO pour Polygon
    return {
      unix: Math.floor(startDate.getTime() / 1000),
      iso: startDate.toISOString().split('T')[0]
    };
  }

  normalizeHistoricalData(data, source) {
    const normalizers = {
      alphaVantage: (d) => {
        return Object.entries(d).map(([date, values]) => ({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseInt(values['5. volume'])
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
      },
      finnhub: (d) => {
        if (!d.c || d.c.length === 0) return [];
        return d.c.map((close, i) => ({
          date: new Date(d.t[i] * 1000).toISOString().split('T')[0],
          open: d.o[i],
          high: d.h[i],
          low: d.l[i],
          close: close,
          volume: d.v[i]
        }));
      },
      polygon: (d) => {
        if (!d.results || d.results.length === 0) return [];
        return d.results.map(result => ({
          date: new Date(result.t).toISOString().split('T')[0],
          open: result.o,
          high: result.h,
          low: result.l,
          close: result.c,
          volume: result.v
        }));
      }
    };
    
    return normalizers[source](data);
  }
}

export const yahooFinanceService = new YahooFinanceService();

