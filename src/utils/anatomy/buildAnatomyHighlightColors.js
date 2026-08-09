import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { ANATOMY_MODEL_ECORCHE_V1, getRenderableMeshNamesForVisualGroup } from './modelAdapterEcorche';
import { buildEcorcheBaseMeshColors } from '../../services/anatomy/ecorcheMeshColors';
import { normalizeMeshColorKey, stampMeshColorVariants } from './anatomyMeshColorLookup';

const NEUTRAL_BASE = '#475569';

const PALETTE = {
  exercise: { primary: '#ef4444', secondary: '#ea580c' },
  stretch: { primary: '#0c4a6e', secondary: '#075985' }
};

function paintGroupMeshes(target, visualGroupId, hex, skipKeys) {
  getRenderableMeshNamesForVisualGroup(ANATOMY_MODEL_ECORCHE_V1, visualGroupId).forEach((meshName) => {
    const key = normalizeMeshColorKey(meshName);
    if (skipKeys.has(key)) return;
    stampMeshColorVariants(target, key, hex);
    skipKeys.add(key);
  });
}

/**
 * @param {{ primaryIds: Set<string>, secondaryIds: Set<string>, mode: 'exercise'|'stretch' }} param0
 * @returns {{ meshColors: Record<string, string>, uniformBodyColor: string, usedFullBodyUniform: boolean }}
 */
export function buildAnatomyHighlightColors({ primaryIds, secondaryIds, mode }) {
  const palette = PALETTE[mode] || PALETTE.exercise;
  const primary = primaryIds instanceof Set ? primaryIds : new Set(primaryIds || []);
  const secondary = secondaryIds instanceof Set ? secondaryIds : new Set(secondaryIds || []);

  if (primary.has(MuscleGroups.FULL_BODY) || secondary.has(MuscleGroups.FULL_BODY)) {
    const hasPrimaryFb = primary.has(MuscleGroups.FULL_BODY);
    return {
      meshColors: {},
      uniformBodyColor: hasPrimaryFb ? palette.primary : palette.secondary,
      usedFullBodyUniform: true
    };
  }

  if (primary.size === 0 && secondary.size === 0) {
    return {
      meshColors: {},
      uniformBodyColor: NEUTRAL_BASE,
      usedFullBodyUniform: true
    };
  }

  const meshColors = { ...buildEcorcheBaseMeshColors() };
  const primaryMeshes = new Set();

  primary.forEach((id) => {
    paintGroupMeshes(meshColors, id, palette.primary, primaryMeshes);
  });

  secondary.forEach((id) => {
    getRenderableMeshNamesForVisualGroup(ANATOMY_MODEL_ECORCHE_V1, id).forEach((meshName) => {
      const key = normalizeMeshColorKey(meshName);
      if (primaryMeshes.has(key)) return;
      stampMeshColorVariants(meshColors, key, palette.secondary);
    });
  });

  return {
    meshColors,
    uniformBodyColor: NEUTRAL_BASE,
    usedFullBodyUniform: false
  };
}
