import { describe, expect, it } from 'vitest';
import { detectExerciseUnit, formatCalendarExerciseRecordedValue } from '../exerciseCalculations';

describe('formatCalendarExerciseRecordedValue', () => {
  it('affiche les reps classiques', () => {
    const ex = { name: 'Pompes', series: '4×10-12' };
    expect(formatCalendarExerciseRecordedValue(ex, 48).displayText).toBe('48 reps');
    expect(formatCalendarExerciseRecordedValue(ex, 48).isTimeBased).toBe(false);
  });

  it('affiche les secondes pour une planche', () => {
    const ex = { name: 'Planche bras tendus', series: '3×45 sec' };
    expect(formatCalendarExerciseRecordedValue(ex, 45).displayText).toBe('45 sec');
    expect(formatCalendarExerciseRecordedValue(ex, 45).isTimeBased).toBe(true);
  });

  it('affiche les minutes pour un wall sit', () => {
    const ex = { name: 'Wall sit', series: '1×3 min' };
    expect(formatCalendarExerciseRecordedValue(ex, 3).displayText).toBe('3 min');
    expect(formatCalendarExerciseRecordedValue(ex, 3).isTimeBased).toBe(true);
  });

  it('détecte wall sit sans unité explicite en minutes', () => {
    const ex = { name: 'Wall sit', series: '' };
    expect(detectExerciseUnit(ex)).toEqual({ unit: 'min', isTimeBased: true });
    expect(formatCalendarExerciseRecordedValue(ex, 3).displayText).toBe('3 min');
  });

  it('retourne une chaîne vide si valeur nulle', () => {
    const ex = { name: 'Pompes', series: '4×10' };
    expect(formatCalendarExerciseRecordedValue(ex, 0).displayText).toBe('');
  });
});
