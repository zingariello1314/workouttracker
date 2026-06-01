/**
 * Adhérence : risque quiz + affinage depuis l’historique Sport (28 j).
 */

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

export function countQuizAvailableDays(answers) {
  const days = Array.isArray(answers?.availableTrainingDays) ? answers.availableTrainingDays : [];
  return days.length;
}

export function declaredFrequencyPerWeek(answers) {
  const map = { '0': 0, '1_2': 1.5, '3_4': 3.5, '5_6': 5.5, '7': 7 };
  return map[answers?.weeklyTrainingFrequencyCurrent] ?? 3;
}

function experienceIsLow(answers) {
  const e = answers?.experienceLevel;
  return e === 'beginner_total' || e === 'beginner_0_3m';
}

const HYPERTROPHY_GOALS = new Set(['muscular_defined', 'lean_toned', 'bulk_mass']);

function isMotivatedHypertrophyProfile(answers) {
  const days = countQuizAvailableDays(answers);
  const freq = declaredFrequencyPerWeek(answers);
  return (
    HYPERTROPHY_GOALS.has(answers?.goalPhysique) &&
    days >= 5 &&
    freq >= 3.5 &&
    answers?.weeklyTrainingFrequencyCurrent !== '1_2'
  );
}

/** Risque d’adhérence 0–1 (plus haut = plus risqué). */
export function computeAdherenceRiskFromQuiz(answers) {
  let risk = 0.2;
  const daysChecked = countQuizAvailableDays(answers);
  const freq = declaredFrequencyPerWeek(answers);
  const dur = answers?.preferredSessionDuration;

  if (daysChecked >= 6) {
    risk += isMotivatedHypertrophyProfile(answers) ? 0.08 : 0.22;
  } else if (daysChecked >= 5) risk += 0.12;

  if (freq <= 1.5 && daysChecked >= 4) risk += 0.25;
  if (freq >= 5 && experienceIsLow(answers)) risk += 0.15;

  if (dur === '60_90' && (experienceIsLow(answers) || answers?.stressLevel === 'high')) risk += 0.2;
  if (dur === '15_30') risk -= 0.08;

  if (answers?.cardioTrainingDesire === 'priority_hiit' && daysChecked >= 5) risk += 0.15;
  if (answers?.goalPhysique === 'bulk_mass' && answers?.cardioTrainingDesire === 'priority_hiit') {
    risk += 0.12;
  }

  return clamp(risk, 0, 1);
}

/**
 * Plafond adhérence seul (sans minimum mission).
 */
export function computeAdherenceCap(answers, adherenceRisk, recoveryScore) {
  const daysAvailable = countQuizAvailableDays(answers) || 4;
  let cap = daysAvailable;

  if (adherenceRisk >= 0.72) cap = Math.min(cap, 4);
  if (adherenceRisk >= 0.85) cap = Math.min(cap, 3);
  if (recoveryScore < 45) cap = Math.min(cap, 3);
  if (recoveryScore < 35) cap = Math.min(cap, 2);

  if (experienceIsLow(answers) && !isMotivatedHypertrophyProfile(answers) && cap > 4) {
    cap = 4;
  }
  if (answers?.preferredSessionDuration === '15_30' && cap > 4) {
    cap = Math.min(cap, 4);
  }

  return Math.max(2, cap);
}

/**
 * Plafond de jours actifs à partir du quiz seul (legacy).
 */
export function computeMaxActiveDaysFromQuiz(answers, adherenceRisk, recoveryScore) {
  return computeAdherenceCap(answers, adherenceRisk, recoveryScore);
}

/**
 * Ajuste le plafond si l’historique montre une régularité faible ou une reprise après pause.
 * @param {number} baseCap
 * @param {object|null} trainingEvidence — sortie `buildTrainingEvidence`
 */
export function refineMaxActiveDaysFromHistory(baseCap, trainingEvidence) {
  if (!trainingEvidence || trainingEvidence.maturity === 'none') return baseCap;

  let cap = baseCap;
  const reg = Number(trainingEvidence.regularityScore);
  if (trainingEvidence.maturity === 'rich' && Number.isFinite(reg) && reg < 0.42) {
    cap = Math.min(cap, 3);
  } else if (trainingEvidence.maturity === 'sparse' && Number.isFinite(reg) && reg < 0.35) {
    cap = Math.min(cap, 4);
  }

  if (trainingEvidence.restGap14 >= 10) {
    cap = Math.min(cap, 3);
  }

  return Math.max(2, cap);
}

/**
 * @param {object} answers
 * @param {object|null} trainingEvidence
 */
export function buildAdherenceWarnings(answers, trainingEvidence) {
  const warnings = [];
  if (
    trainingEvidence?.maturity !== 'none' &&
    Number(trainingEvidence?.regularityScore) < 0.45 &&
    trainingEvidence?.activeDays28 >= 2
  ) {
    warnings.push(
      'Ta régularité récente est en dessous de ton objectif : le planning généré reste volontairement conservateur.'
    );
  }
  return warnings;
}
