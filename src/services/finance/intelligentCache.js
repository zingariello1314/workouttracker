/**
 * Cache Intelligent avec Comparaison Deep
 * 
 * ✅ PHASE 2 - Étape 2.3 : Cache intelligent pour éviter requêtes répétées
 * 
 * Fonctionnalités :
 * - Comparaison deep des données (évite cache si données identiques)
 * - TTL configurable
 * - Limite d'âge max pour cache stale
 * - Éviction LRU automatique
 * 
 * @module services/finance/intelligentCache
 */

import logger from '../../utils/logger';

const log = logger.module('intelligentCache');

/**
 * Comparaison deep simple (sans lodash pour éviter dépendance)
 * Compare récursivement les objets
 */
function deepEqual(obj1, obj2) {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    
    const val1 = obj1[key];
    const val2 = obj2[key];
    
    if (typeof val1 === 'object' && typeof val2 === 'object') {
      if (!deepEqual(val1, val2)) return false;
    } else if (val1 !== val2) {
      return false;
    }
  }
  
  return true;
}

/**
 * Cache Intelligent avec Comparaison Deep
 */
class IntelligentCache {
  constructor(maxSize = 100, defaultTTL = 15 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Récupérer une valeur du cache
   * 
   * @param {string} key - Clé du cache
   * @param {Object} options - Options
   * @param {number} options.ttl - TTL en millisecondes
   * @param {boolean} options.allowStale - Autoriser cache expiré
   * @param {number} options.maxStaleAge - Âge max pour cache stale (défaut: 7 jours)
   * @param {Object} options.dataToCompare - Données à comparer (si fourni, vérifie si identiques)
   * @returns {Object|null} Données en cache ou null
   */
  get(key, options = {}) {
    const { 
      ttl = this.defaultTTL, 
      allowStale = false, 
      maxStaleAge = 7 * 24 * 60 * 60 * 1000,
      dataToCompare = null
    } = options;

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const now = Date.now();
    const age = now - cached.timestamp;
    const isExpired = age >= ttl;
    const isTooOld = age >= maxStaleAge;

    // Si cache trop vieux, le supprimer
    if (isTooOld) {
      log.debug(`Cache too old for ${key} (age: ${Math.round(age / (24 * 60 * 60 * 1000))} days), removing`);
      this.cache.delete(key);
      return null;
    }

    // Si cache expiré et stale non autorisé
    if (isExpired && !allowStale) {
      log.debug(`Cache expired for ${key} (age: ${Math.round(age / 1000)}s, TTL: ${Math.round(ttl / 1000)}s)`);
      return null;
    }

    // ✅ PHASE 2 : Comparaison deep si dataToCompare fourni
    if (dataToCompare !== null) {
      if (!deepEqual(cached.data, dataToCompare)) {
        log.debug(`Cache data differs for ${key}, invalidating`);
        this.cache.delete(key);
        return null;
      }
    }

    if (isExpired && allowStale) {
      log.warn(`Using stale cache for ${key} (age: ${Math.round(age / 1000)}s, TTL: ${Math.round(ttl / 1000)}s)`);
    } else {
      log.debug(`Cache hit for ${key} (age: ${Math.round(age / 1000)}s)`);
    }

    return cached.data;
  }

  /**
   * Mettre une valeur en cache
   * 
   * @param {string} key - Clé du cache
   * @param {Object} data - Données à mettre en cache
   * @param {Object} options - Options
   * @param {number} options.ttl - TTL en millisecondes
   */
  set(key, data, options = {}) {
    const { ttl = this.defaultTTL } = options;

    // Éviction LRU si cache plein
    if (this.cache.size >= this.maxSize) {
      // Supprimer la première entrée (la plus ancienne)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      log.debug(`Cache full, evicting ${firstKey}`);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    log.debug(`Cache set for ${key}`);
  }

  /**
   * Supprimer une clé du cache
   * 
   * @param {string} key - Clé à supprimer
   */
  delete(key) {
    this.cache.delete(key);
    log.debug(`Cache deleted for ${key}`);
  }

  /**
   * Vider tout le cache
   */
  clear() {
    this.cache.clear();
    log.debug('Cache cleared');
  }

  /**
   * Obtenir la taille du cache
   * 
   * @returns {number} Nombre d'entrées dans le cache
   */
  size() {
    return this.cache.size;
  }
}

// Instance globale pour Yahoo Finance
export const intelligentCache = new IntelligentCache(100, 15 * 60 * 1000);

export default IntelligentCache;
