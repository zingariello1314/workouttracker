/**
 * Variations banque d’exercices pour Aujourd’hui / modal Variations.
 */
import { exerciseDatabase } from '../data/exerciseDatabase';
import { getExerciseDatabaseKey } from './exerciseHeroContent';

/** Familles connues : clés banque affichées comme variations liées. */
const EXERCISE_VARIATION_FAMILIES = {
  pushups: [
    'pompes',
    'pompes inclinées',
    'pompes déclinées',
    'pompes serrées',
    'pompes lestées',
    'pompes pseudo-planche',
    'pompes sur poignées',
    'pompes en tension continue'
  ],
  pullups: ['tractions pronation', 'tractions supination', 'tractions australiennes'],
  dips: ['dips']
};

function normalizeName(exercise) {
  return String(exercise?.name || exercise?.nom || '')
    .trim()
    .toLowerCase();
}

function detectFamilyId(exercise) {
  const n = normalizeName(exercise);
  if (!n) return null;
  if (/pomp|push[- ]?up/i.test(n)) return 'pushups';
  if (/traction|pull[- ]?up|chin/i.test(n)) return 'pullups';
  if (/dip|répulsion/i.test(n)) return 'dips';
  const key = getExerciseDatabaseKey(exercise);
  if (!key) return null;
  for (const [family, keys] of Object.entries(EXERCISE_VARIATION_FAMILIES)) {
    if (keys.includes(key)) return family;
  }
  return null;
}

function difficultyLabel(difficulty) {
  const d = Number(difficulty);
  if (d <= 1) return 'Débutant';
  if (d === 2) return 'Intermédiaire';
  if (d >= 3) return 'Avancé';
  return 'Intermédiaire';
}

function entryToVariationRow(databaseKey, entry, currentKey) {
  if (!entry) return null;
  return {
    databaseKey,
    name: entry.name || databaseKey,
    difficulty: difficultyLabel(entry.difficulty),
    description: entry.summary || entry.description?.split('\n\n')[0] || entry.description || '',
    primaryMuscles: entry.primaryMuscles || [],
    secondaryMuscles: entry.secondaryMuscles || [],
    equipment: entry.equipment || '',
    fullDescription: entry.description || '',
    isCurrent: databaseKey === currentKey
  };
}

/**
 * @param {object} baseExercise — exercice programme ou { name }
 */
export function listExerciseVariationsForProgramExercise(baseExercise) {
  if (!baseExercise) return [];
  const currentKey = getExerciseDatabaseKey(baseExercise);
  const family = detectFamilyId(baseExercise);

  if (family && EXERCISE_VARIATION_FAMILIES[family]) {
    return EXERCISE_VARIATION_FAMILIES[family]
      .map((k) => entryToVariationRow(k, exerciseDatabase[k], currentKey))
      .filter(Boolean);
  }

  if (!currentKey) return [];
  const base = exerciseDatabase[currentKey];
  if (!base) return [];

  const cat = base.category;
  const equip = String(base.equipment || '').toLowerCase();
  return Object.entries(exerciseDatabase)
    .filter(([k, ex]) => {
      if (k === currentKey) return true;
      if (ex.category !== cat) return false;
      if (equip && String(ex.equipment || '').toLowerCase() !== equip) return false;
      return true;
    })
    .map(([k, ex]) => entryToVariationRow(k, ex, currentKey))
    .filter(Boolean)
    .slice(0, 12);
}

export function hasExerciseVariations(baseExercise) {
  return listExerciseVariationsForProgramExercise(baseExercise).length > 1;
}
