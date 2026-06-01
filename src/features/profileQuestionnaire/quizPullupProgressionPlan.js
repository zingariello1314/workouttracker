/**
 * Plan progression tractions (objectif 10 strict, etc.)
 */

import { inferStreetSkillGoal } from './quizStreetSkillGoal';

/**
 * @param {object} answers
 * @param {object} [weeklyObjectives]
 */
export function resolvePullupProgressionPlan(answers, weeklyObjectives = null) {
  const skillId = weeklyObjectives?.pullupPlan?.skillId || inferStreetSkillGoal(answers);
  const pullMax = Number(answers?.strengthBaselineMaxes?.pullupsMax) || 0;

  if (!['pullups_10', 'first_pullup', 'pullups_20'].includes(skillId) && pullMax >= 12) {
    return null;
  }

  if (skillId !== 'pullups_10' && skillId !== 'first_pullup' && pullMax > 8) {
    return null;
  }

  const exposuresPerWeek = weeklyObjectives?.pullupPlan?.exposuresPerWeek || (pullMax <= 5 ? 2 : 3);

  let variants;
  if (pullMax <= 2) {
    variants = ['tractions australiennes', 'tractions pronation', 'rowing haltère'];
  } else if (pullMax <= 7) {
    variants = ['tractions pronation', 'tractions australiennes', 'rowing haltère'];
  } else {
    variants = ['tractions pronation', 'tractions australiennes', 'dips'];
  }

  const setsPerExposure =
    pullMax <= 3
      ? { heavy: 4, volume: 3, accessory: 3 }
      : pullMax <= 7
        ? { heavy: 4, volume: 4, accessory: 3 }
        : { heavy: 5, volume: 4, accessory: 3 };

  const weeklySetsTarget = Math.max(12, exposuresPerWeek * (setsPerExposure.heavy + setsPerExposure.volume));

  return {
    skillId,
    exposuresPerWeek,
    variants: variants.filter(Boolean),
    setsPerExposure,
    weeklySetsTarget,
    labelFr:
      skillId === 'first_pullup'
        ? 'Premières tractions — progression technique et volume'
        : `Viser 10 tractions strictes (repère ~${pullMax} max) — ${exposuresPerWeek} expositions / semaine`
  };
}

/**
 * Boosts templates pour fill street / pull.
 * @param {object} answers
 * @param {object} [weeklyObjectives]
 */
export function pullupTemplateBoosts(answers, weeklyObjectives = null) {
  const plan = resolvePullupProgressionPlan(answers, weeklyObjectives);
  return plan?.variants || [];
}

/**
 * Ajuste séries sur exercices traction selon le plan.
 * @param {object[]} exercises
 * @param {object} answers
 * @param {object} [weeklyObjectives]
 */
export function applyPullupSeriesHints(exercises, answers, weeklyObjectives = null) {
  const plan = resolvePullupProgressionPlan(answers, weeklyObjectives);
  if (!plan || !Array.isArray(exercises)) return exercises;

  const pullMax = Number(answers?.strengthBaselineMaxes?.pullupsMax) || 0;
  const heavySets = plan.setsPerExposure.heavy;
  const volSets = plan.setsPerExposure.volume;

  return exercises.map((ex) => {
    const blob = `${ex.exerciseBankKey || ''} ${ex.name || ''}`.toLowerCase();
    if (!/traction|pull|australien/i.test(blob)) return ex;
    const isHeavy = /pronation|pull-up/i.test(blob) && !/australien/i.test(blob);
    const sets = isHeavy ? heavySets : volSets;
    const reps = pullMax <= 3 ? (isHeavy ? '4-6' : '6-10') : isHeavy ? '5-8' : '8-12';
    return { ...ex, series: `${sets}×${reps}` };
  });
}
