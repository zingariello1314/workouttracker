/**
 * Coût heuristique d’un plan hebdo v6 (SPEC §14.2) — lecture seule, explicable.
 */

import { preferenceTieBreakDelta } from './quizExercisePreferenceScore';

export const COST_WEIGHTS_V1 = {
  MissionViolation: 10,
  RecoveryOverload: 9,
  MuscleIncoherence: 5,
  UserConflictPenalty: 4,
  AdherenceRisk: 6,
  NegativeExercisePref: 2,
  MissionProgressSignal: 1
};

/** Seuil au-delà duquel un plan est « coûteux » (opérateurs locaux futurs). */
export const PLAN_COST_WARN_THRESHOLD = 42;

/**
 * @param {object} coachContext
 * @param {Record<string, object>} schedule
 * @param {string[]} activeDayKeys
 * @param {object} answers
 */
export function computeQuizPlanCost(coachContext, schedule, activeDayKeys, answers = {}) {
  const breakdown = [];
  let total = 0;

  const wp = coachContext?.weeklyPlan;
  const budgets = wp?.budgets;
  const rbRaw = budgets?.recoveryBudget;
  const rb =
    typeof rbRaw === 'number'
      ? rbRaw
      : Number(rbRaw?.recoveryBudget ?? coachContext?.constraints?.recoveryScore / 100) || 1;

  if (rb < 0.8) {
    const term = (0.8 - rb) * 100 * COST_WEIGHTS_V1.RecoveryOverload;
    breakdown.push({
      term: 'RecoveryOverload',
      weight: COST_WEIGHTS_V1.RecoveryOverload,
      raw: 0.8 - rb,
      value: Math.round(term * 10) / 10,
      reasonFr: `Récupération ${Math.round(rb * 100)} % — charge au-dessus de la zone confort.`
    });
    total += term;
  }

  const kmTarget = budgets?.run?.kmTarget;
  const plannedKm = wp?.plannedKm?.totalKm;
  if (kmTarget && plannedKm != null) {
    const gap = Math.abs(plannedKm - kmTarget) / Math.max(1, kmTarget);
    if (gap > 0.12) {
      const term = gap * 50 * COST_WEIGHTS_V1.MissionViolation;
      breakdown.push({
        term: 'MissionViolation',
        weight: COST_WEIGHTS_V1.MissionViolation,
        raw: gap,
        value: Math.round(term * 10) / 10,
        reasonFr: `Km planifiés ${plannedKm} vs cible ${kmTarget} (${Math.round(gap * 100)} % d'écart).`
      });
      total += term;
    }
  }

  const muscle = coachContext?.muscleVolumeRealized;
  if (muscle?.gaps) {
    let incoherence = 0;
    Object.values(muscle.gaps).forEach((g) => {
      if (g?.gapPct > 15) {
        incoherence += Math.min(0.22, (g.gapPct - 15) / 100);
      }
    });
    if (incoherence > 0) {
      const term = Math.min(32, incoherence * 18 * COST_WEIGHTS_V1.MuscleIncoherence);
      breakdown.push({
        term: 'MuscleIncoherence',
        weight: COST_WEIGHTS_V1.MuscleIncoherence,
        raw: incoherence,
        value: Math.round(term * 10) / 10,
        reasonFr: 'Écart séries muscle vs budgets (voir séries réalisées / cibles).'
      });
      total += term;
    }
  }

  const declaredDays = Array.isArray(answers?.availableTrainingDays)
    ? answers.availableTrainingDays.length
    : activeDayKeys.length;
  const activeCount = activeDayKeys.filter((d) => schedule?.[d]?.active).length;
  if (declaredDays >= 4 && activeCount > declaredDays + 1) {
    const term = (activeCount - declaredDays) * 8 * COST_WEIGHTS_V1.AdherenceRisk;
    breakdown.push({
      term: 'AdherenceRisk',
      weight: COST_WEIGHTS_V1.AdherenceRisk,
      raw: activeCount - declaredDays,
      value: Math.round(term * 10) / 10,
      reasonFr: `${activeCount} séances actives pour ${declaredDays} jours déclarés — risque adhérence.`
    });
    total += term;
  }

  const pref = coachContext?.deformers?.exercisePreferenceScore;
  const penalties = coachContext?.deformers?.exercisePreferencePenalties || [];
  if (pref && penalties.length) {
    let neg = 0;
    activeDayKeys.forEach((dayKey) => {
      (schedule?.[dayKey]?.exercises || []).forEach((ex) => {
        const k = ex.exerciseBankKey;
        if (k && penalties.includes(k)) neg += Math.abs(preferenceTieBreakDelta(k, pref));
      });
    });
    if (neg > 0) {
      const term = neg * COST_WEIGHTS_V1.NegativeExercisePref;
      breakdown.push({
        term: 'NegativeExercisePref',
        weight: COST_WEIGHTS_V1.NegativeExercisePref,
        raw: neg,
        value: Math.round(term * 10) / 10,
        reasonFr: 'Exercices peu pratiqués dans l’historique encore présents au plan.'
      });
      total += term;
    }
  }

  if (Array.isArray(budgets?.arbitration) && budgets.arbitration.some((a) => a.priority === 'P3')) {
    const term = 6 * COST_WEIGHTS_V1.UserConflictPenalty;
    breakdown.push({
      term: 'UserConflictPenalty',
      weight: COST_WEIGHTS_V1.UserConflictPenalty,
      raw: 1,
      value: term,
      reasonFr: 'Arbitrage P3 : compromis explicite force/cardio selon tes priorités quiz.'
    });
    total += term;
  }

  if (coachContext?.trainingEvidence?.maturity === 'rich' && muscle?.withinTolerance) {
    const bonus = 4 * COST_WEIGHTS_V1.MissionProgressSignal;
    breakdown.push({
      term: 'MissionProgressSignal',
      weight: COST_WEIGHTS_V1.MissionProgressSignal,
      raw: 1,
      value: -bonus,
      reasonFr: 'Historique riche et séries dans la tolérance — léger bonus alignement.'
    });
    total -= bonus;
  }

  const planCost = Math.max(0, Math.min(99, Math.round(total * 10) / 10));
  const highCost = planCost >= PLAN_COST_WARN_THRESHOLD;

  return {
    version: 'COST_WEIGHTS_V1',
    planCost,
    highCost,
    breakdown,
    summaryFr: highCost
      ? `Coût plan élevé (${planCost}) — vérifie warnings et arbitrages.`
      : `Coût plan modéré (${planCost}) — plan aligné mission et récupération.`
  };
}
