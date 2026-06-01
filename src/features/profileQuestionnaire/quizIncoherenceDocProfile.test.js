import { describe, it, expect } from 'vitest';
import { buildQuizCoachContext } from './quizCoachPipeline';
import { incoherenceDocProfile6d } from './fixtures/incoherenceDocProfile';
import { runIncoherenceDocSchedule } from './fixtures/runIncoherenceDocSchedule';

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
});
