/**
 * Référentiel « cardio / endurance » pour l’onglet Exercices (réglage des coefficients + fiches).
 * Les séances réelles se saisissent dans Sport → Endurance.
 */

import { ExerciseCategories, MuscleGroups, Equipment, Difficulty } from './workoutProgramEnhanced';

const hint = 'Séances réelles : Sport → Endurance (date, durée, distance, type).';

/** Muscles banque — alignés sur les cartes course qui ont déjà un aperçu 3D / .webp stable. */
const RUNNING_CARDIO_MUSCLES = {
  primaryMuscles: ['Mollets', 'Quadriceps', 'Fessiers', 'Ischio-jambiers'],
  secondaryMuscles: ['Core', 'Mollets', 'Grand dorsal', 'Deltoïdes antérieurs', 'Triceps']
};

const CARDIO_REFERENCE_EXERCISES_RAW = [
  {
    id: 'cardio_run_easy',
    name: 'Course — endurance fondamentale / footing',
    series: 'Durée, distance, allure — ' + hint,
    materiel: 'Course à pied',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Allure confortable, conversation possible.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_long',
    name: 'Course — sortie longue',
    series: hint,
    materiel: 'Course à pied',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Volume long à intensité modérée.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_endurance',
    name: 'Course — endurance (allure stable)',
    series: hint,
    materiel: 'Course à pied',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Séance continue hors zone seuil.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_fartlek',
    name: 'Course — fartlek',
    series: hint,
    materiel: 'Course à pied',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Jeux de vitesses libres sur le terrain.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_interval',
    name: 'Course — fractionné / intervalles',
    series: hint,
    materiel: 'Course à pied',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Alternance efforts intenses / récup.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_threshold',
    name: 'Course — seuil (STS)',
    series: hint,
    materiel: 'Course à pied',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Allure tenable ~1 h en course continue.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_tempo',
    name: 'Course — tempo',
    series: hint,
    materiel: 'Course à pied',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Bloc soutenu sous le seuil maximal.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_sprint',
    name: 'Course — sprint / VMA courte',
    series: hint,
    materiel: 'Piste ou terrain',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Répetitions courtes très intenses.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_speed',
    name: 'Course — vitesse / allure rapide',
    series: hint,
    materiel: 'Course à pied',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Sortie ou blocs rapides sous la VMA, zone 4–5.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_recovery',
    name: 'Course — récupération active',
    series: hint,
    materiel: 'Course à pied',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Très facile, zone 1 — relance sans fatigue.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_race',
    name: 'Course — compétition',
    series: hint,
    materiel: 'Course à pied',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Course chronométrée ou événement officiel.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_trail',
    name: 'Course — trail / nature',
    series: hint,
    materiel: 'Sentiers, dénivelé',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Terrain varié, gestion du D+ et descentes.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_hill',
    name: 'Course — côtes / montées',
    series: hint,
    materiel: 'Pente modérée à forte',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Montées répétées ou sortie vallonnée.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_run_walk',
    name: 'Marche active / footing marche',
    series: hint,
    materiel: 'Course à pied',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Marche rapide ou alternance marche-course.',
    ...RUNNING_CARDIO_MUSCLES,
    isCardioReference: true
  },
  {
    id: 'cardio_jumprope',
    name: 'Corde à sauter — endurance / technique',
    series: 'Séances : Sport → Endurance → Corde',
    materiel: 'Corde à sauter',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Sauts, durée, combos.',
    primaryMuscles: ['Mollets', 'Quadriceps', 'Fessiers', 'Core'],
    secondaryMuscles: ['Mollets', 'Grand dorsal', 'Deltoïdes antérieurs', 'Ischio-jambiers', 'Avant-bras'],
    isCardioReference: true
  },
  {
    id: 'cardio_swimming',
    name: 'Natation — endurance / technique',
    series: 'Séances : Sport → Endurance → Natation',
    materiel: 'Piscine',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Longueurs, allures, types de nage.',
    primaryMuscles: [
      'Grand dorsal',
      'Deltoïdes antérieurs',
      'Pectoraux',
      'Triceps brachial',
      'Quadriceps',
      'Mollets',
      'Core'
    ],
    secondaryMuscles: ['Ischio-jambiers', 'Fessiers', 'Biceps brachial', 'Triceps'],
    isCardioReference: true
  },
  {
    id: 'cardio_boxing',
    name: 'Boxe — sac / ring / cardio',
    series: 'Séances : Sport → Endurance → Boxe',
    materiel: 'Gants, sac',
    category: ExerciseCategories.CARDIO,
    muscleGroup: MuscleGroups.FULL_BODY,
    equipment: Equipment.BODYWEIGHT,
    notes: 'Durée, intensité, rounds.',
    primaryMuscles: ['Deltoïdes antérieurs', 'Triceps brachial', 'Mollets', 'Core', 'Quadriceps'],
    secondaryMuscles: ['Fessiers', 'Grand dorsal', 'Biceps brachial', 'Avant-bras', 'Mollets'],
    isCardioReference: true
  }
];

/** Référentiels cardio avec difficulté par défaut pour les filtres de l’onglet Exercices */
export const CARDIO_REFERENCE_EXERCISES = CARDIO_REFERENCE_EXERCISES_RAW.map((ex) => ({
  ...ex,
  difficulty: ex.difficulty ?? Difficulty.INTERMEDIATE
}));
