import { describe, expect, it } from 'vitest';
import {
  buildSessionFeedbackSummary,
  formatSessionDurationLabel
} from '../sessionFeedbackSessionSummary.js';

describe('buildSessionFeedbackSummary', () => {
  it('n’invente pas de durée et évite N/Amin', () => {
    const s = buildSessionFeedbackSummary({
      date: '2026-11-23',
      exercises: [{ id: 1, reps: 10 }, { id: 2, reps: 5 }],
      totalReps: 15,
      duration: 0
    });
    expect(s.sessionDate).toBe('2026-11-23');
    expect(s.exerciseCount).toBe(2);
    expect(s.totalReps).toBe(15);
    expect(s.durationMinutes).toBeNull();
    expect(formatSessionDurationLabel(s.durationMinutes)).toBeNull();
  });

  it('n’affiche une durée que si mesurée', () => {
    const guessed = buildSessionFeedbackSummary({
      date: '2026-11-23',
      duration: 42,
      durationKind: 'unknown',
      exercises: []
    });
    expect(guessed.durationMinutes).toBeNull();

    const measured = buildSessionFeedbackSummary({
      date: '2026-11-23',
      duration: 42,
      durationKind: 'measured'
    });
    expect(measured.durationMinutes).toBe(42);
    expect(formatSessionDurationLabel(42)).toBe('42 min');
  });

  it('traite 0 exercice / 0 reps comme inconnus', () => {
    const s = buildSessionFeedbackSummary({
      date: '2026-11-23',
      exercises: [],
      totalReps: 0,
      totalExercises: 0
    });
    expect(s.exerciseCount).toBeNull();
    expect(s.totalReps).toBeNull();
  });

  it('état adapté sans séance', () => {
    const s = buildSessionFeedbackSummary(null);
    expect(s.hasSession).toBe(false);
    expect(s.sessionDate).toBeNull();
  });
});
