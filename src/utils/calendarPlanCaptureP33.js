/**
 * P3.3 — Capture historique du programme prévu, y compris sans activité.
 *
 * Principes :
 * - Un navigateur fermé n’exécute rien : capture à l’ouverture, au changement
 *   de jour, avant/après mutation de programme, et prévisions provisoires proches.
 * - `historical_frozen` est immuable (y compris snapshots P3.0 sans statut).
 * - `provisional_forecast` peut être rafraîchi tant que la date n’est pas passée.
 * - Absence de preuve ≠ zéro exercice prévu (→ indeterminate / unknown_historical).
 * - Repos prévu ≠ séance manquée.
 *
 * @module calendarPlanCaptureP33
 */

import DateHelper from './dateHelper';
import {
  buildDayPlanSnapshotFromExercises,
  getDayPlanSnapshot,
  hasPerformanceKeysForDate,
  withDayPlanSnapshot
} from './calendarDayPlanSnapshot';

export const P33_PROVENANCE_VERSION = 'p33.v1';

/** Statut de la preuve de plan. */
export const SNAPSHOT_STATUS = Object.freeze({
  HISTORICAL_FROZEN: 'historical_frozen',
  PROVISIONAL_FORECAST: 'provisional_forecast',
  INDETERMINATE: 'indeterminate'
});

/**
 * Applicabilité du programme au contenu figé.
 * - proven : démontrée (perf, seal avant mutation, capture explicite prouvée)
 * - unverified : contenu candidat (promote / backfill) — pas de preuve d’absence de mutation
 * Ne jamais déduire « proven » de la seule absence de journal de mutations.
 */
export const APPLICABILITY_CONFIDENCE = Object.freeze({
  PROVEN: 'proven',
  UNVERIFIED: 'unverified'
});

/** Nature du jour prévu. */
export const PLAN_DAY_KIND = Object.freeze({
  PLANNED_WORKOUT: 'planned_workout',
  PLANNED_REST: 'planned_rest',
  NO_PROGRAM: 'no_program',
  UNKNOWN_HISTORICAL: 'unknown_historical',
  RECONSTRUCT_ONLY: 'reconstruct_only'
});

/** Déclencheur de capture. */
export const CAPTURE_TRIGGER = Object.freeze({
  PERFORMANCE: 'performance',
  CALENDAR_SAVE: 'calendar_save',
  APP_OPEN_BACKFILL: 'app_open_backfill',
  DAY_BOUNDARY_PROMOTE: 'day_boundary_promote',
  PROACTIVE_FORECAST: 'proactive_forecast',
  PROGRAM_CHANGE_SEAL: 'program_change_seal',
  EXPLICIT_CAPTURE: 'explicit_capture'
});

/** Horizon de prévision provisoire (jours futurs inclus today+1…). */
export const DEFAULT_PROVISIONAL_HORIZON_DAYS = 2;
/** Lookback max à sceller à l’ouverture (jours passés sans snapshot). */
export const DEFAULT_BACKFILL_LOOKBACK_DAYS = 14;

const PROVEN_TRIGGERS = new Set([
  CAPTURE_TRIGGER.PERFORMANCE,
  CAPTURE_TRIGGER.CALENDAR_SAVE,
  CAPTURE_TRIGGER.PROGRAM_CHANGE_SEAL,
  CAPTURE_TRIGGER.EXPLICIT_CAPTURE
]);

/**
 * Snapshots P3.0 sans champs P3.3 = preuves historiques déjà figées.
 * @param {object|null} snap
 */
export function isHistoricalFrozenSnapshot(snap) {
  if (!snap || typeof snap !== 'object') return false;
  if (snap.reconstructed === true || String(snap.programId || '') === 'reconstructed') {
    return false;
  }
  if (snap.status === SNAPSHOT_STATUS.PROVISIONAL_FORECAST) return false;
  if (snap.status === SNAPSHOT_STATUS.INDETERMINATE) return false;
  // Legacy sans status, ou status historical_frozen
  return snap.status == null || snap.status === SNAPSHOT_STATUS.HISTORICAL_FROZEN;
}

export function isProvisionalForecastSnapshot(snap) {
  return snap?.status === SNAPSHOT_STATUS.PROVISIONAL_FORECAST;
}

export function isIndeterminatePlanSnapshot(snap) {
  return (
    snap?.status === SNAPSHOT_STATUS.INDETERMINATE ||
    snap?.dayKind === PLAN_DAY_KIND.UNKNOWN_HISTORICAL
  );
}

/**
 * Résout la confiance d’applicabilité d’un snapshot.
 * Legacy P3.0 (sans status / sans champ) = proven (figé à la perf).
 */
export function resolveApplicabilityConfidence(snap) {
  if (!snap || typeof snap !== 'object') return null;
  if (
    snap.applicabilityConfidence === APPLICABILITY_CONFIDENCE.PROVEN ||
    snap.applicabilityConfidence === APPLICABILITY_CONFIDENCE.UNVERIFIED
  ) {
    return snap.applicabilityConfidence;
  }
  if (isIndeterminatePlanSnapshot(snap) || isProvisionalForecastSnapshot(snap)) {
    return null;
  }
  if (!isHistoricalFrozenSnapshot(snap)) return null;
  // Legacy sans status P3.3, ou déclencheurs démontrables
  if (snap.status == null || PROVEN_TRIGGERS.has(snap.captureTrigger)) {
    return APPLICABILITY_CONFIDENCE.PROVEN;
  }
  return APPLICABILITY_CONFIDENCE.UNVERIFIED;
}

/** Eligible dénominateur adhérence / skips / plan×muscle. */
export function isPlanCompareEligible(snap) {
  return (
    isHistoricalFrozenSnapshot(snap) &&
    resolveApplicabilityConfidence(snap) === APPLICABILITY_CONFIDENCE.PROVEN
  );
}

/**
 * Annote un snapshot d’exercices avec la provenance P3.3.
 */
export function withPlanProvenance(
  baseSnapshot,
  {
    status = SNAPSHOT_STATUS.HISTORICAL_FROZEN,
    dayKind = PLAN_DAY_KIND.PLANNED_WORKOUT,
    captureTrigger = CAPTURE_TRIGGER.EXPLICIT_CAPTURE,
    plannedRest = false,
    programIdentity = null,
    localDate = null,
    capturedAt = null,
    suppressedExerciseIds = null,
    dailyVariationNote = null,
    applicabilityConfidence = null
  } = {}
) {
  const dateStr = localDate || baseSnapshot?.dateStr || null;
  const exercises = Array.isArray(baseSnapshot?.exercises) ? baseSnapshot.exercises : [];
  let kind = dayKind;
  if (plannedRest || kind === PLAN_DAY_KIND.PLANNED_REST) {
    kind = PLAN_DAY_KIND.PLANNED_REST;
  } else if (kind === PLAN_DAY_KIND.NO_PROGRAM) {
    kind = PLAN_DAY_KIND.NO_PROGRAM;
  } else if (exercises.length > 0) {
    kind = PLAN_DAY_KIND.PLANNED_WORKOUT;
  }

  let confidence = applicabilityConfidence;
  if (status === SNAPSHOT_STATUS.INDETERMINATE || status === SNAPSHOT_STATUS.PROVISIONAL_FORECAST) {
    confidence = null;
  } else if (
    confidence !== APPLICABILITY_CONFIDENCE.PROVEN &&
    confidence !== APPLICABILITY_CONFIDENCE.UNVERIFIED
  ) {
    if (PROVEN_TRIGGERS.has(captureTrigger) && status === SNAPSHOT_STATUS.HISTORICAL_FROZEN) {
      confidence = APPLICABILITY_CONFIDENCE.PROVEN;
    } else if (status === SNAPSHOT_STATUS.HISTORICAL_FROZEN) {
      confidence = APPLICABILITY_CONFIDENCE.UNVERIFIED;
    } else {
      confidence = null;
    }
  }

  return {
    ...baseSnapshot,
    dateStr,
    capturedAt: capturedAt || baseSnapshot?.capturedAt || new Date().toISOString(),
    exercises,
    status,
    dayKind: kind,
    captureTrigger,
    plannedRest: kind === PLAN_DAY_KIND.PLANNED_REST,
    frozen: status === SNAPSHOT_STATUS.HISTORICAL_FROZEN,
    provisional: status === SNAPSHOT_STATUS.PROVISIONAL_FORECAST,
    programIdentity: programIdentity || baseSnapshot?.programId || null,
    suppressedExerciseIds: Array.isArray(suppressedExerciseIds)
      ? suppressedExerciseIds.map(String)
      : baseSnapshot?.suppressedExerciseIds || null,
    dailyVariationNote: dailyVariationNote || baseSnapshot?.dailyVariationNote || null,
    applicabilityConfidence: confidence,
    planCompareEligible:
      status === SNAPSHOT_STATUS.HISTORICAL_FROZEN &&
      confidence === APPLICABILITY_CONFIDENCE.PROVEN,
    provenanceVersion: P33_PROVENANCE_VERSION
  };
}

/**
 * Construit un snapshot prévu sans exiger d’activité.
 *
 * @param {object} opts
 * @param {string} opts.dateStr
 * @param {object[]} [opts.exercises]
 * @param {'planned_workout'|'planned_rest'|'no_program'|'unknown_historical'} opts.dayKind
 * @param {'historical_frozen'|'provisional_forecast'|'indeterminate'} opts.status
 * @param {string} opts.captureTrigger
 */
export function buildPlannedDaySnapshot({
  dateStr,
  exercises = [],
  programId = null,
  variant = null,
  combinedDays = null,
  dayKind = PLAN_DAY_KIND.PLANNED_WORKOUT,
  status = SNAPSHOT_STATUS.HISTORICAL_FROZEN,
  captureTrigger = CAPTURE_TRIGGER.EXPLICIT_CAPTURE,
  suppressedExerciseIds = null,
  dailyVariationNote = null,
  programIdentity = null,
  applicabilityConfidence = null
} = {}) {
  if (!dateStr) return null;

  if (dayKind === PLAN_DAY_KIND.UNKNOWN_HISTORICAL) {
    return withPlanProvenance(
      {
        dateStr,
        capturedAt: new Date().toISOString(),
        programId: null,
        variant: null,
        combinedDays: null,
        exercises: []
      },
      {
        status: SNAPSHOT_STATUS.INDETERMINATE,
        dayKind: PLAN_DAY_KIND.UNKNOWN_HISTORICAL,
        captureTrigger,
        localDate: dateStr,
        applicabilityConfidence: null
      }
    );
  }

  const base =
    dayKind === PLAN_DAY_KIND.PLANNED_REST || dayKind === PLAN_DAY_KIND.NO_PROGRAM
      ? {
          dateStr,
          capturedAt: new Date().toISOString(),
          programId: programId || null,
          variant: variant || null,
          combinedDays: Array.isArray(combinedDays) ? combinedDays : null,
          exercises: []
        }
      : buildDayPlanSnapshotFromExercises({
          dateStr,
          exercises,
          programId,
          variant,
          combinedDays
        });

  return withPlanProvenance(base, {
    status,
    dayKind,
    captureTrigger,
    plannedRest: dayKind === PLAN_DAY_KIND.PLANNED_REST,
    programIdentity: programIdentity || programId,
    localDate: dateStr,
    suppressedExerciseIds,
    dailyVariationNote,
    applicabilityConfidence
  });
}

/**
 * Écrit un snapshot seulement si autorisé (idempotent, non rétroactif).
 * - historical existant → no-op
 * - provisional existant + nouveau provisional → refresh autorisé
 * - provisional + nouveau historical → promote/replace
 */
export function writeDayPlanSnapshotIfAllowed(workoutData, dateStr, snapshot) {
  if (!dateStr || !snapshot) {
    return { workoutData: workoutData || {}, wrote: false, reason: 'invalid_args' };
  }
  const existing = workoutData?.calendarDayPlanSnapshots?.[dateStr] || null;

  if (existing && isHistoricalFrozenSnapshot(existing)) {
    return { workoutData: workoutData || {}, wrote: false, reason: 'historical_immutable' };
  }

  if (
    existing &&
    isProvisionalForecastSnapshot(existing) &&
    snapshot.status === SNAPSHOT_STATUS.PROVISIONAL_FORECAST
  ) {
    // Refresh prevision
    return {
      workoutData: withDayPlanSnapshot(workoutData, dateStr, snapshot),
      wrote: true,
      reason: 'provisional_refreshed'
    };
  }

  if (existing && isProvisionalForecastSnapshot(existing) && isHistoricalFrozenSnapshot(snapshot)) {
    return {
      workoutData: withDayPlanSnapshot(workoutData, dateStr, snapshot),
      wrote: true,
      reason: 'provisional_promoted'
    };
  }

  if (existing && isIndeterminatePlanSnapshot(existing) && isHistoricalFrozenSnapshot(snapshot)) {
    return {
      workoutData: withDayPlanSnapshot(workoutData, dateStr, snapshot),
      wrote: true,
      reason: 'indeterminate_replaced_by_proof'
    };
  }

  if (existing && !isProvisionalForecastSnapshot(existing) && !isIndeterminatePlanSnapshot(existing)) {
    // Legacy-ish but treated frozen
    return { workoutData: workoutData || {}, wrote: false, reason: 'existing_preserved' };
  }

  return {
    workoutData: withDayPlanSnapshot(workoutData, dateStr, snapshot),
    wrote: true,
    reason: existing ? 'replaced_non_frozen' : 'created'
  };
}

/**
 * Capture une journée prévue sans activité (cœur P3.3).
 *
 * @param {object} workoutData
 * @param {string} dateStr
 * @param {object} intent — résultat de résolution programme pour cette date
 * @param {object[]} [intent.exercises]
 * @param {string|null} [intent.programId]
 * @param {string|null} [intent.variant]
 * @param {boolean} [intent.isRestDay]
 * @param {boolean} [intent.hasActiveProgram]
 * @param {string} [captureTrigger]
 * @param {'historical_frozen'|'provisional_forecast'} [status]
 */
export function capturePlannedDayWithoutActivity(
  workoutData,
  dateStr,
  intent = {},
  {
    captureTrigger = CAPTURE_TRIGGER.EXPLICIT_CAPTURE,
    status = SNAPSHOT_STATUS.HISTORICAL_FROZEN,
    applicabilityConfidence = null
  } = {}
) {
  if (!dateStr) {
    return { workoutData: workoutData || {}, wrote: false, reason: 'no_date', snapshot: null };
  }

  const existing = getDayPlanSnapshot(workoutData, dateStr);
  if (existing && isHistoricalFrozenSnapshot(existing)) {
    return {
      workoutData: workoutData || {},
      wrote: false,
      reason: 'historical_immutable',
      snapshot: existing
    };
  }

  const isRest = Boolean(intent.isRestDay);
  const hasProgram = intent.hasActiveProgram !== false && intent.programId != null;
  const exercises = Array.isArray(intent.exercises) ? intent.exercises : [];

  let dayKind = PLAN_DAY_KIND.PLANNED_WORKOUT;
  if (isRest) dayKind = PLAN_DAY_KIND.PLANNED_REST;
  else if (!hasProgram) dayKind = PLAN_DAY_KIND.NO_PROGRAM;
  else if (exercises.length === 0) dayKind = PLAN_DAY_KIND.NO_PROGRAM;

  let confidence = applicabilityConfidence;
  if (
    confidence !== APPLICABILITY_CONFIDENCE.PROVEN &&
    confidence !== APPLICABILITY_CONFIDENCE.UNVERIFIED
  ) {
    if (intent.applicabilityConfidence === APPLICABILITY_CONFIDENCE.PROVEN) {
      confidence = APPLICABILITY_CONFIDENCE.PROVEN;
    } else if (intent.applicabilityConfidence === APPLICABILITY_CONFIDENCE.UNVERIFIED) {
      confidence = APPLICABILITY_CONFIDENCE.UNVERIFIED;
    } else if (intent.programApplicabilityProven === true) {
      confidence = APPLICABILITY_CONFIDENCE.PROVEN;
    } else {
      confidence = null;
    }
  }

  // Historique figé sans confiance → indeterminate (pas le programme actuel collé en « high »).
  // unverified : contenu candidat admissible à conserver, jamais dénominateur d’adhérence.
  if (status === SNAPSHOT_STATUS.HISTORICAL_FROZEN && !confidence) {
    const unknown = buildPlannedDaySnapshot({
      dateStr,
      dayKind: PLAN_DAY_KIND.UNKNOWN_HISTORICAL,
      status: SNAPSHOT_STATUS.INDETERMINATE,
      captureTrigger
    });
    const res = writeDayPlanSnapshotIfAllowed(workoutData, dateStr, unknown);
    return { ...res, snapshot: unknown };
  }

  const snap = buildPlannedDaySnapshot({
    dateStr,
    exercises: isRest ? [] : exercises,
    programId: intent.programId || null,
    variant: intent.variant || null,
    combinedDays: intent.combinedDays || null,
    dayKind,
    status,
    captureTrigger,
    suppressedExerciseIds: intent.suppressedExerciseIds || null,
    dailyVariationNote: intent.dailyVariationNote || null,
    programIdentity: intent.programIdentity || intent.programId || null,
    applicabilityConfidence:
      status === SNAPSHOT_STATUS.PROVISIONAL_FORECAST ? null : confidence
  });

  const res = writeDayPlanSnapshotIfAllowed(workoutData, dateStr, snap);
  return { ...res, snapshot: snap };
}

function enumerateYmds(startYmd, endYmd) {
  if (!startYmd || !endYmd || startYmd > endYmd) return [];
  const out = [];
  let cur = startYmd;
  while (cur <= endYmd) {
    out.push(cur);
    cur = DateHelper.addDays(cur, 1);
  }
  return out;
}

/**
 * Promote les prévisions dont la date est strictement avant today → historical_frozen.
 * Conserve le contenu ; n’accorde jamais `proven` / high par le seul passage de minuit.
 * Une prévision sans seal préalable reste `unverified` (ineligible adhérence).
 */
export function promoteDueProvisionalForecasts(workoutData, todayYmd) {
  if (!todayYmd) {
    return { workoutData: workoutData || {}, promoted: [] };
  }
  let data = workoutData || {};
  const bag = data.calendarDayPlanSnapshots || {};
  const promoted = [];

  for (const [dateStr, snap] of Object.entries(bag)) {
    if (!isProvisionalForecastSnapshot(snap)) continue;
    if (dateStr >= todayYmd) continue;
    const priorConfidence = resolveApplicabilityConfidence(snap);
    const frozen = withPlanProvenance(snap, {
      status: SNAPSHOT_STATUS.HISTORICAL_FROZEN,
      dayKind: snap.dayKind || PLAN_DAY_KIND.PLANNED_WORKOUT,
      captureTrigger: CAPTURE_TRIGGER.DAY_BOUNDARY_PROMOTE,
      plannedRest: Boolean(snap.plannedRest),
      programIdentity: snap.programIdentity || snap.programId,
      localDate: dateStr,
      capturedAt: snap.capturedAt,
      suppressedExerciseIds: snap.suppressedExerciseIds,
      dailyVariationNote: snap.dailyVariationNote,
      // Promote ≠ preuve d’applicabilité. Seul un seal/perf préalable peut garder proven.
      applicabilityConfidence:
        priorConfidence === APPLICABILITY_CONFIDENCE.PROVEN
          ? APPLICABILITY_CONFIDENCE.PROVEN
          : APPLICABILITY_CONFIDENCE.UNVERIFIED
    });
    data = withDayPlanSnapshot(data, dateStr, frozen);
    promoted.push(dateStr);
  }
  return { workoutData: data, promoted };
}

/**
 * Réconciliation à l’ouverture de l’app (seul mécanisme fiable hors service worker).
 *
 * @param {object} workoutData
 * @param {object} opts
 * @param {string} opts.todayYmd — date locale
 * @param {(dateStr: string) => object} opts.resolveIntent — retourne intent programme pour la date
 * @param {number} [opts.backfillLookbackDays]
 * @param {number} [opts.provisionalHorizonDays]
 */
export function reconcilePlanCaptureOnAppOpen(
  workoutData,
  {
    todayYmd,
    resolveIntent,
    backfillLookbackDays = DEFAULT_BACKFILL_LOOKBACK_DAYS,
    provisionalHorizonDays = DEFAULT_PROVISIONAL_HORIZON_DAYS
  } = {}
) {
  if (!todayYmd || typeof resolveIntent !== 'function') {
    return {
      workoutData: workoutData || {},
      promoted: [],
      sealed: [],
      forecasted: [],
      skipped: ['missing_today_or_resolver']
    };
  }

  let data = workoutData || {};
  const promote = promoteDueProvisionalForecasts(data, todayYmd);
  data = promote.workoutData;

  const sealed = [];
  const skipped = [];
  const startPast = DateHelper.addDays(todayYmd, -Math.max(1, backfillLookbackDays));
  const yesterday = DateHelper.addDays(todayYmd, -1);

  for (const dateStr of enumerateYmds(startPast, yesterday)) {
    const existing = getDayPlanSnapshot(data, dateStr);
    if (existing && isHistoricalFrozenSnapshot(existing)) {
      skipped.push({ dateStr, reason: 'already_frozen' });
      continue;
    }
    const intent = resolveIntent(dateStr) || {};
    const proven =
      intent.programApplicabilityProven === true ||
      intent.applicabilityConfidence === APPLICABILITY_CONFIDENCE.PROVEN;
    // Hier sans preuve démontrée : contenu candidat unverified — jamais high par proximité.
    // Plus ancien sans preuve : indeterminate (P3.4 pour révisions).
    const isRecentCandidate = dateStr >= yesterday;
    let confidence = null;
    if (proven) confidence = APPLICABILITY_CONFIDENCE.PROVEN;
    else if (isRecentCandidate) confidence = APPLICABILITY_CONFIDENCE.UNVERIFIED;

    const res = capturePlannedDayWithoutActivity(
      data,
      dateStr,
      {
        ...intent,
        programApplicabilityProven: proven,
        applicabilityConfidence: confidence
      },
      {
        captureTrigger: CAPTURE_TRIGGER.APP_OPEN_BACKFILL,
        status: SNAPSHOT_STATUS.HISTORICAL_FROZEN,
        applicabilityConfidence: confidence
      }
    );
    data = res.workoutData;
    if (res.wrote) sealed.push({ dateStr, reason: res.reason, dayKind: res.snapshot?.dayKind });
    else skipped.push({ dateStr, reason: res.reason });
  }

  const forecasted = [];
  const forecastEnd = DateHelper.addDays(todayYmd, Math.max(0, provisionalHorizonDays));
  for (const dateStr of enumerateYmds(todayYmd, forecastEnd)) {
    const existing = getDayPlanSnapshot(data, dateStr);
    if (existing && isHistoricalFrozenSnapshot(existing)) {
      skipped.push({ dateStr, reason: 'forecast_blocked_by_historical' });
      continue;
    }
    const intent = resolveIntent(dateStr) || {};
    const res = capturePlannedDayWithoutActivity(data, dateStr, intent, {
      captureTrigger: CAPTURE_TRIGGER.PROACTIVE_FORECAST,
      status: SNAPSHOT_STATUS.PROVISIONAL_FORECAST
    });
    data = res.workoutData;
    if (res.wrote) forecasted.push({ dateStr, reason: res.reason });
  }

  return {
    workoutData: data,
    promoted: promote.promoted,
    sealed,
    forecasted,
    skipped
  };
}

/**
 * Avant un changement de programme : scelle aujourd’hui et les jours passés récents
 * encore provisoires / absents, avec le programme **courant** (preuve d’applicabilité).
 * Seul chemin qui promeut `proven` hors perf / sauvegarde calendrier.
 */
export function sealPlanBeforeProgramChange(
  workoutData,
  { todayYmd, resolveIntent, sealPastDays = 3 } = {}
) {
  if (!todayYmd || typeof resolveIntent !== 'function') {
    return { workoutData: workoutData || {}, sealed: [] };
  }
  let data = workoutData || {};
  const sealed = [];
  const start = DateHelper.addDays(todayYmd, -Math.max(0, sealPastDays));
  for (const dateStr of enumerateYmds(start, todayYmd)) {
    const existing = getDayPlanSnapshot(data, dateStr);
    if (existing && isHistoricalFrozenSnapshot(existing)) {
      // Upgrade unverified → proven uniquement si contenu déjà figé sous l’ancien programme
      // et qu’on scelle explicitement avant mutation (même contenu, confiance démontrée).
      if (
        resolveApplicabilityConfidence(existing) === APPLICABILITY_CONFIDENCE.UNVERIFIED &&
        existing.captureTrigger !== CAPTURE_TRIGGER.PERFORMANCE
      ) {
        const upgraded = withPlanProvenance(existing, {
          status: SNAPSHOT_STATUS.HISTORICAL_FROZEN,
          dayKind: existing.dayKind || PLAN_DAY_KIND.PLANNED_WORKOUT,
          captureTrigger: CAPTURE_TRIGGER.PROGRAM_CHANGE_SEAL,
          plannedRest: Boolean(existing.plannedRest),
          programIdentity: existing.programIdentity || existing.programId,
          localDate: dateStr,
          capturedAt: existing.capturedAt,
          suppressedExerciseIds: existing.suppressedExerciseIds,
          dailyVariationNote: existing.dailyVariationNote,
          applicabilityConfidence: APPLICABILITY_CONFIDENCE.PROVEN
        });
        data = withDayPlanSnapshot(data, dateStr, upgraded);
        sealed.push(dateStr);
      }
      continue;
    }
    const intent = {
      ...(resolveIntent(dateStr) || {}),
      programApplicabilityProven: true,
      applicabilityConfidence: APPLICABILITY_CONFIDENCE.PROVEN
    };
    const res = capturePlannedDayWithoutActivity(data, dateStr, intent, {
      captureTrigger: CAPTURE_TRIGGER.PROGRAM_CHANGE_SEAL,
      status: SNAPSHOT_STATUS.HISTORICAL_FROZEN,
      applicabilityConfidence: APPLICABILITY_CONFIDENCE.PROVEN
    });
    data = res.workoutData;
    if (res.wrote) sealed.push(dateStr);
  }
  // Prévisions futures basées sur l’ancien programme → à rafraîchir après mutation
  const cleared = clearFutureProvisionalForecasts(data, todayYmd);
  return { workoutData: cleared.workoutData, sealed, clearedForecasts: cleared.cleared };
}

/**
 * Supprime les prévisions provisoires ≥ today (obsolètes après changement de programme).
 */
export function clearFutureProvisionalForecasts(workoutData, todayYmd) {
  if (!todayYmd) {
    return { workoutData: workoutData || {}, cleared: [] };
  }
  const bag = { ...(workoutData?.calendarDayPlanSnapshots || {}) };
  const cleared = [];
  for (const [dateStr, snap] of Object.entries(bag)) {
    if (dateStr < todayYmd) continue;
    if (!isProvisionalForecastSnapshot(snap)) continue;
    delete bag[dateStr];
    cleared.push(dateStr);
  }
  if (!cleared.length) {
    return { workoutData: workoutData || {}, cleared };
  }
  return {
    workoutData: { ...(workoutData || {}), calendarDayPlanSnapshots: bag },
    cleared
  };
}

/**
 * Vue provenance pour analyses / UI.
 */
export function describeDayPlanProvenance(workoutData, dateStr) {
  const snap = getDayPlanSnapshot(workoutData, dateStr);
  if (!snap) {
    const hasPerf = hasPerformanceKeysForDate(workoutData, dateStr);
    return {
      dateStr,
      planSource: hasPerf ? 'reconstruct_possible' : 'none',
      status: hasPerf ? SNAPSHOT_STATUS.INDETERMINATE : SNAPSHOT_STATUS.INDETERMINATE,
      dayKind: hasPerf ? PLAN_DAY_KIND.RECONSTRUCT_ONLY : PLAN_DAY_KIND.UNKNOWN_HISTORICAL,
      frozen: false,
      provisional: false,
      capturedAt: null,
      programId: null,
      programIdentity: null,
      plannedExerciseCount: 0,
      plannedRest: false,
      compareReliability: hasPerf ? 'realized_only' : 'none',
      snapshot: null
    };
  }

  const frozen = isHistoricalFrozenSnapshot(snap);
  const provisional = isProvisionalForecastSnapshot(snap);
  const indeterminate = isIndeterminatePlanSnapshot(snap);
  const reconstruct = snap.reconstructed === true || String(snap.programId || '') === 'reconstructed';
  const applicabilityConfidence = resolveApplicabilityConfidence(snap);
  const compareEligible = isPlanCompareEligible(snap);

  let compareReliability = 'none';
  if (reconstruct) compareReliability = 'realized_only';
  else if (provisional) compareReliability = 'provisional';
  else if (indeterminate) compareReliability = 'none';
  else if (compareEligible) compareReliability = 'high';
  else if (frozen && applicabilityConfidence === APPLICABILITY_CONFIDENCE.UNVERIFIED) {
    compareReliability = 'unverified';
  }

  return {
    dateStr,
    planSource: reconstruct
      ? 'reconstruct'
      : provisional
        ? 'provisional_forecast'
        : indeterminate
          ? 'indeterminate'
          : compareEligible
            ? 'snapshot'
            : 'historical_unverified',
    status: reconstruct
      ? SNAPSHOT_STATUS.INDETERMINATE
      : snap.status || SNAPSHOT_STATUS.HISTORICAL_FROZEN,
    dayKind: reconstruct
      ? PLAN_DAY_KIND.RECONSTRUCT_ONLY
      : snap.dayKind ||
        (snap.plannedRest
          ? PLAN_DAY_KIND.PLANNED_REST
          : (snap.exercises || []).length
            ? PLAN_DAY_KIND.PLANNED_WORKOUT
            : PLAN_DAY_KIND.NO_PROGRAM),
    frozen,
    provisional,
    capturedAt: snap.capturedAt || null,
    captureTrigger: snap.captureTrigger || null,
    programId: snap.programId || null,
    programIdentity: snap.programIdentity || snap.programId || null,
    plannedExerciseCount: Array.isArray(snap.exercises) ? snap.exercises.length : 0,
    plannedRest: Boolean(snap.plannedRest || snap.dayKind === PLAN_DAY_KIND.PLANNED_REST),
    suppressedExerciseIds: snap.suppressedExerciseIds || null,
    applicabilityConfidence,
    planCompareEligible: compareEligible,
    compareReliability,
    provenanceVersion: snap.provenanceVersion || null,
    snapshot: snap
  };
}

/**
 * Annoter ensureDayPlanSnapshot (perf) avec provenance historical.
 * À utiliser après construction d’un snapshot « classique ».
 */
export function stampPerformanceCapture(snapshot, { programId = null } = {}) {
  if (!snapshot) return null;
  return withPlanProvenance(snapshot, {
    status: SNAPSHOT_STATUS.HISTORICAL_FROZEN,
    dayKind:
      (snapshot.exercises || []).length > 0
        ? PLAN_DAY_KIND.PLANNED_WORKOUT
        : PLAN_DAY_KIND.NO_PROGRAM,
    captureTrigger: CAPTURE_TRIGGER.PERFORMANCE,
    programIdentity: programId || snapshot.programId,
    localDate: snapshot.dateStr,
    applicabilityConfidence: APPLICABILITY_CONFIDENCE.PROVEN
  });
}

const WEEK_DAYS_FR = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi'
];

function dayNameFromYmd(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d);
  return WEEK_DAYS_FR[dt.getDay()] || null;
}

/**
 * Intent de capture depuis programme actif + variations (sans React).
 *
 * @param {object} opts
 * @param {string} opts.dateStr
 * @param {object|null} opts.activeProgram
 * @param {object|null} opts.workoutData
 * @param {object[]} [opts.exercises] — liste live déjà résolue (prioritaire)
 * @param {string|null} [opts.effectiveRestDay] — nom du jour de repos effectif
 * @param {boolean} [opts.programApplicabilityProven]
 */
export function buildCaptureIntentFromProgram({
  dateStr,
  activeProgram = null,
  workoutData = null,
  exercises = null,
  effectiveRestDay = null,
  programApplicabilityProven = false,
  variant = null
} = {}) {
  const dayName = dayNameFromYmd(dateStr);
  const isRest =
    Boolean(effectiveRestDay) && dayName && String(effectiveRestDay) === String(dayName);

  const dv = workoutData?.dailyVariations?.[dateStr] || null;
  const suppressed = Array.isArray(dv?.suppressedExercises)
    ? dv.suppressedExercises.map(String)
    : null;

  let list = Array.isArray(exercises) ? exercises : null;
  if (!list && activeProgram?.schedule && dayName && !isRest) {
    const slot = activeProgram.schedule[dayName];
    const raw = Array.isArray(slot?.exercises)
      ? slot.exercises
      : Array.isArray(slot?.maison?.exercises)
        ? slot.maison.exercises
        : [];
    list = raw.map((ex, i) => ({
      id: ex.id ?? ex.storageId ?? `ex_${i}`,
      originalId: ex.originalId ?? ex.id,
      name: ex.name || `Exercice ${i + 1}`,
      series: ex.series || '',
      type: ex.type,
      materiel: ex.materiel,
      notes: ex.notes,
      rest: ex.rest,
      intensity: ex.intensity
    }));
  }
  if (!list) list = [];

  // Appliquer suppressions quotidiennes établies
  if (suppressed?.length) {
    list = list.filter((ex) => {
      const id = String(ex.id ?? ex.originalId ?? ex.storageId ?? '');
      return !suppressed.includes(id) && !suppressed.includes(String(ex.originalId ?? ''));
    });
  }

  return {
    exercises: isRest ? [] : list,
    programId: activeProgram?.id ?? null,
    programIdentity: activeProgram?.id ?? null,
    variant: variant || null,
    isRestDay: isRest,
    hasActiveProgram: Boolean(activeProgram?.id),
    programApplicabilityProven,
    suppressedExerciseIds: suppressed,
    dailyVariationNote: suppressed?.length
      ? `suppressed:${suppressed.length}`
      : null,
    combinedDays: null
  };
}
