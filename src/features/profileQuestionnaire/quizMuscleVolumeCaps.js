/**
 * Caps de volume hebdo par grande famille (pull / push / legs / core) — dynamiques (SPEC §6.1).
 */

import { aggregateCheckedRepsByDateAndExerciseId } from '../../utils/trainingLoadUtils';
import { parseQuizExerciseBankKey, resolveFineMuscleFromExerciseRef } from './quizFineMuscleResolve';
import { exerciseDatabase } from '../../data/exerciseDatabase';

/** @typedef {'pull'|'push'|'legs'|'core'} CoachMuscleFamily */

const BASE_CAPS = { pull: 14, push: 14, legs: 14, core: 8 };
const FLOOR_CAPS = { pull: 8, push: 8, legs: 10, core: 4 };
const CEILING_CAPS = { pull: 18, push: 20, legs: 18, core: 12 };

/** Patterns pour répartir upper en pull vs push selon le nom / clé banque. */
function resolveUpperFamily(nameOrKey) {
  const s = String(nameOrKey || '').toLowerCase();
  if (
    /traction|pull|rowing|chin|australien|tirage|dos/.test(s) &&
    !/développé|press|pompe|dip|chest|bench/.test(s)
  ) {
    return 'pull';
  }
  if (/pompe|dip|développé|press|bench|épaule|militaire|push/.test(s)) return 'push';
  return 'push';
}

function recoveryMultiplier(recoveryScore) {
  const s = Number(recoveryScore) || 70;
  if (s < 38) return 0.72;
  if (s < 48) return 0.82;
  if (s < 58) return 0.92;
  if (s >= 78) return 1.08;
  if (s >= 68) return 1.02;
  return 1;
}

function frequencyMultiplier(activeDaysPerWeek) {
  const n = Number(activeDaysPerWeek) || 4;
  if (n < 3) return 0.9;
  if (n >= 6) return 1.05;
  if (n >= 5) return 1.03;
  return 1;
}

function experienceCeiling(answers) {
  const e = answers?.experienceLevel;
  if (e === 'beginner_total' || e === 'beginner_0_3m') return 0.92;
  if (e === 'expert_3y_plus') return 1.08;
  if (e === 'advanced_1_3y') return 1.04;
  return 1;
}

/**
 * @param {object} answers
 * @param {number} recoveryScore
 * @param {number} activeDaysPerWeek
 */
export function computeWeeklyMuscleCaps(answers, recoveryScore, activeDaysPerWeek, globalLoadFactor = 1) {
  const rec = recoveryMultiplier(recoveryScore);
  const freq = frequencyMultiplier(activeDaysPerWeek);
  const exp = experienceCeiling(answers);
  const g = Number(globalLoadFactor) || 1;
  const caps = {};
  (Object.keys(BASE_CAPS)).forEach((fam) => {
    let cap = BASE_CAPS[fam] * rec * freq * exp * g;
    const ceiling = CEILING_CAPS[fam] * (g > 1 ? Math.min(1.12, g) : 1);
    cap = Math.max(FLOOR_CAPS[fam], Math.min(ceiling, Math.round(cap * 10) / 10));
    caps[fam] = cap;
  });
  return caps;
}

/**
 * Sets effectifs estimés sur 28 j → équivalent hebdo (÷4).
 */
export function aggregateHistoricalWeeklySetsByFamily(snapshot, startYmd, endYmd, getExerciseNameById) {
  const grouped = aggregateCheckedRepsByDateAndExerciseId(snapshot?.reps, snapshot?.checkedExercises);
  const totals = { pull: 0, push: 0, legs: 0, core: 0 };

  grouped.forEach(({ reps }, gkey) => {
    const dateStr = gkey.slice(0, 10);
    if (dateStr < startYmd || dateStr > endYmd) return;
    const exerciseId = gkey.slice(11);
    const repsN = Number(reps) || 0;
    if (repsN <= 0) return;
    const sets = Math.max(1, Math.round(repsN / 8));

    let name = '';
    if (typeof getExerciseNameById === 'function') {
      name = getExerciseNameById(exerciseId) || '';
    }
    const bankKey = parseQuizExerciseBankKey(exerciseId);
    if (bankKey && exerciseDatabase[bankKey]) {
      name = exerciseDatabase[bankKey].name || bankKey;
    }
    if (!name && exerciseId.startsWith('db_')) {
      const keyGuess = exerciseId.replace(/^db_/, '').replace(/_/g, ' ');
      const hit = Object.keys(exerciseDatabase).find(
        (k) => k.toLowerCase().replace(/\s+/g, ' ') === keyGuess.toLowerCase()
      );
      if (hit) name = exerciseDatabase[hit]?.name || hit;
    }

    const fine = resolveFineMuscleFromExerciseRef(exerciseId, name, getExerciseNameById);
    let fam = fine === 'core' ? 'core' : resolveUpperFamily(name || exerciseId);
    if (fine === 'back' || fine === 'biceps') fam = 'pull';
    if (fine === 'chest' || fine === 'shoulders' || fine === 'triceps') fam = 'push';
    if (fine === 'quads' || fine === 'hamstrings' || fine === 'glutes' || fine === 'calves') fam = 'legs';
    if (/squat|fente|leg|jambe|mollet|presse|soulevé|terre/.test(String(name || exerciseId).toLowerCase())) {
      fam = 'legs';
    }
    if (/gainage|planche|core|abdo/.test(String(name || exerciseId).toLowerCase())) {
      fam = 'core';
    }
    totals[fam] = (totals[fam] || 0) + sets;
  });

  const weekly = {};
  Object.keys(totals).forEach((k) => {
    weekly[k] = Math.round((totals[k] / 4) * 10) / 10;
  });
  return weekly;
}

/**
 * Sets planifiés sur la semaine type (avant injection exos).
 */
export function estimatePlannedWeeklySetsByFamily(weekProfiles, activeDayKeys) {
  const totals = { pull: 0, push: 0, legs: 0, core: 0 };
  const SETS_PER_STRENGTH_DAY = 10;
  const SETS_PER_CORE_FOCUS = 6;

  activeDayKeys.forEach((dayKey) => {
    const p = weekProfiles?.[dayKey];
    if (!p || p.modality === 'cardio') return;
    const groups = Array.isArray(p.groups) ? p.groups : ['upper'];
    const perGroup =
      p.modality === 'strength_plus_cardio'
        ? Math.round(SETS_PER_STRENGTH_DAY * 0.92)
        : SETS_PER_STRENGTH_DAY;

    groups.forEach((g) => {
      if (g === 'cardio') return;
      if (g === 'core') {
        totals.core += SETS_PER_CORE_FOCUS;
        return;
      }
      if (g === 'lower') {
        totals.legs += perGroup;
        return;
      }
      if (g === 'upper') {
        totals.pull += Math.round(perGroup * 0.45);
        totals.push += Math.round(perGroup * 0.55);
      }
    });
  });

  return totals;
}

function overlapPenalty(planned, historical) {
  const pushLoad = (planned.push || 0) + (historical.push || 0) * 0.35;
  const pullLoad = (planned.pull || 0) + (historical.pull || 0) * 0.35;
  const penalties = { pull: 1, push: 1, legs: 1, core: 1 };
  if (pushLoad > 12 && pullLoad > 12) {
    penalties.pull *= 0.9;
    penalties.push *= 0.9;
  }
  if ((planned.push || 0) > 14 && (planned.pull || 0) > 12) {
    penalties.pull *= 0.88;
  }
  return penalties;
}

/**
 * @param {object} input
 * @param {object} input.deformers
 * @param {Record<string, object>} input.weekProfiles
 * @param {string[]} input.activeDayKeys
 * @param {object} input.answers
 * @param {object} input.constraints
 * @param {object|null} input.snapshot
 * @param {(id: string) => string} [input.getExerciseNameById]
 * @param {string} [input.windowStartYmd]
 * @param {string} [input.windowEndYmd]
 */
export function applyMuscleVolumeCaps(input) {
  const {
    deformers,
    weekProfiles,
    activeDayKeys,
    answers,
    constraints,
    snapshot,
    getExerciseNameById,
    windowStartYmd,
    windowEndYmd,
    globalLoadFactor = 1
  } = input;

  const d = {
    ...deformers,
    preferredGroupWeights: { ...(deformers?.preferredGroupWeights || {}) }
  };
  const warnings = [];
  const whyLines = [];

  const caps = computeWeeklyMuscleCaps(
    answers,
    constraints?.recoveryScore ?? 70,
    activeDayKeys?.length || 4,
    globalLoadFactor
  );
  const planned = estimatePlannedWeeklySetsByFamily(weekProfiles, activeDayKeys);
  let historical = { pull: 0, push: 0, legs: 0, core: 0 };
  if (snapshot && windowStartYmd && windowEndYmd) {
    historical = aggregateHistoricalWeeklySetsByFamily(
      snapshot,
      windowStartYmd,
      windowEndYmd,
      getExerciseNameById
    );
  }

  const penalties = overlapPenalty(planned, historical);
  const overloaded = [];

  Object.keys(caps).forEach((fam) => {
    const cap = caps[fam] * (penalties[fam] ?? 1);
    const total = (planned[fam] || 0) + (historical[fam] || 0) * 0.25;
    if (total > cap * 1.08) overloaded.push({ fam, total: Math.round(total), cap: Math.round(cap) });
  });

  if (overloaded.length === 0) {
    return { deformers: d, warnings, whyLines, muscleCaps: { caps, planned, historical } };
  }

  overloaded.forEach(({ fam, total, cap }) => {
    if (fam === 'pull' || fam === 'push') {
      d.preferredGroupWeights.upper = Math.max(0.75, (d.preferredGroupWeights.upper || 1) * 0.92);
    }
    if (fam === 'legs') {
      d.preferredGroupWeights.lower = Math.max(0.75, (d.preferredGroupWeights.lower || 1) * 0.9);
    }
    if (fam === 'core') {
      d.preferredGroupWeights.core = Math.max(0.8, (d.preferredGroupWeights.core || 1) * 0.88);
    }
    warnings.push(
      `Volume ${fam} élevé (prévu ~${total} séries eff. / sem., plafond ~${cap}) : priorisation ajustée.`
    );
  });

  if (overloaded.length >= 2) {
    d.maxExercisesPerSession = Math.min(d.maxExercisesPerSession ?? 7, 6);
    d.volumeMul = Math.min(d.volumeMul ?? 1, 0.94);
    whyLines.push(
      'Plusieurs groupes musculaires proches de leur plafond hebdo : volume de séance légèrement réduit.'
    );
  } else {
    whyLines.push('Un groupe musculaire approchait son plafond : la semaine type a été rééquilibrée.');
  }

  return { deformers: d, warnings, whyLines, muscleCaps: { caps, planned, historical, overloaded } };
}
