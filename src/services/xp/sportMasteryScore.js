/** Score de maîtrise — repondération du breakdown (spec §2). */

export function masteryScoreFromBreakdown(breakdown = {}) {
  const b = breakdown || {};
  const n = (v) => Math.max(0, Number(v) || 0);
  let sum = 0;
  sum += n(b.weightedRepsXp) * 3;
  sum += n(b.liftedVolumeKgXp) * 2;
  sum += n(b.caloriesXp) * 0.1;
  sum += n(b.stepsXp) * 0.1;
  sum += n(b.stretchesXp) * 0.3;
  sum += n(b.runningTrophies);
  sum += n(b.jumpRopeTrophies);
  sum += n(b.gainageTrophies);
  sum += n(b.pushupTrophies);
  sum += n(b.exercisesXp);
  sum += n(b.challengesXp);
  sum += n(b.intervalTrainingXp);
  sum += n(b.sessionsFeedbackXp);
  sum += n(b.circuitsXp);
  sum += n(b.gtgXp);
  sum += n(b.nutritionFoodXp);
  return Math.round(sum);
}
