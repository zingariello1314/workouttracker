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
  closeTrackedWorkoutTrackerConnections();
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
    request.onsuccess = (e) => resolve(trackWorkoutTrackerConnection(e.target.result));
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
  const opened = openWorkoutTrackerDbAtCurrentVersionRaw().then((db) => {
    if (requireWorkoutsStore && !db.objectStoreNames.contains(WORKOUT_STORE_NAME)) {
      try {
        db.close();
      } catch {
        // ignore
      }
      throw new Error('WORKOUT_STORE_MISSING');
    }
    return db;
  });
  return withIdbOperationTimeout(opened, OPEN_TIMEOUT_MS).catch((err) => {
    // Un open abandonné sur timeout garde la connexion ouverte et bloque
    // toute montée de version suivante. On la ferme dès qu’elle aboutit.
    opened.then((db) => {
      try {
        db.close();
      } catch {
        // ignore
      }
    }).catch(() => {});
    throw err;
  });
}

/**
 * Une seule montée de version à la fois.
 * Abandonner `indexedDB.open(version+1)` sur timeout laisse la requête bloquée :
 * tous les open suivants (nutrition, import) attendent indéfiniment.
 */
let workoutStoreBootstrapInflight = null;
let upgradeSettled = Promise.resolve();

/** Les autres ouvertures de WorkoutTrackerDB attendent la fin de la migration. */
export function whenWorkoutTrackerUpgradeSettled() {
  return upgradeSettled;
}

/** Ferme cette connexion dès qu’une migration de schéma démarre. */
export function armWorkoutTrackerVersionClose(db) {
  if (!db) return db;
  const previous = db.onversionchange;
  db.onversionchange = () => {
    try {
      db.close();
    } catch {
      // ignore
    }
    if (typeof previous === 'function') {
      try {
        previous.call(db);
      } catch {
        // ignore
      }
    }
  };
  return db;
}

const liveWorkoutTrackerDbs = new Set();

/** Enregistre une connexion pour pouvoir la fermer quand le schéma doit changer. */
export function trackWorkoutTrackerConnection(db) {
  if (!db) return db;
  liveWorkoutTrackerDbs.add(db);
  armWorkoutTrackerVersionClose(db);
  const previousOnClose = db.onclose;
  db.onclose = (event) => {
    liveWorkoutTrackerDbs.delete(db);
    if (typeof previousOnClose === 'function') {
      try {
        previousOnClose.call(db, event);
      } catch {
        // ignore
      }
    }
  };
  return db;
}

function closeTrackedWorkoutTrackerConnections() {
  for (const db of [...liveWorkoutTrackerDbs]) {
    liveWorkoutTrackerDbs.delete(db);
    try {
      db.close();
    } catch {
      // ignore
    }
  }
}

function openWorkoutTrackerDbAtVersion(version) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(WORKOUT_TRACKER_DB_NAME, version);
    req.onupgradeneeded = (event) => {
      const db = event.target.result;
      applyWorkoutTrackerWorkoutsStoreUpgrade(db);
      applyWorkoutSessionStoreUpgrade(db);
    };
    req.onsuccess = (e) => resolve(trackWorkoutTrackerConnection(e.target.result));
    req.onerror = (e) => reject(e.target.error || new Error('WORKOUT_DB_OPEN_FAILED'));
    req.onblocked = () => {
      console.warn('[workoutDbGateway] Migration workout bloquée, fermeture des autres connexions');
      void releaseWorkoutTrackerConnectionsForUpgrade();
    };
  });
}

/** Crée les stores workout / workoutSessions si absents. */
export function bootstrapWorkoutStoresIfNeeded() {
  if (!workoutStoreBootstrapInflight) {
    workoutStoreBootstrapInflight = bootstrapWorkoutStoresOnce().finally(() => {
      workoutStoreBootstrapInflight = null;
    });
  }
  // Le délai ne coupe pas la requête IndexedDB (sinon elle reste bloquée pour
  // toujours). Il libère seulement l’appelant, pour que l’import puisse finir.
  return withIdbOperationTimeout(workoutStoreBootstrapInflight, OPEN_TIMEOUT_MS);
}

async function bootstrapWorkoutStoresOnce() {
  let finishUpgrade = () => {};
  const gate = new Promise((resolve) => {
    finishUpgrade = resolve;
  });
  const prior = upgradeSettled;
  upgradeSettled = prior.then(() => gate);
  try {
    await prior;
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

    await releaseWorkoutTrackerConnectionsForUpgrade();
    const upgraded = await openWorkoutTrackerDbAtVersion(currentVersion + 1);
    try {
      upgraded.close();
    } catch {
      // ignore
    }
  } finally {
    finishUpgrade();
  }
}

/** Connexion éphémère : ouvre, utilise, ferme. */
export async function withEphemeralWorkoutDb(fn) {
  prepareWorkoutEphemeralWrite();
  let db;
  try {
    db = await openWorkoutTrackerDbAtCurrentVersion();
  } catch (err) {
    // Un open trop lent n’est pas une base vide. Lancer une montée de version
    // puis l’abandonner laisse la requête IndexedDB bloquée : toutes les
    // ouvertures suivantes attendent indéfiniment (sauvegarde séance en timeout).
    const retryable =
      err?.message === 'WORKOUT_STORE_MISSING' ||
      err?.message === 'IDB_OPERATION_TIMEOUT';
    if (retryable) {
      try {
        await bootstrapWorkoutStoresIfNeeded();
      } catch {
        if (workoutStoreBootstrapInflight) {
          await withIdbOperationTimeout(workoutStoreBootstrapInflight, 15000);
        }
      }
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
 * Persistance d’une séance (reps, kg, étirements) dans `workoutSessions`.
 * On n’écrit pas la ligne `workouts` ici : ce put clonait photos, endurance
 * et tout l’historique sur le fil de l’interface. Au chargement, la ligne du
 * jour remplace les clés de cette date.
 *
 * @param {string} scopeKey
 * @param {string} sessionDay — YYYY-MM-DD
 * @param {Record<string, unknown>} _fullData — conservé pour les appelants
 * @param {Record<string, unknown>} slice — extrait journalier
 */
export async function persistWorkoutSessionDay(scopeKey, sessionDay, _fullData, slice) {
  const {
    putWorkoutSessionDayOnDb,
    getWorkoutSessionDay,
    buildSessionDayPayload,
  } = await import('./workoutSessionDbGateway.js');

  const payload = buildSessionDayPayload(scopeKey, sessionDay, slice);

  const writeSessionStore = () =>
    withEphemeralWorkoutDb(async (db) => {
      if (!db.objectStoreNames.contains(WORKOUT_SESSION_STORE)) {
        throw new Error('WORKOUT_SESSION_STORE_MISSING');
      }
      return putWorkoutSessionDayOnDb(db, payload);
    });

  prepareWorkoutEphemeralWrite();

  await withIdbOperationTimeout(writeSessionStore(), SESSION_PUT_TIMEOUT_MS);

  const verified = await withIdbOperationTimeout(
    getWorkoutSessionDay(scopeKey, sessionDay),
    OPEN_TIMEOUT_MS
  );
  if (!verified) {
    throw new Error('WORKOUT_SESSION_VERIFY_FAILED');
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
  await withEphemeralWorkoutDb((db) =>
    withIdbOperationTimeout(
      new Promise((resolve, reject) => {
        const tx = db.transaction([WORKOUT_STORE_NAME], 'readwrite');
        const req = tx.objectStore(WORKOUT_STORE_NAME).put(payload);
        req.onerror = () => reject(req.error);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error || new Error('WORKOUT_TX_ABORTED'));
      }),
      20000
    )
  );
}
