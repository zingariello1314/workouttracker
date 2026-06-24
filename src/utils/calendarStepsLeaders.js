import {
  normalizeManualDailyWalkByDate,
  resolveDailySteps
} from './sport/manualDailyWalkUtils';

/**
 * Top 3 jours par nombre de pas fusionnés (Garmin + manuel) sur une année civile.
 * @returns {{ topThree: Array<{ date: string, steps: number }>, rankByDate: Record<string, 1|2|3> }}
 */
export function computeCalendarStepsLeaders(workoutData, garminData, year = new Date().getFullYear()) {
  const yearPrefix = `${year}-`;
  const manualByDate = normalizeManualDailyWalkByDate(
    workoutData?.enduranceData?.manualDailyWalkByDate
  );
  const daily = garminData?.dailyMetrics || {};
  const byDate = new Map();

  const addDay = (dateStr, garminSteps, manualEntry) => {
    if (!dateStr || !dateStr.startsWith(yearPrefix)) return;
    const resolved = resolveDailySteps(
      Number(garminSteps) || 0,
      manualEntry?.steps ? manualEntry : null
    );
    if (resolved.total > 0) {
      byDate.set(dateStr, resolved.total);
    }
  };

  Object.entries(daily).forEach(([dateStr, metrics]) => {
    addDay(dateStr, metrics?.steps, manualByDate[dateStr]);
  });

  Object.entries(manualByDate).forEach(([dateStr, manualEntry]) => {
    if (byDate.has(dateStr)) return;
    addDay(dateStr, 0, manualEntry);
  });

  const sorted = [...byDate.entries()]
    .map(([date, steps]) => ({ date, steps }))
    .sort((a, b) => b.steps - a.steps);

  const topThree = sorted.slice(0, 3);
  const rankByDate = {};
  topThree.forEach((entry, idx) => {
    rankByDate[entry.date] = idx + 1;
  });

  return { topThree, rankByDate };
}

export function stepsLeaderEmoji(rank) {
  if (rank === 1) return '👣';
  return null;
}

/** Libellé texte pour le 2e / 3e jour en pas (sans médaille — réservée au classement champion). */
export function formatStepsRankLabel(rank) {
  if (rank === 2) return '2e';
  if (rank === 3) return '3e';
  return null;
}
