import { describe, expect, it } from 'vitest';
import {
  buildRecapDenseAnalytics,
  computeWeeklyLoadStats,
  sumLegRepsFromRecapState,
  computeGarminCalendarSummary,
  computeSleepRepCorrelations,
  buildChallengeDetailRows
} from '../recapDenseAnalytics';
import { MuscleGroups } from '../../../data/workoutProgramEnhanced';

describe('recapDenseAnalytics', () => {
  it('calcule reps jambes depuis repShareByGroup', () => {
    const reps = sumLegRepsFromRecapState({
      repShareByGroup: {
        [MuscleGroups.QUADS]: 120,
        [MuscleGroups.HAMSTRINGS]: 80,
        [MuscleGroups.CALVES]: 40
      }
    });
    expect(reps).toBe(240);
  });

  it('agrège kg×reps par semaine calendaire', () => {
    const stats = computeWeeklyLoadStats(
      {
        reps: { '2026-05-05_201': '10', '2026-05-06_201': '10' },
        checkedExercises: { '2026-05-05_201': true, '2026-05-06_201': true },
        exerciseWeights: { '2026-05-05_201': '20', '2026-05-06_201': '20' }
      },
      { start: '2026-05-01', end: '2026-05-14' }
    );
    expect(stats.weekCount).toBeGreaterThanOrEqual(1);
    expect(stats.totalKgReps).toBeGreaterThan(0);
  });

  it('retourne narrativeSnippets et mostRegularExercises', () => {
    const reps = {};
    const checked = {};
    for (let i = 1; i <= 8; i += 1) {
      const d = `2026-05-${String(i).padStart(2, '0')}`;
      const key = `${d}_104`;
      reps[key] = '15';
      checked[key] = true;
    }
    const program = {
      schedule: {
        lundi: { active: true, exercises: [{ id: 104, name: 'Pompes', series: '4×15' }] },
        mercredi: { active: true, exercises: [{ id: 104, name: 'Pompes', series: '4×15' }] }
      }
    };
    const out = buildRecapDenseAnalytics({
      snapshot: { reps, checkedExercises: checked },
      window: { start: '2026-05-01', end: '2026-05-14' },
      recapState: { repShareByGroup: { [MuscleGroups.CHEST]: 120 } },
      enrichment: { completion: { exoPct: 85, stretchPct: 5 }, leastCheckedExercises: [] },
      assessment: { volumeKgRepsSum28: 0 },
      getExerciseNameById: () => 'Pompes',
      activeProgram: program,
      ctx: { activeProgram: program, getExerciseNameById: () => 'Pompes' }
    });
    expect(out.narrativeSnippets).toBeTruthy();
    expect(Array.isArray(out.mostRegularExercises)).toBe(true);
  });

  it('agrège activités Garmin hors marche', () => {
    const summary = computeGarminCalendarSummary(
      {
        activities: {
          cardio: [
            { date: '2026-05-10', activityName: 'Natation piscine', garminTypeKey: 'lap_swimming', duration: 45 },
            { date: '2026-05-12', activityName: 'Marche', garminTypeKey: 'walking', duration: 30 }
          ],
          swimming: [{ date: '2026-05-15', activityName: 'Pool swim', duration: 40 }]
        }
      },
      { start: '2026-05-01', end: '2026-05-20' }
    );
    expect(summary.totalSessions).toBeGreaterThanOrEqual(2);
    expect(summary.byCategory.swimming).toBeGreaterThanOrEqual(1);
  });

  it('détecte corrélation sommeil court vs reps', () => {
    const reps = {};
    const checked = {};
    const dates = ['2026-05-01', '2026-05-03', '2026-05-05', '2026-05-07', '2026-05-09', '2026-05-11'];
    dates.forEach((d, i) => {
      const key = `${d}_104`;
      reps[key] = String(i % 2 === 0 ? 8 : 12);
      checked[key] = true;
    });
    const garminPartial = {
      dailyMetrics: Object.fromEntries(
        dates.map((d, i) => [d, { sleep: { duration: i % 2 === 0 ? 5.5 : 8 } }])
      )
    };
    const hits = computeSleepRepCorrelations(
      { reps, checkedExercises: checked },
      { start: '2026-05-01', end: '2026-05-14' },
      garminPartial,
      () => 'Pompes'
    );
    expect(hits.length).toBeGreaterThanOrEqual(1);
  });

  it('liste les défis avec progression', () => {
    const rows = buildChallengeDetailRows(
      { reps: {}, checkedExercises: {} },
      {
        digest: {
          challenges: [
            { id: 'c1', title: '100 km', status: 'active', type: 'ponctuel', activityType: 'running' },
            { id: 'c2', title: 'Old', status: 'completed' }
          ],
          perActivity: { running: { totals: { distanceKm: 40 } } }
        }
      }
    );
    expect(rows.length).toBe(2);
    expect(rows.some((r) => r.status === 'active')).toBe(true);
  });
});
