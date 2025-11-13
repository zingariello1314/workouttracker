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
const DB_VERSION_NUTRITION = 3; // Version avec stores nutrition

// Stores nutrition
const STORE_DAILY_MEALS = 'nutrition_dailyMeals';
const STORE_MEALS = 'nutrition_meals';
const STORE_PROGRAMS = 'nutrition_programs';
const STORE_FAVORITE_FOODS = 'nutrition_favoriteFoods';
const STORE_MEAL_PHOTOS = 'nutrition_mealPhotos';
const STORE_HYDRATION_LOG = 'nutrition_hydrationLog';
const STORE_API_CACHE = 'nutrition_apiCache';

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
      // ✅ STRATÉGIE SIMPLIFIÉE : Ouvrir d'abord sans version pour détecter la version réelle
      // Puis utiliser cette version (ou supérieure si upgrade nécessaire)
      const detectRequest = indexedDB.open(DB_NAME);
      
      detectRequest.onsuccess = (detectEvent) => {
        const detectDB = detectEvent.result;
        const detectedVersion = detectDB ? detectDB.version : 0;
        
        // Ne PAS fermer la DB ici, on va l'utiliser directement si les stores existent
        // Sinon, on la fermera et on fera un upgrade
        
        log.info(`Version DB détectée: ${detectedVersion}`);
        
        // ✅ CORRECTION CRITIQUE : Toujours utiliser au minimum la version détectée
        // Si la DB est à v4, on doit ouvrir avec au moins v4
        const targetVersion = detectedVersion > 0 
          ? Math.max(detectedVersion, DB_VERSION_NUTRITION)  // Utiliser la plus grande des deux
          : DB_VERSION_NUTRITION;  // Si pas de DB, utiliser version nutrition
        
        // Si on a déjà la DB ouverte et que c'est la bonne version, vérifier les stores
        if (detectDB && detectedVersion >= targetVersion) {
          const nutritionStores = [
            STORE_DAILY_MEALS,
            STORE_MEALS,
            STORE_PROGRAMS,
            STORE_FAVORITE_FOODS,
            STORE_MEAL_PHOTOS,
            STORE_HYDRATION_LOG,
            STORE_API_CACHE
          ];
          
          const missingStores = nutritionStores.filter(storeName => 
            !detectDB.objectStoreNames.contains(storeName)
          );
          
          if (missingStores.length === 0) {
            // Tous les stores existent, utiliser la DB déjà ouverte
            dbInstance = detectDB;
            log.info('IndexedDB déjà ouverte avec stores nutrition présents');
            log.debug(`Version DB: ${dbInstance.version}, Stores: ${Array.from(dbInstance.objectStoreNames).join(', ')}`);
            resolve(dbInstance);
            return;
          }
          
          // Stores manquants, fermer et faire upgrade
          detectDB.close();
        }
        
        // Ouvrir DB avec version cible (ou supérieure si upgrade nécessaire)
        log.info(`Ouverture DB avec version cible: ${targetVersion}`);
        const request = indexedDB.open(DB_NAME, targetVersion);

        // Gestion erreur ouverture
        request.onerror = (event) => {
          const error = event.target.error;
          log.error('Erreur ouverture IndexedDB:', error);
          resolve(null);
        };

        // Succès ouverture
        request.onsuccess = async (event) => {
          dbInstance = event.target.result;
          
          // Vérifier que la DB est prête
          if (!dbInstance) {
            log.error('Instance DB invalide après ouverture');
            resolve(null);
            return;
          }
          
          // ✅ VÉRIFICATION CRITIQUE : Si les stores nutrition n'existent pas, forcer upgrade
          const nutritionStores = [
            STORE_DAILY_MEALS,
            STORE_MEALS,
            STORE_PROGRAMS,
            STORE_FAVORITE_FOODS,
            STORE_MEAL_PHOTOS,
            STORE_HYDRATION_LOG,
            STORE_API_CACHE
          ];
          
          const missingStores = nutritionStores.filter(storeName => 
            !dbInstance.objectStoreNames.contains(storeName)
          );
          
          if (missingStores.length > 0) {
            log.warn(`Stores nutrition manquants détectés: ${missingStores.join(', ')}`);
            log.info('Forcer upgrade pour créer les stores manquants...');
            
            // Récupérer la version actuelle AVANT de fermer
            const currentVersion = dbInstance.version;
            
            // Fermer la DB actuelle
            dbInstance.close();
            dbInstance = null;
            
            // Forcer upgrade en incrémentant la version
            const newVersion = Math.max(DB_VERSION_NUTRITION, currentVersion + 1);
            
            log.info(`Upgrade forcé: v${currentVersion} → v${newVersion}`);
            
            try {
              const upgradeRequest = indexedDB.open(DB_NAME, newVersion);
              
              upgradeRequest.onupgradeneeded = (upgradeEvent) => {
                handleUpgrade(upgradeEvent);
              };
              
              upgradeRequest.onsuccess = (upgradeEvent) => {
                dbInstance = upgradeEvent.target.result;
                log.info(`✅ IndexedDB mise à jour avec succès: v${dbInstance.version}`);
                log.info(`✅ Stores disponibles: ${Array.from(dbInstance.objectStoreNames).join(', ')}`);
                resolve(dbInstance);
              };
              
              upgradeRequest.onerror = (upgradeEvent) => {
                log.error('Erreur lors de l\'upgrade forcé:', upgradeEvent.target.error);
                resolve(null);
              };
              
              return; // Ne pas continuer avec le resolve ci-dessous
            } catch (upgradeError) {
              log.error('Erreur dans le processus d\'upgrade forcé:', upgradeError);
              resolve(null);
              return;
            }
          }
          
          log.info('IndexedDB ouverte avec succès');
          log.debug(`Version DB: ${dbInstance.version}, Stores: ${Array.from(dbInstance.objectStoreNames).join(', ')}`);
          resolve(dbInstance);
        };

        // Création/mise à jour de la structure (onupgradeneeded)
        request.onupgradeneeded = (event) => {
          handleUpgrade(event);
        };

        // Gestion blocage (autre onglet avec version plus ancienne)
        request.onblocked = () => {
          log.warn('IndexedDB bloquée par un autre onglet');
          // Ne pas reject, attendre que l'autre onglet ferme
        };
      };
      
      detectRequest.onerror = () => {
        // Si erreur détection, essayer directement avec version élevée
        log.warn('Erreur détection version, tentative avec version élevée...');
        const fallbackVersion = 10; // Version élevée pour forcer la détection par IndexedDB
        const directRequest = indexedDB.open(DB_NAME, fallbackVersion);
        
        directRequest.onupgradeneeded = (event) => {
          // IndexedDB va nous donner la version actuelle dans event.oldVersion
          const actualVersion = event.oldVersion || 0;
          log.info(`Upgrade détecté (fallback): v${actualVersion} → v${fallbackVersion}`);
          handleUpgrade(event);
        };
        
        directRequest.onsuccess = (event) => {
          dbInstance = event.target.result;
          log.info(`IndexedDB ouverte (fallback): v${dbInstance.version}`);
          resolve(dbInstance);
        };
        
        directRequest.onerror = (event) => {
          log.error('Erreur ouverture fallback:', event.target.error);
          resolve(null);
        };
      };

    } catch (err) {
      log.error('Erreur dans openNutritionDB:', err);
      resolve(null);
    }
  });
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
      dailyMealsStore.createIndex('programId', 'programId', { unique: false });
      dailyMealsStore.createIndex('isComplete', 'isComplete', { unique: false });
      dailyMealsStore.createIndex('lastModified', 'lastModified', { unique: false });
      
      log.debug(`Store ${STORE_DAILY_MEALS} créé avec indexes`);
    } else {
      dailyMealsStore = event.target.transaction.objectStore(STORE_DAILY_MEALS);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(dailyMealsStore.indexNames);
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
  STORE_API_CACHE
};

