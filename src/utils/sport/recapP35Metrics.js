/**
 * P3.5 — Agrégats dérivés (GTG × classique, écarts, ressenti).
 * Pas de score physiologique inventé ; unités séparées.
 *
 * @module recapP35Metrics
 */

import {
  buildP35DayTable,
  P35_DAY_ABSENCE_KIND
} from './recapP35DayModel';
import { DAY_PLAN_PROOF } from '../programRevisionJournalP34';
import { resolveExerciseIdentityLinks } from './recapProgramAdherenceDiscoveries';
import { normalizeGtgData } from '../../services/endurance/gtgService';

export const P35_THRESHOLDS = Object.freeze({
  MIN_CALENDAR_DAYS_COEXISTENCE: 7,
  MIN_GTG_DAYS: 3,
  MIN_DAYS_WITHOUT_CLASSIC: 5,
  MIN_OVERLAP_DAYS: 2,
  MIN_MOVEMENT_REPS_EACH: 10,
  MIN_GAP_USABLE_DAYS: 5,
  MIN_RECURRING_GAP_HITS: 3,
  MIN_FEEDBACK_DAYS: 5,
  MIN_CROSS_COMPARABLE: 6,
  MIN_CROSS_EACH_ARM: 3
});

/**
 * @param {object} snapshot
 * @param {{ start: string, end: string }} window
 * @param {object} [opts]
 */
export function computeP35WindowMetrics(
  snapshot,
  window,
  { liveActiveProgram = null, getExerciseNameById = null, dayTableCache = null } = {}
) {
  const t0 =
    typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now();
  const table = buildP35DayTable(snapshot, window, {
    liveActiveProgram,
    getExerciseNameById,
    dayTableCache
  });
  const days = table.days || [];
  const coverage = table.coverage;

  const coexistence = summarizeCoexistence(days, coverage);
  const movementShares = summarizeMovementShares(snapshot, days);
  const gtgContinuity = summarizeGtgOutsideClassic(days, coverage);
  const gaps = summarizeGapTypology(days);
  const feedback = summarizeFeedback(days);
  const cross = summarizeCrossGtgFeedback(days, feedback);

  const elapsedMs =
    (typeof performance !== 'undefined' && performance.now
      ? performance.now()
      : Date.now()) - t0;

  return {
    window: table.window,
    coverage,
    coexistence,
    movementShares,
    gtgContinuity,
    gaps,
    feedback,
    cross,
    performance: { computeMs: Math.round(elapsedMs * 100) / 100 },
    abstentions: collectAbstentions({
      coverage,
      coexistence,
      movementShares,
      gtgContinuity,
      gaps,
      feedback,
      cross
    })
  };
}

function summarizeCoexistence(days, coverage) {
  let classicOnly = 0;
  let gtgOnly = 0;
  let both = 0;
  let neither = 0;
  let gtgOnPlannedRest = 0;
  let gtgOnUnknownAbsence = 0;
  let gtgOnNonReconstructible = 0;

  for (const d of days) {
    if (d.coexistence.classicOnly) classicOnly += 1;
    else if (d.coexistence.gtgOnly) gtgOnly += 1;
    else if (d.coexistence.both) both += 1;
    else neither += 1;

    if (d.gtg.hasActivity) {
      if (d.absenceKind === P35_DAY_ABSENCE_KIND.PLANNED_REST || d.plan.plannedRest) {
        // activité GTG le jour : absenceKind null — utiliser plannedRest + !classic
        // géré ci-dessous via plannedRest sans classique exclusif
      }
      if (!d.classic.hasExclusiveActivity && d.plan.plannedRest) {
        gtgOnPlannedRest += 1;
      } else if (
        !d.classic.hasExclusiveActivity &&
        d.plan.proof === DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE
      ) {
        gtgOnNonReconstructible += 1;
      } else if (
        !d.classic.hasExclusiveActivity &&
        d.absenceKind === P35_DAY_ABSENCE_KIND.NO_ACTIVITY_UNKNOWN
      ) {
        // pas GTG si absenceKind set — contradiction ; skip
      } else if (!d.classic.hasExclusiveActivity && !d.plan.plannedRest) {
        gtgOnUnknownAbsence += 1;
      }
    }
  }

  const activeChannelDays = classicOnly + gtgOnly + both;
  const publishable =
    coverage.calendarDays >= P35_THRESHOLDS.MIN_CALENDAR_DAYS_COEXISTENCE &&
    coverage.gtgDays >= P35_THRESHOLDS.MIN_GTG_DAYS &&
    activeChannelDays >= 4;

  return {
    classicOnlyDays: classicOnly,
    gtgOnlyDays: gtgOnly,
    bothDays: both,
    neitherDays: neither,
    activeChannelDays,
    gtgOnPlannedRestDays: gtgOnPlannedRest,
    gtgOnUnknownPlanDays: gtgOnUnknownAbsence,
    gtgOnNonReconstructibleDays: gtgOnNonReconstructible,
    /** Part GTG parmi jours avec au moins un canal (pas jours calendaires vides). */
    gtgShareOfActiveDays:
      activeChannelDays > 0
        ? Math.round(((gtgOnly + both) / activeChannelDays) * 1000) / 10
        : null,
    bothShareOfGtgDays:
      coverage.gtgActiveDays > 0
        ? Math.round((both / coverage.gtgActiveDays) * 1000) / 10
        : null,
    publishable,
    denominators: {
      calendarDays: coverage.calendarDays,
      classicActiveDays: coverage.classicActiveDays,
      classicOnlyDays: classicOnly,
      gtgActiveDays: coverage.gtgActiveDays,
      gtgOnlyDays: gtgOnly,
      bothDays: both,
      daysWithoutClassicExclusive: coverage.daysWithoutClassicExclusive,
      daysWithNoRecordedActivity: coverage.daysWithNoRecordedActivity,
      activeChannelDays,
      note:
        'classicOnly = journée exclusivement classique (canal) ; classicExclusiveReps = volume reps hors sync GTG — notions distinctes'
    },
    consistency: coverage.consistency || null
  };
}

function summarizeMovementShares(snapshot, days) {
  const gtgConfig = normalizeGtgData(snapshot?.enduranceData?.gtg).config;
  const byId = new Map();

  for (const d of days) {
    for (const ov of d.overlappingMovementIds || []) {
      const id = String(ov.id);
      const cur = byId.get(id) || {
        id,
        days: 0,
        gtgReps: 0,
        classicExclusiveReps: 0,
        syncedReps: 0,
        identityConfidence: 'uncertain',
        gtgExerciseId: null,
        syncReliable: true
      };
      cur.days += 1;
      cur.gtgReps += Number(ov.gtgReps) || 0;
      cur.classicExclusiveReps += Number(ov.classicExclusiveReps) || 0;
      cur.syncedReps += Number(ov.syncedReps) || 0;
      if (ov.syncReliable === false) cur.syncReliable = false;
      byId.set(id, cur);
    }
    for (const e of d.gtg.exercises || []) {
      if (!(e.doneReps > 0)) continue;
      const id = String(e.canonicalStorageId);
      const row = byId.get(id);
      if (!row) continue;
      row.gtgExerciseId = e.gtgExerciseId;
      const link = resolveExerciseIdentityLinks({
        gtgId: e.gtgExerciseId,
        storageId: id,
        gtgConfig
      });
      row.identityConfidence = link.confidence;
    }
  }

  const movements = [];
  let unreliableSyncHits = 0;
  for (const row of byId.values()) {
    if (row.syncReliable === false) {
      unreliableSyncHits += 1;
      continue;
    }
    const totalDocumented = row.classicExclusiveReps + row.gtgReps;
    if (totalDocumented <= 0) continue;
    if (row.identityConfidence === 'uncertain' && row.days < 1) continue;
    const gtgPct =
      totalDocumented > 0
        ? Math.round((row.gtgReps / totalDocumented) * 1000) / 10
        : null;
    movements.push({
      ...row,
      totalDocumentedReps: totalDocumented,
      gtgSharePct: gtgPct,
      unit: 'reps',
      /** Interdit : additionner avec secondes / km / maintiens. */
      compatibleUnit: true
    });
  }

  movements.sort((a, b) => b.totalDocumentedReps - a.totalDocumentedReps);

  const top = movements[0] || null;
  const publishable = Boolean(
    top &&
      top.identityConfidence === 'certain' &&
      top.days >= P35_THRESHOLDS.MIN_OVERLAP_DAYS &&
      top.gtgReps >= P35_THRESHOLDS.MIN_MOVEMENT_REPS_EACH &&
      top.classicExclusiveReps >= P35_THRESHOLDS.MIN_MOVEMENT_REPS_EACH
  );

  let abstainReason = null;
  if (!publishable) {
    if (unreliableSyncHits > 0 && !movements.length) {
      abstainReason = 'sync_provenance_unreliable';
    } else if (!movements.length) {
      abstainReason = 'no_overlapping_certain_identity';
    } else {
      abstainReason = 'below_overlap_or_volume_threshold';
    }
  }

  return {
    movements,
    topCombined: publishable ? top : null,
    publishable,
    abstainReason,
    unreliableSyncHits
  };
}

function summarizeGtgOutsideClassic(days, coverage) {
  const withoutClassic = days.filter((d) => !d.classic.hasExclusiveActivity);
  const withGtg = withoutClassic.filter((d) => d.gtg.hasActivity);
  const plannedRestWithGtg = withGtg.filter((d) => d.plan.plannedRest);
  const demonstratedMissedWithGtg = withGtg.filter(
    (d) => d.absenceKind === P35_DAY_ABSENCE_KIND.PLANNED_MISSED
  );
  const unknownWithGtg = withGtg.filter(
    (d) =>
      !d.plan.plannedRest &&
      d.absenceKind !== P35_DAY_ABSENCE_KIND.PLANNED_MISSED &&
      d.plan.proof !== DAY_PLAN_PROOF.DEMONSTRATED
  );

  const denom = withoutClassic.length;
  const publishable =
    denom >= P35_THRESHOLDS.MIN_DAYS_WITHOUT_CLASSIC &&
    withGtg.length >= 2 &&
    coverage.gtgDays >= P35_THRESHOLDS.MIN_GTG_DAYS;

  return {
    daysWithoutClassicExclusive: denom,
    daysWithoutClassicWithGtg: withGtg.length,
    plannedRestWithGtg: plannedRestWithGtg.length,
    demonstratedMissedWithGtg: demonstratedMissedWithGtg.length,
    unknownPlanWithGtg: unknownWithGtg.length,
    sharePct:
      denom > 0 ? Math.round((withGtg.length / denom) * 1000) / 10 : null,
    publishable,
    denominators: {
      daysWithoutClassicExclusive: denom,
      note: 'Pas des jours de repos prévus — absence de séance classique exclusive seulement'
    }
  };
}

function summarizeGapTypology(days) {
  const usable = days.filter(
    (d) =>
      d.plan.compareEligible &&
      d.plan.proof === DAY_PLAN_PROOF.DEMONSTRATED &&
      (d.plan.plannedCount > 0 || d.plan.plannedRest)
  );

  let full = 0;
  let partial = 0;
  let missed = 0;
  let rest = 0;
  let restWithActivity = 0;
  let withSupplemental = 0;
  let withSuppressed = 0;
  const suppressHits = new Map();
  const supplementalHits = new Map();

  for (const d of usable) {
    if (d.plan.plannedRest) {
      rest += 1;
      if (d.classic.hasExclusiveActivity || d.gtg.hasActivity) restWithActivity += 1;
      continue;
    }
    const planned = d.plan.plannedCount || 0;
    const realized = d.plan.realizedCount || 0;
    const partialN = d.plan.partialCount || 0;
    const notR = d.plan.notRealizedCount || 0;
    if (planned > 0 && realized === planned && partialN === 0 && notR === 0) {
      full += 1;
    } else if (planned > 0 && (partialN > 0 || (realized > 0 && notR > 0))) {
      partial += 1;
    } else if (planned > 0 && realized === 0 && notR === planned) {
      missed += 1;
    }
    if (d.plan.supplementalCount > 0) withSupplemental += 1;
    if (d.plan.suppressedCount > 0) withSuppressed += 1;
  }

  // Récurrence : on n’a que des compteurs agrégés ici ; détail id dans matrix ailleurs.
  // Marqueur de « modifications quotidiennes habituelles ».
  const recurringAdaptations =
    usable.length >= P35_THRESHOLDS.MIN_GAP_USABLE_DAYS &&
    withSuppressed + withSupplemental >= P35_THRESHOLDS.MIN_RECURRING_GAP_HITS;

  const publishable =
    usable.length >= P35_THRESHOLDS.MIN_GAP_USABLE_DAYS &&
    (partial >= 2 || missed >= 2 || withSupplemental >= 2 || withSuppressed >= 2);

  return {
    usableDemonstratedDays: usable.length,
    fullyRealizedSessions: full,
    partialSessions: partial,
    missedSessions: missed,
    plannedRestDays: rest,
    plannedRestWithActivity: restWithActivity,
    daysWithSupplemental: withSupplemental,
    daysWithSuppressed: withSuppressed,
    recurringAdaptations,
    suppressHits: Object.fromEntries(suppressHits),
    supplementalHits: Object.fromEntries(supplementalHits),
    publishable,
    proofRequired: DAY_PLAN_PROOF.DEMONSTRATED,
    denominators: {
      usableDemonstratedDays: usable.length,
      note: 'Uniquement snapshots proven / planCompareEligible'
    }
  };
}

function summarizeFeedback(days) {
  const filled = days.filter((d) => d.feedback.filled);
  const withDiff = filled.filter((d) => d.feedback.difficulte != null);
  const values = withDiff.map((d) => d.feedback.difficulte);
  const mean =
    values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : null;
  const high = withDiff.filter((d) => d.feedback.difficulte >= 7);
  const low = withDiff.filter((d) => d.feedback.difficulte <= 3);

  const partialWithFb = withDiff.filter(
    (d) =>
      d.plan.compareEligible &&
      d.plan.proof === DAY_PLAN_PROOF.DEMONSTRATED &&
      d.plan.partialCount > 0
  );
  const fullWithFb = withDiff.filter(
    (d) =>
      d.plan.compareEligible &&
      d.plan.proof === DAY_PLAN_PROOF.DEMONSTRATED &&
      d.plan.plannedCount > 0 &&
      d.plan.realizedCount === d.plan.plannedCount &&
      d.plan.partialCount === 0
  );

  const publishable = withDiff.length >= P35_THRESHOLDS.MIN_FEEDBACK_DAYS;

  return {
    scale: 'session_feedback_1_10',
    scaleNote:
      'difficulte = échelle personnelle Momentum 1–10 ; ce n’est pas un RPE compétition standardisé',
    filledDays: filled.length,
    difficulteDays: withDiff.length,
    meanDifficulte: mean,
    highDifficulteDays: high.length,
    lowDifficulteDays: low.length,
    partialSessionsWithDifficulte: partialWithFb.length,
    fullSessionsWithDifficulte: fullWithFb.length,
    meanDifficultePartial:
      partialWithFb.length >= 2
        ? avg(partialWithFb.map((d) => d.feedback.difficulte))
        : null,
    meanDifficulteFull:
      fullWithFb.length >= 2
        ? avg(fullWithFb.map((d) => d.feedback.difficulte))
        : null,
    publishable,
    inventRpeForbidden: true,
    abstainReason: publishable ? null : 'insufficient_feedback_or_none'
  };
}

function summarizeCrossGtgFeedback(days, feedbackMeta) {
  if (!feedbackMeta.publishable) {
    return {
      publishable: false,
      abstainReason: 'no_feedback_base',
      bothArm: null,
      classicOnlyArm: null
    };
  }
  const withDiff = days.filter((d) => d.feedback.difficulte != null);
  const both = withDiff.filter((d) => d.coexistence.both);
  const classicOnly = withDiff.filter((d) => d.coexistence.classicOnly);
  const publishable =
    both.length >= P35_THRESHOLDS.MIN_CROSS_EACH_ARM &&
    classicOnly.length >= P35_THRESHOLDS.MIN_CROSS_EACH_ARM &&
    both.length + classicOnly.length >= P35_THRESHOLDS.MIN_CROSS_COMPARABLE;

  return {
    bothArm: {
      n: both.length,
      meanDifficulte: both.length ? avg(both.map((d) => d.feedback.difficulte)) : null
    },
    classicOnlyArm: {
      n: classicOnly.length,
      meanDifficulte: classicOnly.length
        ? avg(classicOnly.map((d) => d.feedback.difficulte))
        : null
    },
    publishable,
    abstainReason: publishable ? null : 'cross_sample_too_small',
    causalityForbidden: true
  };
}

function avg(arr) {
  if (!arr.length) return null;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function collectAbstentions(pack) {
  const out = [];
  if (!pack.coexistence.publishable) {
    out.push({ family: 'A_coexistence', reason: 'coverage_or_gtg_below_threshold' });
  }
  if (!pack.movementShares.publishable) {
    out.push({
      family: 'A_movement_share',
      reason: pack.movementShares.abstainReason || 'abstain'
    });
  }
  if (!pack.gtgContinuity.publishable) {
    out.push({ family: 'A_continuity', reason: 'days_without_classic_below_threshold' });
  }
  if (!pack.gaps.publishable) {
    out.push({ family: 'B_gaps', reason: 'insufficient_demonstrated_plan_days' });
  }
  if (!pack.feedback.publishable) {
    out.push({ family: 'C_feedback', reason: pack.feedback.abstainReason });
  }
  if (!pack.cross.publishable) {
    out.push({ family: 'D_cross', reason: pack.cross.abstainReason });
  }
  return out;
}
