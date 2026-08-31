import { describe, expect, it } from 'vitest';
import {
  calendarDayHasEmptyWorkoutStats,
  calendarDayUsesMinimalDetailView,
  overlayPersistedDayJustifications,
  shouldOfferDayJustificationInDetail,
  shouldOpenWorkoutChoicePanel,
  stripJustificationsSupersededByActivity
} from '../dayJustificationUtils';

describe('calendarDayHasEmptyWorkoutStats', () => {
  it('retourne true quand reps, exos et durée sont à 0', () => {
    expect(
      calendarDayHasEmptyWorkoutStats({ reps: 0, completedCount: 0, duration: 0, level: 2 })
    ).toBe(true);
  });

  it('retourne false dès qu’une stat est non nulle', () => {
    expect(
      calendarDayHasEmptyWorkoutStats({ reps: 5, completedCount: 0, duration: 0 })
    ).toBe(false);
    expect(
      calendarDayHasEmptyWorkoutStats({ reps: 0, completedCount: 1, duration: 0 })
    ).toBe(false);
    expect(
      calendarDayHasEmptyWorkoutStats({ reps: 0, completedCount: 0, duration: 12 })
    ).toBe(false);
  });
});

describe('calendarDayUsesMinimalDetailView', () => {
  it('active la vue minimale si justification dans dayJustifications', () => {
    expect(
      calendarDayUsesMinimalDetailView(
        { reps: 0, completedCount: 0, duration: 0, level: 2 },
        {
          dayJustifications: {
            '2026-08-11': { reason: 'repos', createdAt: '2026-08-11T12:00:00.000Z' }
          }
        },
        '2026-08-11'
      )
    ).toBe(true);
  });
});

describe('shouldOpenWorkoutChoicePanel', () => {
  it('n’ouvre pas le panneau choix si le jour est déjà justifié repos', () => {
    expect(
      shouldOpenWorkoutChoicePanel(
        {
          dayJustifications: {
            '2026-08-06': { reason: 'repos', createdAt: '2026-08-06T12:00:00.000Z' }
          }
        },
        '2026-08-06',
        null,
        { reps: 0, completedCount: 0, duration: 0, level: 0 }
      )
    ).toBe(false);
  });

  it('n’ouvre pas le panneau choix si stats muscu vides (0/0/0)', () => {
    expect(
      shouldOpenWorkoutChoicePanel(
        { dayJustifications: {} },
        '2026-08-06',
        null,
        { reps: 0, completedCount: 0, duration: 0, level: 2 }
      )
    ).toBe(false);
  });
});

describe('shouldOfferDayJustificationInDetail', () => {
  it('propose la justification si stats vides et pas déjà justifié', () => {
    expect(
      shouldOfferDayJustificationInDetail(
        { reps: 0, completedCount: 0, duration: 0 },
        { dayJustifications: {} },
        '2026-08-11'
      )
    ).toBe(true);
  });

  it('refuse si le jour est déjà justifié', () => {
    expect(
      shouldOfferDayJustificationInDetail(
        { reps: 0, completedCount: 0, duration: 0 },
        {
          dayJustifications: {
            '2026-08-11': { reason: 'repos', createdAt: '2026-08-11T12:00:00.000Z' }
          }
        },
        '2026-08-11'
      )
    ).toBe(false);
  });
});

describe('overlayPersistedDayJustifications', () => {
  it('remplace les justifications figées du brouillon par celles persistées', () => {
    const draft = {
      checkedExercises: { '2026-08-31_1': true },
      dayJustifications: {
        '2026-08-10': { reason: 'repos', createdAt: '2026-08-10T12:00:00.000Z' }
      }
    };
    const persisted = {
      dayJustifications: {
        '2026-08-30': { reason: 'maladie', createdAt: '2026-08-30T12:00:00.000Z' }
      },
      dayJustificationsVersion: '1.0'
    };
    const next = overlayPersistedDayJustifications(draft, persisted);
    expect(next.checkedExercises).toEqual(draft.checkedExercises);
    expect(next.dayJustifications).toEqual(persisted.dayJustifications);
    expect(next.dayJustifications).not.toHaveProperty('2026-08-10');
  });
});

describe('stripJustificationsSupersededByActivity', () => {
  it('retire la justification d’un jour qui a une séance cochée', () => {
    const data = {
      checkedExercises: { '2026-08-31_101': true },
      enduranceData: { sessions: {} },
      dayJustifications: {
        '2026-08-31': { reason: 'repos', createdAt: '2026-08-31T12:00:00.000Z' },
        '2026-08-30': { reason: 'flemme', createdAt: '2026-08-30T12:00:00.000Z' }
      }
    };
    const next = stripJustificationsSupersededByActivity(data);
    expect(next.dayJustifications).not.toHaveProperty('2026-08-31');
    expect(next.dayJustifications['2026-08-30'].reason).toBe('flemme');
  });
});
