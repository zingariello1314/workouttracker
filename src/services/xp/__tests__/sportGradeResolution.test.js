import { describe, it, expect } from 'vitest';
import { gatePassed, resolveSportGrades } from '../sportGradeResolution';

describe('sportGradeResolution', () => {
  it('gatePassed path A when mastery meets threshold', () => {
    const gate = { masteryMin: 1000, sessionsMin: 10, minutesMin: 20, repsMin: 1, kcalMin: 1 };
    expect(gatePassed(gate, 1000, {}, {}).ok).toBe(true);
    expect(gatePassed(gate, 1000, {}, {}).path).toBe('A');
  });

  it('resolveSportGrades keeps novice when gates fail', () => {
    const g = resolveSportGrades({
      level: 5,
      masteryScore: 0,
      aggregates: { qualifiedSessions: 0, lifetimeReps: 0, lifetimeActiveKcal: 0 },
      workoutData: {}
    });
    expect(g.merited.gradeId).toBe('novice');
    expect(g.progression.gradeId).toBe('novice');
  });
});
