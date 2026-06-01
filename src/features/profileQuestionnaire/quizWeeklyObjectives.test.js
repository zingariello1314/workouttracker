import { describe, it, expect } from 'vitest';
import {
  buildWeeklyTrainingObjectives,
  applyObjectiveScaling,
  minActiveDaysToCover,
  objectivesToStrengthFamilies,
  derivePrescribedActiveDays,
  formatWeeklyObjectivesSummaryFr
} from './quizWeeklyObjectives';
import { resolveQuizConstraints } from './quizConstraintResolver';
import { incoherenceDocProfile6d } from './fixtures/incoherenceDocProfile';

describe('quizWeeklyObjectives', () => {
  it('profil doc 6j : pecs, tractions, course avant placement', () => {
    const constraints = resolveQuizConstraints(incoherenceDocProfile6d);
    const raw = buildWeeklyTrainingObjectives(incoherenceDocProfile6d, constraints);
    const scaled = applyObjectiveScaling(raw, {
      recoveryBudget: 0.95,
      adherenceRisk: constraints.adherenceRisk,
      globalLoadFactor: 1,
      answers: incoherenceDocProfile6d
    });

    expect(scaled.muscleVolumeTargets.chest).toBeGreaterThanOrEqual(10);
    expect(scaled.muscleVolumeTargets.back).toBeGreaterThanOrEqual(12);
    expect(scaled.pullupPlan?.exposuresPerWeek).toBeGreaterThanOrEqual(2);
    expect(scaled.runPlan?.sessionsPerWeek).toBeGreaterThanOrEqual(2);
    expect(scaled.minActiveDaysToCover).toBeGreaterThanOrEqual(5);
    expect(formatWeeklyObjectivesSummaryFr(scaled)).toMatch(/Cette semaine doit accomplir/i);
  });

  it('derivePrescribedActiveDays privilégie min mission sur cap adhérence bas', () => {
    const constraints = resolveQuizConstraints(incoherenceDocProfile6d);
    const objectives = buildWeeklyTrainingObjectives(incoherenceDocProfile6d, constraints);
    const { prescribedActiveDays, coverageWarningFr } = derivePrescribedActiveDays(objectives, constraints);

    expect(prescribedActiveDays).toBeGreaterThanOrEqual(objectives.minActiveDaysToCover);
    if (constraints.maxActiveDays < objectives.minActiveDaysToCover) {
      expect(coverageWarningFr).toBeTruthy();
    }
  });

  it('objectivesToStrengthFamilies agrège fine → familles', () => {
    const objectives = buildWeeklyTrainingObjectives(incoherenceDocProfile6d);
    const fam = objectivesToStrengthFamilies(objectives);
    expect(fam.push).toBeGreaterThanOrEqual(10);
    expect(fam.pull).toBeGreaterThanOrEqual(12);
    expect(fam.legs).toBeGreaterThanOrEqual(8);
  });

  it('minActiveDaysToCover inclut course + force + street', () => {
    const objectives = buildWeeklyTrainingObjectives(incoherenceDocProfile6d);
    const min = minActiveDaysToCover(objectives, incoherenceDocProfile6d);
    expect(min).toBeGreaterThanOrEqual(5);
  });
});
