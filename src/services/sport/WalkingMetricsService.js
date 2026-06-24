/**
 * Métriques marche / pas — couche domaine au-dessus de resolveDailySteps.
 */

import {
  normalizeManualDailyWalkByDate,
  resolveDailySteps,
  computeStepsXpFromResolved,
  sumMergedDailyStepsTotal
} from '../../utils/sport/manualDailyWalkUtils';

/**
 * Pas résolus pour un jour.
 * @param {object | null | undefined} dailyMetricsRow — garminData.dailyMetrics[date]
 * @param {object | null | undefined} manualEntry — manualDailyWalkByDate[date]
 */
export function getDaySteps(dailyMetricsRow, manualEntry) {
  const gSteps =
    dailyMetricsRow?.steps != null && Number.isFinite(Number(dailyMetricsRow.steps))
      ? Math.max(0, Math.round(Number(dailyMetricsRow.steps)))
      : 0;
  return resolveDailySteps(gSteps, manualEntry || null);
}

/**
 * Agrège pas + XP lifetime sur l'union des jours Garmin et manuels.
 * @param {Record<string, object>} dailyMetrics
 * @param {Record<string, object>} manualByDateRaw
 */
export function computeLifetimeStepsMetrics(dailyMetrics, manualByDateRaw) {
  const manual = normalizeManualDailyWalkByDate(manualByDateRaw);
  const dm = dailyMetrics && typeof dailyMetrics === 'object' ? dailyMetrics : {};
  const keys = new Set([...Object.keys(dm), ...Object.keys(manual)]);

  let totalSteps = 0;
  let stepsXp = 0;
  let stepsXpVerified = 0;
  let stepsXpDeclarative = 0;

  keys.forEach((dateKey) => {
    const resolved = getDaySteps(dm[dateKey], manual[dateKey]);
    const xp = computeStepsXpFromResolved(resolved);
    totalSteps += resolved.total;
    stepsXp += xp.stepsXp;
    stepsXpVerified += xp.stepsXpVerified;
    stepsXpDeclarative += xp.stepsXpDeclarative;
  });

  return {
    totalSteps,
    stepsXp,
    stepsXpVerified,
    stepsXpDeclarative
  };
}

/** Rétrocompat — total pas fusionnés (lifetime). */
export function sumLifetimeMergedSteps(dailyMetrics, manualByDateRaw) {
  return sumMergedDailyStepsTotal(dailyMetrics, manualByDateRaw);
}
