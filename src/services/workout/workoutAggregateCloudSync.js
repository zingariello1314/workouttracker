import { putMomentumApiV1WorkoutAggregate } from '../sync/fetchMomentumApiV1.js';

const DEBOUNCE_MS = 3500;
let timerId = null;

export function isWorkoutAggregateCloudSyncEnabled() {
  const v = String(import.meta.env?.VITE_WORKOUT_AGGREGATE_CLOUD_SYNC || '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/** Ligne repo plate pour fusion (même logique que `normalizeWorkoutAggregateRawForIdb` sans forcer `id`). */
function flatWorkoutPayload(row) {
  if (!row || typeof row !== 'object') return {};
  if (row.data && typeof row.data === 'object' && row.data !== null && !row.checkedExercises) {
    return {
      ...row.data,
      lastSaved: row.lastSaved || row.data.lastSaved,
      dataVersion: row.dataVersion || row.data.dataVersion || '1.0'
    };
  }
  return { ...row };
}

function mergeShallowRecordMaps(localVal, cloudVal) {
  const L = localVal && typeof localVal === 'object' && !Array.isArray(localVal) ? localVal : {};
  const C = cloudVal && typeof cloudVal === 'object' && !Array.isArray(cloudVal) ? cloudVal : {};
  return { ...L, ...C };
}

/** `exerciseSetWeights[exId][setKey]` : fusion par exercice, valeurs cloud prioritaires sur conflit. */
function mergeDailyVariations(localVal, cloudVal) {
  const L = localVal && typeof localVal === 'object' && !Array.isArray(localVal) ? localVal : {};
  const C = cloudVal && typeof cloudVal === 'object' && !Array.isArray(cloudVal) ? cloudVal : {};
  const out = { ...L };
  for (const [dateKey, cloudDay] of Object.entries(C)) {
    if (out[dateKey] && typeof out[dateKey] === 'object' && cloudDay && typeof cloudDay === 'object') {
      out[dateKey] = { ...out[dateKey], ...cloudDay };
    } else {
      out[dateKey] = cloudDay;
    }
  }
  return out;
}

function mergeManualDailyWalkByDate(localVal, cloudVal) {
  const L = localVal && typeof localVal === 'object' && !Array.isArray(localVal) ? localVal : {};
  const C = cloudVal && typeof cloudVal === 'object' && !Array.isArray(cloudVal) ? cloudVal : {};
  const out = { ...L };
  for (const [dateKey, cloudEntry] of Object.entries(C)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue;
    const localEntry = out[dateKey];
    const localAt = localEntry?.updatedAt ? Date.parse(localEntry.updatedAt) : 0;
    const cloudAt = cloudEntry?.updatedAt ? Date.parse(cloudEntry.updatedAt) : 0;
    if (!localEntry || cloudAt >= localAt) {
      out[dateKey] = cloudEntry;
    }
  }
  return out;
}

function mergeGarminActivityDateOverrides(localVal, cloudVal) {
  const L = localVal && typeof localVal === 'object' && !Array.isArray(localVal) ? localVal : {};
  const C = cloudVal && typeof cloudVal === 'object' && !Array.isArray(cloudVal) ? cloudVal : {};
  const out = { ...L };
  for (const [gid, cloudEntry] of Object.entries(C)) {
    const localEntry = out[gid];
    const localAt = localEntry?.updatedAt ? Date.parse(localEntry.updatedAt) : 0;
    const cloudAt = cloudEntry?.updatedAt ? Date.parse(cloudEntry.updatedAt) : 0;
    if (!localEntry || cloudAt >= localAt) {
      out[gid] = cloudEntry;
    }
  }
  return out;
}

function mergeEnduranceData(localVal, cloudVal) {
  const L = localVal && typeof localVal === 'object' ? localVal : {};
  const C = cloudVal && typeof cloudVal === 'object' ? cloudVal : {};
  const mergeSessions = (lArr, cArr) => {
    const la = Array.isArray(lArr) ? lArr : [];
    const ca = Array.isArray(cArr) ? cArr : [];
    const byId = new Map();
    for (const s of la) {
      const id = s?.id || s?.date || JSON.stringify(s);
      byId.set(String(id), s);
    }
    for (const s of ca) {
      const id = s?.id || s?.date || JSON.stringify(s);
      byId.set(String(id), s);
    }
    return [...byId.values()];
  };
  const lSessions = L.sessions && typeof L.sessions === 'object' ? L.sessions : {};
  const cSessions = C.sessions && typeof C.sessions === 'object' ? C.sessions : {};
  const sessionKeys = new Set([...Object.keys(lSessions), ...Object.keys(cSessions)]);
  const sessions = {};
  for (const k of sessionKeys) {
    sessions[k] = mergeSessions(lSessions[k], cSessions[k]);
  }
  return {
    ...L,
    ...C,
    sessions,
    manualDailyWalkByDate: mergeManualDailyWalkByDate(L.manualDailyWalkByDate, C.manualDailyWalkByDate),
    challenges: Array.isArray(C.challenges) && C.challenges.length > 0
      ? C.challenges
      : Array.isArray(L.challenges)
        ? L.challenges
        : [],
  };
}

function mergeExerciseSetWeights(localVal, cloudVal) {
  const L = localVal && typeof localVal === 'object' && !Array.isArray(localVal) ? localVal : {};
  const C = cloudVal && typeof cloudVal === 'object' && !Array.isArray(cloudVal) ? cloudVal : {};
  const keys = new Set([...Object.keys(L), ...Object.keys(C)]);
  const out = {};
  for (const k of keys) {
    const lv = L[k];
    const cv = C[k];
    if (
      lv &&
      typeof lv === 'object' &&
      !Array.isArray(lv) &&
      cv &&
      typeof cv === 'object' &&
      !Array.isArray(cv)
    ) {
      out[k] = { ...lv, ...cv };
    } else if (cv !== undefined) {
      out[k] = cv;
    } else {
      out[k] = lv;
    }
  }
  return out;
}

/** `exerciseSetLogs[key]` : entrée la plus récente (`loggedAt`) l’emporte. */
function mergeExerciseSetLogs(localVal, cloudVal) {
  const L = localVal && typeof localVal === 'object' && !Array.isArray(localVal) ? localVal : {};
  const C = cloudVal && typeof cloudVal === 'object' && !Array.isArray(cloudVal) ? cloudVal : {};
  const out = { ...L };
  for (const [key, cloudEntry] of Object.entries(C)) {
    const localEntry = out[key];
    const localAt = localEntry?.loggedAt ? Date.parse(localEntry.loggedAt) : 0;
    const cloudAt = cloudEntry?.loggedAt ? Date.parse(cloudEntry.loggedAt) : 0;
    if (!localEntry || cloudAt >= localAt) {
      out[key] = cloudEntry;
    }
  }
  return out;
}

/**
 * Quand le cloud « gagne » sur `lastSaved`, fusionner les maps de séance pour ne pas perdre
 * des clés présentes uniquement en IndexedDB (reps / coches / poids du jour).
 * Les clés communes restent celles du cloud (plus récentes).
 */
export function mergeCloudWinningRowOverLocal(localRaw, cloudAgg, storageKey) {
  const sk = String(storageKey || '').trim();
  const L = flatWorkoutPayload(localRaw);
  const C = { ...(cloudAgg && typeof cloudAgg === 'object' ? cloudAgg : {}), id: sk };
  return {
    ...L,
    ...C,
    id: sk,
    reps: mergeShallowRecordMaps(L.reps, C.reps),
    checkedExercises: mergeShallowRecordMaps(L.checkedExercises, C.checkedExercises),
    checkedStretches: mergeShallowRecordMaps(L.checkedStretches, C.checkedStretches),
    exerciseWeights: mergeShallowRecordMaps(L.exerciseWeights, C.exerciseWeights),
    exerciseWeightPerArm: mergeShallowRecordMaps(L.exerciseWeightPerArm, C.exerciseWeightPerArm),
    exerciseSetWeights: mergeExerciseSetWeights(L.exerciseSetWeights, C.exerciseSetWeights),
    exerciseSetLogs: mergeExerciseSetLogs(L.exerciseSetLogs, C.exerciseSetLogs),
    exerciseSessionEffortStars: mergeShallowRecordMaps(
      L.exerciseSessionEffortStars,
      C.exerciseSessionEffortStars
    ),
    exerciseSessionPleasureStars: mergeShallowRecordMaps(
      L.exerciseSessionPleasureStars,
      C.exerciseSessionPleasureStars
    ),
    stretchSessionEffortStars: mergeShallowRecordMaps(
      L.stretchSessionEffortStars,
      C.stretchSessionEffortStars
    ),
    exerciseSessionPerceived: mergeShallowRecordMaps(
      L.exerciseSessionPerceived,
      C.exerciseSessionPerceived
    ),
    dailyVariations: mergeDailyVariations(L.dailyVariations, C.dailyVariations),
    dayJustifications: mergeShallowRecordMaps(L.dayJustifications, C.dayJustifications),
    enduranceData: mergeEnduranceData(L.enduranceData, C.enduranceData),
    garminActivityDateOverrides: mergeGarminActivityDateOverrides(
      L.garminActivityDateOverrides,
      C.garminActivityDateOverrides
    ),
    restDaySwaps: mergeShallowRecordMaps(L.restDaySwaps, C.restDaySwaps),
    circuitProgress: mergeShallowRecordMaps(L.circuitProgress, C.circuitProgress),
    lastSaved: C.lastSaved || L.lastSaved,
    dataVersion: C.dataVersion || L.dataVersion || '1.0'
  };
}

function buildClientMutationId() {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `wa-${Date.now()}`;
}

function pushWorkoutAggregateToServer(token, row) {
  const aggregate = { ...row };
  delete aggregate.id;
  return putMomentumApiV1WorkoutAggregate(token, {
    clientMutationId: buildClientMutationId(),
    aggregate
  });
}

/**
 * LWW : compare uniquement `lastSaved` **embarqué dans l’agrégat** (client ↔ dernier PUT).
 *
 * Ne pas utiliser `remoteGet.updatedAt` (horodatage ligne SQL) comme fallback : un agrégat
 * ancien ou partiel sans `lastSaved` pouvait quand même « gagner » sur un IndexedDB riche
 * après rafraîchissement (reps / coches effacées).
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
  const cloudSaved = String(cloud.lastSaved || '').trim();
  const localSaved = String(
    (localRaw && (localRaw.lastSaved || localRaw.data?.lastSaved)) || ''
  ).trim();

  if (!localRaw) return cloud;

  // Snapshot cloud sans horodatage client : ne pas écraser un local déjà peuplé.
  if (!cloudSaved) {
    return localRaw;
  }

  if (!localSaved && cloudSaved) {
    return mergeCloudWinningRowOverLocal(localRaw, cloud, sk);
  }
  if (cloudSaved > localSaved) {
    return mergeCloudWinningRowOverLocal(localRaw, cloud, sk);
  }
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
    pushWorkoutAggregateToServer(token, row).catch((err) => {
      console.warn('[workoutAggregateCloudSync] push échoué', err);
    });
  }, DEBOUNCE_MS);
}

/**
 * Annule le push différé et envoie tout de suite (ex. après sauvegarde IndexedDB, avant F5).
 */
export async function flushWorkoutAggregateCloudPushNow(args) {
  if (!isWorkoutAggregateCloudSyncEnabled()) return;
  const sk = String(args?.storageKey || '').trim();
  if (!sk || sk === 'anonymous') return;
  const token = String(args?.accessToken || '').trim();
  if (!token) return;
  const row = args?.row && typeof args.row === 'object' ? args.row : null;
  if (!row) return;
  if (timerId != null) {
    clearTimeout(timerId);
    timerId = null;
  }
  try {
    await pushWorkoutAggregateToServer(token, row);
  } catch (err) {
    console.warn('[workoutAggregateCloudSync] push immédiat échoué', err);
  }
}
