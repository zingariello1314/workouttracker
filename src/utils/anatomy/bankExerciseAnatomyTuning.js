/**
 * Ajustements caméra par clé banque (`exerciseDatabase.js` ou id réf cardio `cardio_*`).
 * S’applique après l’inférence par muscles (voir `resolveBankItemAnatomy`).
 */

/** @typedef {{ boundsMargin?: number, cameraDistanceFactor?: number }} BankCameraOverride */

/** @typedef {{ inferredView?: string, camera?: BankCameraOverride }} BankExerciseTune */

/**
 * Réf cardio (`cardio_*`) : on évite tout override caméra ici pour **ne pas changer** le stem hash des
 * `.webp` déjà présents après correction du flux de capture (`getMusclesForExampleLabel` + muscles bruts carte).
 */

/** @type {Record<string, BankExerciseTune>} */
export const BANK_EXERCISE_ANATOMY_TUNING = {
  /** Vue dorsale demandée : tibial antérieur mieux lisible avec recul léger que face stricte. */
  'tibialis raises mur': {
    inferredView: 'back',
    camera: { boundsMargin: 0.94, cameraDistanceFactor: 1.1 }
  },
  /** Mouvement horizontal suspendu — dézoom fort pour voir dos + abdomen. */
  'front lever raises': {
    inferredView: 'frontWideHang',
    camera: { boundsMargin: 1.06, cameraDistanceFactor: 1.32 }
  },
  /** Même logique « hanging » que raises + rowing tuck : éviter le cadrage trop serré. */
  'front lever tuck rows': {
    inferredView: 'frontWideHang',
    camera: { boundsMargin: 1.06, cameraDistanceFactor: 1.3 }
  },
  /** RDL / ischio dominant : mieux lisible avec un peu plus de recul sur l’arrière des jambes. */
  'soulevé de terre jambes tendues': {
    inferredView: 'backLower',
    camera: { boundsMargin: 1.02, cameraDistanceFactor: 1.2 }
  },
  'soulevé de terre jambes semi-tendues': {
    inferredView: 'backLower',
    camera: { boundsMargin: 1.02, cameraDistanceFactor: 1.2 }
  },
  /** L-sit aux supports : corps entier torse + bras tendus sans zoom excessif sur les avant-bras. */
  'l-sit parallèles': {
    inferredView: 'frontHighWide',
    camera: { boundsMargin: 0.98, cameraDistanceFactor: 1.18 }
  },
  /** Saut à la corde : jambes + mollets régulièrement coupés sans recul maîtrisé. */
  'corde à sauter': {
    inferredView: 'frontLow',
    camera: { boundsMargin: 0.93, cameraDistanceFactor: 1.16 }
  },
  'double under corde à sauter': {
    inferredView: 'frontLow',
    camera: { boundsMargin: 0.93, cameraDistanceFactor: 1.18 }
  },
  /** Suspendu un bras : le modèle est souvent trop « zoomé » sur l’articulation épaule. */
  'one arm dead hang': {
    inferredView: 'back',
    camera: { boundsMargin: 1.08, cameraDistanceFactor: 1.34 }
  },
  /** Primaires centraux abdominal : éviter une vue dos trompeuse avec érecteurs en secondaires. */
  'gainage dynamique': {
    inferredView: 'frontHighWide',
    camera: { boundsMargin: 0.92, cameraDistanceFactor: 1.08 }
  },
  /** HSPU libres : élargir le cadrage tête/bras sans changer la vue front haute. */
  'handstand push-ups libres': {
    inferredView: 'frontHighWide',
    camera: { boundsMargin: 0.97, cameraDistanceFactor: 1.22 }
  },
  'tuck planche hold': {
    inferredView: 'frontHighWide',
    camera: { boundsMargin: 0.94, cameraDistanceFactor: 1.12 }
  },
  'straddle planche hold': {
    inferredView: 'frontHighWide',
    camera: { boundsMargin: 0.94, cameraDistanceFactor: 1.12 }
  },
  /** Muscle-up : recul dorsal pour moins couper ligne de buste/tête. */
  'muscle up strict': {
    inferredView: 'back',
    camera: { boundsMargin: 0.9, cameraDistanceFactor: 1.12 }
  }
};

/** Étirements : même format (`resolveBankItemAnatomy` applique après inférence). */
export const BANK_STRETCH_ANATOMY_TUNING = {
  /** Quadrupédie bassin/rachis : preview souvent trop serrée ou stem mal aligné avant regen `.webp`. */
  mob_bassin_rocking: {
    inferredView: 'frontLow',
    camera: { boundsMargin: 0.92, cameraDistanceFactor: 1.12 }
  }
};
