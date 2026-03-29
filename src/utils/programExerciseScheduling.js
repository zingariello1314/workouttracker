/**
 * Règles de visibilité d'un exercice dans le programme selon la date de séance.
 *
 * Suppression « logique » : l'exercice reste dans `schedule[...].exercises` avec
 * `removedFromProgramAt: 'YYYY-MM-DD'` (date du retrait depuis l'éditeur de programme).
 *
 * - Tant que `removedFromProgramAt` est absent : l'exo apparaît pour toutes les dates.
 * - Une fois retiré : il reste visible en saisie / calendrier pour les séances dont
 *   la date est <= date de retrait (inclus). Après cette date, il disparaît des
 *   séances futures tout en conservant l'historique (reps, cases cochées) déjà enregistré.
 *
 * @param {Object} exercise - Exercice du programme (peut contenir removedFromProgramAt)
 * @param {string} sessionDateStr - Date de la séance au format YYYY-MM-DD
 * @returns {boolean}
 */
export function isExerciseIncludedForSessionDate(exercise, sessionDateStr) {
  if (!exercise || !sessionDateStr || typeof sessionDateStr !== 'string') {
    return true;
  }
  const removed = exercise.removedFromProgramAt;
  if (!removed || typeof removed !== 'string') {
    return true;
  }
  const r = removed.slice(0, 10);
  const s = sessionDateStr.slice(0, 10);
  return s <= r;
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
