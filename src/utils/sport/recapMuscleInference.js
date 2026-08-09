/**

 * Infère les groupes musculaires (enum MuscleGroups) pour un exo du programme.

 * S’appuie sur exerciseDatabase + libellés fins (`fineMuscleToVisualGroup`).

 */

import { MuscleGroups } from '../../data/workoutProgramEnhanced';

import { findExerciseInDatabase, exerciseDatabase } from '../../data/exerciseDatabase';

import { resolveVisualGroupsFromLabels } from '../anatomy/fineMuscleToVisualGroup';



function dbLookupFlexible(name) {

  if (!name) return null;

  const n = String(name).toLowerCase().trim();

  let hit = findExerciseInDatabase(n);

  if (hit) return hit;

  const base = n.split('(')[0].trim();

  hit = findExerciseInDatabase(base);

  if (hit) return hit;

  for (const key of Object.keys(exerciseDatabase)) {

    if (n.includes(key) || key.includes(n.slice(0, Math.min(n.length, 12)))) {

      return exerciseDatabase[key];

    }

  }

  return null;

}



function heuristicGroupsFromName(name) {

  const n = String(name || '').toLowerCase();

  const s = new Set();



  if (/traction|rowing|tirage|lat pulldown|soulevé|souleve|deadlift|rdl|face pull|oiseau|shrimp|austral/.test(n)) {

    s.add(MuscleGroups.BACK);

  }

  if (/pomp|push-up|pushup|développé couch|developpe couche|bench|pec|écarté|ecarte|dip/.test(n)) {

    s.add(MuscleGroups.CHEST);

  }

  if (/curl|biceps/.test(n) && !/wrist|poignet|avant[- ]?bras|forearm/.test(n)) {

    s.add(MuscleGroups.BICEPS);

  }

  if (/wrist|poignet|avant[- ]?bras|forearm|farmer|dead hang|prise|grip|doigt|interosseux|lombric/.test(n)) {

    s.add(MuscleGroups.FOREARMS);

  }

  if (/triceps|extension.*coude|kickback|skull/.test(n)) {

    s.add(MuscleGroups.TRICEPS);

  }

  if (/épaule|elevation|élévation|militaire|développé.*militaire|lateral|latéral|oiseau|face pull/.test(n)) {

    s.add(MuscleGroups.SHOULDERS);

  }

  if (/chin tuck|nuque|cou|cervical|sterno|splenius|neck/.test(n) && !/poignet|wrist|doigt/.test(n)) {

    s.add(MuscleGroups.NECK);

  }

  if (/hip thrust|fessier|glute bridge|pont fessier/.test(n)) {

    s.add(MuscleGroups.GLUTES);

  }

  if (/sumo|copenhagen|adduct|presse large/.test(n)) {

    s.add(MuscleGroups.ADDUCTORS);

  }



  if (/mollet|gastroc|soleaire|soléaire|calf|élévation.*pointe|relev.*mollet|tibialis raise/.test(n)) {

    s.add(MuscleGroups.CALVES);

    return [...s];

  }



  if (/tibial|tibialis|dorsiflex|dorsi-flex|toe raise|relev[eé] pointes talon|relev[eé]s tibial/.test(n)) {

    s.add(MuscleGroups.TIBIALIS_ANTERIOR);

  }



  if (/squat|fente|presse|leg curl|leg extension|good morning|wall sit|saut[eé]|box jump|hip thrust/.test(n)) {

    s.add(MuscleGroups.QUADS);

    s.add(MuscleGroups.GLUTES);

    s.add(MuscleGroups.HAMSTRINGS);

  } else if (/ischio|hamstring|rdl|deadlift|good morning/.test(n)) {

    s.add(MuscleGroups.HAMSTRINGS);

    s.add(MuscleGroups.GLUTES);

  }



  if (/planche|gainage|crunch|vacuum|mountain|abdo|core|hollow|l-sit|relevé.*genou/.test(n)) {

    s.add(MuscleGroups.CORE);

  }

  if (/boxe|natation|swim|course|run|corde|jump|cardio/.test(n)) {

    s.add(MuscleGroups.FULL_BODY);

  }

  return [...s];

}



function rolesFromDatabase(name) {

  const db = dbLookupFlexible(name);

  if (!db) return null;

  const { primaryIds, secondaryIds } = resolveVisualGroupsFromLabels(

    db.primaryMuscles,

    db.secondaryMuscles

  );

  if (primaryIds.size === 0 && secondaryIds.size === 0) return null;

  return {

    primary: [...primaryIds],

    secondary: [...secondaryIds]

  };

}



/**

 * Rôles primaire / secondaire pour la répartition du volume Récap.

 * @returns {{ primary: string[], secondary: string[] }}

 */

export function inferMuscleLoadRolesForExercise(exerciseLike) {

  const name = exerciseLike?.name || exerciseLike?.nom || '';

  const fromDb = rolesFromDatabase(name);

  if (fromDb) return fromDb;



  const heuristic = heuristicGroupsFromName(name);

  if (heuristic.length) {

    return { primary: heuristic, secondary: [] };

  }

  return { primary: [MuscleGroups.FULL_BODY], secondary: [] };

}



/**

 * @param {{ name?: string, id?: string|number, series?: string, type?: string }} exerciseLike

 * @returns {string[]} ids MuscleGroups (union primaire + secondaire)

 */

export function inferMuscleGroupsForExercise(exerciseLike) {

  const { primary, secondary } = inferMuscleLoadRolesForExercise(exerciseLike);

  return [...new Set([...primary, ...secondary])];

}

