/**
 * Budget récupération 0.6–1.2 dérivé du quiz (v6).
 */

import { computeRecoveryScore } from './quizConstraintResolver';

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * @param {object} answers
 * @param {object} [constraints] — sortie resolveQuizConstraints
 */
export function buildRecoveryBudget(answers, constraints = null) {
  const rawScore = Number(constraints?.recoveryScore);
  const score = Number.isFinite(rawScore) ? rawScore : computeRecoveryScore(answers);
  let budget = 0.55 + (score / 100) * 0.55;
  const age = Number(answers?.vitalsSelfReport?.age);
  if (Number.isFinite(age)) {
    if (age >= 45) budget *= 0.96;
    if (age >= 55) budget *= 0.94;
    if (age <= 25) budget *= 1.03;
  }
  const act = answers?.activityOutsideTraining;
  if (act === 'very_active') budget *= 0.94;
  if (act === 'sedentary' && (answers?.cardioTrainingDesire === 'minimal' || answers?.cardioTrainingDesire === 'light')) {
    budget *= 1.02;
  }
  budget = clamp(Math.round(budget * 1000) / 1000, 0.6, 1.2);
  return {
    recoveryScore: score,
    recoveryBudget: budget,
    labelFr:
      budget >= 1.05 ? 'Récupération favorable' : budget >= 0.9 ? 'Récupération standard' : 'Récupération limitée'
  };
}
