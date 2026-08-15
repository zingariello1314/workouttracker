import { describe, expect, it } from 'vitest';
import {
  MOMENTUM_V1_PUSHUPS_MALE,
  resolveDemographicAgeBand,
  getDemographicLadderForExercise,
  resolveDemographicExerciseId
} from '../../../data/performanceBenchmarks/demographicGradeLadders';
import {
  resolveDemographicGradeIndices,
  resolveDemographicGradeFromMetrics
} from '../demographicGradeResolver';
import { resolveExerciseGradeForMetrics } from '../exerciseGradeEngine';
import { EXERCISE_BENCHMARK_REGISTRY } from '../../../utils/sport/exerciseBenchmarkRegistry';

describe('référentiel démographique pompes V1', () => {
  it('résout la tranche d’âge', () => {
    expect(resolveDemographicAgeBand(19)).toBe('18-20');
    expect(resolveDemographicAgeBand(30)).toBe('30-34');
    expect(resolveDemographicAgeBand(52)).toBe('45-50');
  });

  it('encode les seuils hommes 30–34 ans (Bronze II)', () => {
    const ladder = MOMENTUM_V1_PUSHUPS_MALE['30-34'];
    expect(ladder).toHaveLength(15);
    expect(ladder[4]).toMatchObject({ performanceRequired: 21, volumePerDay: 60 });
  });

  it('grade combiné = min perf série + volume jour', () => {
    const ladder = MOMENTUM_V1_PUSHUPS_MALE['30-34'];
    const highPerfLowVol = resolveDemographicGradeIndices(50, 30, ladder);
    expect(highPerfLowVol.performanceIdx).toBeGreaterThanOrEqual(9);
    expect(highPerfLowVol.volumeIdx).toBe(2);
    expect(highPerfLowVol.combinedIdx).toBe(2);

    const both = resolveDemographicGradeIndices(50, 200, ladder);
    expect(both.combinedIdx).toBeGreaterThanOrEqual(9);
  });

  it('intègre le moteur de grade pour name:pompes homme 30 ans', () => {
    const pushDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'pushups');
    const vitals = { weightKg: 75, heightCm: 175, age: 30, sex: 'male' };
    const metrics = { maxSetReps: 32, maxDailyTotalReps: 105, totalReps: 500, checkCount: 10 };

    const grade = resolveExerciseGradeForMetrics(metrics, pushDef, vitals, {
      catalogKey: 'name:pompes'
    });

    expect(grade.gradeLabel).toBe('Argent I');
    expect(grade.demographic?.ageBand).toBe('30-34');
    expect(grade.demographic?.combinedIdx).toBe(6);
  });

  it('cap le grade si volume jour insuffisant malgré gros pic', () => {
    const pushDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'pushups');
    const vitals = { weightKg: 75, heightCm: 175, age: 22, sex: 'male' };
    const metrics = { maxSetReps: 80, maxDailyTotalReps: 25, totalReps: 200, checkCount: 20 };

    const grade = resolveExerciseGradeForMetrics(metrics, pushDef, vitals, {
      catalogKey: 'name:pompes'
    });

    expect(grade.sortIndex).toBeLessThanOrEqual(1);
  });

  it('n’applique pas le référentiel classique aux pompes déclinées (fiche dédiée)', () => {
    expect(resolveDemographicExerciseId('name:pompes-declinees')).toBe('pushups_decline');
    const ladder = getDemographicLadderForExercise('name:pompes-declinees', 'pushups', {
      age: 30,
      sex: 'male'
    });
    expect(ladder).not.toBeNull();
    expect(ladder[14].performanceRequired).toBe(100);
  });

  it('resolveDemographicGradeFromMetrics lit max série strict', () => {
    const ladder = getDemographicLadderForExercise('name:pompes', 'pushups', { age: 30, sex: 'male' });
    const indices = resolveDemographicGradeFromMetrics(
      { maxSetReps: 18, maxDailyTotalReps: 100 },
      { ladder }
    );
    expect(indices.performanceIdx).toBe(3);
    expect(indices.volumeIdx).toBeGreaterThanOrEqual(5);
  });
});
