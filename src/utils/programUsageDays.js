/**
 * Index des jours avec au moins un exercice coché — évite de parcourir
 * tout checkedExercises pour chaque carte programme (freeze UI).
 */

/**
 * @param {Record<string, boolean>|null|undefined} checkedExercises
 * @returns {Set<string>} dates YYYY-MM-DD
 */
export function buildExerciseDaysSet(checkedExercises) {
  const days = new Set();
  if (!checkedExercises || typeof checkedExercises !== 'object') return days;

  for (const key of Object.keys(checkedExercises)) {
    if (!checkedExercises[key]) continue;
    const dateStr = key.split('_')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      days.add(dateStr);
    }
  }
  return days;
}

/**
 * @param {{ startDate?: string, endDate?: string|null }} program
 * @param {Set<string>} exerciseDays
 * @returns {number}
 */
export function countProgramUsageDays(program, exerciseDays) {
  if (!program?.startDate || !exerciseDays?.size) return 0;

  const programStartDate = new Date(program.startDate);
  programStartDate.setHours(0, 0, 0, 0);

  const endDate = program.endDate ? new Date(program.endDate) : new Date();
  endDate.setHours(23, 59, 59, 999);

  let count = 0;
  for (const dateStr of exerciseDays) {
    const exerciseDate = new Date(`${dateStr}T00:00:00`);
    if (exerciseDate >= programStartDate && exerciseDate <= endDate) {
      count += 1;
    }
  }
  return count;
}
