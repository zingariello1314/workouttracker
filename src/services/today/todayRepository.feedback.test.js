import { describe, it, expect } from 'vitest';
import { todayRepository } from './todayRepository.js';

function baseDay(feedback) {
  return {
    checkedExercises: {},
    reps: {},
    exerciseWeights: {},
    checkedStretches: {},
    enduranceData: { sessions: {}, challenges: [] },
    sessionFeedbacks: feedback ? { '2026-11-21': feedback } : {}
  };
}

describe('todayRepository session feedback', () => {
  it('ne supprime pas le feedback local si le jour serveur n’en contient pas', () => {
    const local = { ressenti: 8, notes: 'gardé', updatedAt: '2026-11-21T18:00:00.000Z' };
    const out = todayRepository.applyRemoteTodayToWorkoutData(
      baseDay(local),
      '2026-11-21',
      { serverDayPersisted: true, exerciseStates: {}, stretchStates: {} }
    );
    expect(out.sessionFeedbacks['2026-11-21'].notes).toBe('gardé');
    expect(out.sessionFeedbacks['2026-11-21'].ressenti).toBe(8);
  });

  it('ne laisse pas un feedback serveur plus ancien écraser le local', () => {
    const local = {
      ressenti: 8,
      updatedAt: '2026-11-21T19:00:00.000Z',
      traceLocale: 'oui'
    };
    const out = todayRepository.applyRemoteTodayToWorkoutData(baseDay(local), '2026-11-21', {
      serverDayPersisted: true,
      sessionFeedback: { ressenti: 2, updatedAt: '2026-11-21T08:00:00.000Z', traceServeur: 'ancienne' }
    });
    expect(out.sessionFeedbacks['2026-11-21'].ressenti).toBe(8);
    expect(out.sessionFeedbacks['2026-11-21'].traceLocale).toBe('oui');
    expect(out.sessionFeedbacks['2026-11-21'].traceServeur).toBe('ancienne');
  });

  it('prend le feedback serveur plus récent et conserve les clés seulement locales', () => {
    const local = {
      ressenti: 4,
      updatedAt: '2026-11-21T08:00:00.000Z',
      traceLocale: 'oui'
    };
    const out = todayRepository.applyRemoteTodayToWorkoutData(baseDay(local), '2026-11-21', {
      serverDayPersisted: true,
      sessionFeedback: { ressenti: 9, updatedAt: '2026-11-21T20:00:00.000Z' }
    });
    expect(out.sessionFeedbacks['2026-11-21'].ressenti).toBe(9);
    expect(out.sessionFeedbacks['2026-11-21'].traceLocale).toBe('oui');
  });
});
