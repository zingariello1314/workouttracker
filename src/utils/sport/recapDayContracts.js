/**
 * F2 — Contrats canoniques des journées / canaux d’activité.
 *
 * Ces ensembles ne sont PAS interchangeables. Ne pas libeller « journée entraînée »
 * sans préciser le prédicat.
 *
 * @see docs/analyses-documentation/moteur analyse v1/GLOSSAIRE-CANONIQUE-F2-2026-11-01.md
 */

import {
  dayCountsAsCalendarTrainingDay,
  dayHasRecordedReps,
  dayHasMomentumEnduranceSession,
  dayHasCircuitProgress,
  collectGarminTrainingDates
} from './recapTrainingDayTruth';
import {
  hasNonGtgMomentumWorkoutForDate,
  gtgAloneCountsAsTrainingDay
} from '../calendarGtgDay';
import { classicExclusiveRepsForDay, buildP35DayRecord } from './recapP35DayModel';
import { DAY_PLAN_PROOF } from '../programRevisionJournalP34';
import DateHelper from '../dateHelper';

/** Identifiants stables de prédicats (métriques / diagnostics). */
export const DAY_CONTRACT = Object.freeze({
  CIVIL: 'civil_window_day',
  /** Reps > 0 sur la date (inclut volume GTG synchronisé dans `reps`). = strengthDays. */
  POSITIVE_REPS: 'positive_reps_days',
  /** Séance classique hors GTG sync (hasNonGtgMomentumWorkoutForDate). */
  CLASSIC_NON_GTG: 'classic_non_gtg_workout_day',
  /** classicExclusiveReps > 0 (P3.5). */
  CLASSIC_EXCLUSIVE: 'classic_exclusive_reps_day',
  /** GTG actif (créneaux / activity) sans exiger 100 %. */
  GTG_ACTIVE: 'gtg_active_day',
  /** GTG 100 % seul, compte dans l’union calendrier. */
  GTG_ALONE_COMPLETE: 'gtg_alone_complete_calendar_day',
  ENDURANCE: 'endurance_session_day',
  CIRCUIT: 'circuit_progress_day',
  GARMIN_TRAINING: 'garmin_training_day',
  /**
   * Union calendrier Recap (= trainingDays via calendarLoad / countTrainingDaysInRange).
   * N’inclut PAS le GTG partiel syncé-only.
   */
  CALENDAR_TRAINING: 'calendar_training_union_day',
  MULTI_CHANNEL: 'multi_channel_active_day',
  PLAN_DEMONSTRATED: 'plan_historically_demonstrated_day',
  ADHERENCE_ELIGIBLE: 'adherence_compare_eligible_day'
});

export const DAY_CONTRACT_LABEL_FR = Object.freeze({
  [DAY_CONTRACT.CIVIL]: 'Journée civile de la fenêtre',
  [DAY_CONTRACT.POSITIVE_REPS]: 'Journée avec répétitions enregistrées (tous canaux reps)',
  [DAY_CONTRACT.CLASSIC_NON_GTG]: 'Journée avec séance classique hors sync GTG',
  [DAY_CONTRACT.CLASSIC_EXCLUSIVE]: 'Journée avec répétitions classiques exclusives',
  [DAY_CONTRACT.GTG_ACTIVE]: 'Journée GTG active',
  [DAY_CONTRACT.GTG_ALONE_COMPLETE]: 'Journée GTG seul (créneaux 100 %) comptée calendrier',
  [DAY_CONTRACT.ENDURANCE]: 'Journée endurance active',
  [DAY_CONTRACT.CIRCUIT]: 'Journée circuit',
  [DAY_CONTRACT.GARMIN_TRAINING]: 'Journée activité Garmin d’entraînement',
  [DAY_CONTRACT.CALENDAR_TRAINING]: 'Journée entraînée (union calendrier Recap)',
  [DAY_CONTRACT.MULTI_CHANNEL]: 'Journée multi-canaux',
  [DAY_CONTRACT.PLAN_DEMONSTRATED]: 'Journée à plan historiquement démontré',
  [DAY_CONTRACT.ADHERENCE_ELIGIBLE]: 'Journée éligible à une comparaison d’adhérence'
});

/**
 * Classification d’une date selon les prédicats F2 (sans inventer de données).
 * @returns {object}
 */
export function classifyRecapDay(snapshot, dateStr, garminData = null) {
  if (!dateStr) {
    return { date: null, flags: {}, channels: [], multiChannel: false };
  }
  const p35 = snapshot ? buildP35DayRecord(snapshot, dateStr) : null;
  const classicNonGtg = snapshot ? hasNonGtgMomentumWorkoutForDate(snapshot, dateStr) : false;
  const classicExclusive = (p35?.classic?.classicExclusiveReps || 0) > 0;
  const gtgActive = Boolean(p35?.gtg?.hasActivity);
  const gtgAloneComplete = snapshot ? gtgAloneCountsAsTrainingDay(snapshot, dateStr) : false;
  const endurance = snapshot ? dayHasMomentumEnduranceSession(snapshot, dateStr) : false;
  const circuit = snapshot ? dayHasCircuitProgress(snapshot, dateStr) : false;
  const positiveReps = snapshot ? dayHasRecordedReps(snapshot, dateStr) : false;
  let garmin = false;
  if (garminData) {
    garmin = collectGarminTrainingDates(garminData, snapshot).has(dateStr);
  }
  const calendar = snapshot
    ? dayCountsAsCalendarTrainingDay(snapshot, dateStr, garminData)
    : false;

  const channelFlags = {
    classicExclusive,
    classicNonGtg,
    gtg: gtgActive,
    endurance,
    circuit,
    garmin
  };
  const activeChannels = Object.entries(channelFlags)
    .filter(([, v]) => v)
    .map(([k]) => k);

  return {
    date: dateStr,
    flags: {
      [DAY_CONTRACT.POSITIVE_REPS]: positiveReps,
      [DAY_CONTRACT.CLASSIC_NON_GTG]: classicNonGtg,
      [DAY_CONTRACT.CLASSIC_EXCLUSIVE]: classicExclusive,
      [DAY_CONTRACT.GTG_ACTIVE]: gtgActive,
      [DAY_CONTRACT.GTG_ALONE_COMPLETE]: gtgAloneComplete,
      [DAY_CONTRACT.ENDURANCE]: endurance,
      [DAY_CONTRACT.CIRCUIT]: circuit,
      [DAY_CONTRACT.GARMIN_TRAINING]: garmin,
      [DAY_CONTRACT.CALENDAR_TRAINING]: calendar,
      [DAY_CONTRACT.MULTI_CHANNEL]: activeChannels.length >= 2,
      [DAY_CONTRACT.PLAN_DEMONSTRATED]: p35?.plan?.proof === DAY_PLAN_PROOF.DEMONSTRATED,
      [DAY_CONTRACT.ADHERENCE_ELIGIBLE]: Boolean(p35?.plan?.compareEligible)
    },
    coexistence: p35?.coexistence || null,
    classicExclusiveReps: p35?.classic?.classicExclusiveReps ?? null,
    channels: activeChannels,
    multiChannel: activeChannels.length >= 2
  };
}

/**
 * Union de journées actives (1 date = 1) + compteurs par canal.
 * Ne double-compte pas dans `unionDates`.
 */
export function summarizeChannelDaySets(snapshot, startYmd, endYmd, garminData = null) {
  const classicOnly = [];
  const gtgOnly = [];
  const enduranceOnly = [];
  const bothClassicGtg = [];
  const multi = [];
  const union = [];
  const positiveReps = [];
  const calendar = [];

  if (!snapshot || !startYmd || !endYmd) {
    return {
      classicOnly,
      gtgOnly,
      enduranceOnly,
      bothClassicGtg,
      multi,
      union,
      positiveReps,
      calendar
    };
  }

  for (const d of DateHelper.getDateRange(startYmd, endYmd)) {
    const row = classifyRecapDay(snapshot, d, garminData);
    if (row.flags[DAY_CONTRACT.POSITIVE_REPS]) positiveReps.push(d);
    if (row.flags[DAY_CONTRACT.CALENDAR_TRAINING]) calendar.push(d);

    const { classicExclusive, gtg, endurance } = {
      classicExclusive: row.flags[DAY_CONTRACT.CLASSIC_EXCLUSIVE],
      gtg: row.flags[DAY_CONTRACT.GTG_ACTIVE],
      endurance: row.flags[DAY_CONTRACT.ENDURANCE]
    };

    if (classicExclusive || gtg || endurance || row.flags[DAY_CONTRACT.CIRCUIT] || row.flags[DAY_CONTRACT.GARMIN_TRAINING]) {
      union.push(d);
    }
    if (row.multiChannel) multi.push(d);

    if (classicExclusive && !gtg) classicOnly.push(d);
    else if (gtg && !classicExclusive) gtgOnly.push(d);
    if (classicExclusive && gtg) bothClassicGtg.push(d);
    if (endurance && !classicExclusive && !gtg) enduranceOnly.push(d);
  }

  return {
    classicOnly,
    gtgOnly,
    enduranceOnly,
    bothClassicGtg,
    multi,
    union,
    positiveReps,
    calendar
  };
}

/**
 * Explique strengthDays (POSITIVE_REPS via measure) vs trainingDays (CALENDAR).
 * Ne corrige aucun compteur.
 */
export function explainStrengthVsCalendarTrainingGap(snapshot, window, garminData = null) {
  const start = window?.start;
  const end = window?.end;
  if (!snapshot || !start || !end) {
    return { ok: false, reason: 'missing_window', strengthOnly: [], calendarOnly: [], shared: [] };
  }
  const sets = summarizeChannelDaySets(snapshot, start, end, garminData);
  const strengthSet = new Set(sets.positiveReps);
  const calendarSet = new Set(sets.calendar);
  const strengthOnly = sets.positiveReps.filter((d) => !calendarSet.has(d));
  const calendarOnly = sets.calendar.filter((d) => !strengthSet.has(d));
  const shared = sets.positiveReps.filter((d) => calendarSet.has(d));

  const strengthOnlyDetail = strengthOnly.map((d) => {
    const row = classifyRecapDay(snapshot, d, garminData);
    const excl = classicExclusiveRepsForDay(snapshot, d);
    let cause = 'unknown';
    if (row.coexistence?.gtgOnly && !row.flags[DAY_CONTRACT.GTG_ALONE_COMPLETE]) {
      cause = 'gtg_synced_reps_without_calendar_credit';
    } else if (row.coexistence?.gtgOnly && row.flags[DAY_CONTRACT.GTG_ALONE_COMPLETE]) {
      cause = 'unexpected_gtg_alone_not_in_calendar';
    } else if (excl.classicExclusiveReps === 0 && excl.classicTotalReps > 0) {
      cause = 'reps_fully_attributed_to_gtg_sync';
    }
    return {
      date: d,
      cause,
      coexistence: row.coexistence,
      classicExclusiveReps: excl.classicExclusiveReps,
      classicTotalReps: excl.classicTotalReps,
      gtgSyncedReps: excl.gtgSyncedReps
    };
  });

  return {
    ok: true,
    contracts: {
      strengthDays: DAY_CONTRACT.POSITIVE_REPS,
      trainingDays: DAY_CONTRACT.CALENDAR_TRAINING
    },
    counts: {
      strengthDays: sets.positiveReps.length,
      trainingDays: sets.calendar.length,
      strengthOnly: strengthOnly.length,
      calendarOnly: calendarOnly.length,
      shared: shared.length
    },
    strengthOnly,
    calendarOnly,
    shared,
    strengthOnlyDetail,
    /** true = pas de bug d’inclusion (écart nul ou entièrement GTG sync partiel). */
    methodologicallyExpected:
      calendarOnly.length === 0 &&
      (strengthOnly.length === 0 ||
        strengthOnlyDetail.every(
          (x) =>
            x.cause === 'gtg_synced_reps_without_calendar_credit' ||
            x.cause === 'reps_fully_attributed_to_gtg_sync'
        ))
  };
}

/** Métadonnées à attacher aux mesures de fenêtre. */
export function dayContractMetaForMeasure() {
  return {
    strengthDays: {
      contractId: DAY_CONTRACT.POSITIVE_REPS,
      labelFr: DAY_CONTRACT_LABEL_FR[DAY_CONTRACT.POSITIVE_REPS]
    },
    trainingDays: {
      contractId: DAY_CONTRACT.CALENDAR_TRAINING,
      labelFr: DAY_CONTRACT_LABEL_FR[DAY_CONTRACT.CALENDAR_TRAINING]
    }
  };
}
