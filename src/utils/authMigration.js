import logger from './logger';
import { getAllBooksFromIndexedDB, saveBooksToIndexedDB } from './booksIndexedDB';
import { openNutritionDB, STORE_DAILY_MEALS, STORE_MEALS, STORE_PROGRAMS, STORE_FAVORITE_FOODS, STORE_HYDRATION_LOG } from '../hooks/nutritionDataUtils';
import { openDB, STORE_ACTIVITIES, STORE_DAILY_METRICS } from '../hooks/garminDataUtils';
import {
  openQuietQuestDB,
  loadQuestsFromIndexedDB,
  loadValidationsFromIndexedDB,
  loadUserDataFromIndexedDB,
  loadDailyPerformancesFromIndexedDB,
  loadAppStateFromIndexedDB,
  saveQuestsToIndexedDB,
  saveValidationsToIndexedDB,
  saveUserDataToIndexedDB,
  saveDailyPerformancesToIndexedDB,
  saveAppStateToIndexedDB
} from './quietQuestIndexedDB';
import {
  openApprentissageDB,
  loadProgressionFromIndexedDB,
  loadSessionsHistoryFromIndexedDB,
  loadTimerFromIndexedDB,
  loadPlannerFromIndexedDB,
  saveProgressionToIndexedDB,
  saveSessionsHistoryToIndexedDB,
  saveTimerToIndexedDB,
  savePlannerToIndexedDB
} from './apprentissageIndexedDB';

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
const MIGRATION_SNAPSHOT_KEY = 'momentum:authMigration:lastSnapshot';
const LEGACY_QUIETQUEST_KEYS = [
  'quietquest_quests',
  'quietquest_validations',
  'quietquest_user_data',
  'quietquest_daily_performances',
  'quietquest_app_state',
  'quietquest_last_visit',
  'quietquest_last_cleanup'
];
const LEGACY_APPRENTISSAGE_KEYS = [
  'apprentissage_subjects',
  'apprentissage_progression',
  'apprentissage_timer',
  'apprentissage_sessions_history',
  'apprentissage_planner'
];
const LEGACY_FINANCE_KEYS = [
  'finance_portfolio_backup',
  'budget_backup'
];
const GARMIN_SETTINGS_PREFIX = 'garmin_source_settings_v1_';
const LEGACY_GARMIN_SETTINGS_MAIN = `${GARMIN_SETTINGS_PREFIX}main`;
const LEGACY_GARMIN_SETTINGS_GUEST = `${GARMIN_SETTINGS_PREFIX}guest`;

const persistMigrationSnapshot = (snapshot) => {
  try {
    localStorage.setItem(MIGRATION_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch (error) {
    log.warn('[auth-migration] Snapshot non persisté', error);
  }
};

const readMigrationSnapshot = () => {
  try {
    const raw = localStorage.getItem(MIGRATION_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearMigrationSnapshot = () => {
  try {
    localStorage.removeItem(MIGRATION_SNAPSHOT_KEY);
  } catch {
    // ignore
  }
};

const hasAnonymousBodyTrackingData = (entry) => {
  if (!entry || typeof entry !== 'object') return false;
  const photos = Array.isArray(entry.progressPhotos) ? entry.progressPhotos : [];
  const progress = Array.isArray(entry.progressEntries) ? entry.progressEntries : [];
  const reminders = Array.isArray(entry.bodyTrackingReminders) ? entry.bodyTrackingReminders : [];
  return (
    photos.some((x) => x && !x.userId) ||
    progress.some((x) => x && !x.userId) ||
    reminders.some((x) => x && !x.userId)
  );
};

const hasAnonymousProgramData = (entry) => {
  if (!entry || typeof entry !== 'object') return false;
  const customPrograms = Array.isArray(entry.customPrograms) ? entry.customPrograms : [];
  const programHistory = Array.isArray(entry.programHistory) ? entry.programHistory : [];
  return (
    customPrograms.some((x) => x && !x.userId) ||
    programHistory.some((x) => x && !x.userId)
  );
};

const buildAnonymousDataSnapshot = async (userId) => {
  const snapshot = {
    userId,
    createdAt: new Date().toISOString(),
    books: [],
    nutrition: {},
    garmin: {},
    workoutEntries: [],
    quietQuest: {
      indexedDb: {},
      localStorage: {}
    },
    apprentissage: {
      indexedDb: {},
      localStorage: {}
    },
    finance: {
      localStorage: {}
    },
    garminSettings: {
      localStorage: {}
    }
  };

  // Books
  const allBooks = await getAllBooksFromIndexedDB().catch(() => []);
  snapshot.books = (Array.isArray(allBooks) ? allBooks : []).filter((b) => b && !b.userId);

  // Nutrition
  const nutritionDb = await openNutritionDB().catch(() => null);
  if (nutritionDb) {
    const stores = [
      STORE_DAILY_MEALS,
      STORE_MEALS,
      STORE_PROGRAMS,
      STORE_FAVORITE_FOODS,
      STORE_HYDRATION_LOG
    ];
    for (const storeName of stores) {
      const tx = nutritionDb.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const records = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      }).catch(() => []);
      snapshot.nutrition[storeName] = (records || []).filter((r) => r && !r.userId);
    }
  }

  // Garmin
  const garminDb = await openDB().catch(() => null);
  if (garminDb) {
    const stores = [STORE_ACTIVITIES, STORE_DAILY_METRICS];
    for (const storeName of stores) {
      const tx = garminDb.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const records = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      }).catch(() => []);
      snapshot.garmin[storeName] = (records || []).filter((r) => r && !r.userId);
    }
  }

  // Workout/BodyTracking/Programs
  const workoutDb = await openWorkoutDB().catch(() => null);
  if (workoutDb) {
    const tx = workoutDb.transaction(['workouts'], 'readonly');
    const store = tx.objectStore('workouts');
    const records = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    }).catch(() => []);
    snapshot.workoutEntries = (records || []).filter(
      (entry) => hasAnonymousBodyTrackingData(entry) || hasAnonymousProgramData(entry)
    );
  }

  // QuietQuest snapshot (legacy main + localStorage)
  const quietQuestDb = await openQuietQuestDB().catch(() => null);
  if (quietQuestDb) {
    const quests = await loadQuestsFromIndexedDB(quietQuestDb, 'main').catch(() => []);
    const validations = await loadValidationsFromIndexedDB(quietQuestDb, 'main').catch(() => []);
    const userData = await loadUserDataFromIndexedDB(quietQuestDb, 'main').catch(() => null);
    const dailyPerformances = await loadDailyPerformancesFromIndexedDB(quietQuestDb, 'main').catch(() => []);
    const appState = await loadAppStateFromIndexedDB(quietQuestDb, 'main').catch(() => null);
    snapshot.quietQuest.indexedDb = {
      quests: Array.isArray(quests) ? quests : [],
      validations: Array.isArray(validations) ? validations : [],
      userData: userData || null,
      dailyPerformances: Array.isArray(dailyPerformances) ? dailyPerformances : [],
      appState: appState || null
    };
  }
  LEGACY_QUIETQUEST_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) snapshot.quietQuest.localStorage[key] = raw;
    } catch {
      // ignore storage access errors
    }
  });

  // Apprentissage snapshot (legacy main + localStorage)
  const apprentissageDb = await openApprentissageDB().catch(() => null);
  if (apprentissageDb) {
    const progression = await loadProgressionFromIndexedDB(apprentissageDb, 'main').catch(() => null);
    const sessions = await loadSessionsHistoryFromIndexedDB(apprentissageDb, 'main').catch(() => []);
    const timer = await loadTimerFromIndexedDB(apprentissageDb, 'main').catch(() => null);
    const planner = await loadPlannerFromIndexedDB(apprentissageDb, 'main').catch(() => null);
    snapshot.apprentissage.indexedDb = {
      progression: progression || null,
      sessions: Array.isArray(sessions) ? sessions : [],
      timer: timer || null,
      planner: planner || null
    };
  }
  LEGACY_APPRENTISSAGE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) snapshot.apprentissage.localStorage[key] = raw;
    } catch {
      // ignore storage access errors
    }
  });

  // Finance local snapshot
  LEGACY_FINANCE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) snapshot.finance.localStorage[key] = raw;
    } catch {
      // ignore storage access errors
    }
  });

  // Garmin settings snapshot
  [LEGACY_GARMIN_SETTINGS_MAIN, LEGACY_GARMIN_SETTINGS_GUEST].forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) snapshot.garminSettings.localStorage[key] = raw;
    } catch {
      // ignore storage access errors
    }
  });

  return snapshot;
};

export const previewAnonymousDataMigration = async () => {
  const snapshot = await buildAnonymousDataSnapshot('preview');
  const nutritionCount = Object.values(snapshot.nutrition).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );
  const garminCount = Object.values(snapshot.garmin).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0
  );

  let bodyTrackingCount = 0;
  let programsCount = 0;
  const quietQuestCount =
    (snapshot.quietQuest.indexedDb?.quests?.length || 0) +
    (snapshot.quietQuest.indexedDb?.validations?.length || 0) +
    (snapshot.quietQuest.indexedDb?.dailyPerformances?.length || 0) +
    (snapshot.quietQuest.indexedDb?.userData ? 1 : 0) +
    (snapshot.quietQuest.indexedDb?.appState ? 1 : 0) +
    Object.keys(snapshot.quietQuest.localStorage || {}).length;
  const apprentissageCount =
    (snapshot.apprentissage.indexedDb?.sessions?.length || 0) +
    (snapshot.apprentissage.indexedDb?.progression ? 1 : 0) +
    (snapshot.apprentissage.indexedDb?.timer ? 1 : 0) +
    (snapshot.apprentissage.indexedDb?.planner ? 1 : 0) +
    Object.keys(snapshot.apprentissage.localStorage || {}).length;
  const financeCount = Object.keys(snapshot.finance.localStorage || {}).length;
  const garminSettingsCount = Object.keys(snapshot.garminSettings.localStorage || {}).length;
  (snapshot.workoutEntries || []).forEach((entry) => {
    const photos = Array.isArray(entry.progressPhotos) ? entry.progressPhotos : [];
    const progress = Array.isArray(entry.progressEntries) ? entry.progressEntries : [];
    const reminders = Array.isArray(entry.bodyTrackingReminders) ? entry.bodyTrackingReminders : [];
    const customPrograms = Array.isArray(entry.customPrograms) ? entry.customPrograms : [];
    const programHistory = Array.isArray(entry.programHistory) ? entry.programHistory : [];
    bodyTrackingCount += photos.filter((x) => x && !x.userId).length;
    bodyTrackingCount += progress.filter((x) => x && !x.userId).length;
    bodyTrackingCount += reminders.filter((x) => x && !x.userId).length;
    programsCount += customPrograms.filter((x) => x && !x.userId).length;
    programsCount += programHistory.filter((x) => x && !x.userId).length;
  });

  const total =
    (snapshot.books?.length || 0) +
    nutritionCount +
    garminCount +
    bodyTrackingCount +
    programsCount +
    quietQuestCount +
    apprentissageCount +
    financeCount +
    garminSettingsCount;

  return {
    success: true,
    books: snapshot.books?.length || 0,
    nutrition: nutritionCount,
    garmin: garminCount,
    bodyTracking: bodyTrackingCount,
    programs: programsCount,
    quietQuest: quietQuestCount,
    apprentissage: apprentissageCount,
    finance: financeCount,
    garminSettings: garminSettingsCount,
    total
  };
};

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
      migratedPrograms: 0,
      migratedQuietQuest: 0,
      migratedApprentissage: 0,
      migratedFinance: 0,
      migratedGarminSettings: 0
    };
  }

  const results = {
    migratedBooks: 0,
    migratedNutrition: 0,
    migratedBodyTracking: 0,
    migratedGarmin: 0,
    migratedPrograms: 0,
    migratedQuietQuest: 0,
    migratedApprentissage: 0,
    migratedFinance: 0,
    migratedGarminSettings: 0
  };

  const totalSteps = 9;
  let currentStep = 0;

  try {
    // Snapshot de rollback avant toute mutation
    const snapshot = await buildAnonymousDataSnapshot(userId);
    persistMigrationSnapshot(snapshot);

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

    // 6. Migration QuietQuest
    currentStep = 6;
    if (onProgress) onProgress(currentStep, totalSteps, 'Migration des quêtes...');
    const quietQuestResult = await migrateQuietQuest(userId);
    results.migratedQuietQuest = quietQuestResult.migrated || 0;
    if (onProgress) onProgress(currentStep, totalSteps, `${results.migratedQuietQuest} entrées quêtes migrées`);

    // 7. Migration Apprentissage
    currentStep = 7;
    if (onProgress) onProgress(currentStep, totalSteps, 'Migration apprentissage...');
    const apprentissageResult = await migrateApprentissage(userId);
    results.migratedApprentissage = apprentissageResult.migrated || 0;
    if (onProgress) onProgress(currentStep, totalSteps, `${results.migratedApprentissage} entrées apprentissage migrées`);

    // 8. Migration Finance
    currentStep = 8;
    if (onProgress) onProgress(currentStep, totalSteps, 'Migration finance...');
    const financeResult = await migrateFinanceLocalData(userId);
    results.migratedFinance = financeResult.migrated || 0;
    if (onProgress) onProgress(currentStep, totalSteps, `${results.migratedFinance} entrées finance migrées`);

    // 9. Migration Paramètres Garmin multi-sources
    currentStep = 9;
    if (onProgress) onProgress(currentStep, totalSteps, 'Migration des paramètres Garmin...');
    const garminSettingsResult = await migrateGarminSettings(userId);
    results.migratedGarminSettings = garminSettingsResult.migrated || 0;
    if (onProgress) onProgress(currentStep, totalSteps, `${results.migratedGarminSettings} paramètres Garmin migrés`);

    const totalMigrated = 
      results.migratedBooks + 
      results.migratedNutrition + 
      results.migratedBodyTracking + 
      results.migratedGarmin + 
      results.migratedPrograms +
      results.migratedQuietQuest +
      results.migratedApprentissage +
      results.migratedFinance +
      results.migratedGarminSettings;

    log.debug('✅ Migration complète terminée', { userId, ...results, totalMigrated });

    return { success: true, totalSteps, ...results };
  } catch (error) {
    log.error('❌ Erreur lors de la migration des données vers l\'utilisateur', error);
    return { success: false, totalSteps, ...results };
  }
};

export const rollbackLastMigration = async (userId) => {
  const snapshot = readMigrationSnapshot();
  if (!snapshot) return { success: false, error: 'NO_SNAPSHOT' };
  if (userId && snapshot.userId && String(snapshot.userId) !== String(userId)) {
    return { success: false, error: 'SNAPSHOT_USER_MISMATCH' };
  }

  try {
    // Books restore
    const currentBooks = await getAllBooksFromIndexedDB().catch(() => []);
    const byId = new Map((Array.isArray(currentBooks) ? currentBooks : []).map((b) => [b.id, b]));
    (snapshot.books || []).forEach((book) => {
      if (book && book.id != null) byId.set(book.id, book);
    });
    await saveBooksToIndexedDB(Array.from(byId.values()));

    // Nutrition restore
    const nutritionDb = await openNutritionDB().catch(() => null);
    if (nutritionDb && snapshot.nutrition) {
      for (const [storeName, records] of Object.entries(snapshot.nutrition)) {
        if (!Array.isArray(records) || records.length === 0) continue;
        const tx = nutritionDb.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        for (const record of records) {
          await new Promise((resolve, reject) => {
            const req = store.put(record);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        }
      }
    }

    // Garmin restore
    const garminDb = await openDB().catch(() => null);
    if (garminDb && snapshot.garmin) {
      for (const [storeName, records] of Object.entries(snapshot.garmin)) {
        if (!Array.isArray(records) || records.length === 0) continue;
        const tx = garminDb.transaction([storeName], 'readwrite');
        const store = tx.objectStore(storeName);
        for (const record of records) {
          await new Promise((resolve, reject) => {
            const req = store.put(record);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        }
      }
    }

    // Workout restore
    const workoutDb = await openWorkoutDB().catch(() => null);
    if (workoutDb && Array.isArray(snapshot.workoutEntries)) {
      const tx = workoutDb.transaction(['workouts'], 'readwrite');
      const store = tx.objectStore('workouts');
      for (const entry of snapshot.workoutEntries) {
        await new Promise((resolve, reject) => {
          const req = store.put(entry);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      }
    }

    // QuietQuest restore
    const quietQuestDb = await openQuietQuestDB().catch(() => null);
    if (quietQuestDb && snapshot.quietQuest) {
      const q = snapshot.quietQuest.indexedDb || {};
      if (Array.isArray(q.quests)) await saveQuestsToIndexedDB(quietQuestDb, q.quests, 'main');
      if (Array.isArray(q.validations)) await saveValidationsToIndexedDB(quietQuestDb, q.validations, 'main');
      if (q.userData) await saveUserDataToIndexedDB(quietQuestDb, q.userData, 'main');
      if (Array.isArray(q.dailyPerformances)) {
        await saveDailyPerformancesToIndexedDB(quietQuestDb, q.dailyPerformances, 'main');
      }
      if (q.appState) await saveAppStateToIndexedDB(quietQuestDb, q.appState, 'main');
      Object.entries(snapshot.quietQuest.localStorage || {}).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // ignore
        }
      });
    }

    // Apprentissage restore
    const apprentissageDb = await openApprentissageDB().catch(() => null);
    if (apprentissageDb && snapshot.apprentissage) {
      const a = snapshot.apprentissage.indexedDb || {};
      if (a.progression) await saveProgressionToIndexedDB(apprentissageDb, a.progression, 'main');
      if (Array.isArray(a.sessions)) await saveSessionsHistoryToIndexedDB(apprentissageDb, a.sessions, 'main');
      if (a.timer) await saveTimerToIndexedDB(apprentissageDb, a.timer, 'main');
      if (a.planner) await savePlannerToIndexedDB(apprentissageDb, a.planner, 'main');
      Object.entries(snapshot.apprentissage.localStorage || {}).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // ignore
        }
      });
    }

    // Finance restore
    Object.entries(snapshot.finance?.localStorage || {}).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    });

    // Garmin settings restore
    Object.entries(snapshot.garminSettings?.localStorage || {}).forEach(([key, value]) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    });

    clearMigrationSnapshot();
    return { success: true };
  } catch (error) {
    log.error('[auth-migration] ❌ Erreur rollback migration', error);
    return { success: false, error: 'ROLLBACK_FAILED' };
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

const migrateQuietQuest = async (userId) => {
  let migrated = 0;
  try {
    const db = await openQuietQuestDB();
    if (!db) return { success: false, migrated: 0 };

    const quests = await loadQuestsFromIndexedDB(db, 'main').catch(() => []);
    const validations = await loadValidationsFromIndexedDB(db, 'main').catch(() => []);
    const userData = await loadUserDataFromIndexedDB(db, 'main').catch(() => null);
    const daily = await loadDailyPerformancesFromIndexedDB(db, 'main').catch(() => []);
    const appState = await loadAppStateFromIndexedDB(db, 'main').catch(() => null);

    if (Array.isArray(quests) && quests.length > 0) {
      await saveQuestsToIndexedDB(db, quests, userId);
      migrated += quests.length;
    }
    if (Array.isArray(validations) && validations.length > 0) {
      await saveValidationsToIndexedDB(db, validations, userId);
      migrated += validations.length;
    }
    if (userData) {
      await saveUserDataToIndexedDB(db, userData, userId);
      migrated += 1;
    }
    if (Array.isArray(daily) && daily.length > 0) {
      await saveDailyPerformancesToIndexedDB(db, daily, userId);
      migrated += daily.length;
    }
    if (appState) {
      await saveAppStateToIndexedDB(db, appState, userId);
      migrated += 1;
    }

    LEGACY_QUIETQUEST_KEYS.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw != null) {
          localStorage.setItem(`${key}__user_${userId}`, raw);
          migrated += 1;
        }
      } catch {
        // ignore
      }
    });

    return { success: true, migrated };
  } catch (error) {
    log.error('[auth-migration] ❌ Erreur migration QuietQuest', error);
    return { success: false, migrated: 0 };
  }
};

const migrateApprentissage = async (userId) => {
  let migrated = 0;
  try {
    const db = await openApprentissageDB();
    if (!db) return { success: false, migrated: 0 };

    const progression = await loadProgressionFromIndexedDB(db, 'main').catch(() => null);
    const sessions = await loadSessionsHistoryFromIndexedDB(db, 'main').catch(() => []);
    const timer = await loadTimerFromIndexedDB(db, 'main').catch(() => null);
    const planner = await loadPlannerFromIndexedDB(db, 'main').catch(() => null);

    if (progression) {
      await saveProgressionToIndexedDB(db, progression, userId);
      migrated += 1;
    }
    if (Array.isArray(sessions) && sessions.length > 0) {
      await saveSessionsHistoryToIndexedDB(db, sessions, userId);
      migrated += sessions.length;
    }
    if (timer) {
      await saveTimerToIndexedDB(db, timer, userId);
      migrated += 1;
    }
    if (planner) {
      await savePlannerToIndexedDB(db, planner, userId);
      migrated += 1;
    }

    LEGACY_APPRENTISSAGE_KEYS.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw != null) {
          localStorage.setItem(`${key}__user_${userId}`, raw);
          migrated += 1;
        }
      } catch {
        // ignore
      }
    });

    return { success: true, migrated };
  } catch (error) {
    log.error('[auth-migration] ❌ Erreur migration Apprentissage', error);
    return { success: false, migrated: 0 };
  }
};

const migrateFinanceLocalData = async (userId) => {
  let migrated = 0;
  try {
    LEGACY_FINANCE_KEYS.forEach((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw != null) {
          localStorage.setItem(`${key}__user_${userId}`, raw);
          migrated += 1;
        }
      } catch {
        // ignore
      }
    });
    return { success: true, migrated };
  } catch (error) {
    log.error('[auth-migration] ❌ Erreur migration Finance', error);
    return { success: false, migrated: 0 };
  }
};

const migrateGarminSettings = async (userId) => {
  let migrated = 0;
  try {
    const userKey = `${GARMIN_SETTINGS_PREFIX}user-${userId}`;
    [LEGACY_GARMIN_SETTINGS_MAIN, LEGACY_GARMIN_SETTINGS_GUEST].forEach((legacyKey) => {
      try {
        const raw = localStorage.getItem(legacyKey);
        if (!raw) return;
        if (!localStorage.getItem(userKey)) {
          localStorage.setItem(userKey, raw);
          migrated += 1;
        }
      } catch {
        // ignore
      }
    });
    return { success: true, migrated };
  } catch (error) {
    log.error('[auth-migration] ❌ Erreur migration paramètres Garmin', error);
    return { success: false, migrated: 0 };
  }
};


