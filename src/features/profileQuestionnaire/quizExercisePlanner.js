/**
 * Sélection d'exercices réels (banque) pour programmes générés depuis le quiz.
 */

import { exerciseDatabase } from '../../data/exerciseDatabase';
import { buildQuizTrainingSessionBlueprint } from './quizInfluence';
import {
  resolveTargetExerciseCount,
  trimExercisesToSessionBudget,
  formatEstimatedSessionDuration,
  finalizeSessionForDurationBudget
} from './quizSessionDurationBudget';
import { isStrengthExerciseAllowed } from './quizLegProgression';
import { addonMinutes, planWeekSessionProfiles } from './quizSessionPlanner';
import { applyBaselineToSeries, effectiveStrengthTier } from './quizVolumeFromBaselines';
import { trimExercisesForTendonLoad } from './quizRecoveryEngine';
import { enforceSessionExerciseLimits } from './quizSessionLimits';
import { calibrateSeriesFromProgramPatterns } from './quizProgressionApply';
import { getMergedQuizExerciseTemplates } from './quizExercisePool';
import {
  scoreFitnessForPick,
  scorePriorityMuscleAffinity,
  scoreTrainingStyleAffinity,
  scoreGroupCoherence,
  scoreLegacyTieBonus,
  scoreVarietyVsUsed
} from './quizExerciseSelectionScore';
import { preferenceTieBreakDelta } from './quizExercisePreferenceScore';
import { fillSessionFromProfileBlocks } from './quizExerciseFill';
import { resolveEffectiveQuizEquipment } from './quizProfileConstraints';

export { planWeekSessionProfiles };
export { QUIZ_LEGACY_EXERCISE_TEMPLATES } from './quizExerciseTemplates';

const SITE_LABELS = {
  commercial_gym: 'Salle commerciale',
  home_gym: 'Salle à domicile',
  home_minimal: 'Domicile',
  outdoor: 'Extérieur / parc',
  track: 'Piste'
};

const GOAL_GROUP_BOOST = {
  lean_toned: { upper: 1, lower: 1, core: 1, cardio: 1 },
  muscular_defined: { upper: 2, lower: 2, core: 1, cardio: 0 },
  strong_powerful: { upper: 2, lower: 2, core: 1, cardio: 0 },
  balanced_functional: { upper: 1, lower: 1, core: 1, cardio: 1 },
  athletic_performance: { upper: 1, lower: 1, core: 1, cardio: 2 },
  bulk_mass: { upper: 2, lower: 2, core: 0, cardio: 0 },
  recomposition: { upper: 1, lower: 1, core: 1, cardio: 1 },
  endurance_lean: { upper: 0, lower: 1, core: 1, cardio: 3 }
};

const HYPERTROPHY_GOALS = new Set(['muscular_defined', 'lean_toned', 'bulk_mass']);

export function isWeekAlternationEnabled(answers) {
  return answers?.weekAlternation === 'ab_enabled';
}

export function resolveAlternationSites(answers) {
  if (!isWeekAlternationEnabled(answers)) return null;
  const picked = Array.isArray(answers?.weekAlternationSites) ? answers.weekAlternationSites : [];
  const loc = Array.isArray(answers?.trainingLocation) ? answers.trainingLocation : [];
  const siteA = picked[0] || loc[0] || 'commercial_gym';
  const siteB = picked[1] || picked[0] || loc[1] || (siteA === 'outdoor' ? 'commercial_gym' : 'outdoor');
  return { weekA: siteA, weekB: siteB };
}

function parseExerciseCountHint(blueprint, answers) {
  if (answers) return resolveTargetExerciseCount(answers, blueprint);
  const txt = String(blueprint?.exercisesPerSession || '');
  const m = txt.match(/(\d+)\D+(\d+)/);
  if (!m) return 5;
  const lo = Number(m[1]) || 4;
  const hi = Number(m[2]) || lo;
  return Math.max(3, Math.min(10, Math.round((lo + hi) / 2)));
}

function groupTargetsFromQuiz(answers) {
  const prio = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  const groups = [];
  if (prio.includes('upper_body') || prio.some((k) => ['chest', 'back', 'shoulders', 'biceps', 'triceps'].includes(k))) {
    groups.push('upper');
  }
  if (prio.includes('lower_body') || prio.some((k) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(k))) {
    groups.push('lower');
  }
  if (prio.includes('cardio')) groups.push('cardio');
  if (prio.includes('core')) groups.push('core');
  if (!groups.length) groups.push('upper', 'lower');
  if (!groups.includes('core') && groups.length < 4) groups.push('core');
  return groups;
}

function equipmentSet(answers) {
  return resolveEffectiveQuizEquipment(answers);
}

function hasPullupBar(answers) {
  const eq = equipmentSet(answers);
  return eq.includes('pullup_bar');
}

function templateMatches(template, { quizEq, site, modality, answers, weekUsedKeys }) {
  if (!exerciseDatabase[template.dbKey]) return false;
  if (site && template.locations.length && !template.locations.includes(site)) return false;
  if (!template.quizEquipment.some((e) => quizEq.includes(e))) return false;

  if (modality === 'cardio' && template.group !== 'cardio') return false;
  if (modality === 'strength' && template.group === 'cardio') return false;
  if (modality === 'strength_plus_cardio' && template.group === 'cardio') return false;

  if (template.dbKey === 'course endurance fondamentale' || template.dbKey.startsWith('fractionné')) {
    if (modality !== 'cardio') return false;
    if (weekUsedKeys?.has('course endurance fondamentale')) {
      if (template.dbKey === 'course endurance fondamentale') return false;
    }
    if (site === 'home_minimal') return false;
  }

  if (site === 'home_minimal') {
    if (template.dbKey === 'tractions pronation' && !hasPullupBar(answers)) return false;
    if (template.dbKey === 'dips' && !quizEq.some((e) => ['dip_station', 'parallel_bars'].includes(e))) {
      return false;
    }
    if (template.needsLowBar && !hasPullupBar(answers)) return false;
  }

  if (template.needsLowBar && site === 'home_minimal') return false;

  return true;
}

function inferProgramCategory(dbEx, dbKey) {
  const name = `${dbEx?.name || ''} ${dbKey}`.toLowerCase();
  if (name.includes('course') || name.includes('fractionné') || name.includes('corde') || name.includes('burpee') || name.includes('mountain')) {
    return 'cardio';
  }
  if (dbEx?.category === 'Abdominaux' || name.includes('gainage')) return 'muscu';
  return 'muscu';
}

function buildSeriesForExercise(dbKey, blueprint, category, answers) {
  const use4 = String(blueprint?.setsHint || '').includes('4');
  const repRange = String(blueprint?.repRange || '8–12');
  if (category === 'cardio') {
    if (dbKey.includes('course')) return '1×20–35 min';
    if (dbKey.includes('fractionné')) return '6×(30 s / 30 s)';
    if (dbKey.includes('corde')) return '6×(30 s / 30 s)';
    if (dbKey.includes('burpee')) return '4×8';
    return '3×3 min';
  }
  if (dbKey.includes('gainage')) {
    const base = '3×30–45 sec';
    return applyBaselineToSeries(dbKey, answers, base);
  }
  if (repRange.includes('4–8')) {
    const base = use4 ? '4×5' : '3×5';
    return applyBaselineToSeries(dbKey, answers, base);
  }
  if (repRange.includes('12–20')) {
    const base = use4 ? '4×15' : '3×15';
    return applyBaselineToSeries(dbKey, answers, base);
  }
  const base = use4 ? '4×8-10' : '3×8-12';
  return applyBaselineToSeries(dbKey, answers, base);
}

function restForCategory(category, dbKey) {
  if (category === 'cardio') return dbKey.includes('course') ? 0 : 45;
  if (dbKey.includes('gainage')) return 30;
  return 75;
}

export function buildProgramExerciseFromDbKey(dbKey, answers, blueprint, { idSuffix = '' } = {}) {
  const dbEx = exerciseDatabase[dbKey];
  if (!dbEx) return null;
  const category = inferProgramCategory(dbEx, dbKey);
  const isCardio = category === 'cardio';
  return {
    id: `quiz_ex_${dbKey.replace(/\s+/g, '_')}${idSuffix}_${Math.random().toString(36).slice(2, 7)}`,
    name: dbEx.name,
    series: buildSeriesForExercise(dbKey, blueprint, category, answers),
    reps: isCardio ? '' : '',
    rest: restForCategory(category, dbKey),
    intensity: isCardio ? 'moderate' : 'moderate',
    notes: dbEx.description || 'Suggéré depuis le quiz (ajustable).',
    materiel: dbEx.equipment || 'Variable',
    type: isCardio ? 'cardio' : dbKey.includes('gainage') ? 'core' : 'standard',
    programCategory: category,
    cardioKind: isCardio ? (dbKey.includes('course') ? 'running' : '') : '',
    exerciseBankKey: dbKey
  };
}

function seededRng(seedStr) {
  let h = 2166136261;
  const s = String(seedStr);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeightedTemplates(candidates, count, rng) {
  const pool = [...candidates];
  const picked = [];
  while (picked.length < count && pool.length > 0) {
    const windowSize = Math.min(14, pool.length);
    const slice = pool.slice(0, windowSize);
    const total = slice.reduce((s, c) => s + Math.max(1, c.score), 0);
    let r = rng() * total;
    let idx = 0;
    for (let i = 0; i < slice.length; i += 1) {
      r -= Math.max(1, slice[i].score);
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    const [chosen] = slice.splice(idx, 1);
    picked.push(chosen);
    const fullIdx = pool.findIndex((p) => p.t.dbKey === chosen.t.dbKey);
    if (fullIdx >= 0) pool.splice(fullIdx, 1);
  }
  return picked;
}

function scoreTemplate(
  template,
  answers,
  group,
  dayIndex,
  weekStrengthUsedKeys,
  deformers,
  globalTier,
  { eligibleCount = 99, sessionUsedKeys = null, templateKeyBoosts = null } = {}
) {
  const key = template.dbKey;
  const goal = answers?.goalPhysique || 'balanced_functional';
  const boosts = GOAL_GROUP_BOOST[goal] || GOAL_GROUP_BOOST.balanced_functional;
  let score = boosts[template.group] ?? 0;
  const gw = deformers?.preferredGroupWeights;
  if (gw && template.group && gw[template.group] != null) {
    score += Math.round((gw[template.group] - 1) * 4);
  }

  score += scoreGroupCoherence(template, group);
  score += scoreFitnessForPick(template.fitnessScore);
  score += scorePriorityMuscleAffinity(template.dbKey, answers);
  score += scoreTrainingStyleAffinity(template, answers, group);
  score += scoreLegacyTieBonus(template, { eligibleCount });
  if (sessionUsedKeys) score += scoreVarietyVsUsed(template, sessionUsedKeys);

  if (weekStrengthUsedKeys?.has?.(template.dbKey)) score -= 8;
  if (template.tier === 'classic') score += 1;
  const exp = answers?.experienceLevel;
  if ((exp === 'beginner_total' || exp === 'beginner_0_3m') && template.tier === 'classic') score += 2;
  if ((exp === 'advanced_1_3y' || exp === 'expert_3y_plus') && template.tier === 'standard') score += 1;
  const typePrefs = Array.isArray(answers?.exerciseTypePreferences) ? answers.exerciseTypePreferences : [];
  if (typePrefs.includes('cardio_endurance') && template.group === 'cardio') score += 3;
  if (typePrefs.includes('plyometrics') && template.group === 'cardio') score += 1;
  if (typePrefs.includes('isometric_core') && template.group === 'core') score += 3;
  if (typePrefs.includes('strength_compounds')) {
    score += template.tier === 'standard' ? 3 : 1;
    if (/traction|dips|pompe|squat|soulevé|rowing|développé|fente/.test(key)) score += 2;
  }
  score += (dayIndex + template.dbKey.length) % 3;
  if (globalTier === 'beginner' && template.tier === 'classic') score += 2;
  if (globalTier === 'advanced' && template.tier === 'standard') score += 1;

  const heritageBoosts = templateKeyBoosts || deformers?.templateKeyBoosts;
  if (Array.isArray(heritageBoosts) && heritageBoosts.includes(template.dbKey)) score += 5;

  const prefScores = deformers?.exercisePreferenceScore;
  if (prefScores) score += preferenceTieBreakDelta(template.dbKey, prefScores);

  return score;
}

export function pickExercisesForContext(answers, blueprint, {
  groups,
  count,
  site,
  dayIndex,
  usedKeys,
  modality = 'strength',
  weekUsedKeys,
  weekStrengthUsedKeys,
  deformers = null,
  globalTier = 'intermediate',
  templateKeyBoosts = null
}) {
  const quizEq = equipmentSet(answers);
  const strengthUsed = weekStrengthUsedKeys || weekUsedKeys;
  const pool = getMergedQuizExerciseTemplates();
  const filtered = pool.filter((t) =>
    templateMatches(t, { quizEq, site, modality, answers, weekUsedKeys })
  );

  const modalityFiltered =
    modality === 'cardio'
      ? filtered.filter((t) => isCardioAppropriateDbKey(t.dbKey))
      : filtered.filter((t) => isStrengthExerciseAllowed(t.dbKey, answers, modality));

  const rng = seededRng(`${site || 'main'}:${dayIndex}:${answers?.goalPhysique || ''}`);
  const eligible = modalityFiltered
    .filter((t) => {
      if (!groups.includes(t.group)) return false;
      if (usedKeys.has(t.dbKey)) return false;
      if (modality !== 'strength' || !strengthUsed) return true;
      const lastDay = strengthUsed.get(t.dbKey);
      if (lastDay == null) return true;
      return dayIndex - lastDay >= 2;
    });

  const eligibleCount = eligible.length;
  const scoreOpts = {
    eligibleCount,
    sessionUsedKeys: usedKeys,
    templateKeyBoosts: templateKeyBoosts || deformers?.templateKeyBoosts
  };

  const candidates = modalityFiltered
    .map((t) => ({
      t,
      score: Math.max(
        ...groups.map((g) =>
          scoreTemplate(t, answers, g, dayIndex, strengthUsed, deformers, globalTier, scoreOpts)
        )
      )
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const eligibleScored = eligible
    .map((t) => ({
      t,
      score: Math.max(
        ...groups.map((g) =>
          scoreTemplate(t, answers, g, dayIndex, strengthUsed, deformers, globalTier, scoreOpts)
        )
      )
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const weightedRows = pickWeightedTemplates(eligibleScored, count, rng);

  const picked = [];
  for (const row of weightedRows) {
    const ex = buildProgramExerciseFromDbKey(row.t.dbKey, answers, blueprint, {
      idSuffix: `_${site || 'main'}_${dayIndex}_${picked.length}`
    });
    if (!ex) continue;
    usedKeys.add(row.t.dbKey);
    picked.push(ex);
  }

  if (picked.length < count) {
    for (const row of candidates) {
      if (picked.length >= count) break;
      if (usedKeys.has(row.t.dbKey)) continue;
      const ex = buildProgramExerciseFromDbKey(row.t.dbKey, answers, blueprint, {
        idSuffix: `_${site || 'main'}_${dayIndex}_${picked.length}`
      });
      if (!ex) continue;
      usedKeys.add(row.t.dbKey);
      picked.push(ex);
    }
  }

  picked.forEach((ex) => {
    if (modality === 'strength' && ex.exerciseBankKey && strengthUsed) {
      strengthUsed.set(ex.exerciseBankKey, dayIndex);
    }
  });

  return picked;
}

const STREET_PILLAR_KEYS = ['tractions pronation', 'dips', 'pompes'];

function isCardioAppropriateDbKey(dbKey) {
  const k = String(dbKey || '').toLowerCase();
  if (/farmer|cosaque|soulevé de terre|presse à cuisses/.test(k) && !/course|fractionné|corde|burpee|mountain/.test(k)) {
    return false;
  }
  return /course|fractionné|fractionne|corde|burpee|mountain|endurance/.test(k);
}

function trimCardioSessionExercises(picked, weekUsedKeys, answers) {
  let fractionneUsed = false;
  if (weekUsedKeys) {
    weekUsedKeys.forEach((key) => {
      if (String(key).includes('fractionné') || String(key).includes('fractionne')) fractionneUsed = true;
    });
  }
  let efUsed = weekUsedKeys?.has?.('course endurance fondamentale');

  const out = [];
  picked.forEach((ex) => {
    const k = ex.exerciseBankKey || '';
    if (!isCardioAppropriateDbKey(k)) return;
    if (/fractionné|fractionne/.test(k)) {
      if (fractionneUsed) return;
      fractionneUsed = true;
      weekUsedKeys?.add(k);
    }
    if (k === 'course endurance fondamentale') {
      if (efUsed) return;
      efUsed = true;
      weekUsedKeys?.add(k);
    }
    out.push(ex);
  });

  const maxN = HYPERTROPHY_GOALS.has(answers?.goalPhysique) ? 3 : 5;
  return out.slice(0, maxN);
}

function resolveAvailableStreetPillars(answers) {
  const eq = equipmentSet(answers);
  const out = [];
  if (eq.includes('pullup_bar')) out.push('tractions pronation');
  if (eq.includes('dip_station') || eq.includes('parallel_bars')) out.push('dips');
  out.push('pompes');
  return out.filter((k) => exerciseDatabase[k]);
}

function injectWeeklyStreetPillarIfMissing(schedule, activeDayKeys, answers, blueprint) {
  const weekKeys = new Set();
  activeDayKeys.forEach((dayKey) => {
    (schedule[dayKey]?.exercises || []).forEach((ex) => {
      if (ex?.exerciseBankKey) weekKeys.add(ex.exerciseBankKey);
    });
  });
  if (STREET_PILLAR_KEYS.some((k) => weekKeys.has(k))) return;

  const pillars = resolveAvailableStreetPillars(answers);
  if (!pillars.length) return;

  const targetKey = pillars[0];
  for (const dayKey of activeDayKeys) {
    const day = schedule[dayKey];
    if (!day?.active) continue;
    const ex = buildProgramExerciseFromDbKey(targetKey, answers, blueprint, {
      idSuffix: `_week_pillar_${dayKey}`
    });
    if (!ex) continue;
    day.exercises = [ex, ...(day.exercises || [])];
    break;
  }
}

const PULL_ANCHOR_KEYS = ['tractions pronation', 'rowing haltère', 'tractions australiennes'];
const PUSH_ANCHOR_KEYS = ['pompes', 'dips', 'développé militaire'];

function filterAnchorsByEquipment(keys, answers) {
  const eq = equipmentSet(answers);
  return keys.filter((dbKey) => {
    if (!exerciseDatabase[dbKey]) return false;
    if (dbKey.includes('traction') && !eq.includes('pullup_bar')) return false;
    if (dbKey === 'dips' && !eq.includes('dip_station') && !eq.includes('parallel_bars')) return false;
    if (dbKey === 'développé militaire' && !eq.includes('dumbbells') && !eq.includes('barbell_plates')) {
      return false;
    }
    if (dbKey === 'rowing haltère' && !eq.includes('dumbbells')) return false;
    return true;
  });
}

/**
 * Ancres street / haltères : jour tirage vs jour poussée (évite traction+dips identiques deux fois).
 */
function ensureStreetAnchorsForProfile(
  picked,
  answers,
  blueprint,
  groups,
  dayIndex,
  usedKeys,
  weekStrengthUsedKeys,
  anchorFocusOverride = null
) {
  if (!groups.includes('upper')) return picked;

  const have = new Set(picked.map((e) => e.exerciseBankKey));
  const focus = anchorFocusOverride ?? (dayIndex % 2 === 0 ? 'pull' : 'push');
  const planKeys =
    focus === 'pull'
      ? filterAnchorsByEquipment(PULL_ANCHOR_KEYS, answers)
      : filterAnchorsByEquipment(PUSH_ANCHOR_KEYS, answers);

  const injected = [];
  planKeys.forEach((dbKey, i) => {
    if (have.has(dbKey) || usedKeys.has(dbKey)) return;
    const lastDay = weekStrengthUsedKeys?.get?.(dbKey);
    if (lastDay != null && lastDay !== dayIndex && dayIndex - lastDay < 2) return;
    const ex = buildProgramExerciseFromDbKey(dbKey, answers, blueprint, {
      idSuffix: `_anchor_${dayIndex}_${i}`
    });
    if (!ex) return;
    usedKeys.add(dbKey);
    have.add(dbKey);
    injected.push(ex);
    weekStrengthUsedKeys?.set?.(dbKey, dayIndex);
  });

  if (!injected.length) return picked;
  return [...injected, ...picked];
}

const LOWER_FILL_KEYS = ['squat gobelet', 'fentes', 'squat cosaque'];

function ensureMinimumStrengthExercises(
  picked,
  answers,
  blueprint,
  profile,
  dayIndex,
  usedKeys,
  weekStrengthUsedKeys,
  coachContext,
  targetCount
) {
  if (profile?.modality === 'cardio') return picked;
  const min =
    HYPERTROPHY_GOALS.has(answers?.goalPhysique) ? Math.max(5, targetCount) : Math.max(4, targetCount);
  if (picked.length >= min) return picked;

  const groups = (profile?.groups || ['upper']).filter((g) => g !== 'cardio');
  let out = [...picked];
  let guard = 0;
  while (out.length < min && guard < 12) {
    guard += 1;
    const extra = pickExercisesForContext(answers, blueprint, {
      groups,
      count: 1,
      site: profile?.site,
      dayIndex: dayIndex + guard * 3,
      usedKeys,
      modality: 'strength',
      weekUsedKeys: null,
      weekStrengthUsedKeys,
      deformers: coachContext?.deformers,
      globalTier: effectiveStrengthTier(answers)
    });
    if (!extra.length) {
      if (groups.includes('lower')) {
        for (const dbKey of LOWER_FILL_KEYS) {
          if (usedKeys.has(dbKey)) continue;
          const ex = buildProgramExerciseFromDbKey(dbKey, answers, blueprint, {
            idSuffix: `_fill_${dayIndex}_${guard}`
          });
          if (ex) {
            usedKeys.add(dbKey);
            out.push(ex);
            break;
          }
        }
      }
      continue;
    }
    out.push(...extra);
  }
  return out;
}

function planCardioSessionExercises(answers, blueprint, profile, dayIndex, weekUsedKeys, count) {
  const site = profile?.site || 'outdoor';
  const usedKeys = new Set();
  const groups = ['cardio'];
  let picked = pickExercisesForContext(answers, blueprint, {
    groups,
    count: Math.max(4, count),
    site,
    dayIndex,
    usedKeys,
    modality: 'cardio',
    weekUsedKeys
  });

  if (picked.length < 3) {
    const fallbackSite = site === 'track' ? 'outdoor' : site;
    const extra = pickExercisesForContext(answers, blueprint, {
      groups,
      count: 4,
      site: fallbackSite,
      dayIndex: dayIndex + 20,
      usedKeys,
      modality: 'cardio',
      weekUsedKeys: null
    });
    const seen = new Set(picked.map((e) => e.exerciseBankKey));
    extra.forEach((ex) => {
      if (!seen.has(ex.exerciseBankKey) && picked.length < Math.max(4, count)) {
        picked.push(ex);
        seen.add(ex.exerciseBankKey);
      }
    });
  }

  if (picked.length < 2) {
    ['burpees', 'mountain climbers', 'corde à sauter', 'course endurance fondamentale'].forEach((dbKey, i) => {
      if (picked.length >= 4) return;
      const ex = buildProgramExerciseFromDbKey(dbKey, answers, blueprint, {
        idSuffix: `_cardio_fb_${dayIndex}_${i}`
      });
      if (ex) picked.push(ex);
    });
  }

  return trimCardioSessionExercises(picked, weekUsedKeys, answers);
}

function planCardioAddonBlock(answers, blueprint, profile, dayIndex, usedKeys, weekUsedKeys) {
  const addonCount = profile?.cardioAddon ? 2 : 0;
  if (!addonCount) return [];
  const site = profile.site || 'home_minimal';
  const groups = ['cardio'];
  const picked = pickExercisesForContext(answers, blueprint, {
    groups,
    count: addonCount,
    site,
    dayIndex: dayIndex + 50,
    usedKeys,
    modality: 'cardio',
    weekUsedKeys
  });
  return picked.map((ex) => ({
    ...ex,
    type: ex.type || 'cardio_addon',
    notes: [`Bloc cardio +${addonMinutes(answers)} min (quiz).`, ex.notes].filter(Boolean).join(' ')
  }));
}

export function planMainSessionExercises(
  answers,
  blueprint,
  dayIndex,
  profile,
  weekUsedKeys,
  weekStrengthUsedKeys,
  coachContext = null
) {
  const deformers = coachContext?.deformers;
  let count = parseExerciseCountHint(blueprint, answers);
  if (deformers?.maxExercisesPerSession != null) {
    count = Math.min(count, deformers.maxExercisesPerSession);
  }
  if (deformers?.volumeMul != null && deformers.volumeMul !== 1) {
    count = Math.max(3, Math.round(count * deformers.volumeMul));
  }
  const globalTier = effectiveStrengthTier(answers);
  const modality = profile?.modality || 'strength';
  const site = profile?.site ?? null;
  const usedKeys = new Set();

  const blockFilled = fillSessionFromProfileBlocks(
    answers,
    blueprint,
    dayIndex,
    profile,
    weekUsedKeys,
    weekStrengthUsedKeys,
    coachContext,
    {
      pickExercisesForContext,
      buildProgramExerciseFromDbKey
    }
  );
  if (blockFilled !== null) {
    let picked = blockFilled;
    picked = ensureMinimumStrengthExercises(
      picked,
      answers,
      blueprint,
      profile,
      dayIndex,
      usedKeys,
      weekStrengthUsedKeys,
      coachContext,
      count
    );
    picked = trimExercisesToSessionBudget(picked, answers);
    picked = trimExercisesForTendonLoad(picked, deformers);
    const patterns = coachContext?.trainingEvidence?.referencedProgramAnalysis?.exercisePatterns;
    if (patterns?.length) {
      picked = picked.map((ex) => calibrateSeriesFromProgramPatterns(ex, patterns));
    }
    picked = finalizeSessionForDurationBudget(picked, answers, {
      coachContext,
      profile,
      blueprint,
      dayIndex,
      weekIndex: 1,
      weekUsedKeys,
      weekStrengthUsedKeys,
      deps: { pickExercisesForContext, buildProgramExerciseFromDbKey }
    });
    if (profile?.cardioAddon) {
      const addon = planCardioAddonBlock(answers, blueprint, profile, dayIndex, usedKeys, weekUsedKeys);
      picked = [...picked, ...addon];
    }
    return picked;
  }

  if (modality === 'cardio') {
    return planCardioSessionExercises(answers, blueprint, profile, dayIndex, weekUsedKeys, count);
  }

  const strengthGroups = (profile?.groups || groupTargetsFromQuiz(answers)).filter((g) => g !== 'cardio');
  const groups = strengthGroups.length ? strengthGroups : ['upper', 'lower'];

  let picked = pickExercisesForContext(answers, blueprint, {
    groups,
    count,
    site,
    dayIndex,
    usedKeys,
    modality: 'strength',
    weekUsedKeys,
    weekStrengthUsedKeys,
    deformers,
    globalTier,
    templateKeyBoosts: deformers?.templateKeyBoosts
  });
  const anchorFocus =
    profile?.blocks?.length > 0
      ? (() => {
          const b = profile.blocks;
          if (b.includes('force_pull')) return 'pull';
          if (b.includes('force_push')) return 'push';
          return null;
        })()
      : null;
  picked = ensureStreetAnchorsForProfile(
    picked,
    answers,
    blueprint,
    groups,
    dayIndex,
    usedKeys,
    weekStrengthUsedKeys,
    anchorFocus
  );
  picked = ensureMinimumStrengthExercises(
    picked,
    answers,
    blueprint,
    profile,
    dayIndex,
    usedKeys,
    weekStrengthUsedKeys,
    coachContext,
    count
  );
  picked = trimExercisesToSessionBudget(picked, answers);
  picked = trimExercisesForTendonLoad(picked, deformers);

  const patterns = coachContext?.trainingEvidence?.referencedProgramAnalysis?.exercisePatterns;
  if (patterns?.length) {
    picked = picked.map((ex) => calibrateSeriesFromProgramPatterns(ex, patterns));
  }

  picked = enforceSessionExerciseLimits(picked, deformers, profile);
  picked = ensureMinimumStrengthExercises(
    picked,
    answers,
    blueprint,
    profile,
    dayIndex,
    usedKeys,
    weekStrengthUsedKeys,
    coachContext,
    count
  );
  picked = finalizeSessionForDurationBudget(picked, answers, {
    coachContext,
    profile,
    blueprint,
    dayIndex,
    weekIndex: 1,
    deps: { pickExercisesForContext, buildProgramExerciseFromDbKey }
  });

  if (profile?.cardioAddon) {
    const addon = planCardioAddonBlock(answers, blueprint, profile, dayIndex, usedKeys, weekUsedKeys);
    picked = [...picked, ...addon];
  }

  return picked;
}

export function planVariantExercises(answers, blueprint, site, weekKey, dayIndex, profile) {
  const count = Math.max(3, Math.min(6, parseExerciseCountHint(blueprint, answers) - 1));
  const strengthGroups = (profile?.groups || groupTargetsFromQuiz(answers)).filter((g) => g !== 'cardio');
  const groups = strengthGroups.length ? strengthGroups : ['upper', 'lower'];
  const usedKeys = new Set();
  return pickExercisesForContext(answers, blueprint, {
    groups,
    count,
    site,
    dayIndex: dayIndex + (weekKey === 'semaineB' ? 7 : 0),
    usedKeys,
    modality: 'strength'
  });
}

export function stripSalleVariantsFromSchedule(schedule) {
  if (!schedule || typeof schedule !== 'object') return;
  for (const dayKey of Object.keys(schedule)) {
    const day = schedule[dayKey];
    if (!day || typeof day !== 'object') continue;
    const { salleVariants, ...rest } = day;
    schedule[dayKey] = rest;
  }
}

export function injectQuizExercisePlan(schedule, answers, activeDayKeys, weekProfiles, coachOpts = {}) {
  const coachContext = coachOpts.coachContext || null;
  const baseBlueprint = buildQuizTrainingSessionBlueprint(answers);
  const overrideRange = coachContext?.deformers?.repRangeOverride;
  const blueprint =
    overrideRange && typeof overrideRange === 'string'
      ? { ...baseBlueprint, repRange: overrideRange }
      : baseBlueprint;
  const alternation = resolveAlternationSites(answers);
  const profiles = weekProfiles || planWeekSessionProfiles(activeDayKeys, answers, coachContext);
  const weekUsedKeys = new Set();
  /** dbKey → dernier dayIndex force (répétition autorisée tous les 2+ jours). */
  const weekStrengthUsedKeys = new Map();

  if (!alternation) {
    stripSalleVariantsFromSchedule(schedule);
  }

  activeDayKeys.forEach((dayKey, dayIndex) => {
    const slot = schedule[dayKey];
    if (!slot?.active) return;

    const profile = profiles[dayKey] || null;
    const existing = Array.isArray(slot.exercises)
      ? slot.exercises.filter((ex) => !String(ex.id).startsWith('quiz_base_'))
      : [];
    const planned = planMainSessionExercises(
      answers,
      blueprint,
      dayIndex,
      profile,
      weekUsedKeys,
      weekStrengthUsedKeys,
      coachContext
    );
    slot.exercises = [...existing, ...planned];
    slot.quizSessionProfile = profile;
    if (coachContext?.generationMode) {
      slot.quizCoachMode = coachContext.generationMode;
    }

    if (!alternation || profile?.modality === 'cardio') return;

    if (!slot.salleVariants) {
      slot.salleVariants = {
        semaineA: { name: '', exercises: [] },
        semaineB: { name: '', exercises: [] }
      };
    }

    const labelA = SITE_LABELS[alternation.weekA] || alternation.weekA;
    const labelB = SITE_LABELS[alternation.weekB] || alternation.weekB;
    slot.salleVariants.semaineA = {
      name: `Semaine A — ${labelA}`,
      exercises: planVariantExercises(
        answers,
        blueprint,
        alternation.weekA,
        'semaineA',
        dayIndex,
        profile
      )
    };
    slot.salleVariants.semaineB = {
      name: `Semaine B — ${labelB}`,
      exercises: planVariantExercises(
        answers,
        blueprint,
        alternation.weekB,
        'semaineB',
        dayIndex,
        profile
      )
    };
  });

  injectWeeklyStreetPillarIfMissing(schedule, activeDayKeys, answers, blueprint);

  activeDayKeys.forEach((dayKey) => {
    const slot = schedule[dayKey];
    if (!slot?.active || !Array.isArray(slot.exercises) || !slot.exercises.length) return;
    slot.duration = formatEstimatedSessionDuration(slot.exercises, answers);
  });
}
