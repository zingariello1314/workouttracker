/**
 * nutritionDataCRUD.js
 * 
 * Fonctions CRUD (Create, Read, Update, Delete) pour les stores nutrition
 * Opérations optimisées avec transactions batch et gestion d'erreurs
 * 
 * @module hooks/nutritionDataCRUD
 */

import { 
  openNutritionDB,
  STORE_DAILY_MEALS,
  STORE_MEALS,
  STORE_PROGRAMS,
  STORE_FAVORITE_FOODS,
  STORE_MEAL_PHOTOS,
  STORE_HYDRATION_LOG,
  STORE_API_CACHE
} from './nutritionDataUtils';
import { getQuotaSafeStorage, QuotaExceededError } from '../utils/quotaSafeStorage';
import { classifyIndexedDBError } from '../hooks/garminErrorHandler';
import { 
  NutritionError, 
  NutritionErrorCodes,
  createNutritionErrorFromIndexedDB,
  createValidationError
} from '../utils/nutritionErrors';
import { getNutritionDataCache } from '../services/nutrition/nutritionDataCache';
import { 
  validateDailyMeal,
  validateMeal,
  validateProgram,
  validateFavoriteFood,
  validateHydrationLog
} from '../services/nutrition/nutritionSchemas';
import { z } from 'zod';
import {
  putToStoreWithRetry,
  getFromStoreWithRetry,
  deleteFromStoreWithRetry,
  getAllFromStoreWithRetry
} from '../services/nutrition/nutritionRetryUtils';
// ✅ PHASE 12.2 : Import Repository pour migration progressive
import { getNutritionRepository } from '../services/nutrition/repository';

const log = {
  debug: (...args) => console.log('[nutritionDataCRUD]', ...args),
  info: (...args) => console.info('[nutritionDataCRUD]', ...args),
  warn: (...args) => console.warn('[nutritionDataCRUD]', ...args),
  error: (...args) => console.error('[nutritionDataCRUD]', ...args)
};

// ==================== DAILY MEALS ====================

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

// ==================== MEALS ====================

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
 * Récupère tous les repas d'un jour
 * 
 * @param {string} date - Date au format "YYYY-MM-DD"
 * @returns {Promise<Array>} Tableau de meals
 */
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

// ==================== BATCH OPERATIONS ====================

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

// ==================== BATCH OPERATIONS ====================

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

// ==================== PROGRAMS ====================

/**
 * Récupère tous les programmes
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @returns {Promise<Array>} Tableau de programs
 */
export const getAllPrograms = async () => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository getAll (simple et efficace)
    const repository = await getNutritionRepository();
    const allPrograms = await repository.getAll(
      STORE_PROGRAMS,
      { operationName: 'getAllPrograms' }
    );
    return allPrograms;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getAllPrograms] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return [];

      const tx = db.transaction([STORE_PROGRAMS], 'readonly');
      const store = tx.objectStore(STORE_PROGRAMS);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getAllPrograms:', error);
      return [];
    }
  }
};

/**
 * Récupère le programme actif
 * 
 * ✅ PHASE 10.1 : Cache en mémoire avec TTL long (changent rarement)
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {Object} [options] - Options additionnelles
 * @param {boolean} [options.skipCache] - Forcer skip cache (défaut: false)
 * @returns {Promise<Object|null>} Programme actif ou null
 */
export const getActiveProgram = async (options = {}) => {
  const { skipCache = false } = options;
  
  try {
    // ✅ PHASE 12.2 : Utiliser Repository avec filtre isActive (cache intégré)
    const repository = await getNutritionRepository();
    const allPrograms = await repository.getAll(
      STORE_PROGRAMS,
      { 
        filters: (program) => program.isActive === true,
        operationName: 'getActiveProgram',
        skipCache 
      }
    );
    
    // ✅ Retourner le premier programme actif (normalement il n'y en a qu'un)
    return allPrograms.length > 0 ? allPrograms[0] : null;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getActiveProgram] Fallback méthode originale:', error);
    
    const cache = getNutritionDataCache();
    const cacheKey = cache.generateKey('activeProgram', 'current');
    
    try {
      return await cache.get(
        cacheKey,
        async () => {
          try {
            const db = await openNutritionDB();
            if (!db) return null;

            const tx = db.transaction([STORE_PROGRAMS], 'readonly');
            const store = tx.objectStore(STORE_PROGRAMS);
            
            // ✅ CORRECTION : IDBKeyRange.only(true) ne fonctionne pas avec les booléens
            // Récupérer tous les programmes et filtrer manuellement
            return new Promise((resolve, reject) => {
              const request = store.getAll();
              
              request.onsuccess = () => {
                const programs = request.result || [];
                // Filtrer pour trouver le programme actif
                const activeProgram = programs.find(p => p.isActive === true);
                resolve(activeProgram || null);
              };
              request.onerror = () => reject(request.error);
            });
          } catch (error) {
            log.error('Erreur getActiveProgram:', error);
            return null;
          }
        },
        'activeProgram',
        { skipCache }
      );
    } catch (error) {
      log.error('Erreur getActiveProgram (cache):', error);
      return null;
    }
  }
};

/**
 * ✅ OPTIMISATION 1.3 : Récupère tous les programmes ET le programme actif en une seule transaction
 * 
 * Gain : 50% réduction overhead (1 transaction au lieu de 2)
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @returns {Promise<{programs: Array, activeProgram: Object|null}>}
 */
export const getAllProgramsWithActive = async () => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository getAll (une seule transaction)
    const repository = await getNutritionRepository();
    const programs = await repository.getAll(
      STORE_PROGRAMS,
      { operationName: 'getAllProgramsWithActive' }
    );
    
    // ✅ Filtrer programme actif (normalement il n'y en a qu'un)
    const activeProgram = programs.find(p => p.isActive === true) || null;
    
    return { programs, activeProgram };
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getAllProgramsWithActive] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return { programs: [], activeProgram: null };

      const tx = db.transaction([STORE_PROGRAMS], 'readonly');
      const store = tx.objectStore(STORE_PROGRAMS);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        
        request.onsuccess = () => {
          const programs = request.result || [];
          // ✅ Filtrer programme actif dans la même transaction
          const activeProgram = programs.find(p => p.isActive === true) || null;
          resolve({ programs, activeProgram });
        };
        
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getAllProgramsWithActive:', error);
      return { programs: [], activeProgram: null };
    }
  }
};

/**
 * Sauvegarde ou met à jour un programme
 * 
 * ✅ OPTIMISATION 4.2 : Accepte dbInstance optionnel pour éviter double ouverture DB
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {Object} program - Données du programme (doit contenir 'id')
 * @param {Object} options - Options optionnelles
 * @param {IDBDatabase} options.dbInstance - Instance de la DB (évite réouverture, déprécié avec Repository)
 * @returns {Promise<boolean>} true si succès
 */
export const saveProgram = async (program, options = {}) => {
  try {
    // ✅ PHASE 10.2 : Validation complète avec Zod
    let validatedProgram;
    try {
      validatedProgram = validateProgram(program);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // ✅ Protection : Vérifier que error.errors existe et contient au moins un élément
        if (!error.errors || error.errors.length === 0) {
          log.error('[saveProgram] Erreur validation Zod (pas d\'erreurs détaillées):', error);
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
        log.error('[saveProgram] Erreur validation Zod:', error.errors);
        throw createValidationError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          errorPath,
          program?.[errorField] || null,
          firstError.message || 'Erreur de validation'
        );
      }
      throw error;
    }

    // Utiliser validatedProgram pour sauvegarde
    const dataToSave = validatedProgram;

    // ✅ PHASE 12.2 : Utiliser Repository (validation, cache, observer intégrés)
    try {
      const repository = await getNutritionRepository();
      
      // ✅ Si programme devient actif, désactiver les autres via batch
      if (validatedProgram.isActive) {
        await deactivateAllPrograms(); // ✅ Utiliser Repository batch
      }
      
      // ✅ Sauvegarder le programme
      await repository.save(
        STORE_PROGRAMS,
        dataToSave,
        { validate: false, operationName: 'saveProgram' } // Déjà validé avec Zod
      );
      
      log.debug(`Program sauvegardé: ${dataToSave.id}`);
      return true;
    } catch (error) {
      // ✅ Fallback vers méthode originale si Repository échoue
      log.warn('[saveProgram] Fallback méthode originale:', error);
      
      const { dbInstance = null } = options;
      const db = dbInstance || await openNutritionDB();
      if (!db) return false;

      // Si programme devient actif, désactiver les autres (utiliser validatedProgram)
      if (validatedProgram.isActive) {
        await deactivateAllPrograms(db); // ✅ Utiliser DB existante
      }

      const tx = db.transaction([STORE_PROGRAMS], 'readwrite');
      const store = tx.objectStore(STORE_PROGRAMS);
      
      // ✅ PHASE 10.4 : Retry automatique avec backoff exponentiel
      try {
        await putToStoreWithRetry(
          store,
          dataToSave,
          'saveProgram',
          { programId: dataToSave.id, storeName: STORE_PROGRAMS }
        );
        
        log.debug(`Program sauvegardé: ${dataToSave.id}`);
        
        // ✅ PHASE 10.1 : Invalider cache après sauvegarde
        const cache = getNutritionDataCache();
        // Invalider cache programme actif (si activé/désactivé)
        cache.invalidate(cache.generateKey('activeProgram', 'current'));
        // Invalider aussi cache programmes (si modification)
        cache.invalidateType('program');
        
        return true;
      } catch (error) {
        // ✅ OPTIMISATION : Convertir erreur IndexedDB en NutritionError standardisée
        const nutritionError = createNutritionErrorFromIndexedDB(
          error,
          'saveProgram',
          { programId: dataToSave.id, storeName: STORE_PROGRAMS }
        );
        log.error('[saveProgram] Erreur IndexedDB après retry:', nutritionError.toJSON());
        throw nutritionError;
      }
    }
  } catch (error) {
    log.error('Erreur saveProgram:', error);
    return false;
  }
};

/**
 * ✅ OPTIMISATION 1.4 : Désactive tous les programmes (utilisé avant d'activer un nouveau)
 * 
 * ✅ PHASE 12.2 : Migration vers Repository batch (transaction atomique)
 * 
 * @param {IDBDatabase} db - Instance de la DB (optionnel, déprécié avec Repository)
 * @returns {Promise<void>}
 */
const deactivateAllPrograms = async (db = null) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository batch pour désactiver tous les programmes actifs
    try {
      const repository = await getNutritionRepository();
      
      // ✅ Récupérer tous les programmes actifs
      const allPrograms = await repository.getAll(
        STORE_PROGRAMS,
        { 
          filters: (program) => program.isActive === true,
          operationName: 'deactivateAllPrograms:get'
        }
      );
      
      if (allPrograms.length === 0) {
        return; // Rien à désactiver
      }
      
      // ✅ Créer opérations batch pour désactiver tous les programmes actifs
      const operations = allPrograms.map(program => ({
        type: 'save',
        store: STORE_PROGRAMS,
        data: { ...program, isActive: false }
      }));
      
      // ✅ Exécuter batch (transaction atomique)
      const result = await repository.batch(operations, { operationName: 'deactivateAllPrograms' });
      
      if (!result.success) {
        log.warn('[deactivateAllPrograms] Erreur batch, fallback méthode originale');
        throw new Error('Batch failed');
      }
      
      log.debug(`[deactivateAllPrograms] ${allPrograms.length} programmes désactivés`);
      return;
    } catch (error) {
      // ✅ Fallback vers méthode originale si Repository échoue
      log.warn('[deactivateAllPrograms] Fallback méthode originale:', error);
      
      if (!db) {
        db = await openNutritionDB();
        if (!db) return;
      }

      const tx = db.transaction([STORE_PROGRAMS], 'readwrite');
      const store = tx.objectStore(STORE_PROGRAMS);
      
      return new Promise((resolve, reject) => {
        // ✅ CORRECTION : IDBKeyRange.only(true) ne fonctionne pas avec les booléens
        // Récupérer tous les programmes actifs et les désactiver
        const request = store.getAll();
        
        request.onsuccess = () => {
          const programs = request.result || [];
          const activePrograms = programs.filter(p => p.isActive === true);
          
          if (activePrograms.length === 0) {
            resolve();
            return;
          }
          
          // ✅ OPTIMISATION 1.4 : Tous les put() dans la même transaction (exécution batch automatique par IndexedDB)
          activePrograms.forEach(program => {
            program.isActive = false;
            store.put(program); // ✅ Pas besoin de gérer les callbacks individuels
          });
          
          // ✅ Transaction complète résolue automatiquement
          tx.oncomplete = () => resolve();
          tx.onerror = () => {
            log.error('Erreur transaction deactivateAllPrograms:', tx.error);
            reject(tx.error);
          };
        };
        
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    log.error('Erreur deactivateAllPrograms:', error);
  }
};

/**
 * Supprime un programme
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} programId - ID du programme
 * @returns {Promise<boolean>} true si succès
 */
export const deleteProgram = async (programId) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository (cache invalidation + observer intégrés)
    const repository = await getNutritionRepository();
    await repository.delete(
      STORE_PROGRAMS,
      programId,
      { operationName: 'deleteProgram' }
    );
    
    log.debug(`Program supprimé: ${programId}`);
    return true;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[deleteProgram] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return false;

      const tx = db.transaction([STORE_PROGRAMS], 'readwrite');
      const store = tx.objectStore(STORE_PROGRAMS);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(programId);
        request.onsuccess = () => {
          log.debug(`Program supprimé: ${programId}`);
          
          // ✅ PHASE 10.1 : Invalider cache après suppression
          const cache = getNutritionDataCache();
          // Invalider cache programme actif (peut-être supprimé)
          cache.invalidate(cache.generateKey('activeProgram', 'current'));
          // Invalider aussi cache programmes
          cache.invalidateType('program');
          
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur deleteProgram:', error);
      return false;
    }
  }
};

// ==================== FAVORITE FOODS ====================

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
      const existing = await getFavoriteFood(validatedFavoriteFood.id);
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
      const existing = await getFavoriteFood(validatedFavoriteFood.id);
      const dataToSave = {
        ...validatedFavoriteFood,
        lastUsed: new Date().toISOString().split('T')[0],
        usageCount: existing ? (existing.usageCount || 0) + 1 : 1
      };

      const tx = db.transaction([STORE_FAVORITE_FOODS], 'readwrite');
      const store = tx.objectStore(STORE_FAVORITE_FOODS);
      
      return new Promise((resolve, reject) => {
        const request = store.put(dataToSave);
        request.onsuccess = () => {
          log.debug(`FavoriteFood sauvegardé: ${favoriteFood.id}`);
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    log.error('Erreur saveFavoriteFood:', error);
    return false;
  }
};

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

// ==================== HYDRATION LOG ====================

/**
 * Récupère l'entrée d'hydratation pour une date
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Promise<Object|null>} Entrée d'hydratation ou null
 */
export const getHydrationLog = async (date) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository (cache intégré)
    const repository = await getNutritionRepository();
    const result = await repository.get(
      STORE_HYDRATION_LOG,
      date,
      { operationName: 'getHydrationLog' }
    );
    
    if (result) {
      log.debug(`HydrationLog récupéré: ${date}`);
    }
    return result;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getHydrationLog] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return null;

      const tx = db.transaction([STORE_HYDRATION_LOG], 'readonly');
      const store = tx.objectStore(STORE_HYDRATION_LOG);
      
      return new Promise((resolve, reject) => {
        const request = store.get(date);
        request.onsuccess = () => {
          const result = request.result || null;
          if (result) {
            log.debug(`HydrationLog récupéré: ${date}`);
          }
          resolve(result);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getHydrationLog:', error);
      return null;
    }
  }
};

/**
 * Sauvegarde ou met à jour une entrée d'hydratation
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {Object} hydrationEntry - Données d'hydratation
 * @param {string} hydrationEntry.date - Date au format YYYY-MM-DD (keyPath)
 * @param {number} hydrationEntry.waterIntake - Quantité d'eau consommée (ml)
 * @param {number} hydrationEntry.targetWater - Objectif d'eau (ml, optionnel, défaut: 2000ml)
 * @param {Array<Object>} hydrationEntry.entries - Entrées détaillées (optionnel)
 * @param {string} hydrationEntry.notes - Notes (optionnel)
 * @returns {Promise<boolean>} true si succès
 */
export const saveHydrationLog = async (hydrationEntry) => {
  try {
    // ✅ PHASE 10.2 : Validation complète avec Zod
    let validatedHydrationLog;
    try {
      validatedHydrationLog = validateHydrationLog(hydrationEntry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // ✅ Protection : Vérifier que error.errors existe et contient au moins un élément
        if (!error.errors || error.errors.length === 0) {
          log.error('[saveHydrationLog] Erreur validation Zod (pas d\'erreurs détaillées):', error);
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
        log.error('[saveHydrationLog] Erreur validation Zod:', error.errors);
        throw createValidationError(
          NutritionErrorCodes.VALIDATION_INVALID_DATA,
          errorPath,
          hydrationEntry?.[errorField] || null,
          firstError.message || 'Erreur de validation'
        );
      }
      throw error;
    }

    // Valeurs par défaut (déjà validées par Zod, mais appliquer defaults si nécessaire)
    const dataToSave = {
      ...validatedHydrationLog,
      targetWater: validatedHydrationLog.targetWater || 2000, // 2L par défaut si non défini
      lastModified: validatedHydrationLog.lastModified || new Date().toISOString(),
      createdAt: validatedHydrationLog.createdAt || new Date().toISOString()
    };

    // ✅ PHASE 12.2 : Utiliser Repository (validation, cache, observer intégrés)
    try {
      const repository = await getNutritionRepository();
      await repository.save(
        STORE_HYDRATION_LOG,
        dataToSave,
        { validate: false, operationName: 'saveHydrationLog' } // Déjà validé avec Zod
      );
      
      log.debug(`HydrationLog sauvegardé: ${dataToSave.date} (${dataToSave.waterIntake}ml)`);
      return true;
    } catch (error) {
      // ✅ Fallback vers méthode originale si Repository échoue
      log.warn('[saveHydrationLog] Fallback méthode originale:', error);
      
      const db = await openNutritionDB();
      if (!db) return false;

      const tx = db.transaction([STORE_HYDRATION_LOG], 'readwrite');
      const store = tx.objectStore(STORE_HYDRATION_LOG);
      
      return new Promise((resolve, reject) => {
        const request = store.put(dataToSave);
        request.onsuccess = () => {
          log.debug(`HydrationLog sauvegardé: ${dataToSave.date} (${dataToSave.waterIntake}ml)`);
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    }
  } catch (error) {
    log.error('Erreur saveHydrationLog:', error);
    return false;
  }
};

/**
 * Ajoute une quantité d'eau à l'hydratation du jour
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @param {number} amount - Quantité d'eau à ajouter (ml)
 * @param {Object} options - Options
 * @param {string} options.entryType - Type d'entrée ('manual', 'bottle', 'glass', etc.)
 * @param {string} options.notes - Notes pour cette entrée
 * @returns {Promise<boolean>} true si succès
 */
export const addWaterIntake = async (date, amount, options = {}) => {
  try {
    if (!date || !amount || amount <= 0) {
      throw new Error('date et amount (positif) requis');
    }

    // Récupérer entrée existante ou créer nouvelle
    const existing = await getHydrationLog(date);
    const currentIntake = existing?.waterIntake || 0;
    const targetWater = existing?.targetWater || 2000;
    const existingEntries = existing?.entries || [];

    // Créer nouvelle entrée détaillée
    const newEntry = {
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      amount: amount,
      type: options.entryType || 'manual',
      notes: options.notes || ''
    };

    // Mettre à jour
    const updated = {
      date,
      waterIntake: currentIntake + amount,
      targetWater,
      entries: [...existingEntries, newEntry],
      notes: existing?.notes || '',
      lastModified: new Date().toISOString(),
      createdAt: existing?.createdAt || new Date().toISOString()
    };

    return await saveHydrationLog(updated);
  } catch (error) {
    log.error('Erreur addWaterIntake:', error);
    return false;
  }
};

/**
 * Récupère les entrées d'hydratation sur une plage de dates
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @returns {Promise<Array>} Tableau d'entrées d'hydratation (triées par date)
 */
export const getHydrationLogByRange = async (startDate, endDate) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository avec filtre par plage de dates
    const repository = await getNutritionRepository();
    const allEntries = await repository.getAll(
      STORE_HYDRATION_LOG,
      { 
        filters: (entry) => entry.date >= startDate && entry.date <= endDate,
        operationName: 'getHydrationLogByRange'
      }
    );
    
    // ✅ Trier par date (croissant) comme l'implémentation originale
    allEntries.sort((a, b) => a.date.localeCompare(b.date));
    
    log.debug(`HydrationLog récupéré: ${allEntries.length} entrées entre ${startDate} et ${endDate}`);
    return allEntries;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[getHydrationLogByRange] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return [];

      const tx = db.transaction([STORE_HYDRATION_LOG], 'readonly');
      const store = tx.objectStore(STORE_HYDRATION_LOG);
      
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const allEntries = request.result || [];
          
          // Filtrer par plage de dates
          const filtered = allEntries.filter(entry => {
            const entryDate = entry.date;
            return entryDate >= startDate && entryDate <= endDate;
          });
          
          // Trier par date (croissant)
          filtered.sort((a, b) => a.date.localeCompare(b.date));
          
          log.debug(`HydrationLog récupéré: ${filtered.length} entrées entre ${startDate} et ${endDate}`);
          resolve(filtered);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur getHydrationLogByRange:', error);
      return [];
    }
  }
};

/**
 * Supprime une entrée d'hydratation
 * 
 * ✅ PHASE 12.2 : Migration vers Repository pattern (rétrocompatible)
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Promise<boolean>} true si succès
 */
export const deleteHydrationLog = async (date) => {
  try {
    // ✅ PHASE 12.2 : Utiliser Repository (cache invalidation + observer intégrés)
    const repository = await getNutritionRepository();
    await repository.delete(
      STORE_HYDRATION_LOG,
      date,
      { operationName: 'deleteHydrationLog' }
    );
    
    log.debug(`HydrationLog supprimé: ${date}`);
    return true;
  } catch (error) {
    // ✅ Fallback vers méthode originale si Repository échoue
    log.warn('[deleteHydrationLog] Fallback méthode originale:', error);
    
    try {
      const db = await openNutritionDB();
      if (!db) return false;

      const tx = db.transaction([STORE_HYDRATION_LOG], 'readwrite');
      const store = tx.objectStore(STORE_HYDRATION_LOG);
      
      return new Promise((resolve, reject) => {
        const request = store.delete(date);
        request.onsuccess = () => {
          log.debug(`HydrationLog supprimé: ${date}`);
          resolve(true);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      log.error('Erreur deleteHydrationLog:', error);
      return false;
    }
  }
};
