import { describe, expect, it } from 'vitest';
import {
  applyExerciseSetLog,
  buildSetLogFromLegacy,
  getOrBuildExerciseSetLog,
  legacyFieldsFromSetLog
} from '../../exerciseSetLogUtils';

describe('exerciseSetLogUtils', () => {
  const exercise = { id: 42, name: 'Curl', series: '4×10', materiel: 'haltères' };
  const key = '2026-06-01_42';

  it('buildSetLogFromLegacy répartit les reps', () => {
    const data = {
      reps: { [key]: 40 },
      exerciseWeights: { [key]: '12' },
      exerciseWeightPerArm: { [key]: true }
    };
    const log = buildSetLogFromLegacy(data, key, exercise);
    expect(log.sets).toHaveLength(4);
    expect(log.sets.reduce((s, x) => s + x.reps, 0)).toBe(40);
    expect(log.sets[0].weight).toBe(12);
    expect(log.sets[0].weightMode).toBe('perHand');
  });

  it('applyExerciseSetLog synchronise reps legacy', () => {
    const data = { reps: {}, exerciseWeights: {}, checkedExercises: { [key]: true } };
    const next = applyExerciseSetLog(
      data,
      key,
      [
        { reps: 10, weight: 12, weightMode: 'perHand' },
        { reps: 8, weight: 14, weightMode: 'perHand' }
      ],
      { perArm: true }
    );
    expect(next.reps[key]).toBe('18');
    expect(next.exerciseSetLogs[key].sets).toHaveLength(2);
    expect(next.exerciseSetLogs[key].schemaVersion).toBe(1);
  });

  it('legacyFieldsFromSetLog conserve total reps', () => {
    const legacy = legacyFieldsFromSetLog({
      sets: [
        { reps: 6, weight: 18, weightMode: 'perHand' },
        { reps: 6, weight: 18, weightMode: 'perHand' }
      ]
    });
    expect(legacy.reps).toBe('12');
    expect(legacy.exerciseWeightPerArm).toBe(true);
  });

  it('getOrBuildExerciseSetLog préfère log existant', () => {
    const structured = {
      sets: [{ reps: 5, weight: 20, weightMode: 'total' }],
      schemaVersion: 1
    };
    const data = {
      exerciseSetLogs: { [key]: structured },
      reps: { [key]: 99 }
    };
    const log = getOrBuildExerciseSetLog(data, key, exercise);
    expect(log.sets[0].reps).toBe(5);
  });
});
