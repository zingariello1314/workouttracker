import { describe, expect, it } from 'vitest';
import {
  calendarDayHasEmptyWorkoutStats,
  calendarDayUsesMinimalDetailView,
  shouldOfferDayJustificationInDetail,
  shouldOpenWorkoutChoicePanel
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
