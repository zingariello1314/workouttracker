/**
 * Remplissage exercices v6 — sous contraintes de blocs (phase 5).
 */

import { exerciseDatabase } from '../../data/exerciseDatabase';
import {
  resolveTargetExerciseCount,
  trimExercisesToSessionBudget
} from './quizSessionDurationBudget';
import { trimExercisesForTendonLoad } from './quizRecoveryEngine';
import { enforceSessionExerciseLimits } from './quizSessionLimits';
import { calibrateSeriesFromProgramPatterns } from './quizProgressionApply';
import { effectiveStrengthTier } from './quizVolumeFromBaselines';
import { isRunThenStrengthHybridPref } from './quizHybridLayoutPlacement';
import { USE_WEEKLY_PLANNER_FOR_SCHEDULE } from './quizWeeklyPlanner';
import { preferenceTieBreakDelta } from './quizExercisePreferenceScore';
import { resolveStreetSkillPlan, isStreetOrientedProfile } from './quizStreetSkillGoal';
import { classifyExerciseFamily } from './quizWeeklySeriesAllocator';
import { parseSetsCount } from './quizSessionLimits';
import { resolveSingleCardioStimulusForSession } from './quizCardioSessionResolver';
import { applyPullupSeriesHints, pullupTemplateBoosts } from './quizPullupProgressionPlan';
import { isStrengthExerciseAllowed } from './quizLegProgression';

const HYPERTROPHY_GOALS = new Set(['muscular_defined', 'lean_toned', 'bulk_mass']);

const RUN_BLOCK_KEYS = {
  run_easy: ['course endurance fondamentale'],
  run_tempo: ['course endurance fondamentale'],
  run_interval: ['fractionné', 'fractionné 30/30'],
  run_long: ['course endurance fondamentale'],
  cardio_general: ['course endurance fondamentale', 'corde à sauter'],
  circuit_metabolic: ['burpees', 'mountain climbers', 'corde à sauter'],
  swim_easy: ['natation'],
  swim_technique: ['natation'],
  bike_endurance: ['vélo de route', 'vélo elliptique'],
  bike_tempo: ['vélo elliptique', 'vélo de route']
};

const METABOLIC_CIRCUIT_KEYS = ['burpees', 'mountain climbers', 'corde à sauter'];

const BLOCK_STRENGTH_GROUPS = {
  force_pull: ['upper'],
  force_push: ['upper'],
  force_upper: ['upper', 'core'],
  force_legs: ['lower'],
  force_lower: ['lower'],
  force_core: ['core']
};

const BLOCK_TEMPLATE_BOOSTS = {
  force_pull: ['tractions pronation', 'tractions australiennes', 'rowing haltère'],
  force_push: ['pompes', 'dips', 'développé militaire'],
  force_legs: ['squat gobelet', 'fentes', 'squat cosaque'],
  force_lower: ['squat gobelet', 'fentes'],
  force_core: ['gainage', 'planche'],
  force_upper: ['pompes', 'rowing haltère', 'squat gobelet']
};

/**
 * @param {object} profile
 * @param {object} [coachContext]
 */
export function shouldUseBlockAwareFill(profile, coachContext = null) {
  if (USE_WEEKLY_PLANNER_FOR_SCHEDULE) return true;
  if (Array.isArray(profile?.blocks) && profile.blocks.length > 0) return true;
  if (coachContext?.weeklyPlan?.placement?.days) return true;
  return false;
}

/**
 * @param {object} profile
 * @returns {'pull'|'push'|null}
 */
export function resolveStreetAnchorFocus(profile) {
  const blocks = profile?.blocks || [];
  if (blocks.includes('skill_street') && blocks.includes('force_pull')) return 'pull';
  if (blocks.includes('force_pull')) return 'pull';
  if (blocks.includes('force_push')) return 'push';
  if (profile?.primaryBlock === 'force_pull') return 'pull';
  if (profile?.primaryBlock === 'force_push') return 'push';
  return null;
}

function hasRunMission(coachContext) {
  return Boolean(coachContext?.weeklyPlan?.budgets?.run?.kmTarget);
}

function mergeTemplateBoosts(deformers, extraKeys) {
  const base = Array.isArray(deformers?.templateKeyBoosts) ? deformers.templateKeyBoosts : [];
  const merged = [...new Set([...base, ...extraKeys])];
  return { ...deformers, templateKeyBoosts: merged };
}

function scaleSeriesString(series, newSets) {
  const s = String(series || '3×8-12');
  const m = s.match(/^(\d+)×(.+)$/);
  if (!m) return `${Math.max(3, newSets)}×8-12`;
  return `${Math.max(3, Math.min(5, newSets))}×${m[2]}`;
}

/** Ajuste les séries des exos pour approcher remainingSets (preview pré-fill). */
export function applyRemainingSetsHint(exercises, remainingSets) {
  if (!remainingSets || !Array.isArray(exercises) || !exercises.length) return exercises;
  const buckets = { pull: [], push: [], legs: [], core: [] };
  exercises.forEach((ex) => {
    const fam = classifyExerciseFamily(ex);
    if (fam && buckets[fam]) buckets[fam].push(ex);
  });
  ['pull', 'push', 'legs', 'core'].forEach((fam) => {
    const target = Number(remainingSets[fam]) || 0;
    const list = buckets[fam];
    if (!list.length || target <= 0) return;
    const current = list.reduce((s, ex) => s + parseSetsCount(ex.series), 0);
    if (current >= target * 0.82) return;
    const perEx = Math.max(3, Math.min(5, Math.ceil(target / list.length)));
    list[0].series = scaleSeriesString(list[0].series, perEx);
  });
  return exercises;
}

function exercisePreferenceBonus(dbKey, coachContext) {
  const pref = coachContext?.deformers?.exercisePreferenceScore;
  const tie = preferenceTieBreakDelta(dbKey, pref);
  if (tie !== 0) return tie;
  const boosts = coachContext?.deformers?.templateKeyBoosts;
  if (Array.isArray(boosts) && boosts.includes(dbKey)) return 6;
  return 0;
}

function cardioKeysForBlocks(blocks, runMission, answers, budgets) {
  if (blocks.includes('circuit_metabolic')) {
    return METABOLIC_CIRCUIT_KEYS.filter((k) => exerciseDatabase[k]);
  }
  const resolved = resolveSingleCardioStimulusForSession(blocks, answers, budgets);
  let keys = [...resolved.dbKeys];
  if (runMission) {
    keys = keys.filter((k) => !/burpee|mountain|farmer/.test(k));
  }
  return [...new Set(keys)].filter((k) => exerciseDatabase[k]);
}

function buildCardioFromBlockKeys(
  keys,
  answers,
  blueprint,
  dayIndex,
  weekUsedKeys,
  answersGoal,
  buildProgramExerciseFromDbKey
) {
  const picked = [];
  let fractionneUsed = false;
  if (weekUsedKeys) {
    weekUsedKeys.forEach((k) => {
      if (String(k).includes('fractionné') || String(k).includes('fractionne')) fractionneUsed = true;
    });
  }

  keys.forEach((dbKey, i) => {
    if (/fractionné|fractionne/.test(dbKey)) {
      if (fractionneUsed) return;
      fractionneUsed = true;
    }
    if (dbKey === 'course endurance fondamentale' && weekUsedKeys?.has?.(dbKey)) return;
    const ex = buildProgramExerciseFromDbKey(dbKey, answers, blueprint, {
      idSuffix: `_v6cardio_${dayIndex}_${i}`
    });
    if (!ex) return;
    weekUsedKeys?.add(dbKey);
    picked.push(ex);
  });

  return picked.slice(0, 1);
}

function fillCardioFromBlocks(
  answers,
  blueprint,
  dayIndex,
  profile,
  weekUsedKeys,
  coachContext,
  targetCount,
  deps
) {
  const blocks =
    profile?.blocks?.filter((b) => b.startsWith('run_') || b === 'cardio_general') || ['cardio_general'];
  const runMission = hasRunMission(coachContext);
  const budgets = coachContext?.weeklyPlan?.budgets;
  const { buildProgramExerciseFromDbKey } = deps;
  const picked = buildCardioFromBlockKeys(
    cardioKeysForBlocks(blocks, runMission, answers, budgets),
    answers,
    blueprint,
    dayIndex,
    weekUsedKeys,
    answers?.goalPhysique,
    buildProgramExerciseFromDbKey
  );

  return picked;
}

function fillStrengthFromBlocks(
  answers,
  blueprint,
  dayIndex,
  profile,
  weekUsedKeys,
  weekStrengthUsedKeys,
  coachContext,
  targetCount,
  deps
) {
  const { buildProgramExerciseFromDbKey, pickExercisesForContext } = deps;
  let blocks = (profile?.blocks || []).filter((b) => b.startsWith('force_'));
  if ((profile?.blocks || []).includes('skill_street') && !blocks.includes('force_pull')) {
    blocks = ['force_pull', ...blocks];
  }
  if (!blocks.length) return [];

  const usedKeys = new Set();
  const picked = [];
  const perBlock = Math.max(2, Math.ceil(targetCount / blocks.length));
  const globalTier = effectiveStrengthTier(answers);
  const site = profile?.site ?? null;
  const anchorFocus = resolveStreetAnchorFocus(profile);
  let streetBoosts = [];
  if (isStreetOrientedProfile(answers) && profile?.blocks?.includes('skill_street')) {
    streetBoosts = resolveStreetSkillPlan(answers).boosts;
  }
  const pullupBoosts = pullupTemplateBoosts(answers, coachContext?.weeklyObjectives);
  if (pullupBoosts.length) {
    streetBoosts = [...new Set([...pullupBoosts, ...streetBoosts])];
  }

  blocks.forEach((block, bi) => {
    const groups = BLOCK_STRENGTH_GROUPS[block] || ['upper'];
    const boosts = [...(BLOCK_TEMPLATE_BOOSTS[block] || []), ...streetBoosts]
      .filter((k) => exerciseDatabase[k])
      .sort((a, b) => exercisePreferenceBonus(b, coachContext) - exercisePreferenceBonus(a, coachContext));
    const deformers = mergeTemplateBoosts(coachContext?.deformers, boosts);

    const chunk = pickExercisesForContext(answers, blueprint, {
      groups,
      count: perBlock,
      site,
      dayIndex: dayIndex + bi * 11,
      usedKeys,
      modality: 'strength',
      weekUsedKeys,
      weekStrengthUsedKeys,
      deformers,
      globalTier,
      templateKeyBoosts: deformers.templateKeyBoosts
    }).filter((ex) => isStrengthExerciseAllowed(ex.exerciseBankKey, answers, 'strength'));
    picked.push(...chunk);
  });

  if (
    anchorFocus &&
    blocks.some((b) => ['force_pull', 'force_push', 'force_upper'].includes(b))
  ) {
    const PULL = ['tractions pronation', 'rowing haltère', 'tractions australiennes'];
    const PUSH = ['pompes', 'dips', 'développé militaire'];
    const planKeys = anchorFocus === 'pull' ? PULL : PUSH;
    const have = new Set(picked.map((e) => e.exerciseBankKey));
    planKeys.forEach((dbKey, i) => {
      if (have.has(dbKey) || usedKeys.has(dbKey) || !exerciseDatabase[dbKey]) return;
      const ex = buildProgramExerciseFromDbKey(dbKey, answers, blueprint, {
        idSuffix: `_v6anchor_${dayIndex}_${i}`
      });
      if (!ex) return;
      usedKeys.add(dbKey);
      picked.unshift(ex);
      weekStrengthUsedKeys?.set?.(dbKey, dayIndex);
    });
  }

  let out = applyRemainingSetsHint(picked, profile?.remainingSets);
  if (blocks.some((b) => b === 'force_pull' || b === 'skill_street')) {
    out = applyPullupSeriesHints(out, answers, coachContext?.weeklyObjectives);
  }
  return out;
}

function fillMetabolicCircuitFromBlocks(
  answers,
  blueprint,
  dayIndex,
  profile,
  weekUsedKeys,
  coachContext,
  targetCount,
  deps
) {
  const { buildProgramExerciseFromDbKey, pickExercisesForContext } = deps;
  const keys = METABOLIC_CIRCUIT_KEYS.filter((k) => exerciseDatabase[k]);
  const deformers = mergeTemplateBoosts(coachContext?.deformers, keys);
  let picked = buildCardioFromBlockKeys(
    keys,
    answers,
    blueprint,
    dayIndex,
    weekUsedKeys,
    answers?.goalPhysique,
    buildProgramExerciseFromDbKey
  );

  if (picked.length < 2) {
    const fallback = pickExercisesForContext(answers, blueprint, {
      groups: ['cardio'],
      count: Math.max(3, targetCount),
      site: profile?.site || 'outdoor',
      dayIndex,
      usedKeys: new Set(),
      modality: 'cardio',
      weekUsedKeys,
      deformers
    });
    const seen = new Set(picked.map((e) => e.exerciseBankKey));
    fallback.forEach((ex) => {
      if (!seen.has(ex.exerciseBankKey) && picked.length < 5) {
        picked.push(ex);
        seen.add(ex.exerciseBankKey);
      }
    });
  }

  return picked.slice(0, Math.max(3, targetCount));
}

/**
 * Fill v6 — retourne null si le chemin legacy doit s’appliquer.
 */
export function fillSessionFromProfileBlocks(
  answers,
  blueprint,
  dayIndex,
  profile,
  weekUsedKeys,
  weekStrengthUsedKeys,
  coachContext,
  deps
) {
  if (!deps?.pickExercisesForContext || !deps?.buildProgramExerciseFromDbKey) return null;
  if (!shouldUseBlockAwareFill(profile, coachContext)) return null;

  const deformers = coachContext?.deformers;
  let count = resolveTargetExerciseCount(answers, blueprint);
  if (deformers?.maxExercisesPerSession != null) {
    count = Math.min(count, deformers.maxExercisesPerSession);
  }
  if (deformers?.volumeMul != null && deformers.volumeMul !== 1) {
    count = Math.max(3, Math.round(count * deformers.volumeMul));
  }

  const modality = profile?.modality || 'strength';
  const blocks = profile?.blocks || [];
  const hasMetabolic = blocks.includes('circuit_metabolic');
  const hasForce = blocks.some((b) => b.startsWith('force_'));
  const hasRunBlock = blocks.some((b) => b.startsWith('run_') || b === 'cardio_general');
  const hasStrengthBlock = hasForce || blocks.includes('skill_street');

  if (
    (modality === 'hybrid' || modality === 'strength_plus_cardio') &&
    hasRunBlock &&
    hasStrengthBlock
  ) {
    const runFirst =
      profile?.hybridExerciseOrder === 'run_then_strength' ||
      isRunThenStrengthHybridPref(answers?.hybridLayoutPreference);
    const strengthShare = runFirst ? 0.55 : 0.72;
    const strengthCount = Math.max(4, Math.round(count * strengthShare));
    const runCount = Math.max(2, count - strengthCount);

    const strengthBlocks = blocks.filter(
      (b) => !b.startsWith('run_') && b !== 'cardio_general'
    );
    const runBlocks = blocks.filter((b) => b.startsWith('run_') || b === 'cardio_general');

    const strengthProfile = { ...profile, blocks: strengthBlocks, modality: 'strength' };
    const runProfile = { ...profile, blocks: runBlocks.length ? runBlocks : ['run_easy'], modality: 'cardio' };

    const strengthEx = fillStrengthFromBlocks(
      answers,
      blueprint,
      dayIndex,
      strengthProfile,
      weekUsedKeys,
      weekStrengthUsedKeys,
      coachContext,
      strengthCount,
      deps
    );
    const runEx = fillCardioFromBlocks(
      answers,
      blueprint,
      dayIndex,
      runProfile,
      weekUsedKeys,
      coachContext,
      runCount,
      deps
    );

    const ordered = runFirst ? [...runEx, ...strengthEx] : [...strengthEx, ...runEx];
    const seen = new Set();
    return ordered.filter((ex) => {
      const k = ex.exerciseBankKey;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  if (modality === 'cardio' || (hasRunBlock && !hasStrengthBlock)) {
    return fillCardioFromBlocks(
      answers,
      blueprint,
      dayIndex,
      profile,
      weekUsedKeys,
      coachContext,
      count,
      deps
    );
  }

  if (hasMetabolic && hasForce) {
    const metabolicCount = Math.max(2, Math.floor(count * 0.4));
    const metabolic = fillMetabolicCircuitFromBlocks(
      answers,
      blueprint,
      dayIndex,
      profile,
      weekUsedKeys,
      coachContext,
      metabolicCount,
      deps
    );
    const strength = fillStrengthFromBlocks(
      answers,
      blueprint,
      dayIndex,
      profile,
      weekUsedKeys,
      weekStrengthUsedKeys,
      coachContext,
      Math.max(3, count - metabolic.length),
      deps
    );
    const seen = new Set();
    return [...metabolic, ...strength].filter((ex) => {
      const k = ex.exerciseBankKey;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }

  if (hasMetabolic) {
    return fillMetabolicCircuitFromBlocks(
      answers,
      blueprint,
      dayIndex,
      profile,
      weekUsedKeys,
      coachContext,
      count,
      deps
    );
  }

  if (hasForce) {
    return fillStrengthFromBlocks(
      answers,
      blueprint,
      dayIndex,
      profile,
      weekUsedKeys,
      weekStrengthUsedKeys,
      coachContext,
      count,
      deps
    );
  }

  return null;
}

export { USE_WEEKLY_PLANNER_FOR_SCHEDULE };
