/**
 * P3.5 — Représentation dérivée (non persistée) d’une journée :
 * plan historique × classique × GTG × ressenti.
 *
 * Réutilise P3.3/P3.4/P3.0 ; ne reconstruit pas un second journal de programmes.
 *
 * @module recapP35DayModel
 */

import DateHelper from '../dateHelper';
import { hasPerformanceKeysForDate } from '../calendarDayPlanSnapshot';
import { gtgDayHasCompletedMiniSet } from '../calendarGtgDay';
import { isSessionFeedbackFilled } from '../sessionFeedbackUtils';
import {
  DAY_PLAN_PROOF,
  resolveHistoricalDayPlanFromJournal
} from '../programRevisionJournalP34';
import {
  buildDayPlanRealizationRow,
  PLAN_SOURCE
} from './recapProgramAdherenceProgression';
import {
  buildGtgDayPlan,
  normalizeGtgData
} from '../../services/endurance/gtgService';
import {
  resolveGtgCanonicalExerciseId,
  resolveGtgWorkoutStorageKey,
  sumGtgRepsForExerciseOnDay
} from '../../services/endurance/gtgWorkoutSync';

export const P35_DAY_ABSENCE_KIND = Object.freeze({
  PLANNED_REST: 'planned_rest',
  PLANNED_MISSED: 'planned_missed',
  NO_ACTIVITY_UNKNOWN: 'no_activity_unknown',
  NON_RECONSTRUCTIBLE_PLAN: 'non_reconstructible_plan'
});

function enumerateYmds(start, end) {
  if (!start || !end || start > end) return [];
  const out = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = DateHelper.addDays(cur, 1);
  }
  return out;
}

function scaleField(fb, key) {
  const n = Number(fb?.[key]);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n > 10) return null;
  return n;
}

/**
 * Ressenti : échelle personnelle 1–10 (difficulte ≠ RPE standardisé ISO).
 */
export function extractDayFeedback(workoutData, dateStr) {
  const fb = workoutData?.sessionFeedbacks?.[dateStr] || null;
  if (!isSessionFeedbackFilled(fb)) {
    return {
      present: false,
      scale: 'session_feedback_1_10',
      difficulte: null,
      ressenti: null,
      motivation: null,
      notes: null,
      filled: false
    };
  }
  return {
    present: true,
    filled: true,
    scale: 'session_feedback_1_10',
    scaleNote: 'difficulte/ressenti = échelle app 1–10, pas un RPE compétition standardisé',
    difficulte: scaleField(fb, 'difficulte'),
    ressenti: scaleField(fb, 'ressenti'),
    motivation: scaleField(fb, 'motivation'),
    douleur: scaleField(fb, 'douleur'),
    notes:
      typeof fb.notes === 'string' && fb.notes.trim()
        ? fb.notes.trim().slice(0, 200)
        : null,
    raw: fb
  };
}

/**
 * Canal GTG du jour — volumes propres + lien identité classique.
 */
export function extractDayGtg(workoutData, dateStr) {
  const gtg = normalizeGtgData(workoutData?.enduranceData?.gtg);
  const hasActivity = gtgDayHasCompletedMiniSet(workoutData, dateStr);
  if (!hasActivity && !(gtg.config.selectedIds || []).length) {
    return {
      configured: false,
      hasActivity: false,
      plannedMiniSets: 0,
      doneMiniSets: 0,
      donePlannedMiniSets: 0,
      adHocDoneMiniSets: 0,
      doneReps: 0,
      exercises: [],
      planningHistoricalKnown: Boolean((gtg.config.selectedIds || []).length)
    };
  }

  const plan = buildGtgDayPlan(gtg, dateStr, { workoutData });
  const syncLedger =
    gtg.workoutSync?.[dateStr] && typeof gtg.workoutSync[dateStr] === 'object'
      ? gtg.workoutSync[dateStr]
      : {};
  const exercises = [];
  const seenGtgIds = new Set();

  for (const ep of plan?.exercisePlans || []) {
    const doneReps = (ep.slots || []).reduce(
      (s, slot) => (slot.done ? s + (Number(slot.reps) || 0) : s),
      0
    );
    const plannedReps = (ep.slots || []).reduce(
      (s, slot) => (slot.adHoc ? s : s + (Number(slot.reps) || 0)),
      0
    );
    const adHocDone = (ep.slots || []).filter((s) => s.adHoc && s.done).length;
    const plannedDone = (ep.slots || []).filter((s) => !s.adHoc && s.done).length;
    const canonicalId = resolveGtgCanonicalExerciseId(ep.exerciseId, gtg.config);
    const storageKey = resolveGtgWorkoutStorageKey(dateStr, ep.exerciseId, gtg.config);
    const syncedReps = Number(syncLedger[ep.exerciseId]) || 0;
    const syncedIntoClassic = syncedReps > 0;

    seenGtgIds.add(String(ep.exerciseId));
    if (doneReps <= 0 && plannedDone <= 0 && adHocDone <= 0 && syncedReps <= 0) {
      continue;
    }

    exercises.push({
      gtgExerciseId: String(ep.exerciseId),
      canonicalStorageId: String(canonicalId),
      storageKey,
      doneReps,
      plannedReps,
      plannedDoneSlots: plannedDone,
      adHocDoneSlots: adHocDone,
      syncedIntoClassic,
      /** Part injectée (ledger) — déduction classique uniquement via classicExclusiveRepsForDay. */
      syncedReps
    });
  }

  // Ledger orphelin (exo retiré de selectedIds mais sync encore présent).
  for (const [gtgId, raw] of Object.entries(syncLedger)) {
    if (seenGtgIds.has(String(gtgId))) continue;
    const syncedReps = Number(raw) || 0;
    if (syncedReps <= 0) continue;
    const canonicalId = resolveGtgCanonicalExerciseId(gtgId, gtg.config);
    exercises.push({
      gtgExerciseId: String(gtgId),
      canonicalStorageId: String(canonicalId),
      storageKey: resolveGtgWorkoutStorageKey(dateStr, gtgId, gtg.config),
      doneReps: 0,
      plannedReps: 0,
      plannedDoneSlots: 0,
      adHocDoneSlots: 0,
      syncedIntoClassic: true,
      syncedReps,
      ledgerOrphan: true
    });
  }

  return {
    configured: (gtg.config.selectedIds || []).length > 0,
    hasActivity: Boolean(hasActivity),
    plannedMiniSets: Number(plan?.plannedMiniSets) || 0,
    doneMiniSets: Number(plan?.doneMiniSets) || 0,
    donePlannedMiniSets: Number(plan?.donePlannedMiniSets) || 0,
    adHocDoneMiniSets: Number(plan?.adHocDoneMiniSets) || 0,
    doneReps: Number(plan?.doneReps) || 0,
    exercises,
    planningHistoricalKnown: Boolean((gtg.config.selectedIds || []).length),
    /** Config actuelle ≠ preuve que ce planning s’appliquait à une date ancienne. */
    planningProof: (gtg.config.selectedIds || []).length
      ? 'config_present_not_versioned'
      : 'none'
  };
}

/**
 * Volume classique exclusif = reps classiques moins la part GTG **réellement
 * injectée sur la même clé de stockage** (ledger `workoutSync`).
 *
 * Règles :
 * - Soustraction **par clé** (jamais totalJour − Σsync).
 * - Ledger absent / 0 → aucune soustraction.
 * - Sync > volume sur la clé → clamp à ce volume (exclusive=0 sur la clé), flag.
 * - Unités : **reps seulement** (pas de maintiens isométriques / secondes).
 * - Métrique combinée mouvement : s’abstenir si provenance non fiable.
 *
 * @returns {{
 *   classicTotalReps: number,
 *   gtgSyncedReps: number,
 *   classicExclusiveReps: number,
 *   gtgNativeReps: number,
 *   syncDeduction: object
 * }}
 */
export function classicExclusiveRepsForDay(workoutData, dateStr, gtgExtract = null) {
  const gtg = normalizeGtgData(workoutData?.enduranceData?.gtg);
  const dayLedger =
    gtg.workoutSync?.[dateStr] && typeof gtg.workoutSync[dateStr] === 'object'
      ? gtg.workoutSync[dateStr]
      : {};

  /** storageId → reps GTG injectées selon le ledger (même résolution que sync). */
  const syncedByStorageId = new Map();
  let ledgerTotal = 0;
  for (const [gtgId, raw] of Object.entries(dayLedger)) {
    const n = Number(raw) || 0;
    if (n <= 0) continue;
    ledgerTotal += n;
    const storageId = String(resolveGtgCanonicalExerciseId(gtgId, gtg.config));
    syncedByStorageId.set(
      storageId,
      (syncedByStorageId.get(storageId) || 0) + n
    );
  }

  const repsMap = workoutData?.reps || {};
  const prefix = `${dateStr}_`;
  let classicTotal = 0;
  let exclusive = 0;
  let deducted = 0;
  const clampedKeys = [];
  const perKey = [];

  for (const [key, raw] of Object.entries(repsMap)) {
    if (!key.startsWith(prefix)) continue;
    const n = parseInt(String(raw), 10);
    if (!Number.isFinite(n) || n <= 0) continue;
    classicTotal += n;
    const storageId = key.slice(prefix.length);
    const syncAmt = syncedByStorageId.get(String(storageId)) || 0;
    let take = syncAmt;
    if (syncAmt > n) {
      take = n;
      clampedKeys.push(String(storageId));
    }
    exclusive += n - take;
    deducted += take;
    if (syncAmt > 0 || n > 0) {
      perKey.push({
        storageId: String(storageId),
        classicReps: n,
        syncedReps: syncAmt,
        exclusiveReps: n - take,
        clamped: syncAmt > n
      });
    }
  }

  const gtgNativeReps = (gtgExtract?.exercises || []).reduce(
    (s, e) => s + (Number(e.doneReps) || 0),
    0
  );

  const reliable = clampedKeys.length === 0;
  return {
    classicTotalReps: classicTotal,
    /** Quantité effectivement retirée des clés classiques (≤ ledger, ≤ classic/clé). */
    gtgSyncedReps: deducted,
    classicExclusiveReps: exclusive,
    gtgNativeReps,
    unit: 'reps',
    syncDeduction: {
      method: 'per_storage_key_ledger',
      ledgerTotal,
      deducted,
      clampedKeys,
      /** false si sync > classic sur au moins une clé — métriques combinées doivent s’abstenir. */
      reliable,
      perKey,
      note:
        'Soustrait uniquement workoutSync[ymd][gtgId] sur la clé resolveGtgWorkoutStorageKey ; hors reps (isométriques) non concernés'
    }
  };
}

/**
 * Une journée P3.5 dérivée.
 */
export function buildP35DayRecord(
  workoutData,
  dateStr,
  { liveActiveProgram = null, getExerciseNameById = null } = {}
) {
  const hist = resolveHistoricalDayPlanFromJournal(workoutData, dateStr, {
    liveActiveProgram
  });
  const row = buildDayPlanRealizationRow({
    dateStr,
    workoutData,
    getExerciseNameById
  });
  const gtg = extractDayGtg(workoutData, dateStr);
  const feedback = extractDayFeedback(workoutData, dateStr);
  const volumes = classicExclusiveRepsForDay(workoutData, dateStr, gtg);
  const classicActivity = hasPerformanceKeysForDate(workoutData, dateStr);
  // classicActivity peut inclure reps sync GTG — « classic only » = exclusive > 0
  const hasClassicExclusive = volumes.classicExclusiveReps > 0;
  const hasGtg = gtg.hasActivity;

  let absenceKind = null;
  if (!hasClassicExclusive && !hasGtg) {
    if (hist.proof === DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE && row.planSource !== PLAN_SOURCE.SNAPSHOT) {
      absenceKind = P35_DAY_ABSENCE_KIND.NON_RECONSTRUCTIBLE_PLAN;
    } else if (row.plannedRest) {
      absenceKind = P35_DAY_ABSENCE_KIND.PLANNED_REST;
    } else if (
      row.planSource === PLAN_SOURCE.SNAPSHOT &&
      row.isMissedSessionCandidate
    ) {
      absenceKind = P35_DAY_ABSENCE_KIND.PLANNED_MISSED;
    } else {
      absenceKind = P35_DAY_ABSENCE_KIND.NO_ACTIVITY_UNKNOWN;
    }
  }

  const planProof =
    row.planSource === PLAN_SOURCE.SNAPSHOT && row.planCompareEligible
      ? DAY_PLAN_PROOF.DEMONSTRATED
      : hist.proof;

  return {
    date: dateStr,
    plan: {
      source: row.planSource,
      proof: planProof,
      continuityReasons: hist.continuityReasons || [],
      plannedRest: Boolean(row.plannedRest),
      dayKind: row.dayKind,
      programId: row.programId || hist.programId,
      revisionId: hist.revision?.revisionId || null,
      plannedCount: row.plannedExercises?.length || 0,
      realizedCount: row.realizedExercises?.length || 0,
      partialCount: row.partiallyRealizedExercises?.length || 0,
      notRealizedCount: row.notRealizedExercises?.length || 0,
      suppressedCount: row.suppressedExercises?.length || 0,
      supplementalCount: row.supplementalExercises?.length || 0,
      usableForAdherence: Boolean(row.denominator?.usableForAdherenceRate),
      compareEligible: Boolean(row.planCompareEligible)
    },
    classic: {
      hasKeys: classicActivity,
      hasExclusiveActivity: hasClassicExclusive,
      ...volumes
    },
    gtg,
    feedback,
    coexistence: {
      classicOnly: hasClassicExclusive && !hasGtg,
      gtgOnly: hasGtg && !hasClassicExclusive,
      both: hasGtg && hasClassicExclusive,
      neither: !hasGtg && !hasClassicExclusive
    },
    absenceKind,
    /** Même mouvement GTG ∩ classique (identité canonique storage). */
    overlappingMovementIds: collectOverlappingMovements(
      workoutData,
      dateStr,
      gtg,
      volumes
    )
  };
}

function collectOverlappingMovements(workoutData, dateStr, gtg, volumes) {
  const out = [];
  const syncReliable = volumes?.syncDeduction?.reliable !== false;
  const perKey = new Map(
    (volumes?.syncDeduction?.perKey || []).map((r) => [String(r.storageId), r])
  );

  for (const e of gtg.exercises || []) {
    if (!(e.doneReps > 0)) continue;
    const id = String(e.canonicalStorageId);
    const keyRow = perKey.get(id);
    const classicTotal =
      keyRow?.classicReps ??
      (parseInt(String(workoutData?.reps?.[`${dateStr}_${id}`] || '0'), 10) || 0);
    const exclusive =
      keyRow != null
        ? keyRow.exclusiveReps
        : Math.max(0, classicTotal - (Number(e.syncedReps) || 0));
    // Chevauchement : GTG natif + part classique exclusive (même clé, hors sync).
    if (exclusive > 0 && e.doneReps > 0) {
      out.push({
        id,
        gtgReps: Number(e.doneReps) || 0,
        classicExclusiveReps: exclusive,
        syncedReps: Number(e.syncedReps) || 0,
        syncReliable: syncReliable && !keyRow?.clamped,
        unit: 'reps'
      });
    }
  }
  return out;
}

/**
 * Table de journées sur une fenêtre.
 */
export function buildP35DayTable(
  snapshot,
  window,
  { liveActiveProgram = null, getExerciseNameById = null } = {}
) {
  const start = window?.start;
  const end = window?.end;
  if (!snapshot || !start || !end) {
    return {
      window: { start: start || null, end: end || null },
      days: [],
      coverage: emptyCoverage()
    };
  }
  const dates = enumerateYmds(start, end);
  const days = dates.map((d) =>
    buildP35DayRecord(snapshot, d, { liveActiveProgram, getExerciseNameById })
  );
  return {
    window: { start, end },
    days,
    coverage: summarizeCoverage(days)
  };
}

function emptyCoverage() {
  return {
    calendarDays: 0,
    /** Jours avec volume classique exclusif du sync GTG (> 0 reps hors injection). */
    classicActiveDays: 0,
    /** Alias historique = classicActiveDays (pas « journée type séance »). */
    classicExclusiveDays: 0,
    /** Jours avec au moins un passage GTG. */
    gtgActiveDays: 0,
    gtgDays: 0,
    classicOnlyDays: 0,
    gtgOnlyDays: 0,
    bothDays: 0,
    /** Sans volume classique exclusif (GTG seul ou vide). */
    daysWithoutClassicExclusive: 0,
    /** Ni classique exclusif ni GTG. */
    daysWithNoRecordedActivity: 0,
    feedbackDays: 0,
    planDemonstratedDays: 0,
    planProbableDays: 0,
    nonReconstructibleDays: 0,
    plannedRestDays: 0,
    plannedMissedDays: 0
  };
}

function summarizeCoverage(days) {
  const c = emptyCoverage();
  c.calendarDays = days.length;
  for (const d of days) {
    if (d.classic.hasExclusiveActivity) {
      c.classicActiveDays += 1;
      c.classicExclusiveDays += 1;
    }
    if (d.gtg.hasActivity) {
      c.gtgActiveDays += 1;
      c.gtgDays += 1;
    }
    if (d.coexistence.classicOnly) c.classicOnlyDays += 1;
    if (d.coexistence.gtgOnly) c.gtgOnlyDays += 1;
    if (d.coexistence.both) c.bothDays += 1;
    if (!d.classic.hasExclusiveActivity) c.daysWithoutClassicExclusive += 1;
    if (d.coexistence.neither) c.daysWithNoRecordedActivity += 1;
    if (d.feedback.filled) c.feedbackDays += 1;
    if (d.plan.proof === DAY_PLAN_PROOF.DEMONSTRATED) c.planDemonstratedDays += 1;
    if (d.plan.proof === DAY_PLAN_PROOF.PROBABLE) c.planProbableDays += 1;
    if (d.absenceKind === P35_DAY_ABSENCE_KIND.NON_RECONSTRUCTIBLE_PLAN) {
      c.nonReconstructibleDays += 1;
    }
    if (d.absenceKind === P35_DAY_ABSENCE_KIND.PLANNED_REST) c.plannedRestDays += 1;
    if (d.absenceKind === P35_DAY_ABSENCE_KIND.PLANNED_MISSED) c.plannedMissedDays += 1;
  }
  // Égalités de cohérence (invariants de partition).
  c.consistency = {
    activeEqualsParts:
      c.classicOnlyDays + c.gtgOnlyDays + c.bothDays ===
      c.classicActiveDays + c.gtgActiveDays - c.bothDays,
    partition:
      c.classicOnlyDays + c.gtgOnlyDays + c.bothDays + c.daysWithNoRecordedActivity ===
      c.calendarDays,
    withoutClassic:
      c.daysWithoutClassicExclusive === c.gtgOnlyDays + c.daysWithNoRecordedActivity
  };
  return c;
}

export { enumerateYmds, sumGtgRepsForExerciseOnDay };
