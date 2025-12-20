/**
 * Service de cache centralisé pour le module Finance
 * 
 * ✅ PHASE 4 - Étape 4.1 : Service cache centralisé
 * - Unifie toutes les stratégies de cache (mémoire, IndexedDB, TTL)
 * - API cohérente pour tous les types de données
 * - Gestion TTL intelligente avec fallback stale
 * - Support multi-niveaux (L1: mémoire, L2: IndexedDB)
 * - Statistiques et monitoring
 * 
 * @module services/finance/cacheService
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Phase 4, Étape 21
 */

import { financeStorage } from './financeStorage';
import logger from '../../utils/logger';

const log = logger.module('cacheService');

/**
 * Types de cache disponibles
 */
export const CACHE_TYPES = {
  MEMORY: 'memory',      // Cache en mémoire uniquement (rapide, volatile)
  INDEXEDDB: 'indexeddb', // Cache IndexedDB (persistant, plus lent)
  HYBRID: 'hybrid'       // Cache hybride (mémoire + IndexedDB)
};

/**
 * Stratégies TTL par défaut (en millisecondes)
 */
export const DEFAULT_TTL = {
  QUOTE: 15 * 60 * 1000,        // 15 min pour données live
  HISTORICAL: 60 * 60 * 1000,   // 1h pour historique
  CHART: 5 * 60 * 1000,         // 5 min pour graphiques
  CALCULATION: 10 * 60 * 1000,  // 10 min pour calculs
  RECOMMENDATION: 5 * 60 * 1000 // 5 min pour recommandations
};

/**
 * Service de cache centralisé
 */
class CacheService {
  constructor() {
    // Cache L1 (mémoire) - Map pour accès O(1)
    this.memoryCache = new Map();
    
    // Statistiques
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
    
    // Configuration par défaut
    this.defaultConfig = {
      type: CACHE_TYPES.HYBRID,
      ttl: DEFAULT_TTL.QUOTE,
      allowStale: false,
      maxMemorySize: 1000 // Nombre max d'entrées en mémoire
    };
  }

  /**
   * Générer clé de cache normalisée
   * @param {string} prefix - Préfixe (ex: 'quote', 'historical')
   * @param {string|Array} keys - Clés supplémentaires
   * @returns {string} Clé normalisée
   */
  generateKey(prefix, ...keys) {
    const keyParts = [prefix, ...keys].filter(Boolean);
    return keyParts.join('_');
  }

  /**
   * Vérifier si une entrée de cache est expirée
   * @param {Object} entry - Entrée de cache avec timestamp
   * @param {number} ttl - TTL en millisecondes
   * @returns {boolean} True si expiré
   */
  isExpired(entry, ttl) {
    if (!entry || !entry.timestamp) return true;
    const age = Date.now() - entry.timestamp;
    return age >= ttl;
  }

  /**
   * Récupérer depuis cache mémoire (L1)
   * @param {string} key - Clé de cache
   * @param {number} ttl - TTL en millisecondes
   * @param {boolean} allowStale - Autoriser cache expiré
   * @returns {Object|null} Données en cache ou null
   */
  getFromMemory(key, ttl, allowStale = false) {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const expired = this.isExpired(entry, ttl);
    if (expired && !allowStale) {
      // Supprimer entrée expirée
      this.memoryCache.delete(key);
      return null;
    }

    if (expired && allowStale) {
      log.debug(`[CacheService] Using stale memory cache for ${key}`);
    }

    this.stats.hits++;
    return entry.data;
  }

  /**
   * Sauvegarder dans cache mémoire (L1)
   * @param {string} key - Clé de cache
   * @param {any} data - Données à mettre en cache
   * @param {number} ttl - TTL en millisecondes
   */
  setInMemory(key, data, ttl) {
    // ✅ PHASE 4.1 : Limiter taille cache mémoire (évite memory leaks)
    if (this.memoryCache.size >= this.defaultConfig.maxMemorySize) {
      // Supprimer entrées les plus anciennes (FIFO)
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    this.stats.sets++;
  }

  /**
   * Récupérer depuis cache IndexedDB (L2)
   * @param {string} key - Clé de cache
   * @param {number} ttl - TTL en millisecondes
   * @param {boolean} allowStale - Autoriser cache expiré
   * @returns {Promise<Object|null>} Données en cache ou null
   */
  async getFromIndexedDB(key, ttl, allowStale = false) {
    try {
      const cached = await financeStorage.getYahooCache(key, { ttl, allowStale });
      if (cached) {
        this.stats.hits++;
        // ✅ PHASE 4.1 : Promouvoir vers cache mémoire (L1) pour accès rapide
        this.setInMemory(key, cached, ttl);
      } else {
        this.stats.misses++;
      }
      return cached;
    } catch (error) {
      log.error(`[CacheService] Error getting from IndexedDB for ${key}:`, error);
      this.stats.errors++;
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Sauvegarder dans cache IndexedDB (L2)
   * @param {string} key - Clé de cache
   * @param {any} data - Données à mettre en cache
   * @returns {Promise<void>}
   */
  async setInIndexedDB(key, data) {
    try {
      await financeStorage.setYahooCache(key, data);
      this.stats.sets++;
    } catch (error) {
      log.error(`[CacheService] Error setting in IndexedDB for ${key}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Récupérer depuis cache (API unifiée)
   * 
   * @param {string} key - Clé de cache
   * @param {Object} options - Options
   * @param {string} options.type - Type de cache (memory, indexeddb, hybrid)
   * @param {number} options.ttl - TTL en millisecondes
   * @param {boolean} options.allowStale - Autoriser cache expiré
   * @param {string} options.prefix - Préfixe pour génération clé
   * @returns {Promise<Object|null>} Données en cache ou null
   */
  async get(key, options = {}) {
    const {
      type = this.defaultConfig.type,
      ttl = this.defaultConfig.ttl,
      allowStale = this.defaultConfig.allowStale,
      prefix = null
    } = options;

    // Générer clé normalisée si prefix fourni
    const cacheKey = prefix ? this.generateKey(prefix, key) : key;

    try {
      // Cache mémoire uniquement
      if (type === CACHE_TYPES.MEMORY) {
        return this.getFromMemory(cacheKey, ttl, allowStale);
      }

      // Cache IndexedDB uniquement
      if (type === CACHE_TYPES.INDEXEDDB) {
        return await this.getFromIndexedDB(cacheKey, ttl, allowStale);
      }

      // Cache hybride (mémoire puis IndexedDB)
      if (type === CACHE_TYPES.HYBRID) {
        // 1. Essayer mémoire d'abord (plus rapide)
        const memoryData = this.getFromMemory(cacheKey, ttl, allowStale);
        if (memoryData !== null) {
          return memoryData;
        }

        // 2. Essayer IndexedDB si mémoire vide
        return await this.getFromIndexedDB(cacheKey, ttl, allowStale);
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      log.error(`[CacheService] Error getting cache for ${cacheKey}:`, error);
      this.stats.errors++;
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Sauvegarder dans cache (API unifiée)
   * 
   * @param {string} key - Clé de cache
   * @param {any} data - Données à mettre en cache
   * @param {Object} options - Options
   * @param {string} options.type - Type de cache (memory, indexeddb, hybrid)
   * @param {number} options.ttl - TTL en millisecondes
   * @param {string} options.prefix - Préfixe pour génération clé
   * @returns {Promise<void>}
   */
  async set(key, data, options = {}) {
    const {
      type = this.defaultConfig.type,
      ttl = this.defaultConfig.ttl,
      prefix = null
    } = options;

    // Générer clé normalisée si prefix fourni
    const cacheKey = prefix ? this.generateKey(prefix, key) : key;

    try {
      // Cache mémoire uniquement
      if (type === CACHE_TYPES.MEMORY) {
        this.setInMemory(cacheKey, data, ttl);
        return;
      }

      // Cache IndexedDB uniquement
      if (type === CACHE_TYPES.INDEXEDDB) {
        await this.setInIndexedDB(cacheKey, data);
        return;
      }

      // Cache hybride (mémoire + IndexedDB)
      if (type === CACHE_TYPES.HYBRID) {
        // Sauvegarder dans les deux niveaux
        this.setInMemory(cacheKey, data, ttl);
        await this.setInIndexedDB(cacheKey, data);
        return;
      }
    } catch (error) {
      log.error(`[CacheService] Error setting cache for ${cacheKey}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Supprimer du cache
   * 
   * @param {string} key - Clé de cache
   * @param {Object} options - Options
   * @param {string} options.type - Type de cache (memory, indexeddb, hybrid)
   * @param {string} options.prefix - Préfixe pour génération clé
   * @returns {Promise<void>}
   */
  async delete(key, options = {}) {
    const {
      type = this.defaultConfig.type,
      prefix = null
    } = options;

    const cacheKey = prefix ? this.generateKey(prefix, key) : key;

    try {
      // Supprimer de mémoire
      if (type === CACHE_TYPES.MEMORY || type === CACHE_TYPES.HYBRID) {
        this.memoryCache.delete(cacheKey);
      }

      // Supprimer d'IndexedDB
      if (type === CACHE_TYPES.INDEXEDDB || type === CACHE_TYPES.HYBRID) {
        // Note: financeStorage n'a pas de méthode delete spécifique pour cache
        // On peut utiliser setYahooCache avec null ou laisser expirer
        // Pour l'instant, on supprime seulement de la mémoire
      }

      this.stats.deletes++;
    } catch (error) {
      log.error(`[CacheService] Error deleting cache for ${cacheKey}:`, error);
      this.stats.errors++;
    }
  }

  /**
   * Vider le cache
   * 
   * @param {Object} options - Options
   * @param {string} options.type - Type de cache à vider (memory, indexeddb, hybrid)
   * @returns {Promise<void>}
   */
  async clear(options = {}) {
    const { type = CACHE_TYPES.HYBRID } = options;

    try {
      if (type === CACHE_TYPES.MEMORY || type === CACHE_TYPES.HYBRID) {
        this.memoryCache.clear();
      }

      if (type === CACHE_TYPES.INDEXEDDB || type === CACHE_TYPES.HYBRID) {
        // Note: financeStorage n'a pas de méthode clear spécifique pour cache
        // Pour l'instant, on vide seulement la mémoire
      }

      log.info(`[CacheService] Cache cleared (type: ${type})`);
    } catch (error) {
      log.error('[CacheService] Error clearing cache:', error);
      this.stats.errors++;
    }
  }

  /**
   * Obtenir statistiques du cache
   * @returns {Object} Statistiques (hits, misses, sets, deletes, errors, hitRate, size)
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      memorySize: this.memoryCache.size,
      totalRequests: total
    };
  }

  /**
   * Réinitialiser les statistiques
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }
}

// Instance singleton
export const cacheService = new CacheService();
