/**
 * Formatage des stats sport du calendrier (vue année).
 */

/** @param {number} minutes */
export function roundSportMinutes(minutes) {
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return 0;
  return Math.round(m);
}

/**
 * Affiche une durée en heures + minutes (ex. 1h 08m, 45m).
 * @param {number} minutes
 */
export function formatCalendarSportDuration(minutes) {
  const total = roundSportMinutes(minutes);
  if (total <= 0) return '0m';
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h <= 0) return `${m}m`;
  if (m <= 0) return `${h}h`;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

/**
 * Indices des mois record pour chaque métrique (tie → premier mois gagnant).
 * @param {Array<{ sportStats?: object }>} months
 */
export function computeYearSportRecordHolders(months) {
  const metrics = [
    'totalReps',
    'runningKm',
    'runningMinutes',
    'otherExerciseMinutes',
    'totalMinutes',
    'totalKg',
    'longestStreak',
    'activeKcal'
  ];
  const holders = {};
  metrics.forEach((metric) => {
    let bestIdx = -1;
    let bestVal = -1;
    (months || []).forEach((month, idx) => {
      const v = Number(month?.sportStats?.[metric]) || 0;
      if (v > bestVal) {
        bestVal = v;
        bestIdx = idx;
      }
    });
    holders[metric] = bestVal > 0 ? bestIdx : -1;
  });
  return holders;
}
