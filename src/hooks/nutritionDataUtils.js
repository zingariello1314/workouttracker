/**
 * nutritionDataUtils.js
 * 
 * Utilitaires pour la gestion de la base de données IndexedDB Nutrition
 * Structure optimisée avec stores séparés (performance ×10)
 * 
 * Architecture :
 * - Extension de WorkoutTrackerDB (v2 → v3)
 * - Stores séparés : dailyMeals, meals, programs, favoriteFoods, mealPhotos, hydrationLog, apiCache
 * - Indexes optimisés pour requêtes fréquentes
 * - Migration automatique depuis structure ancienne si nécessaire
 * 
 * @module hooks/nutritionDataUtils
 */

// ==================== CONSTANTES ====================

const DB_NAME = 'WorkoutTrackerDB';
const DB_VERSION_NUTRITION = 4; // Version avec stores nutrition + gamification + index date

// Stores nutrition
const STORE_DAILY_MEALS = 'nutrition_dailyMeals';
const STORE_MEALS = 'nutrition_meals';
const STORE_PROGRAMS = 'nutrition_programs';
const STORE_FAVORITE_FOODS = 'nutrition_favoriteFoods';
const STORE_MEAL_PHOTOS = 'nutrition_mealPhotos';
const STORE_HYDRATION_LOG = 'nutrition_hydrationLog';
const STORE_API_CACHE = 'nutrition_apiCache';
const STORE_GAMIFICATION = 'nutrition_gamification';

// Instance singleton de la DB
let dbInstance = null;

// ==================== LOGGING ====================

const log = {
  debug: (...args) => console.log('[nutritionDataUtils]', ...args),
  info: (...args) => console.info('[nutritionDataUtils]', ...args),
  warn: (...args) => console.warn('[nutritionDataUtils]', ...args),
  error: (...args) => console.error('[nutritionDataUtils]', ...args)
};

// ==================== OUVERTURE INDEXEDDB ====================

/**
 * Ouvre la base de données IndexedDB avec création/mise à jour des stores nutrition
 * 
 * ✅ Pattern similaire à GarminDataDB pour cohérence
 * ✅ Migration automatique si version < 3
 * ✅ Gestion d'erreurs robuste avec fallback
 * 
 * @returns {Promise<IDBDatabase|null>} Instance de la DB ou null si erreur
 */
export const openNutritionDB = async () => {
  // Vérifier support IndexedDB
  if (!window.indexedDB) {
    log.warn('IndexedDB non supporté, nutrition désactivée');
    return null;
  }

  // Si instance déjà ouverte, la retourner
  if (dbInstance) {
    return dbInstance;
  }

  return new Promise((resolve, reject) => {
    try {
      // ✅ STRATÉGIE ROBUSTE : Utiliser une version élevée et laisser IndexedDB gérer
      // IndexedDB va nous donner la version actuelle dans event.oldVersion si upgrade nécessaire
      // Sinon, on ouvre directement avec la version actuelle
      
      // Essayer d'abord d'ouvrir avec une version très élevée pour forcer la détection
      // Si la DB existe déjà, onupgradeneeded sera appelé avec oldVersion = version actuelle
      // Si la DB n'existe pas, onupgradeneeded sera appelé avec oldVersion = 0
      const HIGH_VERSION = 20; // Version élevée pour forcer la détection et upgrade
      
      log.debug('Tentative ouverture IndexedDB avec détection automatique...');
      const request = indexedDB.open(DB_NAME, HIGH_VERSION);
      
      // Variable pour stocker la version actuelle (accessible dans tous les handlers)
      let actualVersion = null;
      
      // onupgradeneeded : IndexedDB nous donne la version actuelle ici
      request.onupgradeneeded = (event) => {
        actualVersion = event.oldVersion || 0;
        const newVersion = event.newVersion || HIGH_VERSION;
        
        log.info(`Upgrade détecté: v${actualVersion} → v${newVersion}`);
        
        // Toujours appeler handleUpgrade pour créer/mettre à jour stores et indexes
        // handleUpgrade vérifie lui-même si les stores/indexes existent avant de les créer
        handleUpgrade(event);
      };

      // Gestion erreur ouverture
      request.onerror = (event) => {
        const error = event.target.error;
        log.error('Erreur ouverture IndexedDB:', error);
        
        // Si erreur de version, essayer avec version détectée + 1
        if (error.name === 'VersionError' && actualVersion !== null) {
          log.warn(`VersionError détectée, tentative avec v${actualVersion + 1}...`);
          const retryRequest = indexedDB.open(DB_NAME, actualVersion + 1);
          
          retryRequest.onupgradeneeded = (retryEvent) => {
            handleUpgrade(retryEvent);
          };
          
          retryRequest.onsuccess = (retryEvent) => {
            dbInstance = retryEvent.target.result;
            log.info(`✅ IndexedDB ouverte après retry: v${dbInstance.version}`);
            resolve(dbInstance);
          };
          
          retryRequest.onerror = () => {
            log.error('Erreur retry ouverture IndexedDB');
            resolve(null);
          };
        } else {
          resolve(null);
        }
      };

      // Succès ouverture
      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        
        // Vérifier que la DB est prête
        if (!dbInstance) {
          log.error('Instance DB invalide après ouverture');
          resolve(null);
          return;
        }
        
        // Vérifier que tous les stores nutrition existent
        const nutritionStores = [
          STORE_DAILY_MEALS,
          STORE_MEALS,
          STORE_PROGRAMS,
          STORE_FAVORITE_FOODS,
          STORE_MEAL_PHOTOS,
          STORE_HYDRATION_LOG,
          STORE_API_CACHE,
          STORE_GAMIFICATION
        ];
        
        const missingStores = nutritionStores.filter(storeName => 
          !dbInstance.objectStoreNames.contains(storeName)
        );
        
        if (missingStores.length > 0) {
          log.warn(`Stores nutrition manquants après ouverture: ${missingStores.join(', ')}`);
          log.warn('Cela ne devrait pas arriver si onupgradeneeded a été appelé correctement');
          // Ne pas résoudre null, utiliser la DB quand même (stores seront créés au prochain upgrade)
        }
        
        log.info(`✅ IndexedDB ouverte avec succès: v${dbInstance.version}`);
        log.debug(`Stores disponibles: ${Array.from(dbInstance.objectStoreNames).join(', ')}`);
        resolve(dbInstance);
      };

      // Gestion blocage (autre onglet avec version plus ancienne)
      request.onblocked = () => {
        log.warn('IndexedDB bloquée par un autre onglet');
        // Ne pas reject, attendre que l'autre onglet ferme
      };

    } catch (err) {
      log.error('Erreur dans openNutritionDB:', err);
      resolve(null);
    }
  });
};

/**
 * Vérifie si des indexes manquants nécessitent un upgrade
 * 
 * @param {IDBDatabase} db - Base de données
 * @param {IDBVersionChangeEvent} event - Événement upgrade
 * @returns {boolean} true si upgrade nécessaire
 */
const checkMissingIndexes = (db, event) => {
  try {
    // Vérifier index 'date' sur dailyMeals
    if (db.objectStoreNames.contains(STORE_DAILY_MEALS)) {
      const store = event.target.transaction.objectStore(STORE_DAILY_MEALS);
      const indexNames = Array.from(store.indexNames);
      if (!indexNames.includes('date')) {
        return true;
      }
    }
    
    // Vérifier si store gamification existe
    if (!db.objectStoreNames.contains(STORE_GAMIFICATION)) {
      return true;
    }
    
    return false;
  } catch (err) {
    log.warn('Erreur vérification indexes:', err);
    return false;
  }
};

/**
 * Gère la création/mise à jour des stores nutrition lors de l'upgrade
 * 
 * @param {IDBVersionChangeEvent} event - Événement onupgradeneeded
 */
const handleUpgrade = (event) => {
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
      
      log.debug(`Store ${STORE_MEALS} créé avec indexes`);
    } else {
      mealsStore = event.target.transaction.objectStore(STORE_MEALS);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(mealsStore.indexNames);
      ['date', 'type', 'dailyMealId', 'timestamp'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          mealsStore.createIndex(indexName, indexName, { unique: false });
        }
      });
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

    log.info('Migration IndexedDB terminée avec succès');

  } catch (upgradeError) {
    log.error('Erreur lors de la migration IndexedDB:', upgradeError);
    throw upgradeError;
  }
};

/**
 * Ferme la connexion à la base de données
 * Utile pour nettoyage ou tests
 * 
 * @returns {Promise<void>}
 */
export const closeNutritionDB = async () => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    log.debug('Connexion IndexedDB fermée');
  }
};

/**
 * Vérifie si la base de données est prête
 * 
 * @returns {Promise<boolean>}
 */
export const isNutritionDBReady = async () => {
  try {
    const db = await openNutritionDB();
    return db !== null;
  } catch (error) {
    log.error('Erreur vérification DB:', error);
    return false;
  }
};

// ==================== EXPORTS ====================

export {
  DB_NAME,
  DB_VERSION_NUTRITION,
  STORE_DAILY_MEALS,
  STORE_MEALS,
  STORE_PROGRAMS,
  STORE_FAVORITE_FOODS,
  STORE_MEAL_PHOTOS,
  STORE_HYDRATION_LOG,
  STORE_API_CACHE,
  STORE_GAMIFICATION
};

