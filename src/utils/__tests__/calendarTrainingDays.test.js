import { describe, it, expect } from 'vitest';
import {
  buildSeriesFromEditorPrescription,
  seriesToEditorPrescription,
  applyEditorPrescriptionToExercise,
  defaultEditorPrescriptionForExercise
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

  it('produit 4×1 min pour un hold en minutes', () => {
    expect(
      buildSeriesFromEditorPrescription({
        volumeMode: 'minutes',
        setCount: 4,
        repsMin: 1,
        repsMax: 1,
        repsScope: 'total',
        useRange: false
      })
    ).toBe('4×1 min');
  });

  it('propose 3×1 min par défaut pour un wall sit', () => {
    const p = defaultEditorPrescriptionForExercise({ name: 'Wall sit' });
    expect(p.volumeMode).toBe('minutes');
    expect(p.setCount).toBe(3);
    expect(p.repsMin).toBe(1);
    expect(buildSeriesFromEditorPrescription(p)).toBe('3×1 min');
  });

  it('relit 4×1 min depuis series', () => {
    const p = seriesToEditorPrescription({ series: '4×1 min', name: 'Wall sit' });
    expect(p.volumeMode).toBe('minutes');
    expect(p.setCount).toBe(4);
    expect(p.repsMin).toBe(1);
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
