import { putMomentumApiV1WorkoutAggregate } from '../sync/fetchMomentumApiV1.js';

const DEBOUNCE_MS = 3500;
let timerId = null;

export function isWorkoutAggregateCloudSyncEnabled() {
  const v = String(import.meta.env?.VITE_WORKOUT_AGGREGATE_CLOUD_SYNC || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * LWW naïf : compare `lastSaved` (agrégat) puis `updatedAt` serveur.
 *
 * @param {Record<string, unknown> | null} localRaw — ligne brute repo (plate ou `{ data }`).
 * @param {import('../../../contracts/workoutAggregateSnapshot.v1.js').WorkoutAggregateSnapshotGetV1 | null} remoteGet
 * @param {string} storageKey
 * @returns {Record<string, unknown> | null} — ligne brute à persister en IndexedDB, ou null si inchangé / rien à faire.
 */
export function pickNewerWorkoutRawForLoad(localRaw, remoteGet, storageKey) {
  const sk = String(storageKey || '').trim();
  if (!sk || sk === 'anonymous') return localRaw ?? null;
  if (!remoteGet || typeof remoteGet !== 'object') return localRaw ?? null;
  const agg = remoteGet.aggregate;
  if (!agg || typeof agg !== 'object' || Object.keys(agg).length === 0) return localRaw ?? null;

  const cloud = { ...agg, id: sk };
  const cloudTs = String(cloud.lastSaved || remoteGet.updatedAt || '').trim();
  const localTs = String(
    (localRaw && (localRaw.lastSaved || localRaw.data?.lastSaved)) || ''
  ).trim();

  if (!localRaw) return cloud;
  if (cloudTs && localTs && cloudTs > localTs) return cloud;
  if (cloudTs && !localTs) return cloud;
  return localRaw;
}

/** Assure une ligne compatible `saveRawWorkoutRow` (clé `id`). */
export function normalizeWorkoutAggregateRawForIdb(raw, storageKey) {
  const sk = String(storageKey || '').trim();
  if (!raw || typeof raw !== 'object') return { id: sk };
  if (raw.data && typeof raw.data === 'object' && raw.data !== null && !raw.checkedExercises) {
    return {
      ...raw.data,
      id: sk,
      lastSaved: raw.lastSaved || raw.data.lastSaved,
      dataVersion: raw.dataVersion || raw.data.dataVersion || '1.0'
    };
  }
  return { ...raw, id: sk };
}

/**
 * @param {{ accessToken?: string | null, storageKey: string, row: Record<string, unknown> }} args
 */
export function scheduleWorkoutAggregateCloudPush(args) {
  if (!isWorkoutAggregateCloudSyncEnabled()) return;
  const sk = String(args?.storageKey || '').trim();
  if (!sk || sk === 'anonymous') return;
  const token = String(args?.accessToken || '').trim();
  if (!token) return;
  const row = args?.row && typeof args.row === 'object' ? args.row : null;
  if (!row) return;

  if (timerId != null) clearTimeout(timerId);
  timerId = setTimeout(() => {
    timerId = null;
    const clientMutationId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `wa-${Date.now()}`;
    const aggregate = { ...row };
    delete aggregate.id;
    putMomentumApiV1WorkoutAggregate(token, {
      clientMutationId,
      aggregate
    }).catch((err) => {
      console.warn('[workoutAggregateCloudSync] push échoué', err);
    });
  }, DEBOUNCE_MS);
}
