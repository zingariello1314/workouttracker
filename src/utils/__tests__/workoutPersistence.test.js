import { describe, expect, it } from 'vitest';
import {
  hasEnduranceContent,
  hasWorkoutContent,
  mergeLocalBackupSessionMaps,
} from '../workoutPersistence.js';

describe('hasWorkoutContent', () => {
  it('détecte un backfill Défis (sessions endurance sans reps)', () => {
    const data = {
      checkedExercises: {},
      reps: {},
      checkedStretches: {},
      enduranceData: {
        sessions: {
          running: [{ id: 's1', date: '2026-05-20' }],
          pushups: [],
        },
        challenges: [],
      },
    };
    expect(hasEnduranceContent(data.enduranceData)).toBe(true);
    expect(hasWorkoutContent(data)).toBe(true);
  });

  it('reste false pour un agrégat vide', () => {
    expect(
      hasWorkoutContent({
        checkedExercises: {},
        reps: {},
        checkedStretches: {},
        enduranceData: { sessions: { running: [] }, challenges: [] },
      })
    ).toBe(false);
  });
});

describe('mergeLocalBackupSessionMaps', () => {
  it('préfère reps et kg du backup localStorage', () => {
    const idb = {
      reps: { '2026-06-05_ex1': '5' },
      exerciseWeights: {},
      checkedStretches: {},
      enduranceData: { sessions: { running: [{ id: 's1' }] }, challenges: [] },
      lastSaved: '2026-06-05T08:00:00.000Z',
    };
    const ls = {
      reps: { '2026-06-05_ex1': '12', '2026-06-05_ex2': '8' },
      exerciseWeights: { '2026-06-05_ex1': '20' },
      checkedStretches: { '2026-06-05_st1': true },
      lastSaved: '2026-06-05T10:00:00.000Z',
    };
    const merged = mergeLocalBackupSessionMaps(idb, ls, 'user-1');
    expect(merged.reps['2026-06-05_ex1']).toBe('12');
    expect(merged.reps['2026-06-05_ex2']).toBe('8');
    expect(merged.exerciseWeights['2026-06-05_ex1']).toBe('20');
    expect(merged.checkedStretches['2026-06-05_st1']).toBe(true);
    expect(merged.enduranceData.sessions.running).toHaveLength(1);
    expect(merged.lastSaved).toBe('2026-06-05T10:00:00.000Z');
  });
});
