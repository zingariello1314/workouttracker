/**
 * Pont GTG + défis reps endurance → reps programme (migration, persistance).
 * @module services/endurance/workoutRepIntegrations
 */

import { normalizeGtgData } from './gtgService';
import { syncGtgDayToWorkoutData } from './gtgWorkoutSync';
import {
  collectEnduranceRepSessionDates,
  syncAllEnduranceRepsToWorkoutData,
  syncEnduranceRepsDayToWorkoutData
} from './enduranceRepsWorkoutSync';

export const WORKOUT_REP_INTEGRATION_VERSION = 2;

function collectGtgDates(gtgData) {
  const normalized = normalizeGtgData(gtgData);
  return Object.keys(normalized.days || {}).sort();
}

/**
 * Applique sync GTG + endurance reps sur toutes les dates connues (idempotent).
 * @param {object} workoutData
 * @param {object} [ctx] — profileQuestionnaire, t (GTG plans)
 */
export function applyWorkoutRepIntegrations(workoutData, ctx = {}) {
  if (!workoutData || typeof workoutData !== 'object') return workoutData;

  let next = { ...workoutData };
  const gtg = next.enduranceData?.gtg;
  const gtgDates = collectGtgDates(gtg);
  gtgDates.forEach((dateStr) => {
    next = syncGtgDayToWorkoutData(next, next.enduranceData?.gtg, dateStr, {
      ...ctx,
      workoutData: next
    });
  });

  const aggregate = ctx.workoutAggregate ?? next;
  const enduranceDates = collectEnduranceRepSessionDates(next.enduranceData, aggregate);
  enduranceDates.forEach((dateStr) => {
    next = syncEnduranceRepsDayToWorkoutData(next, next.enduranceData, dateStr, aggregate, ctx);
  });

  return {
    ...next,
    workoutRepIntegrationVersion: WORKOUT_REP_INTEGRATION_VERSION
  };
}

export function needsWorkoutRepIntegration(workoutData) {
  if (!workoutData || typeof workoutData !== 'object') return false;
  const v = Number(workoutData.workoutRepIntegrationVersion) || 0;
  if (v >= WORKOUT_REP_INTEGRATION_VERSION) return false;
  const hasGtg = normalizeGtgData(workoutData.enduranceData?.gtg).config?.selectedIds?.length > 0;
  const hasEnduranceReps = collectEnduranceRepSessionDates(workoutData.enduranceData, workoutData).length > 0;
  return hasGtg || hasEnduranceReps || v < WORKOUT_REP_INTEGRATION_VERSION;
}

export { syncAllEnduranceRepsToWorkoutData };
