import { describe, expect, it } from 'vitest';
import {
  collectCoverageTags,
  selectConditionalQuestions
} from '../sessionFeedbackConditional.js';
import { ANSWER_STATES, makeAnswer } from '../sessionFeedbackCatalog.js';

const answered = (value) => makeAnswer(ANSWER_STATES.ANSWERED, value);

describe('selectConditionalQuestions', () => {
  const partialSport = {
    isPartialVsPlan: true,
    planKnown: true,
    plannedExerciseCount: 5,
    recordedExerciseCount: 2,
    missingPlannedIds: ['c', 'd', 'e'],
    reliability: { plan: 'known', volume: 'measured', duration: 'unknown' }
  };

  it('déclenche la question partielle quand le plan est connu', () => {
    const result = selectConditionalQuestions({
      sportContext: partialSport,
      answers: {},
      maxPrimary: 1
    });
    expect(result.selected[0]?.id).toBe('session_partial_status');
    expect(result.selected[0]?.trigger).toBe('partial_vs_plan');
  });

  it('n’invente pas de partiel sans plan', () => {
    const result = selectConditionalQuestions({
      sportContext: {
        isPartialVsPlan: false,
        reliability: { plan: 'unknown' }
      },
      answers: { effort: answered(9) }
    });
    expect(result.selected.every((q) => q.id !== 'session_partial_status')).toBe(true);
  });

  it('pose effort_demand_reason pour effort élevé', () => {
    const result = selectConditionalQuestions({
      sportContext: { reliability: { plan: 'unknown' } },
      answers: { effort: answered(9) }
    });
    expect(result.selected[0]?.id).toBe('effort_demand_reason');
  });

  it('ne répète pas le facteur limitant si fatigue déjà déclarée via partiel', () => {
    const answers = {
      session_partial_status: answered('fatigue'),
      effort: answered(9)
    };
    const tags = collectCoverageTags(answers);
    expect(tags.has('reason_fatigue')).toBe(true);
    const result = selectConditionalQuestions({
      sportContext: partialSport,
      answers
    });
    expect(result.selected.some((q) => q.id === 'effort_demand_reason')).toBe(false);
    expect(result.selected.some((q) => q.id === 'session_partial_status')).toBe(false);
  });

  it('propose adaptation_reason après adaptation volontaire', () => {
    const result = selectConditionalQuestions({
      answers: { session_partial_status: answered('adapted') }
    });
    expect(result.selected[0]?.id).toBe('adaptation_reason');
  });

  it('propose dissatisfaction_reason si ressenti bas + effort bas', () => {
    const result = selectConditionalQuestions({
      answers: {
        experience: answered(2),
        effort: answered(3)
      }
    });
    expect(result.selected[0]?.id).toBe('dissatisfaction_reason');
  });

  it('propose low_energy_reason si énergie initiale faible', () => {
    const result = selectConditionalQuestions({
      answers: { energy_before: answered(2) }
    });
    expect(result.selected[0]?.id).toBe('low_energy_reason');
  });

  it('propose intent_blocker si objectif non atteint', () => {
    const result = selectConditionalQuestions({
      answers: {
        session_intent: answered('force'),
        intent_attained: answered('no')
      }
    });
    expect(result.selected[0]?.id).toBe('intent_blocker');
  });

  it('limite à une question primaire', () => {
    const result = selectConditionalQuestions({
      sportContext: partialSport,
      answers: {
        effort: answered(9),
        energy_before: answered(2),
        experience: answered(2)
      },
      maxPrimary: 1
    });
    expect(result.selected).toHaveLength(1);
    expect(result.candidates.length).toBeGreaterThan(1);
  });

  it('signale painDetailSuggested sans forcer le diagnostic', () => {
    const result = selectConditionalQuestions({
      answers: { pain_presence: answered('yes') }
    });
    expect(result.painDetailSuggested).toBe(true);
  });

  it('liste les comparaisons historiques comme désactivées', () => {
    const result = selectConditionalQuestions({});
    expect(result.disabledHistorical).toContain('perf_drop_voluntary');
  });
});
