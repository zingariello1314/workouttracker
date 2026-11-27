import { describe, expect, it } from 'vitest';
import { fingerprintWorkoutAnalytics } from '../workoutAnalyticsRevision';

function base() {
  return {
    reps: { '2026-11-01_1': '10' },
    checkedExercises: { '2026-11-01_1': true },
    exerciseWeights: { '2026-11-01_1': '40' },
    exerciseIntensityCoeffs: {},
    enduranceData: { sessions: {}, challenges: [] }
  };
}

describe('fingerprintWorkoutAnalytics couverture métier', () => {
  it('change quand les reps changent (même nombre de clés)', () => {
    const a = base();
    const b = base();
    b.reps['2026-11-01_1'] = '99';
    expect(fingerprintWorkoutAnalytics(a)).not.toBe(fingerprintWorkoutAnalytics(b));
  });

  it('change quand la charge change', () => {
    const a = base();
    const b = base();
    b.exerciseWeights['2026-11-01_1'] = '55';
    expect(fingerprintWorkoutAnalytics(a)).not.toBe(fingerprintWorkoutAnalytics(b));
  });

  it('change quand les séries (set weights) changent', () => {
    const a = base();
    const b = base();
    b.exerciseSetWeights = { '2026-11-01_1': ['40', '42', '45'] };
    expect(fingerprintWorkoutAnalytics(a)).not.toBe(fingerprintWorkoutAnalytics(b));
  });

  it('change quand un coefficient change', () => {
    const a = base();
    const b = base();
    b.exerciseIntensityCoeffs = { '1': 1.2 };
    expect(fingerprintWorkoutAnalytics(a)).not.toBe(fingerprintWorkoutAnalytics(b));
  });

  it('change quand une session endurance est modifiée', () => {
    const a = base();
    const b = base();
    b.enduranceData = {
      sessions: { pushups: [{ id: 's1', date: '2026-11-01', count: 50 }] },
      challenges: []
    };
    expect(fingerprintWorkoutAnalytics(a)).not.toBe(fingerprintWorkoutAnalytics(b));
  });

  it('change quand dailyVariations (séries) change', () => {
    const a = base();
    const b = base();
    b.dailyVariations = {
      '2026-11-01': { seriesOverrides: { '1': '4x10' } }
    };
    expect(fingerprintWorkoutAnalytics(a)).not.toBe(fingerprintWorkoutAnalytics(b));
  });
});
