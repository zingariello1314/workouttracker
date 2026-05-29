/**
 * Charge hebdo (SNC + métabolique) vs capacité de récupération.
 * Analyse principale : modèle marginal (quizMarginalFatigue).
 */

import { computeTendonBudget, estimateSessionTendonLoad } from './quizTendonLoad';
import { analyzeWeeklyLoadMarginal } from './quizMarginalFatigue';

/**
 * Capacité charge nerveuse hebdo (points) — base du budget marginal.
 */
export function computeRecoveryCapacity(recoveryScore, deformers) {
  let cap = 8 + Math.round(recoveryScore / 12);
  const mul = deformers?.volumeMul ?? 1;
  if (mul < 0.85) cap -= 1;
  if (mul > 1.05) cap += 1;
  return Math.max(5, Math.min(14, cap));
}

/**
 * @param {Record<string, object>} weekProfiles
 * @param {string[]} activeDayKeys
 * @param {object} answers
 * @param {object} deformers
 * @param {number} recoveryScore
 * @param {object|null} [trainingEvidence]
 */
export function analyzeWeeklyLoad(
  weekProfiles,
  activeDayKeys,
  answers,
  deformers,
  recoveryScore,
  trainingEvidence = null
) {
  const analysis = analyzeWeeklyLoadMarginal(
    weekProfiles,
    activeDayKeys,
    answers,
    deformers,
    recoveryScore,
    trainingEvidence
  );
  const tendonBudget = computeTendonBudget(answers, recoveryScore);
  return { ...analysis, tendonBudget };
}

/**
 * Applique les coupes sur les deformers (mutate copy).
 */
export function applyRecoveryCuts(deformers, loadAnalysis) {
  const d = { ...deformers, preferredGroupWeights: { ...deformers.preferredGroupWeights } };
  const { cuts } = loadAnalysis;

  if (cuts.suppressPlyo) d.allowPlyo = false;
  if (cuts.suppressFractionné) d.allowFractionné = false;
  if (cuts.suppressDrills) d.allowDrills = false;
  if (cuts.reduceCircuitDays) d.allowCircuits = false;

  if (cuts.reduceMaxExercises) {
    d.maxExercisesPerSession = Math.min(d.maxExercisesPerSession ?? 7, 5);
    d.volumeMul = Math.min(d.volumeMul ?? 1, 0.88);
  }

  if (cuts.reduceCardioDedicated && d.maxDedicatedCardioDays != null) {
    d.maxDedicatedCardioDays = Math.max(1, d.maxDedicatedCardioDays - 1);
  } else if (cuts.reduceCardioDedicated) {
    d.maxDedicatedCardioDays = 2;
  }

  return d;
}

/**
 * Après injection exos : vérifie charge tendon sur chaque jour force.
 */
export function trimExercisesForTendonLoad(exercises, deformers) {
  if (!Array.isArray(exercises) || !exercises.length) return exercises;
  const maxPull = deformers?.maxPullingPatternsPerSession ?? 3;
  const maxEx = deformers?.maxExercisesPerSession ?? 7;

  let list = [...exercises];
  let pullCount = 0;
  list = list.filter((ex) => {
    const k = String(ex.exerciseBankKey || ex.name || '').toLowerCase();
    const isPull = k.includes('traction') || k.includes('pull') || k.includes('rowing');
    if (isPull) {
      pullCount += 1;
      if (pullCount > maxPull) return false;
    }
    return true;
  });

  while (list.length > maxEx) list.pop();
  return list;
}

export { estimateSessionTendonLoad };
