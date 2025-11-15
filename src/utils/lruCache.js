/**
 * lruCache.js
 * 
 * Implémentation optimale d'un cache LRU (Least Recently Used).
 * Garantit une limite de taille pour éviter memory leaks.
 * 
 * ✅ OPTIMISATION : Remplace Map() illimité par cache avec limite
 * 
 * Performance :
 * - get() : O(1) - Accès instantané
 * - set() : O(1) - Insertion/éviction instantanée
 * - Utilise Map natif (optimisé navigateur)
 * 
 * Architecture :
 * - Double-linked list conceptuel via Map insertion order
 * - Éviction automatique du moins récemment utilisé
 * - Limite configurable (défaut: 100 entrées)
 * 
 * @module utils/lruCache
 * @see ../docs/nutrition/ANALYSE_OPTIMISATIONS_CODE_REEL.md Section 8
 */

import logger from './logger';

const log = logger.module('lruCache');

// ==================== CLASSE LRU CACHE ====================

/**
 * Cache LRU avec limite de taille
 * 
 * @example
 * const cache = new LRUCache(100);
 * cache.set('key1', { data: 'value' });
 * const value = cache.get('key1');
 * cache.clear();
 */
export class LRUCache {
  /**
   * @param {number} maxSize - Taille maximale du cache (défaut: 100)
   * @param {Object} options - Options additionnelles
   * @param {boolean} options.enableStats - Activer statistiques (défaut: false)
   */
  constructor(maxSize = 100, options = {}) {
    if (maxSize <= 0) {
      throw new Error('LRUCache maxSize doit être > 0');
    }

    this.maxSize = maxSize;
    this.cache = new Map(); // Map préserve ordre insertion (ES2015+)
    this.enableStats = options.enableStats || false;
    
    // Statistiques (optionnel)
    if (this.enableStats) {
      this.stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
        sets: 0,
        gets: 0
      };
    }
  }

  /**
   * Récupère une valeur du cache
   * 
   * ✅ OPTIMISATION : O(1) - Move to end (most recently used)
   * 
   * @param {string|number} key - Clé
   * @returns {*} Valeur ou null si non trouvée
   */
  get(key) {
    if (this.enableStats) {
      this.stats.gets++;
    }

    if (!this.cache.has(key)) {
      if (this.enableStats) {
        this.stats.misses++;
      }
      return null;
    }

    // ✅ OPTIMISATION : Move to end (most recently used)
    // Map préserve ordre insertion, donc delete + set = move to end
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);

    if (this.enableStats) {
      this.stats.hits++;
    }

    return value;
  }

  /**
   * Définit une valeur dans le cache
   * 
   * ✅ OPTIMISATION : O(1) - Éviction automatique si nécessaire
   * 
   * @param {string|number} key - Clé
   * @param {*} value - Valeur
   */
  set(key, value) {
    if (this.enableStats) {
      this.stats.sets++;
    }

    if (this.cache.has(key)) {
      // ✅ Mise à jour = move to end (most recently used)
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // ✅ Éviction : Supprimer least recently used (first entry)
      // Map.keys() retourne iterator dans ordre insertion
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      
      if (this.enableStats) {
        this.stats.evictions++;
      }
      
      log.debug(`[LRUCache] Éviction: ${firstKey} (limite ${this.maxSize} atteinte)`);
    }

    // Ajouter/mettre à jour en fin (most recently used)
    this.cache.set(key, value);
  }

  /**
   * Vérifie si une clé existe dans le cache
   * 
   * @param {string|number} key - Clé
   * @returns {boolean} true si existe
   */
  has(key) {
    return this.cache.has(key);
  }

  /**
   * Supprime une clé du cache
   * 
   * @param {string|number} key - Clé
   * @returns {boolean} true si supprimée
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Vide le cache
   */
  clear() {
    this.cache.clear();
    if (this.enableStats) {
      this.stats.hits = 0;
      this.stats.misses = 0;
      this.stats.evictions = 0;
      this.stats.sets = 0;
      this.stats.gets = 0;
    }
  }

  /**
   * Retourne la taille actuelle du cache
   * 
   * @returns {number} Nombre d'entrées
   */
  size() {
    return this.cache.size;
  }

  /**
   * Retourne les statistiques (si activées)
   * 
   * @returns {Object|null} Statistiques ou null
   */
  getStats() {
    if (!this.enableStats) {
      return null;
    }

    const { hits, misses, gets } = this.stats;
    const hitRate = gets > 0 ? (hits / gets * 100).toFixed(2) : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }

  /**
   * Retourne toutes les clés du cache (dans ordre LRU)
   * 
   * @returns {Array} Tableau de clés
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Retourne toutes les valeurs du cache (dans ordre LRU)
   * 
   * @returns {Array} Tableau de valeurs
   */
  values() {
    return Array.from(this.cache.values());
  }

  /**
   * Retourne toutes les entrées [key, value] du cache (dans ordre LRU)
   * 
   * @returns {Array} Tableau de [key, value]
   */
  entries() {
    return Array.from(this.cache.entries());
  }
}

// ==================== EXPORTS ====================

export default LRUCache;

