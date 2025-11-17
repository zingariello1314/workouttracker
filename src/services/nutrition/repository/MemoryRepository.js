/**
 * MemoryRepository.js
 * 
 * ✅ PHASE 12.2 : Implémentation mémoire du Repository pattern (tests)
 * 
 * Implémentation en mémoire utilisée pour tests unitaires.
 * Utilise Map/Set pour stockage en mémoire (pas de persistance).
 * 
 * Fonctionnalités :
 * - Même interface que IndexedDBRepository
 * - Stockage en mémoire (Map par store)
 * - Support queries avec index simulés
 * - Pattern Observer intégré
 * - Cache en mémoire (délégation)
 * - Pas de limite de taille (mémoire uniquement)
 * 
 * Cas d'usage :
 * - Tests unitaires (mock repository)
 * - Tests d'intégration sans IndexedDB
 * - Développement rapide sans storage
 * 
 * @module services/nutrition/repository/MemoryRepository
 * @see ../../../../docs/nutrition/PHASE_12_2_REPOSITORY_PATTERN.md
 */

import { NutritionRepository } from './NutritionRepository';
import {
  NutritionError,
  NutritionErrorCodes
} from '../../../utils/nutritionErrors';
import logger from '../../../utils/logger';

const log = logger.module('memoryRepository');

/**
 * ✅ PHASE 12.2 : Implémentation mémoire du Repository pattern
 * 
 * Cette classe implémente toutes les méthodes abstraites de NutritionRepository
 * en utilisant Map/Set pour stockage en mémoire.
 */
export class MemoryRepository extends NutritionRepository {
  constructor() {
    super();
    
    /**
     * Stockage en mémoire : { store: Map<key, data> }
     */
    this.storage = new Map();
    
    /**
     * Indexes simulés en mémoire : { store: { indexName: Map<indexValue, Set<key>> } }
     */
    this.indexes = new Map();
    
    /**
     * Statistiques d'utilisation
     */
    this.stats = {
      totalKeys: 0,
      operations: {
        get: 0,
        getAll: 0,
        save: 0,
        delete: 0,
        query: 0,
        batch: 0
      }
    };
  }

  /**
   * Vérifie si le repository est disponible
   * 
   * @returns {Promise<boolean>} true (toujours disponible en mémoire)
   */
  async isAvailable() {
    return true; // Toujours disponible en mémoire
  }

  /**
   * Obtient ou crée le Map pour un store
   * 
   * @param {string} store - Nom du store
   * @returns {Map} Map du store
   * @private
   */
  getStoreMap(store) {
    if (!this.storage.has(store)) {
      this.storage.set(store, new Map());
    }
    return this.storage.get(store);
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
          // Fetcher: récupérer depuis mémoire
          return await this.getFromMemory(store, key, operationName);
        },
        cacheType,
        { skipCache }
      );
    } else {
      // Skip cache: récupérer directement depuis mémoire
      return await this.getFromMemory(store, key, operationName);
    }
  }

  /**
   * Récupère depuis mémoire (sans cache)
   * 
   * @param {string} store - Nom du store
   * @param {string|number} key - Clé
   * @param {string} operationName - Nom de l'opération
   * @returns {Promise<any|null>} Données ou null
   * @private
   */
  async getFromMemory(store, key, operationName) {
    try {
      const storeMap = this.getStoreMap(store);
      const data = storeMap.get(key) || null;
      
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
      const storeMap = this.getStoreMap(store);
      const results = Array.from(storeMap.values());

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
   * ✅ PHASE 12.2 : Intègre cache invalidation + observer
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
      // ✅ PHASE 12.2 : Extraire clé primaire depuis data
      const key = this.extractPrimaryKey(store, data);
      if (!key) {
        throw new NutritionError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          'Clé primaire manquante dans données',
          { operation: operationName, store, data }
        );
      }

      const storeMap = this.getStoreMap(store);
      
      // ✅ PHASE 12.2 : Sauvegarder dans mémoire (cloner pour éviter mutations)
      const dataClone = JSON.parse(JSON.stringify(data));
      storeMap.set(key, dataClone);
      
      // ✅ PHASE 12.2 : Mettre à jour indexes simulés
      this.updateIndexes(store, key, data);
      
      // ✅ PHASE 12.2 : Invalider cache après sauvegarde
      const cacheKey = this.generateCacheKey(store, key);
      this.cache.invalidate(cacheKey);
      
      // ✅ PHASE 12.2 : Notifier Observer pour synchronisation automatique
      if (!skipObserver) {
        this.notify(store, key, dataClone);
      }
      
      this.stats.operations.save++;
      this.stats.totalKeys = this.countTotalKeys();
      
      log.debug(`[${this.name}] Données sauvegardées`, { store, key });
      return true;
    } catch (error) {
      // ✅ PHASE 12.2 : Propager NutritionError
      if (error instanceof NutritionError) {
        throw error;
      }
      
      const nutritionError = new NutritionError(
        NutritionErrorCodes.UNKNOWN_ERROR,
        'Erreur sauvegarde mémoire',
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
      const storeMap = this.getStoreMap(store);
      const deleted = storeMap.delete(key);
      
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
      this.stats.totalKeys = this.countTotalKeys();
      
      log.debug(`[${this.name}] Données supprimées`, { store, key, deleted });
      return deleted;
    } catch (error) {
      const nutritionError = error instanceof NutritionError
        ? error
        : new NutritionError(
            NutritionErrorCodes.UNKNOWN_ERROR,
            'Erreur suppression mémoire',
            { operation: operationName, store, key, error: error.message }
          );
      log.error(`[${this.name}] Erreur delete:`, nutritionError.toJSON());
      throw nutritionError;
    }
  }

  /**
   * Requête avec index (simulé en mémoire)
   * 
   * @param {string} store - Nom du store
   * @param {string} indexName - Nom de l'index
   * @param {IDBKeyRange} range - Range de clés (optionnel, non supporté)
   * @param {Object} options - Options { operationName }
   * @returns {Promise<Array>} Tableau de résultats
   */
  async query(store, indexName, range = null, options = {}) {
    const { operationName = `query:${store}:${indexName}` } = options;

    try {
      // ✅ PHASE 12.2 : Fallback: getAll puis filter (indexes simulés optionnels)
      log.debug(`[${this.name}] Query simulé (fallback getAll)`, { store, indexName });
      const allResults = await this.getAll(store, { operationName });
      
      // Note: range non supporté, retourner tous les résultats
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
   * ✅ PHASE 12.2 : Batch operations simulées (pas de vraie atomicité en mémoire)
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
          // Continuer avec autres opérations (pas de rollback possible en mémoire)
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
            'Erreur batch mémoire',
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
   * Compte le nombre total de clés dans tous les stores
   * 
   * @returns {number} Nombre total de clés
   * @private
   */
  countTotalKeys() {
    let total = 0;
    this.storage.forEach(storeMap => {
      total += storeMap.size;
    });
    return total;
  }

  /**
   * Nettoie toutes les données d'un store (utile pour tests)
   * 
   * @param {string} store - Nom du store
   * @returns {Promise<number>} Nombre d'entrées supprimées
   */
  async clearStore(store) {
    try {
      const storeMap = this.getStoreMap(store);
      const deleted = storeMap.size;
      storeMap.clear();
      
      // Nettoyer indexes
      if (this.indexes.has(store)) {
        this.indexes.get(store).clear();
      }
      
      this.stats.totalKeys = this.countTotalKeys();
      log.debug(`[${this.name}] Store nettoyé`, { store, deleted });
      return deleted;
    } catch (error) {
      log.error(`[${this.name}] Erreur clearStore:`, error);
      return 0;
    }
  }

  /**
   * Nettoie toutes les données (utile pour tests)
   * 
   * @returns {Promise<void>}
   */
  async clear() {
    this.storage.clear();
    this.indexes.clear();
    this.stats.totalKeys = 0;
    log.debug(`[${this.name}] Toutes les données nettoyées`);
  }

  /**
   * Ferme/Nettoie le repository
   * 
   * @returns {Promise<void>}
   */
  async close() {
    await this.clear();
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
      memory: {
        totalKeys: this.stats.totalKeys,
        stores: Array.from(this.storage.keys()),
        storeSizes: Object.fromEntries(
          Array.from(this.storage.entries()).map(([store, map]) => [store, map.size])
        )
      },
      operations: { ...this.stats.operations }
    };
  }
}


