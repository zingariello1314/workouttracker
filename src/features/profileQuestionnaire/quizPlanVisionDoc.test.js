import { describe, it, expect } from 'vitest';
import { incoherenceDocProfile6d } from './fixtures/incoherenceDocProfile';
import { runIncoherenceDocSchedule } from './fixtures/runIncoherenceDocSchedule';
import { estimateSessionMinutesFromExercises } from './quizSessionDurationBudget';
import { sessionDurationCoherent, pullWeeklySets } from './quizV6DoDHelpers';

const { schedule, quizGenerationMeta } = runIncoherenceDocSchedule();

describe('vision doc §14 — profil incohérences 6j', () => {
  const activeDays = Object.keys(schedule).filter((k) => schedule[k]?.active);
  const dayBlocks = quizGenerationMeta?.weeklyPlanner?.dayBlocks || {};

  it('objectifs-first : meta, push, ≥5 jours, pas cap silencieux à 3', () => {
    expect(quizGenerationMeta?.weeklyObjectives).toBeTruthy();
    expect(quizGenerationMeta?.objectivesSummaryFr).toMatch(/accomplir|traction/i);
    expect(activeDays.length).toBeGreaterThanOrEqual(5);
    expect(quizGenerationMeta?.prescribedActiveDays).toBeGreaterThanOrEqual(5);
    const allBlocks = Object.values(dayBlocks).flat();
    expect(allBlocks.some((b) => b === 'force_push')).toBe(true);
    if (quizGenerationMeta?.daysRemovedByCap?.length) {
      expect(quizGenerationMeta.warnings?.length).toBeGreaterThan(0);
    }
  });

  it('course : 2 sorties dédiées, 1 stimulus cardio par jour course', () => {
    const runDays = activeDays.filter((d) =>
      (dayBlocks[d] || []).some((b) => String(b).startsWith('run_'))
    );
    expect(runDays.length).toBeGreaterThanOrEqual(2);
    runDays.forEach((d) => {
      const cardioEx = (schedule[d]?.exercises || []).filter((e) =>
        /course|fractionné|tempo|ef|cardio/i.test(`${e.name} ${e.exerciseBankKey}`)
      );
      expect(cardioEx.length).toBeLessThanOrEqual(2);
    });
  });

  it('tractions : ≥2 expositions, pas de pistol débutant', () => {
    const pullDays = activeDays.filter((d) =>
      (schedule[d]?.exercises || []).some((e) => /traction|pull|australien/i.test(`${e.name} ${e.exerciseBankKey}`))
    );
    expect(pullDays.length).toBeGreaterThanOrEqual(2);
    expect(pullWeeklySets(schedule, activeDays)).toBeGreaterThanOrEqual(8);
    const blob = activeDays
      .flatMap((d) => schedule[d]?.exercises || [])
      .map((e) => `${e.name} ${e.exerciseBankKey}`)
      .join(' ');
    expect(blob).not.toMatch(/pistol/i);
  });

  it('durée : séances force 45–75 min estimées ou message explicite', () => {
    const strengthMinutes = [];
    activeDays.forEach((d) => {
      const day = schedule[d];
      if (!day?.exercises?.length) return;
      expect(sessionDurationCoherent(day, incoherenceDocProfile6d)).toBe(true);
      if (!(dayBlocks[d] || []).some((b) => String(b).startsWith('force_'))) return;
      strengthMinutes.push(estimateSessionMinutesFromExercises(day.exercises, incoherenceDocProfile6d));
    });
    expect(strengthMinutes.length).toBeGreaterThanOrEqual(3);
    const at45 = strengthMinutes.filter((m) => m >= 45).length;
    expect(at45).toBeGreaterThanOrEqual(Math.min(3, strengthMinutes.length));
  });

  it('répartition et plan tractions en meta', () => {
    expect(quizGenerationMeta?.weekAllocationSummaryFr).toMatch(/lundi|mardi|mercredi|vendredi/i);
    expect(
      quizGenerationMeta?.pullupProgressionPlan?.labelFr ||
        quizGenerationMeta?.weeklyObjectives?.pullupPlan?.labelFr
    ).toBeTruthy();
  });
});
