/**
 * Masque les lignes programme « GTG » dans Aujourd’hui (affichées dans l’emploi du temps GTG).
 */

const GTG_TEXT = /\bgtg\b|grease the groove/i;

export function exerciseLooksLikeGtgProgramSlot(exercise) {
  if (!exercise || typeof exercise !== 'object') return false;
  const blob = [
    exercise.series,
    exercise.materiel,
    exercise.notes,
    exercise.note
  ]
    .filter(Boolean)
    .join(' ');
  return GTG_TEXT.test(blob);
}

/** @returns {boolean} true = ne pas afficher dans la liste programme du haut */
export function shouldHideProgramExerciseOnTodayTab(exercise) {
  return exerciseLooksLikeGtgProgramSlot(exercise);
}
