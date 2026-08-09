/**
 * Cadrage statique des aperçus 3D sur les cartes « Muscles de cette famille ».
 */
import { resolveBankItemAnatomy } from './resolveBankItemAnatomy';
import { visualGroupToBankLabel } from './visualGroupBankLabel';
import { buildMuscleFocusMeshColors, buildEcorcheBaseMeshColors } from '../../services/anatomy/ecorcheMeshColors';
import { ECORCHE_FAMILY_ROW_IDLE } from './anatomyModelDisplay';
import {
  ANATOMY_ROW_PREVIEW_CAMERA_DEFAULT,
  ANATOMY_ROW_PREVIEW_CAMERA_ROW_BOOST,
  ANATOMY_ROW_PREVIEW_DISTANCE_ZOOM,
  ANATOMY_ROW_PREVIEW_TARGET_OFFSET_X,
  ANATOMY_ROW_REGION_FRAME,
  inferFamilyRowPreviewRegion,
  inferMusclePreviewTargetOffsetY
} from './anatomyMuscleQuickFacts';

/** @typedef {{ inferredView?: string, camera?: { boundsMargin?: number, cameraDistanceFactor?: number, targetOffsetY?: number } }} MusclePreviewTune */

/** @type {Record<string, MusclePreviewTune>} */
export const ANATOMY_MUSCLE_PREVIEW_TUNING = {
  'grand-pectoral': {
    inferredView: 'front',
    camera: { boundsMargin: 1.0, cameraDistanceFactor: 1.18, targetOffsetY: 0.07 }
  },
  'petit-pectoral': {
    inferredView: 'front',
    camera: { boundsMargin: 1.0, cameraDistanceFactor: 1.16, targetOffsetY: 0.06 }
  },
  deltoide: {
    inferredView: 'frontLow',
    camera: { boundsMargin: 1.02, cameraDistanceFactor: 1.16, targetOffsetY: 0.12 }
  },
  'coiffe-rotateurs': {
    inferredView: 'back',
    camera: { boundsMargin: 1.04, cameraDistanceFactor: 1.18, targetOffsetY: 0.1 }
  },
  'grand-dorsal': {
    inferredView: 'back',
    camera: { boundsMargin: 1.02, cameraDistanceFactor: 1.16, targetOffsetY: 0.11 }
  },
  trapezes: {
    inferredView: 'back',
    camera: { boundsMargin: 1.04, cameraDistanceFactor: 1.18, targetOffsetY: 0.12 }
  },
  'biceps-brachial': {
    inferredView: 'frontLow',
    camera: { boundsMargin: 1.0, cameraDistanceFactor: 1.14, targetOffsetY: 0.11 }
  },
  'triceps-brachial': {
    inferredView: 'back',
    camera: { boundsMargin: 1.0, cameraDistanceFactor: 1.14, targetOffsetY: 0.1 }
  },
  'erecteurs-rachis': {
    inferredView: 'backLower',
    camera: { boundsMargin: 1.06, cameraDistanceFactor: 1.2, targetOffsetY: 0.04 }
  },
  'grand-fessier': {
    inferredView: 'backLower',
    camera: { boundsMargin: 1.06, cameraDistanceFactor: 1.2, targetOffsetY: -0.03 }
  },
  'moyen-fessier': {
    inferredView: 'backLower',
    camera: { boundsMargin: 1.08, cameraDistanceFactor: 1.22, targetOffsetY: -0.02 }
  },
  'petit-fessier': {
    inferredView: 'backLower',
    camera: { boundsMargin: 1.08, cameraDistanceFactor: 1.22, targetOffsetY: -0.02 }
  },
  'quadriceps-femoral': {
    inferredView: 'frontLow',
    camera: { boundsMargin: 1.04, cameraDistanceFactor: 1.18, targetOffsetY: -0.02 }
  },
  'ischio-jambiers': {
    inferredView: 'backLower',
    camera: { boundsMargin: 1.06, cameraDistanceFactor: 1.2, targetOffsetY: -0.04 }
  },
  gastrocnemien: {
    inferredView: 'backLower',
    camera: { boundsMargin: 1.08, cameraDistanceFactor: 1.22, targetOffsetY: -0.06 }
  },
  soleaire: {
    inferredView: 'backLower',
    camera: { boundsMargin: 1.1, cameraDistanceFactor: 1.24, targetOffsetY: -0.06 }
  },
  'tibial-anterieur': {
    inferredView: 'frontLow',
    camera: { boundsMargin: 1.06, cameraDistanceFactor: 1.2, targetOffsetY: -0.03 }
  },
  'grand-droit': {
    inferredView: 'frontHighWide',
    camera: { boundsMargin: 1.02, cameraDistanceFactor: 1.16, targetOffsetY: 0.08 }
  },
  'avant-bras-ensemble': {
    inferredView: 'frontLow',
    camera: { boundsMargin: 1.02, cameraDistanceFactor: 1.14, targetOffsetY: 0.11 }
  },
  'brachio-radial': {
    inferredView: 'frontLow',
    camera: { boundsMargin: 1.0, cameraDistanceFactor: 1.12, targetOffsetY: 0.11 }
  }
};

/** @param {{ id?: string, name?: string, visualGroupId?: string, searchAliases?: string[] } | null | undefined} muscle */
export function resolveAnatomyMusclePreviewAnatomy(muscle) {
  const primary = muscle?.name ? [muscle.name] : [];
  if (!primary.length && muscle?.visualGroupId) {
    const fallback = visualGroupToBankLabel(muscle.visualGroupId);
    if (fallback) primary.push(fallback);
  }

  const base = resolveBankItemAnatomy(
    { primaryMuscles: primary, secondaryMuscles: [] },
    'exercise'
  );

  const focusedColors = buildMuscleFocusMeshColors(muscle?.id, muscle?.visualGroupId, {
    dimOthers: true,
    idleBodyColor: ECORCHE_FAMILY_ROW_IDLE
  });

  const meshColors = focusedColors
    ? { ...buildEcorcheBaseMeshColors(), ...focusedColors }
    : base.meshColors;

  const tune = muscle?.id ? ANATOMY_MUSCLE_PREVIEW_TUNING[muscle.id] : null;
  const def = ANATOMY_ROW_PREVIEW_CAMERA_DEFAULT;
  const defaultOffset =
    inferMusclePreviewTargetOffsetY(muscle?.visualGroupId) ??
    def.targetOffsetY ??
    0.06;

  const boost = ANATOMY_ROW_PREVIEW_CAMERA_ROW_BOOST;
  const distanceZoom = ANATOMY_ROW_PREVIEW_DISTANCE_ZOOM;
  const region = inferFamilyRowPreviewRegion(muscle?.visualGroupId);
  const regionFrame = ANATOMY_ROW_REGION_FRAME[region] || ANATOMY_ROW_REGION_FRAME.full;

  const boundsMargin =
    (tune?.camera?.boundsMargin ??
      base.cameraTuningOverride?.boundsMargin ??
      def.boundsMargin) *
    boost.boundsMarginMul *
    regionFrame.boundsMul;
  const cameraDistanceFactor =
    (tune?.camera?.cameraDistanceFactor ??
      base.cameraTuningOverride?.cameraDistanceFactor ??
      def.cameraDistanceFactor) *
    boost.cameraDistanceFactorMul *
    distanceZoom *
    regionFrame.distanceMul;
  const targetOffsetY =
    tune?.camera?.targetOffsetY ?? defaultOffset;

  return {
    ...base,
    meshColors,
    usedFullBodyUniform: focusedColors ? false : base.usedFullBodyUniform,
    inferredView: tune?.inferredView ?? base.inferredView,
    cameraTuningOverride: {
      boundsMargin,
      cameraDistanceFactor,
      targetOffsetY,
      targetOffsetX: ANATOMY_ROW_PREVIEW_TARGET_OFFSET_X
    }
  };
}
