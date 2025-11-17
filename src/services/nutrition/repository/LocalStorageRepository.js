/**
 * LocalStorageRepository.js
 * 
 * ✅ PHASE 12.2 : Implémentation localStorage du Repository pattern (fallback)
 * 
 * Implémentation fallback utilisée quand IndexedDB n'est pas disponible.
 * Utilise localStorage comme storage backend avec structure organisée.
 * 
 * Fonctionnalités :
 * - Même interface que IndexedDBRepository
 * - Gestion quota localStorage (limite ~5-10MB)
 * - Structure organisée par store
 * - Support queries avec index simulés
 * - Pattern Observer intégré
 * - Cache en mémoire (délégation)
 * 
 * Limitations localStorage :
 * - Taille limitée (~5-10MB selon navigateur)
 * - Pas de transactions atomiques (batch simulé)
 * - Pas de vraies indexes (simulées en mémoire)
 * - Synchronous (peut bloquer UI pour grandes opérations)
 * 
 * @module services/nutrition/repository/LocalStorageRepository
 * @see ../../../../docs/nutrition/PHASE_12_2_REPOSITORY_PATTERN.md
 */

import { NutritionRepository } from './NutritionRepository';
import {
  NutritionError,
  NutritionErrorCodes
} from '../../../utils/nutritionErrors';
import logger from '../../../utils/logger';

const log = logger.module('localStorageRepository');

// ==================== CONSTANTES ====================

/**
 * Préfixe pour toutes les clés localStorage
 */
const STORAGE_PREFIX = 'nutrition_repo_';

/**
 * Limite de taille localStorage (conservative: 5MB)
 * La plupart des navigateurs supportent 5-10MB, on utilise 5MB pour sécurité
 */
const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB

/**
 * Taille estimée overhead par clé (JSON.stringify overhead)
 */
const OVERHEAD_PER_KEY = 100; // bytes

// ==================== CLASSE LOCALSTORAGE REPOSITORY ====================

/**
 * ✅ PHASE 12.2 : Implémentation localStorage du Repository pattern
 * 
 * Cette classe implémente toutes les méthodes abstraites de NutritionRepository
 * en utilisant localStorage comme storage backend.
 */
export class LocalStorageRepository extends NutritionRepository {
  constructor() {
    super();
    
    /**
     * Indexes simulés en mémoire pour queries
     * Structure: { store: { indexName: Map<key, value> } }
     */
    this.indexes = new Map();
    
    /**
     * Statistiques d'utilisation localStorage
     */
    this.stats = {
      totalKeys: 0,
      totalSize: 0,
      operations: {
        get: 0,
        getAll: 0,
        save: 0,
        delete: 0,
        query: 0,
        batch: 0
      }
    };
    
    // Initialiser indexes depuis localStorage si existants
    this.initializeIndexes();
  }

  /**
   * Initialise les indexes simulés depuis localStorage
   * 
   * @private
   */
  initializeIndexes() {
    try {
      const indexKeys = Object.keys(localStorage).filter(key => 
        key.startsWith(`${STORAGE_PREFIX}index_`)
      );
      
      for (const key of indexKeys) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          const [store, indexName] = this.parseIndexKey(key);
          if (store && indexName) {
            if (!this.indexes.has(store)) {
              this.indexes.set(store, new Map());
            }
            this.indexes.get(store).set(indexName, new Map(Object.entries(data)));
          }
        } catch (error) {
          log.warn('[initializeIndexes] Erreur parsing index:', key, error);
        }
      }
    } catch (error) {
      log.warn('[initializeIndexes] Erreur initialisation indexes:', error);
    }
  }

  /**
   * Vérifie si le repository est disponible
   * 
   * @returns {Promise<boolean>} true si localStorage disponible
   */
  async isAvailable() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      // Test write/read pour vérifier disponibilité
      const testKey = `${STORAGE_PREFIX}test_${Date.now()}`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      log.warn('[isAvailable] localStorage non disponible:', error);
      return false;
    }
  }

  /**
   * Génère une clé localStorage pour un store et key
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé
   * @returns {string} Clé localStorage
   * @private
   */
  generateStorageKey(store, key) {
    return `${STORAGE_PREFIX}${store}_${key}`;
  }

  /**
   * Parse une clé localStorage pour extraire store et key
   * 
   * @param {string} storageKey - Clé localStorage
   * @returns {Array<string>} [store, key]
   * @private
   */
  parseStorageKey(storageKey) {
    const prefix = `${STORAGE_PREFIX}`;
    if (!storageKey.startsWith(prefix)) {
      return [null, null];
    }
    const rest = storageKey.substring(prefix.length);
    const parts = rest.split('_');
    if (parts.length < 2) {
      return [null, null];
    }
    const key = parts.slice(1).join('_');
    return [parts[0], key];
  }

  /**
   * Génère une clé pour un index
   * 
   * @param {string} store - Nom du store
   * @param {string} indexName - Nom de l'index
   * @returns {string} Clé localStorage pour index
   * @private
   */
  generateIndexKey(store, indexName) {
    return `${STORAGE_PREFIX}index_${store}_${indexName}`;
  }

  /**
   * Parse une clé d'index pour extraire store et indexName
   * 
   * @param {string} indexKey - Clé localStorage d'index
   * @returns {Array<string>} [store, indexName]
   * @private
   */
  parseIndexKey(indexKey) {
    const prefix = `${STORAGE_PREFIX}index_`;
    if (!indexKey.startsWith(prefix)) {
      return [null, null];
    }
    const rest = indexKey.substring(prefix.length);
    const parts = rest.split('_');
    if (parts.length < 2) {
      return [null, null];
    }
    const indexName = parts.slice(1).join('_');
    return [parts[0], indexName];
  }

  /**
   * Estime la taille utilisée par localStorage
   * 
   * @returns {number} Taille en bytes
   * @private
   */
  estimateStorageSize() {
    let totalSize = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += key.length + value.length + OVERHEAD_PER_KEY;
          }
        }
      }
    } catch (error) {
      log.warn('[estimateStorageSize] Erreur estimation:', error);
    }
    return totalSize;
  }

  /**
   * Vérifie si on peut stocker une nouvelle entrée
   * 
   * @param {number} estimatedSize - Taille estimée en bytes
   * @returns {boolean} true si espace disponible
   * @private
   */
  canStore(estimatedSize) {
    const currentSize = this.estimateStorageSize();
    return (currentSize + estimatedSize) < STORAGE_LIMIT;
  }

  /**
   * Récupère une entrée par clé
   * 
   * ✅ PHASE 12.2 : Intègre cache + gestion erreurs
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé de l'entrée
   * @param {Object} options - Options { skipCache, operationName }
   * @returns {Promise<any|null>} Données ou null si inexistant
   */
  async get(store, key, options = {}) {
    const { skipCache = false, operationName = `get:${store}` } = options;
    
    // ✅ PHASE 12.2 : Utiliser cache avec pattern fetcher (sauf si skipCache)
    if (!skipCache) {
      const cacheKey = this.generateCacheKey(store, key);
      const cacheType = this.getCacheType(store);
      
      return await this.cache.get(
        cacheKey,
        async () => {
          // Fetcher: récupérer depuis localStorage
          return await this.getFromLocalStorage(store, key, operationName);
        },
        cacheType,
        { skipCache }
      );
    } else {
      // Skip cache: récupérer directement depuis localStorage
      return await this.getFromLocalStorage(store, key, operationName);
    }
  }

  /**
   * Récupère depuis localStorage (sans cache)
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé
   * @param {string} operationName - Nom de l'opération
   * @returns {Promise<any|null>} Données ou null
   * @private
   */
  async getFromLocalStorage(store, key, operationName) {
    try {
      if (!await this.isAvailable()) {
        log.warn(`[${this.name}] localStorage non disponible pour get`, { store, key });
        return null;
      }

      const storageKey = this.generateStorageKey(store, key);
      const dataStr = localStorage.getItem(storageKey);
      
      if (!dataStr) {
        return null;
      }

      const data = JSON.parse(dataStr);
      this.stats.operations.get++;
      
      return data;
    } catch (error) {
      log.error(`[${this.name}] Erreur get:`, error);
      return null;
    }
  }

  /**
   * Récupère toutes les entrées d'un store
   * 
   * @param {string} store - Nom du store
   * @param {Object} options - Options { filters, operationName }
   * @returns {Promise<Array>} Tableau de données
   */
  async getAll(store, options = {}) {
    const { filters = null, operationName = `getAll:${store}` } = options;

    try {
      if (!await this.isAvailable()) {
        log.warn(`[${this.name}] localStorage non disponible pour getAll`, { store });
        return [];
      }

      const results = [];
      const prefix = `${STORAGE_PREFIX}${store}_`;
      
      // Parcourir toutes les clés localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          try {
            const dataStr = localStorage.getItem(key);
            if (dataStr) {
              const data = JSON.parse(dataStr);
              results.push(data);
            }
          } catch (error) {
            log.warn(`[${this.name}] Erreur parsing getAll:`, key, error);
          }
        }
      }

      // ✅ PHASE 12.2 : Appliquer filters si fournis
      if (filters && typeof filters === 'function') {
        return results.filter(filters);
      }

      this.stats.operations.getAll++;
      return results;
    } catch (error) {
      log.error(`[${this.name}] Erreur getAll:`, error);
      return [];
    }
  }

  /**
   * Sauvegarde ou met à jour une entrée
   * 
   * ✅ PHASE 12.2 : Intègre cache invalidation + observer + gestion quota
   * 
   * @param {string} store - Nom du store
   * @param {Object} data - Données à sauvegarder (doit contenir clé primaire)
   * @param {Object} options - Options { validate, operationName, skipObserver }
   * @returns {Promise<boolean>} true si succès
   */
  async save(store, data, options = {}) {
    const { 
      validate = true, 
      operationName = `save:${store}`,
      skipObserver = false
    } = options;

    try {
      if (!await this.isAvailable()) {
        throw new NutritionError(
          NutritionErrorCodes.DB_NOT_INITIALIZED,
          'localStorage non disponible',
          { operation: operationName, store }
        );
      }

      // ✅ PHASE 12.2 : Extraire clé primaire depuis data
      const key = this.extractPrimaryKey(store, data);
      if (!key) {
        throw new NutritionError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          'Clé primaire manquante dans données',
          { operation: operationName, store, data }
        );
      }

      // ✅ PHASE 12.2 : Vérifier quota localStorage
      const dataStr = JSON.stringify(data);
      const estimatedSize = dataStr.length + OVERHEAD_PER_KEY;
      
      if (!this.canStore(estimatedSize)) {
        throw new NutritionError(
          NutritionErrorCodes.STORAGE_QUOTA_EXCEEDED,
          'Quota localStorage dépassé',
          { operation: operationName, store, key, estimatedSize }
        );
      }

      const storageKey = this.generateStorageKey(store, key);
      
      // ✅ PHASE 12.2 : Sauvegarder dans localStorage
      localStorage.setItem(storageKey, dataStr);
      
      // ✅ PHASE 12.2 : Mettre à jour indexes simulés
      this.updateIndexes(store, key, data);
      
      // ✅ PHASE 12.2 : Invalider cache après sauvegarde
      const cacheKey = this.generateCacheKey(store, key);
      this.cache.invalidate(cacheKey);
      
      // ✅ PHASE 12.2 : Notifier Observer pour synchronisation automatique
      if (!skipObserver) {
        this.notify(store, key, data);
      }
      
      this.stats.operations.save++;
      log.debug(`[${this.name}] Données sauvegardées`, { store, key });
      return true;
    } catch (error) {
      // ✅ PHASE 12.2 : Propager NutritionError
      if (error instanceof NutritionError) {
        throw error;
      }
      
      const nutritionError = new NutritionError(
        NutritionErrorCodes.UNKNOWN_ERROR,
        'Erreur sauvegarde localStorage',
        { operation: operationName, store, error: error.message }
      );
      log.error(`[${this.name}] Erreur save:`, nutritionError.toJSON());
      throw nutritionError;
    }
  }

  /**
   * Supprime une entrée
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé de l'entrée
   * @param {Object} options - Options { operationName, skipObserver }
   * @returns {Promise<boolean>} true si succès
   */
  async delete(store, key, options = {}) {
    const { operationName = `delete:${store}`, skipObserver = false } = options;

    try {
      if (!await this.isAvailable()) {
        throw new NutritionError(
          NutritionErrorCodes.DB_NOT_INITIALIZED,
          'localStorage non disponible',
          { operation: operationName, store, key }
        );
      }

      const storageKey = this.generateStorageKey(store, key);
      localStorage.removeItem(storageKey);
      
      // ✅ PHASE 12.2 : Mettre à jour indexes simulés
      this.removeFromIndexes(store, key);
      
      // ✅ PHASE 12.2 : Invalider cache après suppression
      const cacheKey = this.generateCacheKey(store, key);
      this.cache.invalidate(cacheKey);
      
      // ✅ PHASE 12.2 : Notifier Observer pour synchronisation automatique
      if (!skipObserver) {
        this.notify(store, key, null); // null = supprimé
      }

      this.stats.operations.delete++;
      log.debug(`[${this.name}] Données supprimées`, { store, key });
      return true;
    } catch (error) {
      const nutritionError = error instanceof NutritionError
        ? error
        : new NutritionError(
            NutritionErrorCodes.UNKNOWN_ERROR,
            'Erreur suppression localStorage',
            { operation: operationName, store, key, error: error.message }
          );
      log.error(`[${this.name}] Erreur delete:`, nutritionError.toJSON());
      throw nutritionError;
    }
  }

  /**
   * Requête avec index (simulé)
   * 
   * @param {string} store - Nom du store
   * @param {string} indexName - Nom de l'index
   * @param {IDBKeyRange} range - Range de clés (optionnel, non supporté en localStorage)
   * @param {Object} options - Options { operationName }
   * @returns {Promise<Array>} Tableau de résultats
   */
  async query(store, indexName, range = null, options = {}) {
    const { operationName = `query:${store}:${indexName}` } = options;

    try {
      if (!await this.isAvailable()) {
        log.warn(`[${this.name}] localStorage non disponible pour query`, { store, indexName });
        return [];
      }

      // ✅ PHASE 12.2 : Fallback: getAll puis filter (pas de vraies indexes en localStorage)
      log.debug(`[${this.name}] Query simulé (fallback getAll)`, { store, indexName });
      const allResults = await this.getAll(store, { operationName });
      
      // Note: range non supporté en localStorage, retourner tous les résultats
      // Les filters peuvent être appliqués côté appelant si nécessaire
      
      this.stats.operations.query++;
      return allResults;
    } catch (error) {
      log.error(`[${this.name}] Erreur query:`, error);
      return [];
    }
  }

  /**
   * Exécute plusieurs opérations (simulé, pas de vraie transaction atomique)
   * 
   * ✅ PHASE 12.2 : Batch operations simulées (pas de vraie atomicité localStorage)
   * 
   * @param {Array<Object>} operations - Tableau d'opérations [{type, store, data/key, ...}]
   * @param {Object} options - Options { operationName }
   * @returns {Promise<Object>} Résultats des opérations { success: boolean, results: Array }
   */
  async batch(operations, options = {}) {
    const { operationName = 'batch' } = options;

    if (!Array.isArray(operations) || operations.length === 0) {
      return { success: true, results: [] };
    }

    try {
      if (!await this.isAvailable()) {
        throw new NutritionError(
          NutritionErrorCodes.DB_NOT_INITIALIZED,
          'localStorage non disponible',
          { operation: operationName, operationsCount: operations.length }
        );
      }

      const results = [];
      const notifications = []; // Pour notifier après batch complet

      // ✅ PHASE 12.2 : Exécuter toutes les opérations (pas de vraie transaction atomique)
      for (const op of operations) {
        const { type, store, data, key } = op;

        try {
          switch (type) {
            case 'save':
            case 'put': {
              const opKey = this.extractPrimaryKey(store, data);
              await this.save(store, data, { ...options, skipObserver: true });
              results.push({ success: true, type, store, key: opKey });
              
              // Préparer notification
              notifications.push({ store, key: opKey, data });
              break;
            }
            
            case 'delete': {
              await this.delete(store, key, { ...options, skipObserver: true });
              results.push({ success: true, type, store, key });
              
              // Préparer notification
              notifications.push({ store, key, data: null });
              break;
            }
            
            default:
              log.warn(`[${this.name}] Type d'opération batch non supporté:`, type);
              results.push({ success: false, type, store, error: 'Type non supporté' });
          }
        } catch (error) {
          log.error(`[${this.name}] Erreur opération batch:`, { type, store, error });
          results.push({ success: false, type, store, error: error.message });
          // Continuer avec autres opérations (pas de rollback possible en localStorage)
        }
      }

      // ✅ PHASE 12.2 : Notifier Observer après batch complet
      notifications.forEach(({ store, key, data }) => {
        this.notify(store, key, data);
      });

      const success = results.every(r => r.success);
      this.stats.operations.batch++;
      
      log.debug(`[${this.name}] Batch terminé`, { 
        operationsCount: operations.length, 
        successCount: results.filter(r => r.success).length,
        success 
      });

      return { success, results };
    } catch (error) {
      const nutritionError = error instanceof NutritionError
        ? error
        : new NutritionError(
            NutritionErrorCodes.UNKNOWN_ERROR,
            'Erreur batch localStorage',
            { operation: operationName, operationsCount: operations.length, error: error.message }
          );
      log.error(`[${this.name}] Erreur batch:`, nutritionError.toJSON());
      throw nutritionError;
    }
  }

  // ==================== MÉTHODES UTILITAIRES PRIVÉES ====================

  /**
   * Extrait la clé primaire depuis les données selon le store
   * (Réutilisé depuis IndexedDBRepository)
   * 
   * @param {string} store - Nom du store
   * @param {Object} data - Données
   * @returns {string|number|null} Clé primaire ou null
   * @private
   */
  extractPrimaryKey(store, data) {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const keyMappings = {
      'nutrition_dailyMeals': 'date',
      'nutrition_meals': 'id',
      'nutrition_programs': 'id',
      'nutrition_favoriteFoods': 'id',
      'nutrition_hydrationLog': 'date',
      'nutrition_mealPhotos': 'id',
      'nutrition_apiCache': 'key',
      'nutrition_gamification': 'id',
      'nutrition_shareLinks': 'token',
      'nutrition_progressPhotos': 'id',
      'nutrition_mlModels': 'id'
    };

    const keyField = keyMappings[store] || 'id';
    return data[keyField] || data.id || null;
  }

  /**
   * Retourne le type de cache pour un store donné
   * (Réutilisé depuis IndexedDBRepository)
   * 
   * @param {string} store - Nom du store
   * @returns {string} Type de cache
   * @private
   */
  getCacheType(store) {
    const typeMappings = {
      'nutrition_dailyMeals': 'dailyMeal',
      'nutrition_meals': 'meals',
      'nutrition_programs': 'program',
      'nutrition_favoriteFoods': 'favoriteFoods',
      'nutrition_hydrationLog': 'hydrationLog',
      'nutrition_gamification': 'gamification',
      'nutrition_shareLinks': 'program',
      'nutrition_apiCache': 'program',
      'nutrition_mealPhotos': 'program',
      'nutrition_progressPhotos': 'program',
      'nutrition_mlModels': 'program'
    };

    return typeMappings[store] || 'dailyMeal';
  }

  /**
   * Met à jour les indexes simulés après save
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé
   * @param {Object} data - Données
   * @private
   */
  updateIndexes(store, key, data) {
    // Indexes simulés en mémoire (optionnel, pour performance queries)
    // Peut être étendu pour supporter vraies indexes si nécessaire
    // Pour l'instant, on utilise getAll + filter pour queries
  }

  /**
   * Retire une entrée des indexes simulés après delete
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé
   * @private
   */
  removeFromIndexes(store, key) {
    // Indexes simulés en mémoire (optionnel)
  }

  /**
   * Nettoie toutes les données d'un store (utile pour tests/cleanup)
   * 
   * @param {string} store - Nom du store
   * @returns {Promise<number>} Nombre d'entrées supprimées
   */
  async clearStore(store) {
    try {
      if (!await this.isAvailable()) {
        return 0;
      }

      const prefix = `${STORAGE_PREFIX}${store}_`;
      let deleted = 0;

      const keysToDelete = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(prefix)) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => {
        localStorage.removeItem(key);
        deleted++;
      });

      log.debug(`[${this.name}] Store nettoyé`, { store, deleted });
      return deleted;
    } catch (error) {
      log.error(`[${this.name}] Erreur clearStore:`, error);
      return 0;
    }
  }

  /**
   * Ferme/Nettoie le repository
   * 
   * @returns {Promise<void>}
   */
  async close() {
    // localStorage ne nécessite pas de fermeture explicite
    log.debug(`[${this.name}] Repository fermé`);
  }

  /**
   * Retourne les statistiques du repository
   * 
   * @returns {Object} Statistiques
   */
  getStats() {
    return {
      ...super.getStats(),
      storage: {
        estimatedSize: this.estimateStorageSize(),
        limit: STORAGE_LIMIT,
        usagePercent: Math.round((this.estimateStorageSize() / STORAGE_LIMIT) * 100),
        totalKeys: this.stats.totalKeys
      },
      operations: { ...this.stats.operations }
    };
  }
}


