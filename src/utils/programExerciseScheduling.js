/**
 * Règles de visibilité d'un exercice dans le programme selon la date de séance.
 *
 * Ancienne suppression « logique » (données héritées) : `removedFromProgramAt: 'YYYY-MM-DD'`.
 * Les nouveaux enregistrements retirent l'exercice du schedule ; ce filtre ne s'applique
 * qu'aux anciennes fiches non encore migrées.
 *
 * @param {Object} exercise - Exercice du programme (peut contenir removedFromProgramAt)
 * @param {string} sessionDateStr - Date de la séance au format YYYY-MM-DD
 * @returns {boolean}
 */
export function isExerciseIncludedForSessionDate(exercise, sessionDateStr) {
  if (!exercise || !sessionDateStr || typeof sessionDateStr !== 'string') {
    return true;
  }
  const added = exercise.addedToProgramAt;
  if (added && typeof added === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(added)) {
    if (sessionDateStr < added) return false;
  }
  const removed = exercise.removedFromProgramAt;
  if (!removed || typeof removed !== 'string') {
    return true;
  }
  return false;
}

/**
 * Filtre une liste d'exercices pour une date de séance donnée.
 * @param {Array} exercises
 * @param {string} sessionDateStr
 * @returns {Array}
 */
export function filterExercisesForSessionDate(exercises, sessionDateStr) {
  if (!Array.isArray(exercises)) return [];
  return exercises.filter((ex) => isExerciseIncludedForSessionDate(ex, sessionDateStr));
}
