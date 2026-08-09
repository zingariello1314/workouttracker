import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { hasMuscleContent } from '../../data/anatomy/anatomyContent';

const FUNC_LABEL = {
  high: 'Fonctionnel : essentiel',
  medium: 'Fonctionnel : utile',
  low: 'Fonctionnel : accessoire'
};

const AESTH_LABEL = {
  high: 'Esthétique : très visible',
  medium: 'Esthétique : modéré',
  low: 'Esthétique : discret'
};

/** Puces courtes pour remplir la carte famille (sans dupliquer toute la fiche). */
export function buildMuscleFamilyQuickChips(muscle) {
  if (!muscle) return [];
  const chips = [];

  if (muscle.contentReady && hasMuscleContent(muscle.id)) {
    chips.push('Fiche complète');
  } else if (muscle.contentReady) {
    chips.push('Contenu à venir');
  }

  if (muscle.functionalImportance) {
    chips.push(FUNC_LABEL[muscle.functionalImportance] || FUNC_LABEL.medium);
  }
  if (muscle.aestheticImportance) {
    chips.push(AESTH_LABEL[muscle.aestheticImportance] || AESTH_LABEL.medium);
  }

  const aliases = muscle.searchAliases;
  if (Array.isArray(aliases) && aliases.length > 0) {
    chips.push(aliases[0]);
    if (aliases.length > 1 && chips.length < 5) {
      chips.push(aliases[1]);
    }
  }

  return chips.slice(0, 5);
}

/** Décalage vertical caméra par zone (aperçu liste famille). */
export function inferMusclePreviewTargetOffsetY(visualGroupId) {
  switch (visualGroupId) {
    case MuscleGroups.CHEST:
    case MuscleGroups.SHOULDERS:
    case MuscleGroups.BICEPS:
    case MuscleGroups.FOREARMS:
      return 0.12;
    case MuscleGroups.CORE:
      return 0.07;
    case MuscleGroups.BACK:
    case MuscleGroups.TRICEPS:
      return 0.1;
    case MuscleGroups.QUADS:
    case MuscleGroups.TIBIALIS_ANTERIOR:
      return -0.02;
    case MuscleGroups.HAMSTRINGS:
    case MuscleGroups.CALVES:
      return -0.05;
    default:
      return 0.06;
  }
}

/** Zone cadrée dans la vignette (évite le « mini corps entier » dans un cadre portrait). */
export function inferFamilyRowPreviewRegion(visualGroupId) {
  switch (visualGroupId) {
    case MuscleGroups.CHEST:
    case MuscleGroups.SHOULDERS:
    case MuscleGroups.BICEPS:
    case MuscleGroups.TRICEPS:
    case MuscleGroups.BACK:
    case MuscleGroups.CORE:
    case MuscleGroups.FOREARMS:
      return 'upper';
    case MuscleGroups.QUADS:
    case MuscleGroups.HAMSTRINGS:
    case MuscleGroups.CALVES:
    case MuscleGroups.TIBIALIS_ANTERIOR:
    case MuscleGroups.GLUTES:
      return 'lower';
    default:
      return 'full';
  }
}

/** Ajustement caméra par région (× distance, × marge Bounds). */
export const ANATOMY_ROW_REGION_FRAME = {
  upper: { distanceMul: 0.76, boundsMul: 0.94 },
  lower: { distanceMul: 0.8, boundsMul: 0.95 },
  full: { distanceMul: 1, boundsMul: 1 }
};

/** Marges liste famille — base avant région / zoom global. */
export const ANATOMY_ROW_PREVIEW_CAMERA_DEFAULT = {
  boundsMargin: 1.04,
  cameraDistanceFactor: 1.22,
  targetOffsetY: null
};

/** Ajustement vignette portrait (~94×118 px). */
export const ANATOMY_ROW_PREVIEW_CAMERA_ROW_BOOST = {
  boundsMarginMul: 1.02,
  cameraDistanceFactorMul: 1.06
};

/** Multiplicateur distance global (+5 % d’éloignement vs 0,98, sans toucher au cadrage région). */
export const ANATOMY_ROW_PREVIEW_DISTANCE_ZOOM = 1.03;

/** Décalage horizontal du point visé (m) — corps ~2 mm à gauche dans la vignette. */
export const ANATOMY_ROW_PREVIEW_TARGET_OFFSET_X = 0.002;
