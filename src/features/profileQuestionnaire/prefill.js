import { normalizeProfileQuestionnaire } from './schema';
import {
  buildProgramPrefillHints,
  computeCardioBiasMultiplier,
  buildQuizStretchingBlocks,
  buildQuizTrainingSessionBlueprint,
  resolveTargetWeightFromQuiz
} from './quizInfluence';
import { resolveProgramDurationWeeks } from './quizProfileConstraints';
import { buildNutritionCoachPayload } from './quizNutritionPayload';
import { buildEnrichedNutritionPlan } from './quizMealPlanEnrichment';

export const PENDING_QUIZ_PREFILL_NUTRITION_KEY = 'momentum.pendingQuizPrefill.nutrition';
export const PENDING_QUIZ_PREFILL_TRAINING_KEY = 'momentum.pendingQuizPrefill.training';
/** Déclenché quand un prefill programme est écrit (onglet Programme déjà monté). */
export const PROGRAM_FROM_QUIZ_OPEN_EVENT = 'momentum:program-from-quiz-open';

export const buildQuizPrefillPayload = (profileQuestionnaireRaw) => {
  const q = normalizeProfileQuestionnaire(profileQuestionnaireRaw || null);
  const answers = q.answers || {};
  const goal = answers.goalPhysique || null;
  const level = answers.experienceLevel || null;
  const duration = answers.preferredSessionDuration || null;
  const days = Array.isArray(answers.availableTrainingDays) ? answers.availableTrainingDays : [];

  return {
    source: 'profileQuiz',
    builtAt: new Date().toISOString(),
    completion: {
      completedCount: q.completedCount,
      totalCount: q.totalCount
    },
    answers,
    nutrition: buildNutritionCoachPayload(answers),
    nutritionEnrichment: buildEnrichedNutritionPlan(answers, null, null),
    training: {
      suggestedDurationWeeks: resolveProgramDurationWeeks(answers),
      suggestedDays: days,
      hints: buildProgramPrefillHints(answers),
      vitals: answers.vitalsSelfReport || null,
      cardioBias: computeCardioBiasMultiplier(answers),
      stretchingBlocks: buildQuizStretchingBlocks(answers),
      sessionBlueprint: buildQuizTrainingSessionBlueprint(answers)
    },
    targetWeightKg: resolveTargetWeightFromQuiz(answers)
  };
};

export const writePendingQuizPrefill = (storageKey, payload) => {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(payload));
  } catch {
    // no-op
  }
};

export const readPendingQuizPrefill = (storageKey) => {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearPendingQuizPrefill = (storageKey) => {
  try {
    sessionStorage.removeItem(storageKey);
  } catch {
    // no-op
  }
};

/** Ouvre le flux création programme avec les réponses quiz du profil. */
export const openProgramCreationFromQuiz = (profileQuestionnaireRaw, { setActiveTab } = {}) => {
  const payload = buildQuizPrefillPayload(profileQuestionnaireRaw);
  writePendingQuizPrefill(PENDING_QUIZ_PREFILL_TRAINING_KEY, payload);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROGRAM_FROM_QUIZ_OPEN_EVENT, { detail: payload }));
  }
  if (typeof setActiveTab === 'function') setActiveTab('program');
  return payload;
};

