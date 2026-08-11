import { describe, it, expect } from 'vitest';
import { gatePassed, resolveSportGrades, pathEThresholdPctForGate, pathsRequiredForGate } from '../sportGradeResolution';
import { gateForGradeId } from '../sportGradeCatalog';

describe('sportGradeResolution', () => {
  it('gatePassed path A when mastery meets threshold', () => {
    const gate = { toGradeId: 'adepte', masteryMin: 1000, sessionsMin: 10, minutesMin: 20, repsMin: 1, kcalMin: 1 };
    expect(gatePassed(gate, 1000, {}, {}).ok).toBe(true);
    expect(gatePassed(gate, 1000, {}, {}).path).toBe('A');
  });

  it('olympien exige 2 voies ou voie E à 80 %', () => {
    const gate = gateForGradeId('olympien');
    expect(pathsRequiredForGate(gate)).toBe(2);
    expect(pathEThresholdPctForGate(gate)).toBe(80);
    const onePath = gatePassed(gate, gate.masteryMin, {}, {});
    expect(onePath.ok).toBe(false);
    const twoPaths = gatePassed(
      gate,
      gate.masteryMin,
      { lifetimeReps: gate.repsMin },
      {}
    );
    expect(twoPaths.ok).toBe(true);
    expect(twoPaths.path).toBe('multi');
  });

  it('parangon exige 4 voies ou voie E à 90 %', () => {
    const gate = gateForGradeId('parangon');
    expect(pathsRequiredForGate(gate)).toBe(4);
    expect(pathEThresholdPctForGate(gate)).toBe(90);
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
