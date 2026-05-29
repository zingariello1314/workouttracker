/**
 * Répartition du temps d’étirements quotidien (quiz) sur matin / midi / soir.
 * Pliométrie et drills exclus du budget.
 */

import { resolveStretchMomentsFromQuiz } from './quizInfluence';

const BUDGET_MINUTES = {
  '5_10': 8,
  '10_15': 12,
  '15_25': 20,
  '25_40': 35,
  none: 0
};

/**
 * @returns {{ totalSec: number, perMoment: Record<string, { count: number, durationSec: number }> }}
 */
export function resolveStretchBudgetPlan(answers) {
  const key = answers?.dailyStretchMinutesBudget || '10_15';
  const totalMin = BUDGET_MINUTES[key] ?? BUDGET_MINUTES['10_15'];
  if (key === 'none' || totalMin <= 0) {
    return { totalSec: 0, perMoment: {} };
  }

  const moments = resolveStretchMomentsFromQuiz(answers);
  if (!moments.length) return { totalSec: 0, perMoment: {} };

  const totalSec = totalMin * 60;
  const perMomentSec = Math.floor(totalSec / moments.length);
  const perMoment = {};

  moments.forEach((moment) => {
    let count = Math.max(1, Math.min(5, Math.floor(perMomentSec / 50)));
    let durationSec = Math.max(40, Math.min(120, Math.round(perMomentSec / count)));
    if (answers?.flexibilityLevel === 'very_stiff' || answers?.flexibilityLevel === 'below_avg') {
      durationSec = Math.min(90, durationSec + 10);
      count = Math.max(1, Math.min(4, count));
    }
    perMoment[moment] = { count, durationSec };
  });

  return { totalSec, perMoment };
}
