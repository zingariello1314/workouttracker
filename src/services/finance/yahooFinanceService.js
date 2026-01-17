/**
 * Service Yahoo Finance avec fallback multi-APIs
 * Supporte Alpha Vantage, Finnhub, Polygon avec normalisation
 */

import { getApiKey, hasApiKey } from '../../config/apiKeys';
import { financeStorage } from './financeStorage';
import { intelligentCache } from './intelligentCache';
import ImprovedCircuitBreaker from './improvedCircuitBreaker';
import { financeQuotaManager, PRIORITY } from './financeQuotaManager';
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
    
    // ✅ FIX: Circuit breaker pour Polygon (désactiver si 429 répété)
    this.polygonDisabled = false;
    this.polygon429ResetTime = null;
    this.POLYGON_429_RESET_MS = 5 * 60 * 1000; // 5 min (rate limit Polygon)
    this._polygonCircuitBreakerLogged = false;
    this._loadPolygonCircuitBreakerState();
    
    // ✅ FIX: Déduplication des requêtes en cours
    this.pendingRequests = new Map(); // Map<requestKey, Promise>
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

  /**
   * Charge l'état du circuit breaker Polygon depuis localStorage
   * 
   * @private
   */
  _loadPolygonCircuitBreakerState() {
    try {
      const stored = localStorage.getItem('polygon_circuitBreaker');
      if (stored) {
        const state = JSON.parse(stored);
        this.polygon429ResetTime = state.resetTime;
        
        // Vérifier si le circuit breaker est toujours actif
        if (this.polygon429ResetTime && Date.now() < this.polygon429ResetTime) {
          this.polygonDisabled = true;
          log.debug('[yahooFinanceService] Circuit breaker Polygon chargé depuis localStorage (actif)');
        } else {
          // Réinitialiser si période expirée
          this.polygonDisabled = false;
          this.polygon429ResetTime = null;
          this._savePolygonCircuitBreakerState();
        }
      } else {
        // État initial
        this.polygonDisabled = false;
        this.polygon429ResetTime = null;
      }
    } catch (error) {
      log.warn('[yahooFinanceService] Erreur chargement circuit breaker Polygon:', error);
      this.polygonDisabled = false;
      this.polygon429ResetTime = null;
    }
  }

  /**
   * Sauvegarde l'état du circuit breaker Polygon dans localStorage
   * 
   * @private
   */
  _savePolygonCircuitBreakerState() {
    try {
      const state = {
        disabled: this.polygonDisabled,
        resetTime: this.polygon429ResetTime,
        timestamp: Date.now()
      };
      localStorage.setItem('polygon_circuitBreaker', JSON.stringify(state));
    } catch (error) {
      log.warn('[yahooFinanceService] Erreur sauvegarde circuit breaker Polygon:', error);
    }
  }

  /**
   * Génère les variantes possibles d'un ticker pour différents exchanges
   * @param {string} ticker - Ticker original
   * @returns {string[]} Liste des variantes à essayer
   */
  _generateTickerVariants(ticker) {
    const variants = [ticker]; // Commencer par le ticker original
    const upperTicker = ticker.toUpperCase();
    
    // ✅ FIX TSMC : Variantes spécifiques pour TSMC (Taiwan Semiconductor)
    // TSMC est listé sur Taiwan Stock Exchange avec le code 2330
    // Mais l'utilisateur veut le prix en USD, donc prioriser l'ADR US (TSM)
    if (upperTicker === 'TSMC' || /^2330$/i.test(ticker)) {
      // ✅ FIX CRITIQUE : Prioriser ADR US (TSM) pour obtenir prix en USD directement
      // L'ADR US est en USD, pas besoin de conversion
      variants.push('TSM'); // ADR US pour TSMC (sans suffixe) - PRIORITÉ
      variants.push('TSM.TW'); // ADR US pour TSMC (avec suffixe)
      // Variantes Taiwan en dernier recours (seront converties en USD si utilisées)
      variants.push('2330.TW'); // Code Taiwan (sera converti)
      variants.push('TSMC.TW'); // Variante avec nom complet
      variants.push('TSMC.TWO'); // Taiwan OTC
      variants.push('2330.TWO'); // Code Taiwan OTC
    }
    
    // Variantes génériques pour autres exchanges internationaux
    if (!upperTicker.includes('.')) {
      // Si pas de suffixe, essayer les suffixes communs
      variants.push(`${upperTicker}.TW`); // Taiwan
      variants.push(`${upperTicker}.TWO`); // Taiwan OTC
      variants.push(`${upperTicker}.AS`); // Euronext Amsterdam
      variants.push(`${upperTicker}.PA`); // Euronext Paris
      variants.push(`${upperTicker}.DE`); // XETRA Germany
      variants.push(`${upperTicker}.L`);  // London Stock Exchange
    }
    
    // Si c'est un code numérique à 4 chiffres, peut-être un code Taiwan
    if (upperTicker.match(/^\d{4}$/)) {
      variants.push(`${upperTicker}.TW`);
    }
    
    // Retirer les doublons et retourner
    return [...new Set(variants)];
  }

  async getQuoteData(ticker, options = {}) {
    const { useCache = true, forceRefresh = false, prixEntree = null } = options;
    
    // ✅ PHASE 2 - Étape 2.3 : Cache intelligent avec comparaison deep
    // ✅ FIX CRITIQUE : Ne pas utiliser le cache si c'est un prix d'entrée (on veut le vrai prix)
    if (useCache && !forceRefresh) {
      // Vérifier cache intelligent d'abord (plus rapide)
      const intelligentCached = intelligentCache.get(ticker, {
        ttl: this.cacheTTL.quote,
        allowStale: false
      });
      // ✅ FIX CRITIQUE : Si cache est un prix d'entrée, ne pas l'utiliser, essayer Yahoo Finance
      if (intelligentCached && !intelligentCached._isPrixEntree) {
        return intelligentCached;
      }

      // Fallback vers IndexedDB cache
      const cached = await financeStorage.getYahooCache(ticker, {
        ttl: this.cacheTTL.quote,
        allowStale: false // TTL strict : pas de cache expiré
      });
      // ✅ FIX CRITIQUE : Si cache est un prix d'entrée, ne pas l'utiliser, essayer Yahoo Finance
      if (cached && !cached._isPrixEntree) {
        // Mettre en cache intelligent aussi
        intelligentCache.set(ticker, cached, { ttl: this.cacheTTL.quote });
        return cached;
      }
      
      // Si cache est un prix d'entrée, logger et continuer pour essayer Yahoo Finance
      if (cached && cached._isPrixEntree) {
        log.debug(`[yahooFinanceService] Cache contains prixEntree for ${ticker}, will try Yahoo Finance scraping to get real price`);
      }
    }

    // ✅ PHASE 3 - Étape 3.4 : Circuit breaker amélioré avec vérification
    // NOTE: On ne bloque plus ici, on essaie d'abord les APIs, puis Yahoo Finance scraping
    // Le cache stale sera utilisé en dernier recours après toutes les tentatives

    // 3. Essayer Alpha Vantage (priorité)
    if (hasApiKey('ALPHA_VANTAGE')) {
      // ✅ FIX CRITIQUE #1 : Vérifier quota AVANT d'essayer les variantes
      // Ne pas consommer de quota si on ne peut pas utiliser l'API
      if (!financeQuotaManager.canUseApi('ALPHA_VANTAGE')) {
        log.debug(`[yahooFinanceService] Alpha Vantage quota épuisé ou circuit breaker ouvert, skip pour ${ticker}`);
        // Passer directement au fallback sans essayer
      } else {
        // ✅ FIX TSMC : Essayer plusieurs variantes du ticker pour exchanges internationaux
        const tickerVariants = this._generateTickerVariants(ticker);
        let lastError = null;
        let rateLimitDetected = false;
        let quotaConsumed = false; // ✅ FIX CRITIQUE #2 : Tracker si quota consommé
        
        for (const variant of tickerVariants) {
          // ✅ FIX CRITIQUE #3 : Vérifier quota AVANT chaque tentative
          if (!financeQuotaManager.canUseApi('ALPHA_VANTAGE')) {
            log.debug(`[yahooFinanceService] Alpha Vantage quota épuisé avant tentative ${variant}, arrêt`);
            break;
          }
          
          try {
            // ✅ FIX CRITIQUE #4 : Consommer quota UNIQUEMENT si on va faire la requête
            await financeQuotaManager.consumeQuota('ALPHA_VANTAGE', PRIORITY.PORTFOLIO_REFRESH);
            quotaConsumed = true;
            
            const data = await this.fetchAlphaVantage(variant);
            // ✅ CORRECTION : Valider données normalisées avant cache
            const normalized = this.normalizeQuoteData(data, 'alphaVantage');
            if (!normalized || !normalized.prixActuel || normalized.prixActuel <= 0) {
              throw new Error(`Invalid normalized data from Alpha Vantage for ${variant}`);
            }
            
            // ✅ FIX TSMC : Si variant différent du ticker original, logger pour info
            if (variant !== ticker) {
              log.info(`[yahooFinanceService] Ticker ${ticker} trouvé avec variant ${variant} sur Alpha Vantage`);
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
            
            // ✅ FIX CRITIQUE #5 : Enregistrer succès seulement si données valides
            this.onSuccess();
            financeQuotaManager.recordSuccess('ALPHA_VANTAGE');
            return normalized;
          } catch (error) {
            lastError = error;
            
            // ✅ FIX CRITIQUE #6 : Si rate limit détecté, arrêter immédiatement
            if (error.message?.includes('rate limit') || error.message?.includes('1 req/sec') || 
                error.message?.includes('spreading out') || error.message?.includes('Information')) {
              rateLimitDetected = true;
              log.warn(`[yahooFinanceService] Alpha Vantage rate limit détecté pour ${variant}. Arrêt des tentatives.`);
              // Ne pas enregistrer comme échec (c'est temporaire)
              break; // Arrêter la boucle, ne pas essayer les autres variantes
            }
            
            // ✅ FIX CRITIQUE #7 : Si quota consommé mais échec, enregistrer l'échec
            if (quotaConsumed) {
              financeQuotaManager.recordFailure('ALPHA_VANTAGE', error);
              quotaConsumed = false; // Reset pour prochaine tentative
            }
            
            // ✅ FIX TSMC : Logger pour voir pourquoi ça échoue
            if (error.message?.includes('Invalid ticker') || error.message?.includes('symbol')) {
              log.debug(`Alpha Vantage: Invalid ticker ${variant}, trying next variant`);
            } else {
              log.debug(`Alpha Vantage failed for ${variant}, trying next variant:`, error.message);
            }
            
            // ✅ FIX CRITIQUE #8 : Attendre 1 seconde entre chaque tentative pour respecter rate limit
            if (tickerVariants.indexOf(variant) < tickerVariants.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1 seconde entre tentatives
            }
          }
        }
        
        // ✅ FIX CRITIQUE : Si rate limit détecté, ne pas compter comme échec pour circuit breaker
        // (c'est temporaire, pas une vraie erreur)
        if (rateLimitDetected) {
          log.warn(`[yahooFinanceService] Alpha Vantage rate limit actif. Utilisation du cache ou fallback.`);
          // Ne pas appeler this.onFailure() pour éviter d'ouvrir le circuit breaker
          // Passer directement au fallback
        } else if (lastError) {
          // Si toutes les variantes ont échoué (sauf rate limit), logger l'erreur
          const hasOtherApis = hasApiKey('FINNHUB') || hasApiKey('POLYGON');
          if (hasOtherApis) {
            log.warn(`[yahooFinanceService] Alpha Vantage failed for all variants of ${ticker} (tried: ${tickerVariants.join(', ')}), trying fallback. Last error:`, lastError?.message);
          } else {
            if (lastError?.message?.includes('API key')) {
              log.warn(`[yahooFinanceService] Alpha Vantage critical error for ${ticker}:`, lastError.message);
            } else {
              log.warn(`[yahooFinanceService] Alpha Vantage failed for all variants of ${ticker} (tried: ${tickerVariants.join(', ')}):`, lastError?.message);
            }
          }
          this.onFailure(lastError);
        }
      } // ✅ FIX : Fermer le bloc else
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
        // ✅ FIX TSMC : Essayer plusieurs variantes du ticker pour exchanges internationaux
        const tickerVariants = this._generateTickerVariants(ticker);
        let lastError = null;
        
        for (const variant of tickerVariants) {
          try {
            const data = await this.fetchFinnhub(variant);
            const normalized = this.normalizeQuoteData(data, 'finnhub');
            
            // ✅ FIX TSMC : Si variant différent du ticker original, logger pour info
            if (variant !== ticker) {
              log.info(`[yahooFinanceService] Ticker ${ticker} trouvé avec variant ${variant} sur Finnhub`);
            }
            
            // ✅ PHASE 2 - Étape 2.3 : Cache intelligent
            await financeStorage.setYahooCache(ticker, normalized);
            intelligentCache.set(ticker, normalized, { ttl: this.cacheTTL.quote });
            this.onSuccess();
            return normalized;
          } catch (error) {
            lastError = error;
            
            // ✅ FIX: Désactiver Finnhub si erreur 403
            if (error.message && (error.message.includes('403') || error.message.includes('Forbidden'))) {
              this.finnhubDisabled = true;
              this.finnhub403ResetTime = Date.now() + this.FINNHUB_403_RESET_MS;
              this._saveFinnhubCircuitBreakerState();
              if (!this._finnhubCircuitBreakerLogged) {
                log.warn(`[yahooFinanceService] Circuit breaker Finnhub activé (erreur 403). Désactivation pour 24h.`);
                this._finnhubCircuitBreakerLogged = true;
              }
              break; // Arrêter les tentatives si circuit breaker activé
            }
            
            // ✅ FIX TSMC : Logger en WARN pour voir pourquoi ça échoue
            if (error.message?.includes('Invalid ticker') || error.message?.includes('symbol')) {
              log.debug(`Finnhub: Invalid ticker ${variant}, trying next variant`);
            } else if (error.message?.includes('rate limit') || error.message?.includes('403')) {
              log.warn(`Finnhub rate limit/403 for ${variant}, trying next variant`);
            } else {
              log.debug(`Finnhub failed for ${variant}, trying next variant:`, error.message);
            }
          }
        }
        
        // ✅ FIX TSMC : Logger en WARN si toutes les variantes ont échoué
        const hasOtherApis = hasApiKey('POLYGON');
        if (hasOtherApis) {
          log.warn(`[yahooFinanceService] Finnhub failed for all variants of ${ticker} (tried: ${tickerVariants.join(', ')}), trying fallback. Last error:`, lastError?.message);
        } else {
          log.warn(`[yahooFinanceService] Finnhub failed for all variants of ${ticker} (tried: ${tickerVariants.join(', ')}):`, lastError?.message);
        }
        if (lastError) {
          this.onFailure(lastError);
        }
      }
    }

    // ✅ SOLUTION #1 : Retirer Polygon de la chaîne de fallback pour quotes
    // Polygon est TRÈS limité (5 req/jour) et doit être réservé pour données historiques uniquement
    // Polygon sera utilisé uniquement dans getHistoricalData(), pas ici
    // Cela économise 5 requêtes/jour pour des données plus importantes (historiques)
    
    // Polygon retiré de getQuoteData() - utiliser uniquement dans getHistoricalData()

    // ✅ SOLUTION #7 : Yahoo Finance scraping comme fallback ultime (gratuit, pas de quota)
    // Yahoo Finance a des endpoints publics accessibles sans clé API
    // ✅ FIX CRITIQUE : Appeler Yahoo Finance AVANT le cache stale pour obtenir le vrai prix
    try {
      const yahooData = await this.fetchYahooFinanceScraping(ticker);
      if (yahooData && yahooData.prixActuel && yahooData.prixActuel > 0) {
        log.info(`[yahooFinanceService] Yahoo Finance scraping réussi pour ${ticker}`);
        // Sauvegarder en cache
        await financeStorage.setYahooCache(ticker, yahooData);
        intelligentCache.set(ticker, yahooData, { ttl: this.cacheTTL.quote });
        this.onSuccess();
        return yahooData;
      }
    } catch (error) {
      log.warn(`[yahooFinanceService] Yahoo Finance scraping échoué pour ${ticker}:`, error.message);
      // Continuer vers stale cache
    }

    // ✅ PHASE 3.14 : Dernier recours : données locales (stale cache autorisé seulement ici)
    // ✅ FIX CRITIQUE : Ne pas utiliser le cache stale si c'est un prix d'entrée (on veut le vrai prix)
    const cached = await financeStorage.getYahooCache(ticker, {
      ttl: this.cacheTTL.quote,
      allowStale: true, // Dernier recours : autoriser stale cache
      maxStaleAge: 30 * 24 * 60 * 60 * 1000 // Max 30 jours pour stale cache (très permissif)
    });
    if (cached) {
      // ✅ FIX CRITIQUE : Si le cache est un prix d'entrée, ne pas l'utiliser même en dernier recours
      // (Yahoo Finance a déjà été essayé, mais on préfère utiliser prixEntree fourni plutôt que cache stale)
      if (cached._isPrixEntree) {
        log.debug(`Stale cache contains prixEntree for ${ticker}, will use prixEntree from options instead if available`);
        // Ne pas retourner le cache stale avec prix d'entrée, continuer vers prixEntree option
      } else {
        log.debug(`Using stale cache as last resort for ${ticker}`);
        return cached;
      }
    }

    // ✅ SOLUTION #3 : Utiliser prixEntree comme fallback si fourni
    // Si aucune source disponible et pas de cache, utiliser prixEntree si fourni
    // Cela permet d'afficher un prix même si aucune API n'est disponible
    if (prixEntree && prixEntree > 0) {
      log.debug(`No data available for ${ticker} from any source and no cache, using prixEntree as fallback`);
      const fallbackData = {
        prixActuel: prixEntree,
        variationJour: 0,
        volume: 0,
        capitalisation: 0,
        previousClose: prixEntree,
        open: prixEntree,
        high: prixEntree,
        low: prixEntree,
        _fallback: true,
        _isPrixEntree: true, // Indicateur que c'est le prix d'entrée
        _timestamp: Date.now()
      };
      
      // Sauvegarder en cache pour utilisation future
      await financeStorage.setYahooCache(ticker, fallbackData);
      intelligentCache.set(ticker, fallbackData, { ttl: this.cacheTTL.quote });
      
      return fallbackData;
    }
    
    // Si prixEntree non fourni, retourner objet minimal
    log.warn(`No data available for ${ticker} from any source and no cache, returning minimal data object`);
    return {
      prixActuel: null,
      variationJour: 0,
      volume: 0,
      capitalisation: 0,
      previousClose: null,
      open: null,
      high: null,
      low: null,
      _fallback: true, // Indicateur que c'est un fallback
      _timestamp: Date.now()
    };
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
    
    // ✅ FIX CRITIQUE : Détecter le message "Information" qui indique un rate limit
    // Alpha Vantage retourne {'Information': '...'} au lieu de {'Global Quote': {...}} quand rate limit
    if (response['Information']) {
      const infoMsg = response['Information'];
      // Si c'est un message de rate limit, throw une erreur spécifique
      if (infoMsg.includes('rate limit') || infoMsg.includes('Thank you for using Alpha Vantage') || 
          infoMsg.includes('spreading out') || infoMsg.includes('1 request per second') ||
          infoMsg.includes('free API requests')) {
        throw new Error('Alpha Vantage API rate limit exceeded (1 req/sec). Please wait before retrying.');
      }
      // Sinon, c'est peut-être une autre information, logger et throw
      log.warn(`Alpha Vantage returned Information message for ${ticker}:`, infoMsg);
      throw new Error(`Alpha Vantage API information: ${infoMsg}`);
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
    
    // ✅ CORRECTION : Vérifier rate limit (ancien format)
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

  /**
   * ✅ SOLUTION #7 : Yahoo Finance scraping (fallback ultime gratuit)
   * Utilise l'API publique de Yahoo Finance sans clé API
   * 
   * @param {string} ticker - Ticker symbol (ex: TSMC, TSMC.TW, NVDA)
   * @returns {Promise<Object>} Données normalisées
   */
  async fetchYahooFinanceScraping(ticker) {
    // ✅ FIX TSMC : Essayer plusieurs variantes pour exchanges internationaux
    const tickerVariants = this._generateTickerVariants(ticker);
    
    for (const variant of tickerVariants) {
      try {
        // ✅ FIX CORS : Utiliser le proxy Vite pour contourner les erreurs CORS
        // En développement, utiliser le proxy local
        // En production, il faudra un proxy backend ou une autre solution
        const isDev = import.meta.env.DEV;
        const baseUrl = isDev 
          ? '/api/yahoo-finance'  // Proxy Vite en développement
          : 'https://query1.finance.yahoo.com';  // Direct en production (nécessitera un proxy backend)
        
        const url = `${baseUrl}/v8/finance/chart/${encodeURIComponent(variant)}?interval=1d&range=1d`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
            // User-Agent sera ajouté par le proxy en dev
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            // Ticker non trouvé, essayer variante suivante
            log.debug(`Yahoo Finance 404 pour ${variant}, essai variante suivante`);
            continue;
          }
          // ✅ FIX CORS : Logger les erreurs HTTP pour diagnostic
          log.warn(`Yahoo Finance HTTP ${response.status} pour ${variant}`);
          throw new Error(`Yahoo Finance HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // ✅ FIX CORS : Logger succès pour diagnostic
        if (variant !== ticker) {
          log.info(`[yahooFinanceService] Yahoo Finance scraping réussi pour ${ticker} avec variant ${variant}`);
        }
        
        // Vérifier structure réponse Yahoo Finance
        if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
          continue; // Essayer variante suivante
        }
        
        const result = data.chart.result[0];
        const meta = result.meta;
        
        if (!meta || !meta.regularMarketPrice) {
          continue; // Essayer variante suivante
        }
        
        let prixActuel = meta.regularMarketPrice;
        const previousClose = meta.previousClose || prixActuel;
        const variationJour = previousClose ? ((prixActuel - previousClose) / previousClose) * 100 : 0;
        
        // ✅ FIX TSMC : Convertir TWD vers USD si nécessaire
        // Le prix d'entrée de l'utilisateur est en USD (153,29 $US), donc on doit toujours avoir le prix en USD
        // Ratio : 1 ADR TSM (USD) ≈ 5 actions Taiwan (TWD), donc prix ADR USD ≈ prix TWD / 5
        // ✅ FIX CRITIQUE : Pour TSMC, si prix > 500, c'est probablement en TWD et doit être converti
        const isTSMCTicker = ticker.toUpperCase() === 'TSMC' || /^2330$/i.test(ticker);
        const isTaiwanVariant = variant.includes('.TW') || variant === '2330' || variant.startsWith('2330') || variant.includes('2330');
        const isTSMVariant = variant === 'TSM' || variant === 'TSMC';
        const isLikelyTWD = prixActuel > 500; // Prix Taiwan typiquement > 500 TWD, prix USD ADR typiquement < 400
        
        // ✅ FIX CRITIQUE : Pour TSMC, convertir si prix > 500 (probablement TWD)
        if (isTSMCTicker && isLikelyTWD && !isTSMVariant) {
          log.warn(`[yahooFinanceService] Prix suspect (>500) pour TSMC variant ${variant} (${prixActuel}), conversion TWD→USD appliquée`);
          // Conversion TWD vers USD ADR : 1 ADR = 5 actions Taiwan
          // Prix ADR USD ≈ Prix TWD / 5
          prixActuel = prixActuel / 5;
          log.info(`[yahooFinanceService] Prix converti en USD ADR: ${prixActuel}`);
        } else if (isTaiwanVariant && isLikelyTWD) {
          log.info(`[yahooFinanceService] Prix détecté en TWD pour ${variant} (${prixActuel}), conversion en USD ADR`);
          prixActuel = prixActuel / 5;
          log.info(`[yahooFinanceService] Prix converti en USD ADR: ${prixActuel}`);
        } else if (isTSMVariant) {
          // ✅ FIX : TSM (ADR US) est déjà en USD, pas de conversion nécessaire
          log.debug(`[yahooFinanceService] Prix en USD (ADR) pour ${variant}: ${prixActuel}`);
        }
        
        // ✅ FIX TSMC : Si variant différent du ticker original, logger pour info
        if (variant !== ticker) {
          log.info(`[yahooFinanceService] Ticker ${ticker} trouvé avec variant ${variant} sur Yahoo Finance, prix: ${prixActuel} USD`);
        }
        
        const normalized = {
          prixActuel,
          variationJour: Math.round(variationJour * 100) / 100,
          volume: meta.regularMarketVolume || 0,
          capitalisation: meta.marketCap || 0,
          previousClose,
          open: meta.regularMarketOpen || prixActuel,
          high: meta.regularMarketDayHigh || prixActuel,
          low: meta.regularMarketDayLow || prixActuel,
          _source: 'yahoo_scraping',
          _variant: variant, // ✅ FIX : Stocker la variante utilisée pour debug
          _timestamp: Date.now()
        };
        
        return normalized;
      } catch (error) {
        // ✅ FIX CORS : Logger les erreurs CORS spécifiquement
        if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
          log.warn(`[yahooFinanceService] Erreur CORS/réseau pour ${variant}:`, error.message);
          // En cas d'erreur CORS, essayer variante suivante
          if (tickerVariants.indexOf(variant) < tickerVariants.length - 1) {
            continue;
          }
          // Si toutes les variantes ont échoué à cause de CORS, throw une erreur spécifique
          throw new Error(`Yahoo Finance CORS error for all variants of ${ticker}. Please check proxy configuration.`);
        }
        
        // Si erreur réseau ou autre, essayer variante suivante
        if (tickerVariants.indexOf(variant) < tickerVariants.length - 1) {
          log.debug(`Yahoo Finance scraping failed for ${variant}, trying next variant:`, error.message);
          continue;
        }
        // Dernière variante, throw l'erreur
        throw error;
      }
    }
    
    // Si toutes les variantes ont échoué
    throw new Error(`Yahoo Finance scraping failed for all variants of ${ticker}`);
  }

  async fetchPolygon(ticker) {
    // ✅ FIX: Déduplication des requêtes en cours
    const requestKey = `polygon_quote_${ticker}`;
    if (this.pendingRequests.has(requestKey)) {
      log.debug(`[yahooFinanceService] Requête Polygon en cours pour ${ticker}, réutilisation...`);
      return await this.pendingRequests.get(requestKey);
    }
    
    const requestPromise = (async () => {
      try {
        const apiKey = getApiKey('POLYGON');
        const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apikey=${apiKey}`;
        
        const response = await this.fetchWithRetry(url);
        
        if (response.status !== 'OK') {
          throw new Error(response.status);
        }
        
        return response;
      } finally {
        // Retirer de pending requests après complétion
        this.pendingRequests.delete(requestKey);
      }
    })();
    
    // Stocker la promesse pour déduplication
    this.pendingRequests.set(requestKey, requestPromise);
    return await requestPromise;
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
            // ✅ FIX: Rate limit Polygon - ne pas retry immédiatement, activer circuit breaker
            const retryAfter = response.headers.get('Retry-After');
            const retryAfterSeconds = retryAfter ? parseInt(retryAfter) : 60; // Par défaut 60s pour Polygon
            
            // Si c'est Polygon et qu'on a un retry-after, attendre plus longtemps
            if (url.includes('polygon.io')) {
              // Polygon a une limite stricte de 5 req/min, attendre au moins 12 secondes
              const waitTime = Math.max(12000, retryAfterSeconds * 1000);
              if (attempt < maxRetries - 1) {
                log.warn(`[yahooFinanceService] Polygon rate limit (429), attente ${waitTime}ms avant retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                continue;
              }
            } else if (retryAfterSeconds < 60 && attempt < maxRetries - 1) {
              // Autres APIs : retry après le délai indiqué si < 60s
              await new Promise(resolve => setTimeout(resolve, retryAfterSeconds * 1000));
              continue;
            }
            throw new Error(`HTTP 429 Too Many Requests - Rate limit exceeded${retryAfter ? ` (retry after ${retryAfterSeconds}s)` : ''}`);
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
        // ✅ FIX: Vérifier circuit breaker Polygon AVANT requête
        if (this.polygonDisabled) {
          // Vérifier si on peut réactiver (après 5 min)
          if (this.polygon429ResetTime && Date.now() > this.polygon429ResetTime) {
            log.info('[yahooFinanceService] Réactivation Polygon après période de désactivation (5 min)');
            this.polygonDisabled = false;
            this.polygon429ResetTime = null;
            this._savePolygonCircuitBreakerState();
          } else {
            // Circuit breaker actif : skip Polygon, utiliser cache
            log.debug(`[yahooFinanceService] Circuit breaker Polygon actif (429) - skip historique pour ${ticker}, utilisation cache`);
            const cached = await financeStorage.getYahooCache(cacheKey, {
              ttl: this.cacheTTL.historical,
              allowStale: true
            });
            if (cached) {
              return cached;
            }
          }
        }
        
        // ✅ FIX: Vérifier quota AVANT d'essayer de consommer
        if (!financeQuotaManager.canUseApi('POLYGON')) {
          log.debug(`[yahooFinanceService] Quota Polygon dépassé pour historique ${ticker}, utilisation cache`);
          const cached = await financeStorage.getYahooCache(cacheKey, {
            ttl: this.cacheTTL.historical,
            allowStale: true
          });
          if (cached) {
            return cached;
          }
          // Si pas de cache, continuer vers le fallback stale cache à la fin
        } else {
          // Essayer seulement si quota disponible
          try {
            // ✅ FIX: Utiliser rate limiting via financeQuotaManager
            await financeQuotaManager.consumeQuota('POLYGON', PRIORITY.HISTORICAL_DATA);
            
            const data = await this.fetchPolygonHistorical(ticker, period);
            await financeStorage.setYahooCache(cacheKey, data);
            this.onSuccess();
            financeQuotaManager.recordSuccess('POLYGON');
            return this.normalizeHistoricalData(data, 'polygon');
          } catch (error) {
            // ✅ FIX: Désactiver Polygon si erreur 429
            if (error.message && (error.message.includes('429') || error.message.includes('rate limit') || error.message.includes('Too Many Requests') || error.message.includes('quota exceeded'))) {
              this.polygonDisabled = true;
              this.polygon429ResetTime = Date.now() + this.POLYGON_429_RESET_MS;
              this._savePolygonCircuitBreakerState();
              if (!this._polygonCircuitBreakerLogged) {
                log.warn(`[yahooFinanceService] Circuit breaker Polygon activé (erreur 429/quota). Désactivation pour 5 min.`);
                this._polygonCircuitBreakerLogged = true;
              }
              financeQuotaManager.recordFailure('POLYGON', error);
            }
            
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
      }

      return [];
    } catch (error) {
      // ✅ CORRECTION : Logger selon type d'erreur (rate limit/temporaire = warn, critique = error)
      const hasAnyApi = hasApiKey('ALPHA_VANTAGE') || hasApiKey('FINNHUB') || hasApiKey('POLYGON');
      const errorMsg = error?.message || String(error);
      
      // Erreurs temporaires (rate limit, delayed, network, quota) = warn seulement
      const isTemporaryError = errorMsg.includes('rate limit') || 
                               errorMsg.includes('DELAYED') || 
                               errorMsg.includes('network') ||
                               errorMsg.includes('429') ||
                               errorMsg.includes('quota exceeded') ||
                               errorMsg.includes('timeout');
      
      if (hasAnyApi) {
        if (isTemporaryError) {
          // ✅ CORRECTION : Erreur temporaire = logger en debug seulement (pas de warning répétitif)
          log.debug(`Temporary error fetching historical data for ${ticker}:`, errorMsg);
        } else {
          // Erreur critique : logger en error seulement si pas de cache disponible
          const cached = await financeStorage.getYahooCache(cacheKey, {
            ttl: this.cacheTTL.historical,
            allowStale: true,
            maxStaleAge: 7 * 24 * 60 * 60 * 1000
          });
          if (!cached) {
            log.error(`Error fetching historical data for ${ticker} (no fallback available):`, errorMsg);
          } else {
            log.debug(`Error fetching historical data for ${ticker}, using stale cache:`, errorMsg);
          }
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
    // ✅ FIX: Déduplication des requêtes en cours
    const requestKey = `polygon_historical_${ticker}_${period}`;
    if (this.pendingRequests.has(requestKey)) {
      log.debug(`[yahooFinanceService] Requête Polygon historique en cours pour ${ticker} (${period}), réutilisation...`);
      return await this.pendingRequests.get(requestKey);
    }
    
    const requestPromise = (async () => {
      try {
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
      } finally {
        // Retirer de pending requests après complétion
        this.pendingRequests.delete(requestKey);
      }
    })();
    
    // Stocker la promesse pour déduplication
    this.pendingRequests.set(requestKey, requestPromise);
    return await requestPromise;
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

