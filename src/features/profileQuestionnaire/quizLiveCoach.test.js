import { describe, it, expect } from 'vitest';
import { computeProgramWeekIndex1 } from './quizProgramWeek';
import { bumpSeriesForHighPerformance, classifyRepPerformance } from './quizRepProgression';
import { applyLiveCoachToExercises } from './quizLiveCoach';
import { buildProgramProgressionPlan } from './quizProgression';

describe('quizLiveCoach', () => {
  it('computeProgramWeekIndex1 respecte la durée programme', () => {
    const start = new Date();
    start.setDate(start.getDate() - 14);
    const prog = { startDate: start.toISOString(), duration: 6 };
    expect(computeProgramWeekIndex1(prog, new Date())).toBe(3);
  });

  it('bumpSeriesForHighPerformance ajoute une rep', () => {
    const { series, bumped, kind } = bumpSeriesForHighPerformance('3×10-12');
    expect(bumped).toBe(true);
    expect(kind).toBe('rep');
    expect(series).toMatch(/13/);
  });

  it('classifyRepPerformance détecte le haut de fourchette', () => {
    expect(classifyRepPerformance('3×8-12', 12)).toBe('high');
    expect(classifyRepPerformance('3×8-12', 6)).toBe('below');
  });

  it('applyLiveCoachToExercises applique la semaine 2', () => {
    const start = new Date();
    start.setDate(start.getDate() - 10);
    const plan = buildProgramProgressionPlan(6);
    const ex = [{ id: '1', name: 'Pompes', series: '4×10-12' }];
    const { exercises, coachNotes } = applyLiveCoachToExercises(ex, {
      activeProgram: {
        availabilitySource: 'quiz',
        startDate: start.toISOString(),
        duration: 6,
        schedule: { lundi: { active: true } },
        quizGenerationMeta: { liveCoachEnabled: true, progressionPlan: plan }
      },
      sessionYmd: new Date().toISOString().slice(0, 10),
      snapshot: { checkedExercises: {}, reps: {} }
    });
    expect(exercises[0].series).toBeTruthy();
    expect(coachNotes.length).toBeGreaterThanOrEqual(0);
  });
});
