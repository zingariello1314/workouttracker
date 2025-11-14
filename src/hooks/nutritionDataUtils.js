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
const DB_VERSION_NUTRITION = 7; // Version avec stores nutrition + gamification + shareLinks + progressPhotos

// Stores nutrition
const STORE_DAILY_MEALS = 'nutrition_dailyMeals';
const STORE_MEALS = 'nutrition_meals';
const STORE_PROGRAMS = 'nutrition_programs';
const STORE_FAVORITE_FOODS = 'nutrition_favoriteFoods';
const STORE_MEAL_PHOTOS = 'nutrition_mealPhotos';
const STORE_HYDRATION_LOG = 'nutrition_hydrationLog';
const STORE_API_CACHE = 'nutrition_apiCache';
const STORE_GAMIFICATION = 'nutrition_gamification';
const STORE_SHARE_LINKS = 'nutrition_shareLinks';
const STORE_PROGRESS_PHOTOS = 'nutrition_progressPhotos'; // Photos avant/après pour progression

// Instance singleton de la DB
let dbInstance = null;
let openingPromise = null; // Promise de l'ouverture en cours (pour éviter appels multiples)

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

  // Si instance déjà ouverte, la retourner immédiatement
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  
  // Si ouverture en cours, retourner la même promise
  if (openingPromise) {
    return openingPromise;
  }

  // Créer une seule promise pour tous les appels simultanés
  openingPromise = new Promise((resolve, reject) => {
    try {
      // ✅ SOLUTION OPTIMALE : Détecter version existante d'abord
      // Étape 1 : Ouvrir sans version spécifique pour lire la version actuelle
      const detectRequest = indexedDB.open(DB_NAME);
      let detectedVersion = null;
      
      detectRequest.onsuccess = (detectEvent) => {
        const tempDb = detectEvent.target.result;
        detectedVersion = tempDb.version;
        tempDb.close();
        
        log.debug(`Version détectée: ${detectedVersion}, Version demandée: ${DB_VERSION_NUTRITION}`);
        
        // Étape 2 : Utiliser version max entre existante et demandée
        // Si version existante > demandée, utiliser existante (pas de downgrade)
        // Sinon, utiliser version max (upgrade si nécessaire)
        const targetVersion = detectedVersion && detectedVersion > DB_VERSION_NUTRITION
          ? detectedVersion // DB déjà plus récente, utiliser sa version
          : Math.max(detectedVersion || 0, DB_VERSION_NUTRITION); // Utiliser max
        
        log.debug(`Ouverture avec version: ${targetVersion}`);
        
        // Étape 3 : Ouvrir avec version cible
        const openRequest = indexedDB.open(DB_NAME, targetVersion);
        
        openRequest.onupgradeneeded = (upgradeEvent) => {
          const oldVersion = upgradeEvent.oldVersion || 0;
          const newVersion = upgradeEvent.newVersion || targetVersion;
          
          log.info(`Migration IndexedDB: v${oldVersion} → v${newVersion}`);
          
          // Appeler handleUpgrade pour créer/mettre à jour stores nutrition
          handleUpgrade(upgradeEvent);
        };
        
        openRequest.onsuccess = (openEvent) => {
          dbInstance = openEvent.target.result;
          openingPromise = null;
          log.info(`✅ IndexedDB ouverte avec succès: v${dbInstance.version}`);
          log.debug(`Stores disponibles: ${Array.from(dbInstance.objectStoreNames).join(', ')}`);
          
          // Vérifier que tous les stores nutrition existent
          const nutritionStores = [
            STORE_DAILY_MEALS,
            STORE_MEALS,
            STORE_PROGRAMS,
          STORE_FAVORITE_FOODS,
          STORE_MEAL_PHOTOS,
          STORE_HYDRATION_LOG,
          STORE_API_CACHE,
          STORE_GAMIFICATION,
          STORE_SHARE_LINKS,
          STORE_PROGRESS_PHOTOS
        ];
          
          const missingStores = nutritionStores.filter(storeName => 
            !dbInstance.objectStoreNames.contains(storeName)
          );
          
          if (missingStores.length > 0) {
            log.warn(`Stores nutrition manquants après ouverture: ${missingStores.join(', ')}`);
            
            // ✅ OPTIMISATION : Forcer migration si store manquant
            if (missingStores.includes(STORE_SHARE_LINKS) || missingStores.includes(STORE_PROGRESS_PHOTOS)) {
              const storeName = missingStores.includes(STORE_PROGRESS_PHOTOS) ? STORE_PROGRESS_PHOTOS : STORE_SHARE_LINKS;
              log.info(`Migration forcée pour créer store ${storeName}...`);
              const currentVersion = dbInstance.version;
              dbInstance.close();
              dbInstance = null;
              openingPromise = null; // Réinitialiser pour permettre nouvelle ouverture
              
              // Réouvrir avec version + 1 pour forcer upgrade
              const upgradeVersion = currentVersion + 1;
              
              const upgradeRequest = indexedDB.open(DB_NAME, upgradeVersion);
              
              upgradeRequest.onupgradeneeded = (upgradeEvent) => {
                log.info(`Upgrade forcé: v${currentVersion} → v${upgradeVersion}`);
                handleUpgrade(upgradeEvent);
              };
              
              upgradeRequest.onsuccess = (upgradeEvent) => {
                dbInstance = upgradeEvent.target.result;
                openingPromise = null;
                log.info(`✅ IndexedDB migrée avec succès: v${dbInstance.version}`);
                log.debug(`Stores disponibles: ${Array.from(dbInstance.objectStoreNames).join(', ')}`);
                resolve(dbInstance);
              };
              
              upgradeRequest.onerror = (upgradeErr) => {
                openingPromise = null;
                log.error('Erreur migration forcée:', upgradeErr);
                resolve(null);
              };
              
              return; // Ne pas continuer avec le code normal
            }
            
            log.warn('Cela ne devrait pas arriver si onupgradeneeded a été appelé correctement');
          }
          
          resolve(dbInstance);
        };
        
        openRequest.onerror = (openErrEvent) => {
          openingPromise = null;
          log.error('Erreur ouverture IndexedDB:', openErrEvent.target.error);
          resolve(null);
        };
      };
      
      // Gestion erreur détection version
      detectRequest.onerror = (detectErrEvent) => {
        openingPromise = null;
        log.error('Erreur détection version:', detectErrEvent.target.error);
        // En cas d'erreur détection, essayer avec version demandée
        const fallbackRequest = indexedDB.open(DB_NAME, DB_VERSION_NUTRITION);
        
        fallbackRequest.onupgradeneeded = (fallbackEvent) => {
          handleUpgrade(fallbackEvent);
        };
        
        fallbackRequest.onsuccess = (fallbackEvent) => {
          dbInstance = fallbackEvent.target.result;
          openingPromise = null;
          log.info(`✅ IndexedDB ouverte (fallback): v${dbInstance.version}`);
          resolve(dbInstance);
        };
        
        fallbackRequest.onerror = (fallbackErrEvent) => {
          openingPromise = null;
          log.error('Erreur fallback ouverture:', fallbackErrEvent.target.error);
          resolve(null);
        };
      };
      
      // Gestion blocage (autre onglet avec version plus ancienne)
      detectRequest.onblocked = () => {
        log.warn('IndexedDB bloquée par un autre onglet (détection)');
        // Ne pas reject, attendre que l'autre onglet ferme
      };

    } catch (err) {
      openingPromise = null; // Nettoyer en cas d'erreur
      log.error('Erreur dans openNutritionDB:', err);
      resolve(null);
    }
  });
  
  return openingPromise;
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
      
      log.debug(`Store ${STORE_PROGRESS_PHOTOS} créé avec indexes`);
    } else {
      progressPhotosStore = event.target.transaction.objectStore(STORE_PROGRESS_PHOTOS);
      
      // Vérifier et ajouter indexes manquants
      const indexNames = Array.from(progressPhotosStore.indexNames);
      ['date', 'type', 'timestamp', 'sequenceId'].forEach(indexName => {
        if (!indexNames.includes(indexName)) {
          try {
            progressPhotosStore.createIndex(indexName, indexName, { unique: false });
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
  STORE_GAMIFICATION,
  STORE_SHARE_LINKS,
  STORE_PROGRESS_PHOTOS
};

