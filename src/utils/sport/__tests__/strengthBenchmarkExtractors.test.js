import { describe, it, expect } from 'vitest';
import { extractBenchmarkMetricsByExercise } from '../strengthBenchmarkExtractors';
import { buildRecapBenchmarkInsights } from '../recapBenchmarkInsights';

describe('strengthBenchmarkExtractors', () => {
  const key1 = '2026-05-01_101';
  const key2 = '2026-05-08_101';

  it('utilise max reps par série (pas total jour) pour tractions', () => {
    const snapshot = {
      checkedExercises: { [key1]: true, [key2]: true },
      exerciseSetLogs: {
        [key1]: {
          sets: [
            { reps: 8, weight: null },
            { reps: 6, weight: null }
          ],
          schemaVersion: 1
        },
        [key2]: {
          sets: [
            { reps: 12, weight: null },
            { reps: 10, weight: null }
          ],
          schemaVersion: 1
        }
      },
      reps: { [key1]: '14', [key2]: '22' }
    };
    const { byBenchmarkKey } = extractBenchmarkMetricsByExercise(
      snapshot,
      { start: '2026-05-01', end: '2026-05-31' },
      (id) => (id === 101 || id === '101' ? 'Tractions' : '')
    );
    const pull = byBenchmarkKey.get('pullups_strict');
    expect(pull).toBeTruthy();
    expect(pull.maxSetReps).toBe(12);
    expect(pull.totalReps).toBe(36);
  });

  it('sépare tractions strictes et australiennes', () => {
    const strictKey = '2026-05-01_101';
    const ausKey = '2026-05-01_102';
    const snapshot = {
      checkedExercises: { [strictKey]: true, [ausKey]: true },
      exerciseSetLogs: {
        [strictKey]: {
          sets: [{ reps: 8, weight: null }, { reps: 6, weight: null }],
          schemaVersion: 1
        },
        [ausKey]: {
          sets: [{ reps: 20, weight: null }, { reps: 18, weight: null }],
          schemaVersion: 1
        }
      },
      reps: { [strictKey]: '14', [ausKey]: '38' }
    };
    const { byBenchmarkKey } = extractBenchmarkMetricsByExercise(
      snapshot,
      { start: '2026-05-01', end: '2026-05-31' },
      (id) => {
        if (id === 101 || id === '101') return 'Tractions';
        if (id === 102 || id === '102') return 'Tractions australiennes';
        return '';
      }
    );
    expect(byBenchmarkKey.get('pullups_strict')?.maxSetReps).toBe(8);
    expect(byBenchmarkKey.get('pullups_australian')?.maxSetReps).toBe(20);
  });

  it('génère insights progression quand fenêtre évolue', () => {
    const k1 = '2026-05-01_250';
    const k2 = '2026-05-08_250';
    const snapshot = {
      checkedExercises: { [k1]: true, [k2]: true },
      exerciseSetLogs: {
        [k1]: {
          sets: [
            { reps: 12, weight: 10, weightMode: 'perHand' },
            { reps: 12, weight: 10, weightMode: 'perHand' },
            { reps: 12, weight: 10, weightMode: 'perHand' },
            { reps: 12, weight: 10, weightMode: 'perHand' }
          ],
          schemaVersion: 1
        },
        [k2]: {
          sets: [
            { reps: 5, weight: 12, weightMode: 'perHand' },
            { reps: 5, weight: 12, weightMode: 'perHand' },
            { reps: 5, weight: 12, weightMode: 'perHand' },
            { reps: 5, weight: 12, weightMode: 'perHand' },
            { reps: 5, weight: 12, weightMode: 'perHand' }
          ],
          schemaVersion: 1
        }
      },
      reps: { [k1]: '48', [k2]: '25' },
      exerciseWeights: { [k1]: '10', [k2]: '12' },
      exerciseWeightPerArm: { [k1]: true, [k2]: true }
    };
    const { insights } = buildRecapBenchmarkInsights({
      snapshot,
      enrichment: { window: { start: '2026-05-01', end: '2026-05-31' }, streak: { current: 0, longest: 0 } },
      getExerciseNameById: () => 'Curl haltères biceps',
      period: '30d'
    });
    expect(insights.some((i) => i.category === 'progression')).toBe(true);
  });

  it('sépare planche bras tendus et gainage statique', () => {
    const straightKey = '2026-06-09_2007';
    const gainageKey = '2026-06-10_740';
    const snapshot = {
      checkedExercises: { [straightKey]: true, [gainageKey]: true },
      exerciseSetLogs: {
        [straightKey]: { sets: [{ reps: 90, weight: null }], schemaVersion: 1 },
        [gainageKey]: { sets: [{ reps: 45, weight: null }], schemaVersion: 1 }
      },
      reps: { [straightKey]: '90', [gainageKey]: '45' }
    };
    const getName = (id) => {
      if (id === 2007 || id === '2007') return 'Planche bras tendus';
      if (id === 740 || id === '740') return 'Gainage';
      return '';
    };
    const { byBenchmarkKey } = extractBenchmarkMetricsByExercise(
      snapshot,
      { start: '2026-06-01', end: '2026-06-30' },
      getName
    );
    expect(byBenchmarkKey.get('plank_straight_arm')?.maxHoldSeconds).toBe(90);
    expect(byBenchmarkKey.get('gainage_static')?.maxHoldSeconds).toBe(45);
    expect(byBenchmarkKey.get('plank_straight_arm')?.bestRecord?.exerciseName).toBe('Planche bras tendus');
    expect(byBenchmarkKey.has('plank')).toBe(false);
  });
});
