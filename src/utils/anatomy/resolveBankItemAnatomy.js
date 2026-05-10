import { resolveVisualGroupsFromLabels } from './fineMuscleToVisualGroup';
import { inferDefaultAnatomyView } from './inferDefaultAnatomyView';
import { buildAnatomyHighlightColors } from './buildAnatomyHighlightColors';

/**
 * @param {{ primaryMuscles?: string[], secondaryMuscles?: string[] }} muscleLists
 * @param {'exercise' | 'stretch'} mode
 */
export function resolveBankItemAnatomy(muscleLists, mode) {
  const primaryList = muscleLists?.primaryMuscles;
  const secondaryList = muscleLists?.secondaryMuscles;
  const { primaryIds, secondaryIds, unmappedLabels } = resolveVisualGroupsFromLabels(primaryList, secondaryList);

  const inferredView = inferDefaultAnatomyView(primaryIds, secondaryIds);
  const { meshColors, uniformBodyColor, usedFullBodyUniform } = buildAnatomyHighlightColors({
    primaryIds,
    secondaryIds,
    mode
  });

  const hasMappedMeshes =
    usedFullBodyUniform || (meshColors && Object.keys(meshColors).length > 0);

  /**
   * Toujours afficher le modèle : si aucun libellé ne mappe vers un mesh,
   * corps entier en teinte neutre (étirements : bleu ardoise cohérent avec la palette).
   */
  let finalMeshColors = meshColors;
  let finalUniform = uniformBodyColor;
  let finalFullBody = usedFullBodyUniform;
  let anatomyFallback = false;

  if (!hasMappedMeshes) {
    anatomyFallback = true;
    finalMeshColors = {};
    finalFullBody = true;
    finalUniform =
      mode === 'stretch'
        ? '#155e75'
        : '#475569';
  }

  return {
    primaryIds,
    secondaryIds,
    unmappedLabels,
    inferredView,
    meshColors: finalMeshColors,
    uniformBodyColor: finalUniform,
    usedFullBodyUniform: finalFullBody,
    anatomyFallback
  };
}
