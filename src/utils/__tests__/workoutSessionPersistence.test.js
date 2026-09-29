import { describe, it, expect } from 'vitest';
import {
  extractDaySliceFromAggregate,
  mergeSessionDaysIntoAggregate,
  listLegacySessionDatesInAggregate,
  workoutMetadataFingerprint,
  sessionSliceHasStoredDay,
} from '../workoutSessionPersistence.js';

describe('workoutSessionPersistence', () => {
  it('sessionSliceHasStoredDay ignore les maps vides', () => {
    const empty = extractDaySliceFromAggregate({ reps: {}, checkedExercises: {} }, '2026-06-05');
    expect(sessionSliceHasStoredDay(empty)).toBe(false);
    const withReps = extractDaySliceFromAggregate(
      { reps: { '2026-06-05_101': '12' }, checkedExercises: {} },
      '2026-06-05'
    );
    expect(sessionSliceHasStoredDay(withReps)).toBe(true);
  });

  it('extractDaySliceFromAggregate isole les clés du jour', () => {
    const data = {
      reps: {
        '2026-06-05_101': '40',
        '2026-06-04_102': '20',
      },
      checkedExercises: {
        '2026-06-05_101': true,
      },
      dailyVariations: {
        '2026-06-05': { additionalExercises: [] },
      },
    };
    const slice = extractDaySliceFromAggregate(data, '2026-06-05');
    expect(slice.mapFields.reps).toEqual({ '2026-06-05_101': '40' });
    expect(slice.mapFields.checkedExercises).toEqual({ '2026-06-05_101': true });
    expect(slice.dailyVariations).toEqual({ '2026-06-05': { additionalExercises: [] } });
  });

  it('mergeSessionDaysIntoAggregate fusionne les lignes session', () => {
    const base = { reps: {}, checkedExercises: {} };
    const merged = mergeSessionDaysIntoAggregate(base, [
      {
        lastSaved: '2026-06-01T10:00:00.000Z',
        mapFields: { reps: { '2026-06-05_1': '10' } },
      },
      {
        lastSaved: '2026-06-02T10:00:00.000Z',
        mapFields: { reps: { '2026-06-05_1': '12' }, checkedExercises: { '2026-06-05_1': true } },
      },
    ]);
    expect(merged.reps['2026-06-05_1']).toBe('12');
    expect(merged.checkedExercises['2026-06-05_1']).toBe(true);
  });

  it('une ligne séance remplace le jour et laisse les autres dates', () => {
    const base = {
      reps: { '2026-06-05_1': '10', '2026-06-04_2': '8' },
      checkedExercises: { '2026-06-05_1': true, '2026-06-04_2': true },
    };
    const merged = mergeSessionDaysIntoAggregate(base, [
      {
        dateStr: '2026-06-05',
        mapFields: {
          reps: { '2026-06-05_9': '3' },
          checkedExercises: {},
        },
      },
    ]);
    expect(merged.reps['2026-06-05_1']).toBeUndefined();
    expect(merged.reps['2026-06-05_9']).toBe('3');
    expect(merged.reps['2026-06-04_2']).toBe('8');
    expect(merged.checkedExercises['2026-06-05_1']).toBeUndefined();
    expect(merged.checkedExercises['2026-06-04_2']).toBe(true);
  });

  it('listLegacySessionDatesInAggregate détecte les dates', () => {
    const dates = listLegacySessionDatesInAggregate({
      reps: { '2026-01-01_1': 1, '2026-01-02_2': 2 },
    });
    expect(dates).toEqual(['2026-01-01', '2026-01-02']);
  });

  it('workoutMetadataFingerprint ignore lastSaved', () => {
    const a = workoutMetadataFingerprint({ weekVariant: 'A', lastSaved: '1' });
    const b = workoutMetadataFingerprint({ weekVariant: 'A', lastSaved: '2' });
    expect(a).toBe(b);
  });
});
