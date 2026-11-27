/**
 * Index léger des jours d’entraînement — sans reconstruire getWorkoutHistory().
 * Utilisé par la sidebar (compteur hebdo / présence du jour).
 * Parité : un jour compte s’il a au moins une clé reps > 0 (même critère
 * d’entrée que la phase 1 de getWorkoutHistory pour les exercices numériques).
 */

function normalizeRepsValue(value) {
  if (value == null) return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (typeof value === 'object' && value !== null && 'reps' in value) {
    return normalizeRepsValue(value.reps);
  }
  return 0;
}

/**
 * @param {object|null|undefined} workoutData — snapshot getCurrentData()
 * @returns {Set<string>} dates ISO YYYY-MM-DD
 */
export function collectWorkoutDatesFromReps(workoutData) {
  const dates = new Set();
  const reps = workoutData?.reps;
  if (!reps || typeof reps !== 'object') return dates;

  for (const key of Object.keys(reps)) {
    const parts = key.split('_');
    if (parts.length < 2) continue;
    const dateStr = parts[0];
    const exerciseId = parts[1];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
    if (!/^\d+$/.test(exerciseId)) continue;
    if (normalizeRepsValue(reps[key]) > 0) {
      dates.add(dateStr);
    }
  }
  return dates;
}

/**
 * Dates d’activité sidebar : reps + coches + variations (sans construire l’historique riche).
 */
export function collectSidebarWorkoutDates(workoutData) {
  const dates = collectWorkoutDatesFromReps(workoutData);

  const checked = workoutData?.checkedExercises;
  if (checked && typeof checked === 'object') {
    for (const key of Object.keys(checked)) {
      if (!checked[key]) continue;
      const dateStr = key.split('_')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) dates.add(dateStr);
    }
  }

  const variations = workoutData?.dailyVariations;
  if (variations && typeof variations === 'object') {
    for (const dateStr of Object.keys(variations)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) dates.add(dateStr);
    }
  }

  return dates;
}

/**
 * Aligné sur useSidebarData historique : `weekAgo = today - 7` puis `date >= weekAgoStr`.
 * @param {object|null|undefined} workoutData
 * @param {string} todayIso
 * @param {number} [daysBack=7]
 */
export function countWorkoutDaysSince(workoutData, todayIso, daysBack = 7) {
  const dates = collectSidebarWorkoutDates(workoutData);
  if (!dates.size || !todayIso) return 0;

  const end = new Date(`${todayIso}T12:00:00`);
  if (Number.isNaN(end.getTime())) return 0;
  const start = new Date(end);
  start.setDate(start.getDate() - daysBack);
  const startStr = start.toISOString().slice(0, 10);

  let count = 0;
  for (const d of dates) {
    if (d >= startStr && d <= todayIso) count += 1;
  }
  return count;
}

export function hasWorkoutOnDate(workoutData, dateIso) {
  if (!dateIso) return false;
  return collectSidebarWorkoutDates(workoutData).has(dateIso);
}

export { normalizeRepsValue as normalizeRepsValueForDayIndex };
