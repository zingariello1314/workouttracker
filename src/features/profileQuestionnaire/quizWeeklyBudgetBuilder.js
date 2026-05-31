/**
 * Budgets hebdomadaires v6 (séries famille + km course) — Phase 1 meta only.
 */

import { countQuizAvailableDays } from './quizAdherenceEngine';
import { computeWeeklyMuscleCaps } from './quizMuscleVolumeCaps';
import { WEEKLY_PLANNER_ENGINE_VERSION, WEEKLY_PLANNER_PHASE } from './data/missionProfiles';
import { resolveMissionProfile, resolveMissionSource, resolvePrimaryMissionId } from './quizMissionResolver';
import { buildRecoveryBudget } from './quizRecoveryBudget';
import {
  adjustIntensitySplitForTriathlonWeakLeg,
  triathlonWeakLegLabelFr
} from './quizTriathlonResolver';

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

const FINE_MUSCLE_TO_FAMILY = {
  chest: 'push',
  back: 'pull',
  shoulders: 'push',
  biceps: 'pull',
  triceps: 'push',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  upper_body: null,
  lower_body: null,
  core: 'core',
  cardio: null
};

const FINE_BOOST_SETS = {
  chest: 2,
  back: 3,
  shoulders: 2,
  biceps: 1,
  triceps: 1,
  quads: 2,
  hamstrings: 2,
  glutes: 2,
  calves: 1,
  upper_body: 2,
  lower_body: 2,
  core: 1
};

/**
 * @param {number[]} range
 * @param {number} recoveryBudget
 * @param {number} [currentKmHint] — milieu de tranche utilisateur
 */
export function resolveWeeklyKmTarget(range, recoveryBudget, currentKmHint = null) {
  if (!range || range.length < 2) return null;
  const lo = range[0];
  const hi = range[1];
  let mid = currentKmHint != null ? currentKmHint : (lo + hi) / 2;
  mid *= recoveryBudget;
  const scaledLo = Math.max(lo * 0.85, lo * recoveryBudget * 0.9);
  const scaledHi = Math.min(hi * 1.05, hi * recoveryBudget * 1.08);
  mid = clamp(mid, scaledLo, scaledHi);
  return {
    kmRange: [Math.round(scaledLo), Math.round(scaledHi)],
    kmTarget: Math.round(mid)
  };
}

const KM_CURRENT_MAP = {
  km_0: 3,
  km_1_10: 8,
  km_10_20: 15,
  km_20_40: 28,
  km_40_60: 50,
  km_60_80: 70,
  km_80_plus: 90
};

function applyPriorityFineBoosts(strengthFamilies, answers) {
  const prio = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  const fine = {};
  prio.forEach((key) => {
    const boost = FINE_BOOST_SETS[key];
    if (boost == null) return;
    fine[key] = boost;
    const fam = FINE_MUSCLE_TO_FAMILY[key];
    if (fam && strengthFamilies[fam] != null) {
      strengthFamilies[fam] = round1(strengthFamilies[fam] + boost * 0.35);
    }
  });
  return fine;
}

/**
 * Arbitrage P0–P2 simplifié (trace explicable).
 */
export function buildBudgetArbitration(answers, mission, recovery, strength, run) {
  const arbitration = [];
  const rb = recovery.recoveryBudget;

  if (rb < 0.8) {
    arbitration.push({
      priority: 'P0',
      action: 'scale_volume',
      factor: rb,
      reason: `Récupération limitée (${recovery.labelFr}) — volume global ajusté ×${rb}.`
    });
  }

  if (run?.kmTarget && strength) {
    const pull = strength.pull || 0;
    const push = strength.push || 0;
    const totalUpper = pull + push;
    if (run.kmTarget >= 35 && totalUpper > 22 && rb < 0.9) {
      const reducePull = Math.max(8, Math.round(pull * 0.75));
      arbitration.push({
        priority: 'P2',
        action: 'reduce_pull_sets',
        from: pull,
        to: reducePull,
        reason: 'Course + haut du corps élevés avec récupération moyenne — dos allégé.'
      });
      strength.pull = reducePull;
    }
  }

  if (answers?.runStrengthPriority === 'run_first' && strength) {
    arbitration.push({
      priority: 'P1',
      action: 'preserve_run_km',
      targetKm: run?.kmTarget ?? null,
      reason: 'Priorité course déclarée — km maintenus, force en entretien.'
    });
    strength.pull = round1((strength.pull || 12) * 0.85);
    strength.push = round1((strength.push || 12) * 0.85);
    strength.legs = round1((strength.legs || 10) * 0.9);
  }

  if (answers?.runStrengthPriority === 'muscle_first' && run?.kmTarget) {
    arbitration.push({
      priority: 'P1',
      action: 'cap_run_km',
      factor: 0.88,
      reason: 'Priorité musculation — volume course plafonné.'
    });
    run.kmTarget = Math.round(run.kmTarget * 0.88);
    if (run.kmRange) {
      run.kmRange = [run.kmRange[0], Math.round(run.kmRange[1] * 0.9)];
    }
  }

  if (answers?.conflictSacrificePriority === 'keep_cardio' && strength) {
    arbitration.push({
      priority: 'P3',
      action: 'sacrifice_strength_volume',
      reason: 'Tu préfères sacrifier le volume muscu au profit du cardio.'
    });
    Object.keys(strength).forEach((k) => {
      strength[k] = round1((strength[k] || 10) * 0.82);
    });
  }

  if (answers?.conflictSacrificePriority === 'keep_strength' && run?.kmTarget) {
    arbitration.push({
      priority: 'P3',
      action: 'sacrifice_run_km',
      reason: 'Tu préfères sacrifier le cardio au profit de la musculation.'
    });
    run.kmTarget = Math.round(run.kmTarget * 0.75);
  }

  return arbitration;
}

/**
 * @param {object} answers
 * @param {object} [opts]
 * @param {object} [opts.constraints]
 * @param {number} [opts.globalLoadFactor]
 * @param {number} [opts.activeDays] — override
 */
export function buildWeeklyBudgets(answers, opts = {}) {
  const mission = resolveMissionProfile(answers);
  const missionId = resolvePrimaryMissionId(answers);
  const recovery = buildRecoveryBudget(answers, opts.constraints);
  const activeDays = opts.activeDays ?? countQuizAvailableDays(answers);
  const gLoad = opts.globalLoadFactor ?? 1;

  const baseCaps = computeWeeklyMuscleCaps(
    answers,
    recovery.recoveryScore,
    activeDays,
    gLoad * recovery.recoveryBudget
  );

  const mul = mission.strengthFamilyMul || {};
  const strength = {};
  Object.keys(baseCaps).forEach((fam) => {
    const m = mul[fam] ?? 1;
    strength[fam] = round1(baseCaps[fam] * m);
  });

  const fineBoosts = applyPriorityFineBoosts(strength, answers);

  let run = null;
  if (mission.weeklyKmRange) {
    const hint = KM_CURRENT_MAP[answers?.runningWeeklyKmCurrent];
    run = resolveWeeklyKmTarget(mission.weeklyKmRange, recovery.recoveryBudget, hint ?? null);
    run.intensitySplit = mission.intensitySplit || null;
    if (missionId.startsWith('triathlon_')) {
      run.intensitySplit = adjustIntensitySplitForTriathlonWeakLeg(run.intensitySplit, answers?.triathlonWeakLeg);
    }
  }

  const arbitration = buildBudgetArbitration(answers, mission, recovery, strength, run);

  const weakLegFr = missionId.startsWith('triathlon_') ? triathlonWeakLegLabelFr(answers) : null;
  const summaryParts = [
    `Mission : ${mission.labelFr}`,
    weakLegFr ? `Point faible tri : ${weakLegFr}` : null,
    `Récup. ×${recovery.recoveryBudget}`,
    `Force — tirage ${strength.pull} / poussée ${strength.push} / jambes ${strength.legs} séries`,
    run ? `Course ~${run.kmTarget} km/sem (cible ${run.kmRange[0]}–${run.kmRange[1]})` : null
  ].filter(Boolean);

  return {
    engineVersion: WEEKLY_PLANNER_ENGINE_VERSION,
    phase: WEEKLY_PLANNER_PHASE,
    missionId,
    missionLabelFr: mission.labelFr,
    missionSource: resolveMissionSource(answers),
    defaultStructure: mission.defaultStructure,
    maxStrengthDays: mission.maxStrengthDays,
    cardioCapSessionsPerWeek: mission.cardioCapSessionsPerWeek,
    recoveryScore: recovery.recoveryScore,
    recoveryBudget: recovery.recoveryBudget,
    recoveryLabelFr: recovery.labelFr,
    activeDaysPerWeek: activeDays,
    strengthFamilies: strength,
    fineMuscleBoosts: fineBoosts,
    run,
    arbitration,
    summaryFr: summaryParts.join(' · ')
  };
}
