/**
 * Hiérarchie objectif quiz : hypertrophie/force prime sur « cardio en priorité » (modalité, pas moteur principal).
 */

const HYPERTROPHY_GOALS = new Set(['muscular_defined', 'lean_toned', 'bulk_mass']);
const STRENGTH_POWER_GOALS = new Set(['strong_powerful', 'balanced_functional']);

export function isHypertrophyPrimaryGoal(goal) {
  return HYPERTROPHY_GOALS.has(goal);
}

export function isStrengthPrimaryGoal(goal) {
  return HYPERTROPHY_GOALS.has(goal) || STRENGTH_POWER_GOALS.has(goal);
}

/**
 * Ajuste deformers : force ~60–70 %, cardio ~30–40 % (via jours + poids groupes).
 * @param {object} deformers
 * @param {object} answers
 */
export function applyGoalHierarchyToDeformers(deformers, answers) {
  const d = {
    ...deformers,
    preferredGroupWeights: { ...(deformers?.preferredGroupWeights || {}) }
  };
  const goal = answers?.goalPhysique;
  if (!isStrengthPrimaryGoal(goal)) return d;

  const gw = d.preferredGroupWeights;
  gw.upper = Math.max(gw.upper ?? 1, 1.12);
  gw.lower = Math.max(gw.lower ?? 1, 1.1);
  gw.core = Math.max(gw.core ?? 1, 1.05);
  gw.cardio = Math.min(gw.cardio ?? 1, 0.92);

  if (isHypertrophyPrimaryGoal(goal)) {
    if (d.maxDedicatedCardioDays == null || d.maxDedicatedCardioDays > 2) {
      d.maxDedicatedCardioDays = Math.min(d.maxDedicatedCardioDays ?? 2, 2);
    }
    const activeDays = Array.isArray(answers?.availableTrainingDays)
      ? answers.availableTrainingDays.length
      : 0;
    if (activeDays > 0 && activeDays <= 3) {
      d.maxDedicatedCardioDays = Math.min(d.maxDedicatedCardioDays ?? 1, 1);
    }
    d.minCardioDays = Math.min(d.minCardioDays ?? 1, 1);
  }

  return d;
}

/**
 * Pénalité archetype endurance quand objectif hypertrophie.
 */
export function enduranceArchetypePenalty(answers) {
  if (isHypertrophyPrimaryGoal(answers?.goalPhysique)) return -10;
  if (isStrengthPrimaryGoal(answers?.goalPhysique)) return -5;
  return 0;
}
