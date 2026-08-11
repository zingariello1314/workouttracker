/**
 * Résolution ID numérique ↔ nom (programmes quiz / custom).
 */

const DAY_NAMES = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

export function convertToStableNumericId(id, index = 0) {
  if (typeof id === 'number') return id;
  if (typeof id === 'string') {
    let hash = 0;
    const str = id.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash &= hash;
    }
    return Math.abs(hash) + 10000;
  }
  return index + 10000;
}

export function makeUniqueNumericId(baseId, usedIds) {
  let candidate = baseId;
  let offset = 1;
  while (usedIds.has(candidate)) {
    candidate = baseId + offset;
    offset += 1;
  }
  usedIds.add(candidate);
  return candidate;
}

function visitExerciseList(list, usedIds, map) {
  if (!Array.isArray(list)) return;
  list.forEach((ex, index) => {
    if (!ex?.name) return;
    const baseId = convertToStableNumericId(ex.id, index);
    const numericId = makeUniqueNumericId(baseId, usedIds);
    map.set(numericId, ex.name);
    map.set(String(numericId), ex.name);
  });
}

/** @param {object|null|undefined} program */
export function indexProgramExerciseNames(program) {
  const map = new Map();
  if (!program?.schedule) return map;

  DAY_NAMES.forEach((dayName) => {
    const daySchedule = program.schedule[dayName];
    if (!daySchedule) return;
    const usedIds = new Set();
    visitExerciseList(daySchedule.exercises, usedIds, map);
    ['semaineA', 'semaineB'].forEach((vk) => {
      visitExerciseList(daySchedule.salleVariants?.[vk]?.exercises, usedIds, map);
    });
  });

  return map;
}

/** Fusionne tous les programmes (ordre : dernier programme gagne en cas de conflit). */
export function buildExerciseNameIndexFromPrograms(programs) {
  const merged = new Map();
  (Array.isArray(programs) ? programs : []).forEach((program) => {
    indexProgramExerciseNames(program).forEach((name, id) => {
      merged.set(id, name);
    });
  });
  return merged;
}

export function isFallbackExerciseLabel(name) {
  return /^Exercice \d+$/.test(String(name || '').trim());
}

export function resolveExerciseNameFromIndex(exerciseId, index) {
  if (!index?.size) return null;
  const searchId = typeof exerciseId === 'string' ? parseInt(exerciseId, 10) : exerciseId;
  if (!Number.isFinite(searchId)) return null;
  return index.get(searchId) || index.get(String(searchId)) || null;
}

/**
 * @param {string|number} exerciseId
 * @param {object|null|undefined} snapshot
 * @param {Map<string|number, string>} programIndex
 * @param {Function} getExerciseNameById
 */
export function resolveExerciseDisplayName(exerciseId, snapshot, programIndex, getExerciseNameById) {
  const snapName = snapshot?.exerciseDisplayNames?.[String(exerciseId)];
  if (snapName && !isFallbackExerciseLabel(snapName)) return snapName;

  const fromCtx =
    typeof getExerciseNameById === 'function' ? getExerciseNameById(exerciseId) : '';
  if (fromCtx && !isFallbackExerciseLabel(fromCtx)) return fromCtx;

  const fromPrograms = resolveExerciseNameFromIndex(exerciseId, programIndex);
  if (fromPrograms) return fromPrograms;

  return fromCtx || `Exercice ${exerciseId}`;
}

/** Remplit exerciseDisplayNames pour les IDs actifs sans libellé persisté. */
export function backfillExerciseDisplayNames(snapshot, programs, getExerciseNameById) {
  const programIndex = buildExerciseNameIndexFromPrograms(programs);
  const prev =
    snapshot?.exerciseDisplayNames && typeof snapshot.exerciseDisplayNames === 'object'
      ? { ...snapshot.exerciseDisplayNames }
      : {};
  let changed = false;

  const ids = new Set();
  Object.keys(snapshot?.checkedExercises || {}).forEach((key) => {
    if (snapshot.checkedExercises[key] !== true) return;
    const m = String(key).match(/^\d{4}-\d{2}-\d{2}_(.+)$/);
    if (!m) return;
    let id = m[1].replace(/_semaineA$|_semaineB$/, '');
    if (id.startsWith('complementary_')) return;
    ids.add(id);
  });

  ids.forEach((id) => {
    const existing = prev[String(id)];
    if (existing && !isFallbackExerciseLabel(existing)) return;
    const resolved = resolveExerciseDisplayName(id, snapshot, programIndex, getExerciseNameById);
    if (!resolved || isFallbackExerciseLabel(resolved)) return;
    if (prev[String(id)] !== resolved) {
      prev[String(id)] = resolved;
      changed = true;
    }
  });

  return changed ? prev : snapshot?.exerciseDisplayNames || prev;
}

export function mergeExerciseDisplayName(data, exerciseId, name) {
  if (!data || exerciseId == null || !name) return data;
  return {
    ...data,
    exerciseDisplayNames: {
      ...(data.exerciseDisplayNames || {}),
      [String(exerciseId)]: String(name)
    }
  };
}
