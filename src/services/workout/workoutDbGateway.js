/**
 * Passerelle IndexedDB WorkoutTrackerDB / store `workouts` — hors hooks React.
 * Coordinateur d’ouverture : libère nutrition + cache photos avant chaque écriture sport.
 *
 * @module services/workout/workoutDbGateway
 */

import { withIdbOperationTimeout } from '../../utils/sessionSaveTimeout.js';

export const WORKOUT_TRACKER_DB_NAME = 'WorkoutTrackerDB';
export const WORKOUT_STORE_NAME = 'workouts';
export const WORKOUT_SESSION_STORE = 'workoutSessions';
/** Référence schéma ; les ouvertures runtime n’imposent plus cette version. */
export const WORKOUT_TRACKER_DB_VERSION = 13;

const OPEN_TIMEOUT_MS = 6000;
const SESSION_PUT_TIMEOUT_MS = 10000;
const WORKOUTS_PATCH_TIMEOUT_MS = 12000;

/**
 * @param {IDBDatabase} db
 */
export function applyWorkoutSessionStoreUpgrade(db) {
  if (!db.objectStoreNames.contains(WORKOUT_SESSION_STORE)) {
    const store = db.createObjectStore(WORKOUT_SESSION_STORE, { keyPath: 'id' });
    store.createIndex('scopeKey', 'scopeKey', { unique: false });
    store.createIndex('dateStr', 'dateStr', { unique: false });
  }
}

/**
 * Store principal `workouts` (scope utilisateur / admin).
 * @param {IDBDatabase} db
 */
export function applyWorkoutTrackerWorkoutsStoreUpgrade(db) {
  if (!db.objectStoreNames.contains(WORKOUT_STORE_NAME)) {
    const workoutStore = db.createObjectStore(WORKOUT_STORE_NAME, { keyPath: 'id' });
    try {
      workoutStore.createIndex('timestamp', 'timestamp', { unique: false });
    } catch {
      // ignore
    }
  }
}

let cachedDbPromise = null;
let cachedDbInstance = null;

/** Ferme la connexion partagée workout. */
export function invalidateWorkoutDbCache() {
  if (cachedDbInstance) {
    try {
      cachedDbInstance.close();
    } catch {
      // ignore
    }
    cachedDbInstance = null;
  }
  cachedDbPromise = null;
}

/**
 * Prépare une écriture sport : ferme uniquement le cache workout local.
 * Ne ferme PAS nutrition — les connexions parallèles IndexedDB sont sûres.
 */
export function prepareWorkoutEphemeralWrite() {
  invalidateWorkoutDbCache();
}

/**
 * Fermeture complète — réservée aux migrations de schéma (upgrade bloqué).
 * @deprecated Préférer prepareWorkoutEphemeralWrite pour les sauvegardes courantes.
 */
export async function releaseWorkoutTrackerConnectionsForUpgrade() {
  invalidateWorkoutDbCache();
  try {
    const { closeNutritionDB } = await import('../../hooks/nutritionDataUtils.js');
    if (typeof closeNutritionDB === 'function') {
      await closeNutritionDB();
    }
  } catch {
    // ignore
  }
  try {
    const { closePhotoPaginationCacheDb } = await import(
      '../../components/BodyTracking/services/photoPaginationCache.js'
    );
    if (typeof closePhotoPaginationCacheDb === 'function') {
      closePhotoPaginationCacheDb();
    }
  } catch {
    // ignore
  }
}

/** @deprecated Alias — n’utiliser que pour migrations. */
export const releaseWorkoutTrackerBlockingConnections = releaseWorkoutTrackerConnectionsForUpgrade;

function attachDbLifecycleHandlers(db) {
  cachedDbInstance = db;
  db.onversionchange = () => {
    invalidateWorkoutDbCache();
  };
  db.onclose = () => {
    if (cachedDbInstance === db) {
      cachedDbInstance = null;
    }
    cachedDbPromise = null;
  };
}

function openWorkoutTrackerDbAtCurrentVersionRaw() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('WORKOUT_DB_UNAVAILABLE'));
      return;
    }
    const request = indexedDB.open(WORKOUT_TRACKER_DB_NAME);
    request.onblocked = () => {
      console.warn('[workoutDbGateway] IndexedDB bloquée (migration en cours)…');
      void releaseWorkoutTrackerConnectionsForUpgrade();
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      applyWorkoutTrackerWorkoutsStoreUpgrade(db);
      applyWorkoutSessionStoreUpgrade(db);
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (event) => {
      reject(event.target.error || new Error('WORKOUT_DB_OPEN_FAILED'));
    };
  });
}

/**
 * Ouvre WorkoutTrackerDB à la version courante (sans forcer de migration).
 * @param {{ requireWorkoutsStore?: boolean }} [options]
 * @returns {Promise<IDBDatabase>}
 */
export function openWorkoutTrackerDbAtCurrentVersion(options = {}) {
  const { requireWorkoutsStore = true } = options;
  return withIdbOperationTimeout(
    openWorkoutTrackerDbAtCurrentVersionRaw().then((db) => {
      if (requireWorkoutsStore && !db.objectStoreNames.contains(WORKOUT_STORE_NAME)) {
        try {
          db.close();
        } catch {
          // ignore
        }
        throw new Error('WORKOUT_STORE_MISSING');
      }
      return db;
    }),
    OPEN_TIMEOUT_MS
  );
}

/** Crée les stores workout / workoutSessions si absents. */
export async function bootstrapWorkoutStoresIfNeeded() {
  await releaseWorkoutTrackerConnectionsForUpgrade();
  const probe = await withIdbOperationTimeout(
    openWorkoutTrackerDbAtCurrentVersionRaw(),
    OPEN_TIMEOUT_MS
  );
  const needsWorkouts = !probe.objectStoreNames.contains(WORKOUT_STORE_NAME);
  const needsSessions = !probe.objectStoreNames.contains(WORKOUT_SESSION_STORE);
  const currentVersion = probe.version;
  probe.close();
  if (!needsWorkouts && !needsSessions) return;

  await withIdbOperationTimeout(
    new Promise((resolve, reject) => {
      const req = indexedDB.open(WORKOUT_TRACKER_DB_NAME, currentVersion + 1);
      req.onupgradeneeded = (event) => {
        const db = event.target.result;
        applyWorkoutTrackerWorkoutsStoreUpgrade(db);
        applyWorkoutSessionStoreUpgrade(db);
      };
      req.onsuccess = (e) => {
        e.target.result.close();
        resolve(undefined);
      };
      req.onerror = (e) => reject(e.target.error);
      req.onblocked = () => {
        console.warn('[workoutDbGateway] Migration workout bloquée');
        void releaseWorkoutTrackerConnectionsForUpgrade();
      };
    }),
    OPEN_TIMEOUT_MS
  );
}

/** Connexion éphémère : ouvre, utilise, ferme. */
export async function withEphemeralWorkoutDb(fn) {
  prepareWorkoutEphemeralWrite();
  let db;
  try {
    db = await openWorkoutTrackerDbAtCurrentVersion();
  } catch (err) {
    if (err?.message === 'WORKOUT_STORE_MISSING' || err?.message === 'IDB_OPERATION_TIMEOUT') {
      await bootstrapWorkoutStoresIfNeeded();
      db = await openWorkoutTrackerDbAtCurrentVersion();
    } else {
      throw err;
    }
  }
  try {
    return await fn(db);
  } finally {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
}

function openWorkoutTrackerDbFresh() {
  return openWorkoutTrackerDbAtCurrentVersion().then((db) => {
    attachDbLifecycleHandlers(db);
    return db;
  });
}

/** Réutilise une connexion IndexedDB ouverte. */
export const openWorkoutTrackerDb = () => {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!cachedDbPromise) {
    cachedDbPromise = openWorkoutTrackerDbFresh().catch((err) => {
      cachedDbPromise = null;
      throw err;
    });
  }
  return cachedDbPromise;
};

/** @deprecated */
export function openUncachedWorkoutDb() {
  prepareWorkoutEphemeralWrite();
  return openWorkoutTrackerDbAtCurrentVersion();
}

/**
 * Persistance fiable d’une séance (reps, kg, étirements) :
 * 1. `workoutSessions` — petit payload, source de vérité au rechargement
 * 2. `workouts` — patch des maps du jour (repli legacy)
 *
 * @param {string} scopeKey
 * @param {string} sessionDay — YYYY-MM-DD
 * @param {Record<string, unknown>} fullData
 * @param {Record<string, unknown>} slice — extrait journalier
 */
export async function persistWorkoutSessionDay(scopeKey, sessionDay, fullData, slice) {
  const {
    putWorkoutSessionDayOnDb,
    getWorkoutSessionDay,
    buildSessionDayPayload,
  } = await import('./workoutSessionDbGateway.js');
  const { applyDayKeysToWorkoutRow } = await import('../../utils/workoutSessionPersistence.js');

  const payload = buildSessionDayPayload(scopeKey, sessionDay, slice);

  const writeSessionStore = () =>
    withEphemeralWorkoutDb(async (db) => {
      if (!db.objectStoreNames.contains(WORKOUT_SESSION_STORE)) {
        throw new Error('WORKOUT_SESSION_STORE_MISSING');
      }
      return putWorkoutSessionDayOnDb(db, payload);
    });

  prepareWorkoutEphemeralWrite();

  try {
    await withIdbOperationTimeout(writeSessionStore(), SESSION_PUT_TIMEOUT_MS);
  } catch (firstErr) {
    if (
      firstErr?.message === 'WORKOUT_SESSION_STORE_MISSING' ||
      firstErr?.message === 'IDB_OPERATION_TIMEOUT' ||
      firstErr?.message === 'WORKOUT_STORE_MISSING'
    ) {
      await releaseWorkoutTrackerConnectionsForUpgrade();
      await bootstrapWorkoutStoresIfNeeded();
      await withIdbOperationTimeout(writeSessionStore(), SESSION_PUT_TIMEOUT_MS);
    } else {
      throw firstErr;
    }
  }

  const verified = await getWorkoutSessionDay(scopeKey, sessionDay);
  if (!verified) {
    throw new Error('WORKOUT_SESSION_VERIFY_FAILED');
  }

  try {
    await withIdbOperationTimeout(
      withEphemeralWorkoutDb((db) => {
        return new Promise((resolve, reject) => {
          const tx = db.transaction([WORKOUT_STORE_NAME], 'readwrite');
          const store = tx.objectStore(WORKOUT_STORE_NAME);
          const getReq = store.get(scopeKey);
          getReq.onerror = () => reject(getReq.error);
          getReq.onsuccess = () => {
            const existing = getReq.result;
            const flat =
              existing?.data && typeof existing.data === 'object' ? existing.data : existing || {};
            const merged = applyDayKeysToWorkoutRow(flat, fullData, sessionDay);
            merged.lastSaved = new Date().toISOString();
            merged.id = scopeKey;
            const putReq = store.put(merged);
            putReq.onerror = () => reject(putReq.error);
          };
          tx.oncomplete = () => resolve(undefined);
          tx.onerror = () => reject(tx.error || new Error('WORKOUT_PATCH_TX_FAILED'));
        });
      }),
      WORKOUTS_PATCH_TIMEOUT_MS
    );
  } catch (patchErr) {
    console.warn('[workoutDbGateway] Patch store workouts ignoré (session store OK):', patchErr);
  }
}

/** @deprecated Utiliser persistWorkoutSessionDay */
export async function patchWorkoutAggregateSessionDay(scopeKey, sessionDay, fullData) {
  const { extractDaySliceFromAggregate } = await import('../../utils/workoutSessionPersistence.js');
  const slice = extractDaySliceFromAggregate(fullData, sessionDay);
  return persistWorkoutSessionDay(scopeKey, sessionDay, fullData, slice);
}

/**
 * @param {string} scopeKey
 * @returns {Promise<Record<string, unknown> | null>}
 */
export async function getWorkoutRow(scopeKey) {
  try {
    return await withEphemeralWorkoutDb(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction([WORKOUT_STORE_NAME], 'readonly');
          const req = tx.objectStore(WORKOUT_STORE_NAME).get(scopeKey);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
          tx.onerror = () => reject(tx.error);
        })
    );
  } catch {
    return null;
  }
}

/**
 * Remplace l’enregistrement workouts pour cette clé (merge métier à faire en amont).
 *
 * @param {string} scopeKey
 * @param {Record<string, unknown>} row
 */
export async function putWorkoutRow(scopeKey, row) {
  const payload = { ...row, id: scopeKey };
  await withEphemeralWorkoutDb(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction([WORKOUT_STORE_NAME], 'readwrite');
        const req = tx.objectStore(WORKOUT_STORE_NAME).put(payload);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('WORKOUT_TX_ABORTED'));
      })
  );
}
