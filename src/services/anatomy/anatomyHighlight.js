import { buildAnatomyHighlightColors } from '../../utils/anatomy/buildAnatomyHighlightColors';
import { buildEcorcheBaseMeshColors } from './ecorcheMeshColors';
import { getMeshesForMuscleGroup } from '../../utils/sport/recapMeshBinding';
import { ECORCHE_GROUP_BASE } from './ecorcheMeshColors';

export function highlightColorsForVisualGroups(groupIds = []) {
  const primaryIds = new Set(groupIds.filter(Boolean));
  const meshColors = { ...buildEcorcheBaseMeshColors() };
  primaryIds.forEach((gid) => {
    const accent = ECORCHE_GROUP_BASE[gid];
    if (!accent) return;
    getMeshesForMuscleGroup(gid).forEach((m) => {
      meshColors[m] = accent;
    });
  });
  if (primaryIds.size === 0) {
    return buildAnatomyHighlightColors({
      primaryIds,
      secondaryIds: new Set(),
      mode: 'exercise'
    });
  }
  return {
    meshColors,
    uniformBodyColor: undefined,
    usedFullBodyUniform: false
  };
}
