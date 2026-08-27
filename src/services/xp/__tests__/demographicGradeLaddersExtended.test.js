import { describe, expect, it } from 'vitest';
import {
  MOMENTUM_V1_PULLUPS_MALE,
  MOMENTUM_V1_DIPS_MALE,
  MOMENTUM_V1_PUSHUPS_TENSION_MALE,
  MOMENTUM_V1_PUSHUPS_INCLINE_MALE,
  MOMENTUM_V1_PUSHUPS_DECLINE_MALE,
  MOMENTUM_V1_PULLUPS_SUPINATION_MALE,
  MOMENTUM_V1_PUSHUPS_MALE,
  MOMENTUM_V1_CURL_DUMBBELL_MALE,
  MOMENTUM_V1_CURL_ZOTTMAN_MALE,
  resolveDemographicExerciseId,
  getDemographicLadderForExercise
} from '../../../data/performanceBenchmarks/demographicGradeLadders';
import { adjustPullupPerformanceReps } from '../pullupPerformanceAdjust';
import {
  resolveDemographicGradeFromMetrics,
  resolveDemographicGradeIndices
} from '../demographicGradeResolver';
import { resolveExerciseGradeForMetrics } from '../exerciseGradeEngine';
import { EXERCISE_BENCHMARK_REGISTRY } from '../../../utils/sport/exerciseBenchmarkRegistry';

describe('tractions pronation V1', () => {
  const ladder = MOMENTUM_V1_PULLUPS_MALE['25-29'];

  it('identifie le catalogue tractions pronation', () => {
    expect(resolveDemographicExerciseId('name:tractions-pronation')).toBe('pullups_pronation');
    expect(resolveDemographicExerciseId('pullups_strict')).toBe('pullups_pronation');
    expect(resolveDemographicExerciseId('name:tractions-supination')).toBe('pullups_supination');
  });

  it('Platine III = 30 reps / 60 vol jour à 75 kg', () => {
    expect(ladder[14]).toMatchObject({ performanceRequired: 30, volumePerDay: 60 });
  });

  it('ajuste la perf selon le poids — 15 reps à 100 kg > 15 reps à 60 kg', () => {
    const heavy = adjustPullupPerformanceReps(15, 100);
    const light = adjustPullupPerformanceReps(15, 60);
    expect(heavy).toBeGreaterThan(light);
    expect(heavy).toBeGreaterThan(15);
    expect(light).toBeLessThan(15);
  });

  it('100 kg × 15 reps brutes → Or II (16 eq.) pour 25–29 ans', () => {
    const pullDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'pullups_strict');
    const vitals = { weightKg: 100, heightCm: 180, age: 25, sex: 'male' };
    const metrics = { maxSetReps: 15, maxDailyTotalReps: 40, totalReps: 200, checkCount: 10 };
    const grade = resolveExerciseGradeForMetrics(metrics, pullDef, vitals, {
      catalogKey: 'name:tractions-pronation'
    });
    expect(grade.demographic?.adjustedPeakReps).toBeGreaterThanOrEqual(16);
    expect(grade.gradeLabel).toBe('Or II');
  });

  it('60 kg × 15 reps brutes → Argent III (12 eq.) pour 25–29 ans', () => {
    const pullDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'pullups_strict');
    const vitals = { weightKg: 60, heightCm: 175, age: 25, sex: 'male' };
    const metrics = { maxSetReps: 15, maxDailyTotalReps: 40, totalReps: 200, checkCount: 10 };
    const grade = resolveExerciseGradeForMetrics(metrics, pullDef, vitals, {
      catalogKey: 'name:tractions-pronation'
    });
    expect(grade.demographic?.adjustedPeakReps).toBeLessThan(14);
    expect(grade.sortIndex).toBeLessThanOrEqual(8);
  });

  it('volume jour cumulé — pas une série unique', () => {
    const indices = resolveDemographicGradeIndices(20, 55, ladder);
    expect(indices.volumeIdx).toBeGreaterThanOrEqual(13);
    expect(indices.performanceIdx).toBe(11);
    expect(indices.combinedIdx).toBe(11);
  });
});

describe('dips V1', () => {
  it('résout le catalogue dips', () => {
    expect(resolveDemographicExerciseId('dips')).toBe('dips');
  });

  it('Platine III homme 30 ans = 33 reps / 200 vol', () => {
    const ladder = MOMENTUM_V1_DIPS_MALE['30-34'];
    expect(ladder[14]).toMatchObject({ performanceRequired: 33, volumePerDay: 200 });
  });

  it('grade Argent I avec 17 reps et 100 vol', () => {
    const dipsDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'dips');
    const vitals = { weightKg: 80, heightCm: 180, age: 30, sex: 'male' };
    const metrics = { maxSetReps: 17, maxDailyTotalReps: 100, totalReps: 500, checkCount: 8 };
    const grade = resolveExerciseGradeForMetrics(metrics, dipsDef, vitals, {
      catalogKey: 'dips'
    });
    expect(grade.gradeLabel).toBe('Argent I');
  });

  it('baisse légère après 45 ans', () => {
    const ladder45 = MOMENTUM_V1_DIPS_MALE['45-50'];
    expect(ladder45[14].performanceRequired).toBe(31);
    expect(ladder45[0].performanceRequired).toBe(3);
  });
});

describe('pompes tension continue V1', () => {
  it('catalogue dédié', () => {
    expect(resolveDemographicExerciseId('name:pompes-en-tension-continue')).toBe('pushups_tension');
    expect(getDemographicLadderForExercise('name:pompes', null, { age: 25, sex: 'male' })).toBeTruthy();
    expect(
      getDemographicLadderForExercise('name:pompes-en-tension-continue', null, { age: 25, sex: 'male' })
    ).not.toBe(getDemographicLadderForExercise('name:pompes', null, { age: 25, sex: 'male' }));
  });

  it('Platine III plafonné à 80 reps / 400 vol', () => {
    const ladder = MOMENTUM_V1_PUSHUPS_TENSION_MALE['30-34'];
    expect(ladder[14]).toMatchObject({ performanceRequired: 80, volumePerDay: 400 });
  });

  it('grade Or I avec 62 reps et 180 vol', () => {
    const demographic = {
      ladder: MOMENTUM_V1_PUSHUPS_TENSION_MALE['25-29'],
      exerciseId: 'pushups_tension'
    };
    const indices = resolveDemographicGradeFromMetrics(
      { maxSetReps: 62, maxDailyTotalReps: 180 },
      demographic,
      { age: 28, sex: 'male' }
    );
    expect(indices.combinedIdx).toBe(9);
  });
});

describe('pompes inclinées V1', () => {
  it('catalogue et Platine III = 150 reps', () => {
    expect(resolveDemographicExerciseId('name:pompes-inclinees')).toBe('pushups_incline');
    const ladder = MOMENTUM_V1_PUSHUPS_INCLINE_MALE['30-34'];
    expect(ladder[14]).toMatchObject({ performanceRequired: 150, volumePerDay: 400 });
  });

  it('hiérarchie inclinées > classiques au Platine III', () => {
    const classic = MOMENTUM_V1_PUSHUPS_MALE['25-29'][14].performanceRequired;
    const incline = MOMENTUM_V1_PUSHUPS_INCLINE_MALE['25-29'][14].performanceRequired;
    expect(incline).toBeGreaterThan(classic);
  });

  it('grade Argent I avec 75 reps et 100 vol', () => {
    const pushDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'pushups');
    const vitals = { weightKg: 75, heightCm: 175, age: 22, sex: 'male' };
    const metrics = { maxSetReps: 75, maxDailyTotalReps: 100, totalReps: 300, checkCount: 5 };
    const grade = resolveExerciseGradeForMetrics(metrics, pushDef, vitals, {
      catalogKey: 'name:pompes-inclinees'
    });
    expect(grade.gradeLabel).toBe('Argent I');
  });
});

describe('pompes déclinées V1', () => {
  it('Platine III = 100 reps, tables stables par âge', () => {
    const ladder = MOMENTUM_V1_PUSHUPS_DECLINE_MALE['45-50'];
    expect(ladder[14]).toMatchObject({ performanceRequired: 100, volumePerDay: 400 });
    expect(MOMENTUM_V1_PUSHUPS_DECLINE_MALE['18-20'][0]).toMatchObject({ performanceRequired: 10 });
  });

  it('ajuste la perf selon le poids (exposant 0,5)', () => {
    const pushDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'pushups');
    const vitalsHeavy = { weightKg: 95, heightCm: 180, age: 28, sex: 'male' };
    const vitalsLight = { weightKg: 65, heightCm: 175, age: 28, sex: 'male' };
    const metrics = { maxSetReps: 52, maxDailyTotalReps: 100, totalReps: 400, checkCount: 8 };
    const heavy = resolveExerciseGradeForMetrics(metrics, pushDef, vitalsHeavy, {
      catalogKey: 'name:pompes-declinees'
    });
    const light = resolveExerciseGradeForMetrics(metrics, pushDef, vitalsLight, {
      catalogKey: 'name:pompes-declinees'
    });
    expect(heavy.demographic?.adjustedPeakReps).toBeGreaterThan(light.demographic?.adjustedPeakReps);
  });
});

describe('tractions supination V1', () => {
  it('catalogue séparé de la pronation', () => {
    expect(resolveDemographicExerciseId('name:tractions-supination')).toBe('pullups_supination');
    expect(resolveDemographicExerciseId('name:tractions-pronation')).toBe('pullups_pronation');
  });

  it('Platine III = 50 reps perf / 400 vol jour', () => {
    const ladder = MOMENTUM_V1_PULLUPS_SUPINATION_MALE['35-39'];
    expect(ladder[14]).toMatchObject({ performanceRequired: 50, volumePerDay: 400 });
  });

  it('grade Or I avec 33 reps et 180 vol', () => {
    const pullDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'pullups_strict');
    const vitals = { weightKg: 75, heightCm: 175, age: 25, sex: 'male' };
    const metrics = { maxSetReps: 33, maxDailyTotalReps: 180, totalReps: 500, checkCount: 10 };
    const grade = resolveExerciseGradeForMetrics(metrics, pullDef, vitals, {
      catalogKey: 'name:tractions-supination'
    });
    expect(grade.gradeLabel).toBe('Or I');
  });
});

describe('curls haltère V1', () => {
  const curlDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'dumbbell_curl');
  const hammerDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'hammer_curl');
  const zottmanDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'zottman_curl');

  it('catalogue séparé classique / marteau / Zottman', () => {
    expect(resolveDemographicExerciseId('dumbbell_curl')).toBe('dumbbell_curl');
    expect(resolveDemographicExerciseId('hammer_curl')).toBe('hammer_curl');
    expect(resolveDemographicExerciseId('zottman_curl')).toBe('zottman_curl');
    expect(zottmanDef).toBeTruthy();
  });

  it('Platine III curl classique 25–29 = 45 kg / 650 kg vol', () => {
    const ladder = MOMENTUM_V1_CURL_DUMBBELL_MALE['25-29'];
    expect(ladder[14]).toMatchObject({ performanceRequired: 45, volumePerDay: 650 });
  });

  it('Platine III Zottman 18–20 = 40 kg / 600 kg vol (plus exigeant)', () => {
    const ladder = MOMENTUM_V1_CURL_ZOTTMAN_MALE['18-20'];
    expect(ladder[14]).toMatchObject({ performanceRequired: 40, volumePerDay: 600 });
  });

  it('ne mélange pas curl 36 kg et marteau 36 kg', () => {
    const vitals = { weightKg: 75, heightCm: 175, age: 27, sex: 'male' };
    const metrics = {
      estimatedOneRmKg: 36,
      maxWeightKg: 36,
      maxDailyVolumeKg: 495,
      checkCount: 10
    };
    const classic = resolveExerciseGradeForMetrics(metrics, curlDef, vitals, {
      catalogKey: 'dumbbell_curl'
    });
    const hammer = resolveExerciseGradeForMetrics(metrics, hammerDef, vitals, {
      catalogKey: 'hammer_curl'
    });
    expect(classic.gradeLabel).toBe('Or III');
    expect(hammer.gradeLabel).toBe('Or II');
  });

  it('normalise le 1RM au poids — 30 kg à 70 kg > 30 kg à 100 kg', () => {
    const metrics = {
      estimatedOneRmKg: 30,
      maxWeightKg: 30,
      maxDailyVolumeKg: 400,
      checkCount: 8
    };
    const light = resolveExerciseGradeForMetrics(
      metrics,
      curlDef,
      { weightKg: 70, heightCm: 175, age: 27, sex: 'male' },
      { catalogKey: 'dumbbell_curl' }
    );
    const heavy = resolveExerciseGradeForMetrics(
      metrics,
      curlDef,
      { weightKg: 100, heightCm: 180, age: 27, sex: 'male' },
      { catalogKey: 'dumbbell_curl' }
    );
    expect(light.demographic?.adjustedPeakReps).toBeGreaterThan(heavy.demographic?.adjustedPeakReps);
  });

  it('volume = tonnage jour, pas les reps brutes', () => {
    const vitals = { weightKg: 75, heightCm: 175, age: 22, sex: 'male' };
    const highTonnage = resolveExerciseGradeForMetrics(
      { estimatedOneRmKg: 30, maxDailyVolumeKg: 400, maxDailyTotalReps: 10, checkCount: 5 },
      curlDef,
      vitals,
      { catalogKey: 'dumbbell_curl' }
    );
    const lowTonnage = resolveExerciseGradeForMetrics(
      { estimatedOneRmKg: 30, maxDailyVolumeKg: 100, maxDailyTotalReps: 400, checkCount: 5 },
      curlDef,
      vitals,
      { catalogKey: 'dumbbell_curl' }
    );
    expect(highTonnage.gradeLabel).toBe('Or I');
    expect(lowTonnage.sortIndex).toBeLessThan(highTonnage.sortIndex);
  });
});
