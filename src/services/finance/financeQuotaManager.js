/**
 * Gestionnaire de quota intelligent pour les appels API Finance
 * 
 * Gère intelligemment les quotas pour éviter de dépasser les limites :
 * - Répartition entre différentes clés API
 * - Cache intelligent avec TTL adaptatif
 * - Priorisation des appels (portfolio > indices > autres)
 * - Rotation automatique des clés
 * - Circuit breaker pour éviter surcharge
 * 
 * @module services/finance/financeQuotaManager
 */

import { TokenBucket } from '../../utils/tokenBucket';
import { getApiKey, hasApiKey } from '../../config/apiKeys';
import logger from '../../utils/logger';

const log = logger.module('financeQuotaManager');

/**
 * Configuration des quotas par API
 * Basé sur les limites réelles des APIs gratuites
 */
const QUOTA_CONFIG = {
  ALPHA_VANTAGE: {
    free: { requestsPerDay: 25, requestsPerMinute: 5 },
    premium: { requestsPerDay: 500, requestsPerMinute: 12 }
  },
  FINNHUB: {
    free: { requestsPerDay: 60, requestsPerMinute: 60 },
    premium: { requestsPerDay: 1000, requestsPerMinute: 60 }
  },
  POLYGON: {
    free: { requestsPerDay: 5, requestsPerMinute: 5 },
    premium: { requestsPerDay: 1000, requestsPerMinute: 5 }
  },
  COINGECKO: {
    free: { requestsPerMinute: 10, requestsPerMonth: 10000 },
    premium: { requestsPerMinute: 50, requestsPerMonth: 100000 }
  },
  COINCAP: {
    free: { requestsPerMinute: 200, requestsPerDay: 10000 },
    premium: { requestsPerMinute: 200, requestsPerDay: 100000 }
  }
};

/**
 * Priorités des appels (plus élevé = plus prioritaire)
 */
export const PRIORITY = {
  PORTFOLIO_REFRESH: 10,      // Portfolio utilisateur (le plus important)
  MARKET_INDICES: 8,          // Indices boursiers
  COMMODITIES: 7,             // Matières premières
  CRYPTO: 6,                  // Cryptomonnaies
  NEWS: 5,                    // Actualités
  HISTORICAL_DATA: 4,         // Données historiques (corrélations)
  ECONOMIC_CALENDAR: 3,       // Calendrier économique
  SENTIMENT: 2,               // Analyse de sentiment
  PREDICTIONS: 1              // Prédictions (moins prioritaire)
};

/**
 * TTL du cache selon le type de données
 */
const CACHE_TTL = {
  PORTFOLIO: 1 * 60 * 1000,        // 1 min (données critiques)
  MARKET_INDICES: 5 * 60 * 1000,   // 5 min (change moins souvent)
  COMMODITIES: 5 * 60 * 1000,      // 5 min
  CRYPTO: 2 * 60 * 1000,           // 2 min (plus volatil)
  NEWS: 15 * 60 * 1000,            // 15 min
  HISTORICAL: 60 * 60 * 1000,      // 1h (données historiques)
  ECONOMIC_CALENDAR: 24 * 60 * 60 * 1000, // 24h (événements futurs)
  SENTIMENT: 10 * 60 * 1000,       // 10 min
  PREDICTIONS: 30 * 60 * 1000      // 30 min
};

/**
 * Gestionnaire de quota intelligent
 */
class FinanceQuotaManager {
  constructor() {
    // Token buckets par API (gestion minute)
    this.tokenBuckets = {
      ALPHA_VANTAGE: new TokenBucket(5, 60000),   // 5 req/min
      FINNHUB: new TokenBucket(60, 60000),        // 60 req/min
      POLYGON: new TokenBucket(5, 60000),          // 5 req/min
      COINGECKO: new TokenBucket(10, 60000),      // 10 req/min
      COINCAP: new TokenBucket(200, 60000)         // 200 req/min
    };
    
    // Compteurs quotidiens (reset à minuit)
    this.dailyCounters = {
      ALPHA_VANTAGE: { count: 0, resetAt: this.getMidnightTimestamp() },
      FINNHUB: { count: 0, resetAt: this.getMidnightTimestamp() },
      POLYGON: { count: 0, resetAt: this.getMidnightTimestamp() },
      COINGECKO: { count: 0, resetAt: this.getMidnightTimestamp() },
      COINCAP: { count: 0, resetAt: this.getMidnightTimestamp() }
    };
    
    // Queue de requêtes par priorité
    this.requestQueue = [];
    this.processingQueue = false;
    
    // Circuit breakers par API
    this.circuitBreakers = {
      ALPHA_VANTAGE: { failures: 0, threshold: 3, state: 'CLOSED', nextAttempt: 0 },
      FINNHUB: { failures: 0, threshold: 3, state: 'CLOSED', nextAttempt: 0 },
      POLYGON: { failures: 0, threshold: 3, state: 'CLOSED', nextAttempt: 0 },
      COINGECKO: { failures: 0, threshold: 3, state: 'CLOSED', nextAttempt: 0 },
      COINCAP: { failures: 0, threshold: 3, state: 'CLOSED', nextAttempt: 0 }
    };
    
    // Rotation des clés API (si plusieurs clés disponibles)
    this.apiKeyRotation = {
      ALPHA_VANTAGE: 0,
      FINNHUB: 0,
      POLYGON: 0
    };
    
    // Charger compteurs depuis localStorage
    this.loadCounters();
    
    // Reset compteurs quotidiens si nécessaire
    this.checkDailyReset();
  }
  
  /**
   * Obtient le timestamp de minuit aujourd'hui
   */
  getMidnightTimestamp() {
    const now = new Date();
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return midnight.getTime();
  }
  
  /**
   * Charge les compteurs depuis localStorage
   */
  loadCounters() {
    try {
      const stored = localStorage.getItem('finance_quota_counters');
      if (stored) {
        const data = JSON.parse(stored);
        const midnight = this.getMidnightTimestamp();
        
        // Si c'est un nouveau jour, reset
        if (data.resetAt < midnight) {
          this.resetDailyCounters();
        } else {
          this.dailyCounters = data;
        }
      }
    } catch (error) {
      log.warn('Error loading quota counters:', error);
    }
  }
  
  /**
   * Sauvegarde les compteurs dans localStorage
   */
  saveCounters() {
    try {
      localStorage.setItem('finance_quota_counters', JSON.stringify(this.dailyCounters));
    } catch (error) {
      log.warn('Error saving quota counters:', error);
    }
  }
  
  /**
   * Reset les compteurs quotidiens
   */
  resetDailyCounters() {
    const midnight = this.getMidnightTimestamp();
    Object.keys(this.dailyCounters).forEach(api => {
      this.dailyCounters[api] = { count: 0, resetAt: midnight };
    });
    this.saveCounters();
    log.info('Daily quota counters reset');
  }
  
  /**
   * Vérifie et reset si nouveau jour
   */
  checkDailyReset() {
    const now = Date.now();
    const midnight = this.getMidnightTimestamp();
    
    // Si minuit est passé, reset
    if (now >= midnight + 24 * 60 * 60 * 1000) {
      this.resetDailyCounters();
    }
    
    // Planifier le prochain reset
    const nextMidnight = midnight + 24 * 60 * 60 * 1000;
    const delay = nextMidnight - now;
    setTimeout(() => this.resetDailyCounters(), delay);
  }
  
  /**
   * Vérifie si une API peut être utilisée
   */
  canUseApi(apiName) {
    // Vérifier circuit breaker
    const breaker = this.circuitBreakers[apiName];
    if (breaker.state === 'OPEN') {
      if (Date.now() < breaker.nextAttempt) {
        return false;
      }
      breaker.state = 'HALF_OPEN';
    }
    
    // Vérifier quota journalier
    const counter = this.dailyCounters[apiName];
    const config = QUOTA_CONFIG[apiName];
    if (!config) return false;
    
    const dailyLimit = config.free?.requestsPerDay || config.premium?.requestsPerDay || 100;
    // ✅ FIX CRITIQUE : Vérifier que le compteur ne dépasse pas la limite
    // Si le compteur est déjà à la limite ou au-dessus, refuser
    if (counter.count >= dailyLimit) {
      log.warn(`Daily quota exceeded for ${apiName}: ${counter.count}/${dailyLimit}`);
      return false;
    }
    
    // ✅ FIX CRITIQUE : Si le compteur est proche de la limite (à 1 de la limite), refuser aussi
    // Cela évite de dépasser la limite
    if (counter.count >= dailyLimit - 1) {
      log.debug(`Daily quota nearly exceeded for ${apiName}: ${counter.count}/${dailyLimit}, preventing last request`);
      return false;
    }
    
    return true;
  }
  
  /**
   * Consomme un token et incrémente le compteur
   */
  async consumeQuota(apiName, priority = PRIORITY.PREDICTIONS) {
    if (!this.canUseApi(apiName)) {
      throw new Error(`Cannot use ${apiName}: quota exceeded or circuit breaker open`);
    }
    
    // Consommer token bucket (limite par minute)
    const bucket = this.tokenBuckets[apiName];
    if (bucket) {
      await bucket.consume();
    }
    
    // ✅ FIX CRITIQUE : Vérifier à nouveau avant d'incrémenter (double-check pour éviter dépassement)
    const config = QUOTA_CONFIG[apiName];
    if (config) {
      const dailyLimit = config.free?.requestsPerDay || config.premium?.requestsPerDay || 100;
      const counter = this.dailyCounters[apiName];
      
      // Si on est déjà à la limite, ne pas incrémenter
      if (counter.count >= dailyLimit) {
        log.warn(`[financeQuotaManager] Quota already exceeded for ${apiName}: ${counter.count}/${dailyLimit}, not consuming`);
        throw new Error(`Cannot use ${apiName}: quota already exceeded`);
      }
    }
    
    // Incrémenter compteur journalier
    this.dailyCounters[apiName].count++;
    this.saveCounters();
    
    log.debug(`Quota consumed for ${apiName}: ${this.dailyCounters[apiName].count} today`);
  }
  
  /**
   * Enregistre un succès (reset circuit breaker si nécessaire)
   */
  recordSuccess(apiName) {
    const breaker = this.circuitBreakers[apiName];
    if (breaker.state === 'HALF_OPEN') {
      breaker.state = 'CLOSED';
      breaker.failures = 0;
    }
  }
  
  /**
   * Enregistre un échec (peut ouvrir circuit breaker)
   */
  recordFailure(apiName, error) {
    const breaker = this.circuitBreakers[apiName];
    breaker.failures++;
    
    // Si erreur rate limit, ouvrir circuit breaker
    if (error?.message?.includes('rate limit') || error?.message?.includes('429')) {
      breaker.state = 'OPEN';
      breaker.nextAttempt = Date.now() + 5 * 60 * 1000; // 5 min
      log.warn(`Circuit breaker OPEN for ${apiName} due to rate limit`);
    } else if (breaker.failures >= breaker.threshold) {
      breaker.state = 'OPEN';
      breaker.nextAttempt = Date.now() + 2 * 60 * 1000; // 2 min
      log.warn(`Circuit breaker OPEN for ${apiName} after ${breaker.failures} failures`);
    }
  }
  
  /**
   * Sélectionne la meilleure API pour un type de données
   */
  selectBestApi(dataType) {
    const availableApis = [];
    
    // Selon le type de données, proposer différentes APIs
    switch (dataType) {
      case 'STOCK':
      case 'INDEX':
        if (hasApiKey('ALPHA_VANTAGE') && this.canUseApi('ALPHA_VANTAGE')) {
          availableApis.push({ name: 'ALPHA_VANTAGE', priority: 1 });
        }
        if (hasApiKey('FINNHUB') && this.canUseApi('FINNHUB')) {
          availableApis.push({ name: 'FINNHUB', priority: 2 });
        }
        if (hasApiKey('POLYGON') && this.canUseApi('POLYGON')) {
          availableApis.push({ name: 'POLYGON', priority: 3 });
        }
        break;
        
      case 'CRYPTO':
        // CoinCap fonctionne sans clé API (gratuit), toujours disponible
        if (this.canUseApi('COINCAP')) {
          availableApis.push({ name: 'COINCAP', priority: 1 }); // Plus généreux, gratuit
        }
        if (hasApiKey('COINGECKO') && this.canUseApi('COINGECKO')) {
          availableApis.push({ name: 'COINGECKO', priority: 2 });
        }
        break;
        
      case 'COMMODITY':
        // Commodities peuvent utiliser Alpha Vantage ou Finnhub
        if (hasApiKey('ALPHA_VANTAGE') && this.canUseApi('ALPHA_VANTAGE')) {
          availableApis.push({ name: 'ALPHA_VANTAGE', priority: 1 });
        }
        if (hasApiKey('FINNHUB') && this.canUseApi('FINNHUB')) {
          availableApis.push({ name: 'FINNHUB', priority: 2 });
        }
        break;
    }
    
    // Retourner la première disponible (triée par priorité)
    return availableApis.length > 0 ? availableApis[0].name : null;
  }
  
  /**
   * Obtient le TTL de cache pour un type de données
   */
  getCacheTTL(dataType) {
    return CACHE_TTL[dataType] || CACHE_TTL.PREDICTIONS;
  }
  
  /**
   * Obtient les statistiques de quota
   */
  getQuotaStats() {
    return {
      dailyCounters: { ...this.dailyCounters },
      circuitBreakers: { ...this.circuitBreakers },
      availableApis: {
        ALPHA_VANTAGE: hasApiKey('ALPHA_VANTAGE') && this.canUseApi('ALPHA_VANTAGE'),
        FINNHUB: hasApiKey('FINNHUB') && this.canUseApi('FINNHUB'),
        POLYGON: hasApiKey('POLYGON') && this.canUseApi('POLYGON'),
        COINGECKO: hasApiKey('COINGECKO') && this.canUseApi('COINGECKO'),
        COINCAP: hasApiKey('COINCAP') && this.canUseApi('COINCAP')
      }
    };
  }
}

// Instance singleton
export const financeQuotaManager = new FinanceQuotaManager();

export default financeQuotaManager;

