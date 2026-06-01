/**
 * Objectifs hebdomadaires explicites (missions → volumes → contraintes) — Phase 0 planificateur.
 */

import { resolveMissionProfile, resolvePrimaryMissionIds } from './quizMissionResolver';
import { MISSION_PROFILES_V6 } from './data/missionProfiles';
import { buildRecoveryBudget } from './quizRecoveryBudget';
import { resolveWeeklyKmTarget } from './quizWeeklyBudgetBuilder';
import {
  adjustIntensitySplitForRunningProfile,
  inferRunningSessionProfile
} from './quizRunningSessionProfile';
import { resolveStreetSkillPlan, isStreetOrientedProfile } from './quizStreetSkillGoal';
import { getSessionBudget } from './quizSessionDurationBudget';
import {
  applyImbalanceToMuscleTargets,
  deriveStrengthImbalanceFromBaselines,
  minPullExposuresFromBaselines
} from './quizStrengthBaselines';

export const WEEKLY_OBJECTIVES_VERSION = 1;

const HYPERTROPHY_GOALS = new Set(['muscular_defined', 'lean_toned', 'bulk_mass']);

const KM_CURRENT_MAP = {
  km_0: 3,
  km_1_10: 8,
  km_10_20: 15,
  km_20_40: 28,
  km_40_60: 50,
  km_60_80: 70,
  km_80_plus: 90
};

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function experienceIsLow(answers) {
  const e = answers?.experienceLevel;
  return e === 'beginner_total' || e === 'beginner_0_3m';
}

function wantsLowerBody(answers) {
  const prio = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  return prio.includes('lower_body') || prio.length === 0 || prio.includes('cardio');
}

function wantsUpperHypertrophy(answers) {
  return HYPERTROPHY_GOALS.has(answers?.goalPhysique);
}

/**
 * @param {object} answers
 * @param {{ lo: number, hi: number }} range
 */
function pickVolumeInRange(range, answers, recoveryBudget = 1) {
  const expLow = experienceIsLow(answers);
  let mid = expLow ? range.lo + (range.hi - range.lo) * 0.35 : range.lo + (range.hi - range.lo) * 0.55;
  mid *= recoveryBudget;
  return Math.round(clamp(mid, range.lo, range.hi));
}

/**
 * @param {object} answers
 * @param {object} [constraints]
 */
export function buildWeeklyTrainingObjectives(answers, constraints = null) {
  const missionIds = resolvePrimaryMissionIds(answers || {});
  const mission = resolveMissionProfile(answers || {});
  const recovery = buildRecoveryBudget(answers || {}, constraints);
  const recoveryBudget = recovery.recoveryBudget ?? 1;

  const muscleVolumeTargets = {
    chest: 0,
    back: 0,
    shoulders: 0,
    biceps: 0,
    triceps: 0,
    quads: 0,
    hamstringsGlutes: 0,
    core: 0
  };

  if (wantsUpperHypertrophy(answers)) {
    muscleVolumeTargets.chest = pickVolumeInRange({ lo: 10, hi: 14 }, answers, recoveryBudget);
    muscleVolumeTargets.back = pickVolumeInRange({ lo: 12, hi: 16 }, answers, recoveryBudget);
    muscleVolumeTargets.shoulders = pickVolumeInRange({ lo: 8, hi: 12 }, answers, recoveryBudget);
    const armsTotal = pickVolumeInRange({ lo: 6, hi: 10 }, answers, recoveryBudget);
    muscleVolumeTargets.biceps = Math.round(armsTotal * 0.45);
    muscleVolumeTargets.triceps = Math.round(armsTotal * 0.55);
    muscleVolumeTargets.core = pickVolumeInRange({ lo: 6, hi: 10 }, answers, recoveryBudget);
  }

  if (wantsLowerBody(answers)) {
    muscleVolumeTargets.quads = pickVolumeInRange({ lo: 8, hi: 12 }, answers, recoveryBudget);
    muscleVolumeTargets.hamstringsGlutes = pickVolumeInRange({ lo: 6, hi: 10 }, answers, recoveryBudget);
  }

  const prio = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  const fineBoost = { chest: 2, back: 2, shoulders: 1, biceps: 1, triceps: 1, quads: 2, hamstrings: 2, glutes: 1, core: 1 };
  prio.forEach((key) => {
    if (key === 'hamstrings' || key === 'glutes') {
      muscleVolumeTargets.hamstringsGlutes += fineBoost[key] || 1;
    } else if (fineBoost[key]) {
      muscleVolumeTargets[key] = (muscleVolumeTargets[key] || 0) + fineBoost[key];
    }
  });

  const strengthImbalance = deriveStrengthImbalanceFromBaselines(answers);
  const adjustedMuscle = applyImbalanceToMuscleTargets(muscleVolumeTargets, answers);

  let pullupPlan = null;
  if (isStreetOrientedProfile(answers)) {
    const street = resolveStreetSkillPlan(answers || {});
    let exposuresPerWeek = street.skillId === 'pullups_10' ? (experienceIsLow(answers) ? 2 : 3) : 2;
    exposuresPerWeek = Math.max(exposuresPerWeek, minPullExposuresFromBaselines(answers));
    pullupPlan = {
      exposuresPerWeek,
      skillId: street.skillId,
      labelFr: street.labelFr,
      variantHints: street.boosts.slice(0, 4)
    };
    adjustedMuscle.back = Math.max(adjustedMuscle.back, 10);
  }

  let runPlan = null;
  const runKmRange =
    mission.weeklyKmRange ||
    (answers?.runningGoal === 'return_to_run' || answers?.runningGoal === 'health'
      ? MISSION_PROFILES_V6.run_health?.weeklyKmRange
      : null) ||
    (answers?.cardioTrainingDesire === 'high' || answers?.cardioTrainingDesire === 'priority_hiit'
      ? MISSION_PROFILES_V6.general_health?.weeklyKmRange
      : null);

  if (runKmRange) {
    const hint = KM_CURRENT_MAP[answers?.runningWeeklyKmCurrent];
    const runResolved = resolveWeeklyKmTarget(runKmRange, recoveryBudget, hint ?? null);
    const runProfile = inferRunningSessionProfile(answers);
    let intensitySplit = mission.intensitySplit || { easy: 0.7, tempo: 0.2, intervals: 0.1 };
    if (runProfile) {
      intensitySplit = adjustIntensitySplitForRunningProfile(intensitySplit, runProfile);
    }
    const isReturn = runProfile === 'return' || answers?.runningGoal === 'return_to_run';
    const sessionsPerWeek = isReturn
      ? 2
      : Math.min(mission.cardioCapSessionsPerWeek || 3, Math.max(2, Math.ceil((mission.cardioCapSessionsPerWeek || 3) * 0.75)));
    runPlan = {
      kmTarget: runResolved?.kmTarget ?? null,
      kmRange: runResolved?.kmRange ?? null,
      sessionsPerWeek,
      intensitySplit,
      maxQualitySessions: isReturn ? 1 : 2,
      runningSessionProfile: runProfile
    };
  }

  const sessionTimeBudgetMin = getSessionBudget(answers || {}).targetMin ?? 52;

  const objectives = {
    version: WEEKLY_OBJECTIVES_VERSION,
    missionIds,
    missionId: mission.id,
    missionLabelFr: mission.labelFr,
    muscleVolumeTargets: adjustedMuscle,
    strengthImbalance,
    pullupPlan,
    runPlan,
    sessionTimeBudgetMin,
    minActiveDaysToCover: 0,
    scaling: {
      globalFactor: 1,
      reasonsFr: []
    }
  };

  objectives.minActiveDaysToCover = minActiveDaysToCover(objectives, answers);
  return objectives;
}

/**
 * @param {object} objectives
 * @param {object} answers
 */
export function minActiveDaysToCover(objectives, answers = null) {
  let min = 0;
  const runSessions = objectives?.runPlan?.sessionsPerWeek || 0;
  min += runSessions;

  const hasHypertrophy =
    HYPERTROPHY_GOALS.has(answers?.goalPhysique) ||
    (objectives?.muscleVolumeTargets?.chest || 0) > 0;

  if (hasHypertrophy) {
    min += 1;
    if ((objectives?.muscleVolumeTargets?.chest || 0) > 0) min += 1;
    if (wantsLowerBody(answers) && (objectives?.muscleVolumeTargets?.quads || 0) > 0) min += 1;
  } else if ((objectives?.muscleVolumeTargets?.back || 0) > 0) {
    min += 1;
  }

  const exposures = objectives?.pullupPlan?.exposuresPerWeek || 0;
  if (exposures > 0) {
    min += Math.max(0, Math.ceil(exposures / 2) - 1);
  }

  return Math.max(2, Math.min(7, min));
}

/**
 * @param {object} objectives
 * @param {{ recoveryBudget?: number, adherenceRisk?: number, globalLoadFactor?: number }} scaleCtx
 */
export function applyObjectiveScaling(objectives, scaleCtx = {}) {
  if (!objectives) return null;
  const next = {
    ...objectives,
    muscleVolumeTargets: { ...objectives.muscleVolumeTargets },
    pullupPlan: objectives.pullupPlan ? { ...objectives.pullupPlan } : null,
    runPlan: objectives.runPlan ? { ...objectives.runPlan } : null,
    scaling: { ...objectives.scaling, reasonsFr: [...(objectives.scaling?.reasonsFr || [])] }
  };

  let factor = Number(scaleCtx.globalLoadFactor) || 1;
  if (scaleCtx.recoveryBudget != null) {
    factor *= Number(scaleCtx.recoveryBudget) || 1;
    if (scaleCtx.recoveryBudget < 0.85) {
      next.scaling.reasonsFr.push(
        `Récupération limitée — objectifs muscle ×${round1(scaleCtx.recoveryBudget)}.`
      );
    }
  }
  if (scaleCtx.adherenceRisk != null && scaleCtx.adherenceRisk >= 0.65) {
    const adherenceMul = scaleCtx.adherenceRisk >= 0.75 ? 0.92 : 0.96;
    factor *= adherenceMul;
    next.scaling.reasonsFr.push(
      'Profil chargé au quiz — léger ajustement des volumes pour tenir sur la durée.'
    );
  }

  factor = clamp(factor, 0.72, 1.12);
  next.scaling.globalFactor = round1(factor);

  const hypertrophyFloors =
    scaleCtx.answers && HYPERTROPHY_GOALS.has(scaleCtx.answers.goalPhysique)
      ? {
          chest: 10,
          back: 12,
          shoulders: 8,
          biceps: 4,
          triceps: 4,
          quads: 8,
          hamstringsGlutes: 6,
          core: 6
        }
      : null;

  Object.keys(next.muscleVolumeTargets).forEach((key) => {
    const v = next.muscleVolumeTargets[key];
    if (v > 0) {
      let scaled = Math.round(v * factor);
      const floor = hypertrophyFloors?.[key] ?? (key === 'core' ? 4 : 6);
      next.muscleVolumeTargets[key] = Math.max(floor, scaled);
    }
  });

  if (next.runPlan?.kmTarget) {
    next.runPlan.kmTarget = Math.round(next.runPlan.kmTarget * clamp(factor, 0.85, 1.05));
  }

  next.minActiveDaysToCover = minActiveDaysToCover(next, null);
  return next;
}

/**
 * @param {object} objectives — scalés
 * @param {object} constraints — resolveQuizConstraints
 */
export function derivePrescribedActiveDays(objectives, constraints) {
  const minDays = objectives?.minActiveDaysToCover ?? 2;
  const daysAvailable = constraints?.daysAvailable ?? minDays;
  const adherenceCap = constraints?.adherenceCap ?? constraints?.maxActiveDays ?? daysAvailable;
  let prescribed = Math.max(minDays, Math.min(daysAvailable, adherenceCap));

  let coverageWarningFr = null;
  if (adherenceCap < minDays && daysAvailable >= minDays) {
    prescribed = Math.min(daysAvailable, minDays);
    coverageWarningFr =
      `${daysAvailable} jour(s) coché(s) — le programme vise ${prescribed} séances pour couvrir tes missions (hypertrophie, tractions, course), plutôt que ${adherenceCap} séance(s) « sûres » qui laisseraient des objectifs de côté.`;
  }

  return { prescribedActiveDays: Math.max(2, prescribed), coverageWarningFr };
}

/**
 * @param {object} objectives
 * @returns {{ pull: number, push: number, legs: number, core: number }}
 */
export function objectivesToStrengthFamilies(objectives) {
  const m = objectives?.muscleVolumeTargets || {};
  const pull = (m.back || 0) + (m.biceps || 0);
  const push = (m.chest || 0) + (m.shoulders || 0) + (m.triceps || 0);
  const legs = (m.quads || 0) + (m.hamstringsGlutes || 0);
  const core = m.core || 0;
  return {
    pull: round1(pull),
    push: round1(push),
    legs: round1(legs),
    core: round1(core)
  };
}

/**
 * @param {object} objectives
 */
const PULL_PATTERN = /traction|pull|rowing|chin|australien|tirage|dos/i;
const PUSH_PATTERN = /pompe|dip|développé|press|bench|épaule|militaire|push|pec/i;
const LEGS_PATTERN = /squat|fente|leg|jambe|mollet|presse|soulevé|terre/i;

function countSetsOnExercises(exercises) {
  let total = 0;
  (exercises || []).forEach((ex) => {
    const s = String(ex.series || '').trim();
    const m = s.match(/^(\d+)/);
    total += m ? Number(m[1]) || 0 : 0;
  });
  return total;
}

function classifyExerciseFine(ex) {
  const blob = `${ex.exerciseBankKey || ''} ${ex.name || ''}`;
  if (PULL_PATTERN.test(blob) && !PUSH_PATTERN.test(blob)) return 'back';
  if (PUSH_PATTERN.test(blob)) return 'chest';
  if (LEGS_PATTERN.test(blob)) return 'quads';
  return null;
}

/**
 * Audit fine muscle vs objectifs (post-fill).
 * @param {object} objectives
 * @param {Record<string, object>} schedule
 * @param {string[]} activeDayKeys
 */
export function auditObjectivesVsRealized(objectives, schedule, activeDayKeys) {
  if (!objectives) return null;
  const targets = { ...objectives.muscleVolumeTargets };
  const actual = {
    chest: 0,
    back: 0,
    shoulders: 0,
    biceps: 0,
    triceps: 0,
    quads: 0,
    hamstringsGlutes: 0,
    core: 0
  };

  activeDayKeys.forEach((dayKey) => {
    (schedule?.[dayKey]?.exercises || []).forEach((ex) => {
      const sets = countSetsOnExercises([ex]);
      const fine = classifyExerciseFine(ex);
      if (fine === 'back') actual.back += sets;
      else if (fine === 'chest') {
        actual.chest += sets;
        if (/épaule|militaire|shoulder/i.test(`${ex.name}`)) actual.shoulders += sets;
        else if (/triceps|dip/i.test(`${ex.name}`)) actual.triceps += sets;
      } else if (fine === 'quads') actual.quads += sets;
    });
  });

  const gaps = {};
  const warnings = [];
  Object.keys(targets).forEach((key) => {
    const t = targets[key] || 0;
    if (t <= 0) return;
    const a = actual[key] || 0;
    gaps[key] = { target: t, actual: a };
    if (a === 0) {
      warnings.push(`Objectif ${key} : 0 série réalisée (cible ${t}/sem).`);
    } else if (a < t * 0.5) {
      warnings.push(`Objectif ${key} : ${a} séries vs ${t} cibles.`);
    }
  });

  let pullExposures = 0;
  activeDayKeys.forEach((dayKey) => {
    const hasPull = (schedule?.[dayKey]?.exercises || []).some((ex) =>
      PULL_PATTERN.test(`${ex.name} ${ex.exerciseBankKey}`)
    );
    if (hasPull) pullExposures += 1;
  });

  const pullTarget = objectives.pullupPlan?.exposuresPerWeek || 0;
  if (pullTarget > 0 && pullExposures < pullTarget) {
    warnings.push(
      `Tractions : ${pullExposures} jour(s) avec travail tirage vs ${pullTarget} expositions visées.`
    );
  }

  return {
    targets,
    actual,
    gaps,
    warnings,
    withinTolerance: warnings.length === 0,
    summaryFr: warnings.length
      ? warnings.slice(0, 3).join(' ')
      : 'Objectifs hebdo : couverture dans les tolérances.'
  };
}

export function formatWeeklyObjectivesSummaryFr(objectives) {
  if (!objectives) return null;
  const m = objectives.muscleVolumeTargets || {};
  const parts = [];
  if ((m.chest || 0) + (m.back || 0) > 0) {
    parts.push(
      `Hypertrophie : dos ${m.back || 0} séries, pecs ${m.chest || 0}, épaules ${m.shoulders || 0}, jambes ${(m.quads || 0) + (m.hamstringsGlutes || 0)}`
    );
  }
  if (objectives.pullupPlan) {
    parts.push(
      `${objectives.pullupPlan.labelFr} : ${objectives.pullupPlan.exposuresPerWeek} exposition(s) traction / semaine`
    );
  }
  if (objectives.runPlan?.kmTarget) {
    parts.push(
      `Course : ~${objectives.runPlan.kmTarget} km, ${objectives.runPlan.sessionsPerWeek} sortie(s), max ${objectives.runPlan.maxQualitySessions} séance(s) qualité`
    );
  }
  const base = parts.length ? `Cette semaine doit accomplir : ${parts.join(' · ')}` : null;
  const imbalance = objectives.strengthImbalance?.summaryFr;
  if (imbalance && base) return `${imbalance} ${base}`;
  if (imbalance) return imbalance;
  return base;
}
