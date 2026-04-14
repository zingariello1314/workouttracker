/**
 * Répartition charge endurance sur les groupes (dont jambes découpées quad / ischio / mollet)
 * selon le type de séance course ou corde.
 */
import { MuscleGroups } from '../../data/workoutProgramEnhanced';

/** Part « haut du corps + core » inchangée par type (sauf legs → 3 segments). */
const RUNNING_UPPER = {
  [MuscleGroups.CORE]: 0.14,
  [MuscleGroups.SHOULDERS]: 0.08,
  [MuscleGroups.BACK]: 0.1,
  [MuscleGroups.CHEST]: 0.04,
  [MuscleGroups.FULL_BODY]: 0.12
};

/**
 * Répartition des ~52 % « jambes » historiques entre quadriceps / ischio / mollets.
 * Somme (quads+hams+calves) = 0.52 pour coller à l’ancienne clé `legs`.
 */
const RUNNING_LEG_BY_TYPE = {
  recovery: { [MuscleGroups.QUADS]: 0.14, [MuscleGroups.HAMSTRINGS]: 0.2, [MuscleGroups.CALVES]: 0.18 },
  easy: { [MuscleGroups.QUADS]: 0.16, [MuscleGroups.HAMSTRINGS]: 0.18, [MuscleGroups.CALVES]: 0.18 },
  fundamental: { [MuscleGroups.QUADS]: 0.16, [MuscleGroups.HAMSTRINGS]: 0.18, [MuscleGroups.CALVES]: 0.18 },
  endurance: { [MuscleGroups.QUADS]: 0.18, [MuscleGroups.HAMSTRINGS]: 0.17, [MuscleGroups.CALVES]: 0.17 },
  long_run: { [MuscleGroups.QUADS]: 0.15, [MuscleGroups.HAMSTRINGS]: 0.22, [MuscleGroups.CALVES]: 0.15 },
  long: { [MuscleGroups.QUADS]: 0.15, [MuscleGroups.HAMSTRINGS]: 0.22, [MuscleGroups.CALVES]: 0.15 },
  tempo: { [MuscleGroups.QUADS]: 0.24, [MuscleGroups.HAMSTRINGS]: 0.14, [MuscleGroups.CALVES]: 0.14 },
  threshold: { [MuscleGroups.QUADS]: 0.26, [MuscleGroups.HAMSTRINGS]: 0.13, [MuscleGroups.CALVES]: 0.13 },
  interval: { [MuscleGroups.QUADS]: 0.3, [MuscleGroups.HAMSTRINGS]: 0.11, [MuscleGroups.CALVES]: 0.11 },
  fartlek: { [MuscleGroups.QUADS]: 0.22, [MuscleGroups.HAMSTRINGS]: 0.15, [MuscleGroups.CALVES]: 0.15 },
  sprint: { [MuscleGroups.QUADS]: 0.32, [MuscleGroups.HAMSTRINGS]: 0.1, [MuscleGroups.CALVES]: 0.1 }
};

const JUMPROPE_UPPER = {
  [MuscleGroups.SHOULDERS]: 0.17,
  [MuscleGroups.CORE]: 0.21,
  [MuscleGroups.BICEPS]: 0.07,
  [MuscleGroups.TRICEPS]: 0.05,
  [MuscleGroups.FULL_BODY]: 0.08
};

/** Ancienne part « legs » 0.42 répartie selon mode corde (mollets + cardio chevilles). */
const JUMPROPE_LEG_BY_TYPE = {
  continue: { [MuscleGroups.QUADS]: 0.12, [MuscleGroups.HAMSTRINGS]: 0.1, [MuscleGroups.CALVES]: 0.2 },
  hiit: { [MuscleGroups.QUADS]: 0.16, [MuscleGroups.HAMSTRINGS]: 0.11, [MuscleGroups.CALVES]: 0.15 },
  interval: { [MuscleGroups.QUADS]: 0.17, [MuscleGroups.HAMSTRINGS]: 0.1, [MuscleGroups.CALVES]: 0.15 },
  default: { [MuscleGroups.QUADS]: 0.14, [MuscleGroups.HAMSTRINGS]: 0.11, [MuscleGroups.CALVES]: 0.17 }
};

function normalizeWeights(raw, allKeys) {
  const out = { ...raw };
  let sum = 0;
  allKeys.forEach((g) => {
    sum += out[g] || 0;
  });
  if (sum <= 0) return { [MuscleGroups.FULL_BODY]: 1 };
  const norm = {};
  allKeys.forEach((g) => {
    if (out[g]) norm[g] = out[g] / sum;
  });
  return norm;
}

const RECAP_GROUP_KEYS = [
  MuscleGroups.CHEST,
  MuscleGroups.BACK,
  MuscleGroups.SHOULDERS,
  MuscleGroups.BICEPS,
  MuscleGroups.TRICEPS,
  MuscleGroups.QUADS,
  MuscleGroups.HAMSTRINGS,
  MuscleGroups.CALVES,
  MuscleGroups.CORE,
  MuscleGroups.FULL_BODY
];

export function weightsForRunningSession(session) {
  const type = String(session?.type || 'endurance').toLowerCase();
  const leg = RUNNING_LEG_BY_TYPE[type] || RUNNING_LEG_BY_TYPE.endurance;
  const merged = { ...RUNNING_UPPER, ...leg };
  return normalizeWeights(merged, RECAP_GROUP_KEYS);
}

export function weightsForJumpRopeSession(session) {
  const type = String(session?.type || 'continue').toLowerCase();
  const leg = JUMPROPE_LEG_BY_TYPE[type] || JUMPROPE_LEG_BY_TYPE.default;
  const merged = { ...JUMPROPE_UPPER, ...leg };
  return normalizeWeights(merged, RECAP_GROUP_KEYS);
}
