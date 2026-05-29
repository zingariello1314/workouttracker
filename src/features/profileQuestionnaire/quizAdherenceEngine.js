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

/** Risque d’adhérence 0–1 (plus haut = plus risqué). */
export function computeAdherenceRiskFromQuiz(answers) {
  let risk = 0.2;
  const daysChecked = countQuizAvailableDays(answers);
  const freq = declaredFrequencyPerWeek(answers);
  const dur = answers?.preferredSessionDuration;

  if (daysChecked >= 6) risk += 0.22;
  else if (daysChecked >= 5) risk += 0.12;

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
 * Plafond de jours actifs à partir du quiz seul.
 */
export function computeMaxActiveDaysFromQuiz(answers, adherenceRisk, recoveryScore) {
  const daysAvailable = countQuizAvailableDays(answers) || 4;
  let maxActiveDays = daysAvailable;

  if (adherenceRisk >= 0.55) maxActiveDays = Math.min(maxActiveDays, 4);
  if (adherenceRisk >= 0.7) maxActiveDays = Math.min(maxActiveDays, 3);
  if (recoveryScore < 45) maxActiveDays = Math.min(maxActiveDays, 3);
  if (recoveryScore < 35) maxActiveDays = Math.min(maxActiveDays, 2);

  if (experienceIsLow(answers) && maxActiveDays > 4) maxActiveDays = 4;
  if (answers?.preferredSessionDuration === '15_30' && maxActiveDays > 4) {
    maxActiveDays = Math.min(maxActiveDays, 4);
  }

  return Math.max(2, maxActiveDays);
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
