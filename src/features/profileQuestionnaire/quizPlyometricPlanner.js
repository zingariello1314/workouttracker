/**
 * Pliométrie : bloc complémentaire (`day.pliometrie`), jamais dans `exercises`.
 * Placement coordonné avec le cardio du jour (réponses quiz).
 */

import { stretchDatabase } from '../../data/stretchDatabase';
import { shouldInjectPlyometricsFromQuiz } from './quizInfluence';
import { QUIZ_SCHEDULE_DAY_ORDER } from './trainingScheduleFromQuiz';

const PLACEMENT_LABELS = {
  avant_cardio: 'Avant le bloc cardio',
  apres_cardio: 'Après le bloc cardio',
  fin_seance: 'En fin de séance (après la musculation)'
};

/** Clés banque pliométrie par difficulté croissante. */
const PLIO_KEYS_BY_LEVEL = {
  beginner: [
    'pliometrie_sauts_sur_place_debutant',
    'pliometrie_sauts_lateraux_ligne',
    'pliometrie_pogo_jumps'
  ],
  intermediate: [
    'pliometrie_squat_jumps_controles',
    'pliometrie_skater_jumps',
    'pliometrie_fentes_sautes_alternees',
    'pliometrie_box_jump_bas'
  ],
  advanced: [
    'pliometrie_bounds_alternes',
    'pliometrie_depth_jump_rebond',
    'pliometrie_tuck_jumps',
    'pliometrie_broad_jump'
  ]
};

function levelFromExperience(experienceLevel) {
  if (experienceLevel === 'beginner_total' || experienceLevel === 'beginner_0_3m') return 'beginner';
  if (experienceLevel === 'intermediate_3_12m') return 'intermediate';
  return 'advanced';
}

function maxDifficultyForUser(answers) {
  const lvl = levelFromExperience(answers?.experienceLevel);
  let max = lvl === 'beginner' ? 2 : lvl === 'intermediate' ? 3 : 4;
  const cardio = answers?.cardioTrainingDesire;
  if (cardio === 'minimal') max = Math.max(1, max - 1);
  if (cardio === 'priority_hiit' || answers?.goalPhysique === 'athletic_performance') {
    max = Math.min(4, max + 1);
  }
  if (answers?.experienceLevel === 'beginner_total') max = Math.min(max, 2);
  return max;
}

function pickPlyoKeys(answers, count) {
  const lvl = levelFromExperience(answers?.experienceLevel);
  const maxDiff = maxDifficultyForUser(answers);
  const pools = [
    ...(PLIO_KEYS_BY_LEVEL.beginner || []),
    ...(lvl !== 'beginner' ? PLIO_KEYS_BY_LEVEL.intermediate || [] : []),
    ...(lvl === 'advanced' ? PLIO_KEYS_BY_LEVEL.advanced || [] : [])
  ];
  const eligible = pools.filter((key) => {
    const entry = stretchDatabase[key];
    return entry && (entry.difficulty || 2) <= maxDiff;
  });
  const unique = [...new Set(eligible)];
  const out = [];
  for (let i = 0; i < count && i < unique.length; i += 1) {
    const idx = Math.round((i * (unique.length - 1)) / Math.max(1, count - 1));
    const key = unique[idx];
    if (key && !out.includes(key)) out.push(key);
  }
  let cursor = 0;
  while (out.length < count && cursor < unique.length) {
    if (!out.includes(unique[cursor])) out.push(unique[cursor]);
    cursor += 1;
  }
  return out.slice(0, count);
}

/**
 * Où placer le bloc par rapport au cardio :
 * - débutant / faible tolérance → fin de séance (moins de fatigue avant le travail principal)
 * - performance / HIIT → avant cardio (activation neuromusculaire)
 * - cardio modéré sur jour avec course → avant ou après selon objectif endurance
 */
export function resolvePlyometricPlacement(answers, dayHasCardio) {
  const lvl = levelFromExperience(answers?.experienceLevel);
  const cardio = answers?.cardioTrainingDesire;
  const goal = answers?.goalPhysique;
  const typePrefs = Array.isArray(answers?.exerciseTypePreferences) ? answers.exerciseTypePreferences : [];

  if (lvl === 'beginner' || cardio === 'minimal') {
    return dayHasCardio ? 'apres_cardio' : 'fin_seance';
  }
  if (
    goal === 'athletic_performance' ||
    cardio === 'priority_hiit' ||
    typePrefs.includes('plyometrics')
  ) {
    return dayHasCardio ? 'avant_cardio' : 'fin_seance';
  }
  if (goal === 'endurance_lean' && dayHasCardio) {
    return 'avant_cardio';
  }
  if (cardio === 'high') {
    return dayHasCardio ? 'apres_cardio' : 'fin_seance';
  }
  return dayHasCardio ? 'apres_cardio' : 'fin_seance';
}

function resolvePlyoDaysCount(answers, activeDayCount) {
  const lvl = levelFromExperience(answers?.experienceLevel);
  const cardio = answers?.cardioTrainingDesire;
  const typePrefs = Array.isArray(answers?.exerciseTypePreferences) ? answers.exerciseTypePreferences : [];
  let days = 1;
  if (lvl === 'intermediate') days = 2;
  if (lvl === 'advanced') days = 2;
  if (cardio === 'high' || cardio === 'priority_hiit') days = Math.min(3, days + 1);
  if (typePrefs.includes('plyometrics')) days = Math.min(3, days + 1);
  if (cardio === 'minimal') days = 1;
  if (lvl === 'beginner') days = 1;
  return Math.min(activeDayCount, Math.max(1, days));
}

function resolvePlyoItemsPerDay(answers) {
  const lvl = levelFromExperience(answers?.experienceLevel);
  const typePrefs = Array.isArray(answers?.exerciseTypePreferences) ? answers.exerciseTypePreferences : [];
  let n = lvl === 'beginner' ? 2 : lvl === 'intermediate' ? 3 : 3;
  if (typePrefs.includes('plyometrics')) n += 1;
  if (answers?.cardioTrainingDesire === 'priority_hiit') n += 1;
  if (answers?.cardioTrainingDesire === 'minimal') n = Math.max(2, n - 1);
  return Math.min(4, Math.max(2, n));
}

function dayHasCardioBlock(day) {
  const exercises = Array.isArray(day?.exercises) ? day.exercises : [];
  return exercises.some((ex) => {
    const n = `${ex?.name || ''} ${ex?.exerciseBankKey || ''}`.toLowerCase();
    return (
      ex?.programCategory === 'cardio' ||
      ex?.type === 'cardio' ||
      n.includes('course') ||
      n.includes('corde') ||
      n.includes('burpee') ||
      n.includes('fractionné') ||
      n.includes('endurance')
    );
  });
}

function formatPlyoSeries(entry, lvl) {
  const sec = Math.max(15, Math.min(60, Number(entry?.defaultDuration) || 40));
  const diff = Number(entry?.difficulty) || 2;
  const sets = lvl === 'beginner' ? 2 : diff <= 2 ? 3 : 4;
  if (diff <= 1) return `${sets}×${sec} sec`;
  if (diff <= 2) return `${sets}×${Math.min(10, Math.round(sec / 4))} reps`;
  return `${sets}×${Math.min(8, Math.max(5, Math.round(sec / 5)))} reps`;
}

function buildPlyoItem(stretchKey, dayKey, index, answers) {
  const entry = stretchDatabase[stretchKey];
  if (!entry) return null;
  const lvl = levelFromExperience(answers?.experienceLevel);
  const diff = Number(entry.difficulty) || 2;
  return {
    id: `quiz_plyo_${dayKey}_${index}_${stretchKey}`,
    stretchKey,
    name: entry.name,
    series: formatPlyoSeries(entry, lvl),
    duration: entry.defaultDuration || 45,
    rest: diff <= 1 ? 45 : diff <= 2 ? 55 : diff <= 3 ? 70 : 90,
    instructions: (entry.instructions || entry.description || '').slice(0, 280),
    difficulty: diff
  };
}

function rankDaysForPlyo(schedule, activeDays) {
  return activeDays
    .map((dayKey) => {
      const day = schedule[dayKey];
      const cardio = dayHasCardioBlock(day);
      const exCount = Array.isArray(day?.exercises) ? day.exercises.length : 0;
      return { dayKey, score: (cardio ? 10 : 0) + exCount };
    })
    .sort((a, b) => b.score - a.score)
    .map((r) => r.dayKey);
}

/**
 * Injecte `day.pliometrie` sur les jours pertinents (après le plan d'exercices principal).
 */
export function injectQuizPlyometricsIntoSchedule(schedule, answers) {
  if (!shouldInjectPlyometricsFromQuiz(answers)) return schedule;
  const activeDays = QUIZ_SCHEDULE_DAY_ORDER.filter((d) => schedule?.[d]?.active);
  if (!activeDays.length) return schedule;

  const dayCount = resolvePlyoDaysCount(answers, activeDays.length);
  const itemCount = resolvePlyoItemsPerDay(answers);
  const ranked = rankDaysForPlyo(schedule, activeDays).slice(0, dayCount);

  ranked.forEach((dayKey, dayIdx) => {
    const day = schedule[dayKey];
    if (!day) return;
    const hasCardio = dayHasCardioBlock(day);
    const placement = resolvePlyometricPlacement(answers, hasCardio);
    const keys = pickPlyoKeys(answers, itemCount);
    const items = keys
      .map((key, i) => buildPlyoItem(key, dayKey, dayIdx * 10 + i, answers))
      .filter(Boolean);

    day.pliometrie = {
      placement,
      placementLabel: PLACEMENT_LABELS[placement] || PLACEMENT_LABELS.fin_seance,
      items
    };
  });

  return schedule;
}

export function scheduleHasPlyometrics(schedule) {
  if (!schedule || typeof schedule !== 'object') return false;
  return Object.values(schedule).some(
    (d) => d?.active && Array.isArray(d?.pliometrie?.items) && d.pliometrie.items.length > 0
  );
}
