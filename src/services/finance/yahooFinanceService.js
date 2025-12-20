/**
 * Service Yahoo Finance avec fallback multi-APIs
 * Supporte Alpha Vantage, Finnhub, Polygon avec normalisation
 */

import { getApiKey, hasApiKey } from '../../config/apiKeys';
import { financeStorage } from './financeStorage';
import logger from '../../utils/logger';

const log = logger.module('yahooFinanceService');

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
    this.circuitBreaker = {
      failures: 0,
      threshold: 5,
      timeout: 60000,
      state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
    };
  }

  async getQuoteData(ticker, options = {}) {
    const { useCache = true, forceRefresh = false } = options;
    
    // ✅ PHASE 3 - Étape 3.14 : Vérifier cache IndexedDB avec TTL strict
    if (useCache && !forceRefresh) {
      const cached = await financeStorage.getYahooCache(ticker, {
        ttl: this.cacheTTL.quote,
        allowStale: false // TTL strict : pas de cache expiré
      });
      if (cached) {
        return cached;
      }
    }

    // ✅ PHASE 3.14 : Vérifier circuit breaker (peut utiliser cache stale en dernier recours)
    if (this.circuitBreaker.state === 'OPEN') {
      if (Date.now() < this.circuitBreaker.nextAttempt) {
        log.warn('Circuit breaker OPEN, trying stale cache as last resort');
        const cached = await financeStorage.getYahooCache(ticker, {
          ttl: this.cacheTTL.quote,
          allowStale: true // Circuit breaker : autoriser stale cache
        });
        if (cached) return cached;
        throw new Error('Circuit breaker is OPEN and no cache available');
      }
      this.circuitBreaker.state = 'HALF_OPEN';
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
        await financeStorage.setYahooCache(ticker, normalized);
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
        this.onFailure();
      }
    }

    // 4. Fallback Finnhub
    if (hasApiKey('FINNHUB')) {
      try {
        const data = await this.fetchFinnhub(ticker);
        await financeStorage.setYahooCache(ticker, data);
        this.onSuccess();
        return this.normalizeQuoteData(data, 'finnhub');
      } catch (error) {
        // ✅ OPTIMISATION : Logger seulement en debug si d'autres APIs disponibles
        const hasOtherApis = hasApiKey('POLYGON');
        if (hasOtherApis) {
          log.debug(`Finnhub failed for ${ticker}, trying fallback:`, error.message);
        } else {
          log.warn(`Finnhub failed for ${ticker}:`, error.message);
        }
        this.onFailure();
      }
    }

    // 5. Fallback Polygon
    if (hasApiKey('POLYGON')) {
      try {
        const data = await this.fetchPolygon(ticker);
        await financeStorage.setYahooCache(ticker, data);
        this.onSuccess();
        return this.normalizeQuoteData(data, 'polygon');
      } catch (error) {
        log.warn(`Polygon failed for ${ticker}:`, error.message);
        this.onFailure();
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
    const apiKey = getApiKey('FINNHUB');
    const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`;
    
    const response = await this.fetchWithRetry(url);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response;
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
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        
        // Backoff exponentiel avec jitter
        const baseDelay = backoffBase * Math.pow(2, attempt);
        const jitterValue = jitter ? Math.random() * 0.3 * baseDelay : 0;
        const delay = baseDelay + jitterValue;
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  onSuccess() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.state = 'CLOSED';
  }

  onFailure() {
    this.circuitBreaker.failures++;
    if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.nextAttempt = Date.now() + this.circuitBreaker.timeout;
      log.warn('Circuit breaker OPEN');
    }
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
          if (hasFallback) {
            log.debug(`Finnhub historical failed for ${ticker}, trying fallback:`, error.message);
          } else {
            log.error(`Finnhub historical failed for ${ticker}:`, error.message);
            throw error; // Re-throw si pas de fallback
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
          log.error(`Polygon historical failed for ${ticker}:`, error.message);
          throw error; // Dernier recours, re-throw
        }
      }

      return [];
    } catch (error) {
      // ✅ CORRECTION : Logger en ERROR seulement si vraiment toutes les APIs ont échoué
      // Si on arrive ici, c'est qu'une erreur a été re-throwée (pas de fallback disponible)
      // ou qu'aucune API n'est configurée
      const hasAnyApi = hasApiKey('ALPHA_VANTAGE') || hasApiKey('FINNHUB') || hasApiKey('POLYGON');
      if (hasAnyApi) {
        // Une API était configurée mais a échoué sans fallback
        log.error(`Error fetching historical data for ${ticker} (no fallback available):`, error.message);
      } else {
        // Aucune API configurée
        log.warn(`No API keys configured for historical data for ${ticker}`);
      }
      
      this.onFailure();
      
      // ✅ PHASE 3.14 : Fallback cache (stale autorisé seulement en cas d'erreur)
      const cached = await financeStorage.getYahooCache(cacheKey, {
        ttl: this.cacheTTL.historical,
        allowStale: true // Erreur : autoriser stale cache comme fallback
      });
      if (cached) {
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
    const timeSeries = response['Time Series (Daily)'];
    
    if (!timeSeries) {
      // Vérifier si c'est une réponse vide ou malformée
      if (Object.keys(response).length === 0) {
        throw new Error('Alpha Vantage returned empty response');
      }
      
      // Vérifier si métadonnées existent mais pas de données (ticker invalide ou autre problème)
      if (response['Meta Data']) {
        const metaData = response['Meta Data'];
        log.warn(`Alpha Vantage returned metadata but no time series for ${ticker}:`, metaData);
        throw new Error(`No time series data available for ${ticker}`);
      }
      
      // Réponse inattendue
      log.warn(`Alpha Vantage unexpected response structure for ${ticker}:`, Object.keys(response));
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
    const apiKey = getApiKey('FINNHUB');
    const endDate = Math.floor(Date.now() / 1000);
    const startDate = this.getStartDateForPeriod(period);
    
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${ticker}&resolution=D&from=${startDate}&to=${endDate}&token=${apiKey}`;
    
    const response = await this.fetchWithRetry(url);
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    return response;
  }

  async fetchPolygonHistorical(ticker, period) {
    const apiKey = getApiKey('POLYGON');
    const startDate = this.getStartDateForPeriod(period);
    const endDate = new Date().toISOString().split('T')[0];
    
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&apikey=${apiKey}`;
    
    const response = await this.fetchWithRetry(url);
    
    if (response.status !== 'OK') {
      throw new Error(response.status);
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

