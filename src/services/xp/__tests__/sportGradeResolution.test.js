import { describe, it, expect } from 'vitest';
import {
  gatePassed,
  resolveSportGrades,
  pathEThresholdPctForGate,
  pathsRequiredForGate,
  pathKeysForGate,
  evaluateTierRowConditions,
  maxTierInGradeWithConditions
} from '../sportGradeResolution';
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
    expect(pathKeysForGate(gate)).toContain('F');
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

  it('olympien voie F km courus compte comme une voie (2 requises)', () => {
    const gate = gateForGradeId('olympien');
    const kmOnly = gatePassed(gate, 0, { lifetimeRunningKm: gate.kmMin }, {});
    expect(kmOnly.ok).toBe(false);
    const kmAndMastery = gatePassed(gate, gate.masteryMin, { lifetimeRunningKm: gate.kmMin }, {});
    expect(kmAndMastery.ok).toBe(true);
    expect(kmAndMastery.path).toBe('multi');
  });

  it('parangon exige 4 voies ou voie E à 90 %', () => {
    const gate = gateForGradeId('parangon');
    expect(pathsRequiredForGate(gate)).toBe(4);
    expect(pathEThresholdPctForGate(gate)).toBe(90);
    expect(gate.kmMin).toBe(1000);
  });

  it('paliers olympien conditionnels — km requis', () => {
    const rows = [
      { gradeId: 'olympien', tier: 1, levelMin: 105, cumulXp: 1, kmMin: 450 },
      { gradeId: 'olympien', tier: 2, levelMin: 113, cumulXp: 2, kmMin: 620, sessionsMin: 215 }
    ];
    const t1 = evaluateTierRowConditions(rows[0], {
      level: 110,
      aggregates: { lifetimeRunningKm: 500 }
    });
    expect(t1.met).toBe(true);
    const t2 = evaluateTierRowConditions(rows[1], {
      level: 115,
      aggregates: { lifetimeRunningKm: 500, qualifiedSessions: 200 }
    });
    expect(t2.met).toBe(false);
  });

  it('maxTierInGradeWithConditions olympien', () => {
    const tier = maxTierInGradeWithConditions('olympien', 121, {
      aggregates: { lifetimeRunningKm: 900, lifetimeActiveKcal: 60000, qualifiedSessions: 220 }
    });
    expect(tier).toBe(3);
  });

  it('resolveSportGrades keeps novice when gates fail', () => {
    const g = resolveSportGrades({
      level: 5,
      masteryScore: 0,
      aggregates: { qualifiedSessions: 0, lifetimeReps: 0, lifetimeActiveKcal: 0, lifetimeRunningKm: 0 },
      workoutData: {}
    });
    expect(g.merited.gradeId).toBe('novice');
    expect(g.progression.gradeId).toBe('novice');
  });
});
