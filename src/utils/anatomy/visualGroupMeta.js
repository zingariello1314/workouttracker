/**
 * Métadonnées de sollicitation « surface » pour choisir une vue caméra par défaut.
 * Les ids sont ceux de `MuscleGroups` (workoutProgramEnhanced) utilisés par le modèle.
 */
import { MuscleGroups } from '../../data/workoutProgramEnhanced';

/** @typedef {'anterior' | 'posterior' | 'lateral' | 'global'} SurfaceBias */

/** @type {Record<string, SurfaceBias>} */
export const VISUAL_GROUP_SURFACE_BIAS = {
  [MuscleGroups.CHEST]: 'anterior',
  [MuscleGroups.BACK]: 'posterior',
  [MuscleGroups.SHOULDERS]: 'lateral',
  [MuscleGroups.BICEPS]: 'anterior',
  [MuscleGroups.TRICEPS]: 'posterior',
  [MuscleGroups.QUADS]: 'anterior',
  [MuscleGroups.HAMSTRINGS]: 'posterior',
  [MuscleGroups.CALVES]: 'posterior',
  [MuscleGroups.FOREARMS]: 'anterior',
  [MuscleGroups.NECK]: 'lateral',
  [MuscleGroups.ADDUCTORS]: 'anterior',
  [MuscleGroups.GLUTES]: 'posterior',
  /** Abdos / gainage : favorise une vue avant cohérente avec les muscles visibles ventre. */
  [MuscleGroups.CORE]: 'anterior',
  [MuscleGroups.TIBIALIS_ANTERIOR]: 'anterior',
  [MuscleGroups.FULL_BODY]: 'global'
};
