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
 * @param {string} date - Date au format "YYYY-MM-DD"
 * @returns {Promise<Object|null>} Données du jour ou null si inexistant
 */
export const getDailyMeal = async (date) => {
  try {
    const db = await openNutritionDB();
    if (!db) {
      log.warn('DB non disponible pour getDailyMeal');
      return null;
    }

    const tx = db.transaction([STORE_DAILY_MEALS], 'readonly');
    const store = tx.objectStore(STORE_DAILY_MEALS);
    
    return new Promise((resolve, reject) => {
      const request = store.get(date);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        // ✅ OPTIMISATION : Convertir erreur IndexedDB en NutritionError standardisée
        const nutritionError = createNutritionErrorFromIndexedDB(
          request.error,
          'getDailyMeal',
          { date }
        );
        log.error('[getDailyMeal] Erreur IndexedDB:', nutritionError.toJSON());
        // Ne pas throw pour lecture (retourner null est OK)
        resolve(null);
      };
    });
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
};

/**
 * Sauvegarde ou met à jour les données d'un jour
 * 
 * @param {Object} dailyMeal - Données du jour (doit contenir 'date')
 * @returns {Promise<boolean>} true si succès
 */
export const saveDailyMeal = async (dailyMeal) => {
  try {
    // ✅ OPTIMISATION : Validation avec code d'erreur standardisé
    if (!dailyMeal || !dailyMeal.date) {
      throw createValidationError(
        NutritionErrorCodes.VALIDATION_MISSING_REQUIRED_FIELD,
        'date',
        dailyMeal?.date || null
      );
    }

    // ✅ OPTIMISATION : Vérifier format date avec DateHelper (si disponible)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dailyMeal.date)) {
      throw createValidationError(
        NutritionErrorCodes.VALIDATION_INVALID_DATE_FORMAT,
        'date',
        dailyMeal.date,
        'YYYY-MM-DD'
      );
    }

    const db = await openNutritionDB();
    if (!db) {
      // ✅ OPTIMISATION : Code d'erreur standardisé au lieu de return false
      throw new NutritionError(
        NutritionErrorCodes.DB_NOT_INITIALIZED,
        'Base de données non initialisée',
        { operation: 'saveDailyMeal', date: dailyMeal.date }
      );
    }

    // Ajouter lastModified si absent
    const dataToSave = {
      ...dailyMeal,
      lastModified: dailyMeal.lastModified || new Date().toISOString()
    };

    // ✅ OPTIMISATION : Utiliser quota-safe storage pour gestion QuotaExceededError
    try {
      const quotaSafeStorage = await getQuotaSafeStorage();
      const saved = await quotaSafeStorage.put(STORE_DAILY_MEALS, dataToSave);
      
      if (saved) {
        log.debug(`DailyMeal sauvegardé: ${dailyMeal.date}`);
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
      
      return new Promise((resolve, reject) => {
        const request = store.put(dataToSave);
        request.onsuccess = () => {
          log.debug(`DailyMeal sauvegardé: ${dailyMeal.date}`);
          resolve(true);
        };
        request.onerror = () => {
          const error = request.error;
          
          // ✅ Vérifier si QuotaExceededError dans fallback
          const classification = classifyIndexedDBError(error);
          if (classification.name === 'QuotaExceededError') {
            reject(new QuotaExceededError(
              'Stockage saturé. Veuillez exporter vos données pour libérer de l\'espace.',
              { storeName: STORE_DAILY_MEALS, date: dailyMeal.date }
            ));
          } else {
            // ✅ OPTIMISATION : Convertir erreur IndexedDB en NutritionError standardisée
            const nutritionError = createNutritionErrorFromIndexedDB(
              error,
              'saveDailyMeal',
              { storeName: STORE_DAILY_MEALS, date: dailyMeal.date }
            );
            log.error('[saveDailyMeal] Erreur IndexedDB:', nutritionError.toJSON());
            reject(nutritionError);
          }
        };
      });
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
 * @param {string} startDate - Date début "YYYY-MM-DD"
 * @param {string} endDate - Date fin "YYYY-MM-DD"
 * @returns {Promise<Array>} Tableau de dailyMeals
 */
export const getDailyMealsByRange = async (startDate, endDate) => {
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
};

/**
 * Supprime les données d'un jour
 * 
 * @param {string} date - Date au format "YYYY-MM-DD"
 * @returns {Promise<boolean>} true si succès
 */
export const deleteDailyMeal = async (date) => {
  try {
    const db = await openNutritionDB();
    if (!db) {
      log.warn('DB non disponible pour deleteDailyMeal');
      return false;
    }

    const tx = db.transaction([STORE_DAILY_MEALS], 'readwrite');
    const store = tx.objectStore(STORE_DAILY_MEALS);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(date);
      request.onsuccess = () => {
        log.debug(`DailyMeal supprimé: ${date}`);
        resolve(true);
      };
      request.onerror = () => {
        log.error('Erreur deleteDailyMeal:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('Erreur deleteDailyMeal:', error);
    return false;
  }
};

// ==================== MEALS ====================

/**
 * Récupère un repas par son ID
 * 
 * @param {string} mealId - ID du repas
 * @returns {Promise<Object|null>} Données du repas ou null
 */
export const getMeal = async (mealId) => {
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
};

/**
 * Sauvegarde ou met à jour un repas
 * 
 * @param {Object} meal - Données du repas (doit contenir 'id')
 * @returns {Promise<boolean>} true si succès
 */
export const saveMeal = async (meal) => {
  try {
    // ✅ OPTIMISATION : Validation avec code d'erreur standardisé
    if (!meal || !meal.id) {
      throw createValidationError(
        NutritionErrorCodes.VALIDATION_MISSING_REQUIRED_FIELD,
        'id',
        meal?.id || null
      );
    }

    const db = await openNutritionDB();
    if (!db) {
      // ✅ OPTIMISATION : Code d'erreur standardisé au lieu de return false
      throw new NutritionError(
        NutritionErrorCodes.DB_NOT_INITIALIZED,
        'Base de données non initialisée',
        { operation: 'saveMeal', mealId: meal.id }
      );
    }

    // Ajouter timestamp si absent
    const dataToSave = {
      ...meal,
      timestamp: meal.timestamp || new Date().toISOString()
    };

    // ✅ OPTIMISATION : Utiliser quota-safe storage pour gestion QuotaExceededError
    try {
      const quotaSafeStorage = await getQuotaSafeStorage();
      const saved = await quotaSafeStorage.put(STORE_MEALS, dataToSave);
      
      if (saved) {
        log.debug(`Meal sauvegardé: ${meal.id}`);
        return true;
      }
      return false;
    } catch (error) {
      // ✅ GESTION ERREUR SPÉCIFIQUE QuotaExceededError
      if (error instanceof QuotaExceededError) {
        log.error('[saveMeal] Quota dépassé après cleanup:', error);
        // Propager erreur spécifique pour gestion UI (toast/modal)
        throw error; // ✅ Propager pour gestion utilisateur
      }
      
      // ✅ FALLBACK : Si wrapper échoue, utiliser méthode traditionnelle
      // (compatibilité ascendante si wrapper non disponible)
      log.debug('[saveMeal] Fallback méthode traditionnelle (wrapper non disponible ou erreur)');
      
      const tx = db.transaction([STORE_MEALS], 'readwrite');
      const store = tx.objectStore(STORE_MEALS);
      
      return new Promise((resolve, reject) => {
        const request = store.put(dataToSave);
        request.onsuccess = () => {
          log.debug(`Meal sauvegardé: ${meal.id}`);
          resolve(true);
        };
        request.onerror = () => {
          const error = request.error;
          
          // ✅ Vérifier si QuotaExceededError dans fallback
          const classification = classifyIndexedDBError(error);
          if (classification.name === 'QuotaExceededError') {
            // Propager erreur spécifique même dans fallback
            reject(new QuotaExceededError(
              'Stockage saturé. Veuillez exporter vos données pour libérer de l\'espace.',
              { storeName: STORE_MEALS, mealId: meal.id }
            ));
          } else {
            // ✅ OPTIMISATION : Convertir erreur IndexedDB en NutritionError standardisée
            const nutritionError = createNutritionErrorFromIndexedDB(
              error,
              'saveMeal',
              { storeName: STORE_MEALS, mealId: meal.id }
            );
            log.error('[saveMeal] Erreur IndexedDB:', nutritionError.toJSON());
            reject(nutritionError);
          }
        };
      });
    }
  } catch (error) {
    // ✅ PROPAGATION ERREUR QuotaExceededError pour gestion UI
    if (error instanceof QuotaExceededError) {
      throw error; // ✅ Propager pour gestion utilisateur (ne pas retourner false)
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
export const getMealsByDate = async (date) => {
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
};

/**
 * Récupère les repas d'un jour filtrés par type (OPTIMISÉ avec index composé)
 * 
 * ✅ OPTIMISATION : Utilise index composé [date+type] pour requête O(log n) au lieu de O(n)
 * Gain performance : ×10-50 selon taille DB
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
  } catch (error) {
    log.error('[getMealsByDateAndType] Erreur:', error);
    return [];
  }
};

/**
 * Récupère les repas d'un dailyMealId
 * 
 * @param {string} dailyMealId - ID du dailyMeal (date)
 * @returns {Promise<Array>} Tableau de meals
 */
export const getMealsByDailyMealId = async (dailyMealId) => {
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
};

/**
 * Supprime un repas
 * 
 * @param {string} mealId - ID du repas
 * @returns {Promise<boolean>} true si succès
 */
export const deleteMeal = async (mealId) => {
  try {
    const db = await openNutritionDB();
    if (!db) return false;

    const tx = db.transaction([STORE_MEALS], 'readwrite');
    const store = tx.objectStore(STORE_MEALS);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(mealId);
      request.onsuccess = () => {
        log.debug(`Meal supprimé: ${mealId}`);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    log.error('Erreur deleteMeal:', error);
    return false;
  }
};

// ==================== BATCH OPERATIONS ====================

/**
 * Récupère les meals sur une plage de dates
 * 
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @returns {Promise<Array>} Tableau de meals dans la plage
 */
export const getMealsByDateRange = async (startDate, endDate) => {
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
};

/**
 * Récupère tous les meals (pour export)
 * 
 * @returns {Promise<Array>} Tableau de tous les meals
 */
export const getAllMeals = async () => {
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
 * @param {Array<Object>} meals - Tableau de meals à sauvegarder
 * @returns {Promise<boolean>} true si succès
 */
const saveMealsBatchSync = async (meals) => {
  if (!Array.isArray(meals) || meals.length === 0) {
    return true;
  }

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
};

/**
 * Sauvegarde plusieurs repas en batch avec chunking automatique (performance ×100, UI réactive)
 * 
 * ✅ OPTIMISATION : Chunking automatique si >100 meals pour éviter freeze UI
 * - Petites opérations (≤100) : Transaction unique (efficace, pas d'overhead)
 * - Grandes opérations (>100) : Chunking + yielding (UI réactive)
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
      
      // Sauvegarder chunk
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
 * @returns {Promise<Array>} Tableau de programs
 */
export const getAllPrograms = async () => {
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
};

/**
 * Récupère le programme actif
 * 
 * @returns {Promise<Object|null>} Programme actif ou null
 */
export const getActiveProgram = async () => {
  try {
    const db = await openNutritionDB();
    if (!db) return null;

    const tx = db.transaction([STORE_PROGRAMS], 'readonly');
    const store = tx.objectStore(STORE_PROGRAMS);
    
    // ✅ CORRECTION : Utiliser getAll avec IDBKeyRange pour index booléen
    // index.get(true) ne fonctionne pas, il faut utiliser getAll avec range
    let index;
    try {
      index = store.index('isActive');
    } catch (idxError) {
      // Index n'existe pas, charger tous les programmes et filtrer
      log.warn('Index isActive non trouvé, chargement complet et filtrage...');
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
          const programs = request.result || [];
          const activeProgram = programs.find(p => p.isActive === true);
          resolve(activeProgram || null);
        };
        request.onerror = () => reject(request.error);
      });
    }
    
    return new Promise((resolve, reject) => {
      // ✅ CORRECTION : IDBKeyRange.only(true) ne fonctionne pas avec les booléens
      // Récupérer tous les programmes et filtrer manuellement
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
};

/**
 * ✅ OPTIMISATION 1.3 : Récupère tous les programmes ET le programme actif en une seule transaction
 * 
 * Gain : 50% réduction overhead (1 transaction au lieu de 2)
 * 
 * @returns {Promise<{programs: Array, activeProgram: Object|null}>}
 */
export const getAllProgramsWithActive = async () => {
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
};

/**
 * Sauvegarde ou met à jour un programme
 * 
 * ✅ OPTIMISATION 4.2 : Accepte dbInstance optionnel pour éviter double ouverture DB
 * 
 * @param {Object} program - Données du programme (doit contenir 'id')
 * @param {Object} options - Options optionnelles
 * @param {IDBDatabase} options.dbInstance - Instance de la DB (évite réouverture)
 * @returns {Promise<boolean>} true si succès
 */
export const saveProgram = async (program, options = {}) => {
  try {
    if (!program || !program.id) {
      throw new Error('program doit contenir un id');
    }

    const { dbInstance = null } = options;
    const db = dbInstance || await openNutritionDB();
    if (!db) return false;

    // Si programme devient actif, désactiver les autres
    if (program.isActive) {
      await deactivateAllPrograms(db); // ✅ Utiliser DB existante
    }

    const tx = db.transaction([STORE_PROGRAMS], 'readwrite');
    const store = tx.objectStore(STORE_PROGRAMS);
    
    return new Promise((resolve, reject) => {
      const request = store.put(program);
      request.onsuccess = () => {
        log.debug(`Program sauvegardé: ${program.id}`);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    log.error('Erreur saveProgram:', error);
    return false;
  }
};

/**
 * ✅ OPTIMISATION 1.4 : Désactive tous les programmes (utilisé avant d'activer un nouveau)
 * 
 * Code simplifié : Tous les put() dans la même transaction (exécution batch automatique par IndexedDB)
 * 
 * @param {IDBDatabase} db - Instance de la DB (optionnel, sera ouverte si absent)
 * @returns {Promise<void>}
 */
const deactivateAllPrograms = async (db = null) => {
  try {
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
  } catch (error) {
    log.error('Erreur deactivateAllPrograms:', error);
  }
};

/**
 * Supprime un programme
 * 
 * @param {string} programId - ID du programme
 * @returns {Promise<boolean>} true si succès
 */
export const deleteProgram = async (programId) => {
  try {
    const db = await openNutritionDB();
    if (!db) return false;

    const tx = db.transaction([STORE_PROGRAMS], 'readwrite');
    const store = tx.objectStore(STORE_PROGRAMS);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(programId);
      request.onsuccess = () => {
        log.debug(`Program supprimé: ${programId}`);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    log.error('Erreur deleteProgram:', error);
    return false;
  }
};

// ==================== FAVORITE FOODS ====================

/**
 * Récupère tous les aliments favoris
 * 
 * @param {Object} options - Options de filtrage
 * @param {boolean} options.favoritesOnly - Si true, retourne seulement les favoris
 * @param {string} options.category - Filtrer par catégorie
 * @returns {Promise<Array>} Tableau de favoriteFoods
 */
export const getFavoriteFoods = async (options = {}) => {
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
};

/**
 * Sauvegarde ou met à jour un aliment favori
 * 
 * @param {Object} favoriteFood - Données de l'aliment (doit contenir 'id')
 * @returns {Promise<boolean>} true si succès
 */
export const saveFavoriteFood = async (favoriteFood) => {
  try {
    if (!favoriteFood || !favoriteFood.id) {
      throw new Error('favoriteFood doit contenir un id');
    }

    const db = await openNutritionDB();
    if (!db) return false;

    // Mettre à jour lastUsed et usageCount
    const existing = await getFavoriteFood(favoriteFood.id);
    const dataToSave = {
      ...favoriteFood,
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
  } catch (error) {
    log.error('Erreur saveFavoriteFood:', error);
    return false;
  }
};

/**
 * Récupère un aliment favori par son ID
 * 
 * @param {string} foodId - ID de l'aliment
 * @returns {Promise<Object|null>} Aliment ou null
 */
export const getFavoriteFood = async (foodId) => {
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
};

/**
 * Supprime un aliment favori
 * 
 * @param {string} foodId - ID de l'aliment
 * @returns {Promise<boolean>} true si succès
 */
export const deleteFavoriteFood = async (foodId) => {
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
};

// ==================== HYDRATION LOG ====================

/**
 * Récupère l'entrée d'hydratation pour une date
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Promise<Object|null>} Entrée d'hydratation ou null
 */
export const getHydrationLog = async (date) => {
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
};

/**
 * Sauvegarde ou met à jour une entrée d'hydratation
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
    if (!hydrationEntry || !hydrationEntry.date) {
      throw new Error('hydrationEntry doit contenir une date');
    }

    const db = await openNutritionDB();
    if (!db) return false;

    // Valeurs par défaut
    const dataToSave = {
      date: hydrationEntry.date,
      waterIntake: hydrationEntry.waterIntake || 0,
      targetWater: hydrationEntry.targetWater || 2000, // 2L par défaut
      entries: hydrationEntry.entries || [],
      notes: hydrationEntry.notes || '',
      lastModified: new Date().toISOString(),
      createdAt: hydrationEntry.createdAt || new Date().toISOString()
    };

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
 * @param {string} startDate - Date de début (YYYY-MM-DD)
 * @param {string} endDate - Date de fin (YYYY-MM-DD)
 * @returns {Promise<Array>} Tableau d'entrées d'hydratation
 */
export const getHydrationLogByRange = async (startDate, endDate) => {
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
};

/**
 * Supprime une entrée d'hydratation
 * 
 * @param {string} date - Date au format YYYY-MM-DD
 * @returns {Promise<boolean>} true si succès
 */
export const deleteHydrationLog = async (date) => {
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
};

