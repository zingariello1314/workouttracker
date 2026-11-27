import { describe, expect, it } from 'vitest';
import { extractDayFeedback } from '../sport/recapP35DayModel.js';
import { isSessionFeedbackFilled } from '../sessionFeedbackUtils.js';
import {
  ANSWER_STATES,
  RAPID_QUESTION_IDS,
  SESSION_FEEDBACK_QUESTIONS,
  getQuestion,
  listQuestions,
  makeAnswer
} from '../sessionFeedbackCatalog.js';
import {
  assessAnswerConsistency,
  hasSignificantCatalogAnswers,
  normalizeCatalogAnswers,
  suggestedClarifications,
  validateQuestionAnswer
} from '../sessionFeedbackValidate.js';
import {
  catalogAnswersFromStored,
  commitCatalogFeedback,
  mapCatalogAnswersToHistorical,
  readSessionFeedback
} from '../sessionFeedbackSchema.js';

const NOW = '2026-11-22T18:00:00.000Z';
const LATER = '2026-11-22T20:00:00.000Z';

function cell(state, value = null) {
  return makeAnswer(state, value);
}

describe('sessionFeedbackCatalog', () => {
  it('expose les quatre questions rapides avec référentiels temporels', () => {
    expect(RAPID_QUESTION_IDS).toEqual([
      'experience',
      'effort',
      'energy_before',
      'pain_presence'
    ]);
    expect(getQuestion('energy_after').promptFr).toMatch(/juste après la séance/);
    expect(getQuestion('energy_after').notMeasures).toContain('current_feeling_hours_later');
    expect(getQuestion('prochain_objectif').enabled).toBe(false);
    expect(getQuestion('perf_drop_voluntary').enabled).toBe(false);
  });

  it('liste les questions actives sans les futures', () => {
    const enabled = listQuestions({ enabledOnly: true });
    expect(enabled.some((q) => q.id === 'experience')).toBe(true);
    expect(enabled.some((q) => q.id === 'perf_rise_notice')).toBe(false);
  });
});

describe('validateQuestionAnswer / normalizeCatalogAnswers', () => {
  it('accepte toutes les valeurs d’échelle rapides autorisées', () => {
    for (let n = 1; n <= 10; n += 1) {
      expect(validateQuestionAnswer('experience', cell('answered', n)).ok).toBe(true);
      expect(validateQuestionAnswer('energy_before', cell('answered', n)).ok).toBe(true);
    }
    for (let n = 0; n <= 10; n += 1) {
      expect(validateQuestionAnswer('effort', cell('answered', n)).value).toBe(n);
    }
  });

  it('accepte les enums douleur / intention / lieu / météo', () => {
    expect(validateQuestionAnswer('pain_presence', cell('answered', 'no')).ok).toBe(true);
    expect(validateQuestionAnswer('pain_presence', cell('answered', 'yes')).ok).toBe(true);
    expect(validateQuestionAnswer('pain_presence', cell('answered', 'declined')).ok).toBe(true);
    expect(validateQuestionAnswer('session_intent', cell('answered', 'light')).ok).toBe(true);
    expect(validateQuestionAnswer('place', cell('answered', 'gym')).ok).toBe(true);
    expect(validateQuestionAnswer('weather', cell('answered', 'rainy')).ok).toBe(true);
    expect(validateQuestionAnswer('rest_band', cell('answered', '2_3')).ok).toBe(true);
    expect(validateQuestionAnswer('partner', cell('answered', 'alone')).ok).toBe(true);
  });

  it('rejette les valeurs inconnues sans les inventer', () => {
    expect(validateQuestionAnswer('experience', cell('answered', 11)).error).toBe('out_of_range');
    expect(validateQuestionAnswer('effort', cell('answered', -1)).error).toBe('out_of_range');
    expect(validateQuestionAnswer('pain_presence', cell('answered', 'maybe')).error).toBe(
      'invalid_enum'
    );
    expect(validateQuestionAnswer('ghost_field', cell('answered', 1)).error).toBe(
      'unknown_question'
    );
    expect(validateQuestionAnswer('experience', cell('answered', 'hot')).error).toBe(
      'invalid_number'
    );

    const { answers, errors } = normalizeCatalogAnswers({
      experience: cell('answered', 99),
      pain_presence: cell('answered', 'weird'),
      effort: cell('answered', 4)
    });
    expect(answers.experience.state).toBe(ANSWER_STATES.NOT_ANSWERED);
    expect(answers.pain_presence.state).toBe(ANSWER_STATES.NOT_ANSWERED);
    expect(answers.effort).toEqual({ state: 'answered', value: 4 });
    expect(errors.map((e) => e.id).sort()).toEqual(['experience', 'pain_presence']);
  });

  it('conserve les réponses ignorées (not_answered / declined / not_asked)', () => {
    expect(validateQuestionAnswer('experience', null).state).toBe(ANSWER_STATES.NOT_ANSWERED);
    expect(validateQuestionAnswer('experience', cell('not_answered')).value).toBeNull();
    expect(validateQuestionAnswer('pain_presence', cell('declined')).state).toBe(
      ANSWER_STATES.DECLINED
    );
    expect(validateQuestionAnswer('perf_drop_voluntary', cell('answered', 'yes')).state).toBe(
      ANSWER_STATES.NOT_ASKED
    );
  });

  it('filtre les tags multi_enum inconnus', () => {
    const result = validateQuestionAnswer(
      'context_tags',
      cell('answered', ['light_session', 'inconnu', 'interrupted'])
    );
    expect(result.ok).toBe(true);
    expect(result.value).toEqual(['light_session', 'interrupted']);
  });

  it('valide pain_exercise contre le contexte de séance', () => {
    expect(
      validateQuestionAnswer('pain_exercise', cell('answered', 'ex-1'), {
        allowedExerciseIds: ['ex-1', 'ex-2']
      }).ok
    ).toBe(true);
    expect(
      validateQuestionAnswer('pain_exercise', cell('answered', 'ex-99'), {
        allowedExerciseIds: ['ex-1']
      }).error
    ).toBe('exercise_not_in_session');
  });

  it('autorise l’enregistrement dès qu’une réponse significative est présente', () => {
    expect(hasSignificantCatalogAnswers({})).toBe(false);
    expect(
      hasSignificantCatalogAnswers({
        experience: cell('answered', 7)
      })
    ).toBe(true);
    expect(
      hasSignificantCatalogAnswers({
        effort: cell('answered', 0)
      })
    ).toBe(true);
    expect(
      hasSignificantCatalogAnswers({
        pain_presence: cell('answered', 'no')
      })
    ).toBe(true);
    expect(
      hasSignificantCatalogAnswers({
        notes: cell('not_answered', null)
      })
    ).toBe(false);
  });
});

describe('assessAnswerConsistency', () => {
  it('signale une contradiction douleur absente + limitation douleur', () => {
    const { issues } = assessAnswerConsistency({
      pain_presence: cell('answered', 'no'),
      primary_limiter: cell('answered', 'pain')
    });
    expect(issues.some((i) => i.id === 'pain_absent_vs_limiter_pain')).toBe(true);
    expect(suggestedClarifications({ issues })[0].blocking).toBe(false);
  });

  it('signale objectif aucun + atteint oui comme contradiction', () => {
    const { issues } = assessAnswerConsistency({
      session_intent: cell('answered', 'none'),
      intent_attained: cell('answered', 'yes')
    });
    expect(issues.some((i) => i.id === 'no_intent_vs_attained_yes')).toBe(true);
  });

  it('signale encore en cours + interrompue', () => {
    const { issues } = assessAnswerConsistency({
      session_partial_status: cell('answered', 'still_in_progress'),
      context_tags: cell('answered', ['interrupted'])
    });
    expect(issues.some((i) => i.id === 'in_progress_vs_interrupted')).toBe(true);
  });

  it('classe légère + adaptation fatigue comme inhabituel, pas contradiction', () => {
    const { issues } = assessAnswerConsistency({
      session_intent: cell('answered', 'light'),
      adaptation_reason: cell('answered', 'fatigue')
    });
    const hit = issues.find((i) => i.id === 'light_intent_vs_adaptation_reason');
    expect(hit.severity).toBe('unusual');
  });

  it('classe douleur inconnue + limiter douleur comme information insuffisante', () => {
    const { issues } = assessAnswerConsistency({
      primary_limiter: cell('answered', 'pain')
    });
    expect(issues.some((i) => i.id === 'pain_unknown_vs_limiter_pain' && i.severity === 'insufficient')).toBe(
      true
    );
  });

  it('marque douleur oui + limiter douleur comme compatible', () => {
    const { issues } = assessAnswerConsistency({
      pain_presence: cell('answered', 'yes'),
      primary_limiter: cell('answered', 'pain')
    });
    expect(issues.some((i) => i.id === 'pain_yes_limiter_pain' && i.severity === 'compatible')).toBe(
      true
    );
  });

  it('ne corrige jamais les réponses dans assessAnswerConsistency', () => {
    const answers = {
      pain_presence: cell('answered', 'no'),
      primary_limiter: cell('answered', 'pain')
    };
    assessAnswerConsistency(answers);
    expect(answers.primary_limiter.value).toBe('pain');
    expect(answers.pain_presence.value).toBe('no');
  });
});

describe('mapCatalogAnswersToHistorical / catalogAnswersFromStored', () => {
  it('mappe les miroirs historiques sans inventer nutrition/hydratation', () => {
    const { root, answers } = mapCatalogAnswersToHistorical({
      experience: cell('answered', 8),
      effort: cell('answered', 0),
      energy_before: cell('answered', 6),
      energy_after: cell('answered', 4),
      motivation_before: cell('answered', 7),
      sleep_prev: cell('answered', 5),
      fed_enough: cell('answered', 'rather_no'),
      hydrated_enough: cell('answered', 'fully'),
      place: cell('answered', 'gym'),
      weather: cell('answered', 'cloudy'),
      rest_band: cell('answered', '1_2'),
      partner: cell('answered', 'with_someone'),
      context_tags: cell('answered', ['unusual_fatigue']),
      notes: cell('answered', 'bon volume'),
      music: cell('answered', 'playlist A')
    });

    expect(root.ressenti).toBe(8);
    expect(root.difficulte).toBeUndefined();
    expect(answers.effort).toEqual({ state: 'answered', value: 0 });
    expect(root.energieDebut).toBe(6);
    expect(root.energieFin).toBe(4);
    expect(root.motivation).toBe(7);
    expect(root.sommeil).toBe(5);
    expect(root.nutrition).toBeUndefined();
    expect(root.hydratation).toBeUndefined();
    expect(root.environnement).toBe('salle');
    expect(root.meteo).toBe('nuageux');
    expect(root.tempsRepos).toBe('1-2 min');
    expect(root.partenaire).toBe(true);
    expect(root.tags).toEqual(['unusual_fatigue']);
    expect(root.notes).toBe('bon volume');
    expect(root.musiquesEcoutees).toBe('playlist A');
  });

  it('mappe effort ≥ 1 vers difficulte et douleur oui vers douleur', () => {
    const { root, answers } = mapCatalogAnswersToHistorical({
      effort: cell('answered', 9),
      pain_presence: cell('answered', 'yes'),
      pain_intensity: cell('answered', 3),
      pain_region: cell('answered', 'knee'),
      intent_attained: cell('answered', 'yes')
    });
    expect(root.difficulte).toBe(9);
    expect(root.douleur).toBe(3);
    expect(answers.pain.presence).toBe('yes');
    expect(answers.pain.region).toBe('knee');
    expect(root.objectifAtteint).toBe(true);
  });

  it('mappe douleur non vers absence explicite (douleur racine 0)', () => {
    const { root, answers } = mapCatalogAnswersToHistorical({
      pain_presence: cell('answered', 'no')
    });
    expect(root.douleur).toBe(0);
    expect(answers.douleur.state).toBe(ANSWER_STATES.ABSENT);
    expect(answers.pain.presence).toBe('no');
  });

  it('recharge le catalogue depuis un historique legacy sans inventer la douleur', () => {
    const draft = catalogAnswersFromStored({
      ressenti: 8,
      difficulte: 6,
      energieDebut: 5,
      energieFin: 4,
      motivation: 7,
      sommeil: 6,
      douleur: 0,
      environnement: 'maison',
      meteo: 'ensoleille',
      notes: 'legacy ok',
      partenaire: false
    });
    expect(draft.experience.value).toBe(8);
    expect(draft.effort.value).toBe(6);
    expect(draft.energy_before.value).toBe(5);
    expect(draft.place.value).toBe('home');
    expect(draft.weather.value).toBe('sunny');
    expect(draft.pain_presence.state).toBe(ANSWER_STATES.NOT_ANSWERED);
    expect(draft.partner.state).toBe(ANSWER_STATES.NOT_ANSWERED);
  });

  it('recharge pain / partenaire depuis answers structurés', () => {
    const draft = catalogAnswersFromStored({
      douleur: 4,
      answers: {
        pain: { presence: 'yes', state: 'answered', intensity: 4 },
        douleur: { state: 'answered', value: 4 },
        partenaire: { state: 'answered', value: false },
        effort: { state: 'answered', value: 0 }
      }
    });
    expect(draft.pain_presence.value).toBe('yes');
    expect(draft.pain_intensity.value).toBe(4);
    expect(draft.partner.value).toBe('alone');
    expect(draft.effort.value).toBe(0);
  });
});

describe('commitCatalogFeedback', () => {
  it('refuse un enregistrement sans réponse significative', () => {
    const result = commitCatalogFeedback(null, {}, { now: NOW, date: '2026-11-22' });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no_significant_answer');
    expect(result.stored).toBeNull();
  });

  it('enregistre une réponse rapide minimale et reste compatible Récap', () => {
    const result = commitCatalogFeedback(
      null,
      {
        experience: cell('answered', 8),
        effort: cell('answered', 7),
        energy_before: cell('answered', 6),
        pain_presence: cell('answered', 'no')
      },
      { now: NOW, date: '2026-11-22' }
    );
    expect(result.ok).toBe(true);
    expect(result.stored.schemaVersion).toBe(2);
    expect(result.stored.ressenti).toBe(8);
    expect(result.stored.difficulte).toBe(7);
    expect(result.stored.energieDebut).toBe(6);
    expect(result.stored.douleur).toBe(0);
    expect(result.stored.answers.pain.presence).toBe('no');
    expect(result.stored.provenance.writer).toBe('commitCatalogFeedback');
    expect(isSessionFeedbackFilled(result.stored)).toBe(true);

    const day = extractDayFeedback(
      { sessionFeedbacks: { '2026-11-22': result.stored } },
      '2026-11-22'
    );
    expect(day.filled).toBe(true);
    expect(day.ressenti).toBe(8);
    expect(day.difficulte).toBe(7);
    expect(day.douleur).toBeNull();
  });

  it('conserve les anciennes données lors d’une réécriture sparse', () => {
    const first = commitCatalogFeedback(
      null,
      {
        experience: cell('answered', 7),
        effort: cell('answered', 5),
        notes: cell('answered', 'première version'),
        music: cell('answered', 'rock')
      },
      { now: NOW, date: '2026-11-22' }
    );
    expect(first.ok).toBe(true);

    const second = commitCatalogFeedback(
      first.stored,
      {
        experience: cell('answered', 9)
      },
      { now: LATER, date: '2026-11-22' }
    );
    expect(second.ok).toBe(true);
    expect(second.stored.ressenti).toBe(9);
    expect(second.stored.difficulte).toBe(5);
    expect(second.stored.notes).toBe('première version');
    expect(second.stored.musiquesEcoutees).toBe('rock');
    expect(second.stored.answers.effort).toEqual({ state: 'answered', value: 5 });
    expect(second.stored.createdAt).toBe(NOW);
    expect(second.stored.updatedAt).toBe(LATER);
  });

  it('efface une ancienne douleur lors d’un « non » explicite', () => {
    const withPain = commitCatalogFeedback(
      null,
      {
        pain_presence: cell('answered', 'yes'),
        pain_intensity: cell('answered', 5),
        experience: cell('answered', 6)
      },
      { now: NOW, date: '2026-11-22' }
    );
    expect(withPain.stored.douleur).toBe(5);

    const cleared = commitCatalogFeedback(
      withPain.stored,
      {
        pain_presence: cell('answered', 'no')
      },
      { now: LATER, date: '2026-11-22' }
    );
    expect(cleared.stored.douleur).toBe(0);
    expect(cleared.stored.answers.douleur.state).toBe(ANSWER_STATES.ABSENT);
    expect(cleared.stored.ressenti).toBe(6);
  });

  it('enregistre malgré une contradiction (clarification non bloquante)', () => {
    const result = commitCatalogFeedback(
      null,
      {
        pain_presence: cell('answered', 'no'),
        primary_limiter: cell('answered', 'pain'),
        experience: cell('answered', 5)
      },
      { now: NOW, date: '2026-11-22' }
    );
    expect(result.ok).toBe(true);
    expect(result.clarifications.some((c) => c.id === 'pain_absent_vs_limiter_pain')).toBe(true);
    expect(result.stored.consistencyIssues.length).toBeGreaterThan(0);
    expect(result.stored.answers.primary_limiter.value).toBe('pain');
    expect(result.stored.answers.pain_presence.value).toBe('no');
  });

  it('conserve effort 0 uniquement dans answers (pas difficulte racine)', () => {
    const result = commitCatalogFeedback(
      null,
      { effort: cell('answered', 0) },
      { now: NOW, date: '2026-11-22' }
    );
    expect(result.ok).toBe(true);
    expect(result.stored.answers.effort.value).toBe(0);
    expect(result.stored.difficulte === undefined || result.stored.difficulte === 0).toBe(true);
    expect(isSessionFeedbackFilled(result.stored)).toBe(true);

    const day = extractDayFeedback(
      { sessionFeedbacks: { '2026-11-22': result.stored } },
      '2026-11-22'
    );
    expect(result.stored.answers.effort.state).toBe('answered');
    expect(day.filled).toBe(true);
    expect(day.difficulte).toBeNull();
  });

  it('efface explicitement une réponse sans perdre les autres', () => {
    const first = commitCatalogFeedback(
      null,
      {
        experience: cell('answered', 8),
        effort: cell('answered', 6),
        notes: cell('answered', 'garder')
      },
      { now: NOW, date: '2026-11-22' }
    );
    const cleared = commitCatalogFeedback(
      first.stored,
      { experience: cell('not_answered', null) },
      { now: LATER, date: '2026-11-22' }
    );
    expect(cleared.ok).toBe(true);
    expect(cleared.stored.ressenti).toBe(0);
    expect(cleared.stored.answers.experience.state).toBe('not_answered');
    expect(cleared.stored.difficulte).toBe(6);
    expect(cleared.stored.notes).toBe('garder');
    expect(cleared.stored.answers.effort.value).toBe(6);
  });

  it('ignore les clés inconnues du draft sans les persister comme réponses', () => {
    const result = commitCatalogFeedback(
      null,
      {
        experience: cell('answered', 8),
        invente: cell('answered', 1)
      },
      { now: NOW, date: '2026-11-22' }
    );
    expect(result.ok).toBe(true);
    expect(result.stored.answers.invente).toBeUndefined();
    expect(Object.keys(SESSION_FEEDBACK_QUESTIONS).includes('invente')).toBe(false);
  });

  it('round-trip readSessionFeedback après commit catalogue', () => {
    const result = commitCatalogFeedback(
      null,
      {
        experience: cell('answered', 8),
        pain_presence: cell('answered', 'declined')
      },
      { now: NOW, date: '2026-11-22' }
    );
    const view = readSessionFeedback(result.stored);
    expect(view.schemaVersion).toBe(2);
    expect(view.answers.experience.value).toBe(8);
    expect(view.answers.pain_presence.value).toBe('declined');
    expect(view.form.ressenti).toBe(8);
  });
});
