/**
 * P3.0 — Socle Adhérence × Progression
 *
 * Matrice planifié × réalisé par jour calendaire.
 * Aucune prose, aucune carte, aucun finding éditorial dans ce lot.
 *
 * Règles d’or :
 * - snapshot = seule source fiable du plan passé
 * - reconstruct = réalisé seulement, jamais le prévu
 * - live = jamais vérité historique
 * - non coché ≠ oublié automatique
 * - ne jamais mélanger sources dans un même taux
 *
 * @module recapProgramAdherenceProgression
 */

import {
  getDayPlanSnapshot,
  hasPerformanceKeysForDate,
  parseDateStorageKey,
  resolveExercisesForCalendarDate,
  snapshotExercisesToDisplayList
} from '../calendarDayPlanSnapshot.js';
import { collectCalendarRepKeysForExercise } from '../exerciseKeyGenerator.js';
import { parseSeriesSetCount } from '../exerciseLoadVolume.js';
import { gtgDayHasCompletedMiniSet } from '../calendarGtgDay.js';
import { buildGtgDayPlan, normalizeGtgData } from '../../services/endurance/gtgService.js';
import { resolveGtgWorkoutStorageKey } from '../../services/endurance/gtgWorkoutSync.js';
import { enumerateDatesInclusive } from './dailyDenseTimeSeries.js';

/** @typedef {'snapshot'|'reconstruct'|'live'|'none'} PlanSource */
/** @typedef {'high'|'realized_only'|'provisional'|'none'} Reliability */
/** @typedef {'known'|'unknown'|'provisional_live'|'empty'} PlanKnowledge */
/**
 * @typedef {'realized'|'partially_realized'|'not_realized'|'suppressed'|'supplemental'|'indeterminate'} RealizationStatus
 */

export const PLAN_SOURCE = Object.freeze({
  SNAPSHOT: 'snapshot',
  RECONSTRUCT: 'reconstruct',
  LIVE: 'live',
  NONE: 'none'
});

export const RELIABILITY = Object.freeze({
  HIGH: 'high',
  REALIZED_ONLY: 'realized_only',
  PROVISIONAL: 'provisional',
  NONE: 'none'
});

export const PLAN_KNOWLEDGE = Object.freeze({
  KNOWN: 'known',
  UNKNOWN: 'unknown',
  PROVISIONAL_LIVE: 'provisional_live',
  EMPTY: 'empty'
});

export const REALIZATION = Object.freeze({
  REALIZED: 'realized',
  PARTIALLY_REALIZED: 'partially_realized',
  NOT_REALIZED: 'not_realized',
  SUPPRESSED: 'suppressed',
  SUPPLEMENTAL: 'supplemental',
  INDETERMINATE: 'indeterminate'
});

/**
 * @param {PlanSource} source
 * @param {{ hasPlanList: boolean, hasActivity: boolean }} ctx
 */
export function classifyPlanMeta(source, { hasPlanList, hasActivity }) {
  if (source === PLAN_SOURCE.SNAPSHOT) {
    return {
      planSource: PLAN_SOURCE.SNAPSHOT,
      reliability: RELIABILITY.HIGH,
      planKnowledge: hasPlanList ? PLAN_KNOWLEDGE.KNOWN : PLAN_KNOWLEDGE.EMPTY
    };
  }
  if (source === PLAN_SOURCE.RECONSTRUCT) {
    return {
      planSource: PLAN_SOURCE.RECONSTRUCT,
      reliability: RELIABILITY.REALIZED_ONLY,
      planKnowledge: PLAN_KNOWLEDGE.UNKNOWN
    };
  }
  if (source === PLAN_SOURCE.LIVE) {
    return {
      planSource: PLAN_SOURCE.LIVE,
      reliability: RELIABILITY.PROVISIONAL,
      planKnowledge: hasPlanList ? PLAN_KNOWLEDGE.PROVISIONAL_LIVE : PLAN_KNOWLEDGE.EMPTY
    };
  }
  return {
    planSource: PLAN_SOURCE.NONE,
    reliability: RELIABILITY.NONE,
    planKnowledge: hasActivity ? PLAN_KNOWLEDGE.UNKNOWN : PLAN_KNOWLEDGE.EMPTY
  };
}

/**
 * Identité stable pour dédoublonnage (réutilise id / originalId / storageId).
 * @param {object} exercise
 * @returns {string}
 */
export function exerciseMatchKey(exercise) {
  if (!exercise || typeof exercise !== 'object') return '';
  const candidates = [
    exercise.originalId,
    exercise.storageId,
    exercise.id,
    exercise.exerciseId
  ];
  for (const c of candidates) {
    if (c == null || c === '') continue;
    return String(c);
  }
  return '';
}

/**
 * @param {object} workoutData
 * @param {string} dateStr
 * @param {object} exercise
 */
export function inspectExerciseExecution(workoutData, dateStr, exercise) {
  const keys = collectCalendarRepKeysForExercise(dateStr, exercise);
  const checkedBag = workoutData?.checkedExercises || {};
  const repsBag = workoutData?.reps || {};
  const setLogs = workoutData?.exerciseSetLogs || {};

  let checked = false;
  let totalReps = 0;
  let setCountObserved = 0;
  let structuredSets = false;
  /** @type {string|null} */
  let matchedKey = null;
  /** @type {'none'|'semaineA'|'semaineB'} */
  let variantHint = 'none';

  for (const key of keys) {
    if (checkedBag[key] === true) {
      checked = true;
      matchedKey = matchedKey || key;
    }
    const rawReps = repsBag[key];
    const n = Math.max(0, parseInt(String(rawReps ?? ''), 10) || 0);
    if (n > 0) {
      totalReps = Math.max(totalReps, n);
      matchedKey = matchedKey || key;
    }
    const log = setLogs[key];
    if (Array.isArray(log?.sets) && log.sets.length > 0) {
      const filled = log.sets.filter((s) => (Number(s?.reps) || 0) > 0).length;
      if (filled > setCountObserved) {
        setCountObserved = filled;
        structuredSets = true;
        matchedKey = matchedKey || key;
      }
    }
    if (key.endsWith('_semaineA') && (checkedBag[key] === true || n > 0)) variantHint = 'semaineA';
    if (key.endsWith('_semaineB') && (checkedBag[key] === true || n > 0)) variantHint = 'semaineB';
  }

  const seriesOverride =
    workoutData?.dailyVariations?.[dateStr]?.exerciseSeriesOverrides?.[
      String(exercise?.id ?? exercise?.originalId ?? '')
    ] ||
    workoutData?.dailyVariations?.[dateStr]?.exerciseSeriesOverrides?.[
      String(exercise?.originalId ?? '')
    ] ||
    null;

  const plannedSeries = String(seriesOverride || exercise?.series || '').trim();
  const plannedSets = parseSeriesSetCount(plannedSeries);

  const hasReps = totalReps > 0;
  const hasSets = setCountObserved > 0;
  return {
    keys,
    matchedKey,
    checked,
    totalReps,
    setCountObserved,
    structuredSets,
    plannedSeries,
    plannedSets,
    variantHint,
    hasReps,
    hasSets,
    /** Coche sans volume — exécution affirmée par l’utilisateur, détails absents */
    checkedOnly: checked && !hasReps && !hasSets,
    hasAnySignal: checked || hasReps || hasSets
  };
}

/**
 * Classification d’un exercice planifié (jamais « oublié » automatique).
 * @param {ReturnType<typeof inspectExerciseExecution>} exec
 * @param {{ suppressed: boolean }} opts
 * @returns {{ status: RealizationStatus, gapKind: string|null, partialReason: string|null }}
 */
export function classifyPlannedExerciseRealization(exec, { suppressed }) {
  if (suppressed) {
    return {
      status: REALIZATION.SUPPRESSED,
      gapKind: 'explicit_suppression',
      partialReason: null
    };
  }
  if (!exec?.hasAnySignal) {
    return {
      status: REALIZATION.NOT_REALIZED,
      gapKind: 'unchecked',
      partialReason: null
    };
  }

  const plannedSets = exec.plannedSets;
  const observedSets = exec.setCountObserved;

  if (
    plannedSets != null &&
    plannedSets > 1 &&
    exec.structuredSets &&
    observedSets > 0 &&
    observedSets < plannedSets
  ) {
    return {
      status: REALIZATION.PARTIALLY_REALIZED,
      gapKind: 'partial_sets',
      partialReason: `sets_${observedSets}_of_${plannedSets}`
    };
  }

  if (!exec.checked && exec.hasAnySignal) {
    return {
      status: REALIZATION.PARTIALLY_REALIZED,
      gapKind: 'uncchecked_with_data',
      partialReason: 'reps_or_sets_without_check'
    };
  }

  if (exec.checked) {
    return {
      status: REALIZATION.REALIZED,
      gapKind: null,
      partialReason: null
    };
  }

  return {
    status: REALIZATION.INDETERMINATE,
    gapKind: 'ambiguous_signal',
    partialReason: null
  };
}

/**
 * Collecte les storageIds touchés le jour (hors complementary).
 * @param {object} workoutData
 * @param {string} dateStr
 * @returns {Set<string>}
 */
export function collectTouchedStorageIds(workoutData, dateStr) {
  const out = new Set();
  const prefix = `${dateStr}_`;
  const bags = [
    workoutData?.checkedExercises,
    workoutData?.reps,
    workoutData?.exerciseSetLogs,
    workoutData?.exerciseWeights
  ];
  for (const bag of bags) {
    if (!bag || typeof bag !== 'object') continue;
    for (const [key, val] of Object.entries(bag)) {
      if (!key.startsWith(prefix)) continue;
      if (val === undefined || val === null || val === false || val === '') continue;
      const parsed = parseDateStorageKey(key);
      if (!parsed?.storageId || parsed.storageId.startsWith('complementary_')) continue;
      out.add(String(parsed.storageId));
    }
  }
  return out;
}

/**
 * Snapshot persistant issu d’une reconstruction de clés = réalisé, pas plan historique.
 * (ensureReconstructedDayPlanSnapshot pose `reconstructed: true` / programId `reconstructed`.)
 * @param {object|null} snap
 */
export function isReconstructedPlanSnapshot(snap) {
  if (!snap || typeof snap !== 'object') return false;
  if (snap.reconstructed === true) return true;
  if (String(snap.programId || '') === 'reconstructed') return true;
  return false;
}

/**
 * Exposition GTG du jour (canal séparé de la séance classique).
 * @param {object} workoutData
 * @param {string} dateStr
 */
export function buildDayGtgExposure(workoutData, dateStr) {
  const hasActivity = gtgDayHasCompletedMiniSet(workoutData, dateStr);
  if (!hasActivity) {
    return {
      hasActivity: false,
      exerciseIds: [],
      doneMiniSets: 0,
      plannedMiniSets: 0
    };
  }
  const gtg = normalizeGtgData(workoutData?.enduranceData?.gtg);
  const plan = buildGtgDayPlan(gtg, dateStr, { workoutData });
  const exerciseIds = (plan?.exercisePlans || [])
    .filter((ep) => (ep.completedCount || 0) > 0 || (ep.slots || []).some((s) => s.done))
    .map((ep) => String(ep.exerciseId));
  return {
    hasActivity: true,
    exerciseIds: [...new Set(exerciseIds)],
    doneMiniSets: Number(plan?.doneMiniSets) || 0,
    plannedMiniSets: Number(plan?.plannedMiniSets) || 0,
    donePlannedMiniSets: Number(plan?.donePlannedMiniSets) || 0
  };
}

/**
 * Résout le plan du jour en lecture seule (n’écrit jamais de snapshot).
 * @param {object} opts
 */
export function resolveDayPlanReadOnly({
  dateStr,
  workoutData,
  liveExercises = [],
  getExerciseNameById = null
}) {
  const existing = getDayPlanSnapshot(workoutData, dateStr);
  if (existing) {
    // Ne jamais promouvoir un snapshot reconstruit en vérité de plan.
    if (isReconstructedPlanSnapshot(existing)) {
      return {
        exercises: snapshotExercisesToDisplayList(existing),
        source: PLAN_SOURCE.RECONSTRUCT,
        snapshot: existing,
        variant: existing.variant || null,
        programId: 'reconstructed'
      };
    }
    return {
      exercises: snapshotExercisesToDisplayList(existing),
      source: PLAN_SOURCE.SNAPSHOT,
      snapshot: existing,
      variant: existing.variant || null,
      programId: existing.programId || null
    };
  }

  if (hasPerformanceKeysForDate(workoutData, dateStr)) {
    const resolved = resolveExercisesForCalendarDate({
      dateStr,
      workoutData,
      liveExercises: [],
      getExerciseNameById
    });
    if (resolved.source === 'reconstruct') {
      return {
        exercises: resolved.exercises,
        source: PLAN_SOURCE.RECONSTRUCT,
        snapshot: resolved.snapshot,
        variant: null,
        programId: 'reconstructed'
      };
    }
  }

  const liveList = Array.isArray(liveExercises) ? liveExercises : [];
  if (liveList.length > 0) {
    return {
      exercises: liveList,
      source: PLAN_SOURCE.LIVE,
      snapshot: null,
      variant: null,
      programId: null
    };
  }

  // resolveExercisesForCalendarDate avec live vide → live []
  return {
    exercises: [],
    source: hasPerformanceKeysForDate(workoutData, dateStr)
      ? PLAN_SOURCE.RECONSTRUCT
      : PLAN_SOURCE.NONE,
    snapshot: null,
    variant: null,
    programId: null
  };
}

/**
 * Construit la ligne matrice pour une date.
 * @param {object} opts
 */
export function buildDayPlanRealizationRow({
  dateStr,
  workoutData = null,
  liveExercises = [],
  getExerciseNameById = null
}) {
  const data = workoutData || {};
  const dv = data.dailyVariations?.[dateStr] || null;
  const suppressedRaw = Array.isArray(dv?.suppressedExercises) ? dv.suppressedExercises : [];
  const suppressedSet = new Set(suppressedRaw.map((id) => String(id)));
  const additionalRaw = Array.isArray(dv?.additionalExercises) ? dv.additionalExercises : [];

  const plan = resolveDayPlanReadOnly({
    dateStr,
    workoutData: data,
    liveExercises,
    getExerciseNameById
  });

  const classicActivity = hasPerformanceKeysForDate(data, dateStr);
  const gtg = buildDayGtgExposure(data, dateStr);
  const hasActivity = classicActivity || gtg.hasActivity;

  const meta = classifyPlanMeta(plan.source, {
    hasPlanList: plan.exercises.length > 0,
    hasActivity
  });

  /** @type {object[]} */
  const planned = [];
  /** @type {object[]} */
  const realized = [];
  /** @type {object[]} */
  const partiallyRealized = [];
  /** @type {object[]} */
  const notRealized = [];
  /** @type {object[]} */
  const suppressed = [];
  /** @type {object[]} */
  const supplemental = [];
  /** @type {object[]} */
  const gaps = [];

  const plannedMatchKeys = new Set();
  const countedMatchKeys = new Set();

  const canAssertPlannedVsDone = meta.planSource === PLAN_SOURCE.SNAPSHOT;

  // ── Snapshot : seul cas où « prévu » est affirmable ───────────────────────
  if (canAssertPlannedVsDone) {
    for (const ex of plan.exercises) {
      const matchKey = exerciseMatchKey(ex);
      if (matchKey && countedMatchKeys.has(matchKey)) continue;
      if (matchKey) countedMatchKeys.add(matchKey);
      if (matchKey) plannedMatchKeys.add(matchKey);

      const idStr = String(ex.id ?? ex.originalId ?? '');
      const isSuppressed =
        suppressedSet.has(idStr) ||
        suppressedSet.has(String(ex.originalId ?? '')) ||
        suppressedSet.has(String(ex.storageId ?? ''));

      const exec = inspectExerciseExecution(data, dateStr, ex);
      const classification = classifyPlannedExerciseRealization(exec, {
        suppressed: isSuppressed
      });

      const entry = {
        matchKey,
        id: ex.id ?? null,
        originalId: ex.originalId ?? null,
        name: ex.name || '',
        series: exec.plannedSeries || ex.series || '',
        status: classification.status,
        gapKind: classification.gapKind,
        partialReason: classification.partialReason,
        checked: exec.checked,
        totalReps: exec.totalReps,
        setCountObserved: exec.setCountObserved,
        plannedSets: exec.plannedSets,
        variantHint: exec.variantHint,
        channel: 'classic',
        executionSignals: {
          checked: exec.checked,
          hasReps: exec.hasReps,
          hasSets: exec.hasSets,
          checkedOnly: exec.checkedOnly
        }
      };

      planned.push(entry);

      if (classification.status === REALIZATION.SUPPRESSED) {
        suppressed.push(entry);
        gaps.push({ kind: 'suppressed', matchKey, name: entry.name });
      } else if (classification.status === REALIZATION.REALIZED) {
        realized.push(entry);
      } else if (classification.status === REALIZATION.PARTIALLY_REALIZED) {
        partiallyRealized.push(entry);
        gaps.push({
          kind: classification.gapKind || 'partial',
          matchKey,
          name: entry.name,
          detail: classification.partialReason
        });
      } else if (classification.status === REALIZATION.NOT_REALIZED) {
        notRealized.push(entry);
        gaps.push({ kind: 'not_realized', matchKey, name: entry.name });
      }
    }

    for (const add of additionalRaw) {
      const matchKey = exerciseMatchKey(add) || `additional_${add?.id ?? add?.name ?? ''}`;
      if (matchKey && countedMatchKeys.has(matchKey)) continue;
      if (matchKey) countedMatchKeys.add(matchKey);
      const exec = inspectExerciseExecution(data, dateStr, add);
      const entry = {
        matchKey,
        id: add.id ?? null,
        originalId: add.originalId ?? add.id ?? null,
        name: add.name || 'Exercice exceptionnel',
        series: add.series || '',
        status: REALIZATION.SUPPLEMENTAL,
        gapKind: 'declared_additional',
        partialReason: null,
        checked: exec.checked || add.completed === true,
        totalReps: exec.totalReps,
        setCountObserved: exec.setCountObserved,
        plannedSets: null,
        variantHint: exec.variantHint,
        channel: 'classic',
        isExceptional: true
      };
      supplemental.push(entry);
      gaps.push({ kind: 'supplemental_declared', matchKey, name: entry.name });
    }

    const touched = collectTouchedStorageIds(data, dateStr);
    for (const storageId of touched) {
      if (plannedMatchKeys.has(storageId) || countedMatchKeys.has(storageId)) continue;
      countedMatchKeys.add(storageId);
      const stub = {
        id: /^\d+$/.test(storageId) ? Number(storageId) : storageId,
        originalId: storageId,
        name:
          typeof getExerciseNameById === 'function'
            ? getExerciseNameById(storageId) ||
              getExerciseNameById(Number(storageId)) ||
              `Exercice ${storageId}`
            : `Exercice ${storageId}`
      };
      const exec = inspectExerciseExecution(data, dateStr, stub);
      if (!exec.hasAnySignal) continue;
      const entry = {
        matchKey: storageId,
        id: stub.id,
        originalId: storageId,
        name: stub.name,
        series: '',
        status: REALIZATION.SUPPLEMENTAL,
        gapKind: 'off_plan_touch',
        partialReason: null,
        checked: exec.checked,
        totalReps: exec.totalReps,
        setCountObserved: exec.setCountObserved,
        plannedSets: null,
        variantHint: exec.variantHint,
        channel: 'classic',
        isExceptional: false
      };
      supplemental.push(entry);
      gaps.push({ kind: 'supplemental_off_plan', matchKey: storageId, name: entry.name });
    }

    // Remplacement : jamais affirmé — signal faible seulement.
    if (notRealized.length > 0 && supplemental.length > 0) {
      gaps.push({
        kind: 'possible_replacement_unconfirmed',
        matchKey: null,
        name: null,
        detail: 'not_realized_and_supplemental_same_day'
      });
    }
  }

  // ── Reconstruct : réalisé seulement (jamais « prévu ») ────────────────────
  if (meta.planSource === PLAN_SOURCE.RECONSTRUCT) {
    const seen = new Set();
    for (const ex of plan.exercises) {
      const matchKey = exerciseMatchKey(ex);
      if (matchKey && seen.has(matchKey)) continue;
      if (matchKey) seen.add(matchKey);
      const exec = inspectExerciseExecution(data, dateStr, ex);
      const entry = {
        matchKey,
        id: ex.id ?? null,
        originalId: ex.originalId ?? null,
        name: ex.name || '',
        series: ex.series || '',
        status: exec.hasAnySignal ? REALIZATION.REALIZED : REALIZATION.INDETERMINATE,
        gapKind: 'reconstruct_no_plan',
        partialReason: null,
        checked: exec.checked,
        totalReps: exec.totalReps,
        setCountObserved: exec.setCountObserved,
        plannedSets: null,
        variantHint: exec.variantHint,
        channel: 'classic'
      };
      if (exec.hasAnySignal) realized.push(entry);
    }
    gaps.push({ kind: 'plan_unknown', matchKey: null, name: null });
  }

  // ── Live : liste provisional, jamais dénominateur d’adhérence ─────────────
  if (meta.planSource === PLAN_SOURCE.LIVE) {
    for (const ex of plan.exercises) {
      const matchKey = exerciseMatchKey(ex);
      if (matchKey && countedMatchKeys.has(matchKey)) continue;
      if (matchKey) countedMatchKeys.add(matchKey);
      const exec = inspectExerciseExecution(data, dateStr, ex);
      planned.push({
        matchKey,
        id: ex.id ?? null,
        originalId: ex.originalId ?? null,
        name: ex.name || '',
        series: ex.series || '',
        status: REALIZATION.INDETERMINATE,
        gapKind: 'plan_not_historical',
        partialReason: null,
        checked: exec.checked,
        totalReps: exec.totalReps,
        setCountObserved: exec.setCountObserved,
        plannedSets: parseSeriesSetCount(ex.series || ''),
        variantHint: exec.variantHint,
        channel: 'classic',
        provisional: true
      });
    }
    gaps.push({ kind: 'plan_provisional_live', matchKey: null, name: null });
  }

  const missingDataFlags = [];
  if (meta.planSource === PLAN_SOURCE.LIVE) {
    missingDataFlags.push('plan_live_not_historical');
  }
  if (meta.planSource === PLAN_SOURCE.RECONSTRUCT) {
    missingDataFlags.push('plan_unknown_reconstruct_only');
  }
  if (meta.planSource === PLAN_SOURCE.NONE && !hasActivity) {
    missingDataFlags.push('no_activity_no_snapshot');
  }
  if (canAssertPlannedVsDone) {
    for (const entry of planned) {
      if (
        entry.status === REALIZATION.NOT_REALIZED &&
        entry.plannedSets == null &&
        !(entry.series || '').trim()
      ) {
        missingDataFlags.push(`series_unknown:${entry.matchKey}`);
      }
    }
  }

  /**
   * Deux dénominateurs (snapshot uniquement) :
   * - initial  : programme figé tel quel (suppressions encore dans le dénominateur)
   * - adjusted : après suppressions explicites (défaut d’adhérence, aligné completion)
   * Les suppressions restent toujours dans suppressedExercises / gaps.
   */
  const initialPlannedCount = canAssertPlannedVsDone ? planned.length : 0;
  const adjustedPlannedCount = canAssertPlannedVsDone
    ? planned.filter((p) => p.status !== REALIZATION.SUPPRESSED).length
    : 0;
  const denominator = {
    usableForAdherenceRate: canAssertPlannedVsDone && adjustedPlannedCount > 0,
    planSourceRequired: PLAN_SOURCE.SNAPSHOT,
    /** @deprecated alias → adjusted.plannedCount (compat P3.0 initial) */
    plannedCount: adjustedPlannedCount,
    realizedCount: realized.length,
    partiallyRealizedCount: partiallyRealized.length,
    notRealizedCount: notRealized.length,
    suppressedCount: suppressed.length,
    supplementalCount: supplemental.length,
    primary: 'adjusted',
    initial: {
      plannedCount: initialPlannedCount,
      realizedCount: realized.length,
      partiallyRealizedCount: partiallyRealized.length,
      notRealizedCount: notRealized.length,
      suppressedCount: suppressed.length,
      usable: canAssertPlannedVsDone && initialPlannedCount > 0
    },
    adjusted: {
      plannedCount: adjustedPlannedCount,
      realizedCount: realized.length,
      partiallyRealizedCount: partiallyRealized.length,
      notRealizedCount: notRealized.length,
      suppressedCount: suppressed.length,
      usable: canAssertPlannedVsDone && adjustedPlannedCount > 0
    },
    /** Ne jamais agréger avec d’autres sources */
    adherenceBucket: canAssertPlannedVsDone ? 'snapshot' : `exclude:${meta.planSource}`
  };

  // Chevauchement GTG × classique via clés de stockage (ex. pullups → 101).
  const classicIds = new Set();
  for (const list of [planned, realized, supplemental]) {
    for (const e of list) {
      if (e?.id != null) classicIds.add(String(e.id));
      if (e?.originalId != null) classicIds.add(String(e.originalId));
      if (e?.matchKey) classicIds.add(String(e.matchKey));
    }
  }
  const gtgConfig = normalizeGtgData(data?.enduranceData?.gtg)?.config || {};
  const gtgOverlapIds = [];
  const exclusiveGtgIds = [];
  for (const gtgId of gtg.exerciseIds || []) {
    const storageKey = resolveGtgWorkoutStorageKey(dateStr, gtgId, gtgConfig);
    const storageId = storageKey.startsWith(`${dateStr}_`)
      ? storageKey.slice(dateStr.length + 1)
      : String(gtgId);
    if (classicIds.has(String(gtgId)) || classicIds.has(storageId)) {
      gtgOverlapIds.push(String(gtgId));
    } else {
      exclusiveGtgIds.push(String(gtgId));
    }
  }
  const gtgEnriched = {
    ...gtg,
    overlapWithClassicIds: gtgOverlapIds,
    exclusiveGtgIds
  };

  return {
    date: dateStr,
    planSource: meta.planSource,
    reliability: meta.reliability,
    planKnowledge: meta.planKnowledge,
    programId: plan.programId,
    variant: plan.variant,
    hasClassicActivity: classicActivity,
    hasGtgActivity: gtg.hasActivity,
    gtg: gtgEnriched,
    plannedExercises: planned,
    realizedExercises: realized,
    partiallyRealizedExercises: partiallyRealized,
    notRealizedExercises: notRealized,
    suppressedExercises: suppressed,
    supplementalExercises: supplemental,
    gaps,
    missingDataFlags: [...new Set(missingDataFlags)],
    denominator
  };
}

/**
 * Matrice sur une fenêtre calendaire.
 * Les taux d’adhérence ne sont calculés que sur le sous-ensemble snapshot.
 *
 * @param {object} opts
 * @param {object} opts.workoutData
 * @param {{ start: string, end: string }} opts.window
 * @param {Record<string, object[]>|((dateStr: string) => object[])} [opts.liveExercisesByDate]
 * @param {function} [opts.getExerciseNameById]
 */
export function buildPlanRealizationMatrix({
  workoutData = null,
  window = null,
  liveExercisesByDate = null,
  getExerciseNameById = null
} = {}) {
  const start = window?.start;
  const end = window?.end;
  if (!start || !end || start > end) {
    return {
      window: { start: start || null, end: end || null },
      days: [],
      byReliability: emptyReliabilityBuckets(),
      adherenceSnapshotOnly: emptyAdherenceSummary(),
      limits: ['invalid_window']
    };
  }

  const dates = enumerateDatesInclusive(start, end);
  const days = dates.map((dateStr) => {
    let live = [];
    if (typeof liveExercisesByDate === 'function') {
      live = liveExercisesByDate(dateStr) || [];
    } else if (liveExercisesByDate && typeof liveExercisesByDate === 'object') {
      live = liveExercisesByDate[dateStr] || [];
    }
    return buildDayPlanRealizationRow({
      dateStr,
      workoutData,
      liveExercises: live,
      getExerciseNameById
    });
  });

  const byReliability = emptyReliabilityBuckets();
  for (const day of days) {
    byReliability[day.reliability].push(day.date);
  }

  const snapshotDays = days.filter((d) => d.planSource === PLAN_SOURCE.SNAPSHOT);
  let adjustedPlanned = 0;
  let initialPlanned = 0;
  let realizedSlots = 0;
  let partialSlots = 0;
  let notRealizedSlots = 0;
  let suppressedSlots = 0;
  for (const day of snapshotDays) {
    initialPlanned += day.denominator.initial?.plannedCount || 0;
    suppressedSlots += day.denominator.suppressedCount || 0;
    if (!day.denominator.adjusted?.usable && !day.denominator.usableForAdherenceRate) continue;
    adjustedPlanned += day.denominator.adjusted?.plannedCount ?? day.denominator.plannedCount;
    realizedSlots += day.denominator.realizedCount;
    partialSlots += day.denominator.partiallyRealizedCount;
    notRealizedSlots += day.denominator.notRealizedCount;
  }

  const adherenceSnapshotOnly = {
    dayCount: snapshotDays.length,
    primary: 'adjusted',
    plannedSlots: adjustedPlanned,
    realizedSlots,
    partiallyRealizedSlots: partialSlots,
    notRealizedSlots,
    suppressedSlots,
    rateFull: adjustedPlanned > 0 ? round4(realizedSlots / adjustedPlanned) : null,
    rateIncludingPartial:
      adjustedPlanned > 0 ? round4((realizedSlots + partialSlots) / adjustedPlanned) : null,
    initial: {
      plannedSlots: initialPlanned,
      realizedSlots,
      partiallyRealizedSlots: partialSlots,
      notRealizedSlots,
      suppressedSlots,
      rateFull: initialPlanned > 0 ? round4(realizedSlots / initialPlanned) : null,
      rateIncludingPartial:
        initialPlanned > 0 ? round4((realizedSlots + partialSlots) / initialPlanned) : null
    },
    adjusted: {
      plannedSlots: adjustedPlanned,
      realizedSlots,
      partiallyRealizedSlots: partialSlots,
      notRealizedSlots,
      suppressedSlots,
      rateFull: adjustedPlanned > 0 ? round4(realizedSlots / adjustedPlanned) : null,
      rateIncludingPartial:
        adjustedPlanned > 0 ? round4((realizedSlots + partialSlots) / adjustedPlanned) : null
    },
    note:
      'Taux snapshot-only. primary=adjusted (après suppressions). initial conserve le plan figé complet ; suppressed jamais masqués.'
  };

  const limits = [];
  if (byReliability.provisional.length) {
    limits.push('live_days_excluded_from_adherence');
  }
  if (byReliability.realized_only.length) {
    limits.push('reconstruct_days_exclude_skip_detection');
  }
  if (!snapshotDays.length) {
    limits.push('no_snapshot_days_in_window');
  }

  return {
    window: { start, end },
    days,
    byReliability,
    adherenceSnapshotOnly,
    limits
  };
}

function emptyReliabilityBuckets() {
  return {
    high: [],
    realized_only: [],
    provisional: [],
    none: []
  };
}

function emptyAdherenceSummary() {
  const zeroBlock = {
    plannedSlots: 0,
    realizedSlots: 0,
    partiallyRealizedSlots: 0,
    notRealizedSlots: 0,
    suppressedSlots: 0,
    rateFull: null,
    rateIncludingPartial: null
  };
  return {
    dayCount: 0,
    primary: 'adjusted',
    plannedSlots: 0,
    realizedSlots: 0,
    partiallyRealizedSlots: 0,
    notRealizedSlots: 0,
    suppressedSlots: 0,
    rateFull: null,
    rateIncludingPartial: null,
    initial: { ...zeroBlock },
    adjusted: { ...zeroBlock },
    note:
      'Taux snapshot-only. primary=adjusted (après suppressions). initial conserve le plan figé complet ; suppressed jamais masqués.'
  };
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}
