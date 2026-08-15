/**
 * Sessions Endurance (défis pompes, etc.) → métriques grades exercices.
 */

import { normalizeDateString, isMockEnduranceSession } from '../../utils/calendarUtils';
import { resolvePushupSessionTotalReps } from '../endurance/pushupSessionUtils';

/** @type {Record<string, { sessionsKey: string, reps: (s: object) => number }>} */
export const ENDURANCE_BENCHMARK_BRIDGE = {
  pushups: {
    sessionsKey: 'pushups',
    reps: (s) => resolvePushupSessionTotalReps(s)
  }
};

export function forEachEnduranceBenchmarkSession(snapshot, benchmarkKey, fn) {
  const bridge = ENDURANCE_BENCHMARK_BRIDGE[benchmarkKey];
  if (!bridge) return;
  const list = snapshot?.enduranceData?.sessions?.[bridge.sessionsKey];
  if (!Array.isArray(list)) return;
  list.forEach((session) => {
    if (isMockEnduranceSession(session)) return;
    const dateStr = normalizeDateString(session?.date);
    if (!dateStr) return;
    const reps = bridge.reps(session);
    fn({ dateStr, reps, session });
  });
}

/**
 * Ajoute coches + reps des défis endurance aux agrégats benchmark.
 * @param {Map<string, object>} byBenchmarkKey
 */
export function mergeEnduranceIntoBenchmarkMetrics(byBenchmarkKey, snapshot) {
  Object.keys(ENDURANCE_BENCHMARK_BRIDGE).forEach((benchmarkKey) => {
    const dailyReps = new Map();
    let sessionChecks = 0;
    let totalReps = 0;

    forEachEnduranceBenchmarkSession(snapshot, benchmarkKey, ({ dateStr, reps }) => {
      sessionChecks += 1;
      totalReps += reps;
      dailyReps.set(dateStr, (dailyReps.get(dateStr) || 0) + reps);
    });

    if (sessionChecks <= 0) return;

    const prev = byBenchmarkKey.get(benchmarkKey) || {
      key: benchmarkKey,
      maxSetReps: 0,
      maxDailyTotalReps: 0,
      maxHoldSeconds: 0,
      maxWeightKg: 0,
      totalReps: 0,
      totalVolumeKg: 0,
      lifetimeHoldSeconds: 0,
      sessionCount: 0,
      checkCount: 0,
      enduranceSessionCount: 0,
      bestExerciseName: null
    };

    prev.enduranceSessionCount = (prev.enduranceSessionCount || 0) + sessionChecks;
    prev.checkCount = (prev.checkCount || 0) + sessionChecks;
    prev.totalReps = (prev.totalReps || 0) + totalReps;
    prev.sessionCount = (prev.sessionCount || 0) + sessionChecks;

    dailyReps.forEach((dayReps) => {
      prev.maxDailyTotalReps = Math.max(prev.maxDailyTotalReps || 0, dayReps);
      if (dayReps > 0) prev.maxSetReps = Math.max(prev.maxSetReps || 0, dayReps);
    });

    byBenchmarkKey.set(benchmarkKey, prev);
  });
}

/** Coches endurance comptées en plus des checkedExercises. */
export function mergeEnduranceIntoCheckCounts(counts, snapshot) {
  Object.keys(ENDURANCE_BENCHMARK_BRIDGE).forEach((benchmarkKey) => {
    let n = 0;
    forEachEnduranceBenchmarkSession(snapshot, benchmarkKey, () => {
      n += 1;
    });
    if (n > 0) counts.set(benchmarkKey, (counts.get(benchmarkKey) || 0) + n);
  });
  return counts;
}
