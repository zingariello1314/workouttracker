import { resolveVisualGroupsFromLabels } from './fineMuscleToVisualGroup';
import { inferDefaultAnatomyView } from './inferDefaultAnatomyView';
import { buildAnatomyHighlightColors } from './buildAnatomyHighlightColors';
import {
  BANK_EXERCISE_ANATOMY_TUNING,
  BANK_STRETCH_ANATOMY_TUNING
} from './bankExerciseAnatomyTuning';

/**
 * @param {{ primaryMuscles?: string[], secondaryMuscles?: string[] }} muscleLists
 * @param {'exercise' | 'stretch'} mode
 * @param {{ exerciseDatabaseKey?: string, stretchDatabaseKey?: string }} [ctx]
 */
export function resolveBankItemAnatomy(muscleLists, mode, ctx) {
  const primaryList = muscleLists?.primaryMuscles;
  const secondaryList = muscleLists?.secondaryMuscles;
  const { primaryIds, secondaryIds, unmappedLabels } = resolveVisualGroupsFromLabels(primaryList, secondaryList);

  let inferredView = inferDefaultAnatomyView(primaryIds, secondaryIds);

  let cameraTuningOverride;
  const exKey =
    typeof ctx?.exerciseDatabaseKey === 'string' && ctx.exerciseDatabaseKey.trim().length > 0
      ? ctx.exerciseDatabaseKey.trim()
      : null;
  const stKey =
    typeof ctx?.stretchDatabaseKey === 'string' && ctx.stretchDatabaseKey.trim().length > 0
      ? ctx.stretchDatabaseKey.trim()
      : null;

  const bankTune =
    mode === 'exercise' && exKey
      ? BANK_EXERCISE_ANATOMY_TUNING[exKey]
      : mode === 'stretch' && stKey
        ? BANK_STRETCH_ANATOMY_TUNING[stKey]
        : undefined;

  if (bankTune?.inferredView) {
    inferredView = bankTune.inferredView;
  }
  if (bankTune?.camera && (bankTune.camera.boundsMargin != null || bankTune.camera.cameraDistanceFactor != null)) {
    cameraTuningOverride = {
      ...(bankTune.camera.boundsMargin != null ? { boundsMargin: bankTune.camera.boundsMargin } : {}),
      ...(bankTune.camera.cameraDistanceFactor != null
        ? { cameraDistanceFactor: bankTune.camera.cameraDistanceFactor }
        : {})
    };
  }

  const { meshColors, uniformBodyColor, usedFullBodyUniform } = buildAnatomyHighlightColors({
    primaryIds,
    secondaryIds,
    mode
  });

  const hasMappedMeshes =
    usedFullBodyUniform || primaryIds.size > 0 || secondaryIds.size > 0;

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
    anatomyFallback,
    ...(cameraTuningOverride &&
    (cameraTuningOverride.boundsMargin != null || cameraTuningOverride.cameraDistanceFactor != null)
      ? { cameraTuningOverride }
      : {})
  };
}
