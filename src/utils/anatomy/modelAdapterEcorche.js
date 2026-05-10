/**
 * Adaptateur rendu : la taxonomie d’affichage (`visualGroupId`) ne dépend pas des noms de meshes.
 * Tout changement de fichier GLB se limite à cet adaptateur (+ `recapMeshBinding` pour ce modèle).
 */
import { getMeshesForMuscleGroup } from '../sport/recapMeshBinding';

/** Id interne du fichier / version (pour swap futur du modèle). */
export const ANATOMY_MODEL_ECORCHE_V1 = 'ecorche_v1';

/**
 * @param {string} modelId ex. ANATOMY_MODEL_ECORCHE_V1
 * @param {string} visualGroupId ex. MuscleGroups.BACK
 * @returns {string[]} noms de meshes à teinter dans le GLB courant
 */
export function getRenderableMeshNamesForVisualGroup(modelId, visualGroupId) {
  if (modelId !== ANATOMY_MODEL_ECORCHE_V1) return [];
  return getMeshesForMuscleGroup(visualGroupId);
}
