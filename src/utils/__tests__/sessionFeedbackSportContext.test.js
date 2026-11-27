import { describe, expect, it } from 'vitest';
import {
  buildSessionFeedbackSportContext,
  sportContextToSessionDataPayload
} from '../sessionFeedbackSportContext.js';
import {
  buildSessionFeedbackSummary,
  formatSessionFeedbackHeadline
} from '../sessionFeedbackSessionSummary.js';

describe('buildSessionFeedbackSportContext', () => {
  it('résout le volume depuis les maps cochées même si le matching programme échoue', () => {
    const ctx = buildSessionFeedbackSportContext({
      dateStr: '2026-11-23',
      workout: { name: 'Haut du corps', focus: 'Push', exercices: [] },
      programExercises: [],
      snapshot: {
        checkedExercises: {
          '2026-11-23_bench': true,
          '2026-11-23_row': true
        },
        reps: {
          '2026-11-23_bench': '40',
          '2026-11-23_row': '36'
        }
      }
    });
    expect(ctx.recordedExerciseCount).toBe(2);
    expect(ctx.totalReps).toBe(76);
    expect(ctx.hasRecordedWork).toBe(true);
    expect(ctx.sessionTitle).toBe('Haut du corps');
    expect(ctx.measuredDurationMinutes).toBeNull();
    expect(ctx.durationKind).toBe('unknown');
  });

  it('détecte une séance partielle vs plan sans la finaliser', () => {
    const ctx = buildSessionFeedbackSportContext({
      dateStr: '2026-11-23',
      workout: { name: 'Full', exercices: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] },
      programExercises: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }],
      snapshot: {
        checkedExercises: { '2026-11-23_a': true },
        reps: { '2026-11-23_a': '20' }
      }
    });
    expect(ctx.planKnown).toBe(true);
    expect(ctx.isPartialVsPlan).toBe(true);
    expect(ctx.missingPlannedIds).toEqual(['b', 'c']);
    expect(ctx.coverage).toBe('partial_vs_plan');
  });

  it('n’affiche pas de zéros dans le résumé quand le volume est inconnu', () => {
    const payload = sportContextToSessionDataPayload(
      buildSessionFeedbackSportContext({
        dateStr: '2026-11-23',
        workout: { name: 'Repos' },
        snapshot: {}
      })
    );
    const summary = buildSessionFeedbackSummary(payload);
    expect(summary.sessionDate).toBe('2026-11-23');
    expect(summary.exerciseCount).toBeNull();
    expect(summary.totalReps).toBeNull();
    expect(summary.durationMinutes).toBeNull();
    expect(formatSessionFeedbackHeadline(summary)).toMatch(/23 novembre/i);
  });

  it('inclut les exceptionnels complétés', () => {
    const ctx = buildSessionFeedbackSportContext({
      dateStr: '2026-11-23',
      snapshot: {
        dailyVariations: {
          '2026-11-23': {
            additionalExercises: [
              { id: 'ex1', name: 'Curl', type: 'reps', completed: true, totalReps: 30 }
            ]
          }
        }
      }
    });
    expect(ctx.totalReps).toBe(30);
    expect(ctx.recordedExercises[0].name).toBe('Curl');
  });
});
