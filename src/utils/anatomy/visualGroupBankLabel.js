import { MuscleGroups as G } from '../../data/workoutProgramEnhanced';

/** Libellés banque / `resolveVisualGroupsFromLabels` pour aperçus carte muscle. */
export const VISUAL_GROUP_BANK_LABEL = {
  [G.CHEST]: 'Pectoraux',
  [G.BACK]: 'Dos',
  [G.SHOULDERS]: 'Épaules',
  [G.BICEPS]: 'Biceps',
  [G.TRICEPS]: 'Triceps',
  [G.QUADS]: 'Quadriceps',
  [G.HAMSTRINGS]: 'Ischio-jambiers',
  [G.CALVES]: 'Mollets',
  [G.TIBIALIS_ANTERIOR]: 'Tibial antérieur',
  [G.CORE]: 'Abdominaux',
  [G.FULL_BODY]: 'Corps entier'
};

export function visualGroupToBankLabel(groupId) {
  if (!groupId) return null;
  return VISUAL_GROUP_BANK_LABEL[groupId] || null;
}
