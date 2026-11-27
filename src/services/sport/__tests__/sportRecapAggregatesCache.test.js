import { describe, expect, it, beforeEach } from 'vitest';
import {
  getCachedRecapMuscleState,
  getCachedRecapStrengthCompareModel,
  invalidateSportRecapAggregatesCache,
  peekSportRecapAggregatesCacheStats,
  getGroupedCheckedRepsCached
} from '../sportRecapAggregatesCache';
import { fingerprintWorkoutAnalytics } from '../workoutAnalyticsRevision';
import { computeRecapMuscleState } from '../../../utils/sport/recapMuscleLoadEngine';
import { buildRecapStrengthCompareModel } from '../../../utils/sport/recapStrengthPeriodStats';

const REF = new Date('2026-11-27T12:00:00');

function sampleSnapshot() {
  return {
    checkedExercises: {
      '2026-11-20_1': true,
      '2026-11-21_2': true,
      '2026-11-22_1': true
    },
    reps: {
      '2026-11-20_1': '12',
      '2026-11-21_2': '15',
      '2026-11-22_1': '10'
    },
    exerciseWeights: {},
    exerciseIntensityCoeffs: {},
    enduranceData: { sessions: {}, challenges: [] }
  };
}

const getName = (id) => (String(id) === '1' ? 'Développé couché' : 'Rowing');

describe('sportRecapAggregatesCache P0.7', () => {
  beforeEach(() => {
    invalidateSportRecapAggregatesCache();
  });

  it('fingerprint stable pour le même snapshot', () => {
    const a = sampleSnapshot();
    const b = sampleSnapshot();
    expect(fingerprintWorkoutAnalytics(a)).toBe(fingerprintWorkoutAnalytics(b));
  });

  it('fingerprint change quand une rep change', () => {
    const a = sampleSnapshot();
    const b = sampleSnapshot();
    b.reps['2026-11-20_1'] = '99';
    expect(fingerprintWorkoutAnalytics(a)).not.toBe(fingerprintWorkoutAnalytics(b));
  });

  it('grouped checked-reps mutualisé entre appels', () => {
    const data = sampleSnapshot();
    const g1 = getGroupedCheckedRepsCached(data);
    const g2 = getGroupedCheckedRepsCached(data);
    expect(g1).toBe(g2);
    expect(g1.size).toBeGreaterThan(0);
  });

  it('cache muscle : 2e appel (StrictMode-like) ne recalcule pas', () => {
    const data = sampleSnapshot();
    const first = getCachedRecapMuscleState(data, '30d', getName, REF);
    const statsAfterFirst = peekSportRecapAggregatesCacheStats();
    const second = getCachedRecapMuscleState(data, '30d', getName, REF);
    expect(second).toBe(first);
    expect(peekSportRecapAggregatesCacheStats().muscleEntries).toBe(statsAfterFirst.muscleEntries);
  });

  it('parité muscle avec computeRecapMuscleState', () => {
    const data = sampleSnapshot();
    const cached = getCachedRecapMuscleState(data, '30d', getName, REF);
    invalidateSportRecapAggregatesCache();
    const direct = computeRecapMuscleState(data, '30d', getName, REF);
    expect(cached.repShareByGroup).toEqual(direct.repShareByGroup);
    expect(cached.cardioMinutesByGroup).toEqual(direct.cardioMinutesByGroup);
    expect(cached.uniformBodyColor).toEqual(direct.uniformBodyColor);
  });

  it('cache strength : parité + identité 2e appel', () => {
    const data = sampleSnapshot();
    const first = getCachedRecapStrengthCompareModel(data, '30d', getName, REF, 8);
    const second = getCachedRecapStrengthCompareModel(data, '30d', getName, REF, 8);
    expect(second).toBe(first);
    invalidateSportRecapAggregatesCache();
    const direct = buildRecapStrengthCompareModel(data, '30d', getName, REF, 8);
    expect(first.totalRepsCurr).toBe(direct.totalRepsCurr);
    expect(first.activeDays).toBe(direct.activeDays);
    expect(first.changeValue).toBe(direct.changeValue);
  });
});
