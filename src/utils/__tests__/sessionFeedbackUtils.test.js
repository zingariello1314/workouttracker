import { describe, expect, it } from 'vitest';
import { extractDayFeedback } from '../sport/recapP35DayModel.js';
import {
  computeSessionFeedbackWeightedScore10,
  isSessionFeedbackFilled
} from '../sessionFeedbackUtils.js';
import { commitCatalogFeedback } from '../sessionFeedbackSchema.js';
import { ANSWER_STATES, makeAnswer } from '../sessionFeedbackCatalog.js';

const cell = (state, value = null) => makeAnswer(state, value);
const NOW = '2026-11-23T12:00:00.000Z';

describe('isSessionFeedbackFilled (minimal / catalogue)', () => {
  it('reconnaît effort 0 explicite', () => {
    const result = commitCatalogFeedback(
      null,
      { effort: cell(ANSWER_STATES.ANSWERED, 0) },
      { now: NOW, date: '2026-11-23' }
    );
    expect(result.ok).toBe(true);
    expect(isSessionFeedbackFilled(result.stored)).toBe(true);
  });

  it('reconnaît pain_presence: no seul', () => {
    const result = commitCatalogFeedback(
      null,
      { pain_presence: cell(ANSWER_STATES.ANSWERED, 'no') },
      { now: NOW, date: '2026-11-23' }
    );
    expect(isSessionFeedbackFilled(result.stored)).toBe(true);
  });

  it('reconnaît une seule note de ressenti', () => {
    const result = commitCatalogFeedback(
      null,
      { experience: cell(ANSWER_STATES.ANSWERED, 7) },
      { now: NOW, date: '2026-11-23' }
    );
    expect(isSessionFeedbackFilled(result.stored)).toBe(true);
  });

  it('ne traite pas douleur:0 legacy comme rempli', () => {
    expect(isSessionFeedbackFilled({ douleur: 0, partenaire: false })).toBe(false);
  });

  it('ne fabrique pas de score Récap sans dimensions numériques', () => {
    const result = commitCatalogFeedback(
      null,
      { pain_presence: cell(ANSWER_STATES.ANSWERED, 'no') },
      { now: NOW, date: '2026-11-23' }
    );
    expect(computeSessionFeedbackWeightedScore10(result.stored)).toBeNull();
    const day = extractDayFeedback(
      { sessionFeedbacks: { '2026-11-23': result.stored } },
      '2026-11-23'
    );
    expect(day.filled).toBe(true);
    expect(day.ressenti).toBeNull();
    expect(day.difficulte).toBeNull();
    expect(day.douleur).toBeNull();
  });

  it('laisse Récap lire les échelles quand elles existent (non-régression)', () => {
    const result = commitCatalogFeedback(
      null,
      {
        experience: cell(ANSWER_STATES.ANSWERED, 8),
        effort: cell(ANSWER_STATES.ANSWERED, 6),
        motivation_before: cell(ANSWER_STATES.ANSWERED, 7)
      },
      { now: NOW, date: '2026-11-23' }
    );
    const day = extractDayFeedback(
      { sessionFeedbacks: { '2026-11-23': result.stored } },
      '2026-11-23'
    );
    expect(day.ressenti).toBe(8);
    expect(day.difficulte).toBe(6);
    expect(day.motivation).toBe(7);
  });
});
