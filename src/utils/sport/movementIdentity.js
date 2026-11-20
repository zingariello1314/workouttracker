/**
 * Trois identités restent distinctes :
 * - stockage : la clé qui porte les répétitions ;
 * - occurrence : une ligne dans une prescription datée ;
 * - mouvement : le geste, qui n'est pas prouvé par un homonyme ni par une date dans le titre.
 * Deux lignes de même nom ne sont pas fusionnées.
 */

export function identityRoles({ storageId, occurrenceId = null, movementName = null }) {
  return {
    storageId: storageId == null ? null : String(storageId),
    occurrenceId: occurrenceId == null ? null : String(occurrenceId),
    movementName: movementName || null,
    merged: false
  };
}

/** Vrai si une autre ligne de stockage, même nom, a été pratiquée dans le trou. */
export function sameNameActiveDuringGap(exercise, exercisesByDate, gapDate, firstInWindow) {
  if (!exercise?.name || !gapDate || !firstInWindow) return false;
  return Object.entries(exercisesByDate || {}).some(([date, list]) => {
    if (date <= gapDate || date >= firstInWindow) return false;
    return (list || []).some(
      (row) =>
        String(row.id) !== String(exercise.id) &&
        row.name &&
        row.name === exercise.name
    );
  });
}
