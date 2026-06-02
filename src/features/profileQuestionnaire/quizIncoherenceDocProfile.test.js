import { describe, it, expect } from 'vitest';
import { buildQuizCoachContext } from './quizCoachPipeline';
import { incoherenceDocProfile6d } from './fixtures/incoherenceDocProfile';
import { runIncoherenceDocSchedule } from './fixtures/runIncoherenceDocSchedule';
import { parseRepsMid } from './quizSessionLimits';
import { assertPullRepsWithinBaseline } from './quizPullRepPrescription';

describe('profil incohérences doc (6j, objectifs-first)', () => {
  it('coach context expose objectifs et prescribedActiveDays >= min mission', () => {
    const ctx = buildQuizCoachContext(incoherenceDocProfile6d, { snapshot: {} });
    expect(ctx.weeklyObjectives).toBeTruthy();
    expect(ctx.weeklyObjectives.muscleVolumeTargets.chest).toBeGreaterThanOrEqual(10);
    expect(ctx.prescribedActiveDays).toBeGreaterThanOrEqual(ctx.weeklyObjectives.minActiveDaysToCover);
    expect(ctx.objectivesSummaryFr).toMatch(/Cette semaine doit accomplir/i);
    expect(ctx.weeklyObjectives.pullupPlan?.exposuresPerWeek).toBeGreaterThanOrEqual(2);
    expect(ctx.weeklyObjectives.runPlan?.sessionsPerWeek).toBeGreaterThanOrEqual(2);
  });

  it('génération : meta objectifs + prescribedActiveDays', () => {
    const { quizGenerationMeta } = runIncoherenceDocSchedule();
    expect(quizGenerationMeta?.weeklyObjectives?.muscleVolumeTargets?.chest).toBeGreaterThanOrEqual(10);
    expect(quizGenerationMeta?.prescribedActiveDays).toBeGreaterThanOrEqual(5);
    expect(quizGenerationMeta?.weekAllocationSummaryFr).toMatch(/lundi|mardi/i);
  });

  it('pas de rowing haltère si programme street + tractions ≤ max quiz', () => {
    const ctx = buildQuizCoachContext(incoherenceDocProfile6d, { snapshot: {} });
    expect(ctx.programStrengthFamily).toBe('street');

    const { schedule } = runIncoherenceDocSchedule();
    const blob = Object.values(schedule)
      .flatMap((d) => d?.exercises || [])
      .map((e) => `${e.exerciseBankKey || ''} ${e.name || ''}`)
      .join(' ')
      .toLowerCase();
    expect(blob).not.toMatch(/rowing haltère/);

    const pulls = Object.values(schedule).flatMap((d) => d?.exercises || []);
    expect(assertPullRepsWithinBaseline(pulls, incoherenceDocProfile6d)).toBe(true);

    const strict = pulls.find((e) =>
      /tractions pronation/i.test(`${e.exerciseBankKey || ''} ${e.name || ''}`)
    );
    if (strict) {
      expect(parseRepsMid(strict.series)).toBeLessThanOrEqual(6);
    }

    const dimanche = schedule.dimanche;
    if (dimanche?.active) {
      const hasRun = (dimanche.exercises || []).some((e) =>
        /course|fractionné/i.test(`${e.exerciseBankKey || ''} ${e.name || ''}`)
      );
      expect(hasRun).toBe(true);
    }
  });
});
