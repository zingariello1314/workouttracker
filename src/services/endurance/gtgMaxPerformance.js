/**
 * Max GTG déclaré → Performances (sans compter comme reps du jour).
 * @module services/endurance/gtgMaxPerformance
 */

import {
  applyPerformanceEntryToData,
  rebuildMaxRecordsFromHistory
} from '../../utils/exercisePerformanceUtils';
import { getGtgExerciseLabel, todayYmd } from './gtgService';
import { resolveGtgCanonicalExerciseId } from './gtgWorkoutSync';

/**
 * @param {object} data workout snapshot
 * @param {{ gtgExerciseId: string, reps: number, config?: object, dateStr?: string, ctx?: object }} opts
 */
export function applyGtgDeclaredMaxToData(data = {}, opts = {}) {
  const reps = Math.round(Number(opts.reps));
  if (!Number.isFinite(reps) || reps <= 0 || !opts.gtgExerciseId) return data;

  const dateStr = String(opts.dateStr || todayYmd()).slice(0, 10);
  const config = opts.config || data?.enduranceData?.gtg?.config || {};
  const exerciseId = resolveGtgCanonicalExerciseId(opts.gtgExerciseId, config);
  const exerciseName = getGtgExerciseLabel(opts.gtgExerciseId, config, opts.ctx || {});

  const history = Array.isArray(data.exerciseMaxHistory) ? data.exerciseMaxHistory : [];
  const sameDay = history.find(
    (e) =>
      e?.source === 'gtg' &&
      String(e.exerciseId) === String(exerciseId) &&
      String(e.recordDate || e.recordedAt || '').slice(0, 10) === dateStr
  );
  if (sameDay && Number(sameDay.reps) === reps) return data;

  const withoutSameDay = history.filter(
    (e) =>
      !(
        e?.source === 'gtg' &&
        String(e.exerciseId) === String(exerciseId) &&
        String(e.recordDate || e.recordedAt || '').slice(0, 10) === dateStr
      )
  );

  const base = {
    ...data,
    exerciseMaxHistory: withoutSameDay,
    exerciseMaxRecords: rebuildMaxRecordsFromHistory(withoutSameDay)
  };

  return applyPerformanceEntryToData(
    base,
    {
      id: sameDay?.id || `gtg_max_${exerciseId}_${dateStr}`,
      exerciseId,
      exerciseName,
      performanceType: 'reps',
      reps,
      recordDate: dateStr,
      source: 'gtg',
      notes: 'Max déclaré GTG (niveau), pas une série du jour'
    },
    { dateStr, addToTodayReps: false }
  );
}
