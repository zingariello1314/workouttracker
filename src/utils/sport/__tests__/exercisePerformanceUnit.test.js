import { describe, expect, it } from 'vitest';
import { resolveExercisePerformance, structuredBestSetReps } from '../exercisePerformanceUnit';

function snap(extra = {}) {
  return { reps: {}, checkedExercises: {}, exerciseSetLogs: {}, exerciseMaxRecords: [], ...extra };
}

describe('resolveExercisePerformance', () => {
  it('lit 4 séries de 12 : meilleure série 12, volume 48, pas un record de 48', () => {
    const key = '2026-08-10_101';
    const snapshot = snap({
      reps: { [key]: '48' },
      exerciseSetLogs: {
        [key]: { sets: [{ reps: 12 }, { reps: 12 }, { reps: 12 }, { reps: 12 }] }
      }
    });
    const before = JSON.stringify(snapshot.exerciseMaxRecords);
    const row = resolveExercisePerformance(snapshot, key);
    expect(row.provenance).toBe('structured');
    expect(row.observed.bestSet).toBe(12);
    expect(row.observed.setCount).toBe(4);
    expect(row.sessionTotal).toBe(48);
    expect(row.unit).toBe('reps');
    expect(row.observed.bestSet).not.toBe(48);
    expect(JSON.stringify(snapshot.exerciseMaxRecords)).toBe(before);
  });

  it('prend la série la plus haute, pas le schéma 3×15', () => {
    const key = '2026-08-10_202';
    const row = resolveExercisePerformance(
      snap({
        reps: { [key]: '39' },
        exerciseSetLogs: { [key]: { sets: [{ reps: 15 }, { reps: 12 }, { reps: 12 }] } }
      }),
      key
    );
    expect(row.observed.bestSet).toBe(15);
    expect(row.observed.setCount).toBe(3);
    expect(row.sessionTotal).toBe(39);
  });

  it('laisse un total 48 sans log structuré en volume', () => {
    const key = '2026-08-10_101';
    const row = resolveExercisePerformance(snap({ reps: { [key]: '48' } }), key);
    expect(row.provenance).toBe('total_only');
    expect(row.observed).toBeNull();
    expect(row.sessionTotal).toBe(48);
    expect(row.unit).toBe('volume_only');
    expect(structuredBestSetReps(snap({ reps: { [key]: '48' } }), '2026-08-10', '101')).toBeNull();
  });

  it('ne transforme pas le total versé dans un seul set selon le programme', () => {
    const key = '2026-08-10_101';
    const snapshot = snap({
      reps: { [key]: '48' },
      exerciseSetLogs: { [key]: { sets: [{ reps: 48 }] } }
    });
    const row = resolveExercisePerformance(snapshot, key);
    expect(row.provenance).toBe('total_only');
    expect(row.observed).toBeNull();
    expect(row.program == null || row.program.provenance === 'program').toBe(true);
    expect(row.observed).toBeNull();
  });

  it('garde le record déclaré à 20 et la série observée à 22, sans écrire les Défis', () => {
    const key = '2026-08-10_101';
    const snapshot = snap({
      reps: { [key]: '44' },
      exerciseSetLogs: { [key]: { sets: [{ reps: 10 }, { reps: 22 }] } },
      exerciseMaxRecords: [
        { exerciseId: '101', reps: 20, performanceType: 'reps', recordDate: '2026-01-01' }
      ]
    });
    const row = resolveExercisePerformance(snapshot, key);
    expect(row.official.reps).toBe(20);
    expect(row.observed.bestSet).toBe(22);
    expect(row.provenance).toBe('structured');
    expect(snapshot.exerciseMaxRecords[0].reps).toBe(20);
  });

  it('ne fusionne pas deux exerciseId', () => {
    const snapshot = snap({
      reps: { '2026-08-10_101': '30', '2026-08-10_102': '40' },
      exerciseSetLogs: {
        '2026-08-10_101': { sets: [{ reps: 12 }, { reps: 12 }] },
        '2026-08-10_102': { sets: [{ reps: 8 }, { reps: 8 }] }
      }
    });
    expect(resolveExercisePerformance(snapshot, '2026-08-10_101').observed.bestSet).toBe(12);
    expect(resolveExercisePerformance(snapshot, '2026-08-10_102').observed.bestSet).toBe(8);
  });

  it('lit une charge comme weight_reps, pas comme un total de reps', () => {
    const key = '2026-08-10_501';
    const row = resolveExercisePerformance(
      snap({
        reps: { [key]: '24' },
        exerciseSetLogs: {
          [key]: { sets: [{ reps: 8, weightKg: 20 }, { reps: 6, weightKg: 24 }] }
        }
      }),
      key
    );
    expect(row.unit).toBe('weight_reps');
    expect(row.provenance).toBe('structured');
    expect(row.observed.bestSet).toEqual({ reps: 6, weightKg: 24 });
  });

  it('lit une durée sans la nommer en reps', () => {
    const key = '2026-08-10_900';
    const row = resolveExercisePerformance(
      snap({
        exerciseSetLogs: { [key]: { sets: [{ durationSec: 45 }, { durationSec: 60 }] } }
      }),
      key
    );
    expect(row.unit).toBe('duration');
    expect(row.observed.bestSet).toBe(60);
    expect(JSON.stringify(row.observed)).not.toMatch(/reps/);
  });
});
