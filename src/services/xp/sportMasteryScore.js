/** Score de maîtrise — repondération du breakdown (spec §2). */

/** Coefficients légers : le gros du rééquilibrage est dans le calcul XP brut. */
export const MASTERY_WEIGHT_WEIGHTED_REPS = 1.2;
export const MASTERY_WEIGHT_EXERCISES = 1.2;
export const MASTERY_WEIGHT_CALORIES = 0.5;
export const MASTERY_WEIGHT_STEPS = 0.5;

export function masteryScoreFromBreakdown(breakdown = {}) {
  const b = breakdown || {};
  const n = (v) => Math.max(0, Number(v) || 0);
  let sum = 0;
  sum += n(b.weightedRepsXp) * MASTERY_WEIGHT_WEIGHTED_REPS;
  sum += n(b.liftedVolumeKgXp) * 2;
  sum += n(b.caloriesXp) * MASTERY_WEIGHT_CALORIES;
  sum += n(b.stepsXp) * MASTERY_WEIGHT_STEPS;
  sum += n(b.stretchesXp) * 0.3;
  sum += n(b.runningTrophies);
  sum += n(b.jumpRopeTrophies);
  sum += n(b.gainageTrophies);
  sum += n(b.pushupTrophies);
  sum += n(b.exercisesXp) * MASTERY_WEIGHT_EXERCISES;
  sum += n(b.challengesXp);
  sum += n(b.intervalTrainingXp);
  sum += n(b.sessionsFeedbackXp);
  sum += n(b.circuitsXp);
  sum += n(b.gtgXp);
  sum += n(b.nutritionFoodXp);
  return Math.round(sum);
}
