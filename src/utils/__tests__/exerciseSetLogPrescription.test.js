import { describe, it, expect } from 'vitest';
import { buildSetLogFromPrescription } from '../exerciseSetLogUtils';
import { evaluateVolumeCompletion, getPlannedTotalFromPrescription } from '../programPrescriptionNormalizer';

describe('buildSetLogFromPrescription', () => {
  it('4×10 → 4 séries de 10', () => {
    const log = buildSetLogFromPrescription({
      series: '4×10',
      meta: { setCount: 4, repsMin: 10, repsMax: 10, volumeMode: 'reps', repsScope: 'total' }
    });
    expect(log.sets).toHaveLength(4);
    expect(log.sets.every((s) => s.reps === 10)).toBe(true);
  });

  it('redistribue un total saisi', () => {
    const log = buildSetLogFromPrescription(
      {
        series: '3×10',
        meta: { setCount: 3, repsMin: 10, repsMax: 10, volumeMode: 'reps', repsScope: 'total' }
      },
      { totalReps: 28 }
    );
    expect(log.sets.reduce((s, x) => s + x.reps, 0)).toBe(28);
  });
});

describe('evaluateVolumeCompletion', () => {
  it('détecte objectif atteint', () => {
    const ex = {
      series: '3×10',
      meta: { setCount: 3, repsMin: 10, repsMax: 10, volumeMode: 'reps' }
    };
    expect(getPlannedTotalFromPrescription(ex)).toBe(30);
    expect(evaluateVolumeCompletion(ex, 30).status).toBe('complete');
    expect(evaluateVolumeCompletion(ex, 28).status).toBe('near');
  });
});
