/**
 * Intensité « heatmap » du calendrier finance : même pipeline relatif que livres / sport (composite01).
 * @module utils/finance/financeCalendarIntensity
 */

import { getDateStr } from '../dateUtils';
import { applyRelativePerformanceTint } from '../calendarRelativeDayRanking';
import {
  buildFinanceCalendarDayMap,
  daysInMonth,
  emptyFinanceDayAgg,
} from './financeCalendarAggregates';

/** @param {object | null | undefined} agg — agrégat jour (financeCalendarAggregates) */
export function hasFinanceDayActivity(agg) {
  if (!agg) return false;
  return (
    (agg.budgetCount || 0) > 0 ||
    (agg.plannedCount || 0) > 0 ||
    (agg.chargeCount || 0) > 0 ||
    (agg.portfolioAdds || 0) > 0 ||
    (agg.shoppingDone || 0) > 0 ||
    (agg.acquisitionCount || 0) > 0 ||
    (agg.loisirsMois || 0) > 0
  );
}

/**
 * Score brut journalier (sous-additif sur les montants pour ne pas écraser livres / sport / quêtes).
 * @param {object} agg
 */
export function computeFinanceRawIntensityScore(agg) {
  if (!agg || !hasFinanceDayActivity(agg)) return 0;
  const spend = Number(agg.budgetSpend) || 0;
  const spendCurve = Math.min(95, Math.pow(Math.max(0, spend), 0.52));
  const loisirs = Number(agg.loisirsMois) || 0;
  const loisirsCurve = loisirs > 0 ? 28 + Math.min(55, Math.log10(1 + loisirs) * 22) : 0;
  return (
    (agg.budgetCount || 0) * 13 +
    spendCurve * 1.85 +
    (agg.plannedCount || 0) * 10 +
    (agg.chargeCount || 0) * 15 +
    (agg.portfolioAdds || 0) * 22 +
    (agg.acquisitionCount || 0) * 24 +
    (agg.shoppingDone || 0) * 18 +
    loisirsCurve
  );
}

const neutralFinanceIntensityShell = () => ({
  intensityScore: 0,
  visualContext: { composite01: 0, visualScore100: 0 },
  level: 0,
  financeDay: null,
});

/**
 * @param {Parameters<typeof buildFinanceCalendarDayMap>[0]} inputBase — year, monthIndex + sources
 * @returns {Map<string, object>}
 */
export function buildFinanceMonthIntensityMap(year, monthIndex, inputBase) {
  const dayMap = buildFinanceCalendarDayMap({ ...inputBase, year, monthIndex });
  const monthDate = new Date(year, monthIndex, 1);
  const last = daysInMonth(year, monthIndex);
  const raw = new Map();

  for (let d = 1; d <= last; d += 1) {
    const dt = new Date(year, monthIndex, d);
    const dateStr = getDateStr(dt);
    const agg = dayMap.get(dateStr) || emptyFinanceDayAgg();
    const score = computeFinanceRawIntensityScore(agg);
    raw.set(dateStr, {
      ...neutralFinanceIntensityShell(),
      intensityScore: score,
      financeDay: agg,
    });
  }

  return applyRelativePerformanceTint(raw, 'month', monthDate, {
    getScore: (int) => Number(int.intensityScore) || 0,
    hasActivity: (int) => hasFinanceDayActivity(int.financeDay),
  });
}
