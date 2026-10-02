import { describe, it, expect } from 'vitest';
import {
  createEmptyWorkoutAggregate,
  mergeWorkoutTableLists,
  projectPersistedWorkout
} from '../workoutAggregateDefaults';
import { mergeWorkoutMapFields } from '../../../components/tabs/SettingsTab/utils/sportExportBundle';

describe('projectPersistedWorkout', () => {
  it('garde toutes les clés du schéma vide, y compris celles longtemps absentes de la relecture', () => {
    const empty = createEmptyWorkoutAggregate();
    const projected = projectPersistedWorkout({});
    expect(Object.keys(projected).sort()).toEqual(Object.keys(empty).sort());
    expect(projected.exerciseSessionPerceived).toEqual({});
    expect(projected.historyReps).toEqual({});
    expect(projected.garminActivityDateOverrides).toEqual({});
    expect(projected.workoutTables).toEqual([]);
    expect(projected.enduranceData.sessions.gainage).toEqual([]);
  });

  it('ne jette pas ressenti, historique de reps, dates Garmin ni tableaux', () => {
    const source = {
      reps: { '2026-01-01_12': '8' },
      exerciseSessionPerceived: { '2026-01-01_12': { difficulty: 4, feeling: 3, pleasure: 5 } },
      historyReps: { history_t1_12: '6' },
      garminActivityDateOverrides: { g1: { logicalDate: '2026-01-02' } },
      workoutTables: [{ id: 't1', programId: 'p' }]
    };
    const projected = projectPersistedWorkout(source);
    expect(projected.exerciseSessionPerceived['2026-01-01_12'].difficulty).toBe(4);
    expect(projected.historyReps.history_t1_12).toBe('6');
    expect(projected.garminActivityDateOverrides.g1.logicalDate).toBe('2026-01-02');
    expect(projected.workoutTables).toEqual([{ id: 't1', programId: 'p' }]);
    expect(projected.reps['2026-01-01_12']).toBe('8');
  });

  it('un aller-retour fusion d’import conserve ces champs', () => {
    const imported = projectPersistedWorkout({
      reps: { '2026-03-01_1': '10' },
      historyReps: { history_a_1: '4' },
      garminActivityDateOverrides: { act: { logicalDate: '2026-03-02' } },
      exerciseSessionPerceived: { '2026-03-01_1': { difficulty: 2 } },
      checkedExercises: { '2026-03-01_1': true }
    });
    const merged = mergeWorkoutMapFields({}, imported);
    expect(merged.reps['2026-03-01_1']).toBe('10');
    expect(merged.historyReps.history_a_1).toBe('4');
    expect(merged.garminActivityDateOverrides.act.logicalDate).toBe('2026-03-02');
    expect(merged.exerciseSessionPerceived['2026-03-01_1'].difficulty).toBe(2);
    expect(merged.checkedExercises['2026-03-01_1']).toBe(true);
  });
});

describe('mergeWorkoutTableLists', () => {
  it('garde les deux listes et laisse la seconde gagner sur le même id', () => {
    const out = mergeWorkoutTableLists(
      [{ id: 'a', name: 'ancien' }, { id: 'b', name: 'seul' }],
      [{ id: 'a', name: 'récent' }]
    );
    expect(out).toEqual([
      { id: 'a', name: 'récent' },
      { id: 'b', name: 'seul' }
    ]);
  });
});
