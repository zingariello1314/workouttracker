/** Kcal actives journalières Garmin (même logique que calendarDayChampion). */
export function activeKcalFromDaily(daily) {
  if (!daily) return 0;
  if (daily.calories && typeof daily.calories === 'object') {
    const n = Number(daily.calories.active);
    return Number.isFinite(n) ? Math.round(n) : 0;
  }
  const raw = daily.activeKilocalories ?? daily.activeKcal;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * Jour de l'année avec le plus de kcal actives Garmin.
 * @returns {{ topDay: { date: string, kcal: number } | null, leaderDate: string | null }}
 */
export function computeCalendarKcalLeader(garminData, year = new Date().getFullYear()) {
  const yearPrefix = `${year}-`;
  const daily = garminData?.dailyMetrics || {};
  let best = null;

  Object.entries(daily).forEach(([dateStr, metrics]) => {
    if (!dateStr.startsWith(yearPrefix)) return;
    const kcal = activeKcalFromDaily(metrics);
    if (kcal <= 0) return;
    if (!best || kcal > best.kcal) {
      best = { date: dateStr, kcal };
    }
  });

  return {
    topDay: best,
    leaderDate: best?.date ?? null
  };
}

export const KCAL_LEADER_EMOJI = '🔥';
