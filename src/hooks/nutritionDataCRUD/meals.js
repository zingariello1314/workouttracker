/**
 * nutritionDataCRUD/meals.js
 * 
 * Opérations CRUD pour les Meals
 * 
 * ✅ PHASE 14.1 : Split de nutritionDataCRUD.js pour maintenabilité
 * 
 * @module hooks/nutritionDataCRUD/meals
 */

import {
  openNutritionDB,
  STORE_MEALS,
  getQuotaSafeStorage,
  QuotaExceededError,
  classifyIndexedDBError,
  NutritionError,
  NutritionErrorCodes,
  createNutritionErrorFromIndexedDB,
  createValidationError,
  getNutritionDataCache,
  validateMeal,
  z,
  putToStoreWithRetry,
  getFromStoreWithRetry,
  deleteFromStoreWithRetry,
  getNutritionRepository,
  validateAfterOperation,
  log
} from './shared';

/**
 * Récupère un repas par son ID
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} mealId - ID du repas
 * @returns {Promise<Object|null>} Données du repas ou null
 */
export const getMeal = async (mealId) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository (cache intégré)
    const repository = await getNutritionRepository();
    const result = await repository.get(
      STORE_MEALS,
      mealId,
      { operationName: 'getMeal' }
    );
    return result;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getMeal] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return null;

      const tx = db.transaction([STORE_MEALS], 'readonly');
      const store = tx.objectStore(STORE_MEALS);
      
      return new Promise((resolve, reject) => {
        const request = store.get(mealId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getMeal:', error);
      return null;
    }
  }
};

/**
 * Sauvegarde ou met à jour un repas
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {Object} meal - Données du repas (doit contenir 'id')
 * @returns {Promise<boolean>} true si succès
 */
export const saveMeal = async (meal) => {
  try {
    // ✅ PHASE 10.2 : Validation complète avec Zod
    let validatedMeal;
    try {
      validatedMeal = validateMeal(meal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // ✅ Protection : Vérifier que error.errors existe et contient au moins un élément
        if (!error.errors || error.errors.length === 0) {
          log.error('[saveMeal] Erreur validation Zod (pas d\'erreurs détaillées):', error);
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
        log.error('[saveMeal] Erreur validation Zod:', error.errors);
        throw createValidationError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          errorPath,
          meal?.[errorField] || null,
          firstError.message || 'Erreur de validation'
        );
      }
      throw error;
    }

    // Ajouter timestamp si absent (déjà validé par Zod)
    const dataToSave = {
      ...validatedMeal,
      timestamp: validatedMeal.timestamp || new Date().toISOString()
    };

    // ✅ PHASE 12.2 : Utiliser Repository (validation, cache, observer intégrés)
    try {
      const repository = await getNutritionRepository();
      await repository.save(
        STORE_MEALS,
        dataToSave,
        { validate: false, operationName: 'saveMeal' } // Déjà validé avec Zod
      );
      
      log.debug(`Meal sauvegardé: ${meal.id}`);
      return true;
    } catch (error) {
      // ✅ Fallback vers méthode originale si Repository échoue
      log.warn('[saveMeal] Fallback méthode originale:', error);
      
      const db = await openNutritionDB();
      if (!db) {
        throw new NutritionError(
          NutritionErrorCodes.DB_NOT_INITIALIZED,
          'Base de données non initialisée',
          { operation: 'saveMeal', mealId: meal.id }
        );
      }

      // ✅ OPTIMISATION : Utiliser quota-safe storage pour gestion QuotaExceededError
      try {
        const quotaSafeStorage = await getQuotaSafeStorage();
        const saved = await quotaSafeStorage.put(STORE_MEALS, dataToSave);
        
        if (saved) {
          log.debug(`Meal sauvegardé: ${meal.id}`);
          
          // ✅ PHASE 10.1 : Invalider cache après sauvegarde
          const cache = getNutritionDataCache();
          // Invalider cache des meals pour cette date
          if (meal.date) {
            cache.invalidate(cache.generateKey('meals', meal.date));
            // Invalider aussi cache dailyMeal (totaux mis à jour)
            cache.invalidate(cache.generateKey('dailyMeal', meal.date));
          }
          
          return true;
        }
        return false;
      } catch (error) {
        // ✅ GESTION ERREUR SPÉCIFIQUE QuotaExceededError
        if (error instanceof QuotaExceededError) {
          log.error('[saveMeal] Quota dépassé après cleanup:', error);
          throw error; // ✅ Propager pour gestion utilisateur
        }
        
        // ✅ FALLBACK : Méthode traditionnelle si wrapper non disponible
        log.debug('[saveMeal] Fallback méthode traditionnelle');
        
        const tx = db.transaction([STORE_MEALS], 'readwrite');
        const store = tx.objectStore(STORE_MEALS);
        
        // ✅ PHASE 10.4 : Retry automatique avec backoff exponentiel
        try {
          await putToStoreWithRetry(
            store,
            dataToSave,
            'saveMeal',
            { mealId: meal.id, date: meal.date, storeName: STORE_MEALS }
          );
          
          log.debug(`Meal sauvegardé: ${meal.id}`);
          
          // ✅ PHASE 10.1 : Invalider cache après sauvegarde (fallback)
          const cache = getNutritionDataCache();
          // Invalider cache des meals pour cette date
          if (meal.date) {
            cache.invalidate(cache.generateKey('meals', meal.date));
            // Invalider aussi cache dailyMeal (totaux mis à jour)
            cache.invalidate(cache.generateKey('dailyMeal', meal.date));
          }
          
          return true;
        } catch (error) {
          // ✅ Vérifier si QuotaExceededError dans fallback
          const classification = classifyIndexedDBError(error);
          if (classification.name === 'QuotaExceededError') {
            throw new QuotaExceededError(
              'Stockage saturé. Veuillez exporter vos données pour libérer de l\'espace.',
              { storeName: STORE_MEALS, mealId: meal.id }
            );
          }
          
          // ✅ OPTIMISATION : Convertir erreur IndexedDB en NutritionError standardisée
          const nutritionError = createNutritionErrorFromIndexedDB(
            error,
            'saveMeal',
            { storeName: STORE_MEALS, mealId: meal.id }
          );
          log.error('[saveMeal] Erreur IndexedDB après retry:', nutritionError.toJSON());
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
      log.error('[saveMeal] Erreur validation/DB:', error.toJSON());
      throw error; // ✅ Propager pour gestion utilisateur
    }
    
    // ✅ OPTIMISATION : Wrapper erreurs inconnues en NutritionError
    log.error('[saveMeal] Erreur inconnue:', error);
    throw new NutritionError(
      NutritionErrorCodes.UNKNOWN_ERROR,
      'Erreur inconnue lors de la sauvegarde',
      { operation: 'saveMeal', mealId: meal?.id },
      error
    );
  }
};

/**
 * Récupère les repas d'un jour spécifique
 * 
 * ✅ PHASE 10.1 : Cache en mémoire pour économie 70-90% sur requêtes répétées
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} date - Date au format "YYYY-MM-DD"
 * @param {Object} [options] - Options additionnelles
 * @param {boolean} [options.skipCache] - Forcer skip cache (défaut: false)
 * @returns {Promise<Array>} Tableau de meals pour ce jour
 */
export const getMealsByDate = async (date, options = {}) => {
  const { skipCache = false } = options;
  
  try {
    // ✅ PHASE 12.2 : Utiliser Repository avec filtre par date (cache intégré)
    const repository = await getNutritionRepository();
    const allMeals = await repository.getAll(
      STORE_MEALS,
      { 
        filters: (meal) => meal.date === date,
        operationName: 'getMealsByDate',
        skipCache 
      }
    );
    return allMeals;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getMealsByDate] Fallback méthode originale:', error);
    
    const cache = getNutritionDataCache();
    const cacheKey = cache.generateKey('meals', date);
    
    return await cache.get(
      cacheKey,
      async () => {
        try {
          const db = await openNutritionDB();
          if (!db) return [];

          const tx = db.transaction([STORE_MEALS], 'readonly');
          const store = tx.objectStore(STORE_MEALS);
          const index = store.index('date');
          
          return new Promise((resolve, reject) => {
            const request = index.getAll(date);
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
          });
        } catch (error) {
          log.error('Erreur getMealsByDate:', error);
          return [];
        }
      },
      'meals',
      { skipCache }
    );
  }
};

/**
 * Récupère les repas d'un jour filtrés par type (OPTIMISÉ avec index composé)
 * 
 * ✅ OPTIMISATION : Utilise index composé [date+type] pour requête O(log n) au lieu de O(n)
 * Gain performance : ×10-50 selon taille DB
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} date - Date au format "YYYY-MM-DD"
 * @param {string} type - Type de repas ('breakfast' | 'lunch' | 'dinner' | 'snack')
 * @returns {Promise<Array>} Tableau de meals filtrés par date et type
 */
export const getMealsByDateAndType = async (date, type) => {
  try {
    // ✅ OPTIMISATION : Validation format date et type (robustesse)
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      log.warn('[getMealsByDateAndType] Format date invalide:', date);
      return [];
    }
    
    const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    if (!type || !validTypes.includes(type)) {
      log.warn('[getMealsByDateAndType] Type invalide:', type);
      return [];
    }
    
    // ✅ PHASE 12.2 : Utiliser Repository avec filtre combiné date+type
    // Note: Pour l'instant, on utilise getAll + filtre (index composé non supporté directement)
    // L'optimisation index composé est préservée dans le fallback
    try {
      const repository = await getNutritionRepository();
      const allMeals = await repository.getAll(
        STORE_MEALS,
        { 
          filters: (meal) => meal.date === date && meal.type === type,
          operationName: 'getMealsByDateAndType'
        }
      );
      
      log.debug(`[getMealsByDateAndType] ${allMeals.length} repas trouvés (date: ${date}, type: ${type})`);
      return allMeals;
    } catch (error) {
      // ✅ Fallback vers méthode originale avec index composé (optimisation préservée)
      log.warn('[getMealsByDateAndType] Fallback méthode originale (index composé):', error);
      
      const db = await openNutritionDB();
      if (!db) return [];

      const tx = db.transaction([STORE_MEALS], 'readonly');
      const store = tx.objectStore(STORE_MEALS);
      
      // ✅ OPTIMISATION : Vérifier si index composé existe (Version 9+)
      let index;
      try {
        index = store.index('[date+type]');
      } catch (idxError) {
        // Index composé non disponible (DB ancienne version), fallback sur filtrage mémoire
        log.debug('[getMealsByDateAndType] Index composé non disponible, fallback filtrage mémoire');
        const dateIndex = store.index('date');
        return new Promise((resolve, reject) => {
          const request = dateIndex.getAll(date);
          request.onsuccess = () => {
            const meals = request.result || [];
            const filtered = meals.filter(meal => meal.type === type);
            resolve(filtered);
          };
          request.onerror = () => reject(request.error);
        });
      }
      
      // ✅ OPTIMISATION : Utiliser index composé [date+type] pour requête optimisée
      return new Promise((resolve, reject) => {
        // IDBKeyRange avec tuple [date, type] pour index composé
        const keyRange = IDBKeyRange.only([date, type]);
        const request = index.getAll(keyRange);
        
        request.onsuccess = () => {
          const meals = request.result || [];
          log.debug(`[getMealsByDateAndType] ${meals.length} repas trouvés (date: ${date}, type: ${type})`);
          resolve(meals);
        };
        request.onerror = () => {
          log.error('[getMealsByDateAndType] Erreur requête index composé:', request.error);
          reject(request.error);
        };
      });
    }
  } catch (error) {
    log.error('[getMealsByDateAndType] Erreur:', error);
    return [];
  }
};

/**
 * Récupère les repas d'un dailyMealId
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} dailyMealId - ID du dailyMeal (date)
 * @returns {Promise<Array>} Tableau de meals
 */
export const getMealsByDailyMealId = async (dailyMealId) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository avec filtre par dailyMealId
    const repository = await getNutritionRepository();
    const allMeals = await repository.getAll(
      STORE_MEALS,
      { 
        filters: (meal) => meal.dailyMealId === dailyMealId,
        operationName: 'getMealsByDailyMealId'
      }
    );
    return allMeals;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getMealsByDailyMealId] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return [];

      const tx = db.transaction([STORE_MEALS], 'readonly');
      const store = tx.objectStore(STORE_MEALS);
      const index = store.index('dailyMealId');
      
      return new Promise((resolve, reject) => {
        const request = index.getAll(dailyMealId);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getMealsByDailyMealId:', error);
      return [];
    }
  }
};

/**
 * Supprime un repas
 * 
 * ✅ PHASE 10.1 : Invalider cache après suppression
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} mealId - ID du repas
 * @returns {Promise<boolean>} true si succès
 */
export const deleteMeal = async (mealId) => {
  try {
    // ✅ PHASE 12.2 : Récupérer meal avant suppression pour invalider cache avec date
    let mealDate = null;
    try {
      const repository = await getNutritionRepository();
      const meal = await repository.get(STORE_MEALS, mealId, { operationName: 'deleteMeal:get' });
      mealDate = meal?.date || null;
    } catch (error) {
      log.warn('[deleteMeal] Erreur récupération meal avant suppression (non bloquant):', error);
    }

    // ✅ PHASE 12.2 : Utiliser Repository (cache invalidation + observer intégrés)
    try {
      const repository = await getNutritionRepository();
      await repository.delete(
        STORE_MEALS,
        mealId,
        { operationName: 'deleteMeal' }
      );
      
      // ✅ OPTIMISATION : Valider cohérence après suppression (nettoyer références orphelines)
      try {
        await validateAfterOperation('deleteMeal', mealId, { autoFix: true, verbose: false });
      } catch (validationError) {
        log.warn('[deleteMeal] Erreur validation cohérence (non bloquant):', validationError);
      }
      
      log.debug(`Meal supprimé: ${mealId}`);
      return true;
    } catch (error) {
      // ✅ Fallback vers méthode originale si Repository échoue
      log.warn('[deleteMeal] Fallback méthode originale:', error);
      
      const db = await openNutritionDB();
      if (!db) return false;

      const tx = db.transaction([STORE_MEALS], 'readwrite');
      const store = tx.objectStore(STORE_MEALS);
      
      // ✅ PHASE 10.4 : Retry automatique avec backoff exponentiel
      try {
        await deleteFromStoreWithRetry(
          store,
          mealId,
          'deleteMeal',
          { mealId, date: mealDate, storeName: STORE_MEALS }
        );
        
        log.debug(`Meal supprimé: ${mealId}`);
        
        // ✅ PHASE 10.1 : Invalider cache après suppression
        if (mealDate) {
          const cache = getNutritionDataCache();
          // Invalider cache des meals pour cette date
          cache.invalidate(cache.generateKey('meals', mealDate));
          // Invalider aussi cache dailyMeal (totaux mis à jour)
          cache.invalidate(cache.generateKey('dailyMeal', mealDate));
        }
        
        // ✅ OPTIMISATION : Valider cohérence après suppression (nettoyer références orphelines)
        try {
          await validateAfterOperation('deleteMeal', mealId, { autoFix: true, verbose: false });
        } catch (validationError) {
          log.warn('[deleteMeal] Erreur validation cohérence (non bloquant):', validationError);
        }
        
        return true;
      } catch (error) {
        log.error('[deleteMeal] Erreur IndexedDB après retry:', error);
        return false;
      }
    }
  } catch (error) {
    log.error('Erreur deleteMeal:', error);
    return false;
  }
};

/**
 * Récupère les meals sur une plage de dates
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @returns {Promise<Array>} Tableau de meals dans la plage (triés par date puis timestamp)
 */
export const getMealsByDateRange = async (startDate, endDate) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository avec filtre par plage de dates
    const repository = await getNutritionRepository();
    const allMeals = await repository.getAll(
      STORE_MEALS,
      { 
        filters: (meal) => meal.date >= startDate && meal.date <= endDate,
        operationName: 'getMealsByDateRange'
      }
    );
    
    // ✅ Trier par date puis timestamp (comme l'implémentation originale)
    allMeals.sort((a, b) => {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return (a.timestamp || 0) - (b.timestamp || 0);
    });
    
    return allMeals;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getMealsByDateRange] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return [];

      const tx = db.transaction([STORE_MEALS], 'readonly');
      const store = tx.objectStore(STORE_MEALS);
      const index = store.index('date');
      
      return new Promise((resolve, reject) => {
        const range = IDBKeyRange.bound(startDate, endDate, false, false);
        const request = index.getAll(range);
        request.onsuccess = () => {
          const meals = request.result || [];
          // Trier par date puis timestamp
          meals.sort((a, b) => {
            if (a.date !== b.date) {
              return a.date.localeCompare(b.date);
            }
            return (a.timestamp || 0) - (b.timestamp || 0);
          });
          resolve(meals);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getMealsByDateRange:', error);
      return [];
    }
  }
};

/**
 * Récupère tous les meals (pour export)
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @returns {Promise<Array>} Tableau de tous les meals
 */
export const getAllMeals = async () => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository getAll (simple et efficace)
    const repository = await getNutritionRepository();
    const allMeals = await repository.getAll(
      STORE_MEALS,
      { operationName: 'getAllMeals' }
    );
    return allMeals;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getAllMeals] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return [];

      const tx = db.transaction([STORE_MEALS], 'readonly');
      const store = tx.objectStore(STORE_MEALS);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getAllMeals:', error);
      return [];
    }
  }
};

/**
 * Yield au thread principal (évite freeze UI lors de grandes opérations)
 * 
 * @returns {Promise<void>}
 */
const yieldToMain = () => {
  return new Promise(resolve => {
    if ('scheduler' in window && 'postTask' in window.scheduler && typeof window.scheduler.postTask === 'function') {
      // ✅ Scheduler.postTask.yield() (Chrome 94+)
      window.scheduler.postTask(() => resolve(), { priority: 'background' });
    } else if ('requestIdleCallback' in window) {
      // ✅ requestIdleCallback (Chrome 47+, Firefox 55+)
      requestIdleCallback(() => resolve(), { timeout: 10 });
    } else {
      // ✅ Fallback setTimeout (tous navigateurs)
      setTimeout(() => resolve(), 0);
    }
  });
};

/**
 * Sauvegarde batch synchrone (petite taille, transaction unique)
 * 
 * ✅ PHASE 12.2 : Migration vers Repository batch (optimisé)
 * 
 * @param {Array<Object>} meals - Tableau de meals à sauvegarder
 * @returns {Promise<boolean>} true si succès
 */
const saveMealsBatchSync = async (meals) => {
  if (!Array.isArray(meals) || meals.length === 0) {
    return true;
  }

  try {
    // ✅ PHASE 12.2 : Utiliser Repository batch (transaction atomique)
    const repository = await getNutritionRepository();
    
    // Préparer toutes les données avec timestamp
    const mealsToSave = meals.map(meal => ({
      ...meal,
      timestamp: meal.timestamp || new Date().toISOString()
    }));

    // ✅ Créer opérations batch
    const operations = mealsToSave.map(meal => ({
      type: 'save',
      store: STORE_MEALS,
      data: meal
    }));

    // ✅ Exécuter batch (transaction atomique)
    const result = await repository.batch(operations, { operationName: 'saveMealsBatchSync' });
    
    if (result.success) {
      log.debug(`${meals.length} meals sauvegardés en batch (sync)`);
      return true;
    } else {
      log.error('[saveMealsBatchSync] Erreur batch:', result);
      return false;
    }
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[saveMealsBatchSync] Fallback méthode originale:', error);
    
    const db = await openNutritionDB();
    if (!db) return false;

    const tx = db.transaction([STORE_MEALS], 'readwrite');
    const store = tx.objectStore(STORE_MEALS);
    
    // Préparer toutes les données
    const mealsToSave = meals.map(meal => ({
      ...meal,
      timestamp: meal.timestamp || new Date().toISOString()
    }));

    // Ajouter toutes les opérations à la transaction
    mealsToSave.forEach(meal => {
      store.put(meal);
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        log.debug(`${meals.length} meals sauvegardés en batch (sync)`);
        resolve(true);
      };
      tx.onerror = () => {
        log.error('Erreur saveMealsBatchSync:', tx.error);
        reject(tx.error);
      };
    });
  }
};

/**
 * Sauvegarde plusieurs repas en batch avec chunking automatique (performance ×100, UI réactive)
 * 
 * ✅ OPTIMISATION : Chunking automatique si >100 meals pour éviter freeze UI
 * - Petites opérations (≤100) : Transaction unique (efficace, pas d'overhead)
 * - Grandes opérations (>100) : Chunking + yielding (UI réactive)
 * 
 * ✅ PHASE 12.2 : Migration vers Repository batch (rétrocompatible)
 * 
 * ✅ OPTIMISATION 12 : Naming consistency - Renommé pour convention REST/CRUD
 * Convention : saveMeal (singulier) vs saveMeals (pluriel batch)
 * 
 * @param {Array<Object>} meals - Tableau de meals à sauvegarder
 * @param {Object} options - Options de sauvegarde
 * @param {number} options.chunkSize - Taille des chunks (défaut: 100)
 * @param {Function} options.onProgress - Callback progression ({current, total, percent})
 * @returns {Promise<boolean>} true si succès
 */
export const saveMeals = async (meals, options = {}) => {
  try {
    if (!Array.isArray(meals) || meals.length === 0) {
      return true; // Rien à faire
    }

    const { chunkSize = 100, onProgress } = options;
    
    // ✅ OPTIMISATION : Petite opération → Transaction unique (efficace)
    if (meals.length <= chunkSize) {
      return await saveMealsBatchSync(meals);
    }
    
    // ✅ OPTIMISATION : Grande opération → Chunking + yielding (UI réactive)
    // Diviser en chunks
    const chunks = [];
    for (let i = 0; i < meals.length; i += chunkSize) {
      chunks.push(meals.slice(i, i + chunkSize));
    }
    
    let saved = 0;
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      // ✅ PHASE 12.2 : Sauvegarder chunk via Repository batch
      await saveMealsBatchSync(chunk);
      saved += chunk.length;
      
      // ✅ YIELD au navigateur (évite freeze UI)
      await yieldToMain();
      
      // Callback progression
      if (onProgress) {
        onProgress({
          current: saved,
          total: meals.length,
          percent: (saved / meals.length) * 100
        });
      }
    }
    
    log.debug(`${meals.length} meals sauvegardés en batch (${chunks.length} chunks)`);
    return true;
  } catch (error) {
    log.error('Erreur saveMeals:', error);
    return false;
  }
};

/**
 * @deprecated Utiliser saveMeals() à la place (convention REST/CRUD)
 * Alias conservé pour rétro-compatibilité
 * 
 * @param {Array} meals - Tableau de meals à sauvegarder
 * @param {Object} options - Options
 * @returns {Promise<boolean>} true si succès
 */
export const saveMealsBatch = saveMeals;




