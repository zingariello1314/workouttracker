/**
 * Synchronise les reps GTG cochées vers `reps` / `checkedExercises` (Aujourd’hui, Récap 3D, XP reps).
 * @module services/endurance/gtgWorkoutSync
 */

import { findBankExerciseById, makeGtgDbExerciseId } from './gtgExerciseBank';
import { buildGtgDayPlan, normalizeGtgData } from './gtgService';

/** Exercices intégrés GTG → id programme pour le stockage reps journalier. */
const BUILTIN_WORKOUT_EXERCISE_ID = {
  pullups: 101,
  dips: 103,
  pushups: 104
};

export function resolveGtgWorkoutStorageKey(dateStr, gtgExerciseId, config = {}) {
  const d = String(dateStr || '').slice(0, 10);
  if (String(gtgExerciseId).startsWith('db_')) {
    return `${d}_${gtgExerciseId}`;
  }
  const programId = BUILTIN_WORKOUT_EXERCISE_ID[gtgExerciseId];
  if (programId != null) return `${d}_${programId}`;
  const custom = config.customCatalog?.[gtgExerciseId];
  if (custom?.bankKey) {
    return `${d}_${makeGtgDbExerciseId(custom.bankKey)}`;
  }
  const bank = findBankExerciseById(gtgExerciseId);
  if (bank?.id) return `${d}_${bank.id}`;
  return `${d}_gtg_${gtgExerciseId}`;
}

export function sumGtgRepsForExerciseOnDay(gtgData, dateStr, exerciseId, ctx = {}) {
  const plan = buildGtgDayPlan(gtgData, dateStr, ctx);
  const ep = (plan.exercisePlans || []).find((e) => e.exerciseId === exerciseId);
  if (!ep) return 0;
  return ep.slots.reduce((sum, s) => (s.done ? sum + s.reps : sum), 0);
}

/**
 * Met à jour reps/checkedExercises en remplaçant uniquement la part GTG (préserve le reste du jour).
 */
export function syncGtgDayToWorkoutData(workoutData, gtgData, dateStr, ctx = {}) {
  const normalized = normalizeGtgData(gtgData);
  const syncLedger =
    normalized.workoutSync && typeof normalized.workoutSync === 'object'
      ? { ...normalized.workoutSync }
      : {};
  const dayLedger =
    syncLedger[dateStr] && typeof syncLedger[dateStr] === 'object' ? { ...syncLedger[dateStr] } : {};

  const nextReps = { ...(workoutData?.reps || {}) };
  const nextChecked = { ...(workoutData?.checkedExercises || {}) };

  normalized.config.selectedIds.forEach((exerciseId) => {
    const key = resolveGtgWorkoutStorageKey(dateStr, exerciseId, normalized.config);
    const gtgReps = sumGtgRepsForExerciseOnDay(normalized, dateStr, exerciseId, ctx);
    const prevGtgReps = Number(dayLedger[exerciseId]) || 0;
    const currentTotal = Math.max(0, parseInt(nextReps[key], 10) || 0);
    const baseWithoutGtg = Math.max(0, currentTotal - prevGtgReps);
    const newTotal = baseWithoutGtg + gtgReps;

    if (newTotal > 0) {
      nextReps[key] = String(newTotal);
      nextChecked[key] = true;
    } else if (baseWithoutGtg > 0) {
      nextReps[key] = String(baseWithoutGtg);
      nextChecked[key] = true;
    } else {
      delete nextReps[key];
      nextChecked[key] = false;
    }
    dayLedger[exerciseId] = gtgReps;
  });

  syncLedger[dateStr] = dayLedger;

  const nextGtg = { ...normalized, workoutSync: syncLedger };
  const nextEndurance = {
    ...(workoutData?.enduranceData || {}),
    gtg: nextGtg,
    lastUpdated: new Date().toISOString()
  };

  return {
    ...workoutData,
    reps: nextReps,
    checkedExercises: nextChecked,
    enduranceData: nextEndurance
  };
}
