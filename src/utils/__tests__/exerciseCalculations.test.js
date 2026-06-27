import { describe, it, expect } from 'vitest';
import {
  calculateAutoReps,
  normalizeSeriesForParsing,
  resolvePrescriptionAutofillValue,
  isCycle31EmbeddedProgram
} from '../exerciseCalculations';

describe('normalizeSeriesForParsing', () => {
  it('normalise tirets unicode et x minuscule', () => {
    expect(normalizeSeriesForParsing('4x8–15')).toBe('4×8-15');
  });

  it('retire les notes entre parenthèses', () => {
    expect(normalizeSeriesForParsing('4×12 (8 normales + 4 amplitude complète)')).toBe('4×12');
  });
});

describe('resolvePrescriptionAutofillValue — formats Cycle 3+1', () => {
  it('4×10-12 → total arrondi', () => {
    expect(resolvePrescriptionAutofillValue({ series: '4×10-12' }, { round: true })).toBe(44);
  });

  it('4×10 → 40', () => {
    expect(resolvePrescriptionAutofillValue({ series: '4×10' }, { round: true })).toBe(40);
  });

  it('30 sec → 30', () => {
    expect(resolvePrescriptionAutofillValue({ series: '30 sec', name: 'Mountain climbers' }, { round: true })).toBe(30);
  });

  it('1 min → 1', () => {
    expect(resolvePrescriptionAutofillValue({ series: '1 min', name: 'Planche' }, { round: true })).toBe(1);
  });

  it('3×30 sec → 30 (durée par série)', () => {
    expect(resolvePrescriptionAutofillValue({ series: '3×30 sec', name: 'Planche bras tendus' }, { round: true })).toBe(30);
  });

  it('20× → 20', () => {
    expect(resolvePrescriptionAutofillValue({ series: '20×' }, { round: true })).toBe(20);
  });

  it('5 cycles → 5', () => {
    expect(resolvePrescriptionAutofillValue({ series: '5 cycles' }, { round: true })).toBe(5);
  });

  it('12-15 par bras → moyenne 14', () => {
    expect(resolvePrescriptionAutofillValue({ series: '12-15 par bras' }, { round: true })).toBe(14);
  });

  it('3×max → null', () => {
    expect(resolvePrescriptionAutofillValue({ series: '3×max' }, { round: true })).toBeNull();
  });

  it('1×90min boxe → 90', () => {
    expect(resolvePrescriptionAutofillValue({ series: '1×90min', name: 'Boxe' }, { round: true })).toBe(90);
  });
});

describe('calculateAutoReps', () => {
  it('supporte 4×8–15 avec tiret unicode', () => {
    expect(calculateAutoReps('4×8–15', { round: true })).toBe(46);
  });
});

describe('isCycle31EmbeddedProgram', () => {
  it('reconnaît default et optimized', () => {
    expect(isCycle31EmbeddedProgram('default-program')).toBe(true);
    expect(isCycle31EmbeddedProgram('optimized-program')).toBe(true);
    expect(isCycle31EmbeddedProgram('custom')).toBe(false);
  });
});
