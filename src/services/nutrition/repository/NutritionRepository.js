/**
 * NutritionRepository.js
 * 
 * ✅ PHASE 12.2 : Interface abstraite pour Repository pattern
 * 
 * Classe abstraite définissant l'interface commune pour tous les repositories.
 * Les implémentations concrètes (IndexedDBRepository, LocalStorageRepository, etc.)
 * héritent de cette classe.
 * 
 * Fonctionnalités intégrées :
 * - Pattern Observer pour synchronisation automatique
 * - Cache en mémoire (délégation à nutritionDataCache)
 * - Validation Zod (délégation à nutritionSchemas)
 * - Gestion erreurs standardisée (NutritionError)
 * 
 * @module services/nutrition/repository/NutritionRepository
 * @see ../../../../docs/nutrition/PHASE_12_2_REPOSITORY_PATTERN.md
 */

import { getRepositoryObserver } from './repositoryObserver';
import { getNutritionDataCache } from '../nutritionDataCache';
import logger from '../../../utils/logger';

const log = logger.module('nutritionRepository');

/**
 * ✅ PHASE 12.2 : Interface abstraite pour Repository pattern
 * 
 * Cette classe définit l'interface commune pour tous les repositories.
 * Les méthodes doivent être implémentées par les classes concrètes.
 */
export class NutritionRepository {
  constructor() {
    /**
     * Observer pour synchronisation automatique
     */
    this.observer = getRepositoryObserver();
    
    /**
     * Cache en mémoire (délégation)
     */
    this.cache = getNutritionDataCache();
    
    /**
     * Nom du repository (pour logging)
     */
    this.name = this.constructor.name;
  }

  // ==================== MÉTHODES ABSTRAITES (à implémenter) ====================

  /**
   * Récupère une entrée par clé
   * 
   * @param {string} store - Nom du store (ex: 'dailyMeals')
   * @param {string|number} key - Clé de l'entrée
   * @param {Object} options - Options (skipCache, etc.)
   * @returns {Promise<any|null>} Données ou null si inexistant
   * @abstract
   */
  async get(store, key, options = {}) {
    throw new Error(`[${this.name}] get() must be implemented`);
  }

  /**
   * Récupère toutes les entrées d'un store
   * 
   * @param {string} store - Nom du store
   * @param {Object} options - Options (filters, etc.)
   * @returns {Promise<Array>} Tableau de données
   * @abstract
   */
  async getAll(store, options = {}) {
    throw new Error(`[${this.name}] getAll() must be implemented`);
  }

  /**
   * Sauvegarde ou met à jour une entrée
   * 
   * @param {string} store - Nom du store
   * @param {Object} data - Données à sauvegarder
   * @param {Object} options - Options (validate, etc.)
   * @returns {Promise<boolean>} true si succès
   * @abstract
   */
  async save(store, data, options = {}) {
    throw new Error(`[${this.name}] save() must be implemented`);
  }

  /**
   * Supprime une entrée
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé de l'entrée
   * @param {Object} options - Options
   * @returns {Promise<boolean>} true si succès
   * @abstract
   */
  async delete(store, key, options = {}) {
    throw new Error(`[${this.name}] delete() must be implemented`);
  }

  /**
   * Requête avec index
   * 
   * @param {string} store - Nom du store
   * @param {string} indexName - Nom de l'index
   * @param {IDBKeyRange} range - Range de clés
   * @param {Object} options - Options
   * @returns {Promise<Array>} Tableau de résultats
   * @abstract
   */
  async query(store, indexName, range, options = {}) {
    throw new Error(`[${this.name}] query() must be implemented`);
  }

  /**
   * Exécute plusieurs opérations dans une transaction atomique
   * 
   * @param {Array<Object>} operations - Tableau d'opérations [{type, store, data/key, ...}]
   * @param {Object} options - Options
   * @returns {Promise<Object>} Résultats des opérations
   * @abstract
   */
  async batch(operations, options = {}) {
    throw new Error(`[${this.name}] batch() must be implemented`);
  }

  // ==================== MÉTHODES UTILITAIRES (implémentées) ====================

  /**
   * Génère une clé de cache pour un store et une clé
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé
   * @returns {string} Clé de cache
   */
  generateCacheKey(store, key) {
    return this.cache.generateKey(store, key);
  }

  /**
   * Génère une clé de notification pour Observer
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé (optionnel)
   * @returns {string} Clé de notification
   */
  generateNotificationKey(store, key = null) {
    if (key === null) {
      return `${store}:*`;
    }
    return `${store}:${key}`;
  }

  /**
   * Invalide le cache pour un pattern donné
   * 
   * @param {string} pattern - Pattern d'invalidation (ex: `dailyMeal:*`)
   */
  invalidateCache(pattern) {
    this.cache.invalidate(pattern);
    log.debug(`[${this.name}] Cache invalidé`, { pattern });
  }

  /**
   * Nettoie tout le cache
   */
  clearCache() {
    this.cache.clear();
    log.debug(`[${this.name}] Cache nettoyé`);
  }

  /**
   * S'abonne aux changements d'un store/key
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé (optionnel, `*` pour tous)
   * @param {Function} callback - Fonction appelée lors du changement
   * @returns {Function} Fonction unsubscribe
   */
  subscribe(store, key, callback) {
    const notificationKey = this.generateNotificationKey(store, key);
    return this.observer.subscribe(notificationKey, callback);
  }

  /**
   * Notifie les changements d'un store/key
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé
   * @param {any} data - Données à notifier
   */
  notify(store, key, data) {
    const notificationKey = this.generateNotificationKey(store, key);
    this.observer.notify(notificationKey, data);
    log.debug(`[${this.name}] Notification envoyée`, { store, key });
  }

  /**
   * Vérifie si le repository est disponible
   * 
   * @returns {Promise<boolean>} true si disponible
   */
  async isAvailable() {
    return true; // Par défaut, toujours disponible
  }

  /**
   * Ferme/Nettoie le repository
   * Utile pour cleanup ou tests
   * 
   * @returns {Promise<void>}
   */
  async close() {
    // Par défaut, rien à faire
    // Les implémentations peuvent override
  }

  /**
   * Retourne les statistiques du repository
   * 
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      name: this.name,
      cache: this.cache.getStats(),
      observer: this.observer.getStats()
    };
  }
}


