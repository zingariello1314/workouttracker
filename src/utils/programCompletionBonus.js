/**
 * Complétion « programme du jour » : exos cochés / exos prévus (même agrégation que le calendrier).
 * Bonus XP : +100 si ≥ 80 %, +200 supplémentaires si 100 % (300 au total ce jour-là).
 */

import { workoutProgram } from '../data/workoutProgram';
import { collectCalendarRepKeysForExercise } from './exerciseKeyGenerator';

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function dayNameFromDateStr(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return DAY_NAMES[d.getDay()];
}

function stableStringIdToNumericId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) + 10000;
}

/**
 * Liste fusionnée des exos prévus pour une date (programme défaut + programmes perso + ad hoc depuis les clés).
 * @param {string} dateStr
 * @param {object} workoutData
 * @param {object} [ctx]
 * @param {Array} [ctx.programs]
 * @param {(id: number|string) => string} [ctx.getExerciseNameById]
 */
export function buildPlannedExerciseListForDateStr(dateStr, workoutData, ctx = {}) {
  const { programs = [], getExerciseNameById } = ctx;
  const dayName = dayNameFromDateStr(dateStr);
  if (!dayName) return [];

  const allExercises = [];
  const seen = new Set();

  const pushEx = (ex, meta) => {
    if (!ex || ex.id == null) return;
    const id = typeof ex.id === 'number' ? ex.id : stableStringIdToNumericId(String(ex.id));
    if (seen.has(id)) return;
    seen.add(id);
    allExercises.push({
      id,
      name: ex.name || '',
      series: ex.series || '',
      type: ex.type || 'standard',
      materiel: ex.materiel || ex.equipment || '',
      notes: ex.notes || '',
      originalId: ex.originalId,
      ...meta
    });
  };

  const defaultWorkout = workoutProgram[dayName];
  if (defaultWorkout?.exercices) {
    defaultWorkout.exercices.forEach((ex) =>
      pushEx(ex, { programName: 'Cycle 3+1', programId: 'default' })
    );
  }

  if (Array.isArray(programs)) {
    programs.forEach((program) => {
      if (!program?.schedule?.[dayName]?.exercises) return;
      program.schedule[dayName].exercises.forEach((ex) => {
        let numericId;
        if (typeof ex.id === 'string') {
          numericId = stableStringIdToNumericId(ex.id);
        } else {
          numericId = ex.id;
        }
        pushEx(
          { ...ex, id: numericId },
          { programName: program.name || 'Programme', programId: program.id }
        );
      });
    });
  }

  const prefix = `${dateStr}_`;
  const checked = workoutData?.checkedExercises || {};
  const reps = workoutData?.reps || {};
  const nameFor = (id) =>
    typeof getExerciseNameById === 'function' ? getExerciseNameById(id) : `Exercice ${id}`;

  [...Object.keys(reps), ...Object.keys(checked)].forEach((key) => {
    if (!key.startsWith(prefix)) return;
    const rest = key.slice(prefix.length);
    const match = rest.match(/^(\d+)(?:_semaineA|_semaineB)?$/);
    if (!match) return;
    const id = parseInt(match[1], 10);
    if (!Number.isFinite(id) || seen.has(id)) return;
    seen.add(id);
    allExercises.push({
      id,
      name: nameFor(id),
      series: '',
      type: 'standard',
      materiel: '',
      notes: '',
      programName: 'Séance enregistrée',
      programId: 'recorded'
    });
  });

  return allExercises;
}

/**
 * @returns {{ checked: number, total: number, ratio: number }}
 */
export function computeProgramCompletionCheckedRatio(dateStr, workoutData, ctx = {}) {
  let list = buildPlannedExerciseListForDateStr(dateStr, workoutData, ctx);
  const dv = workoutData?.dailyVariations?.[dateStr];
  const suppressed = new Set(
    Array.isArray(dv?.suppressedExercises)
      ? dv.suppressedExercises.filter((id) => typeof id === 'number' && !Number.isNaN(id))
      : []
  );
  if (suppressed.size > 0) {
    list = list.filter((ex) => !suppressed.has(ex.id));
  }
  const total = list.length;
  if (total === 0) return { checked: 0, total: 0, ratio: 0 };
  const chk = workoutData?.checkedExercises || {};
  let checked = 0;
  for (const exercise of list) {
    const keys = collectCalendarRepKeysForExercise(dateStr, exercise);
    if (keys.some((k) => chk[k] === true)) checked += 1;
  }
  return { checked, total, ratio: checked / total };
}

/**
 * Bonus XP cumulé sur toutes les dates présentes dans les données.
 */
export function computeProgramCompletionBonusXp(workoutData, ctx = {}) {
  const dates = new Set();
  const ch = workoutData?.checkedExercises || {};
  Object.keys(ch).forEach((k) => {
    if (/^\d{4}-\d{2}-\d{2}_/.test(k)) dates.add(k.slice(0, 10));
  });
  let bonus = 0;
  for (const dateStr of dates) {
    const { total, ratio } = computeProgramCompletionCheckedRatio(dateStr, workoutData, ctx);
    if (total === 0) continue;
    if (ratio >= 1) bonus += 300;
    else if (ratio >= 0.8) bonus += 100;
  }
  return bonus;
}
