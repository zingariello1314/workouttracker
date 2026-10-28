/**
 * Instantané figé du plan d’exercices par jour calendaire.
 * Empêche le programme live de réécrire silencieusement les séances passées.
 *
 * @module calendarDayPlanSnapshot
 */

const DATE_KEY_RE = /^(\d{4}-\d{2}-\d{2})_(.+)$/;

/**
 * @param {unknown} workoutData
 * @param {string} dateStr
 * @returns {boolean}
 */
export function hasPerformanceKeysForDate(workoutData, dateStr) {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const prefix = `${dateStr}_`;
  const buckets = [
    workoutData?.checkedExercises,
    workoutData?.reps,
    workoutData?.exerciseWeights,
    workoutData?.exerciseSetWeights,
    workoutData?.exerciseSetLogs
  ];
  for (const bag of buckets) {
    if (!bag || typeof bag !== 'object') continue;
    for (const key of Object.keys(bag)) {
      if (!key.startsWith(prefix)) continue;
      const val = bag[key];
      if (val === undefined || val === null || val === false || val === '') continue;
      return true;
    }
  }
  return false;
}

/**
 * IDs de stockage (suffixe après date_) pour une date, sans inventer de coche.
 * @returns {string[]}
 */
export function collectStorageIdsForDate(workoutData, dateStr) {
  if (!dateStr) return [];
  const prefix = `${dateStr}_`;
  const ids = new Set();
  const bags = [workoutData?.checkedExercises, workoutData?.reps];
  for (const bag of bags) {
    if (!bag || typeof bag !== 'object') continue;
    for (const [key, val] of Object.entries(bag)) {
      if (!key.startsWith(prefix)) continue;
      if (val === undefined || val === null || val === false || val === '') continue;
      const rest = key.slice(prefix.length);
      if (!rest || rest.startsWith('complementary_')) continue;
      ids.add(rest.replace(/_(semaineA|semaineB)$/, ''));
    }
  }
  return [...ids];
}

/**
 * @param {object} opts
 * @param {string} opts.dateStr
 * @param {object[]} opts.exercises — liste live (id, name, originalId, …)
 * @param {string|null} [opts.programId]
 * @param {string|null} [opts.variant]
 * @param {string[]} [opts.combinedDays]
 */
export function buildDayPlanSnapshotFromExercises({
  dateStr,
  exercises = [],
  programId = null,
  variant = null,
  combinedDays = null
}) {
  const list = Array.isArray(exercises) ? exercises : [];
  return {
    dateStr,
    capturedAt: new Date().toISOString(),
    programId: programId || null,
    variant: variant || null,
    combinedDays: Array.isArray(combinedDays) ? combinedDays : null,
    exercises: list.map((ex, index) => normalizeSnapshotExercise(ex, index))
  };
}

function normalizeSnapshotExercise(ex, index = 0) {
  const storageId = String(ex?.storageId ?? ex?.id ?? `unknown_${index}`);
  return {
    storageId,
    originalId: ex?.originalId ?? ex?.id ?? storageId,
    name: String(ex?.name || '').trim() || `Exercice ${storageId}`,
    series: ex?.series ?? '',
    type: ex?.type || 'standard',
    materiel: ex?.materiel || 'poids du corps',
    notes: ex?.notes || '',
    rest: ex?.rest ?? 90,
    intensity: ex?.intensity || 'moderate',
    sourceDay: ex?.sourceDay || null,
    programName: ex?.programName || null,
    programId: ex?.programId || null
  };
}

/**
 * Reconstruit un snapshot à partir des clés de perf existantes uniquement.
 * Ne crée aucune coche.
 */
export function reconstructDayPlanSnapshotFromKeys(
  workoutData,
  dateStr,
  { getExerciseNameById = null } = {}
) {
  const ids = collectStorageIdsForDate(workoutData, dateStr);
  if (!ids.length) return null;

  const checked = workoutData?.checkedExercises || {};
  const reps = workoutData?.reps || {};

  const exercises = ids.map((storageId, index) => {
    const key = `${dateStr}_${storageId}`;
    const weekKeyA = `${dateStr}_${storageId}_semaineA`;
    const weekKeyB = `${dateStr}_${storageId}_semaineB`;
    const resolvedName =
      (typeof getExerciseNameById === 'function' &&
        (getExerciseNameById(storageId) ||
          getExerciseNameById(Number(storageId)) ||
          null)) ||
      null;
    return normalizeSnapshotExercise(
      {
        id: /^\d+$/.test(storageId) ? Number(storageId) : storageId,
        storageId,
        originalId: storageId,
        name: resolvedName || `Exercice inconnu (${storageId})`,
        series: '',
        programName: 'Séance enregistrée',
        programId: 'recorded',
        _hadCheck: !!(checked[key] || checked[weekKeyA] || checked[weekKeyB]),
        _hadReps: !!(reps[key] || reps[weekKeyA] || reps[weekKeyB])
      },
      index
    );
  });

  return {
    dateStr,
    capturedAt: new Date().toISOString(),
    programId: 'reconstructed',
    variant: null,
    combinedDays: null,
    reconstructed: true,
    exercises
  };
}

export function getDayPlanSnapshot(workoutData, dateStr) {
  const snap = workoutData?.calendarDayPlanSnapshots?.[dateStr];
  if (!snap || !Array.isArray(snap.exercises)) return null;
  return snap;
}

/**
 * Snapshot → liste affichable (mêmes champs que mapProgramExercisesToDisplay).
 */
export function snapshotExercisesToDisplayList(snapshot) {
  if (!snapshot?.exercises?.length) return [];
  return snapshot.exercises.map((ex) => ({
    id: /^\d+$/.test(String(ex.storageId)) ? Number(ex.storageId) : ex.storageId,
    name: ex.name,
    series: ex.series,
    type: ex.type || 'standard',
    materiel: ex.materiel || 'poids du corps',
    notes: ex.notes || '',
    rest: ex.rest ?? 90,
    intensity: ex.intensity || 'moderate',
    originalId: ex.originalId,
    sourceDay: ex.sourceDay || null,
    programName: ex.programName || snapshot.programId || 'Historique',
    programId: ex.programId || snapshot.programId || 'historical',
    _fromDayPlanSnapshot: true
  }));
}

/**
 * Résolution lecture :
 * 1. snapshot existant
 * 2. sinon perfs → reconstruct
 * 3. sinon live
 *
 * @returns {{ exercises: object[], source: 'snapshot'|'reconstruct'|'live', snapshot: object|null, shouldPersist: boolean }}
 */
export function resolveExercisesForCalendarDate({
  dateStr,
  workoutData = null,
  liveExercises = [],
  getExerciseNameById = null
}) {
  const existing = getDayPlanSnapshot(workoutData, dateStr);
  if (existing) {
    return {
      exercises: snapshotExercisesToDisplayList(existing),
      source: 'snapshot',
      snapshot: existing,
      shouldPersist: false
    };
  }

  if (hasPerformanceKeysForDate(workoutData, dateStr)) {
    const reconstructed = reconstructDayPlanSnapshotFromKeys(workoutData, dateStr, {
      getExerciseNameById
    });
    if (reconstructed) {
      return {
        exercises: snapshotExercisesToDisplayList(reconstructed),
        source: 'reconstruct',
        snapshot: reconstructed,
        shouldPersist: true
      };
    }
  }

  return {
    exercises: Array.isArray(liveExercises) ? liveExercises : [],
    source: 'live',
    snapshot: null,
    shouldPersist: false
  };
}

/**
 * Fusionne un snapshot dans workoutData (immutable).
 */
export function withDayPlanSnapshot(workoutData, dateStr, snapshot) {
  if (!dateStr || !snapshot) return workoutData || {};
  const prev = workoutData?.calendarDayPlanSnapshots;
  return {
    ...(workoutData || {}),
    calendarDayPlanSnapshots: {
      ...(prev && typeof prev === 'object' ? prev : {}),
      [dateStr]: snapshot
    }
  };
}

/**
 * Au premier enregistrement significatif du jour : fige le plan live si absent.
 * N’écrase jamais un snapshot existant.
 */
export function ensureDayPlanSnapshot(
  workoutData,
  dateStr,
  liveExercises,
  { programId = null, variant = null, combinedDays = null } = {}
) {
  if (!dateStr) return workoutData || {};
  if (getDayPlanSnapshot(workoutData, dateStr)) return workoutData || {};

  const snapshot = buildDayPlanSnapshotFromExercises({
    dateStr,
    exercises: liveExercises,
    programId,
    variant,
    combinedDays
  });
  return withDayPlanSnapshot(workoutData, dateStr, snapshot);
}

/**
 * Persiste un snapshot reconstruit s’il n’existe pas encore.
 */
export function ensureReconstructedDayPlanSnapshot(
  workoutData,
  dateStr,
  { getExerciseNameById = null } = {}
) {
  if (!dateStr) return workoutData || {};
  if (getDayPlanSnapshot(workoutData, dateStr)) return workoutData || {};
  if (!hasPerformanceKeysForDate(workoutData, dateStr)) return workoutData || {};
  const snap = reconstructDayPlanSnapshotFromKeys(workoutData, dateStr, {
    getExerciseNameById
  });
  if (!snap) return workoutData || {};
  return withDayPlanSnapshot(workoutData, dateStr, snap);
}

/** Parse une clé date_id → { dateStr, storageId } ou null. */
export function parseDateStorageKey(key) {
  const m = String(key || '').match(DATE_KEY_RE);
  if (!m) return null;
  return { dateStr: m[1], storageId: m[2].replace(/_(semaineA|semaineB)$/, '') };
}
