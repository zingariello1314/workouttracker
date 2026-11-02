/**
 * P3.6 — Occasions observables (dénominateurs calendaires).
 * Réutilise buildP35DayTable ; n’invente pas de second ledger.
 *
 * @module recapP36Occasions
 */

import { DAY_PLAN_PROOF } from '../programRevisionJournalP34';
import { buildP35DayTable } from './recapP35DayModel';
import { addCalendarDays } from './garminRunningPeriodStats';

/** Fenêtre précédente de même durée calendaire (convention W→C). */
export function previousWindowEqualSpan(window) {
  if (!window?.start || !window?.end) return null;
  const span =
    Math.round(
      (new Date(`${window.end}T12:00:00`) - new Date(`${window.start}T12:00:00`)) /
        86400000
    ) + 1;
  if (!(span > 0)) return null;
  const prevEnd = addCalendarDays(window.start, -1);
  const prevStart = addCalendarDays(prevEnd, -(span - 1));
  return { start: prevStart, end: prevEnd };
}

export const WEEKDAY_LABELS_FR = Object.freeze([
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi'
]);

/** Local civil (évite décalage UTC). */
export function dowFromYmd(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).getDay();
}

export function labelDow(dow) {
  return WEEKDAY_LABELS_FR[dow] || `jour ${dow}`;
}

function emptyDowBucket(dow) {
  return {
    dow,
    label: labelDow(dow),
    calendarOccurrences: 0,
    /** Occurrences complètes (hors journée courante incomplète). */
    eligibleOccurrences: 0,
    withAnyActivity: 0,
    withClassicExclusive: 0,
    withGtg: 0,
    withNeither: 0,
    incompleteCurrent: 0,
    nonReconstructiblePlan: 0,
    provenPlannedWorkout: 0,
    provenRest: 0,
    provenMissed: 0,
    provenPartialOrFull: 0,
    classicExclusiveRepsSum: 0,
    gtgNativeRepsSum: 0,
    activeClassicRepsList: [],
    dates: []
  };
}

/**
 * @param {object} snapshot
 * @param {{ start: string, end: string }} window
 * @param {{ todayYmd?: string|null, liveActiveProgram?: object|null, getExerciseNameById?: function|null }} [opts]
 */
export function buildP36OccasionTable(
  snapshot,
  window,
  {
    todayYmd = null,
    liveActiveProgram = null,
    getExerciseNameById = null,
    dayTableCache = null
  } = {}
) {
  const t0 =
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();

  const today =
    todayYmd ||
    (() => {
      const n = new Date();
      return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
    })();

  const p35 = buildP35DayTable(snapshot, window, {
    liveActiveProgram,
    getExerciseNameById,
    dayTableCache
  });
  const buckets = Array.from({ length: 7 }, (_, i) => emptyDowBucket(i));
  const days = p35.days || [];

  for (const day of days) {
    const dow = dowFromYmd(day.date);
    if (dow == null) continue;
    const b = buckets[dow];
    b.calendarOccurrences += 1;
    b.dates.push(day.date);

    const incomplete = day.date === today;
    if (incomplete) {
      b.incompleteCurrent += 1;
      // Ne pas compter comme occasion complète manquée.
      continue;
    }
    b.eligibleOccurrences += 1;

    const any =
      day.classic?.hasExclusiveActivity || day.gtg?.hasActivity || false;
    if (any) b.withAnyActivity += 1;
    if (day.classic?.hasExclusiveActivity) b.withClassicExclusive += 1;
    if (day.gtg?.hasActivity) b.withGtg += 1;
    if (day.coexistence?.neither) b.withNeither += 1;

    if (day.absenceKind === 'non_reconstructible_plan') {
      b.nonReconstructiblePlan += 1;
    }

    const proof = day.plan?.proof;
    const proven = proof === DAY_PLAN_PROOF.DEMONSTRATED && day.plan?.compareEligible;
    if (proven) {
      if (day.plan.plannedRest) b.provenRest += 1;
      else if ((day.plan.plannedCount || 0) > 0) {
        b.provenPlannedWorkout += 1;
        const realized = day.plan.realizedCount || 0;
        const partial = day.plan.partialCount || 0;
        const planned = day.plan.plannedCount || 0;
        if (realized + partial > 0 || (planned > 0 && realized === planned)) {
          b.provenPartialOrFull += 1;
        }
        if (
          planned > 0 &&
          realized === 0 &&
          (day.plan.notRealizedCount || 0) === planned
        ) {
          // missed counted via absenceKind elsewhere; track via planned - partialOrFull
        }
      }
    }

    const exclusive = Number(day.classic?.classicExclusiveReps) || 0;
    const gtgReps = Number(day.classic?.gtgNativeReps ?? day.gtg?.doneReps) || 0;
    b.classicExclusiveRepsSum += exclusive;
    b.gtgNativeRepsSum += gtgReps;
    if (day.classic?.hasExclusiveActivity && exclusive > 0) {
      b.activeClassicRepsList.push(exclusive);
    }
  }

  const rows = buckets.map((b) => {
    const rateAny =
      b.eligibleOccurrences > 0
        ? Math.round((b.withAnyActivity / b.eligibleOccurrences) * 1000) / 10
        : null;
    const rateClassic =
      b.eligibleOccurrences > 0
        ? Math.round((b.withClassicExclusive / b.eligibleOccurrences) * 1000) / 10
        : null;
    const rateGtg =
      b.eligibleOccurrences > 0
        ? Math.round((b.withGtg / b.eligibleOccurrences) * 1000) / 10
        : null;
    const meanRepsPerActive =
      b.activeClassicRepsList.length > 0
        ? Math.round(
            (b.activeClassicRepsList.reduce((a, x) => a + x, 0) /
              b.activeClassicRepsList.length) *
              10
          ) / 10
        : null;
    const meanRepsPerEligible =
      b.eligibleOccurrences > 0
        ? Math.round((b.classicExclusiveRepsSum / b.eligibleOccurrences) * 10) / 10
        : null;
    const provenAdherenceRate =
      b.provenPlannedWorkout > 0
        ? Math.round((b.provenPartialOrFull / b.provenPlannedWorkout) * 1000) / 10
        : null;

    return {
      ...b,
      rateAnyActivityPct: rateAny,
      rateClassicPct: rateClassic,
      rateGtgPct: rateGtg,
      meanClassicRepsPerActiveDay: meanRepsPerActive,
      meanClassicRepsPerEligibleDay: meanRepsPerEligible,
      provenAdherenceRatePct: provenAdherenceRate,
      denominators: {
        calendarOccurrences: b.calendarOccurrences,
        eligibleOccurrences: b.eligibleOccurrences,
        provenPlannedWorkout: b.provenPlannedWorkout,
        note:
          'eligible = calendaire hors journée courante ; rates = actifs / eligible (pas / jours actifs seuls)'
      }
    };
  });

  const elapsed =
    (typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now()) - t0;

  return {
    window: p35.window,
    todayYmd: today,
    comparisonWindow: previousWindowEqualSpan(window),
    days: days,
    coverage: p35.coverage,
    byDow: rows,
    performance: { occasionMs: Math.round(elapsed * 100) / 100 }
  };
}

export { previousWindowEqualSpan as previousWindowP36 };
