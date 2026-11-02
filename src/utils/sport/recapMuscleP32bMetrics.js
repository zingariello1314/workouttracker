/**
 * P3.2b — Métriques musculaires sur ledger P3.2a (sans 74/26).
 *
 * Fenêtres :
 * - W : période affichée
 * - C : période de comparaison de même durée, immédiatement antérieure
 * - H : historique admissible (jusqu’à 90 j. avant W, exclus W)
 *
 * @module recapMuscleP32bMetrics
 */

import DateHelper from '../dateHelper';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import {
  CLASSIFICATION_VERSION,
  UNIT_CLASS,
  VOLUME_BUCKET,
  attributeAnatomyForExercise,
  buildMuscleAccountingLedger,
  buildCanonicalObservationLines
} from './recapMuscleLedgerP32a';
import { buildReverseStableIdIndex } from './resolveStorageExerciseIdentity';
import {
  buildPlanRealizationMatrix,
  PLAN_SOURCE,
  REALIZATION
} from './recapProgramAdherenceProgression.js';

/**
 * Occasions planifiées mini. pour un écart *récurrent* (vocabulaire établi).
 * 1 = ponctuel · 2 = observé plusieurs fois (sans « récurrence ») · ≥3 = récurrent admissible.
 */
export const MIN_PLAN_GROUP_OCCASIONS_RECURRENT = 3;
/** Seuil historique (rapport initial) : au moins 3 occasions comparables. */
export const MIN_PLAN_GROUP_OCCASIONS = MIN_PLAN_GROUP_OCCASIONS_RECURRENT;
/** Jours snapshot mini. pour ouvrir la comparaison musculaire plan. */
export const MIN_SNAPSHOT_DAYS_PLAN_MUSCLE = 3;
/** Écart mini. (jours d’exposition plan vs réalisé) pour publier. */
export const MIN_PLAN_GAP_DAYS = 2;
/** Écart relatif mini. lead/trail pour un contraste d’exposition informatif. */
export const MIN_CONTRAST_RELATIVE_GAP = 0.4;
/** Jours d’activité classic mini. par fenêtre pour une comparabilité « solide ». */
export const MIN_COMPARABLE_ACTIVITY_DAYS = 3;

export const P32B_METRIC_VERSION = 'p32b.v1';

export const MOVEMENT_AXIS = Object.freeze({
  PUSH: 'push',
  PULL: 'pull',
  LOWER: 'lower',
  CORE: 'core',
  OTHER: 'other',
  MIXED: 'mixed',
  INDETERMINATE: 'indeterminate'
});

const PUSH_GROUPS = new Set([
  MuscleGroups.CHEST,
  MuscleGroups.SHOULDERS,
  MuscleGroups.TRICEPS
]);
const PULL_GROUPS = new Set([MuscleGroups.BACK, MuscleGroups.BICEPS, MuscleGroups.FOREARMS]);
const LOWER_GROUPS = new Set([
  MuscleGroups.QUADS,
  MuscleGroups.HAMSTRINGS,
  MuscleGroups.GLUTES,
  MuscleGroups.CALVES,
  MuscleGroups.ADDUCTORS,
  MuscleGroups.LEGS
]);
const CORE_GROUPS = new Set([MuscleGroups.CORE]);

function addDays(ymd, delta) {
  return DateHelper.addDays(ymd, delta);
}

export function windowSpanDays(window) {
  if (!window?.start || !window?.end) return 0;
  return DateHelper.daysBetween(window.start, window.end) + 1;
}

/** C = même longueur que W, finissant la veille de W.start */
export function comparisonWindow(w) {
  if (!w?.start || !w?.end) return null;
  const span = windowSpanDays(w);
  if (span < 1) return null;
  const end = addDays(w.start, -1);
  const start = addDays(end, -(span - 1));
  return { start, end };
}

/**
 * H = historique admissible avant W (exclus W).
 * Lookback adapté à la durée de W : pas un forçage systématique à 90 j.
 * — W ≤ 10 j → 28 j de contexte
 * — W ≤ 35 j → 60 j
 * — sinon → min(90, 2×durée W)
 */
export function historyLookbackForWindow(w) {
  const span = windowSpanDays(w);
  if (span <= 0) return 28;
  if (span <= 10) return 28;
  if (span <= 35) return 60;
  return Math.min(90, Math.max(60, span * 2));
}

/** H = jusqu’à lookback jours avant W, exclus W (contexte, pas « dans W ») */
export function historyWindow(w, lookbackDays = null) {
  if (!w?.start) return null;
  const lb = lookbackDays == null ? historyLookbackForWindow(w) : Math.max(1, lookbackDays);
  const end = addDays(w.start, -1);
  const start = addDays(end, -(lb - 1));
  return { start, end };
}

/**
 * Comparabilité W vs C — plus stricte que R>0 ∧ durée égale.
 * Distingue absence d’activité et absence de données (fenêtre hors historique).
 */
export function assessWindowComparability(wSummary, cSummary, W, C) {
  const spanW = windowSpanDays(W);
  const spanC = windowSpanDays(C);
  const sameSpan = spanW > 0 && spanW === spanC;
  const rW = wSummary?.totals?.R || 0;
  const rC = cSummary?.totals?.R || 0;
  const daysW = wSummary?.activity?.trainingDaysClassic || 0;
  const daysC = cSummary?.activity?.trainingDaysClassic || 0;
  const classW = wSummary?.classificationVersion;
  const classC = cSummary?.classificationVersion;
  const sameClassification = Boolean(classW && classW === classC);
  const channelsOk =
    (wSummary?.movement?.complementaryReps || 0) >= 0 &&
    (cSummary?.movement?.complementaryReps || 0) >= 0;

  const reasons = [];
  if (!sameSpan) reasons.push('unequal_span');
  if (!(rW > 0)) reasons.push('W_empty_or_no_reps');
  if (!(rC > 0)) reasons.push('C_empty_or_no_reps');
  if (!sameClassification) reasons.push('classification_mismatch_or_missing');
  if (daysW < MIN_COMPARABLE_ACTIVITY_DAYS) reasons.push('W_few_activity_days');
  if (daysC < MIN_COMPARABLE_ACTIVITY_DAYS) reasons.push('C_few_activity_days');

  const partial =
    sameSpan &&
    rW > 0 &&
    rC > 0 &&
    sameClassification &&
    (daysW < MIN_COMPARABLE_ACTIVITY_DAYS || daysC < MIN_COMPARABLE_ACTIVITY_DAYS);

  const solid =
    sameSpan &&
    rW > 0 &&
    rC > 0 &&
    sameClassification &&
    channelsOk &&
    daysW >= MIN_COMPARABLE_ACTIVITY_DAYS &&
    daysC >= MIN_COMPARABLE_ACTIVITY_DAYS;

  let level = 'incomparable';
  if (solid) level = 'solid';
  else if (partial) level = 'partial';
  else if (sameSpan && rW > 0 && rC > 0) level = 'weak';

  return {
    ok: solid,
    level,
    sameSpan,
    sameClassification,
    channelsComparable: channelsOk,
    activityDaysW: daysW,
    activityDaysC: daysC,
    RW: rW,
    RC: rC,
    reasons,
    note:
      level === 'solid'
        ? 'Fenêtres de même durée, reps et jours d’activité suffisants, même classification.'
        : level === 'partial'
          ? 'Durée et R non nuls, mais peu de jours d’activité — comparaison prudente.'
          : rC === 0 && sameSpan
            ? 'C sans reps observés : absence de données ou d’activité — non assimilable à une baisse prouvée.'
            : 'Comparaison non admissible.'
  };
}

export function classifyPrimaryGroups(primaryGroups = []) {
  const gs = (primaryGroups || []).filter(Boolean);
  if (!gs.length) return MOVEMENT_AXIS.INDETERMINATE;
  const flags = {
    push: gs.some((g) => PUSH_GROUPS.has(g)),
    pull: gs.some((g) => PULL_GROUPS.has(g)),
    lower: gs.some((g) => LOWER_GROUPS.has(g)),
    core: gs.some((g) => CORE_GROUPS.has(g))
  };
  const axes = Object.entries(flags)
    .filter(([, v]) => v)
    .map(([k]) => k);
  if (axes.length === 0) return MOVEMENT_AXIS.OTHER;
  if (axes.length > 1) return MOVEMENT_AXIS.MIXED;
  if (axes[0] === 'push') return MOVEMENT_AXIS.PUSH;
  if (axes[0] === 'pull') return MOVEMENT_AXIS.PULL;
  if (axes[0] === 'lower') return MOVEMENT_AXIS.LOWER;
  if (axes[0] === 'core') return MOVEMENT_AXIS.CORE;
  return MOVEMENT_AXIS.OTHER;
}

function isComplementaryPushups(storageId) {
  return String(storageId) === 'complementary_endurance_pushups';
}

/**
 * Agrège exposition / mono volume / mouvement depuis un ledger + lignes.
 */
export function summarizeLedgerExposure(ledger, lines = []) {
  const certain = (lines || []).filter((l) => l.unitClass === UNIT_CLASS.CERTAIN_REPS);
  const byGroup = {};
  const ensure = (g) => {
    if (!byGroup[g]) {
      byGroup[g] = {
        group: g,
        exposureDaysPrimary: 0,
        exposureDaysSecondary: 0,
        distinctExercisesPrimary: 0,
        monoReps: 0,
        multiTouchReps: 0,
        occurrencesPrimary: 0
      };
    }
    return byGroup[g];
  };

  Object.entries(ledger?.exposureDaysPrimary || {}).forEach(([g, n]) => {
    ensure(g).exposureDaysPrimary = n;
  });
  Object.entries(ledger?.exposureDaysSecondary || {}).forEach(([g, n]) => {
    ensure(g).exposureDaysSecondary = n;
  });
  Object.entries(ledger?.distinctExercisesPrimary || {}).forEach(([g, n]) => {
    ensure(g).distinctExercisesPrimary = n;
  });
  Object.entries(ledger?.volumePrimary || {}).forEach(([g, n]) => {
    ensure(g).monoReps = n;
  });
  Object.entries(ledger?.multiPrimaryTouch || {}).forEach(([g, n]) => {
    ensure(g).multiTouchReps = n;
  });

  const movement = {
    pushMonoReps: 0,
    pullMonoReps: 0,
    lowerMonoReps: 0,
    coreMonoReps: 0,
    otherMonoReps: 0,
    mixedMultiReps: 0,
    indeterminateReps: 0,
    monoLines: 0,
    multiLines: 0,
    complementaryReps: 0,
    complementaryOccurrences: 0,
    byAxisOccurrences: {
      push: 0,
      pull: 0,
      lower: 0,
      core: 0,
      other: 0,
      mixed: 0,
      indeterminate: 0
    }
  };

  certain.forEach((line) => {
    const r = Number(line.reps) || 0;
    const prim = line.attribution?.primaryGroups || [];
    const axis = classifyPrimaryGroups(prim);
    if (line.volumeBucket === VOLUME_BUCKET.MONO_PRIMARY) {
      movement.monoLines += 1;
      movement.byAxisOccurrences[axis] = (movement.byAxisOccurrences[axis] || 0) + 1;
      if (axis === MOVEMENT_AXIS.PUSH) movement.pushMonoReps += r;
      else if (axis === MOVEMENT_AXIS.PULL) movement.pullMonoReps += r;
      else if (axis === MOVEMENT_AXIS.LOWER) movement.lowerMonoReps += r;
      else if (axis === MOVEMENT_AXIS.CORE) movement.coreMonoReps += r;
      else if (axis === MOVEMENT_AXIS.OTHER) movement.otherMonoReps += r;
      else movement.indeterminateReps += r;
      prim.forEach((g) => {
        ensure(g).occurrencesPrimary += 1;
      });
    } else if (line.volumeBucket === VOLUME_BUCKET.MULTI_PRIMARY) {
      movement.multiLines += 1;
      movement.mixedMultiReps += r;
      movement.byAxisOccurrences.mixed += 1;
    } else {
      movement.indeterminateReps += r;
      movement.byAxisOccurrences.indeterminate += 1;
    }
    if (isComplementaryPushups(line.storageId)) {
      movement.complementaryReps += r;
      movement.complementaryOccurrences += 1;
    }
  });

  const groups = Object.values(byGroup).sort(
    (a, b) =>
      b.exposureDaysPrimary - a.exposureDaysPrimary || b.monoReps - a.monoReps
  );

  return {
    classificationVersion: ledger?.classificationVersion || CLASSIFICATION_VERSION,
    totals: ledger?.totals || null,
    activity: ledger?.activity || null,
    groups,
    movement,
    reliability: {
      probableAnatomyLinks: (ledger?.identityInventory?.certain || []).filter(
        (x) => x.anatomyLinkConfidence === 'probable'
      ).length,
      nameMatchCount: (ledger?.identityInventory?.certain || []).filter(
        (x) => x.attributionSource === 'name_match'
      ).length,
      isoSecondsSum: ledger?.totals?.isoSecondsSum || 0
    }
  };
}

function buildLedgerBundle({ snapshot, window, getExerciseNameById, nameById, reverseIndex = null }) {
  if (!snapshot || !window?.start || !window?.end) {
    return { ledger: null, lines: [], summary: null };
  }
  const rev = reverseIndex || buildReverseStableIdIndex({ ...(nameById || {}) });
  const ledger = buildMuscleAccountingLedger({
    snapshot,
    window,
    getExerciseNameById,
    nameById
  });
  const lines = buildCanonicalObservationLines({
    snapshot,
    window,
    getExerciseNameById,
    nameById,
    reverseIndex: rev
  });
  return { ledger, lines, summary: summarizeLedgerExposure(ledger, lines) };
}

/**
 * Pack métriques W / C / H + plan snapshot coverage.
 */
export function buildP32bMuscleMetrics({
  snapshot,
  window,
  getExerciseNameById = null,
  nameById = null,
  historyLookbackDays = null,
  /** Matrice plan/réalisé déjà calculée (évite un 2e parcours avec l’adhérence). */
  planMatrix = null
} = {}) {
  const W = window?.start && window?.end ? { start: window.start, end: window.end } : null;
  const C = W ? comparisonWindow(W) : null;
  const lookback = historyLookbackDays == null && W ? historyLookbackForWindow(W) : historyLookbackDays;
  const H = W ? historyWindow(W, lookback) : null;

  const reverseIndex = buildReverseStableIdIndex({ ...(nameById || {}) });
  const wPack = buildLedgerBundle({ snapshot, window: W, getExerciseNameById, nameById, reverseIndex });
  const cPack = C
    ? buildLedgerBundle({ snapshot, window: C, getExerciseNameById, nameById, reverseIndex })
    : { ledger: null, lines: [], summary: null };
  const hPack = H
    ? buildLedgerBundle({ snapshot, window: H, getExerciseNameById, nameById, reverseIndex })
    : { ledger: null, lines: [], summary: null };

  const matrix =
    planMatrix ||
    (W
      ? buildPlanRealizationMatrix({
          workoutData: snapshot,
          window: W,
          getExerciseNameById
        })
      : null);
  const planMuscle = summarizePlanMuscleGaps(matrix, { getExerciseNameById });

  const comparability = assessWindowComparability(wPack.summary, cPack.summary, W, C);
  /** @deprecated utiliser comparability.ok — conservé pour compat tests. */
  const comparableWC = comparability.ok;

  return {
    metricVersion: P32B_METRIC_VERSION,
    classificationVersion: CLASSIFICATION_VERSION,
    windows: { W, C, H },
    historyLookbackDays: lookback,
    W: wPack.summary,
    C: cPack.summary,
    H: hPack.summary,
    ledgers: { W: wPack.ledger, C: cPack.ledger, H: hPack.ledger },
    lines: { W: wPack.lines, C: cPack.lines, H: hPack.lines },
    plan: planMuscle,
    matrix,
    comparableWC,
    comparability,
    flags: {
      hasComplementaryPushups: (wPack.summary?.movement?.complementaryReps || 0) > 0,
      multiShareOfR:
        wPack.summary?.totals?.R > 0
          ? Math.round((wPack.summary.totals.R_multi / wPack.summary.totals.R) * 1000) / 10
          : null
    }
  };
}

/**
 * Prévu×réalisé musculaire — uniquement jours snapshot (pas reconstruct / live).
 * Compte des jours distincts d’exposition primaire planifiée vs réalisée.
 */
export function summarizePlanMuscleGaps(matrix, { getExerciseNameById = null } = {}) {
  const snapshotDays = (matrix?.days || []).filter((d) => d.planSource === PLAN_SOURCE.SNAPSHOT);
  const empty = {
    snapshotDayCount: snapshotDays.length,
    planMuscleComparable: false,
    planSourceNote: 'insufficient_snapshots_for_plan_muscle',
    gaps: [],
    byGroup: [],
    singleOccasionGroups: []
  };
  if (snapshotDays.length < MIN_SNAPSHOT_DAYS_PLAN_MUSCLE) {
    return empty;
  }

  /** @type {Record<string, Set<string>>} */
  const plannedDays = {};
  /** @type {Record<string, Set<string>>} */
  const realizedDays = {};
  /** @type {Record<string, number>} */
  const plannedOccasions = {};

  const ensureSet = (bag, g) => {
    if (!bag[g]) bag[g] = new Set();
    return bag[g];
  };

  for (const day of snapshotDays) {
    const dayPlanned = new Set();
    const dayRealized = new Set();
    for (const ex of day.plannedExercises || []) {
      const sid = String(ex.id ?? ex.originalId ?? ex.storageId ?? '');
      const name =
        ex.name ||
        (typeof getExerciseNameById === 'function' ? getExerciseNameById(sid) : '') ||
        '';
      const attr = attributeAnatomyForExercise({ storageId: sid, name });
      if (!attr.metricAdmissible?.exposurePrimary || !(attr.primaryGroups || []).length) continue;
      for (const g of attr.primaryGroups) {
        dayPlanned.add(g);
        plannedOccasions[g] = (plannedOccasions[g] || 0) + 1;
      }
      const done =
        ex.status === REALIZATION.REALIZED || ex.status === REALIZATION.PARTIALLY_REALIZED;
      if (done) {
        for (const g of attr.primaryGroups) dayRealized.add(g);
      }
    }
    for (const g of dayPlanned) ensureSet(plannedDays, g).add(day.date);
    for (const g of dayRealized) ensureSet(realizedDays, g).add(day.date);
  }

  const groups = new Set([...Object.keys(plannedDays), ...Object.keys(realizedDays)]);
  const byGroup = [];
  const singleOccasionGroups = [];
  const gaps = [];

  for (const g of groups) {
    const pDays = plannedDays[g]?.size || 0;
    const rDays = realizedDays[g]?.size || 0;
    const occ = plannedOccasions[g] || 0;
    const row = {
      group: g,
      plannedDays: pDays,
      realizedDays: rDays,
      plannedOccasions: occ,
      gapDays: pDays - rDays
    };
    byGroup.push(row);
    if (occ === 1) singleOccasionGroups.push(g);
    // Récurrence établie uniquement à partir de 3 occasions (contrat initial).
    if (occ < MIN_PLAN_GROUP_OCCASIONS_RECURRENT) continue;
    if (Math.abs(row.gapDays) >= MIN_PLAN_GAP_DAYS && pDays > rDays) {
      gaps.push({ ...row, recurrence: 'established' });
    }
  }

  gaps.sort((a, b) => b.gapDays - a.gapDays || b.plannedOccasions - a.plannedOccasions);
  byGroup.sort((a, b) => b.plannedDays - a.plannedDays);

  const punctual = byGroup.filter(
    (g) => g.plannedOccasions === 1 && g.gapDays >= MIN_PLAN_GAP_DAYS && g.plannedDays > g.realizedDays
  );
  const observedTwice = byGroup.filter(
    (g) =>
      g.plannedOccasions === 2 &&
      g.gapDays >= MIN_PLAN_GAP_DAYS &&
      g.plannedDays > g.realizedDays
  );

  return {
    snapshotDayCount: snapshotDays.length,
    planMuscleComparable: true,
    planSourceNote: 'snapshots_sufficient',
    gaps,
    byGroup,
    singleOccasionGroups,
    punctualGaps: punctual,
    observedTwiceGaps: observedTwice,
    materialGap: gaps.length > 0 ? gaps[0] : null
  };
}

/**
 * Table d’exposition primary par date pour un groupe (audit / tests).
 */
export function buildGroupExposureDayTable({
  snapshot,
  window,
  group,
  getExerciseNameById = null,
  nameById = null
} = {}) {
  const pack = buildLedgerBundle({ snapshot, window, getExerciseNameById, nameById });
  const lines = (pack.lines || []).filter((l) => l.unitClass === UNIT_CLASS.CERTAIN_REPS);
  const gtg = (pack.ledger?.gtgLines || []).slice();
  const gtgMap = new Map(gtg.map((g) => [`${g.date}::${g.storageId}`, g]));

  const byDate = {};
  for (const line of lines) {
    const attr = line.attribution || {};
    const primary = (attr.primaryGroups || []).includes(group);
    const secondary = (attr.secondaryGroups || []).includes(group);
    if (!primary && !secondary) continue;
    const sid = String(line.storageId || '');
    const gtgHit = gtgMap.get(`${line.date}::${sid}`);
    let provenance = 'classic';
    if (sid === 'complementary_endurance_pushups' || sid.startsWith('complementary_')) {
      provenance = 'complementary';
    } else if (gtgHit?.alreadyInClassic) {
      provenance = 'classic_gtg_synced';
    }
    if (!byDate[line.date]) byDate[line.date] = [];
    byDate[line.date].push({
      date: line.date,
      storageId: sid,
      name: attr.resolvedName || '',
      provenance,
      role: primary ? 'primary' : 'secondary',
      anatomyLinkConfidence: attr.anatomyLinkConfidence,
      mappingQuality: attr.mappingQuality,
      volumeBucket: line.volumeBucket,
      reps: line.reps,
      includedInExposurePrimary: primary && attr.metricAdmissible?.exposurePrimary === true,
      gtgSynced: Boolean(gtgHit?.alreadyInClassic)
    });
  }

  const exposureDates = Object.keys(byDate)
    .filter((d) => byDate[d].some((r) => r.includedInExposurePrimary))
    .sort();
  const complementaryOnlyDates = exposureDates.filter((d) => {
    const prim = byDate[d].filter((r) => r.includedInExposurePrimary);
    return prim.length > 0 && prim.every((r) => r.provenance === 'complementary');
  });

  return {
    group,
    exposureDaysPrimary:
      pack.summary?.groups?.find((g) => g.group === group)?.exposureDaysPrimary || 0,
    exposureDates,
    complementaryOnlyDates,
    classicOrSyncedDates: exposureDates.filter((d) =>
      byDate[d].some(
        (r) =>
          r.includedInExposurePrimary &&
          (r.provenance === 'classic' || r.provenance === 'classic_gtg_synced')
      )
    ),
    rowsByDate: byDate
  };
}

/**
 * Top contraste d’exposition primary (jours) dans W.
 * Compare le leader au 2e (ou au premier rival avec écart ≥ seuil dans le top),
 * pas au groupe accessoire le plus rare — évite « pectoraux vs mollets » tautologique.
 * Exige aussi un écart relatif (≥ 40 % par défaut) : 16 vs 11 j n’est pas un contraste fort.
 */
export function pickExposureContrast(
  summary,
  {
    minLeadDays = 3,
    minGapDays = 3,
    minRelativeGap = MIN_CONTRAST_RELATIVE_GAP
  } = {}
) {
  const ranked = [...(summary?.groups || [])]
    .filter((g) => g.exposureDaysPrimary > 0)
    .sort(
      (a, b) =>
        b.exposureDaysPrimary - a.exposureDaysPrimary || b.monoReps - a.monoReps
    );
  if (ranked.length < 2) return null;
  const lead = ranked[0];
  if (lead.exposureDaysPrimary < minLeadDays) return null;

  // Uniquement vs le 2e : pas de chasse vers un accessoire rare pour forcer un contraste.
  const trail = ranked[1];
  const gap = lead.exposureDaysPrimary - trail.exposureDaysPrimary;
  const relativeGap = gap / Math.max(1, lead.exposureDaysPrimary);
  if (gap < minGapDays || relativeGap < minRelativeGap) return null;
  return {
    lead,
    trail,
    gapDays: gap,
    relativeGap: Math.round(relativeGap * 1000) / 1000,
    ranked: ranked.slice(0, 4)
  };
}

/** Évolution d’exposition primary d’un groupe W vs C. */
export function pickExposureShifts(wSummary, cSummary, { minAbsDeltaDays = 3 } = {}) {
  if (!wSummary || !cSummary) return [];
  const mapC = new Map((cSummary.groups || []).map((g) => [g.group, g]));
  const out = [];
  for (const g of wSummary.groups || []) {
    const prev = mapC.get(g.group);
    const prevDays = prev?.exposureDaysPrimary || 0;
    const delta = g.exposureDaysPrimary - prevDays;
    if (Math.abs(delta) < minAbsDeltaDays) continue;
    out.push({
      group: g.group,
      daysW: g.exposureDaysPrimary,
      daysC: prevDays,
      deltaDays: delta,
      monoRepsW: g.monoReps,
      monoRepsC: prev?.monoReps || 0
    });
  }
  return out.sort((a, b) => Math.abs(b.deltaDays) - Math.abs(a.deltaDays));
}

export function movementStructureSnapshot(summary) {
  const m = summary?.movement || {};
  const push = m.pushMonoReps || 0;
  const pull = m.pullMonoReps || 0;
  const lower = m.lowerMonoReps || 0;
  const upper = push + pull;
  const mixed = m.mixedMultiReps || 0;
  return {
    pushMonoReps: push,
    pullMonoReps: pull,
    lowerMonoReps: lower,
    coreMonoReps: m.coreMonoReps || 0,
    upperMonoReps: upper,
    mixedMultiReps: mixed,
    complementaryReps: m.complementaryReps || 0,
    ratioPushPullMono: pull > 0 ? Math.round((push / pull) * 100) / 100 : push > 0 ? null : null,
    dominant:
      push === 0 && pull === 0
        ? MOVEMENT_AXIS.INDETERMINATE
        : push > pull * 1.6
          ? MOVEMENT_AXIS.PUSH
          : pull > push * 1.6
            ? MOVEMENT_AXIS.PULL
            : MOVEMENT_AXIS.MIXED
  };
}
