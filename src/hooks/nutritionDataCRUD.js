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
        
        // Désactiver tous les programmes actifs
        let updateCount = 0;
        activePrograms.forEach(program => {
          program.isActive = false;
          const updateRequest = store.put(program);
          updateRequest.onsuccess = () => {
            updateCount++;
            if (updateCount === activePrograms.length) {
              resolve();
            }
          };
          updateRequest.onerror = () => {
            log.warn(`Erreur désactivation programme ${program.id}`);
            updateCount++;
            if (updateCount === activePrograms.length) {
              resolve(); // Résoudre quand même pour ne pas bloquer
            }
          };
        });
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

