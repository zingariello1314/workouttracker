import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { ANATOMY_MODEL_ECORCHE_V1, getRenderableMeshNamesForVisualGroup } from './modelAdapterEcorche';

const NEUTRAL_BASE = '#475569';

const PALETTE = {
  exercise: { primary: '#dc2626', secondary: '#ea580c' },
  stretch: { primary: '#0c4a6e', secondary: '#075985' }
};

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

  const meshColors = {};
  const primaryMeshes = new Set();
  const secondaryEffective = new Set();
  primary.forEach((id) => {
    getRenderableMeshNamesForVisualGroup(ANATOMY_MODEL_ECORCHE_V1, id).forEach((m) => {
      meshColors[m] = palette.primary;
      primaryMeshes.add(m);
    });
  });
  secondary.forEach((id) => {
    getRenderableMeshNamesForVisualGroup(ANATOMY_MODEL_ECORCHE_V1, id).forEach((m) => {
      if (!primaryMeshes.has(m)) {
        meshColors[m] = palette.secondary;
      }
    });
  });

  const hasAny = Object.keys(meshColors).length > 0;
  return {
    meshColors: hasAny ? meshColors : {},
    uniformBodyColor: NEUTRAL_BASE,
    usedFullBodyUniform: false
  };
}
