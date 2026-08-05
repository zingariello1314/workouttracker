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
      return 0.13;
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

/** Marges par défaut liste famille : corps entier lisible, pas de zoom ventre. */
export const ANATOMY_ROW_PREVIEW_CAMERA_DEFAULT = {
  boundsMargin: 1.04,
  cameraDistanceFactor: 1.2,
  targetOffsetY: null
};
