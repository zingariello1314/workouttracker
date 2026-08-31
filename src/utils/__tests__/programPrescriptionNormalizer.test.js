import { describe, it, expect } from 'vitest';
import {
  parsePrescriptionFromSeries,
  normalizeExercisePrescription,
  getPrescriptionDisplayParts,
  isCycle31Program
} from '../programPrescriptionNormalizer';

describe('parsePrescriptionFromSeries', () => {
  it('3×10 par bras → 3×10/main', () => {
    const p = parsePrescriptionFromSeries('3×10 par bras');
    expect(p.setCount).toBe(3);
    expect(p.repsMin).toBe(10);
    expect(p.repsScope).toBe('per_hand');
    expect(p.displaySeries).toBe('3×10/main');
  });

  it('12-15 par bras → 3×12-15/main', () => {
    const p = parsePrescriptionFromSeries('12-15 par bras', { programCategory: 'muscu' });
    expect(p.setCount).toBe(3);
    expect(p.repsMin).toBe(12);
    expect(p.repsMax).toBe(15);
    expect(p.displaySeries).toBe('3×12-15/main');
  });

  it('12-15 → 3×12-15', () => {
    const p = parsePrescriptionFromSeries('12-15');
    expect(p.displaySeries).toBe('3×12-15');
  });

  it('15 → 3×15', () => {
    const p = parsePrescriptionFromSeries('15');
    expect(p.displaySeries).toBe('3×15');
  });

  it('3×max → skip', () => {
    expect(parsePrescriptionFromSeries('3×max').skip).toBe(true);
  });

  it('4×1 min wall sit', () => {
    const p = parsePrescriptionFromSeries('4×1 min', { name: 'Wall sit' });
    expect(p.skip).toBeFalsy();
    expect(p.volumeMode).toBe('minutes');
    expect(p.setCount).toBe(4);
    expect(p.repsMin).toBe(1);
    expect(p.displaySeries).toBe('4×1 min');
  });
});

describe('normalizeExercisePrescription', () => {
  it('ajoute meta structurée', () => {
    const { exercise, changed } = normalizeExercisePrescription({
      id: 1,
      name: 'Face pull',
      series: '15'
    });
    expect(changed).toBe(true);
    expect(exercise.series).toBe('3×15');
    expect(exercise.meta.setCount).toBe(3);
    expect(exercise.meta.repsMin).toBe(15);
    expect(exercise.meta.prescriptionNormalized).toBe(true);
  });
});

describe('getPrescriptionDisplayParts', () => {
  it('sépare séries et reps', () => {
    const parts = getPrescriptionDisplayParts({
      series: '3×10/main',
      meta: { setCount: 3, repsMin: 10, repsMax: 10, volumeMode: 'reps', repsScope: 'per_hand' }
    });
    expect(parts.setsLabel).toBe('3');
    expect(parts.repsLabel).toBe('10 par bras');
  });
});

describe('isCycle31Program', () => {
  it('id ou nom Cycle 3', () => {
    expect(isCycle31Program({ id: 'default-program' })).toBe(true);
    expect(isCycle31Program({ name: 'Programme Cycle 3+1' })).toBe(true);
    expect(isCycle31Program({ name: 'Mon programme perso' })).toBe(false);
  });
});
