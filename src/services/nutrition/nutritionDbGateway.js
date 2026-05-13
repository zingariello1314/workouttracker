/**
 * Schéma IndexedDB nutrition (stores `nutrition_*` sur WorkoutTrackerDB).
 * Singleton / détection de version : `nutritionDataUtils.js`.
 *
 * @module services/nutrition/nutritionDbGateway
 */

export const DB_NAME = 'WorkoutTrackerDB';
export const DB_VERSION_NUTRITION = 11;

export const STORE_DAILY_MEALS = 'nutrition_dailyMeals';
export const STORE_MEALS = 'nutrition_meals';
export const STORE_PROGRAMS = 'nutrition_programs';
export const STORE_FAVORITE_FOODS = 'nutrition_favoriteFoods';
export const STORE_MEAL_PHOTOS = 'nutrition_mealPhotos';
export const STORE_HYDRATION_LOG = 'nutrition_hydrationLog';
export const STORE_API_CACHE = 'nutrition_apiCache';
export const STORE_GAMIFICATION = 'nutrition_gamification';
export const STORE_SHARE_LINKS = 'nutrition_shareLinks';
export const STORE_PROGRESS_PHOTOS = 'nutrition_progressPhotos';
export const STORE_ML_MODELS = 'nutrition_mlModels';
export const STORE_OFFLINE_QUEUE = 'nutrition_offlineQueue';

const log = {
  debug: () => {},
  info: () => {},
  warn: (...args) => console.warn('[nutritionDataUtils]', ...args),
  error: (...args) => console.error('[nutritionDataUtils]', ...args)
};

/**
 * @param {IDBVersionChangeEvent} event
 */
export function handleNutritionUpgrade(event) {
  try {
    const db = event.target.result;
    const oldVersion = event.oldVersion || 0;
    
    log.info(`Migration IndexedDB: v${oldVersion} → v${DB_VERSION_NUTRITION}`);

    // ==================== STORE 1: dailyMeals ====================
    let dailyMealsStore;
    if (!db.objectStoreNames.contains(STORE_DAILY_MEALS)) {
      dailyMealsStore = db.createObjectStore(STORE_DAILY_MEALS, {
        keyPath: 'date',
        autoIncrement: false
      });
      
      // Indexes pour requêtes fréquentes
      dailyMealsStore.createIndex('date', 'date', { unique: false }); // Index principal pour requêtes par date
      dailyMealsStore.createIndex('programId', 'programId', { unique: false });
      dailyMealsStore.createIndex('isComplete', 'isComplete', { unique: false });
      dailyMealsStore.createIndex('lastModified', 'lastModified', { unique: false });
      
      log.debug(`Store ${STORE_DAILY_MEALS} créé avec indexes`);
    } else {
      dailyMealsStore = event.target.transaction.objectStore(STORE_DAILY_MEALS);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(dailyMealsStore.indexNames);
      if (!indexNames.includes('date')) {
        dailyMealsStore.createIndex('date', 'date', { unique: false });
      }
      if (!indexNames.includes('programId')) {
        dailyMealsStore.createIndex('programId', 'programId', { unique: false });
      }
      if (!indexNames.includes('isComplete')) {
        dailyMealsStore.createIndex('isComplete', 'isComplete', { unique: false });
      }
      if (!indexNames.includes('lastModified')) {
        dailyMealsStore.createIndex('lastModified', 'lastModified', { unique: false });
      }
    }

    // ==================== STORE 2: meals ====================
    let mealsStore;
    if (!db.objectStoreNames.contains(STORE_MEALS)) {
      mealsStore = db.createObjectStore(STORE_MEALS, {
        keyPath: 'id',
        autoIncrement: false
      });
      
      // Indexes pour requêtes fréquentes
      mealsStore.createIndex('date', 'date', { unique: false });
      mealsStore.createIndex('type', 'type', { unique: false });
      mealsStore.createIndex('dailyMealId', 'dailyMealId', { unique: false });
      mealsStore.createIndex('timestamp', 'timestamp', { unique: false });
      
      // ✅ OPTIMISATION : Index composé [date+type] pour requêtes optimisées (×10-50 performance)
      // Permet getMealsByDateAndType en O(log n) au lieu de O(n) avec filtrage mémoire
      mealsStore.createIndex('[date+type]', ['date', 'type'], { unique: false });
      
      log.debug(`Store ${STORE_MEALS} créé avec indexes (incl. index composé [date+type])`);
    } else {
      mealsStore = event.target.transaction.objectStore(STORE_MEALS);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(mealsStore.indexNames);
      
      // Indexes simples
      ['date', 'type', 'dailyMealId', 'timestamp'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          try {
            mealsStore.createIndex(indexName, indexName, { unique: false });
            log.debug(`Index ${indexName} créé sur ${STORE_MEALS}`);
          } catch (err) {
            log.debug(`Index ${indexName} déjà existant ou erreur:`, err);
          }
        }
      });
      
      // ✅ OPTIMISATION : Index composé [date+type] (Version 9)
      if (!indexNames.includes('[date+type]')) {
        try {
          mealsStore.createIndex('[date+type]', ['date', 'type'], { unique: false });
          log.debug(`Index composé [date+type] créé sur ${STORE_MEALS}`);
        } catch (err) {
          log.debug(`Index composé [date+type] déjà existant ou erreur:`, err);
        }
      }
    }

    // ==================== STORE 3: programs ====================
    let programsStore;
    if (!db.objectStoreNames.contains(STORE_PROGRAMS)) {
      programsStore = db.createObjectStore(STORE_PROGRAMS, {
        keyPath: 'id',
        autoIncrement: false
      });
      
      // Indexes pour requêtes fréquentes
      programsStore.createIndex('isActive', 'isActive', { unique: false });
      programsStore.createIndex('startDate', 'startDate', { unique: false });
      programsStore.createIndex('goal', 'goal', { unique: false });
      
      log.debug(`Store ${STORE_PROGRAMS} créé avec indexes`);
    } else {
      programsStore = event.target.transaction.objectStore(STORE_PROGRAMS);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(programsStore.indexNames);
      ['isActive', 'startDate', 'goal'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          programsStore.createIndex(indexName, indexName, { unique: false });
        }
      });
    }

    // ==================== STORE 4: favoriteFoods ====================
    let favoriteFoodsStore;
    if (!db.objectStoreNames.contains(STORE_FAVORITE_FOODS)) {
      favoriteFoodsStore = db.createObjectStore(STORE_FAVORITE_FOODS, {
        keyPath: 'id',
        autoIncrement: false
      });
      
      // Indexes pour requêtes fréquentes
      favoriteFoodsStore.createIndex('category', 'category', { unique: false });
      favoriteFoodsStore.createIndex('isFavorite', 'isFavorite', { unique: false });
      favoriteFoodsStore.createIndex('usageCount', 'usageCount', { unique: false });
      favoriteFoodsStore.createIndex('lastUsed', 'lastUsed', { unique: false });
      
      log.debug(`Store ${STORE_FAVORITE_FOODS} créé avec indexes`);
    } else {
      favoriteFoodsStore = event.target.transaction.objectStore(STORE_FAVORITE_FOODS);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(favoriteFoodsStore.indexNames);
      ['category', 'isFavorite', 'usageCount', 'lastUsed'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          favoriteFoodsStore.createIndex(indexName, indexName, { unique: false });
        }
      });
    }

    // ==================== STORE 5: mealPhotos ====================
    let mealPhotosStore;
    if (!db.objectStoreNames.contains(STORE_MEAL_PHOTOS)) {
      mealPhotosStore = db.createObjectStore(STORE_MEAL_PHOTOS, {
        keyPath: 'id',
        autoIncrement: false
      });
      
      // Indexes pour requêtes fréquentes
      mealPhotosStore.createIndex('date', 'date', { unique: false });
      mealPhotosStore.createIndex('mealId', 'mealId', { unique: false });
      
      log.debug(`Store ${STORE_MEAL_PHOTOS} créé avec indexes`);
    } else {
      mealPhotosStore = event.target.transaction.objectStore(STORE_MEAL_PHOTOS);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(mealPhotosStore.indexNames);
      ['date', 'mealId'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          mealPhotosStore.createIndex(indexName, indexName, { unique: false });
        }
      });
    }

    // ==================== STORE 6: hydrationLog ====================
    if (!db.objectStoreNames.contains(STORE_HYDRATION_LOG)) {
      db.createObjectStore(STORE_HYDRATION_LOG, {
        keyPath: 'date',
        autoIncrement: false
      });
      
      log.debug(`Store ${STORE_HYDRATION_LOG} créé`);
    }

    // ==================== STORE 7: apiCache ====================
    let apiCacheStore;
    if (!db.objectStoreNames.contains(STORE_API_CACHE)) {
      apiCacheStore = db.createObjectStore(STORE_API_CACHE, {
        keyPath: 'key',
        autoIncrement: false
      });
      
      // Indexes pour nettoyage cache expiré
      apiCacheStore.createIndex('source', 'source', { unique: false });
      apiCacheStore.createIndex('timestamp', 'timestamp', { unique: false });
      
      log.debug(`Store ${STORE_API_CACHE} créé avec indexes`);
    } else {
      apiCacheStore = event.target.transaction.objectStore(STORE_API_CACHE);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(apiCacheStore.indexNames);
      ['source', 'timestamp'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          apiCacheStore.createIndex(indexName, indexName, { unique: false });
        }
      });
    }

    // ==================== STORE 8: gamification ====================
    let gamificationStore;
    if (!db.objectStoreNames.contains(STORE_GAMIFICATION)) {
      gamificationStore = db.createObjectStore(STORE_GAMIFICATION, {
        keyPath: 'id',
        autoIncrement: false
      });
      
      // Indexes pour requêtes fréquentes
      gamificationStore.createIndex('type', 'type', { unique: false }); // 'achievement', 'xp', 'streak'
      gamificationStore.createIndex('category', 'category', { unique: false }); // Pour badges
      gamificationStore.createIndex('unlockedDate', 'unlockedDate', { unique: false }); // Tri par date déblocage
      gamificationStore.createIndex('timestamp', 'timestamp', { unique: false }); // Pour XP/streaks
      
      log.debug(`Store ${STORE_GAMIFICATION} créé avec indexes`);
    } else {
      gamificationStore = event.target.transaction.objectStore(STORE_GAMIFICATION);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(gamificationStore.indexNames);
      ['type', 'category', 'unlockedDate', 'timestamp'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          gamificationStore.createIndex(indexName, indexName, { unique: false });
        }
      });
    }

    // ==================== STORE 9: shareLinks ====================
    let shareLinksStore;
    if (!db.objectStoreNames.contains(STORE_SHARE_LINKS)) {
      shareLinksStore = db.createObjectStore(STORE_SHARE_LINKS, {
        keyPath: 'id', // Utilisé comme token (voir saveShareLink: id: shareLink.token)
        autoIncrement: false
      });
      
      // Indexes pour requêtes fréquentes
      shareLinksStore.createIndex('token', 'token', { unique: true }); // Token unique (clé de recherche)
      shareLinksStore.createIndex('expiresAt', 'expiresAt', { unique: false }); // Pour nettoyage liens expirés
      shareLinksStore.createIndex('scope', 'scope', { unique: false }); // Pour filtrage par scope
      shareLinksStore.createIndex('createdAt', 'createdAt', { unique: false }); // Tri par date création
      // Note: Index 'locked' non créé car IndexedDB ne supporte pas bien les index booléens
      // Le code utilise un fallback getAll + filter qui est acceptable pour ce cas d'usage
      
      log.debug(`Store ${STORE_SHARE_LINKS} créé avec indexes`);
    } else {
      shareLinksStore = event.target.transaction.objectStore(STORE_SHARE_LINKS);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(shareLinksStore.indexNames);
      ['token', 'expiresAt', 'scope', 'createdAt'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          try {
            shareLinksStore.createIndex(indexName, indexName, { unique: indexName === 'token' });
          } catch (err) {
            // Index peut déjà exister, ignorer l'erreur
            log.debug(`Index ${indexName} déjà existant ou erreur création:`, err);
          }
        }
      });
      // Note: Index 'locked' intentionnellement non créé (IndexedDB ne supporte pas bien les booléens)
    }

    // ==================== STORE 10: nutrition_progressPhotos ====================
    let progressPhotosStore;
    if (!db.objectStoreNames.contains(STORE_PROGRESS_PHOTOS)) {
      progressPhotosStore = db.createObjectStore(STORE_PROGRESS_PHOTOS, {
        keyPath: 'id',
        autoIncrement: false
      });
      
      // Indexes pour requêtes fréquentes
      progressPhotosStore.createIndex('date', 'date', { unique: false }); // Tri par date (progression temporelle)
      progressPhotosStore.createIndex('type', 'type', { unique: false }); // Filtrage avant/après (before/after)
      progressPhotosStore.createIndex('timestamp', 'timestamp', { unique: false }); // Tri chronologique précis
      progressPhotosStore.createIndex('sequenceId', 'sequenceId', { unique: false }); // Grouper photos avant/après ensemble
      
      // ✅ OPTIMISATION : Index composé [date+type] pour requêtes optimisées (Version 10)
      // Permet getAllProgressPhotos avec filtrage date+type en O(log n) au lieu de O(n) avec filtrage mémoire
      progressPhotosStore.createIndex('[date+type]', ['date', 'type'], { unique: false });
      
      log.debug(`Store ${STORE_PROGRESS_PHOTOS} créé avec indexes (incl. index composé [date+type])`);
    } else {
      progressPhotosStore = event.target.transaction.objectStore(STORE_PROGRESS_PHOTOS);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(progressPhotosStore.indexNames);
      
      // Indexes simples
      ['date', 'type', 'timestamp', 'sequenceId'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          try {
            progressPhotosStore.createIndex(indexName, indexName, { unique: false });
            log.debug(`Index ${indexName} créé sur ${STORE_PROGRESS_PHOTOS}`);
          } catch (err) {
            // Index peut déjà exister, ignorer l'erreur
            log.debug(`Index ${indexName} déjà existant ou erreur:`, err);
          }
        }
      });
      
      // ✅ OPTIMISATION : Index composé [date+type] (Version 10)
      if (!indexNames.includes('[date+type]')) {
        try {
          progressPhotosStore.createIndex('[date+type]', ['date', 'type'], { unique: false });
          log.debug(`Index composé [date+type] créé sur ${STORE_PROGRESS_PHOTOS}`);
        } catch (err) {
          log.debug(`Index composé [date+type] déjà existant ou erreur:`, err);
        }
      }
    }

    // ==================== STORE 11: nutrition_mlModels ====================
    // Store pour modèles ML entraînés (TensorFlow.js) pour prédictions offline
    let mlModelsStore;
    if (!db.objectStoreNames.contains(STORE_ML_MODELS)) {
      mlModelsStore = db.createObjectStore(STORE_ML_MODELS, {
        keyPath: 'id',
        autoIncrement: false
      });
      
      // Indexes pour requêtes fréquentes
      mlModelsStore.createIndex('type', 'type', { unique: false }); // Type prédiction ('weight', 'calories', 'goal_time')
      mlModelsStore.createIndex('timestamp', 'timestamp', { unique: false }); // Tri par date entraînement
      mlModelsStore.createIndex('version', 'version', { unique: false }); // Version modèle (pour migrations)
      mlModelsStore.createIndex('isActive', 'isActive', { unique: false }); // Modèle actif (1 seul actif par type)
      
      log.debug(`Store ${STORE_ML_MODELS} créé avec indexes`);
    } else {
      mlModelsStore = event.target.transaction.objectStore(STORE_ML_MODELS);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(mlModelsStore.indexNames);
      ['type', 'timestamp', 'version', 'isActive'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          try {
            mlModelsStore.createIndex(indexName, indexName, { unique: false });
          } catch (err) {
            // Index peut déjà exister, ignorer l'erreur
            log.debug(`Index ${indexName} déjà existant ou erreur création:`, err);
          }
        }
      });
    }

    // ==================== STORE 12: offlineQueue ====================
    // ✅ OPTIMISATION Phase 15.6 : Queue offline pour modifications en attente
    let offlineQueueStore;
    if (!db.objectStoreNames.contains(STORE_OFFLINE_QUEUE)) {
      offlineQueueStore = db.createObjectStore(STORE_OFFLINE_QUEUE, {
        keyPath: 'id',
        autoIncrement: true
      });
      
      // Indexes pour requêtes fréquentes
      offlineQueueStore.createIndex('timestamp', 'timestamp', { unique: false }); // Tri par date création
      offlineQueueStore.createIndex('store', 'store', { unique: false }); // Filtrage par store
      offlineQueueStore.createIndex('status', 'status', { unique: false }); // Status (pending, processing, completed, failed)
      offlineQueueStore.createIndex('retryCount', 'retryCount', { unique: false }); // Nombre de tentatives
      
      log.debug(`Store ${STORE_OFFLINE_QUEUE} créé avec indexes`);
    } else {
      offlineQueueStore = event.target.transaction.objectStore(STORE_OFFLINE_QUEUE);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(offlineQueueStore.indexNames);
      ['timestamp', 'store', 'status', 'retryCount'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          try {
            offlineQueueStore.createIndex(indexName, indexName, { unique: false });
          } catch (err) {
            // Index peut déjà exister, ignorer l'erreur
            log.debug(`Index ${indexName} déjà existant ou erreur création:`, err);
          }
        }
      });
    }

    log.info('Migration IndexedDB terminée avec succès');

  } catch (upgradeError) {
    log.error('Erreur lors de la migration IndexedDB:', upgradeError);
    throw upgradeError;
  }
}
