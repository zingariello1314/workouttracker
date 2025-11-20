/**
 * nutritionDataCRUD/dailyMeals.js
 * 
 * Opérations CRUD pour les Daily Meals
 * 
 * ✅ PHASE 14.1 : Split de nutritionDataCRUD.js pour maintenabilité
 * 
 * @module hooks/nutritionDataCRUD/dailyMeals
 */

import {
  openNutritionDB,
  STORE_DAILY_MEALS,
  STORE_MEALS,
  getQuotaSafeStorage,
  QuotaExceededError,
  classifyIndexedDBError,
  NutritionError,
  NutritionErrorCodes,
  createNutritionErrorFromIndexedDB,
  createValidationError,
  getNutritionDataCache,
  validateDailyMeal,
  z,
  putToStoreWithRetry,
  getFromStoreWithRetry,
  deleteFromStoreWithRetry,
  getNutritionRepository,
  log
} from './shared';

/**
 * Récupère les données d'un jour spécifique
 * 
 * ✅ PHASE 10.1 : Cache en mémoire pour économie 70-90% sur requêtes répétées
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} date - Date au format "YYYY-MM-DD"
 * @param {Object} [options] - Options additionnelles
 * @param {boolean} [options.skipCache] - Forcer skip cache (défaut: false)
 * @returns {Promise<Object|null>} Données du jour ou null si inexistant
 */
export const getDailyMeal = async (date, options = {}) => {
  const { skipCache = false } = options;
  
  try {
    // ✅ PHASE 12.2 : Utiliser Repository (cache intégré)
    const repository = await getNutritionRepository();
    const result = await repository.get(
      STORE_DAILY_MEALS,
      date,
      { skipCache, operationName: 'getDailyMeal' }
    );
    return result;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getDailyMeal] Fallback méthode originale:', error);
    const cache = getNutritionDataCache();
    const cacheKey = cache.generateKey('dailyMeal', date);
    
    return await cache.get(
      cacheKey,
      async () => {
        try {
          const db = await openNutritionDB();
          if (!db) {
            log.warn('DB non disponible pour getDailyMeal');
            return null;
          }

          const tx = db.transaction([STORE_DAILY_MEALS], 'readonly');
          const store = tx.objectStore(STORE_DAILY_MEALS);
          
          // ✅ PHASE 10.4 : Retry automatique avec backoff exponentiel
          try {
            const result = await getFromStoreWithRetry(
              store,
              date,
              'getDailyMeal',
              { date, storeName: STORE_DAILY_MEALS }
            );
            return result;
          } catch (error) {
            // ✅ OPTIMISATION : Convertir erreur IndexedDB en NutritionError standardisée
            const nutritionError = createNutritionErrorFromIndexedDB(
              error,
              'getDailyMeal',
              { date }
            );
            log.error('[getDailyMeal] Erreur IndexedDB après retry:', nutritionError.toJSON());
            // Ne pas throw pour lecture (retourner null est OK)
            return null;
          }
        } catch (error) {
          // ✅ OPTIMISATION : Wrapper erreurs inconnues
          if (error instanceof NutritionError) {
            log.error('[getDailyMeal] Erreur:', error.toJSON());
          } else {
            log.error('Erreur getDailyMeal:', error);
          }
          // Ne pas throw pour lecture (retourner null est OK)
          return null;
        }
      },
      'dailyMeal',
      { skipCache }
    );
  }
};

/**
 * Sauvegarde ou met à jour les données d'un jour
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {Object} dailyMeal - Données du jour (doit contenir 'date')
 * @returns {Promise<boolean>} true si succès
 */
export const saveDailyMeal = async (dailyMeal) => {
  try {
    // ✅ PHASE 10.2 : Validation complète avec Zod
    let validatedDailyMeal;
    try {
      validatedDailyMeal = validateDailyMeal(dailyMeal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // ✅ Protection : Vérifier que error.errors existe et contient au moins un élément
        if (!error.errors || error.errors.length === 0) {
          log.error('[saveDailyMeal] Erreur validation Zod (pas d\'erreurs détaillées):', error);
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
        log.error('[saveDailyMeal] Erreur validation Zod:', error.errors);
        throw createValidationError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          errorPath,
          dailyMeal?.[errorField] || null,
          firstError.message || 'Erreur de validation'
        );
      }
      throw error;
    }

    // Ajouter lastModified si absent (déjà validé par Zod)
    const dataToSave = {
      ...validatedDailyMeal,
      lastModified: validatedDailyMeal.lastModified || new Date().toISOString()
    };

    // ✅ PHASE 12.2 : Utiliser Repository (validation, cache, observer intégrés)
    try {
      const repository = await getNutritionRepository();
      await repository.save(
        STORE_DAILY_MEALS,
        dataToSave,
        { validate: false, operationName: 'saveDailyMeal' } // Déjà validé avec Zod
      );
      
      log.debug(`DailyMeal sauvegardé: ${dailyMeal.date}`);
      return true;
    } catch (error) {
      // ✅ Fallback vers méthode originale si Repository échoue
      log.warn('[saveDailyMeal] Fallback méthode originale:', error);
      
      const db = await openNutritionDB();
      if (!db) {
        throw new NutritionError(
          NutritionErrorCodes.DB_NOT_INITIALIZED,
          'Base de données non initialisée',
          { operation: 'saveDailyMeal', date: dailyMeal.date }
        );
      }

      // ✅ OPTIMISATION : Utiliser quota-safe storage pour gestion QuotaExceededError
      try {
        const quotaSafeStorage = await getQuotaSafeStorage();
        const saved = await quotaSafeStorage.put(STORE_DAILY_MEALS, dataToSave);
        
        if (saved) {
          log.debug(`DailyMeal sauvegardé: ${dailyMeal.date}`);
          
          // ✅ PHASE 10.1 : Invalider cache après sauvegarde
          const cache = getNutritionDataCache();
          const cacheKey = cache.generateKey('dailyMeal', dailyMeal.date);
          cache.invalidate(cacheKey);
          // Invalider aussi cache des meals de ce jour (si dailyMeal modifié)
          cache.invalidate(cache.generateKey('meals', dailyMeal.date));
          
          return true;
        }
        return false;
      } catch (error) {
        // ✅ GESTION ERREUR SPÉCIFIQUE QuotaExceededError
        if (error instanceof QuotaExceededError) {
          log.error('[saveDailyMeal] Quota dépassé après cleanup:', error);
          throw error; // ✅ Propager pour gestion utilisateur
        }
        
        // ✅ FALLBACK : Méthode traditionnelle si wrapper non disponible
        log.debug('[saveDailyMeal] Fallback méthode traditionnelle');
        
        const tx = db.transaction([STORE_DAILY_MEALS], 'readwrite');
        const store = tx.objectStore(STORE_DAILY_MEALS);
        
        // ✅ PHASE 10.4 : Retry automatique avec backoff exponentiel
        try {
          await putToStoreWithRetry(
            store,
            dataToSave,
            'saveDailyMeal',
            { date: dailyMeal.date, storeName: STORE_DAILY_MEALS }
          );
          
          log.debug(`DailyMeal sauvegardé: ${dailyMeal.date}`);
          
          // ✅ PHASE 10.1 : Invalider cache après sauvegarde (fallback)
          const cache = getNutritionDataCache();
          const cacheKey = cache.generateKey('dailyMeal', dailyMeal.date);
          cache.invalidate(cacheKey);
          // Invalider aussi cache des meals de ce jour
          cache.invalidate(cache.generateKey('meals', dailyMeal.date));
          
          return true;
        } catch (error) {
          // ✅ Vérifier si QuotaExceededError dans fallback
          const classification = classifyIndexedDBError(error);
          if (classification.name === 'QuotaExceededError') {
            throw new QuotaExceededError(
              'Stockage saturé. Veuillez exporter vos données pour libérer de l\'espace.',
              { storeName: STORE_DAILY_MEALS, date: dailyMeal.date }
            );
          }
          
          // ✅ OPTIMISATION : Convertir erreur IndexedDB en NutritionError standardisée
          const nutritionError = createNutritionErrorFromIndexedDB(
            error,
            'saveDailyMeal',
            { storeName: STORE_DAILY_MEALS, date: dailyMeal.date }
          );
          log.error('[saveDailyMeal] Erreur IndexedDB après retry:', nutritionError.toJSON());
          throw nutritionError;
        }
      }
    }
  } catch (error) {
    // ✅ PROPAGATION ERREUR QuotaExceededError pour gestion UI
    if (error instanceof QuotaExceededError) {
      throw error; // ✅ Propager pour gestion utilisateur
    }
    
    // ✅ PROPAGATION ERREUR NutritionError pour gestion UI cohérente
    if (error instanceof NutritionError) {
      log.error('[saveDailyMeal] Erreur validation/DB:', error.toJSON());
      throw error; // ✅ Propager pour gestion utilisateur
    }
    
    // ✅ OPTIMISATION : Wrapper erreurs inconnues en NutritionError
    log.error('[saveDailyMeal] Erreur inconnue:', error);
    throw new NutritionError(
      NutritionErrorCodes.UNKNOWN_ERROR,
      'Erreur inconnue lors de la sauvegarde',
      { operation: 'saveDailyMeal', date: dailyMeal?.date },
      error
    );
  }
};

/**
 * Récupère plusieurs jours dans une plage de dates
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} startDate - Date début "YYYY-MM-DD"
 * @param {string} endDate - Date fin "YYYY-MM-DD"
 * @returns {Promise<Array>} Tableau de dailyMeals
 */
export const getDailyMealsByRange = async (startDate, endDate) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository avec filtre par plage de dates
    const repository = await getNutritionRepository();
    const allDailyMeals = await repository.getAll(
      STORE_DAILY_MEALS,
      { 
        filters: (dailyMeal) => dailyMeal.date >= startDate && dailyMeal.date <= endDate,
        operationName: 'getDailyMealsByRange'
      }
    );
    return allDailyMeals;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getDailyMealsByRange] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) {
        log.warn('DB non disponible pour getDailyMealsByRange');
        return [];
      }

      const tx = db.transaction([STORE_DAILY_MEALS], 'readonly');
      const store = tx.objectStore(STORE_DAILY_MEALS);
      const index = store.index('date');
      
      const range = IDBKeyRange.bound(startDate, endDate, true, true);
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(range);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getDailyMealsByRange:', error);
      return [];
    }
  }
};

/**
 * Supprime les données d'un jour
 * 
 * ✅ PHASE 10.1 : Invalider cache après suppression
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} date - Date au format "YYYY-MM-DD"
 * @returns {Promise<boolean>} true si succès
 */
export const deleteDailyMeal = async (date) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository (cache invalidation + observer intégrés)
    const repository = await getNutritionRepository();
    await repository.delete(
      STORE_DAILY_MEALS,
      date,
      { operationName: 'deleteDailyMeal' }
    );
    
    log.debug(`DailyMeal supprimé: ${date}`);
    return true;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[deleteDailyMeal] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) {
        log.warn('DB non disponible pour deleteDailyMeal');
        return false;
      }

      const tx = db.transaction([STORE_DAILY_MEALS], 'readwrite');
      const store = tx.objectStore(STORE_DAILY_MEALS);
      
      // ✅ PHASE 10.4 : Retry automatique avec backoff exponentiel
      try {
        await deleteFromStoreWithRetry(
          store,
          date,
          'deleteDailyMeal',
          { date, storeName: STORE_DAILY_MEALS }
        );
        
        log.debug(`DailyMeal supprimé: ${date}`);
        
        // ✅ PHASE 10.1 : Invalider cache après suppression
        const cache = getNutritionDataCache();
        cache.invalidate(cache.generateKey('dailyMeal', date));
        // Invalider aussi cache des meals de ce jour
        cache.invalidate(cache.generateKey('meals', date));
        
        return true;
      } catch (error) {
        log.error('[deleteDailyMeal] Erreur IndexedDB après retry:', error);
        return false;
      }
    } catch (error) {
      log.error('Erreur deleteDailyMeal:', error);
      return false;
    }
  }
};

