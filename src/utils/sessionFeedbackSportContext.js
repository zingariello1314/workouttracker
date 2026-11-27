/**
 * Contexte sportif pour le Feedback — faits mesurables uniquement.
 * Ne confond pas prévu / réalisé, ni durée estimée / mesurée.
 */

import { aggregateCheckedRepsByDateAndExerciseId } from './trainingLoadUtils.js';
import { extractExerciseIdFromWorkoutKey } from './exerciseKeyGenerator.js';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function resolveExerciseName(exerciseId, workoutExercises) {
  const id = String(exerciseId || '');
  if (!id) return 'Exercice';
  if (Array.isArray(workoutExercises)) {
    const hit = workoutExercises.find(
      (ex) => String(ex?.id) === id || String(ex?.storageId) === id || String(ex?.originalId) === id
    );
    if (hit?.name) return hit.name;
  }
  if (id.startsWith('complementary_')) {
    return id.replace(/^complementary_/, '').replace(/_/g, ' ');
  }
  return id;
}

/**
 * Construit le contexte sportif à partir du snapshot persisté.
 *
 * @param {object} args
 * @param {object|null} args.snapshot — workoutData (reps, checkedExercises, …)
 * @param {string} args.dateStr — YYYY-MM-DD
 * @param {object|null} [args.workout] — séance du jour (name, focus, exercices)
 * @param {array|null} [args.programExercises] — exercices prévus (après overrides)
 * @returns {object}
 */
export function buildSessionFeedbackSportContext({
  snapshot = null,
  dateStr = null,
  workout = null,
  programExercises = null
} = {}) {
  const empty = {
    dateStr: dateStr || null,
    sessionTitle: null,
    focusLabel: null,
    planKnown: false,
    plannedExerciseCount: null,
    plannedExerciseIds: [],
    recordedExercises: [],
    recordedExerciseCount: null,
    totalReps: null,
    missingPlannedIds: [],
    isPartialVsPlan: false,
    coverage: 'unknown',
    measuredDurationMinutes: null,
    estimatedDurationMinutes: null,
    durationKind: 'unknown',
    reliability: {
      plan: 'unknown',
      volume: 'unknown',
      duration: 'unknown'
    },
    hasRecordedWork: false
  };

  if (!dateStr || typeof dateStr !== 'string') return empty;

  const sessionTitle =
    typeof workout?.name === 'string' && workout.name.trim() ? workout.name.trim() : null;
  const focusLabel =
    typeof workout?.focus === 'string' && workout.focus.trim()
      ? workout.focus.trim()
      : Array.isArray(workout?.focus) && workout.focus.length
        ? workout.focus.filter(Boolean).join(' · ')
        : null;

  const plannedList = Array.isArray(programExercises)
    ? programExercises
    : Array.isArray(workout?.exercices)
      ? workout.exercices
      : [];
  const planKnown = plannedList.length > 0;
  const plannedExerciseIds = planKnown
    ? plannedList
        .map((ex) => String(ex?.id ?? ex?.storageId ?? ex?.originalId ?? ''))
        .filter(Boolean)
    : [];

  const aggregated = aggregateCheckedRepsByDateAndExerciseId(
    snapshot?.reps,
    snapshot?.checkedExercises
  );

  const recordedById = new Map();
  for (const [gkey, row] of aggregated.entries()) {
    if (!gkey.startsWith(`${dateStr}::`)) continue;
    const exerciseId = gkey.slice(dateStr.length + 2);
    if (!exerciseId) continue;
    const reps = Number(row?.reps) || 0;
    if (reps <= 0) continue;
    recordedById.set(exerciseId, {
      id: exerciseId,
      name: resolveExerciseName(exerciseId, plannedList),
      reps,
      storageKey: row?.key || `${dateStr}_${exerciseId}`,
      completed: true,
      source: 'checked'
    });
  }

  // Exceptionnels (dailyVariations) — souvent absents des maps reps programme
  const additional = snapshot?.dailyVariations?.[dateStr]?.additionalExercises;
  if (Array.isArray(additional)) {
    additional.forEach((ex, index) => {
      if (!ex || ex.completed !== true) return;
      if (ex.type === 'reps' || ex.type == null) {
        const reps = Math.max(
          0,
          Math.floor(
            Number(
              ex.totalReps ??
                (Array.isArray(ex.actualReps)
                  ? ex.actualReps.reduce((a, b) => a + (Number(b) || 0), 0)
                  : 0)
            ) || 0
          )
        );
        if (reps <= 0) return;
        const id = String(ex.id || ex.storageId || `exceptional_${index}`);
        if (recordedById.has(id)) {
          const prev = recordedById.get(id);
          recordedById.set(id, { ...prev, reps: Math.max(prev.reps, reps) });
        } else {
          recordedById.set(id, {
            id,
            name: ex.name || id,
            reps,
            storageKey: null,
            completed: true,
            source: 'exceptional'
          });
        }
      } else if (ex.type === 'time' || ex.type === 'duration') {
        const id = String(ex.id || ex.storageId || `exceptional_time_${index}`);
        if (!recordedById.has(id)) {
          recordedById.set(id, {
            id,
            name: ex.name || id,
            reps: 0,
            storageKey: null,
            completed: true,
            source: 'exceptional_time',
            durationOnly: true
          });
        }
      }
    });
  }

  const recordedExercises = [...recordedById.values()].sort((a, b) =>
    String(a.name).localeCompare(String(b.name), 'fr')
  );

  const volumeExercises = recordedExercises.filter((ex) => !ex.durationOnly && ex.reps > 0);
  const totalReps =
    volumeExercises.length > 0
      ? volumeExercises.reduce((sum, ex) => sum + (Number(ex.reps) || 0), 0)
      : null;
  const recordedExerciseCount =
    recordedExercises.length > 0 ? recordedExercises.length : null;

  const recordedIds = new Set(recordedExercises.map((ex) => String(ex.id)));
  const missingPlannedIds = planKnown
    ? plannedExerciseIds.filter((id) => !recordedIds.has(String(id)))
    : [];

  const isPartialVsPlan =
    planKnown &&
    recordedExerciseCount != null &&
    recordedExerciseCount > 0 &&
    missingPlannedIds.length > 0;

  let coverage = 'unknown';
  if (recordedExerciseCount == null || recordedExerciseCount === 0) {
    coverage = planKnown ? 'empty_recorded' : 'unknown';
  } else if (planKnown && missingPlannedIds.length === 0) {
    coverage = 'full_vs_plan';
  } else if (isPartialVsPlan) {
    coverage = 'partial_vs_plan';
  } else {
    coverage = 'recorded_only';
  }

  // Durée : ne jamais inventer. Si un champ mesuré existe plus tard, l’utiliser.
  const measuredRaw = snapshot?.sessionDurations?.[dateStr];
  let measuredDurationMinutes = null;
  if (typeof measuredRaw === 'number' && Number.isFinite(measuredRaw) && measuredRaw > 0) {
    measuredDurationMinutes = Math.round(measuredRaw);
  } else if (
    isPlainObject(measuredRaw) &&
    typeof measuredRaw.minutes === 'number' &&
    measuredRaw.minutes > 0
  ) {
    measuredDurationMinutes = Math.round(measuredRaw.minutes);
  }

  return {
    dateStr,
    sessionTitle,
    focusLabel,
    planKnown,
    plannedExerciseCount: planKnown ? plannedExerciseIds.length : null,
    plannedExerciseIds,
    recordedExercises,
    recordedExerciseCount,
    totalReps,
    missingPlannedIds,
    isPartialVsPlan,
    coverage,
    measuredDurationMinutes,
    estimatedDurationMinutes: null,
    durationKind: measuredDurationMinutes != null ? 'measured' : 'unknown',
    reliability: {
      plan: planKnown ? 'known' : 'unknown',
      volume: totalReps != null ? 'measured' : 'unknown',
      duration: measuredDurationMinutes != null ? 'measured' : 'unknown'
    },
    hasRecordedWork: Boolean(recordedExerciseCount && recordedExerciseCount > 0)
  };
}

/**
 * Payload SessionFeedback dérivé du contexte (pas de zéros inventés).
 */
export function sportContextToSessionDataPayload(sportContext, extras = {}) {
  const ctx = isPlainObject(sportContext) ? sportContext : {};
  const exercises = Array.isArray(ctx.recordedExercises)
    ? ctx.recordedExercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        reps: ex.reps,
        completed: ex.completed === true,
        ...(ex.storageKey ? { storageKey: ex.storageKey } : {})
      }))
    : [];

  return {
    date: ctx.dateStr || extras.date || null,
    sessionTitle: ctx.sessionTitle || null,
    focusLabel: ctx.focusLabel || null,
    exercises,
    // null si inconnu — jamais 0 par défaut d’échec de matching
    totalReps: ctx.totalReps,
    totalExercises: ctx.recordedExerciseCount,
    duration: ctx.measuredDurationMinutes,
    durationKind: ctx.durationKind || 'unknown',
    sportContext: ctx,
    plannedExerciseCount: ctx.plannedExerciseCount,
    isPartialVsPlan: ctx.isPartialVsPlan === true,
    ...extras
  };
}
