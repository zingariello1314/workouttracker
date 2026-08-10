/**
 * Illustrations grades exercices (matériau) — public/exercise-grades/
 */

import { exerciseGradeById } from './exerciseGradeLadder';

export const EXERCISE_GRADE_MATERIAL_ART = {
  wood: '/exercise-grades/bois.jpg',
  bronze: '/exercise-grades/bronze.jpg',
  silver: '/exercise-grades/argent.jpg',
  gold: '/exercise-grades/or.jpg',
  platinum: '/exercise-grades/platine.jpg'
};

export function exerciseGradeMaterialArtUrl(material) {
  return EXERCISE_GRADE_MATERIAL_ART[material] || EXERCISE_GRADE_MATERIAL_ART.wood;
}

export function exerciseGradeArtUrl(gradeId) {
  const g = exerciseGradeById(gradeId);
  return exerciseGradeMaterialArtUrl(g.material);
}
