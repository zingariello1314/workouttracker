/**
 * Sélection d'exercices réels (banque) pour programmes générés depuis le quiz.
 */

import { exerciseDatabase } from '../../data/exerciseDatabase';
import { buildQuizTrainingSessionBlueprint } from './quizInfluence';
import {
  resolveTargetExerciseCount,
  trimExercisesToSessionBudget
} from './quizSessionDurationBudget';
import { addonMinutes, planWeekSessionProfiles } from './quizSessionPlanner';

export { planWeekSessionProfiles };

const SITE_LABELS = {
  commercial_gym: 'Salle commerciale',
  home_gym: 'Salle à domicile',
  home_minimal: 'Domicile',
  outdoor: 'Extérieur / parc',
  track: 'Piste'
};

/** Templates : clé banque + métadonnées de sélection. */
const EXERCISE_TEMPLATES = [
  { dbKey: 'pompes', group: 'upper', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym'] },
  { dbKey: 'tractions pronation', group: 'upper', tier: 'classic', quizEquipment: ['pullup_bar', 'bodyweight'], locations: ['commercial_gym', 'home_gym', 'outdoor'] },
  { dbKey: 'tractions australiennes', group: 'upper', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['outdoor', 'home_gym', 'commercial_gym'], needsLowBar: true },
  { dbKey: 'dips', group: 'upper', tier: 'classic', quizEquipment: ['dip_station', 'parallel_bars', 'bodyweight'], locations: ['commercial_gym', 'outdoor', 'home_gym'] },
  { dbKey: 'développé couché', group: 'upper', tier: 'standard', quizEquipment: ['barbell_plates', 'bench'], locations: ['commercial_gym', 'home_gym'] },
  { dbKey: 'rowing barre', group: 'upper', tier: 'standard', quizEquipment: ['barbell_plates'], locations: ['commercial_gym', 'home_gym'] },
  { dbKey: 'rowing haltère', group: 'upper', tier: 'standard', quizEquipment: ['dumbbells', 'bench'], locations: ['commercial_gym', 'home_gym', 'home_minimal'] },
  { dbKey: 'tirage vertical', group: 'upper', tier: 'standard', quizEquipment: ['cable_machine'], locations: ['commercial_gym'] },
  { dbKey: 'développé militaire', group: 'upper', tier: 'standard', quizEquipment: ['barbell_plates', 'dumbbells'], locations: ['commercial_gym', 'home_gym'] },
  { dbKey: 'squat', group: 'lower', tier: 'classic', quizEquipment: ['barbell_plates', 'squat_rack'], locations: ['commercial_gym', 'home_gym'] },
  { dbKey: 'squat gobelet', group: 'lower', tier: 'classic', quizEquipment: ['dumbbells', 'kettlebells', 'bodyweight'], locations: ['home_minimal', 'home_gym', 'commercial_gym'] },
  { dbKey: 'fentes', group: 'lower', tier: 'classic', quizEquipment: ['dumbbells', 'bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym'] },
  { dbKey: 'soulevé de terre', group: 'lower', tier: 'standard', quizEquipment: ['barbell_plates'], locations: ['commercial_gym', 'home_gym'] },
  { dbKey: 'presse à cuisses', group: 'lower', tier: 'standard', quizEquipment: ['bench'], locations: ['commercial_gym'] },
  { dbKey: 'gainage', group: 'core', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym', 'track'] },
  { dbKey: 'gainage latéral', group: 'core', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym'] },
  { dbKey: 'course endurance fondamentale', group: 'cardio', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['outdoor', 'track', 'commercial_gym'] },
  { dbKey: 'corde à sauter', group: 'cardio', tier: 'classic', quizEquipment: ['jump_rope'], locations: ['home_minimal', 'outdoor', 'home_gym', 'commercial_gym'] },
  { dbKey: 'burpees', group: 'cardio', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym'] },
  { dbKey: 'mountain climbers', group: 'cardio', tier: 'classic', quizEquipment: ['bodyweight'], locations: ['home_minimal', 'outdoor', 'home_gym'] }
];

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
  const eq = Array.isArray(answers?.availableEquipment) ? [...answers.availableEquipment] : [];
  if (!eq.includes('bodyweight')) eq.push('bodyweight');
  return eq;
}

function hasPullupBar(answers) {
  const eq = equipmentSet(answers);
  return eq.includes('pullup_bar');
}

function hasLowBarOrOutdoor(site) {
  return site === 'outdoor' || site === 'home_gym' || site === 'commercial_gym';
}

function templateMatches(template, { quizEq, site, modality, answers, weekUsedKeys }) {
  if (!exerciseDatabase[template.dbKey]) return false;
  if (site && template.locations.length && !template.locations.includes(site)) return false;
  if (!template.quizEquipment.some((e) => quizEq.includes(e))) return false;

  if (modality === 'cardio' && template.group !== 'cardio') return false;
  if (modality === 'strength' && template.group === 'cardio') return false;
  if (modality === 'strength_plus_cardio' && template.group === 'cardio') return false;

  if (template.dbKey === 'course endurance fondamentale') {
    if (modality !== 'cardio') return false;
    if (weekUsedKeys?.has('course endurance fondamentale')) return false;
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

function buildSeriesForExercise(dbKey, blueprint, category) {
  const use4 = String(blueprint?.setsHint || '').includes('4');
  const repRange = String(blueprint?.repRange || '8–12');
  if (category === 'cardio') {
    if (dbKey.includes('course')) return '1×20–35 min';
    if (dbKey.includes('corde')) return '6×(30 s / 30 s)';
    if (dbKey.includes('burpee')) return '4×8';
    return '3×3 min';
  }
  if (dbKey.includes('gainage')) return '3×30–45 sec';
  if (repRange.includes('4–8')) return use4 ? '4×5' : '3×5';
  if (repRange.includes('12–20')) return use4 ? '4×15' : '3×15';
  return use4 ? '4×8-10' : '3×8-12';
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
    series: buildSeriesForExercise(dbKey, blueprint, category),
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

function scoreTemplate(template, answers, group, dayIndex) {
  const goal = answers?.goalPhysique || 'balanced_functional';
  const boosts = GOAL_GROUP_BOOST[goal] || GOAL_GROUP_BOOST.balanced_functional;
  let score = boosts[template.group] ?? 0;
  if (template.group === group) score += 5;
  if (template.tier === 'classic') score += 2;
  const exp = answers?.experienceLevel;
  if ((exp === 'beginner_total' || exp === 'beginner_0_3m') && template.tier === 'classic') score += 2;
  if ((exp === 'advanced_1_3y' || exp === 'expert_3y_plus') && template.tier === 'standard') score += 1;
  const typePrefs = Array.isArray(answers?.exerciseTypePreferences) ? answers.exerciseTypePreferences : [];
  if (typePrefs.includes('cardio_endurance') && template.group === 'cardio') score += 3;
  if (typePrefs.includes('plyometrics') && template.group === 'cardio') score += 1;
  if (typePrefs.includes('isometric_core') && template.group === 'core') score += 3;
  if (typePrefs.includes('strength_compounds') && template.tier === 'standard') score += 1;
  score += (dayIndex + template.dbKey.length) % 3;
  return score;
}

function pickExercisesForContext(answers, blueprint, {
  groups,
  count,
  site,
  dayIndex,
  usedKeys,
  modality = 'strength',
  weekUsedKeys
}) {
  const quizEq = equipmentSet(answers);
  const candidates = EXERCISE_TEMPLATES.filter((t) =>
    templateMatches(t, { quizEq, site, modality, answers, weekUsedKeys })
  )
    .map((t) => ({ t, score: Math.max(...groups.map((g) => scoreTemplate(t, answers, g, dayIndex))) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score);

  const rng = seededRng(`${site || 'main'}:${dayIndex}:${answers?.goalPhysique || ''}`);
  const eligible = candidates.filter(
    (row) => !usedKeys.has(row.t.dbKey) && groups.includes(row.t.group)
  );
  const weightedRows = pickWeightedTemplates(eligible, count, rng);

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

  return picked;
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

export function planMainSessionExercises(answers, blueprint, dayIndex, profile, weekUsedKeys) {
  const count = parseExerciseCountHint(blueprint, answers);
  const modality = profile?.modality || 'strength';
  const site = profile?.site ?? null;
  const usedKeys = new Set();

  if (modality === 'cardio') {
    const groups = ['cardio'];
    const picked = pickExercisesForContext(answers, blueprint, {
      groups,
      count,
      site,
      dayIndex,
      usedKeys,
      modality: 'cardio',
      weekUsedKeys
    });
    picked.forEach((ex) => {
      if (ex.exerciseBankKey === 'course endurance fondamentale') {
        weekUsedKeys?.add('course endurance fondamentale');
      }
    });
    return trimExercisesToSessionBudget(picked, answers);
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
    weekUsedKeys
  });
  picked = trimExercisesToSessionBudget(picked, answers);

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

export function injectQuizExercisePlan(schedule, answers, activeDayKeys, weekProfiles) {
  const blueprint = buildQuizTrainingSessionBlueprint(answers);
  const alternation = resolveAlternationSites(answers);
  const profiles = weekProfiles || planWeekSessionProfiles(activeDayKeys, answers);
  const weekUsedKeys = new Set();

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
    const planned = planMainSessionExercises(answers, blueprint, dayIndex, profile, weekUsedKeys);
    slot.exercises = [...existing, ...planned];
    slot.quizSessionProfile = profile;

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
}
