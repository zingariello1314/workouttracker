/**
 * Persistance / export des données de charge (poids saisi, par bras, séries).
 * Centralise les sous-ensembles par date pour feedback de séance et audits.
 */

/**
 * Extrait les maps de charge dont les clés commencent par `YYYY-MM-DD_`.
 * @param {object} workoutData
 * @param {string} dateStr
 * @returns {{ dateStr: string, exerciseWeights: object, exerciseWeightPerArm: object, exerciseSetWeights: object }|null}
 */
export function collectWorkoutLoadSubsetForDate(workoutData, dateStr) {
  if (!workoutData || typeof workoutData !== 'object' || !dateStr) return null;
  const prefix = `${dateStr}_`;
  const pick = (obj) => {
    if (!obj || typeof obj !== 'object') return {};
    const out = {};
    Object.keys(obj).forEach((k) => {
      if (k.startsWith(prefix)) out[k] = obj[k];
    });
    return out;
  };
  const exerciseSetWeights = pick(workoutData.exerciseSetWeights);
  // Sérialisation sûre : tableaux copiés
  const setCopy = {};
  Object.entries(exerciseSetWeights).forEach(([k, arr]) => {
    setCopy[k] = Array.isArray(arr) ? [...arr] : arr;
  });
  return {
    dateStr,
    exerciseWeights: pick(workoutData.exerciseWeights),
    exerciseWeightPerArm: pick(workoutData.exerciseWeightPerArm),
    exerciseSetWeights: setCopy
  };
}
