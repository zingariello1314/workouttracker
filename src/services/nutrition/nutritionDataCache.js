/**
 * nutritionDataCache.js
 * 
 * ✅ PHASE 10.1 : Cache en mémoire pour requêtes IndexedDB Nutrition
 * 
 * Service de cache intelligent pour optimiser les requêtes IndexedDB :
 * - Cache en mémoire (L1) avec LRU pour accès ultra-rapide (<1ms)
 * - TTL (Time To Live) configurable par type de donnée
 * - Invalidation intelligente après modifications
 * - Éviction automatique LRU (Limite configurable)
 * - Statistiques de performance (optionnel)
 * 
 * Impact attendu : Économie 70-90% sur requêtes IndexedDB répétées
 * 
 * @module services/nutrition/nutritionDataCache
 * @see ../../../docs/nutrition/EVALUATION_CRITIQUE_NUTRITION.md Phase 10.1
 */

import { LRUCache } from '../../utils/lruCache';
import logger from '../../utils/logger';

const log = logger.module('nutritionDataCache');

// ==================== CONSTANTES ====================

/**
 * TTL (Time To Live) par défaut pour chaque type de donnée (en ms)
 * - Données journalières : 60s (changent souvent)
 * - Programmes : 300s (changent rarement)
 * - Favoris : 300s (changent rarement)
 * - Hydratation : 60s (changent souvent)
 */
const DEFAULT_TTL = {
  dailyMeal: 60000,        // 1 minute
  meals: 60000,            // 1 minute
  program: 300000,         // 5 minutes
  activeProgram: 300000,   // 5 minutes
  favoriteFoods: 300000,   // 5 minutes
  hydrationLog: 60000,     // 1 minute
  gamification: 60000,     // 1 minute
};

/**
 * Limite maximale d'entrées par type de cache
 * - Cache global : 100 entrées (équilibre mémoire/performance)
 */
const CACHE_LIMITS = {
  global: 100,
};

// ==================== CLASSE CACHE ENTRÉE ====================

/**
 * Entrée de cache avec métadonnées
 */
class CacheEntry {
  constructor(data, ttl = 60000, type = 'default') {
    this.data = data;
    this.timestamp = Date.now();
    this.ttl = ttl;
    this.type = type;
    this.accessCount = 0;
    this.lastAccess = Date.now();
  }

  /**
   * Vérifie si l'entrée est expirée
   */
  isExpired() {
    const age = Date.now() - this.timestamp;
    return age > this.ttl;
  }

  /**
   * Marque l'entrée comme accédée
   */
  touch() {
    this.accessCount++;
    this.lastAccess = Date.now();
  }

  /**
   * Retourne l'âge de l'entrée en ms
   */
  getAge() {
    return Date.now() - this.timestamp;
  }
}

// ==================== SERVICE CACHE ====================

/**
 * Service de cache en mémoire pour données Nutrition IndexedDB
 * 
 * ✅ PHASE 10.1 : Cache intelligent avec LRU et TTL
 * 
 * Usage :
 * ```js
 * const cache = NutritionDataCache.getInstance();
 * 
 * // Get avec cache automatique
 * const dailyMeal = await cache.get('dailyMeal_2025-01-16', async () => {
 *   return await getDailyMeal('2025-01-16');
 * }, 'dailyMeal');
 * 
 * // Invalider après modification
 * cache.invalidate('dailyMeal_2025-01-16');
 * ```
 */
class NutritionDataCache {
  constructor() {
    // Cache LRU global avec limite
    this.cache = new LRUCache(CACHE_LIMITS.global, { enableStats: true });
    
    // Statistiques globales
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0,
      evictions: 0,
      totalRequests: 0,
    };
    
    // Listeners pour invalidation en cascade (optionnel)
    this.invalidationListeners = new Map(); // { pattern: Set<callback> }
    
    log.debug('[NutritionDataCache] Cache initialisé', {
      maxSize: CACHE_LIMITS.global,
      defaultTTLs: DEFAULT_TTL
    });
  }

  /**
   * Génère une clé de cache standardisée
   * 
   * @param {string} prefix - Préfixe (ex: 'dailyMeal', 'meals')
   * @param {string|number} identifier - Identifiant (ex: date, id)
   * @param {Object} [options] - Options additionnelles pour clé unique
   * @returns {string} Clé de cache formatée
   */
  generateKey(prefix, identifier, options = {}) {
    const parts = [prefix, identifier];
    
    // Ajouter options à la clé si présentes (pour clé unique)
    if (options && Object.keys(options).length > 0) {
      const optionsStr = Object.entries(options)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}:${value}`)
        .join('|');
      parts.push(optionsStr);
    }
    
    return parts.join('_');
  }

  /**
   * Obtient une valeur du cache ou exécute le fetcher si cache miss
   * 
   * ✅ PHASE 10.1 : Get avec fallback automatique vers fetcher
   * 
   * @param {string} key - Clé de cache
   * @param {Function} fetcher - Fonction async qui retourne la valeur si cache miss
   * @param {string} [type] - Type de donnée (pour TTL personnalisé)
   * @param {Object} [options] - Options additionnelles
   * @param {number} [options.ttl] - TTL personnalisé en ms (override type)
   * @param {boolean} [options.skipCache] - Forcer skip cache (forcer fetcher)
   * @returns {Promise<*>} Valeur du cache ou résultat du fetcher
   */
  async get(key, fetcher = null, type = 'default', options = {}) {
    this.stats.totalRequests++;
    
    const { ttl: customTTL = null, skipCache = false } = options;
    
    // Si skip cache demandé, exécuter fetcher directement
    if (skipCache) {
      if (!fetcher) {
        log.warn(`[get] Skip cache demandé mais pas de fetcher pour ${key}`);
        return null;
      }
      
      log.debug(`[get] Skip cache pour ${key}`);
      const data = await fetcher();
      return data;
    }
    
    // 1. Vérifier cache
    const entry = this.cache.get(key);
    
    if (entry) {
      // Vérifier expiration
      if (entry.isExpired()) {
        log.debug(`[get] Cache expiré pour ${key} (âge: ${entry.getAge()}ms)`);
        this.cache.delete(key); // Supprimer entrée expirée
        this.stats.misses++;
      } else {
        // ✅ Cache hit : Retourner valeur immédiatement
        entry.touch();
        this.stats.hits++;
        
        const age = entry.getAge();
        log.debug(`[get] Cache hit pour ${key} (âge: ${age}ms)`);
        
        return entry.data;
      }
    } else {
      this.stats.misses++;
      log.debug(`[get] Cache miss pour ${key}`);
    }
    
    // 2. Cache miss : Exécuter fetcher si fourni
    if (!fetcher) {
      log.warn(`[get] Cache miss et pas de fetcher pour ${key}`);
      return null;
    }
    
    try {
      const data = await fetcher();
      
      // 3. Mettre en cache avec TTL approprié
      const ttl = customTTL || DEFAULT_TTL[type] || DEFAULT_TTL.dailyMeal;
      const newEntry = new CacheEntry(data, ttl, type);
      
      // Vérifier si éviction a eu lieu
      const sizeBefore = this.cache.size;
      this.cache.set(key, newEntry);
      const sizeAfter = this.cache.size;
      
      if (sizeBefore > sizeAfter) {
        this.stats.evictions++;
      }
      
      this.stats.sets++;
      
      log.debug(`[get] Données mises en cache pour ${key} (TTL: ${ttl}ms)`);
      
      return data;
    } catch (error) {
      log.error(`[get] Erreur fetcher pour ${key}:`, error);
      throw error; // Propager erreur
    }
  }

  /**
   * Met une valeur dans le cache directement
   * 
   * @param {string} key - Clé de cache
   * @param {*} data - Données à mettre en cache
   * @param {string} [type] - Type de donnée (pour TTL)
   * @param {Object} [options] - Options additionnelles
   * @param {number} [options.ttl] - TTL personnalisé en ms
   */
  set(key, data, type = 'default', options = {}) {
    const { ttl: customTTL = null } = options;
    
    const ttl = customTTL || DEFAULT_TTL[type] || DEFAULT_TTL.dailyMeal;
    const entry = new CacheEntry(data, ttl, type);
    
    const sizeBefore = this.cache.size;
    this.cache.set(key, entry);
    const sizeAfter = this.cache.size;
    
    if (sizeBefore > sizeAfter) {
      this.stats.evictions++;
    }
    
    this.stats.sets++;
    
    log.debug(`[set] Données mises en cache pour ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Invalide une entrée spécifique du cache
   * 
   * ✅ PHASE 10.1 : Invalidation intelligente avec patterns
   * 
   * @param {string} key - Clé de cache à invalider (ou pattern avec *)
   */
  invalidate(key) {
    if (key.includes('*')) {
      // Pattern matching : invalider toutes les clés correspondant au pattern
      const pattern = new RegExp('^' + key.replace(/\*/g, '.*') + '$');
      let invalidated = 0;
      
      // ✅ Créer une copie de keys() pour éviter mutation pendant itération
      const keys = [...this.cache.keys()];
      for (const cacheKey of keys) {
        if (this.cache.has(cacheKey) && pattern.test(cacheKey)) {
          this.cache.delete(cacheKey);
          invalidated++;
        }
      }
      
      this.stats.invalidations += invalidated;
      log.debug(`[invalidate] Pattern ${key} : ${invalidated} entrées invalidées`);
    } else {
      // Invalidation directe
      const deleted = this.cache.delete(key);
      if (deleted) {
        this.stats.invalidations++;
        log.debug(`[invalidate] Entrée invalidée : ${key}`);
      }
    }
    
    // Notifier listeners d'invalidation
    this.notifyInvalidation(key);
  }

  /**
   * Invalide toutes les entrées d'un type spécifique
   * 
   * @param {string} type - Type de donnée (ex: 'dailyMeal', 'meals')
   */
  invalidateType(type) {
    let invalidated = 0;
    
    // ✅ Utiliser keys() puis get() car entries() retourne Array et get() move to end
    // Créer une copie de keys() pour éviter mutation pendant itération
    const keys = [...this.cache.keys()];
    for (const key of keys) {
      // Utiliser has() puis get() pour éviter mutation (get() move to end)
      if (this.cache.has(key)) {
        const entry = this.cache.get(key);
        if (entry && entry.type === type) {
          this.cache.delete(key);
          invalidated++;
        }
      }
    }
    
    this.stats.invalidations += invalidated;
    log.debug(`[invalidateType] Type ${type} : ${invalidated} entrées invalidées`);
  }

  /**
   * Nettoie les entrées expirées du cache
   * 
   * ✅ PHASE 10.1 : Cleanup automatique périodique
   */
  cleanupExpired() {
    let cleaned = 0;
    
    // ✅ Créer une copie de keys() pour éviter mutation pendant itération
    // (get() move to end, donc on ne peut pas itérer directement)
    const keys = [...this.cache.keys()];
    for (const key of keys) {
      // Utiliser has() puis get() pour éviter mutation (get() move to end)
      if (this.cache.has(key)) {
        const entry = this.cache.get(key);
        if (entry && entry.isExpired()) {
          this.cache.delete(key);
          cleaned++;
        }
      }
    }
    
    if (cleaned > 0) {
      log.debug(`[cleanupExpired] ${cleaned} entrées expirées nettoyées`);
    }
    
    return cleaned;
  }

  /**
   * Vide complètement le cache
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.invalidations += size;
    log.debug(`[clear] Cache vidé (${size} entrées supprimées)`);
  }

  /**
   * Obtient les statistiques du cache
   * 
   * @returns {Object} Statistiques détaillées
   */
  getStats() {
    const hitRate = this.stats.totalRequests > 0
      ? ((this.stats.hits / this.stats.totalRequests) * 100).toFixed(2)
      : '0.00';
    
    const cacheStats = this.cache.getStats ? this.cache.getStats() : null;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.cache.maxSize,
      cacheStats
    };
  }

  /**
   * Enregistre un listener pour invalidation en cascade
   * 
   * @param {string} pattern - Pattern de clé (ex: 'dailyMeal_*')
   * @param {Function} callback - Callback appelé lors d'invalidation
   * @returns {Function} Fonction unsubscribe
   */
  onInvalidate(pattern, callback) {
    if (!this.invalidationListeners.has(pattern)) {
      this.invalidationListeners.set(pattern, new Set());
    }
    
    this.invalidationListeners.get(pattern).add(callback);
    
    // Retourner fonction unsubscribe
    return () => {
      const listeners = this.invalidationListeners.get(pattern);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.invalidationListeners.delete(pattern);
        }
      }
    };
  }

  /**
   * Notifie les listeners d'invalidation
   * 
   * @private
   */
  notifyInvalidation(key) {
    for (const [pattern, listeners] of this.invalidationListeners.entries()) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(key)) {
        listeners.forEach(callback => {
          try {
            callback(key);
          } catch (error) {
            log.error(`[notifyInvalidation] Erreur listener pour ${pattern}:`, error);
          }
        });
      }
    }
  }
}

// ==================== SINGLETON ====================

/**
 * Instance singleton du cache
 */
let cacheInstance = null;

/**
 * Obtient l'instance singleton du cache
 * 
 * @returns {NutritionDataCache} Instance du cache
 */
export const getNutritionDataCache = () => {
  if (!cacheInstance) {
    cacheInstance = new NutritionDataCache();
    
    // ✅ PHASE 10.1 : Cleanup automatique toutes les 5 minutes
    // Nettoyer entrées expirées pour éviter accumulation
    if (typeof window !== 'undefined') {
      const cleanupInterval = setInterval(() => {
        cacheInstance.cleanupExpired();
      }, 5 * 60 * 1000); // 5 minutes
      
      // Cleanup au démontage (si jamais nécessaire)
      window.addEventListener('beforeunload', () => {
        clearInterval(cleanupInterval);
      });
    }
  }
  
  return cacheInstance;
};

/**
 * Réinitialise le cache (pour tests principalement)
 * 
 * @internal
 */
export const resetNutritionDataCache = () => {
  if (cacheInstance) {
    cacheInstance.clear();
  }
  cacheInstance = null;
};

// Export de la classe pour tests
export { NutritionDataCache, CacheEntry, DEFAULT_TTL, CACHE_LIMITS };

