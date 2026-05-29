/**
 * Payload nutrition enrichi depuis le quiz (kcal indicatives, timing, objectif).
 */

import { mapQuizGoalToNutritionGoal } from './quizInfluence';
import { nutritionTimingHintFromQuiz } from './quizSystemPrefs';

function estimateBmr(vitals) {
  if (!vitals || typeof vitals !== 'object') return null;
  const w = Number(vitals.weightKg);
  const h = Number(vitals.heightCm);
  const age = Number(vitals.age);
  const sex = vitals.sex;
  if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(age)) return null;
  if (sex === 'female' || sex === 'F') return Math.round(10 * w + 6.25 * h - 5 * age - 161);
  if (sex === 'male' || sex === 'M') return Math.round(10 * w + 6.25 * h - 5 * age + 5);
  return Math.round(10 * w + 6.25 * h - 5 * age - 78);
}

const ACTIVITY_MUL = {
  sedentary: 1.2,
  lightly_active: 1.35,
  moderately_active: 1.5,
  very_active: 1.65
};

const GOAL_KCAL_DELTA = {
  cutting: -350,
  maintenance: 0,
  lean_bulk: 250,
  bulking: 450
};

/**
 * @param {object} answers
 */
export function buildNutritionCoachPayload(answers = {}) {
  const vitals = answers?.vitalsSelfReport || {};
  const bmr = estimateBmr(vitals);
  const activity = answers?.activityOutsideTraining || 'moderately_active';
  const actMul = ACTIVITY_MUL[activity] ?? 1.45;
  const maintenance = bmr ? Math.round(bmr * actMul) : null;

  const goalKey = mapQuizGoalToNutritionGoal(
    answers?.goalPhysique || 'balanced_functional',
    answers?.currentPhysique
  );
  const delta = GOAL_KCAL_DELTA[goalKey] ?? 0;
  const targetKcal = maintenance != null ? Math.max(1400, maintenance + delta) : null;
  const sportDayKcal = targetKcal != null ? targetKcal + 150 : null;
  const restDayKcal = targetKcal;

  return {
    suggestedGoal: goalKey,
    bodyFatPercent: answers?.bodyFatPercentEstimate ?? null,
    activityOutsideTraining: activity,
    estimatedMaintenanceKcal: maintenance,
    targetKcalDaily: targetKcal,
    sportDayKcal,
    restDayKcal,
    proteinGPerKg: goalKey === 'cutting' ? 2 : goalKey === 'bulking' ? 1.8 : 1.9,
    timingHint: nutritionTimingHintFromQuiz(answers),
    mealStructureHint:
      goalKey === 'cutting'
        ? 'Protéines à chaque repas, glucides surtour autour des séances.'
        : 'Répartition équilibrée ; surplus modéré si prise de masse.'
  };
}
