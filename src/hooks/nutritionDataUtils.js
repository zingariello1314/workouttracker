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

import {
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
  STORE_PROGRESS_PHOTOS,
  STORE_ML_MODELS,
  STORE_OFFLINE_QUEUE,
  handleNutritionUpgrade,
} from '../services/nutrition/nutritionDbGateway.js';

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
  STORE_PROGRESS_PHOTOS,
  STORE_ML_MODELS,
  STORE_OFFLINE_QUEUE,
};

// Instance singleton de la DB
let dbInstance = null;
let openingPromise = null; // Promise de l'ouverture en cours (pour éviter appels multiples)

// ==================== LOGGING ====================
// ✅ Réduction drastique des logs pour éviter spam console

const log = {
  debug: () => {}, // Désactivé pour éviter spam
  info: () => {}, // Désactivé pour éviter spam
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
        
        // Étape 2 : Utiliser version max entre existante et demandée
        // Si version existante > demandée, utiliser existante (pas de downgrade)
        // Sinon, utiliser version max (upgrade si nécessaire)
        const targetVersion = detectedVersion && detectedVersion > DB_VERSION_NUTRITION
          ? detectedVersion // DB déjà plus récente, utiliser sa version
          : Math.max(detectedVersion || 0, DB_VERSION_NUTRITION); // Utiliser max
        
        // Étape 3 : Ouvrir avec version cible (upgrade si nécessaire)
        const openRequest = indexedDB.open(DB_NAME, targetVersion);
        
        openRequest.onupgradeneeded = (upgradeEvent) => {
          const oldVersion = upgradeEvent.oldVersion || 0;
          const newVersion = upgradeEvent.newVersion || targetVersion;
          
          log.info(`Migration IndexedDB: v${oldVersion} → v${newVersion}`);
          
          // Schéma nutrition : `handleNutritionUpgrade` (nutritionDbGateway)
          handleNutritionUpgrade(upgradeEvent);
        };
        
        openRequest.onsuccess = (openEvent) => {
          dbInstance = openEvent.target.result;
          openingPromise = null;
          // Logs supprimés pour éviter spam
          
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
            STORE_PROGRESS_PHOTOS,
            STORE_ML_MODELS,
            STORE_OFFLINE_QUEUE // ✅ OPTIMISATION Phase 15.6 : Queue offline
          ];
          
          const missingStores = nutritionStores.filter(storeName => 
            !dbInstance.objectStoreNames.contains(storeName)
          );
          
          if (missingStores.length > 0) {
            // ✅ OPTIMISATION : Utiliser debug au lieu de warn (peut être normal au premier chargement)
            log.debug(`Stores nutrition manquants après ouverture (sera créé au prochain upgrade): ${missingStores.join(', ')}`);
            
            // ✅ OPTIMISATION : Forcer migration si store manquant (nouveaux stores)
            if (missingStores.includes(STORE_SHARE_LINKS) || missingStores.includes(STORE_PROGRESS_PHOTOS) || missingStores.includes(STORE_ML_MODELS) || missingStores.includes(STORE_OFFLINE_QUEUE)) {
              const storeName = missingStores.includes(STORE_ML_MODELS) ? STORE_ML_MODELS : 
                                missingStores.includes(STORE_PROGRESS_PHOTOS) ? STORE_PROGRESS_PHOTOS : 
                                missingStores.includes(STORE_OFFLINE_QUEUE) ? STORE_OFFLINE_QUEUE : STORE_SHARE_LINKS;
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
                handleNutritionUpgrade(upgradeEvent);
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
          }
          
          resolve(dbInstance);
        };
        
        openRequest.onerror = async (openErrEvent) => {
          openingPromise = null;
          const error = openErrEvent.target.error;
          log.error('Erreur ouverture IndexedDB:', error);
          
          // ✅ OPTIMISATION : Tenter récupération si corruption détectée
          try {
            const { isCorruptionError, handleCorruption } = await import('../services/nutrition/nutritionCorruptionHandler');
            if (isCorruptionError(error)) {
              log.warn('Corruption détectée lors ouverture, tentative récupération...');
              const recoveredDb = await handleCorruption(error, { autoRecover: true, autoReset: false });
              if (recoveredDb) {
                dbInstance = recoveredDb;
                log.info('✅ IndexedDB récupérée après corruption');
                resolve(recoveredDb);
                return;
              }
            }
          } catch (recoveryError) {
            log.warn('Erreur lors tentative récupération:', recoveryError);
          }
          
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
          handleNutritionUpgrade(fallbackEvent);
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
