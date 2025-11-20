/**
 * nutritionDataCRUD/favoriteFoods.js
 * 
 * Opérations CRUD pour les Favorite Foods
 * 
 * ✅ PHASE 14.1 : Split de nutritionDataCRUD.js pour maintenabilité
 * 
 * @module hooks/nutritionDataCRUD/favoriteFoods
 */

import {
  openNutritionDB,
  STORE_FAVORITE_FOODS,
  getQuotaSafeStorage,
  QuotaExceededError,
  classifyIndexedDBError,
  NutritionError,
  NutritionErrorCodes,
  createNutritionErrorFromIndexedDB,
  createValidationError,
  getNutritionDataCache,
  validateFavoriteFood,
  z,
  putToStoreWithRetry,
  getFromStoreWithRetry,
  deleteFromStoreWithRetry,
  getNutritionRepository,
  log
} from './shared';

/**
 * Récupère un aliment favori par son ID
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} foodId - ID de l'aliment
 * @returns {Promise<Object|null>} Aliment ou null
 */
export const getFavoriteFood = async (foodId) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository (cache intégré)
    const repository = await getNutritionRepository();
    const result = await repository.get(
      STORE_FAVORITE_FOODS,
      foodId,
      { operationName: 'getFavoriteFood' }
    );
    return result;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getFavoriteFood] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return null;

      const tx = db.transaction([STORE_FAVORITE_FOODS], 'readonly');
      const store = tx.objectStore(STORE_FAVORITE_FOODS);
      
      return new Promise((resolve, reject) => {
        const request = store.get(foodId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getFavoriteFood:', error);
      return null;
    }
  }
};

/**
 * Récupère tous les aliments favoris
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {Object} options - Options de filtrage
 * @param {boolean} options.favoritesOnly - Si true, retourne seulement les favoris
 * @param {string} options.category - Filtrer par catégorie
 * @returns {Promise<Array>} Tableau de favoriteFoods
 */
export const getFavoriteFoods = async (options = {}) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository avec filtres combinés
    const repository = await getNutritionRepository();
    
    // ✅ Construire filtre combiné selon options
    const filters = (food) => {
      // Filtrer par favoris si demandé
      if (options.favoritesOnly && food.isFavorite !== true) {
        return false;
      }
      
      // Filtrer par catégorie si demandé
      if (options.category && food.category !== options.category) {
        return false;
      }
      
      return true;
    };
    
    const allFoods = await repository.getAll(
      STORE_FAVORITE_FOODS,
      { 
        filters,
        operationName: 'getFavoriteFoods'
      }
    );
    
    return allFoods;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getFavoriteFoods] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return [];

      const tx = db.transaction([STORE_FAVORITE_FOODS], 'readonly');
      const store = tx.objectStore(STORE_FAVORITE_FOODS);
      
      return new Promise((resolve, reject) => {
        // ✅ CORRECTION : IDBKeyRange.only(true) ne fonctionne pas avec les booléens
        // Récupérer tous les favoris et filtrer manuellement
        let request;
        
        if (options.category) {
          // Filtrer par catégorie avec index (string, donc OK)
          const index = store.index('category');
          request = index.getAll(IDBKeyRange.only(options.category));
        } else {
          // Récupérer tous les favoris
          request = store.getAll();
        }
        
        request.onsuccess = () => {
          let results = request.result || [];
          
          // Filtrer par favoris si demandé (filtrage manuel car booléen)
          if (options.favoritesOnly) {
            results = results.filter(food => food.isFavorite === true);
          }
          
          // Filtrer par catégorie si favoritesOnly est aussi activé (double filtre)
          if (options.favoritesOnly && options.category) {
            results = results.filter(food => 
              food.isFavorite === true && food.category === options.category
            );
          }
          
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getFavoriteFoods:', error);
      return [];
    }
  }
};

/**
 * Sauvegarde ou met à jour un aliment favori
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {Object} favoriteFood - Données de l'aliment (doit contenir 'id')
 * @returns {Promise<boolean>} true si succès
 */
export const saveFavoriteFood = async (favoriteFood) => {
  try {
    // ✅ PHASE 10.2 : Validation complète avec Zod
    let validatedFavoriteFood;
    try {
      validatedFavoriteFood = validateFavoriteFood(favoriteFood);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // ✅ Protection : Vérifier que error.errors existe et contient au moins un élément
        if (!error.errors || error.errors.length === 0) {
          log.error('[saveFavoriteFood] Erreur validation Zod (pas d\'erreurs détaillées):', error);
          throw createValidationError(
            NutritionErrorCodes.VALIDATION_INVALID_DATA,
            'unknown',
            null,
            'Erreur de validation des données'
          );
        }
        const firstError = error.errors[0];
        const errorPath = Array.isArray(firstError.path) && firstError.path.length > 0 
          ? firstError.path.join('.') 
          : 'unknown';
        const errorField = Array.isArray(firstError.path) && firstError.path.length > 0
          ? firstError.path[0]
          : null;
        log.error('[saveFavoriteFood] Erreur validation Zod:', error.errors);
        throw createValidationError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          errorPath,
          favoriteFood?.[errorField] || null,
          firstError.message || 'Erreur de validation'
        );
      }
      throw error;
    }

    // ✅ PHASE 12.2 : Utiliser Repository (validation, cache, observer intégrés)
    try {
      const repository = await getNutritionRepository();
      
      // ✅ Mettre à jour lastUsed et usageCount (utiliser validatedFavoriteFood)
      // ✅ Protection : getFavoriteFood peut échouer si Repository échoue, utiliser try-catch
      let existing = null;
      try {
        existing = await getFavoriteFood(validatedFavoriteFood.id);
      } catch (getError) {
        // ✅ Si getFavoriteFood échoue, continuer avec existing = null
        log.warn('[saveFavoriteFood] Erreur getFavoriteFood, continuer avec existing = null:', getError);
        existing = null;
      }
      
      const dataToSave = {
        ...validatedFavoriteFood,
        lastUsed: new Date().toISOString().split('T')[0],
        usageCount: existing ? (existing.usageCount || 0) + 1 : 1
      };
      
      await repository.save(
        STORE_FAVORITE_FOODS,
        dataToSave,
        { validate: false, operationName: 'saveFavoriteFood' } // Déjà validé avec Zod
      );
      
      log.debug(`FavoriteFood sauvegardé: ${favoriteFood.id}`);
      return true;
    } catch (error) {
      // ✅ Fallback vers méthode originale si Repository échoue
      log.warn('[saveFavoriteFood] Fallback méthode originale:', error);
      
      const db = await openNutritionDB();
      if (!db) return false;

      // Mettre à jour lastUsed et usageCount (utiliser validatedFavoriteFood)
      // ✅ Protection : getFavoriteFood peut échouer, utiliser try-catch
      let existing = null;
      try {
        existing = await getFavoriteFood(validatedFavoriteFood.id);
      } catch (getError) {
        // ✅ Si getFavoriteFood échoue, continuer avec existing = null
        log.warn('[saveFavoriteFood] Erreur getFavoriteFood dans fallback, continuer avec existing = null:', getError);
        existing = null;
      }
      const dataToSave = {
        ...validatedFavoriteFood,
        lastUsed: new Date().toISOString().split('T')[0],
        usageCount: existing ? (existing.usageCount || 0) + 1 : 1
      };

      const tx = db.transaction([STORE_FAVORITE_FOODS], 'readwrite');
      const store = tx.objectStore(STORE_FAVORITE_FOODS);
      
      try {
        return await new Promise((resolve, reject) => {
          const request = store.put(dataToSave);
          request.onsuccess = () => {
            log.debug(`FavoriteFood sauvegardé: ${favoriteFood.id}`);
            resolve(true);
          };
          request.onerror = () => reject(request.error);
          tx.onerror = () => reject(tx.error);
        });
      } catch (putError) {
        log.error('[saveFavoriteFood] Erreur put dans fallback:', putError);
        return false;
      }
    }
  } catch (error) {
    log.error('Erreur saveFavoriteFood:', error);
    return false;
  }
};

/**
 * Supprime un aliment favori
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} foodId - ID de l'aliment
 * @returns {Promise<boolean>} true si succès
 */
export const deleteFavoriteFood = async (foodId) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository (cache invalidation + observer intégrés)
    const repository = await getNutritionRepository();
    await repository.delete(
      STORE_FAVORITE_FOODS,
      foodId,
      { operationName: 'deleteFavoriteFood' }
    );
    
    log.debug(`FavoriteFood supprimé: ${foodId}`);
    return true;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[deleteFavoriteFood] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return false;

      const tx = db.transaction([STORE_FAVORITE_FOODS], 'readwrite');
      const store = tx.objectStore(STORE_FAVORITE_FOODS);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(foodId);
        request.onsuccess = () => {
          log.debug(`FavoriteFood supprimé: ${foodId}`);
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur deleteFavoriteFood:', error);
      return false;
    }
  }
};

