/**
 * Illustrations grades exercices (matériau) — public/exercise-grades/
 */

import { exerciseGradeById, EXERCISE_GRADE_LADDER } from './exerciseGradeLadder';

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

/** Cadrage pixel-art (personnage centré, tête visible). */
export function exerciseGradeArtObjectPosition(gradeId) {
  const g = exerciseGradeById(gradeId);
  const byMaterial = {
    wood: '50% 18%',
    bronze: '50% 22%',
    silver: '50% 20%',
    gold: '50% 24%',
    platinum: '50% 20%'
  };
  return byMaterial[g.material] || '50% 20%';
}

export function exerciseGradeMaterialAccent(material) {
  const tier =
    EXERCISE_GRADE_LADDER.find((g) => g.material === material && g.tier === 3) ||
    EXERCISE_GRADE_LADDER.find((g) => g.material === material);
  return tier?.accent || '#2dd4bf';
}
