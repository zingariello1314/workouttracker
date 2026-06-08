/**

 * Store IndexedDB `workoutSessions` — une ligne par (utilisateur, jour).

 *

 * @module services/workout/workoutSessionDbGateway

 */



import {

  WORKOUT_STORE_NAME,

  WORKOUT_SESSION_STORE,

  WORKOUT_TRACKER_DB_VERSION,

  withEphemeralWorkoutDb,

} from './workoutDbGateway.js';



export { WORKOUT_SESSION_STORE };

export const WORKOUT_TRACKER_DB_VERSION_WITH_SESSIONS = WORKOUT_TRACKER_DB_VERSION;



/** @param {string} scopeKey @param {string} dateStr */

export function buildWorkoutSessionId(scopeKey, dateStr) {

  return `${scopeKey}:${dateStr}`;

}



/**

 * @param {string} scopeKey

 * @param {string} dateStr

 * @param {Record<string, unknown>} slice

 */

export function buildSessionDayPayload(scopeKey, dateStr, slice) {

  const id = buildWorkoutSessionId(scopeKey, dateStr);

  return {

    id,

    scopeKey,

    dateStr,

    mapFields: slice.mapFields || {},

    dailyVariations: slice.dailyVariations || null,

    circuitProgress: slice.circuitProgress || null,

    lastSaved: new Date().toISOString(),

  };

}



/**

 * @param {IDBDatabase} db

 * @param {Record<string, unknown>} payload

 */

export function putWorkoutSessionDayOnDb(db, payload) {

  return new Promise((resolve, reject) => {

    if (!db.objectStoreNames.contains(WORKOUT_SESSION_STORE)) {

      reject(new Error('WORKOUT_SESSION_STORE_MISSING'));

      return;

    }

    const tx = db.transaction([WORKOUT_SESSION_STORE], 'readwrite');

    const req = tx.objectStore(WORKOUT_SESSION_STORE).put(payload);

    req.onerror = () => reject(req.error);

    tx.oncomplete = () => resolve(payload);

    tx.onerror = () => reject(tx.error);

    tx.onabort = () => reject(tx.error || new Error('WORKOUT_SESSION_TX_ABORTED'));

  });

}



/** Écriture session (connexion éphémère). */

export async function putWorkoutSessionDay(scopeKey, dateStr, slice) {

  const payload = buildSessionDayPayload(scopeKey, dateStr, slice);

  return withEphemeralWorkoutDb((db) => putWorkoutSessionDayOnDb(db, payload));

}



/** @param {string} scopeKey @param {string} dateStr */

export async function getWorkoutSessionDay(scopeKey, dateStr) {

  const id = buildWorkoutSessionId(scopeKey, dateStr);

  try {

    return await withEphemeralWorkoutDb(

      (db) =>

        new Promise((resolve, reject) => {

          if (!db.objectStoreNames.contains(WORKOUT_SESSION_STORE)) {

            resolve(null);

            return;

          }

          const tx = db.transaction([WORKOUT_SESSION_STORE], 'readonly');

          const req = tx.objectStore(WORKOUT_SESSION_STORE).get(id);

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

 * @param {string} scopeKey

 * @returns {Promise<Array<Record<string, unknown>>>}

 */

export async function getAllWorkoutSessionsForScope(scopeKey) {

  try {

    return await withEphemeralWorkoutDb(

      (db) =>

        new Promise((resolve, reject) => {

          if (!db.objectStoreNames.contains(WORKOUT_SESSION_STORE)) {

            resolve([]);

            return;

          }

          const tx = db.transaction([WORKOUT_SESSION_STORE], 'readonly');

          const store = tx.objectStore(WORKOUT_SESSION_STORE);

          const index = store.indexNames.contains('scopeKey') ? store.index('scopeKey') : null;

          if (!index) {

            const all = store.getAll();

            all.onsuccess = () => {

              const rows = (all.result || []).filter((r) => r.scopeKey === scopeKey);

              resolve(rows);

            };

            all.onerror = () => reject(all.error);

            return;

          }

          const req = index.getAll(scopeKey);

          req.onsuccess = () => resolve(req.result || []);

          req.onerror = () => reject(req.error);

        })

    );

  } catch {

    return [];

  }

}



/**

 * Migration legacy : extrait chaque jour de l’agrégat `workouts` vers `workoutSessions`.

 * @param {string} scopeKey

 * @param {Record<string, unknown>} aggregateRow

 */

export async function migrateLegacySessionsFromAggregate(scopeKey, aggregateRow) {

  const {

    extractDaySliceFromAggregate,

    listLegacySessionDatesInAggregate,

  } = await import('../../utils/workoutSessionPersistence.js');



  const dates = listLegacySessionDatesInAggregate(aggregateRow);

  if (dates.length === 0) return 0;



  let written = 0;

  for (const dateStr of dates) {

    const slice = extractDaySliceFromAggregate(aggregateRow, dateStr);

    const hasMaps = Object.keys(slice.mapFields || {}).length > 0;

    const hasVar = slice.dailyVariations != null;

    const hasCircuit = slice.circuitProgress != null;

    if (!hasMaps && !hasVar && !hasCircuit) continue;

    await putWorkoutSessionDay(scopeKey, dateStr, slice);

    written += 1;

  }

  return written;

}



/**

 * Allège la ligne `workouts` après migration (maps vides côté agrégat principal).

 * @param {string} scopeKey

 * @param {Record<string, unknown>} aggregateRow

 */

export async function stripLegacySessionsFromWorkoutRow(scopeKey, aggregateRow) {

  const { stripSessionMapsFromAggregate } = await import('../../utils/workoutSessionPersistence.js');

  const { putWorkoutRow } = await import('./workoutDbGateway.js');

  const flat = aggregateRow?.data && typeof aggregateRow.data === 'object' ? aggregateRow.data : aggregateRow;

  const stripped = stripSessionMapsFromAggregate({ ...flat, id: scopeKey });

  stripped.dailyVariations = {};

  if (stripped.circuitProgress && typeof stripped.circuitProgress === 'object') {

    const next = { ...stripped.circuitProgress };

    for (const k of Object.keys(next)) {

      if (/^\d{4}-\d{2}-\d{2}$/.test(k)) delete next[k];

    }

    stripped.circuitProgress = next;

  }

  await putWorkoutRow(scopeKey, stripped);

}



export { WORKOUT_STORE_NAME };


