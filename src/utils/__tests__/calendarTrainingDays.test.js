import { describe, it, expect } from 'vitest';
import {
  buildSeriesFromEditorPrescription,
  seriesToEditorPrescription,
  applyEditorPrescriptionToExercise
} from '../prescriptionPickerUtils';
import { dayCountsAsCalendarTrainingDay } from '../sport/recapTrainingDayTruth';

describe('prescriptionPickerUtils', () => {
  it('parse 4×10 en listes', () => {
    const p = seriesToEditorPrescription({ series: '4×10' });
    expect(p.setCount).toBe(4);
    expect(p.repsMin).toBe(10);
    expect(buildSeriesFromEditorPrescription(p)).toBe('4×10');
  });

  it('applique changement séries', () => {
    const next = applyEditorPrescriptionToExercise({ series: '3×10' }, { setCount: 5 });
    expect(next.series).toBe('5×10');
    expect(next.meta.setCount).toBe(5);
  });
});

describe('dayCountsAsCalendarTrainingDay', () => {
  it('compte reps sans coche', () => {
    expect(
      dayCountsAsCalendarTrainingDay(
        { reps: { '2026-06-05_101': '40' }, checkedExercises: {} },
        '2026-06-05',
        null
      )
    ).toBe(true);
  });

  it('ignore jour vide', () => {
    expect(dayCountsAsCalendarTrainingDay({ reps: {}, checkedExercises: {} }, '2026-06-05', null)).toBe(
      false
    );
  });
});
