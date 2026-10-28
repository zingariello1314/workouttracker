/**
 * GTG sur le calendrier : barre dédiée et séparation d’avec la liste d’exercices.
 */

import { hasMomentumWorkoutForDate } from './calendarDayMomentumStripes';
import { buildGtgDayPlan, getGtgExerciseLabel, normalizeGtgData } from '../services/endurance/gtgService';
import {
  resolveGtgWorkoutStorageKey,
  sumGtgRepsForExerciseOnDay
} from '../services/endurance/gtgWorkoutSync';
import { getDayName } from './dateUtils';

/** Orange dédié GTG, distinct du orange des autres activités physiques (#ff5c00). */
/** Barre calendrier GTG — vert foncé (distinct des autres activités). */
export const CALENDAR_GTG_STRIPE_COLOR = '#166534';

function dayRecordHasDoneSlot(day) {
  if (!day || typeof day !== 'object') return false;
  const exercises = day.exercises;
  if (exercises && typeof exercises === 'object') {
    for (const ex of Object.values(exercises)) {
      const slots = ex?.slots;
      if (!slots || typeof slots !== 'object') continue;
      for (const slot of Object.values(slots)) {
        if (slot?.done) return true;
      }
    }
  }
  const legacy = day.slots;
  if (legacy && typeof legacy === 'object') {
    for (const slot of Object.values(legacy)) {
      if (!slot || typeof slot !== 'object') continue;
      for (const entry of Object.values(slot)) {
        if (entry?.done) return true;
      }
    }
  }
  if (Array.isArray(day.adHoc)) {
    for (const passage of day.adHoc) {
      if ((passage?.items || []).some((item) => item?.done && (Number(item.reps) || 0) > 0)) return true;
    }
  }
  return false;
}

/** Au moins une mini-série GTG cochée ce jour-là. */
export function gtgDayHasCompletedMiniSet(workoutData, dateStr) {
  if (!workoutData || !dateStr) return false;
  const day = workoutData?.enduranceData?.gtg?.days?.[dateStr];
  if (dayRecordHasDoneSlot(day)) return true;
  const ledger = workoutData?.enduranceData?.gtg?.workoutSync?.[dateStr];
  if (!ledger || typeof ledger !== 'object') return false;
  return Object.values(ledger).some((n) => (Number(n) || 0) > 0);
}

/**
 * Tous les créneaux GTG planifiés du jour sont terminés
 * (les passages hors planning ne comptent pas pour « complet »).
 */
export function gtgDayIsFullyComplete(workoutData, dateStr) {
  if (!workoutData || !dateStr) return false;
  const gtg = normalizeGtgData(workoutData?.enduranceData?.gtg);
  if (!(gtg.config?.selectedIds || []).length) return false;
  const plan = buildGtgDayPlan(gtg, dateStr, { workoutData });
  const planned = Number(plan?.plannedMiniSets) || 0;
  if (planned <= 0) return false;
  const donePlanned = Number(plan?.donePlannedMiniSets) || 0;
  return donePlanned >= planned;
}

/** Exercices classiques prévus au programme pour cette date (hors GTG). */
export function dayHasClassicExercisesPlanned(workoutData, dateStr) {
  if (!workoutData || !dateStr) return false;
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  const dayName = getDayName(date);
  const programs = Array.isArray(workoutData.programs) ? workoutData.programs : [];
  const activeId = workoutData.activeProgramId;
  const active =
    (activeId != null && programs.find((p) => p && p.id === activeId)) ||
    workoutData.activeProgram ||
    programs.find((p) => p?.schedule) ||
    null;
  const day = active?.schedule?.[dayName];
  if (!day) return false;
  const list = day.exercises || day.exercices || [];
  if (Array.isArray(list) && list.length > 0) return true;
  const salle = day.salleVariants;
  if (salle) {
    const a = salle.semaineA?.exercises?.length || 0;
    const b = salle.semaineB?.exercises?.length || 0;
    if (a + b > 0) return true;
  }
  return false;
}

/**
 * True si le GTG seul peut valider le jour d’entraînement :
 * - tous les créneaux planifiés cochés
 * - aucun exercice classique prévu au programme
 * - aucune séance classique réalisée
 */
export function gtgAloneCountsAsTrainingDay(workoutData, dateStr) {
  if (!gtgDayIsFullyComplete(workoutData, dateStr)) return false;
  if (dayHasClassicExercisesPlanned(workoutData, dateStr)) return false;
  if (hasNonGtgMomentumWorkoutForDate(workoutData, dateStr)) return false;
  return true;
}

/**
 * Reps GTG par clé `reps` / `checkedExercises` du jour.
 * @returns {Map<string, number>}
 */
export function gtgRepsByStorageKey(workoutData, dateStr) {
  const map = new Map();
  if (!workoutData || !dateStr) return map;
  const gtg = normalizeGtgData(workoutData?.enduranceData?.gtg);
  const ledger = gtg.workoutSync?.[dateStr];
  if (ledger && typeof ledger === 'object') {
    for (const [exerciseId, reps] of Object.entries(ledger)) {
      const n = Number(reps) || 0;
      if (n <= 0) continue;
      const key = resolveGtgWorkoutStorageKey(dateStr, exerciseId, gtg.config);
      map.set(key, (map.get(key) || 0) + n);
    }
    if (map.size > 0) return map;
  }
  if (!gtgDayHasCompletedMiniSet(workoutData, dateStr)) return map;
  for (const id of gtg.config.selectedIds || []) {
    const reps = sumGtgRepsForExerciseOnDay(gtg, dateStr, id, { workoutData });
    if (reps <= 0) continue;
    const key = resolveGtgWorkoutStorageKey(dateStr, id, gtg.config);
    map.set(key, (map.get(key) || 0) + reps);
  }
  return map;
}

/** Séance du jour hors part GTG (la barre « exercices » ne doit pas doubler le GTG). */
export function hasNonGtgMomentumWorkoutForDate(workoutData, dateStr) {
  if (!hasMomentumWorkoutForDate(workoutData, dateStr)) return false;
  const gtgByKey = gtgRepsByStorageKey(workoutData, dateStr);
  if (gtgByKey.size === 0) return true;

  const checked = workoutData.checkedExercises || {};
  const reps = workoutData.reps || {};
  const seen = new Set();

  const countsAsWorkout = (key) => {
    if (!key.startsWith(`${dateStr}_`)) return false;
    if (key.includes('_complementary_')) return false;
    const total = parseInt(reps[key], 10) || 0;
    const gtg = gtgByKey.get(key) || 0;
    if (gtg <= 0) return true;
    return total - gtg > 0;
  };

  for (const [key, val] of Object.entries(checked)) {
    if (val !== true) continue;
    seen.add(key);
    if (countsAsWorkout(key)) return true;
  }
  for (const key of Object.keys(reps)) {
    if (seen.has(key)) continue;
    if (countsAsWorkout(key)) return true;
  }
  return false;
}

/** Retire les lignes dont les reps viennent uniquement du GTG ; garde le reste de la séance. */
export function omitGtgOnlyCalendarExercises(exercises, workoutData, dateStr) {
  if (!Array.isArray(exercises) || exercises.length === 0) return exercises || [];
  const portions = gtgRepsByStorageKey(workoutData, dateStr);
  if (portions.size === 0) return exercises;
  return exercises.flatMap((ex) => {
    const key = ex?._storageKey;
    const gtg = key ? portions.get(key) || 0 : 0;
    const total = parseInt(ex?.reps, 10) || 0;
    const rest = Math.max(0, total - gtg);
    if (gtg > 0 && rest <= 0) return [];
    if (rest === total) return [ex];
    return [{ ...ex, reps: rest }];
  });
}

export function buildGtgCalendarStripe(workoutData, dateStr) {
  if (!gtgDayHasCompletedMiniSet(workoutData, dateStr)) return null;
  return {
    kind: 'gtg',
    color: CALENDAR_GTG_STRIPE_COLOR,
    key: 'gtg'
  };
}

/** Plan du jour pour le module détail (null si aucune mini-série faite). */
export function buildCalendarGtgDayView(workoutData, dateStr, ctx = {}) {
  if (!gtgDayHasCompletedMiniSet(workoutData, dateStr)) return null;
  const gtg = normalizeGtgData(workoutData?.enduranceData?.gtg);
  const plan = buildGtgDayPlan(gtg, dateStr, { workoutData, ...ctx });
  if (!plan || (plan.doneMiniSets || 0) <= 0) return null;
  const labelFor = (id) => getGtgExerciseLabel(id, gtg.config, ctx);
  const exercisePlans = (plan.exercisePlans || [])
    .filter((ep) => (ep.completedCount || 0) > 0 || (ep.slots || []).some((s) => s.done))
    .map((ep) => {
      const plannedReps = (ep.slots || []).reduce(
        (sum, s) => (s.adHoc ? sum : sum + (Number(s.reps) || 0)),
        0
      );
      const doneReps = (ep.slots || []).reduce(
        (sum, s) => (s.done ? sum + (Number(s.reps) || 0) : sum),
        0
      );
      return {
        exerciseId: ep.exerciseId,
        label: labelFor(ep.exerciseId),
        plannedReps,
        doneReps,
        completedCount: ep.completedCount,
        totalCount: ep.totalCount,
        slots: (ep.slots || []).map((s) => ({
          time: s.time,
          reps: s.reps,
          done: Boolean(s.done),
          adHoc: Boolean(s.adHoc)
        }))
      };
    });
  const plannedReps = exercisePlans.reduce((sum, ep) => sum + ep.plannedReps, 0);
  return {
    doneMiniSets: plan.doneMiniSets,
    donePlannedMiniSets: plan.donePlannedMiniSets,
    plannedMiniSets: plan.plannedMiniSets,
    adHocDoneMiniSets: plan.adHocDoneMiniSets || 0,
    adHocDoneReps: plan.adHocDoneReps || 0,
    doneReps: plan.doneReps,
    plannedReps,
    progressPct: plan.progressPct,
    exercisePlans
  };
}
