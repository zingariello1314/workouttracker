/**
 * Hiérarchie des contraintes quiz : faisabilité → récup → adhérence → objectif → préférences.
 */

import {
  buildAdherenceWarnings,
  computeAdherenceCap,
  computeAdherenceRiskFromQuiz,
  countQuizAvailableDays,
  declaredFrequencyPerWeek
} from './quizAdherenceEngine';
import { applyConstraintMaxActiveDays, getProfileConstraintEffects } from './quizProfileConstraints';

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/** Score récupération 0–100 (plus haut = mieux). */
export function computeRecoveryScore(answers) {
  let s = 72;
  const sleep = answers?.sleepQuality;
  const stress = answers?.stressLevel;
  const exp = answers?.experienceLevel;

  if (sleep === 'excellent') s += 12;
  else if (sleep === 'good') s += 6;
  else if (sleep === 'below_average') s -= 8;
  else if (sleep === 'poor') s -= 16;

  if (stress === 'very_low') s += 6;
  else if (stress === 'low') s += 3;
  else if (stress === 'high') s -= 10;
  else if (stress === 'very_high') s -= 18;

  if (exp === 'beginner_total') s -= 8;
  else if (exp === 'beginner_0_3m') s -= 4;
  else if (exp === 'expert_3y_plus') s += 6;
  else if (exp === 'advanced_1_3y') s += 3;

  const flex = answers?.flexibilityLevel;
  if (flex === 'very_stiff' || flex === 'below_avg') s -= 4;

  return clamp(Math.round(s), 25, 100);
}

/** Risque d’adhérence 0–1 (plus haut = plus risqué). */
export function computeAdherenceRisk(answers) {
  return computeAdherenceRiskFromQuiz(answers);
}

function expPoor(answers) {
  const e = answers?.experienceLevel;
  return e === 'beginner_total' || e === 'beginner_0_3m';
}

function hasStreetAndHome(answers) {
  const loc = Array.isArray(answers?.trainingLocation) ? answers.trainingLocation : [];
  const street = loc.some((l) => l === 'outdoor' || l === 'track');
  const home = loc.some((l) => l === 'home_minimal' || l === 'home_gym');
  return street && home;
}

function hasConflictingGoals(answers) {
  const warnings = [];
  const g = answers?.goalPhysique;
  const cardio = answers?.cardioTrainingDesire;
  if (g === 'bulk_mass' && (cardio === 'high' || cardio === 'priority_hiit')) {
    warnings.push('Objectif masse et forte demande cardio : le programme privilégie la régularité sur le volume extrême.');
  }
  if (g === 'athletic_performance' && expPoor(answers)) {
    warnings.push('Performance athlétique avec peu d’expérience : progression technique et volume modéré au départ.');
  }
  if (cardio === 'minimal' && Array.isArray(answers?.priorityMuscleGroups) && answers.priorityMuscleGroups.includes('cardio')) {
    warnings.push('Priorité cardio au quiz mais volume cardio souhaité minimal : séances courtes dédiées 1–2×/sem.');
  }
  const days = countQuizAvailableDays(answers);
  const freq = declaredFrequencyPerWeek(answers);
  if (days >= 5 && freq <= 2) {
    warnings.push(
      `Beaucoup de jours cochés (${days}) alors que tu t’entraînes plutôt ${freq <= 1.5 ? '1–2×' : 'peu'} / sem — structure resserrée pour tenir sur la durée.`
    );
  }
  if (freq >= 5 && days < 4) {
    warnings.push(
      `Tu déclares t’entraîner ~${Math.round(freq)} j/sem mais seulement ${days} jour(s) coché(s) — coche plus de jours disponibles ou le programme restera sur ${days} séance(s)/sem.`
    );
  }
  return warnings;
}

/**
 * @param {object} answers
 * @returns {import('./quizCoachPipeline').ResolvedConstraints}
 */
export function resolveQuizConstraints(answers) {
  const recoveryScore = computeRecoveryScore(answers);
  const adherenceRisk = computeAdherenceRisk(answers);
  const daysAvailable = countQuizAvailableDays(answers);
  const warnings = hasConflictingGoals(answers);

  const adherenceCap = applyConstraintMaxActiveDays(
    computeAdherenceCap(answers, adherenceRisk, recoveryScore),
    answers
  );
  const maxActiveDays = adherenceCap;

  const constraintFx = getProfileConstraintEffects(answers);
  if (constraintFx.summaryFr) warnings.push(constraintFx.summaryFr);

  const performanceHybridEligible =
    recoveryScore >= 58 &&
    adherenceRisk < 0.65 &&
    hasStreetAndHome(answers) &&
    !expPoor(answers) &&
    daysAvailable >= 4;

  return {
    recoveryScore,
    adherenceRisk,
    adherenceCap,
    maxActiveDays: Math.max(2, maxActiveDays),
    daysAvailable,
    declaredFrequency: declaredFrequencyPerWeek(answers),
    performanceHybridEligible,
    suppressPlyo: recoveryScore < 40 || adherenceRisk > 0.75,
    suppressFractionné: recoveryScore < 38,
    forceRecoveryMode: recoveryScore < 42,
    warnings
  };
}
