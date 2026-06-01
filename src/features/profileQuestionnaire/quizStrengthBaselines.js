/**
 * Déséquilibres force depuis repères quiz (pompes / tractions / dips).
 */

const HYPERTROPHY_GOALS = new Set(['muscular_defined', 'lean_toned', 'bulk_mass']);

function readMax(answers, field) {
  const n = Number(answers?.strengthBaselineMaxes?.[field]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * @param {object} answers
 * @returns {{ weak: 'pull'|'push'|'legs'|null, strong: 'pull'|'push'|null, ratio: number, summaryFr: string|null }}
 */
export function deriveStrengthImbalanceFromBaselines(answers) {
  const pushups = readMax(answers, 'pushupsMax');
  const pullups = readMax(answers, 'pullupsMax');
  const dips = readMax(answers, 'dipsMax');

  if (pushups == null && pullups == null && dips == null) {
    return { weak: null, strong: null, ratio: 1, summaryFr: null };
  }

  const pushScore = (pushups || 0) * 0.45 + (dips || 0) * 0.55;
  const pullScore = pullups || 0;

  if (pullScore <= 0 && pushScore <= 0) {
    return { weak: null, strong: null, ratio: 1, summaryFr: null };
  }

  const ratio = pullScore > 0 ? pushScore / pullScore : 99;

  if (ratio >= 2.2 && pullScore < 10) {
    return {
      weak: 'pull',
      strong: 'push',
      ratio,
      summaryFr: `Repères : poussée forte (${pushups ?? '—'} pompes, ${dips ?? '—'} dips) vs traction limitée (${pullups ?? '—'}) — priorité tirage cette semaine.`
    };
  }

  if (ratio <= 0.55 && pushScore < pullScore) {
    return {
      weak: 'push',
      strong: 'pull',
      ratio,
      summaryFr: `Repères : tirage au-dessus de la poussée — volume push renforcé.`
    };
  }

  return { weak: null, strong: null, ratio, summaryFr: null };
}

/**
 * @param {object} muscleVolumeTargets
 * @param {object} answers
 */
export function applyImbalanceToMuscleTargets(muscleVolumeTargets, answers) {
  if (!muscleVolumeTargets || !answers) return muscleVolumeTargets;
  const imbalance = deriveStrengthImbalanceFromBaselines(answers);
  const out = { ...muscleVolumeTargets };

  if (imbalance.weak === 'pull') {
    out.back = Math.round((out.back || 0) * 1.2);
    out.biceps = Math.round((out.biceps || 0) * 1.15);
    if (out.chest > 0) out.chest = Math.round(out.chest * 1.02);
  } else if (imbalance.weak === 'push') {
    out.chest = Math.round((out.chest || 0) * 1.15);
    out.triceps = Math.round((out.triceps || 0) * 1.1);
  }

  return out;
}

/**
 * @param {{ pull: number, push: number, legs: number, core: number }} families
 * @param {object} answers
 */
export function applyImbalanceToStrengthFamilies(families, answers) {
  if (!families || !answers) return families;
  const imbalance = deriveStrengthImbalanceFromBaselines(answers);
  const out = { ...families };

  if (imbalance.weak === 'pull') {
    out.pull = Math.round((out.pull || 0) * 1.18);
  } else if (imbalance.weak === 'push') {
    out.push = Math.round((out.push || 0) * 1.12);
  }

  return out;
}

export function shouldBoostPullExposures(answers) {
  const pull = readMax(answers, 'pullupsMax');
  if (pull == null) return false;
  const imbalance = deriveStrengthImbalanceFromBaselines(answers);
  const streetGoal =
    answers?.streetSkillGoal === 'pullups_10' ||
    answers?.streetSkillGoal === 'first_pullup' ||
    pull < 8;
  return imbalance.weak === 'pull' || (streetGoal && pull < 8);
}

export function minPullExposuresFromBaselines(answers) {
  if (!shouldBoostPullExposures(answers)) return 0;
  const pull = readMax(answers, 'pullupsMax') || 0;
  if (pull <= 3) return 3;
  if (pull < 8) return 2;
  return 2;
}

export function isHypertrophyGoal(answers) {
  return HYPERTROPHY_GOALS.has(answers?.goalPhysique);
}
