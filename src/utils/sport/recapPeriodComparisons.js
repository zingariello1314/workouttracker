/**
 * Comparaisons multi-fenêtres et clause de rythme.
 * Extrait de recapPeriodDiscoveries.js — comportement inchangé.
 */

import { getCalendarSportStatsCache } from '../calendarMonthSportStats';
import { aggregateCheckedRepsByDateAndExerciseId } from '../trainingLoadUtils';
import { addCalendarDays } from './garminRunningPeriodStats';
import { assertWindowMeasureConsistency } from './recapInsightValidate';
import { coopGate } from './recapComputeCoop';
import { previousWindow } from './recapPersonalBaselines';
import {
  PERIOD_QUESTIONS,
  periodVoice,
  fmtInt,
  formatDurationFr,
  windowFromEnd,
  refFromYmd
} from './recapPeriodVoice';
import { measureRecapWindow, emptyMeasure } from './recapPeriodMeasure';

export function buildPeriodComparisons({
  snapshot,
  window,
  period = '7d',
  getExerciseNameById,
  garminData = null,
  recapState = null,
  athleteIdentity = null,
  perfTimer = null
} = {}) {
  const end = window?.end;
  const measure = (name, fn) => (perfTimer?.measure ? perfTimer.measure(name, fn) : fn());
  if (!snapshot || !end) {
    return { period: emptyMeasure(window), d7: emptyMeasure(window), d30: emptyMeasure(window), d90: emptyMeasure(window) };
  }
  if (!window?.start) {
    const span = period === '2y' ? 730 : period === '1y' ? 365 : period === '6m' ? 183 : period === '3m' ? 92 : period === '30d' ? 30 : 3650;
    window = { start: addCalendarDays(end, -(span - 1)), end };
  }
  const ref = refFromYmd(end);
  const sportCache = getCalendarSportStatsCache(snapshot, garminData);
  const calendarMemo = new Map();
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    snapshot?.reps,
    snapshot?.checkedExercises
  );
  const winOpts = {
    snapshot,
    getExerciseNameById,
    garminData,
    perfTimer,
    sportCache,
    calendarMemo,
    grouped
  };
  const periodM = measure('measureRecapWindow:period', () =>
    measureRecapWindow({
      ...winOpts,
      window,
      recapState,
      periodId: period,
      refDate: ref
    })
  );
  const d7 = measure('measureRecapWindow:d7', () =>
    measureRecapWindow({
      ...winOpts,
      window: windowFromEnd(end, 7),
      periodId: '7d',
      refDate: ref
    })
  );
  const d30 = measure('measureRecapWindow:d30', () =>
    measureRecapWindow({
      ...winOpts,
      window: windowFromEnd(end, 30),
      periodId: '30d',
      refDate: ref
    })
  );
  const d90 = measure('measureRecapWindow:d90', () =>
    measureRecapWindow({
      ...winOpts,
      window: windowFromEnd(end, 92),
      periodId: '3m',
      refDate: ref
    })
  );
  const prev30 = measure('measureRecapWindow:prev30', () =>
    measureRecapWindow({
      ...winOpts,
      window: previousWindow(end, 30),
      periodId: '30d',
      refDate: refFromYmd(previousWindow(end, 30).end)
    })
  );
  // Spec #24 C1 — baseline de même durée que la fenêtre courante
  const sameLen = Math.max(1, Number(periodM.spanDays) || 30);
  const prevSameWin = previousWindow(end, sameLen);
  const prevSameLength = measure('measureRecapWindow:prevSameLength', () =>
    measureRecapWindow({
      ...winOpts,
      window: prevSameWin,
      periodId: period,
      refDate: refFromYmd(prevSameWin.end)
    })
  );
  const quarter = windowFromEnd(end, 92);
  const first30end = addCalendarDays(quarter.start, 29);
  const first30 = measure('measureRecapWindow:first30', () =>
    measureRecapWindow({
      ...winOpts,
      window: { start: quarter.start, end: first30end },
      periodId: '30d',
      refDate: refFromYmd(first30end)
    })
  );
  assertWindowMeasureConsistency(periodM, { label: `period:${period}` });
  assertWindowMeasureConsistency(prevSameLength, { label: `prevSame:${period}` });
  return {
    period: periodM,
    d7,
    d30,
    d90,
    prev30,
    prevSameLength,
    first30,
    identity: athleteIdentity || null,
    periodId: period,
    voice: periodVoice(period, periodM.spanDays),
    question: PERIOD_QUESTIONS[period] || PERIOD_QUESTIONS['7d']
  };
}

/**
 * F7.0 — même résultat que buildPeriodComparisons, avec yield/abort entre
 * chaque measureRecapWindow (frontière sûre : fenêtres indépendantes).
 */
export async function buildPeriodComparisonsAsync(opts = {}) {
  const coop = opts.coop || {};
  const perfTimer = opts.perfTimer || null;
  const measure = (name, fn) => (perfTimer?.measure ? perfTimer.measure(name, fn) : fn());
  const snapshot = opts.snapshot;
  let window = opts.window;
  const period = opts.period || '7d';
  const getExerciseNameById = opts.getExerciseNameById;
  const garminData = opts.garminData || null;
  const recapState = opts.recapState || null;
  const athleteIdentity = opts.athleteIdentity || null;
  const end = window?.end;
  if (!snapshot || !end) {
    return { period: emptyMeasure(window), d7: emptyMeasure(window), d30: emptyMeasure(window), d90: emptyMeasure(window) };
  }
  if (!window?.start) {
    const span = period === '2y' ? 730 : period === '1y' ? 365 : period === '6m' ? 183 : period === '3m' ? 92 : period === '30d' ? 30 : 3650;
    window = { start: addCalendarDays(end, -(span - 1)), end };
  }
  const ref = refFromYmd(end);
  const sportCache = getCalendarSportStatsCache(snapshot, garminData);
  const calendarMemo = new Map();
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    snapshot?.reps,
    snapshot?.checkedExercises
  );
  const winOpts = {
    snapshot,
    getExerciseNameById,
    garminData,
    perfTimer,
    sportCache,
    calendarMemo,
    grouped
  };

  await coopGate(coop);
  const periodM = measure('measureRecapWindow:period', () =>
    measureRecapWindow({
      ...winOpts,
      window,
      recapState,
      periodId: period,
      refDate: ref
    })
  );
  await coopGate(coop);
  const d7 = measure('measureRecapWindow:d7', () =>
    measureRecapWindow({
      ...winOpts,
      window: windowFromEnd(end, 7),
      periodId: '7d',
      refDate: ref
    })
  );
  await coopGate(coop);
  const d30 = measure('measureRecapWindow:d30', () =>
    measureRecapWindow({
      ...winOpts,
      window: windowFromEnd(end, 30),
      periodId: '30d',
      refDate: ref
    })
  );
  await coopGate(coop);
  const d90 = measure('measureRecapWindow:d90', () =>
    measureRecapWindow({
      ...winOpts,
      window: windowFromEnd(end, 92),
      periodId: '3m',
      refDate: ref
    })
  );
  await coopGate(coop);
  const prev30 = measure('measureRecapWindow:prev30', () =>
    measureRecapWindow({
      ...winOpts,
      window: previousWindow(end, 30),
      periodId: '30d',
      refDate: refFromYmd(previousWindow(end, 30).end)
    })
  );
  await coopGate(coop);
  const sameLen = Math.max(1, Number(periodM.spanDays) || 30);
  const prevSameWin = previousWindow(end, sameLen);
  const prevSameLength = measure('measureRecapWindow:prevSameLength', () =>
    measureRecapWindow({
      ...winOpts,
      window: prevSameWin,
      periodId: period,
      refDate: refFromYmd(prevSameWin.end)
    })
  );
  await coopGate(coop);
  const quarter = windowFromEnd(end, 92);
  const first30end = addCalendarDays(quarter.start, 29);
  const first30 = measure('measureRecapWindow:first30', () =>
    measureRecapWindow({
      ...winOpts,
      window: { start: quarter.start, end: first30end },
      periodId: '30d',
      refDate: refFromYmd(first30end)
    })
  );
  assertWindowMeasureConsistency(periodM, { label: `period:${period}` });
  assertWindowMeasureConsistency(prevSameLength, { label: `prevSame:${period}` });
  return {
    period: periodM,
    d7,
    d30,
    d90,
    prev30,
    prevSameLength,
    first30,
    identity: athleteIdentity || null,
    periodId: period,
    voice: periodVoice(period, periodM.spanDays),
    question: PERIOD_QUESTIONS[period] || PERIOD_QUESTIONS['7d']
  };
}

export function sessionRhythmClause(p, opts = {}) {
  if (opts.today && p?.repsPerSession != null && opts.d7?.repsPerSession != null && Number(opts.d7.repsPerSession) > 0) {
    const pct = ((p.repsPerSession - opts.d7.repsPerSession) / opts.d7.repsPerSession) * 100;
    if (Math.abs(pct) < 8) return '';
    const dir = pct > 0 ? 'au-dessus' : 'en dessous';
    return `. Le rythme de cette séance (${fmtInt(p.repsPerSession)} répétitions) est ${dir} de ta moyenne des 7 derniers jours (environ ${fmtInt(opts.d7.repsPerSession)} par journée de renforcement)`;
  }
  if (p?.repsPerSession == null || !(Number(p.trainingDays) >= 2)) return '';
  const strength = Number(p.strengthDays) || 0;
  const trained = Number(p.trainingDays) || 0;
  if (strength > 0 && trained > strength) {
    return `. Ces répétitions portent sur ${strength} journées de renforcement, à côté de ${trained} journées entraînées au calendrier`;
  }
  const dur = p.minutesPerSession ? ` et ${formatDurationFr(p.minutesPerSession)}` : '';
  return `, soit environ ${fmtInt(p.repsPerSession)} répétitions${dur} par séance`;
}
