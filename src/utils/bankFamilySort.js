function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Types d’exercice (enum programme) — pas des groupes musculaires affichés en banque. */
const EXERCISE_TYPE_KEYS = new Set([
  'strength',
  'cardio',
  'flexibility',
  'core',
  'isometric',
  'boxing',
  'swimming',
  'mobility'
]);

const MUSCLE_GROUP_TO_FR = {
  chest: 'Pectoraux',
  back: 'Dorsaux',
  shoulders: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Jambes',
  quads: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  calves: 'Mollets',
  core: 'Abdominaux',
  full_body: 'Corps entier'
};

/** Libellés français canoniques pour les sous-sections banque. */
export const CANONICAL_MUSCLE_CATEGORIES = [
  'Abdominaux',
  'Biceps',
  'Cardio',
  'Corps entier',
  'Dorsaux',
  'Épaules',
  'Fessiers',
  'Ischio-jambiers',
  'Mollets',
  'Pectoraux',
  'Quadriceps',
  'Triceps',
  'Autres'
];

function titleCaseMuscleLabel(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  if (/^abdominaux$/i.test(s)) return 'Abdominaux';
  if (/^pectoraux$/i.test(s)) return 'Pectoraux';
  if (/^dorsaux$/i.test(s)) return 'Dorsaux';
  if (/^epaules$/i.test(s) || /^épaules$/i.test(s)) return 'Épaules';
  if (/^ischio/i.test(s)) return 'Ischio-jambiers';
  if (/^quadriceps$/i.test(s)) return 'Quadriceps';
  if (/^mollets$/i.test(s)) return 'Mollets';
  if (/^fessiers$/i.test(s)) return 'Fessiers';
  if (/^biceps$/i.test(s)) return 'Biceps';
  if (/^triceps$/i.test(s)) return 'Triceps';
  if (/^abdos$/i.test(s) || /^core$/i.test(s)) return 'Abdominaux';
  if (/^cardio/i.test(s)) return 'Cardio';
  if (/^corps entier$/i.test(s)) return 'Corps entier';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Libellé muscle français pour regroupement banque (Pectoraux, Abdominaux…).
 * @param {object} exercise
 */
export function getExerciseMuscleCategory(exercise) {
  if (!exercise) return 'Autres';
  const fromDb = exercise.muscleCategory || exercise.categoryLabel;
  if (fromDb && !EXERCISE_TYPE_KEYS.has(normalize(fromDb))) {
    return titleCaseMuscleLabel(fromDb);
  }
  const rawCat = String(exercise.category || '').trim();
  if (rawCat && !EXERCISE_TYPE_KEYS.has(normalize(rawCat))) {
    return titleCaseMuscleLabel(rawCat);
  }
  const mgKey = normalize(exercise.muscleGroup);
  if (MUSCLE_GROUP_TO_FR[mgKey]) return MUSCLE_GROUP_TO_FR[mgKey];
  if (rawCat) return titleCaseMuscleLabel(rawCat);
  return 'Autres';
}

const STRETCH_ZONE_ORDER = [
  'respiration',
  'cou',
  'epaules',
  'thoracique',
  'poitrine',
  'dos',
  'lombaires',
  'bras',
  'tronc',
  'hanches',
  'fessiers',
  'quadriceps',
  'ischios',
  'mollets',
  'full'
];

function rankByList(value, list) {
  const norm = normalize(value);
  const idx = list.findIndex((x) => normalize(x) === norm);
  return idx === -1 ? 999 : idx;
}

function getExerciseFamilyRank(exercise) {
  const category = normalize(getExerciseMuscleCategory(exercise));
  const name = normalize(exercise?.name);
  const isCardio =
    exercise?.isCardioReference === true ||
    category.includes('cardio') ||
    name.includes('course') ||
    name.includes('natation') ||
    name.includes('corde') ||
    name.includes('boxe');
  if (isCardio) return 2;
  if (
    category.includes('quadriceps') ||
    category.includes('ischio') ||
    category.includes('fessier') ||
    category.includes('mollet')
  ) {
    return 1;
  }
  if (category.includes('activites complementaires')) return 3;
  return 0;
}

export function getExerciseFamilyKey(exercise) {
  const rank = getExerciseFamilyRank(exercise);
  if (rank === 0) return 'upper_body';
  if (rank === 1) return 'lower_body';
  if (rank === 2) return 'cardio';
  return 'other';
}

export function getExerciseFamilyLabel(exercise) {
  const key = getExerciseFamilyKey(exercise);
  if (key === 'upper_body') return 'Haut du corps';
  if (key === 'lower_body') return 'Bas du corps';
  if (key === 'cardio') return 'Cardio / endurance';
  return 'Autres exercices';
}

export function sortExercisesByFamily(items) {
  const list = Array.isArray(items) ? [...items] : [];
  list.sort((a, b) => {
    const familyA = getExerciseFamilyRank(a);
    const familyB = getExerciseFamilyRank(b);
    if (familyA !== familyB) return familyA - familyB;
    const catA = getExerciseMuscleCategory(a);
    const catB = getExerciseMuscleCategory(b);
    const catCmp = catA.localeCompare(catB, 'fr');
    if (catCmp !== 0) return catCmp;
    return String(a?.name || '').localeCompare(String(b?.name || ''), 'fr');
  });
  return list;
}

export function getStretchFamilyKey(stretch) {
  const cat = normalize(stretch?.category);
  if (cat.includes('drill')) return 'drills_course';
  const zone = normalize(stretch?.bodyZone);
  if (zone === 'respiration') return 'respiration';
  if (zone === 'cou' || zone === 'epaules' || zone === 'thoracique' || zone === 'poitrine' || zone === 'bras' || zone === 'tronc') {
    return 'upper_mobility';
  }
  if (zone === 'dos' || zone === 'lombaires') return 'back';
  if (zone === 'hanches' || zone === 'fessiers' || zone === 'quadriceps' || zone === 'ischios' || zone === 'mollets') {
    return 'lower_mobility';
  }
  return 'full_body';
}

export function getStretchFamilyLabel(stretch) {
  const key = getStretchFamilyKey(stretch);
  if (key === 'respiration') return 'Respiration';
  if (key === 'drills_course') return 'Drills course / coordination';
  if (key === 'upper_mobility') return 'Mobilité haut du corps';
  if (key === 'back') return 'Dos / lombaires';
  if (key === 'lower_mobility') return 'Hanches / jambes';
  return 'Corps entier';
}

export function sortStretchesByFamily(items) {
  const list = Array.isArray(items) ? [...items] : [];
  list.sort((a, b) => {
    const zoneA = rankByList(a?.bodyZone, STRETCH_ZONE_ORDER);
    const zoneB = rankByList(b?.bodyZone, STRETCH_ZONE_ORDER);
    if (zoneA !== zoneB) return zoneA - zoneB;
    const catA = String(a?.category || '');
    const catB = String(b?.category || '');
    const catCmp = catA.localeCompare(catB, 'fr');
    if (catCmp !== 0) return catCmp;
    return String(a?.name || '').localeCompare(String(b?.name || ''), 'fr');
  });
  return list;
}

export function getFoodFamilyKey(food) {
  return String(food?.category || 'Autres');
}

export function getFoodFamilyLabel(food) {
  return String(food?.category || 'Autres');
}

export function sortFoodsByFamily(items) {
  const list = Array.isArray(items) ? [...items] : [];
  list.sort((a, b) => {
    const catCmp = String(a?.category || '').localeCompare(String(b?.category || ''), 'fr');
    if (catCmp !== 0) return catCmp;
    return String(a?.name || '').localeCompare(String(b?.name || ''), 'fr');
  });
  return list;
}
