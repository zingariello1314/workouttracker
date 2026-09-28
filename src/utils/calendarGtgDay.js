/**
 * GTG sur le calendrier : barre dédiée et séparation d’avec la liste d’exercices.
 */

import { hasMomentumWorkoutForDate } from './calendarDayMomentumStripes';
import { buildGtgDayPlan, getGtgExerciseLabel, normalizeGtgData } from '../services/endurance/gtgService';
import {
  resolveGtgWorkoutStorageKey,
  sumGtgRepsForExerciseOnDay
} from '../services/endurance/gtgWorkoutSync';

/** Orange dédié GTG, distinct du orange des autres activités physiques (#ff5c00). */
export const CALENDAR_GTG_STRIPE_COLOR = '#ff8c00';

function dayRecordHasDoneSlot(day) {
  if (!day || typeof day !== 'object') return false;
  const exercises = day.exercises;
  if (exercises && typeof exercises === 'object') {
    for (const ex of Object.values(exercises)) {
      const slots = ex?.slots;
      if (!slots || typeof slots !== 'object') continue;
      for (const slot of Object.values(slots)) {
        if (slot?.done) return true;
      }
    }
  }
  const legacy = day.slots;
  if (legacy && typeof legacy === 'object') {
    for (const slot of Object.values(legacy)) {
      if (!slot || typeof slot !== 'object') continue;
      for (const entry of Object.values(slot)) {
        if (entry?.done) return true;
      }
    }
  }
  return false;
}

/** Au moins une mini-série GTG cochée ce jour-là. */
export function gtgDayHasCompletedMiniSet(workoutData, dateStr) {
  if (!workoutData || !dateStr) return false;
  const day = workoutData?.enduranceData?.gtg?.days?.[dateStr];
  if (dayRecordHasDoneSlot(day)) return true;
  const ledger = workoutData?.enduranceData?.gtg?.workoutSync?.[dateStr];
  if (!ledger || typeof ledger !== 'object') return false;
  return Object.values(ledger).some((n) => (Number(n) || 0) > 0);
}

/**
 * Reps GTG par clé `reps` / `checkedExercises` du jour.
 * @returns {Map<string, number>}
 */
export function gtgRepsByStorageKey(workoutData, dateStr) {
  const map = new Map();
  if (!workoutData || !dateStr) return map;
  const gtg = normalizeGtgData(workoutData?.enduranceData?.gtg);
  const ledger = gtg.workoutSync?.[dateStr];
  if (ledger && typeof ledger === 'object') {
    for (const [exerciseId, reps] of Object.entries(ledger)) {
      const n = Number(reps) || 0;
      if (n <= 0) continue;
      const key = resolveGtgWorkoutStorageKey(dateStr, exerciseId, gtg.config);
      map.set(key, (map.get(key) || 0) + n);
    }
    if (map.size > 0) return map;
  }
  if (!gtgDayHasCompletedMiniSet(workoutData, dateStr)) return map;
  for (const id of gtg.config.selectedIds || []) {
    const reps = sumGtgRepsForExerciseOnDay(gtg, dateStr, id, { workoutData });
    if (reps <= 0) continue;
    const key = resolveGtgWorkoutStorageKey(dateStr, id, gtg.config);
    map.set(key, (map.get(key) || 0) + reps);
  }
  return map;
}

/** Séance du jour hors part GTG (la barre « exercices » ne doit pas doubler le GTG). */
export function hasNonGtgMomentumWorkoutForDate(workoutData, dateStr) {
  if (!hasMomentumWorkoutForDate(workoutData, dateStr)) return false;
  const gtgByKey = gtgRepsByStorageKey(workoutData, dateStr);
  if (gtgByKey.size === 0) return true;

  const checked = workoutData.checkedExercises || {};
  const reps = workoutData.reps || {};
  const seen = new Set();

  const countsAsWorkout = (key) => {
    if (!key.startsWith(`${dateStr}_`)) return false;
    if (key.includes('_complementary_')) return false;
    const total = parseInt(reps[key], 10) || 0;
    const gtg = gtgByKey.get(key) || 0;
    if (gtg <= 0) return true;
    return total - gtg > 0;
  };

  for (const [key, val] of Object.entries(checked)) {
    if (val !== true) continue;
    seen.add(key);
    if (countsAsWorkout(key)) return true;
  }
  for (const key of Object.keys(reps)) {
    if (seen.has(key)) continue;
    if (countsAsWorkout(key)) return true;
  }
  return false;
}

/** Retire les lignes dont les reps viennent uniquement du GTG ; garde le reste de la séance. */
export function omitGtgOnlyCalendarExercises(exercises, workoutData, dateStr) {
  if (!Array.isArray(exercises) || exercises.length === 0) return exercises || [];
  const portions = gtgRepsByStorageKey(workoutData, dateStr);
  if (portions.size === 0) return exercises;
  return exercises.flatMap((ex) => {
    const key = ex?._storageKey;
    const gtg = key ? portions.get(key) || 0 : 0;
    const total = parseInt(ex?.reps, 10) || 0;
    const rest = Math.max(0, total - gtg);
    if (gtg > 0 && rest <= 0) return [];
    if (rest === total) return [ex];
    return [{ ...ex, reps: rest }];
  });
}

export function buildGtgCalendarStripe(workoutData, dateStr) {
  if (!gtgDayHasCompletedMiniSet(workoutData, dateStr)) return null;
  return {
    kind: 'gtg',
    color: CALENDAR_GTG_STRIPE_COLOR,
    key: 'gtg'
  };
}

/** Plan du jour pour le module détail (null si aucune mini-série faite). */
export function buildCalendarGtgDayView(workoutData, dateStr, ctx = {}) {
  if (!gtgDayHasCompletedMiniSet(workoutData, dateStr)) return null;
  const gtg = normalizeGtgData(workoutData?.enduranceData?.gtg);
  const plan = buildGtgDayPlan(gtg, dateStr, { workoutData, ...ctx });
  if (!plan || (plan.doneMiniSets || 0) <= 0) return null;
  const labelFor = (id) => getGtgExerciseLabel(id, gtg.config, ctx);
  const exercisePlans = (plan.exercisePlans || [])
    .filter((ep) => (ep.completedCount || 0) > 0 || (ep.slots || []).some((s) => s.done))
    .map((ep) => {
      const plannedReps = (ep.slots || []).reduce((sum, s) => sum + (Number(s.reps) || 0), 0);
      const doneReps = (ep.slots || []).reduce(
        (sum, s) => (s.done ? sum + (Number(s.reps) || 0) : sum),
        0
      );
      return {
        exerciseId: ep.exerciseId,
        label: labelFor(ep.exerciseId),
        plannedReps,
        doneReps,
        completedCount: ep.completedCount,
        totalCount: ep.totalCount,
        slots: (ep.slots || []).map((s) => ({
          time: s.time,
          reps: s.reps,
          done: Boolean(s.done)
        }))
      };
    });
  const plannedReps = exercisePlans.reduce((sum, ep) => sum + ep.plannedReps, 0);
  return {
    doneMiniSets: plan.doneMiniSets,
    plannedMiniSets: plan.plannedMiniSets,
    doneReps: plan.doneReps,
    plannedReps,
    progressPct: plan.progressPct,
    exercisePlans
  };
}
