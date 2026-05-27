/**
 * Construit un objet « carte banque » cohérent avec `SportBankExerciseCard` / filtres à partir d’une clé DB.
 */

import { exerciseDatabase } from '../data/exerciseDatabase';
import { Difficulty as DifficultyEnum } from '../data/workoutProgramEnhanced';
import { enrichExercise, inferTrainingDiscipline } from './programUtils';

function dbKeyToSyntheticId(key) {
  return `db_${key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()}`;
}

/** @param {string} key — clé exerciseDatabase */
export function buildBankExerciseViewFromDatabaseKey(key, t = (k, d = '') => d) {
  const ex = exerciseDatabase[key];
  if (!ex) return null;

  const name = ex.name || key;
  const rawEq = ex.equipment || '';
  const base = enrichExercise({
    id: dbKeyToSyntheticId(key),
    name,
    materiel: rawEq,
    notes: ex.description || '',
    secondaryMuscles: ex.secondaryMuscles || [],
    primaryMuscles: ex.primaryMuscles || [],
    difficulty:
      typeof ex.difficulty === 'number' &&
      ex.difficulty >= DifficultyEnum.BEGINNER &&
      ex.difficulty <= DifficultyEnum.EXPERT
        ? ex.difficulty
        : DifficultyEnum.BEGINNER
  });

  const discipline = inferTrainingDiscipline({
    ...base,
    rawEquipment: rawEq
  });

  const muscleCategory = ex.category || null;

  return {
    ...base,
    databaseKey: key,
    /** Groupe musculaire français (banque / sous-titres). */
    muscleCategory,
    categoryLabel: muscleCategory,
    category: muscleCategory,
    /** Type d’exercice (force, isométrique, cardio…) — tag secondaire. */
    exerciseType: base.metadata?.category,
    muscleGroup: muscleCategory || base.metadata?.primaryMuscleGroup || ex.primaryMuscles?.[0],
    difficulty: base.metadata?.difficulty ?? ex.difficulty ?? 1,
    trainingDiscipline: base.metadata?.trainingDiscipline || discipline,
    equipment: base.metadata?.equipment || rawEq,
    notes: ex.description || base.notes || '',
    primaryMuscles: ex.primaryMuscles || [],
    secondaryMuscles: ex.secondaryMuscles || base.secondaryMuscles || [],
    sourceDay: t('exercisesTab.misc.exerciseBankSource', 'Banque commune exercices')
  };
}
