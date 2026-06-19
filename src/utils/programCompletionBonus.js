/**
 * Complétion « programme du jour » : (exos + étirements) cochés / prévus.
 *
 * Bonus XP : +100 si ratio ≥ 80 %, +200 supplémentaires si 100 % (300 au total ce jour-là).
 *
 * Les étirements comptent dans le ratio depuis la refonte (granularité item individuel) :
 * un étirement coché = 1 / total_planifié (exos + étirements) pour la couleur du calendrier
 * et le bonus de complétion. Cela garantit que cocher TOUS les étirements d'un jour de
 * repos donne quand même 100 % de complétion (et le bonus +300 XP associé).
 */

import { workoutProgram } from '../data/workoutProgram';
import { collectCalendarRepKeysForExercise, generateStretchItemKey } from './exerciseKeyGenerator';
import { buildPlannedStretchItemsForDateStr } from './stretchUtils';
import { getPlannedExercisesForCalendarDate } from './calendarProgramExercises';

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
 * @param {object} [ctx.activeProgram] programme actif (alignement calendrier / Aujourd'hui)
 * @param {(date: Date, isGymMode?: boolean) => object} [ctx.getTodayWorkout]
 * @param {boolean} [ctx.isAdmin]
 * @param {boolean} [ctx.isAuthenticated]
 */
export function buildPlannedExerciseListForDateStr(dateStr, workoutData, ctx = {}) {
  const {
    programs = [],
    getExerciseNameById,
    activeProgram = null,
    getTodayWorkout = null,
    isAdmin = false,
    isAuthenticated = false,
    alignWithCalendar = true
  } = ctx;
  const dayName = dayNameFromDateStr(dateStr);
  if (!dayName) return [];

  const allExercises = [];
  const seen = new Set();

  const pushEx = (ex, meta = {}) => {
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
      originalId: ex.originalId ?? ex.id,
      ...meta
    });
  };

  if (alignWithCalendar && (getTodayWorkout || activeProgram)) {
    const date = new Date(`${dateStr}T12:00:00`);
    getPlannedExercisesForCalendarDate({
      date,
      dayName,
      dateStr,
      getTodayWorkout,
      activeProgram,
      isAdmin,
      isAuthenticated
    }).forEach((ex) =>
      pushEx(ex, {
        programName: ex.programName || activeProgram?.name || 'Programme actif',
        programId: ex.programId || activeProgram?.id || 'active'
      })
    );
  } else {
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
    pushEx({
      id,
      name: nameFor(id),
      series: '',
      type: 'standard',
      materiel: '',
      notes: ''
    }, {
      programName: 'Séance enregistrée',
      programId: 'recorded'
    });
  });

  return allExercises;
}

/**
 * Liste plate des étirements planifiés pour une date (programme par défaut + custom).
 */
export function buildPlannedStretchListForDateStr(dateStr, ctx = {}) {
  const programs = Array.isArray(ctx?.programs) ? ctx.programs : [];
  const activeProgram = ctx?.activeProgram ?? null;
  const stretchPrograms =
    activeProgram && ctx?.alignWithCalendar !== false ? [activeProgram] : programs;
  return buildPlannedStretchItemsForDateStr(dateStr, workoutProgram, { programs: stretchPrograms });
}

/**
 * Sépare le ratio en deux composantes (exos / étirements) puis renvoie le ratio combiné.
 * Permet à la couleur du calendrier de refléter la complétion globale du jour
 * (et au bonus XP +100/+300 d'inclure les étirements).
 *
 * @returns {{ checked: number, total: number, ratio: number,
 *             exoChecked: number, exoTotal: number,
 *             stretchChecked: number, stretchTotal: number }}
 */
export function computeProgramCompletionCheckedRatio(dateStr, workoutData, ctx = {}) {
  // ── Volet Exercices ───────────────────────────────────────────────────────
  let exoList = buildPlannedExerciseListForDateStr(dateStr, workoutData, ctx);
  const dv = workoutData?.dailyVariations?.[dateStr];
  const suppressed = new Set(
    Array.isArray(dv?.suppressedExercises)
      ? dv.suppressedExercises.filter((id) => typeof id === 'number' && !Number.isNaN(id))
      : []
  );
  if (suppressed.size > 0) {
    exoList = exoList.filter((ex) => !suppressed.has(ex.id));
  }
  const exoTotal = exoList.length;
  const chk = workoutData?.checkedExercises || {};
  let exoChecked = 0;
  for (const exercise of exoList) {
    const keys = collectCalendarRepKeysForExercise(dateStr, exercise);
    if (keys.some((k) => chk[k] === true)) exoChecked += 1;
  }

  // ── Volet Étirements ──────────────────────────────────────────────────────
  const stretchList = buildPlannedStretchListForDateStr(dateStr, ctx);
  const stretchTotal = stretchList.length;
  const checkedStretches = workoutData?.checkedStretches || {};
  let stretchChecked = 0;
  for (const item of stretchList) {
    const key = generateStretchItemKey(dateStr, item.moment, item.id);
    if (checkedStretches[key] === true) stretchChecked += 1;
  }

  // ── Ratio combiné ─────────────────────────────────────────────────────────
  const total = exoTotal + stretchTotal;
  const checked = exoChecked + stretchChecked;
  const ratio = total === 0 ? 0 : checked / total;

  return {
    checked,
    total,
    ratio,
    exoChecked,
    exoTotal,
    stretchChecked,
    stretchTotal
  };
}

/**
 * Bonus XP cumulé sur toutes les dates présentes dans les données.
 *
 * Une date est éligible si elle apparaît dans `checkedExercises` OU `checkedStretches`
 * (un jour de pure mobilité avec uniquement des étirements doit pouvoir donner le bonus).
 */
export function computeProgramCompletionBonusXp(workoutData, ctx = {}) {
  const dates = new Set();
  const ch = workoutData?.checkedExercises || {};
  Object.keys(ch).forEach((k) => {
    if (/^\d{4}-\d{2}-\d{2}_/.test(k)) dates.add(k.slice(0, 10));
  });
  const cs = workoutData?.checkedStretches || {};
  Object.keys(cs).forEach((k) => {
    const m = k.match(/^(\d{4}-\d{2}-\d{2})_/);
    if (m) dates.add(m[1]);
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
