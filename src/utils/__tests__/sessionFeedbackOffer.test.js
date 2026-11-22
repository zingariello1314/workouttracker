import { describe, expect, it } from 'vitest';
import {
  countRelevantExercisesForDate,
  isSessionFeedbackAutoOpenEnabled,
  markSessionFeedbackInvitation,
  readSessionFeedbackInvitation,
  shouldOfferSessionFeedback
} from '../sessionFeedbackOffer.js';

function memoryStorage() {
  const bag = new Map();
  return {
    getItem: (k) => (bag.has(k) ? bag.get(k) : null),
    setItem: (k, v) => {
      bag.set(k, String(v));
    },
    removeItem: (k) => {
      bag.delete(k);
    }
  };
}

describe('shouldOfferSessionFeedback', () => {
  const base = {
    saveSucceeded: true,
    hasRelevantExercises: true,
    existingFeedback: null,
    autoOpenEnabled: true,
    invitationStatus: null
  };

  it('ouvre après une sauvegarde réussie éligible', () => {
    expect(shouldOfferSessionFeedback(base)).toEqual({ offer: true, reason: 'eligible' });
  });

  it('n’ouvre pas si la sauvegarde a échoué', () => {
    expect(shouldOfferSessionFeedback({ ...base, saveSucceeded: false })).toEqual({
      offer: false,
      reason: 'save_failed'
    });
  });

  it('n’ouvre pas sans exercice enregistré', () => {
    expect(shouldOfferSessionFeedback({ ...base, hasRelevantExercises: 0 })).toEqual({
      offer: false,
      reason: 'no_exercises'
    });
    expect(shouldOfferSessionFeedback({ ...base, hasRelevantExercises: false })).toEqual({
      offer: false,
      reason: 'no_exercises'
    });
  });

  it('n’ouvre pas si un feedback rempli existe déjà', () => {
    expect(
      shouldOfferSessionFeedback({ ...base, existingFeedback: { ressenti: 7 } })
    ).toEqual({ offer: false, reason: 'feedback_exists' });
  });

  it('n’ouvre pas si l’invitation a déjà été proposée ou fermée', () => {
    expect(
      shouldOfferSessionFeedback({ ...base, invitationStatus: 'offered' })
    ).toEqual({ offer: false, reason: 'already_invited' });
    expect(
      shouldOfferSessionFeedback({ ...base, invitationStatus: 'dismissed' })
    ).toEqual({ offer: false, reason: 'already_invited' });
  });

  it('n’ouvre pas si la préférence est désactivée', () => {
    expect(shouldOfferSessionFeedback({ ...base, autoOpenEnabled: false })).toEqual({
      offer: false,
      reason: 'pref_disabled'
    });
  });

  it('ne traite pas un feedback vide (douleur 0) comme existant', () => {
    expect(
      shouldOfferSessionFeedback({
        ...base,
        existingFeedback: { douleur: 0, partenaire: false }
      })
    ).toEqual({ offer: true, reason: 'eligible' });
  });
});

describe('countRelevantExercisesForDate', () => {
  it('compte les coches du jour et les exceptionnels complétés', () => {
    const n = countRelevantExercisesForDate(
      {
        checkedExercises: {
          '2026-11-21_1': true,
          '2026-11-21_2': false,
          '2026-11-20_9': true
        },
        dailyVariations: {
          '2026-11-21': {
            additionalExercises: [{ completed: true }, { completed: false }]
          }
        }
      },
      '2026-11-21'
    );
    expect(n).toBe(2);
  });
});

describe('invitation storage', () => {
  it('persiste offered / dismissed par date sans affecter les autres jours', () => {
    const storage = memoryStorage();
    expect(readSessionFeedbackInvitation('2026-11-21', storage)).toBeNull();
    markSessionFeedbackInvitation('2026-11-21', 'offered', storage);
    expect(readSessionFeedbackInvitation('2026-11-21', storage)).toBe('offered');
    markSessionFeedbackInvitation('2026-11-21', 'dismissed', storage);
    markSessionFeedbackInvitation('2026-11-22', 'offered', storage);
    expect(readSessionFeedbackInvitation('2026-11-21', storage)).toBe('dismissed');
    expect(readSessionFeedbackInvitation('2026-11-22', storage)).toBe('offered');
  });
});

describe('isSessionFeedbackAutoOpenEnabled', () => {
  it('est activé par défaut', () => {
    expect(isSessionFeedbackAutoOpenEnabled(undefined)).toBe(true);
    expect(isSessionFeedbackAutoOpenEnabled({})).toBe(true);
    expect(isSessionFeedbackAutoOpenEnabled({ sessionFeedbackAutoOpen: true })).toBe(true);
    expect(isSessionFeedbackAutoOpenEnabled({ sessionFeedbackAutoOpen: false })).toBe(false);
  });
});
