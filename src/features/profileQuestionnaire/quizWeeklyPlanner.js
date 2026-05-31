/**
 * Ordonnanceur hebdomadaire v6 — Phase 4 : allocation séries + km (pipeline complet).
 */

import { WEEKLY_PLANNER_ENGINE_VERSION, WEEKLY_PLANNER_PHASE } from './data/missionProfiles';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';

/** Phase 5+ : fill exercices piloté par blocs v6. */
export const USE_WEEKLY_PLANNER_FOR_SCHEDULE = true;

/**
 * @param {object} answers
 * @param {object} [opts]
 * @param {object} [opts.constraints]
 * @param {number} [opts.globalLoadFactor]
 * @param {number} [opts.activeDays]
 */
export function buildWeeklyPlan(answers, opts = {}) {
  const budgets = buildWeeklyBudgets(answers, opts);
  const whyLines = [budgets.summaryFr];
  budgets.arbitration.forEach((a) => {
    if (a?.reason) whyLines.push(`[${a.priority}] ${a.reason}`);
  });

  const warnings = [];
  if (budgets.recoveryBudget < 0.8) {
    warnings.push(
      'Budget récupération limité : le plan vise un volume prudent (ajuste sommeil/stress ou réduis les jours cochés).'
    );
  }
  if (budgets.run?.kmTarget >= 30 && budgets.strengthFamilies?.legs >= 12) {
    warnings.push(
      'Objectif course ambitieux + jambes muscu : les séances seront espacées (interférences v6 à venir).'
    );
  }

  return {
    enabled: true,
    engineVersion: WEEKLY_PLANNER_ENGINE_VERSION,
    phase: WEEKLY_PLANNER_PHASE,
    scheduleControlled: USE_WEEKLY_PLANNER_FOR_SCHEDULE,
    budgets,
    whyLines,
    warnings
  };
}
