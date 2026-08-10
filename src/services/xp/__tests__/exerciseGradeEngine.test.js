import { describe, expect, it } from 'vitest';
import {
  resolveExerciseGradeForMetrics,
  countCheckedSessionsByBenchmark,
  extractLifetimeBenchmarkMetrics,
  buildExerciseGradeCatalog
} from '../exerciseGradeEngine';
import { EXERCISE_BENCHMARK_REGISTRY } from '../../../utils/sport/exerciseBenchmarkRegistry';

describe('countCheckedSessionsByBenchmark', () => {
  it('compte chaque clé cochée même sans reps', () => {
    const getName = (id) => (String(id) === '42' ? 'Pompes' : '');
    const snapshot = {
      checkedExercises: {
        '2026-08-10_42': true,
        '2026-08-09_42': true,
        '2026-08-10_99': true
      },
      reps: {}
    };
    const map = countCheckedSessionsByBenchmark(snapshot, getName);
    expect(map.get('pushups')).toBe(2);
  });
});

describe('extractLifetimeBenchmarkMetrics endurance', () => {
  it('inclut les sessions Défis pompes', () => {
    const snapshot = {
      checkedExercises: {},
      reps: {},
      enduranceData: {
        sessions: {
          pushups: [
            { date: '2026-01-10', count: 50 },
            { date: '2026-01-11', count: 30 }
          ]
        }
      }
    };
    const map = extractLifetimeBenchmarkMetrics(snapshot, () => 'Pompes');
    const m = map.get('pushups');
    expect(m.checkCount).toBe(2);
    expect(m.totalReps).toBe(80);
    expect(m.maxDailyTotalReps).toBe(50);
  });
});

describe('buildExerciseGradeCatalog', () => {
  it('inclut tout exercice avec reps même hors registre', () => {
    const snapshot = {
      checkedExercises: { '2026-03-01_99999': true },
      reps: { '2026-03-01_99999': '12' }
    };
    const rows = buildExerciseGradeCatalog(snapshot, () => 'Presse à cuisses', {
      weightKg: 75,
      heightCm: 175,
      age: 30
    });
    expect(rows.some((r) => r.benchmarkKey === 'ex:99999')).toBe(true);
  });
});

describe('resolveExerciseGradeForMetrics', () => {
  const pushDef = EXERCISE_BENCHMARK_REGISTRY.find((d) => d.key === 'pushups');

  it('retourne Bois sans activité', () => {
    const g = resolveExerciseGradeForMetrics(
      { maxDailyTotalReps: 0, totalReps: 0 },
      pushDef,
      { weightKg: 75, heightCm: 175, age: 30 }
    );
    expect(g.gradeLabel).toMatch(/Bois/);
    expect(g.hasActivity).toBe(false);
  });

  it('activité via coches seules', () => {
    const g = resolveExerciseGradeForMetrics(
      { checkCount: 3, maxDailyTotalReps: 0, totalReps: 0 },
      pushDef,
      { weightKg: 75, heightCm: 175, age: 30 }
    );
    expect(g.hasActivity).toBe(true);
    expect(g.checkCount).toBe(3);
  });
});
