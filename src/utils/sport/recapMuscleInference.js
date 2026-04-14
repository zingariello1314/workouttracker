/**
 * Infère les groupes musculaires (enum MuscleGroups) pour un exo du programme.
 * S’appuie sur exerciseDatabase (FR) puis heuristiques sur le nom.
 */
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { findExerciseInDatabase, exerciseDatabase } from '../../data/exerciseDatabase';

/** Libellés FR (exerciseDatabase) → id stable recap. */
const FRENCH_LABEL_TO_GROUP = new Map(
  Object.entries({
    pectoraux: MuscleGroups.CHEST,
    'pectoraux supérieurs': MuscleGroups.CHEST,
    'pectoraux inférieurs': MuscleGroups.CHEST,
    triceps: MuscleGroups.TRICEPS,
    'triceps brachial': MuscleGroups.TRICEPS,
    biceps: MuscleGroups.BICEPS,
    bras: MuscleGroups.BICEPS,
    'deltoïdes': MuscleGroups.SHOULDERS,
    'deltoïdes antérieurs': MuscleGroups.SHOULDERS,
    'deltoïdes moyens': MuscleGroups.SHOULDERS,
    'deltoïdes postérieurs': MuscleGroups.SHOULDERS,
    épaules: MuscleGroups.SHOULDERS,
    'grand dorsal': MuscleGroups.BACK,
    rhomboïdes: MuscleGroups.BACK,
    trapèzes: MuscleGroups.BACK,
    'trapèzes moyens': MuscleGroups.BACK,
    'trapèzes supérieurs': MuscleGroups.BACK,
    'érecteurs du rachis': MuscleGroups.BACK,
    dorsaux: MuscleGroups.BACK,
    dos: MuscleGroups.BACK,
    fessiers: MuscleGroups.HAMSTRINGS,
    quadriceps: MuscleGroups.QUADS,
    'ischio-jambiers': MuscleGroups.HAMSTRINGS,
    mollets: MuscleGroups.CALVES,
    'tibial antérieur': MuscleGroups.TIBIALIS_ANTERIOR,
    'tibial anterieur': MuscleGroups.TIBIALIS_ANTERIOR,
    tibialis: MuscleGroups.TIBIALIS_ANTERIOR,
    'tibialis anterior': MuscleGroups.TIBIALIS_ANTERIOR,
    core: MuscleGroups.CORE,
    obliques: MuscleGroups.CORE,
    "grand droit de l'abdomen": MuscleGroups.CORE,
    abdominaux: MuscleGroups.CORE,
    abdomen: MuscleGroups.CORE
  }).map(([k, v]) => [k.toLowerCase(), v])
);

function mapFrenchMuscleLabel(label) {
  if (!label || typeof label !== 'string') return null;
  const key = label.trim().toLowerCase();
  return FRENCH_LABEL_TO_GROUP.get(key) || null;
}

function addMuscleLabelToSet(label, groups) {
  const key = String(label || '')
    .trim()
    .toLowerCase();
  if (!key) return;
  if (key === 'jambes') {
    groups.add(MuscleGroups.QUADS);
    groups.add(MuscleGroups.HAMSTRINGS);
    groups.add(MuscleGroups.CALVES);
    return;
  }
  const g = mapFrenchMuscleLabel(label);
  if (g) groups.add(g);
}

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
  if (/curl|biceps/.test(n)) s.add(MuscleGroups.BICEPS);
  if (/triceps|extension.*coude|kickback|skull/.test(n)) s.add(MuscleGroups.TRICEPS);
  if (/épaule|elevation|élévation|militaire|développé.*militaire|lateral|latéral|oiseau|face pull/.test(n)) {
    s.add(MuscleGroups.SHOULDERS);
  }
  if (/squat|fente|presse|leg curl|leg extension|mollet|hip thrust|good morning|ischio|quad|jambe|fessier|rdl|deadlift/.test(n)) {
    s.add(MuscleGroups.QUADS);
    s.add(MuscleGroups.HAMSTRINGS);
    s.add(MuscleGroups.CALVES);
  }
  if (/tibial|tibialis|dorsiflex|dorsi-flex|toe raise|relev[eé] pointes talon|relev[eé]s tibial/.test(n)) {
    s.add(MuscleGroups.TIBIALIS_ANTERIOR);
  }
  if (/planche|gainage|crunch|vacuum|mountain|abdo|core|hollow|l-sit|relevé.*genou/.test(n)) {
    s.add(MuscleGroups.CORE);
  }
  if (/boxe|natation|swim|course|run|corde|jump|cardio/.test(n)) {
    s.add(MuscleGroups.FULL_BODY);
  }
  return [...s];
}

/**
 * @param {{ name?: string, id?: string|number, series?: string, type?: string }} exerciseLike
 * @returns {string[]} ids MuscleGroups
 */
export function inferMuscleGroupsForExercise(exerciseLike) {
  const name = exerciseLike?.name || exerciseLike?.nom || '';
  const groups = new Set();

  const db = dbLookupFlexible(name);
  if (db) {
    (db.primaryMuscles || []).forEach((m) => addMuscleLabelToSet(m, groups));
    (db.secondaryMuscles || []).forEach((m) => addMuscleLabelToSet(m, groups));
  }

  if (groups.size === 0) {
    heuristicGroupsFromName(name).forEach((g) => groups.add(g));
  }

  if (groups.size === 0) {
    groups.add(MuscleGroups.FULL_BODY);
  }

  return [...groups];
}
