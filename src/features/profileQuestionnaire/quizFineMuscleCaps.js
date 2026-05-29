/**
 * Caps hebdo par muscle fin (dos, pecs, ischio…) — extension des familles pull/push/legs/core.
 */

import { aggregateCheckedRepsByDateAndExerciseId } from '../../utils/trainingLoadUtils';
import { resolveFineMuscleFromExerciseRef } from './quizFineMuscleResolve';

export { resolveFineMuscleFromName, resolveFineMuscleFromBankEntry, resolveFineMuscleFromExerciseRef, parseQuizExerciseBankKey } from './quizFineMuscleResolve';

/** @typedef {'back'|'chest'|'shoulders'|'biceps'|'triceps'|'quads'|'hamstrings'|'glutes'|'calves'|'core'} FineMuscle */

const BASE_FINE = {
  back: 10,
  chest: 10,
  shoulders: 8,
  biceps: 6,
  triceps: 6,
  quads: 10,
  hamstrings: 8,
  glutes: 8,
  calves: 5,
  core: 8
};

const FAMILY_MAP = {
  back: 'pull',
  chest: 'push',
  shoulders: 'push',
  biceps: 'pull',
  triceps: 'push',
  quads: 'legs',
  hamstrings: 'legs',
  glutes: 'legs',
  calves: 'legs',
  core: 'core'
};

export function aggregateHistoricalWeeklyFineSets(snapshot, startYmd, endYmd, getExerciseNameById) {
  const grouped = aggregateCheckedRepsByDateAndExerciseId(snapshot?.reps, snapshot?.checkedExercises);
  const totals = {};
  Object.keys(BASE_FINE).forEach((k) => {
    totals[k] = 0;
  });

  grouped.forEach(({ reps }, gkey) => {
    const dateStr = gkey.slice(0, 10);
    if (dateStr < startYmd || dateStr > endYmd) return;
    const exerciseId = gkey.slice(11);
    const repsN = Number(reps) || 0;
    if (repsN <= 0) return;
    const sets = Math.max(1, Math.round(repsN / 8));
    const fine = resolveFineMuscleFromExerciseRef(exerciseId, '', getExerciseNameById);
    if (fine) totals[fine] = (totals[fine] || 0) + sets;
  });

  const weekly = {};
  Object.keys(totals).forEach((k) => {
    weekly[k] = Math.round((totals[k] / 4) * 10) / 10;
  });
  return weekly;
}

/**
 * Ajuste preferredGroupWeights si un muscle fin dépasse ~85 % de son cap.
 */
export function applyFineMuscleCapHints(deformers, historicalFine, familyCaps = {}) {
  const d = {
    ...deformers,
    preferredGroupWeights: { ...(deformers?.preferredGroupWeights || {}) }
  };
  const warnings = [];

  Object.keys(BASE_FINE).forEach((muscle) => {
    const cap = BASE_FINE[muscle] * (familyCaps[FAMILY_MAP[muscle]] ? familyCaps[FAMILY_MAP[muscle]] / 14 : 1);
    const hist = historicalFine[muscle] || 0;
    if (hist > cap * 0.85) {
      warnings.push(`Charge ${muscle} élevée récemment (~${Math.round(hist)} séries eff./sem.) : priorité ajustée.`);
      const fam = FAMILY_MAP[muscle];
      if (fam === 'pull' || fam === 'push') {
        d.preferredGroupWeights.upper = Math.max(0.78, (d.preferredGroupWeights.upper || 1) * 0.94);
      }
      if (fam === 'legs') {
        d.preferredGroupWeights.lower = Math.max(0.78, (d.preferredGroupWeights.lower || 1) * 0.92);
      }
      if (fam === 'core') {
        d.preferredGroupWeights.core = Math.max(0.8, (d.preferredGroupWeights.core || 1) * 0.9);
      }
    }
  });

  return { deformers: d, warnings };
}
