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
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    log.error('Erreur getDailyMeal:', error);
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
    if (!dailyMeal || !dailyMeal.date) {
      throw new Error('dailyMeal doit contenir une date');
    }

    const db = await openNutritionDB();
    if (!db) {
      log.warn('DB non disponible pour saveDailyMeal');
      return false;
    }

    // Ajouter lastModified si absent
    const dataToSave = {
      ...dailyMeal,
      lastModified: dailyMeal.lastModified || new Date().toISOString()
    };

    const tx = db.transaction([STORE_DAILY_MEALS], 'readwrite');
    const store = tx.objectStore(STORE_DAILY_MEALS);
    
    return new Promise((resolve, reject) => {
      const request = store.put(dataToSave);
      request.onsuccess = () => {
        log.debug(`DailyMeal sauvegardé: ${dailyMeal.date}`);
        resolve(true);
      };
      request.onerror = () => {
        log.error('Erreur saveDailyMeal:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    log.error('Erreur saveDailyMeal:', error);
    return false;
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
    if (!meal || !meal.id) {
      throw new Error('meal doit contenir un id');
    }

    const db = await openNutritionDB();
    if (!db) return false;

    // Ajouter timestamp si absent
    const dataToSave = {
      ...meal,
      timestamp: meal.timestamp || new Date().toISOString()
    };

    const tx = db.transaction([STORE_MEALS], 'readwrite');
    const store = tx.objectStore(STORE_MEALS);
    
    return new Promise((resolve, reject) => {
      const request = store.put(dataToSave);
      request.onsuccess = () => {
        log.debug(`Meal sauvegardé: ${meal.id}`);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    log.error('Erreur saveMeal:', error);
    return false;
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
 * Sauvegarde plusieurs repas en une seule transaction (performance ×100)
 * 
 * @param {Array<Object>} meals - Tableau de meals à sauvegarder
 * @returns {Promise<boolean>} true si succès
 */
export const saveMealsBatch = async (meals) => {
  try {
    if (!Array.isArray(meals) || meals.length === 0) {
      return true; // Rien à faire
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
        log.debug(`${meals.length} meals sauvegardés en batch`);
        resolve(true);
      };
      tx.onerror = () => {
        log.error('Erreur saveMealsBatch:', tx.error);
        reject(tx.error);
      };
    });
  } catch (error) {
    log.error('Erreur saveMealsBatch:', error);
    return false;
  }
};

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
      // Utiliser getAll avec IDBKeyRange.only(true) pour index booléen
      const range = IDBKeyRange.only(true);
      const request = index.getAll(range);
      
      request.onsuccess = () => {
        // Prendre le premier programme actif (normalement il n'y en a qu'un)
        const results = request.result || [];
        resolve(results.length > 0 ? results[0] : null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    log.error('Erreur getActiveProgram:', error);
    return null;
  }
};

/**
 * Sauvegarde ou met à jour un programme
 * 
 * @param {Object} program - Données du programme (doit contenir 'id')
 * @returns {Promise<boolean>} true si succès
 */
export const saveProgram = async (program) => {
  try {
    if (!program || !program.id) {
      throw new Error('program doit contenir un id');
    }

    const db = await openNutritionDB();
    if (!db) return false;

    // Si programme devient actif, désactiver les autres
    if (program.isActive) {
      await deactivateAllPrograms(db);
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
 * Désactive tous les programmes (utilisé avant d'activer un nouveau)
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
    const index = store.index('isActive');
    
    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(true));
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.value.isActive = false;
          cursor.update(cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
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
    
    let index = store;
    let range = null;

    // Filtrer par favoris uniquement
    if (options.favoritesOnly) {
      index = store.index('isFavorite');
      range = IDBKeyRange.only(true);
    }
    // Filtrer par catégorie
    else if (options.category) {
      index = store.index('category');
      range = IDBKeyRange.only(options.category);
    }

    return new Promise((resolve, reject) => {
      const request = range ? index.getAll(range) : store.getAll();
      request.onsuccess = () => {
        let results = request.result || [];
        
        // Filtrer par catégorie si favoritesOnly est aussi activé
        if (options.favoritesOnly && options.category) {
          results = results.filter(food => 
            food.isFavorite && food.category === options.category
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

