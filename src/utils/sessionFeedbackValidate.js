/**
 * Validation des réponses Feedback + cohérence transversale.
 * Ne corrige jamais automatiquement les réponses utilisateur.
 */

import {
  ANSWER_STATES,
  getQuestion,
  SESSION_FEEDBACK_QUESTIONS
} from './sessionFeedbackCatalog.js';

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function optionValues(question) {
  const opts = question?.value?.options;
  if (!Array.isArray(opts)) return null;
  return new Set(opts.map((o) => o.value));
}

/**
 * Valide une cellule pour une question du catalogue.
 * @returns {{ ok: boolean, state: string, value: *, error?: string }}
 */
export function validateQuestionAnswer(questionId, cell, context = {}) {
  const question = getQuestion(questionId);
  if (!question) {
    return { ok: false, state: ANSWER_STATES.NOT_ANSWERED, value: null, error: 'unknown_question' };
  }
  if (question.enabled === false && question.tier === 'future') {
    return { ok: false, state: ANSWER_STATES.NOT_ASKED, value: null, error: 'question_disabled' };
  }

  if (cell == null || cell === undefined) {
    return { ok: true, state: ANSWER_STATES.NOT_ANSWERED, value: null };
  }

  if (!isPlainObject(cell) || typeof cell.state !== 'string') {
    return { ok: false, state: ANSWER_STATES.NOT_ANSWERED, value: null, error: 'invalid_cell' };
  }

  const state = cell.state;
  const value = cell.value;

  if (
    state === ANSWER_STATES.NOT_ANSWERED ||
    state === ANSWER_STATES.NOT_ASKED ||
    state === ANSWER_STATES.NOT_APPLICABLE
  ) {
    return { ok: true, state, value: null };
  }

  if (state === ANSWER_STATES.DECLINED) {
    return { ok: true, state, value: value ?? null };
  }

  if (state === ANSWER_STATES.ABSENT) {
    return { ok: true, state, value: null };
  }

  if (state !== ANSWER_STATES.ANSWERED) {
    return { ok: false, state: ANSWER_STATES.NOT_ANSWERED, value: null, error: 'invalid_state' };
  }

  if (question.type === 'scale') {
    const n = Number(value);
    const min = question.value?.min ?? 1;
    const max = question.value?.max ?? 10;
    const allowZero = question.value?.allowZero === true;
    if (!Number.isFinite(n)) {
      return { ok: false, state: ANSWER_STATES.NOT_ANSWERED, value: null, error: 'invalid_number' };
    }
    if (allowZero && n === 0) {
      return { ok: true, state: ANSWER_STATES.ANSWERED, value: 0 };
    }
    if (n < min || n > max || (!allowZero && n <= 0)) {
      return { ok: false, state: ANSWER_STATES.NOT_ANSWERED, value: null, error: 'out_of_range' };
    }
    return { ok: true, state: ANSWER_STATES.ANSWERED, value: n };
  }

  if (question.type === 'enum') {
    if (questionId === 'pain_exercise') {
      const allowed = Array.isArray(context.allowedExerciseIds)
        ? new Set(context.allowedExerciseIds.map(String))
        : null;
      if (value == null || value === '') {
        return { ok: false, state: ANSWER_STATES.NOT_ANSWERED, value: null, error: 'empty_enum' };
      }
      if (allowed && !allowed.has(String(value))) {
        return { ok: false, state: ANSWER_STATES.NOT_ANSWERED, value: null, error: 'exercise_not_in_session' };
      }
      return { ok: true, state: ANSWER_STATES.ANSWERED, value: String(value) };
    }
    const allowed = optionValues(question);
    if (!allowed || !allowed.has(value)) {
      return { ok: false, state: ANSWER_STATES.NOT_ANSWERED, value: null, error: 'invalid_enum' };
    }
    return { ok: true, state: ANSWER_STATES.ANSWERED, value };
  }

  if (question.type === 'multi_enum') {
    if (!Array.isArray(value)) {
      return { ok: false, state: ANSWER_STATES.NOT_ANSWERED, value: [], error: 'invalid_multi' };
    }
    const allowed = optionValues(question);
    const cleaned = [];
    for (const item of value) {
      if (allowed && allowed.has(item)) cleaned.push(item);
    }
    if (!cleaned.length) {
      return { ok: true, state: ANSWER_STATES.NOT_ANSWERED, value: [] };
    }
    return { ok: true, state: ANSWER_STATES.ANSWERED, value: cleaned };
  }

  if (question.type === 'text') {
    const text = typeof value === 'string' ? value.trim() : '';
    const max = question.value?.maxLength ?? 2000;
    if (!text) {
      return { ok: true, state: ANSWER_STATES.NOT_ANSWERED, value: null };
    }
    if (text.length > max) {
      return { ok: false, state: ANSWER_STATES.NOT_ANSWERED, value: null, error: 'text_too_long' };
    }
    return { ok: true, state: ANSWER_STATES.ANSWERED, value: text };
  }

  return { ok: false, state: ANSWER_STATES.NOT_ANSWERED, value: null, error: 'unsupported_type' };
}

/**
 * Normalise un dictionnaire de réponses catalogue.
 * Les cellules invalides deviennent not_answered (jamais inventées).
 */
export function normalizeCatalogAnswers(rawAnswers, context = {}) {
  const input = isPlainObject(rawAnswers) ? rawAnswers : {};
  const out = {};
  const errors = [];

  for (const id of Object.keys(SESSION_FEEDBACK_QUESTIONS)) {
    const result = validateQuestionAnswer(id, input[id], context);
    if (!result.ok && result.error && input[id] != null) {
      errors.push({ id, error: result.error });
    }
    out[id] = { state: result.state, value: result.value };
  }

  return { answers: out, errors };
}

function answeredValue(answers, id) {
  const cell = answers?.[id];
  if (!cell || cell.state !== ANSWER_STATES.ANSWERED) return undefined;
  return cell.value;
}

function cellState(answers, id) {
  return answers?.[id]?.state || ANSWER_STATES.NOT_ANSWERED;
}

/**
 * Cohérence transversale.
 * @returns {{ issues: Array<{ id: string, severity: 'contradiction'|'unusual'|'insufficient'|'compatible', message: string, questionIds: string[] }> }}
 */
export function assessAnswerConsistency(answers) {
  const issues = [];
  const painPresence = answeredValue(answers, 'pain_presence');
  const painState = cellState(answers, 'pain_presence');
  const limiter = answeredValue(answers, 'primary_limiter');
  const intent = answeredValue(answers, 'session_intent');
  const attained = answeredValue(answers, 'intent_attained');
  const partial = answeredValue(answers, 'session_partial_status');
  const adaptation = answeredValue(answers, 'adaptation_reason');
  const tags = answeredValue(answers, 'context_tags') || [];
  const painEffect = answeredValue(answers, 'pain_effect');

  // Douleur absente + limiter pain
  if (painPresence === 'no' && limiter === 'pain') {
    issues.push({
      id: 'pain_absent_vs_limiter_pain',
      severity: 'contradiction',
      message:
        'Tu as indiqué n’avoir pas ressenti de douleur, mais tu cites la douleur comme limitation principale.',
      questionIds: ['pain_presence', 'primary_limiter']
    });
  }

  // Douleur absente + détails douleur renseignés
  if (painPresence === 'no') {
    for (const id of [
      'pain_intensity',
      'pain_region',
      'pain_side',
      'pain_onset',
      'pain_effect',
      'pain_exercise'
    ]) {
      if (cellState(answers, id) === ANSWER_STATES.ANSWERED) {
        issues.push({
          id: 'pain_absent_vs_pain_details',
          severity: 'contradiction',
          message: 'Des précisions de douleur sont renseignées alors que tu as répondu « Non ».',
          questionIds: ['pain_presence', id]
        });
        break;
      }
    }
  }

  // Douleur inconnue / declined + limiter pain → insufficient, pas contradiction
  if (
    (painState === ANSWER_STATES.NOT_ANSWERED || painPresence === 'declined') &&
    limiter === 'pain'
  ) {
    issues.push({
      id: 'pain_unknown_vs_limiter_pain',
      severity: 'insufficient',
      message:
        'La douleur est citée comme limitation, mais la présence de douleur n’est pas confirmée explicitement.',
      questionIds: ['pain_presence', 'primary_limiter']
    });
  }

  // Objectif aucun / unknown + atteint yes
  if ((intent === 'none' || intent === 'unknown') && attained === 'yes') {
    issues.push({
      id: 'no_intent_vs_attained_yes',
      severity: 'contradiction',
      message: 'Tu as déclaré ne pas avoir d’objectif clair, tout en indiquant l’avoir atteint.',
      questionIds: ['session_intent', 'intent_attained']
    });
  }

  if (intent === 'none' && attained === 'partial') {
    issues.push({
      id: 'no_intent_vs_attained_partial',
      severity: 'contradiction',
      message: 'Atteinte partielle sans objectif déclaré.',
      questionIds: ['session_intent', 'intent_attained']
    });
  }

  // Encore en cours + interrompue
  if (partial === 'still_in_progress' && (painEffect === 'stopped_session' || tags.includes('interrupted'))) {
    issues.push({
      id: 'in_progress_vs_interrupted',
      severity: 'contradiction',
      message: 'La séance est marquée encore en cours et aussi interrompue.',
      questionIds: ['session_partial_status', 'pain_effect', 'context_tags']
    });
  }

  // Légère volontaire + raison d’adaptation incongruente (unusual, pas forcément faux)
  if (
    (intent === 'light' || tags.includes('light_session')) &&
    adaptation &&
    adaptation !== 'recovery' &&
    adaptation !== 'technique' &&
    adaptation !== 'declined' &&
    adaptation !== 'other'
  ) {
    issues.push({
      id: 'light_intent_vs_adaptation_reason',
      severity: 'unusual',
      message:
        'Séance présentée comme légère / récupération, avec une autre raison d’adaptation — possible, à clarifier si besoin.',
      questionIds: ['session_intent', 'adaptation_reason', 'context_tags']
    });
  }

  // Partielle adapted sans raison — insufficient
  if (partial === 'adapted' && cellState(answers, 'adaptation_reason') === ANSWER_STATES.NOT_ANSWERED) {
    issues.push({
      id: 'adapted_without_reason',
      severity: 'insufficient',
      message: 'Adaptation volontaire déclarée sans raison précisée.',
      questionIds: ['session_partial_status', 'adaptation_reason']
    });
  }

  // Compatible explicite : douleur yes + limiter pain
  if (painPresence === 'yes' && limiter === 'pain') {
    issues.push({
      id: 'pain_yes_limiter_pain',
      severity: 'compatible',
      message: 'Douleur déclarée et retenue comme limitation — cohérent.',
      questionIds: ['pain_presence', 'primary_limiter']
    });
  }

  return { issues };
}

/**
 * Au moins une réponse significative (pour autoriser l’enregistrement).
 */
export function hasSignificantCatalogAnswers(answers) {
  const a = isPlainObject(answers) ? answers : {};
  for (const [id, cell] of Object.entries(a)) {
    if (!cell || typeof cell !== 'object') continue;
    if (cell.state === ANSWER_STATES.ANSWERED) {
      if (Array.isArray(cell.value) && cell.value.length === 0) continue;
      if (typeof cell.value === 'string' && !cell.value.trim()) continue;
      return true;
    }
    if (cell.state === ANSWER_STATES.ABSENT && id === 'pain_presence') return true;
    if (cell.state === ANSWER_STATES.DECLINED && id === 'pain_presence') return true;
  }
  // pain_presence answered as no/yes/declined via answered state
  const pain = a.pain_presence;
  if (pain?.state === ANSWER_STATES.ANSWERED && (pain.value === 'no' || pain.value === 'yes' || pain.value === 'declined')) {
    return true;
  }
  return false;
}

/**
 * Clarifications non bloquantes suggérées (pas d’auto-correction).
 */
export function suggestedClarifications(consistency) {
  return (consistency?.issues || [])
    .filter((i) => i.severity === 'contradiction')
    .map((i) => ({
      id: i.id,
      message: i.message,
      questionIds: i.questionIds,
      blocking: false
    }));
}
