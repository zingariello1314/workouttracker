/**
 * Complétion GTG pour la couleur et la note du calendrier.
 * L'unité est le créneau (le déplacement), pas le total de reps.
 * Un créneau sur mesure compte autant qu'un créneau prévu s'il est fait
 * et que les reps atteignent le quota du planning.
 */

import { hasMeaningfulGtgData } from '../services/endurance/gtgDataMerge';
import { buildGtgDayPlan } from '../services/endurance/gtgService';

function passageCredit(slot) {
  const total = slot?.totalCount || (slot?.items || []).length || 0;
  if (total <= 0) return 0;
  const done =
    slot.completedCount != null
      ? slot.completedCount
      : (slot.items || []).filter((item) => item.done).length;
  return Math.min(1, Math.max(0, done) / total);
}

/**
 * @param {object|null} plan résultat de buildGtgDayPlan
 * @returns {{ completion01: number, seriesRatio: number, repsRatio: number, plannedPassages: number, donePassages: number, plannedReps: number, doneReps: number }}
 */
export function computeGtgQuotaCompletion(plan) {
  const empty = {
    completion01: 0,
    seriesRatio: 0,
    repsRatio: 0,
    plannedPassages: 0,
    donePassages: 0,
    plannedReps: 0,
    doneReps: 0
  };
  const slots = Array.isArray(plan?.slots) ? plan.slots : [];
  const planned = slots.filter((slot) => !slot.adHoc);
  const plannedPassages = planned.length;
  if (plannedPassages <= 0) return empty;

  const donePassages =
    planned.reduce((sum, slot) => sum + passageCredit(slot), 0) +
    slots.filter((slot) => slot.adHoc).reduce((sum, slot) => sum + passageCredit(slot), 0);
  const seriesRatio = Math.min(1, donePassages / plannedPassages);

  let plannedReps = 0;
  planned.forEach((slot) => {
    (slot.items || []).forEach((item) => {
      plannedReps += Number(item.reps) || 0;
    });
  });
  const doneReps = Math.max(0, Number(plan.doneReps) || 0);
  const repsRatio = plannedReps > 0 ? Math.min(1, doneReps / plannedReps) : seriesRatio;

  let completion01 = seriesRatio * 0.72 + repsRatio * 0.28;
  if (seriesRatio >= 0.999 && repsRatio >= 0.999) completion01 = 1;
  completion01 = Math.max(0, Math.min(1, completion01));

  return {
    completion01,
    seriesRatio,
    repsRatio,
    plannedPassages,
    donePassages,
    plannedReps,
    doneReps
  };
}

/** Null si le GTG n'est pas configuré ou s'il n'y a aucun créneau prévu ce jour. */
export function gtgCompletionForCalendarDay(workoutData, dateStr) {
  const raw = workoutData?.enduranceData?.gtg;
  if (!dateStr || !raw || !hasMeaningfulGtgData(raw)) return null;
  const plan = buildGtgDayPlan(raw, dateStr, { workoutData });
  const quota = computeGtgQuotaCompletion(plan);
  if (quota.plannedPassages <= 0 || quota.completion01 <= 0) return null;
  return quota;
}
