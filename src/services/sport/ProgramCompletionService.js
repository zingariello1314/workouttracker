/**
 * Complétion programme — crédit endurance sur date logique (D4).
 */

import { filterSessionsOnCalendarDate } from './TrainingDayTruthService';
import { readGarminActivityDateOverrides } from '../../utils/sessionCalendarDate';
import { buildPlannedExerciseListForDateStr } from '../../utils/programCompletionBonus';

const RUN_SLOT_PATTERN = /\b(course|footing|run|running|jogging|trail)\b/i;

/**
 * Le jour programme inclut-il un slot course (nom d'exo ou série) ?
 */
export function plannedDayIncludesRunningSlot(dateStr, workoutData, ctx = {}) {
  const list = buildPlannedExerciseListForDateStr(dateStr, workoutData, ctx);
  return list.some((ex) => {
    const blob = `${ex.name || ''} ${ex.series || ''} ${ex.notes || ''}`;
    return RUN_SLOT_PATTERN.test(blob);
  });
}

/**
 * Au moins une session course (non marche) sur la date calendrier logique.
 */
export function dayHasRunningSessionOnCalendarDate(aggregate, dateStr) {
  const overrides = readGarminActivityDateOverrides(aggregate);
  const running = aggregate?.enduranceData?.sessions?.running;
  if (!Array.isArray(running)) return false;
  const onDay = filterSessionsOnCalendarDate(running, dateStr, overrides);
  return onDay.length > 0;
}

/**
 * Crédit complétion : si course planifiée + séance sur date logique, +1/+1 au ratio exos.
 * @param {string} dateStr
 * @param {object} workoutData
 * @param {{ exoChecked: number, exoTotal: number, stretchChecked: number, stretchTotal: number }} partial
 * @param {object} [ctx]
 */
export function applyRunningCompletionCredit(dateStr, workoutData, partial, ctx = {}) {
  const exoTotal = partial.exoTotal ?? 0;
  const exoChecked = partial.exoChecked ?? 0;
  const stretchTotal = partial.stretchTotal ?? 0;
  const stretchChecked = partial.stretchChecked ?? 0;

  if (!plannedDayIncludesRunningSlot(dateStr, workoutData, ctx)) {
    return {
      ...partial,
      checked: exoChecked + stretchChecked,
      total: exoTotal + stretchTotal,
      ratio: exoTotal + stretchTotal === 0 ? 0 : (exoChecked + stretchChecked) / (exoTotal + stretchTotal)
    };
  }

  if (!dayHasRunningSessionOnCalendarDate(workoutData, dateStr)) {
    return {
      ...partial,
      checked: exoChecked + stretchChecked,
      total: exoTotal + stretchTotal,
      ratio: exoTotal + stretchTotal === 0 ? 0 : (exoChecked + stretchChecked) / (exoTotal + stretchTotal)
    };
  }

  const runExercises = buildPlannedExerciseListForDateStr(dateStr, workoutData, ctx).filter((ex) =>
    RUN_SLOT_PATTERN.test(`${ex.name || ''} ${ex.series || ''}`)
  );
  const chk = workoutData?.checkedExercises || {};
  const alreadyChecked = runExercises.some((ex) => {
    const prefix = `${dateStr}_`;
    return Object.keys(chk).some((k) => k.startsWith(prefix) && k.includes(String(ex.id)) && chk[k] === true);
  });

  if (alreadyChecked || runExercises.length === 0) {
    const checked = exoChecked + stretchChecked;
    const total = exoTotal + stretchTotal;
    return { ...partial, checked, total, ratio: total === 0 ? 0 : checked / total };
  }

  const exoCheckedAdj = exoChecked + 1;
  const exoTotalAdj = exoTotal + 1;
  const checked = exoCheckedAdj + stretchChecked;
  const total = exoTotalAdj + stretchTotal;
  return {
    ...partial,
    exoChecked: exoCheckedAdj,
    exoTotal: exoTotalAdj,
    checked,
    total,
    ratio: total === 0 ? 0 : checked / total,
    runningCompletionCredit: true
  };
}
