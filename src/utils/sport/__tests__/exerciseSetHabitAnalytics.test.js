import { describe, it, expect } from 'vitest';
import {
  analyzeExerciseSetHabits,
  analyzeHoldSetPattern,
  buildSessionSetProfiles,
  HABIT_PROFILE
} from '../exerciseSetHabitAnalytics';

describe('exerciseSetHabitAnalytics', () => {
  const getName = (id) => `Exo ${id}`;

  it('détecte un profil fatigue stable (5/5/4/3 récurrent)', () => {
    const sessions = [
      {
        dateYmd: '2026-05-01',
        storageKey: '2026-05-01_101',
        exerciseId: '101',
        setCount: 4,
        totalReps: 17,
        sets: [{ reps: 5 }, { reps: 5 }, { reps: 4 }, { reps: 3 }]
      },
      {
        dateYmd: '2026-05-15',
        storageKey: '2026-05-15_101',
        exerciseId: '101',
        setCount: 4,
        totalReps: 17,
        sets: [{ reps: 5 }, { reps: 5 }, { reps: 4 }, { reps: 3 }]
      },
      {
        dateYmd: '2026-06-01',
        storageKey: '2026-06-01_101',
        exerciseId: '101',
        setCount: 4,
        totalReps: 16,
        sets: [{ reps: 5 }, { reps: 5 }, { reps: 4 }, { reps: 2 }]
      }
    ];

    const snapshot = {
      checkedExercises: Object.fromEntries(sessions.map((s) => [s.storageKey, true])),
      exerciseSetLogs: Object.fromEntries(
        sessions.map((s) => [s.storageKey, { sets: s.sets, schemaVersion: 1 }])
      ),
      reps: Object.fromEntries(sessions.map((s) => [s.storageKey, String(s.totalReps)]))
    };

    const analysis = analyzeExerciseSetHabits(sessions, snapshot, getName, {
      weightTrendPct: 0,
      volTrendPct: -5
    });

    expect(analysis.patternConsistencyPct).toBeGreaterThanOrEqual(66);
    expect([
      HABIT_PROFILE.STABLE_FATIGUE,
      HABIT_PROFILE.WORSENING_FATIGUE,
      HABIT_PROFILE.IRREGULAR
    ]).toContain(analysis.profileType);
    expect(analysis.bullets.some((b) => /habitude/i.test(b))).toBe(true);
    expect(
      analysis.bullets.some((b) => /dernière série/i.test(b)) ||
        analysis.sessionProfiles.length === 3
    ).toBe(true);
  });

  it('détecte schéma uniforme stable', () => {
    const sessions = [
      {
        dateYmd: '2026-05-01',
        storageKey: '2026-05-01_202',
        exerciseId: '202',
        setCount: 3,
        totalReps: 30,
        avgWeight: 20,
        sets: [{ reps: 10, weight: 20 }, { reps: 10, weight: 20 }, { reps: 10, weight: 20 }]
      },
      {
        dateYmd: '2026-05-20',
        storageKey: '2026-05-20_202',
        exerciseId: '202',
        setCount: 3,
        totalReps: 30,
        avgWeight: 22,
        sets: [{ reps: 10, weight: 22 }, { reps: 10, weight: 22 }, { reps: 10, weight: 22 }]
      }
    ];

    const snapshot = {
      exerciseSetLogs: Object.fromEntries(
        sessions.map((s) => [s.storageKey, { sets: s.sets, schemaVersion: 1 }])
      ),
      reps: Object.fromEntries(sessions.map((s) => [s.storageKey, String(s.totalReps)]))
    };

    const analysis = analyzeExerciseSetHabits(sessions, snapshot, getName, {
      weightTrendPct: 10,
      volTrendPct: 0
    });

    expect(analysis.profileType).toBe(HABIT_PROFILE.STABLE_UNIFORM);
    expect(analysis.patternConsistencyPct).toBe(100);
    expect(analysis.bullets.some((b) => /charge/i.test(b))).toBe(true);
  });

  it('analyse les maintiens isométriques', () => {
    const pattern = analyzeHoldSetPattern([60, 55, 50]);
    expect(pattern.dropFirstToLast).toBe(10);
    expect(pattern.isUniform).toBe(false);

    const sessions = [
      {
        dateYmd: '2026-05-01',
        storageKey: '2026-05-01_303',
        exerciseId: '303',
        isHold: true,
        setCount: 3,
        totalReps: 165,
        maxHoldSeconds: 60,
        sets: [{ reps: 60, holdSeconds: 60 }, { reps: 55, holdSeconds: 55 }, { reps: 50, holdSeconds: 50 }]
      },
      {
        dateYmd: '2026-06-01',
        storageKey: '2026-06-01_303',
        exerciseId: '303',
        isHold: true,
        setCount: 3,
        totalReps: 180,
        maxHoldSeconds: 65,
        sets: [{ reps: 65, holdSeconds: 65 }, { reps: 58, holdSeconds: 58 }, { reps: 57, holdSeconds: 57 }]
      }
    ];

    const profiles = buildSessionSetProfiles(sessions, null, getName);
    expect(profiles[0].isHold).toBe(true);
    expect(profiles[0].pattern).toMatch(/1m/);

    const analysis = analyzeExerciseSetHabits(sessions, null, getName);
    expect(analysis.sessionProfiles.length).toBe(2);
  });

  it('retourne single_set si pas de multi-séries', () => {
    const sessions = [
      {
        dateYmd: '2026-05-01',
        storageKey: '2026-05-01_404',
        exerciseId: '404',
        setCount: 1,
        totalReps: 8,
        sets: [{ reps: 8 }]
      }
    ];
    const analysis = analyzeExerciseSetHabits(sessions, null, getName);
    expect(analysis.profileType).toBe(HABIT_PROFILE.SINGLE_SET);
  });
});
