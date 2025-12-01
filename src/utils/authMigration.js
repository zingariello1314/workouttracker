import logger from './logger';
import { getAllBooksFromIndexedDB, saveBooksToIndexedDB } from './booksIndexedDB';
import { openNutritionDB, STORE_DAILY_MEALS, STORE_MEALS, STORE_PROGRAMS, STORE_FAVORITE_FOODS, STORE_HYDRATION_LOG } from '../hooks/nutritionDataUtils';
import { openDB, STORE_ACTIVITIES, STORE_DAILY_METRICS } from '../hooks/garminDataUtils';

/**
 * Ouvre la base de données WorkoutTrackerDB pour Body Tracking et Programmes
 */
const openWorkoutDB = () => {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open('WorkoutTrackerDB');
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Créer le store 'workouts' s'il n'existe pas
      if (!db.objectStoreNames.contains('workouts')) {
        const workoutStore = db.createObjectStore('workouts', { keyPath: 'id' });
        workoutStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      log.error('[auth-migration] Erreur ouverture WorkoutTrackerDB:', event.target.error);
      resolve(null);
    };
  });
};

const log = logger.module('AuthMigration');

/**
 * Migre les données "anonymes" (sans userId) vers un utilisateur donné.
 * ✅ Migration complète : Livres, Nutrition, Body Tracking, Garmin, Programmes
 * 
 * @param {string} userId - ID de l'utilisateur vers lequel migrer
 * @param {Function} [onProgress] - Callback de progression : (step, current, total, message) => void
 * @returns {Promise<{success: boolean, migratedBooks: number, migratedNutrition: number, migratedBodyTracking: number, migratedGarmin: number, migratedPrograms: number}>}
 */
export const migrateDataToUser = async (userId, onProgress) => {
  if (!userId) {
    return { 
      success: false, 
      migratedBooks: 0,
      migratedNutrition: 0,
      migratedBodyTracking: 0,
      migratedGarmin: 0,
      migratedPrograms: 0
    };
  }

  const results = {
    migratedBooks: 0,
    migratedNutrition: 0,
    migratedBodyTracking: 0,
    migratedGarmin: 0,
    migratedPrograms: 0
  };

  const totalSteps = 5;
  let currentStep = 0;

  try {
    // 1. Migration des livres
    currentStep = 1;
    if (onProgress) onProgress(currentStep, totalSteps, 'Migration des livres...');
    log.debug('[auth-migration] Début migration livres...');
    const booksResult = await migrateBooks(userId);
    results.migratedBooks = booksResult.migratedBooks || 0;
    if (onProgress) onProgress(currentStep, totalSteps, `${results.migratedBooks} livres migrés`);

    // 2. Migration Nutrition
    currentStep = 2;
    if (onProgress) onProgress(currentStep, totalSteps, 'Migration de la nutrition...');
    log.debug('[auth-migration] Début migration Nutrition...');
    const nutritionResult = await migrateNutrition(userId);
    results.migratedNutrition = nutritionResult.migrated || 0;
    if (onProgress) onProgress(currentStep, totalSteps, `${results.migratedNutrition} entrées nutrition migrées`);

    // 3. Migration Body Tracking
    currentStep = 3;
    if (onProgress) onProgress(currentStep, totalSteps, 'Migration du suivi corporel...');
    log.debug('[auth-migration] Début migration Body Tracking...');
    const bodyTrackingResult = await migrateBodyTracking(userId);
    results.migratedBodyTracking = bodyTrackingResult.migrated || 0;
    if (onProgress) onProgress(currentStep, totalSteps, `${results.migratedBodyTracking} entrées suivi corporel migrées`);

    // 4. Migration Garmin
    currentStep = 4;
    if (onProgress) onProgress(currentStep, totalSteps, 'Migration des données Garmin...');
    log.debug('[auth-migration] Début migration Garmin...');
    const garminResult = await migrateGarmin(userId);
    results.migratedGarmin = garminResult.migrated || 0;
    if (onProgress) onProgress(currentStep, totalSteps, `${results.migratedGarmin} entrées Garmin migrées`);

    // 5. Migration Programmes
    currentStep = 5;
    if (onProgress) onProgress(currentStep, totalSteps, 'Migration des programmes...');
    log.debug('[auth-migration] Début migration Programmes...');
    const programsResult = await migratePrograms(userId);
    results.migratedPrograms = programsResult.migrated || 0;
    if (onProgress) onProgress(currentStep, totalSteps, `${results.migratedPrograms} programmes migrés`);

    const totalMigrated = 
      results.migratedBooks + 
      results.migratedNutrition + 
      results.migratedBodyTracking + 
      results.migratedGarmin + 
      results.migratedPrograms;

    log.debug('✅ Migration complète terminée', { userId, ...results, totalMigrated });

    return { success: true, ...results };
  } catch (error) {
    log.error('❌ Erreur lors de la migration des données vers l\'utilisateur', error);
    return { success: false, ...results };
  }
};

/**
 * Migre les livres sans userId vers un utilisateur
 */
const migrateBooks = async (userId) => {
  let migratedBooks = 0;

  try {
    const allBooks = await getAllBooksFromIndexedDB();
    log.debug('[auth-migration]', allBooks.length, 'livres trouvés au total');
    
    if (Array.isArray(allBooks) && allBooks.length > 0) {
      const booksToMigrate = [];
      const booksToKeep = [];
      
      allBooks.forEach((book) => {
        if (!book) return;
        
        if (!book.userId) {
          migratedBooks += 1;
          booksToMigrate.push({ ...book, userId });
        } else {
          booksToKeep.push(book);
        }
      });

      if (migratedBooks > 0) {
        log.debug('[auth-migration]', migratedBooks, 'livres à migrer');
        const allBooksToSave = [...booksToMigrate, ...booksToKeep];
        const ok = await saveBooksToIndexedDB(allBooksToSave);
        
        if (!ok) {
          log.error('[auth-migration] ❌ Échec de la sauvegarde des livres migrés');
          return { success: false, migratedBooks: 0 };
        }
        log.debug('[auth-migration] ✅ Migration des livres effectuée', { userId, migratedBooks });
      }
    }

    return { success: true, migratedBooks };
  } catch (error) {
    log.error('[auth-migration] ❌ Erreur migration livres', error);
    return { success: false, migratedBooks: 0 };
  }
};

/**
 * Migre les données Nutrition sans userId vers un utilisateur
 */
const migrateNutrition = async (userId) => {
  let migrated = 0;

  try {
    const db = await openNutritionDB();
    if (!db) {
      log.warn('[auth-migration] IndexedDB Nutrition non disponible');
      return { success: false, migrated: 0 };
    }

    // Migration dailyMeals
    const dailyMealsTx = db.transaction([STORE_DAILY_MEALS], 'readwrite');
    const dailyMealsStore = dailyMealsTx.objectStore(STORE_DAILY_MEALS);
    const allDailyMeals = await new Promise((resolve, reject) => {
      const req = dailyMealsStore.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const dailyMeal of allDailyMeals) {
      if (!dailyMeal || dailyMeal.userId) continue;
      dailyMeal.userId = userId;
      await new Promise((resolve, reject) => {
        const putReq = dailyMealsStore.put(dailyMeal);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      });
      migrated += 1;
    }
    await new Promise((resolve, reject) => {
      dailyMealsTx.oncomplete = () => resolve();
      dailyMealsTx.onerror = () => reject(dailyMealsTx.error);
    });

    // Migration meals
    const mealsTx = db.transaction([STORE_MEALS], 'readwrite');
    const mealsStore = mealsTx.objectStore(STORE_MEALS);
    const allMeals = await new Promise((resolve, reject) => {
      const req = mealsStore.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const meal of allMeals) {
      if (!meal || meal.userId) continue;
      meal.userId = userId;
      await new Promise((resolve, reject) => {
        const putReq = mealsStore.put(meal);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      });
      migrated += 1;
    }
    await new Promise((resolve, reject) => {
      mealsTx.oncomplete = () => resolve();
      mealsTx.onerror = () => reject(mealsTx.error);
    });

    // Migration programs
    const programsTx = db.transaction([STORE_PROGRAMS], 'readwrite');
    const programsStore = programsTx.objectStore(STORE_PROGRAMS);
    const allPrograms = await new Promise((resolve, reject) => {
      const req = programsStore.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const program of allPrograms) {
      if (!program || program.userId) continue;
      program.userId = userId;
      await new Promise((resolve, reject) => {
        const putReq = programsStore.put(program);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      });
      migrated += 1;
    }
    await new Promise((resolve, reject) => {
      programsTx.oncomplete = () => resolve();
      programsTx.onerror = () => reject(programsTx.error);
    });

    // Migration favoriteFoods
    const favoritesTx = db.transaction([STORE_FAVORITE_FOODS], 'readwrite');
    const favoritesStore = favoritesTx.objectStore(STORE_FAVORITE_FOODS);
    const allFavorites = await new Promise((resolve, reject) => {
      const req = favoritesStore.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const favorite of allFavorites) {
      if (!favorite || favorite.userId) continue;
      favorite.userId = userId;
      await new Promise((resolve, reject) => {
        const putReq = favoritesStore.put(favorite);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      });
      migrated += 1;
    }
    await new Promise((resolve, reject) => {
      favoritesTx.oncomplete = () => resolve();
      favoritesTx.onerror = () => reject(favoritesTx.error);
    });

    // Migration hydrationLog
    const hydrationTx = db.transaction([STORE_HYDRATION_LOG], 'readwrite');
    const hydrationStore = hydrationTx.objectStore(STORE_HYDRATION_LOG);
    const allHydration = await new Promise((resolve, reject) => {
      const req = hydrationStore.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const hydration of allHydration) {
      if (!hydration || hydration.userId) continue;
      hydration.userId = userId;
      await new Promise((resolve, reject) => {
        const putReq = hydrationStore.put(hydration);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      });
      migrated += 1;
    }
    await new Promise((resolve, reject) => {
      hydrationTx.oncomplete = () => resolve();
      hydrationTx.onerror = () => reject(hydrationTx.error);
    });

    log.debug('[auth-migration] ✅ Migration Nutrition effectuée', { userId, migrated });
    return { success: true, migrated };
  } catch (error) {
    log.error('[auth-migration] ❌ Erreur migration Nutrition', error);
    return { success: false, migrated: 0 };
  }
};

/**
 * Migre les données Body Tracking sans userId vers un utilisateur
 */
const migrateBodyTracking = async (userId) => {
  let migrated = 0;

  try {
    const db = await openWorkoutDB();
    if (!db) {
      log.warn('[auth-migration] IndexedDB Workout non disponible');
      return { success: false, migrated: 0 };
    }

    // Body Tracking est stocké dans le store 'workouts' avec id = storageKey
    const store = db.transaction(['workouts'], 'readonly').objectStore('workouts');
    const allData = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const writeTx = db.transaction(['workouts'], 'readwrite');
    const writeStore = writeTx.objectStore('workouts');

    for (const dataEntry of allData) {
      if (!dataEntry) continue;

      let hasChanges = false;

      // Migrer progressPhotos
      if (Array.isArray(dataEntry.progressPhotos)) {
        for (const photo of dataEntry.progressPhotos) {
          if (!photo.userId) {
            photo.userId = userId;
            hasChanges = true;
            migrated += 1;
          }
        }
      }

      // Migrer progressEntries
      if (Array.isArray(dataEntry.progressEntries)) {
        for (const entry of dataEntry.progressEntries) {
          if (!entry.userId) {
            entry.userId = userId;
            hasChanges = true;
            migrated += 1;
          }
        }
      }

      // Migrer bodyTrackingReminders
      if (Array.isArray(dataEntry.bodyTrackingReminders)) {
        for (const reminder of dataEntry.bodyTrackingReminders) {
          if (!reminder.userId) {
            reminder.userId = userId;
            hasChanges = true;
            migrated += 1;
          }
        }
      }

      if (hasChanges) {
        await new Promise((resolve, reject) => {
          const putReq = writeStore.put(dataEntry);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        });
      }
    }

    await new Promise((resolve, reject) => {
      writeTx.oncomplete = () => resolve();
      writeTx.onerror = () => reject(writeTx.error);
    });

    log.debug('[auth-migration] ✅ Migration Body Tracking effectuée', { userId, migrated });
    return { success: true, migrated };
  } catch (error) {
    log.error('[auth-migration] ❌ Erreur migration Body Tracking', error);
    return { success: false, migrated: 0 };
  }
};

/**
 * Migre les données Garmin sans userId vers un utilisateur
 */
const migrateGarmin = async (userId) => {
  let migrated = 0;

  try {
    const db = await openDB();
    if (!db) {
      log.warn('[auth-migration] IndexedDB Garmin non disponible');
      return { success: false, migrated: 0 };
    }

    // Migration activities
    const activitiesTx = db.transaction([STORE_ACTIVITIES], 'readwrite');
    const activitiesStore = activitiesTx.objectStore(STORE_ACTIVITIES);
    const allActivities = await new Promise((resolve, reject) => {
      const req = activitiesStore.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const activity of allActivities) {
      if (!activity || activity.userId) continue;
      activity.userId = userId;
      await new Promise((resolve, reject) => {
        const putReq = activitiesStore.put(activity);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      });
      migrated += 1;
    }
    await new Promise((resolve, reject) => {
      activitiesTx.oncomplete = () => resolve();
      activitiesTx.onerror = () => reject(activitiesTx.error);
    });

    // Migration dailyMetrics
    const metricsTx = db.transaction([STORE_DAILY_METRICS], 'readwrite');
    const metricsStore = metricsTx.objectStore(STORE_DAILY_METRICS);
    const allMetrics = await new Promise((resolve, reject) => {
      const req = metricsStore.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const metric of allMetrics) {
      if (!metric || metric.userId) continue;
      metric.userId = userId;
      await new Promise((resolve, reject) => {
        const putReq = metricsStore.put(metric);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      });
      migrated += 1;
    }
    await new Promise((resolve, reject) => {
      metricsTx.oncomplete = () => resolve();
      metricsTx.onerror = () => reject(metricsTx.error);
    });

    log.debug('[auth-migration] ✅ Migration Garmin effectuée', { userId, migrated });
    return { success: true, migrated };
  } catch (error) {
    log.error('[auth-migration] ❌ Erreur migration Garmin', error);
    return { success: false, migrated: 0 };
  }
};

/**
 * Migre les programmes personnalisés sans userId vers un utilisateur
 * Note: customPrograms et programHistory sont stockés dans WorkoutContext, pas dans IndexedDB directement
 * Cette fonction migre les données si elles sont stockées dans le store workouts
 */
const migratePrograms = async (userId) => {
  let migrated = 0;

  try {
    const db = await openWorkoutDB();
    if (!db) {
      log.warn('[auth-migration] IndexedDB Workout non disponible');
      return { success: false, migrated: 0 };
    }

    // Programmes peuvent être stockés dans le store 'workouts' ou dans WorkoutContext
    // On vérifie d'abord dans le store workouts
    const store = db.transaction(['workouts'], 'readonly').objectStore('workouts');
    const allData = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    const writeTx = db.transaction(['workouts'], 'readwrite');
    const writeStore = writeTx.objectStore('workouts');

    for (const dataEntry of allData) {
      if (!dataEntry) continue;

      let hasChanges = false;

      // Migrer customPrograms (si stocké directement dans dataEntry)
      if (dataEntry.customPrograms && Array.isArray(dataEntry.customPrograms)) {
        for (const program of dataEntry.customPrograms) {
          if (!program.userId) {
            program.userId = userId;
            hasChanges = true;
            migrated += 1;
          }
        }
      }

      // Migrer programHistory (si stocké directement dans dataEntry)
      if (dataEntry.programHistory && Array.isArray(dataEntry.programHistory)) {
        for (const historyEntry of dataEntry.programHistory) {
          if (!historyEntry.userId) {
            historyEntry.userId = userId;
            hasChanges = true;
            migrated += 1;
          }
        }
      }

      if (hasChanges) {
        await new Promise((resolve, reject) => {
          const putReq = writeStore.put(dataEntry);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        });
      }
    }

    await new Promise((resolve, reject) => {
      writeTx.oncomplete = () => resolve();
      writeTx.onerror = () => reject(writeTx.error);
    });

    log.debug('[auth-migration] ✅ Migration Programmes effectuée', { userId, migrated });
    return { success: true, migrated };
  } catch (error) {
    log.error('[auth-migration] ❌ Erreur migration Programmes', error);
    return { success: false, migrated: 0 };
  }
};


