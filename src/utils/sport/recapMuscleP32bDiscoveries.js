/**
 * P3.2b — Découvertes musculaires (ledger conservateur).
 *
 * Kinds (ensemble réduit) :
 * - disc_muscle_exposure_contrast  — contraste d’exposition (jours) dans W
 * - disc_muscle_exposure_shift     — évolution W vs C (comparabilité solide)
 * - disc_muscle_movement_structure — push/pull explicite (mixed ok)
 * - disc_muscle_plan_vs_actual     — écart récurrent (≥3 occasions snapshot)
 * - disc_muscle_ledger_limits      — methodology_limit (jamais pack principal)
 *
 * @module recapMuscleP32bDiscoveries
 */

import { CONTENT_CLASS } from './recapDiscoveryContentClass';
import {
  buildP32bMuscleMetrics,
  pickExposureContrast,
  pickExposureShifts,
  movementStructureSnapshot,
  MOVEMENT_AXIS,
  MIN_CONTRAST_RELATIVE_GAP
} from './recapMuscleP32bMetrics';

export const P32B_KINDS = Object.freeze({
  EXPOSURE_CONTRAST: 'disc_muscle_exposure_contrast',
  EXPOSURE_SHIFT: 'disc_muscle_exposure_shift',
  MOVEMENT_STRUCTURE: 'disc_muscle_movement_structure',
  PLAN_VS_ACTUAL: 'disc_muscle_plan_vs_actual',
  LEDGER_LIMITS: 'disc_muscle_ledger_limits'
});

export const P32B_KIND_CONTRACTS = Object.freeze({
  [P32B_KINDS.EXPOSURE_CONTRAST]: {
    phenomenon: 'Écart relatif notable de jours d’exposition primary entre groupes dans W',
    windows: ['W'],
    minLeadDays: 3,
    minGapDays: 3,
    minRelativeGap: MIN_CONTRAST_RELATIVE_GAP,
    contentClass: CONTENT_CLASS.ANALYTICAL,
    nature: 'now',
    family: 'muscle_p32b_exposure'
  },
  [P32B_KINDS.EXPOSURE_SHIFT]: {
    phenomenon: 'Variation d’exposition primary d’un groupe entre W et C (comparabilité solide)',
    windows: ['W', 'C'],
    minAbsDeltaDays: 3,
    requireComparability: 'solid',
    contentClass: CONTENT_CLASS.ANALYTICAL,
    nature: 'trajectory',
    family: 'muscle_p32b_exposure'
  },
  [P32B_KINDS.MOVEMENT_STRUCTURE]: {
    phenomenon: 'Asymétrie push/pull sur volume mono-primary (multi listé à part)',
    windows: ['W'],
    minMonoReps: 200,
    ratioThreshold: 1.6,
    contentClass: CONTENT_CLASS.ANALYTICAL,
    nature: 'trajectory',
    family: 'muscle_p32b_structure'
  },
  [P32B_KINDS.PLAN_VS_ACTUAL]: {
    phenomenon: 'Écart récurrent prévu×réalisé musculaire (≥3 occasions snapshot)',
    windows: ['W'],
    minSnapshotDays: 3,
    minOccasionsRecurrent: 3,
    contentClass: CONTENT_CLASS.ANALYTICAL,
    nature: 'trajectory',
    family: 'muscle_p32b_plan'
  },
  [P32B_KINDS.LEDGER_LIMITS]: {
    phenomenon: 'Limite méthodologique (0 snapshot plan / multi élevé)',
    windows: ['W'],
    contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
    nature: 'trajectory',
    family: 'muscle_p32b_limits'
  }
});

const GROUP_LABEL = {
  chest: 'pectoraux',
  back: 'dos',
  shoulders: 'épaules',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'avant-bras',
  core: 'gainage/tronc',
  quads: 'quadriceps',
  hamstrings: 'ischio-jambiers',
  glutes: 'fessiers',
  calves: 'mollets',
  adductors: 'adducteurs',
  legs: 'jambes',
  neck: 'cou',
  full_body: 'corps entier'
};

function labelGroup(g) {
  return GROUP_LABEL[g] || g;
}

function capLabel(g) {
  const s = labelGroup(g);
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function fmtInt(n) {
  return Math.round(Number(n) || 0).toLocaleString('fr-FR');
}

function card({
  kind,
  nature,
  family,
  contentClass,
  title,
  body,
  evidence,
  weights,
  metrics
}) {
  const score = Math.round(
    (weights.importance || 0) *
      (weights.reliability || 0) *
      (weights.novelty || 0) *
      (weights.fit || 0) *
      100
  );
  return {
    kind,
    nature,
    family,
    contentClass,
    title,
    body,
    evidence: evidence || '',
    weights,
    score,
    metrics: {
      ...metrics,
      contentClass,
      engine: 'p32b',
      classificationVersion: metrics?.classificationVersion || 'p32.v1'
    }
  };
}

function buildExposureContrast(metrics) {
  const contract = P32B_KIND_CONTRACTS[P32B_KINDS.EXPOSURE_CONTRAST];
  const hit = pickExposureContrast(metrics.W, {
    minLeadDays: contract.minLeadDays,
    minGapDays: contract.minGapDays,
    minRelativeGap: contract.minRelativeGap
  });
  if (!hit) return null;
  const { lead, trail, gapDays, relativeGap } = hit;
  const W = metrics.windows.W;
  const multi = metrics.W?.totals?.R_multi || 0;

  // Constat sobre : compteurs de jours, pas de diagnostic d’équilibre.
  const multiBit =
    multi > 0
      ? ` ${fmtInt(multi)} reps multi-principales restent hors du volume mono et peuvent aussi marquer une exposition.`
      : '';
  const compBit =
    (metrics.W?.movement?.complementaryReps || 0) > 0
      ? ` Les pompes complémentaires (endurance) y contribuent sans constituer une séance classique séparée.`
      : '';

  return card({
    kind: P32B_KINDS.EXPOSURE_CONTRAST,
    nature: contract.nature,
    family: contract.family,
    contentClass: contract.contentClass,
    title: `${capLabel(lead.group)} : plus de jours d’exposition primaire que ${labelGroup(trail.group)}`,
    body: `Du ${W.start} au ${W.end}, les ${labelGroup(lead.group)} figurent en primaire sur ${fmtInt(
      lead.exposureDaysPrimary
    )} jours distincts (${fmtInt(lead.distinctExercisesPrimary)} exercices, ${fmtInt(
      lead.monoReps
    )} reps mono), contre ${fmtInt(trail.exposureDaysPrimary)} pour ${labelGroup(
      trail.group
    )} (écart ${fmtInt(gapDays)} jours, soit ${Math.round((relativeGap || 0) * 100)} %). Ce sont des jours d’exposition enregistrés, pas des séances ni une mesure de stimulation.${multiBit}${compBit}`,
    evidence: `${lead.group} ${lead.exposureDaysPrimary}j · ${trail.group} ${trail.exposureDaysPrimary}j · mono ${lead.monoReps}/${trail.monoReps}`,
    weights: { importance: 0.78, reliability: 0.88, novelty: 0.7, fit: 0.86 },
    metrics: {
      windowStart: W.start,
      windowEnd: W.end,
      leadGroup: lead.group,
      trailGroup: trail.group,
      leadDays: lead.exposureDaysPrimary,
      trailDays: trail.exposureDaysPrimary,
      gapDays,
      relativeGap,
      leadMonoReps: lead.monoReps,
      trailMonoReps: trail.monoReps,
      R_multi: multi,
      complementaryReps: metrics.W?.movement?.complementaryReps || 0,
      unit: 'exposure_days_primary'
    }
  });
}

function buildExposureShift(metrics) {
  const contract = P32B_KIND_CONTRACTS[P32B_KINDS.EXPOSURE_SHIFT];
  const comp = metrics.comparability;
  if (!comp?.ok || comp.level !== 'solid') return null;
  const shifts = pickExposureShifts(metrics.W, metrics.C, {
    minAbsDeltaDays: contract.minAbsDeltaDays
  });
  if (!shifts.length) return null;
  const top = shifts[0];
  const W = metrics.windows.W;
  const C = metrics.windows.C;
  const up = top.deltaDays > 0;
  const monoUp = top.monoRepsW - top.monoRepsC;

  return card({
    kind: P32B_KINDS.EXPOSURE_SHIFT,
    nature: contract.nature,
    family: contract.family,
    contentClass: contract.contentClass,
    title: up
      ? `${capLabel(top.group)} : davantage de jours d’exposition qu’en période précédente`
      : `${capLabel(top.group)} : moins de jours d’exposition qu’en période précédente`,
    body: `Sur deux fenêtres comparables de ${fmtInt(
      metrics.comparability.activityDaysW
    )}+ jours d’activité (${C.start}→${C.end} puis ${W.start}→${W.end}), les jours d’exposition primaire aux ${labelGroup(
      top.group
    )} passent de ${fmtInt(top.daysC)} à ${fmtInt(top.daysW)} (Δ ${up ? '+' : ''}${fmtInt(
      top.deltaDays
    )}). Les reps mono associées vont de ${fmtInt(top.monoRepsC)} à ${fmtInt(top.monoRepsW)}${
      monoUp !== 0 ? ` (Δ ${monoUp > 0 ? '+' : ''}${fmtInt(monoUp)})` : ''
    }. Il s’agit de jours enregistrés avec exposition, pas d’une preuve de hausse ou baisse de stimulation musculaire.`,
    evidence: `${top.group} ${top.daysC}→${top.daysW} j · mono ${top.monoRepsC}→${top.monoRepsW} · cmp=${comp.level}`,
    weights: { importance: 0.86, reliability: 0.9, novelty: 0.84, fit: 0.9 },
    metrics: {
      windowStart: W.start,
      windowEnd: W.end,
      compareStart: C.start,
      compareEnd: C.end,
      group: top.group,
      daysW: top.daysW,
      daysC: top.daysC,
      deltaDays: top.deltaDays,
      monoRepsW: top.monoRepsW,
      monoRepsC: top.monoRepsC,
      comparabilityLevel: comp.level,
      unit: 'exposure_days_primary',
      trajectoryOk: true,
      temporalScope: { interpretingWithHistory: true }
    }
  });
}

function buildMovementStructure(metrics) {
  const contract = P32B_KIND_CONTRACTS[P32B_KINDS.MOVEMENT_STRUCTURE];
  const snap = movementStructureSnapshot(metrics.W);
  const monoTotal =
    snap.pushMonoReps + snap.pullMonoReps + snap.lowerMonoReps + (metrics.W?.movement?.coreMonoReps || 0);
  if (monoTotal < contract.minMonoReps) return null;
  if (snap.dominant !== MOVEMENT_AXIS.PUSH && snap.dominant !== MOVEMENT_AXIS.PULL) return null;

  const W = metrics.windows.W;
  const dominantLabel = snap.dominant === MOVEMENT_AXIS.PUSH ? 'poussée' : 'tirage';
  const multiBit =
    snap.mixedMultiReps > 0
      ? ` ${fmtInt(snap.mixedMultiReps)} reps multi-principales restent hors de ce ratio.`
      : '';
  const compBit =
    snap.complementaryReps > 0
      ? ` Dont ${fmtInt(snap.complementaryReps)} reps de pompes complémentaires.`
      : '';

  return card({
    kind: P32B_KINDS.MOVEMENT_STRUCTURE,
    nature: contract.nature,
    family: contract.family,
    contentClass: contract.contentClass,
    title: `Volume mono : dominante ${dominantLabel}`,
    body: `Du ${W.start} au ${W.end}, le volume mono-principal compte ${fmtInt(
      snap.pushMonoReps
    )} reps de poussée et ${fmtInt(snap.pullMonoReps)} de tirage (plus ${fmtInt(
      snap.lowerMonoReps
    )} pour le bas du corps). Ratio push/pull ≈ ${
      snap.ratioPushPullMono != null ? String(snap.ratioPushPullMono).replace('.', ',') : 'n/a'
    }. Classification explicite ; pas de norme 50/50.${multiBit}${compBit}`,
    evidence: `push ${snap.pushMonoReps} · pull ${snap.pullMonoReps} · multi ${snap.mixedMultiReps}`,
    weights: { importance: 0.8, reliability: 0.85, novelty: 0.74, fit: 0.86 },
    metrics: {
      windowStart: W.start,
      windowEnd: W.end,
      ...snap,
      unit: 'mono_primary_reps'
    }
  });
}

function buildPlanVsActual(metrics) {
  const contract = P32B_KIND_CONTRACTS[P32B_KINDS.PLAN_VS_ACTUAL];
  if (!metrics.plan?.planMuscleComparable) return null;
  const gap = metrics.plan.materialGap;
  if (!gap || gap.recurrence !== 'established') return null;

  const W = metrics.windows.W;
  return card({
    kind: P32B_KINDS.PLAN_VS_ACTUAL,
    nature: contract.nature,
    family: contract.family,
    contentClass: contract.contentClass,
    title: `${capLabel(gap.group)} : écart récurrent entre plan figé et réalisation`,
    body: `Sur ${fmtInt(metrics.plan.snapshotDayCount)} jours à plan snapshot (${W.start}→${W.end}), ${labelGroup(
      gap.group
    )} est prévu en primaire ${fmtInt(gap.plannedOccasions)} fois (sur ${fmtInt(
      gap.plannedDays
    )} jours) et réalisé sur ${fmtInt(gap.realizedDays)} jour${
      gap.realizedDays > 1 ? 's' : ''
    } (écart ${fmtInt(gap.gapDays)} jours). Constat d’écart récurrent (≥3 occasions), sans inférer une dynamique longue ni une intention.`,
    evidence: `${gap.group} plan ${gap.plannedDays}j / réal ${gap.realizedDays}j · occ ${gap.plannedOccasions} · snap ${metrics.plan.snapshotDayCount}`,
    weights: { importance: 0.86, reliability: 0.9, novelty: 0.8, fit: 0.85 },
    metrics: {
      windowStart: W.start,
      windowEnd: W.end,
      snapshotDayCount: metrics.plan.snapshotDayCount,
      planMuscleComparable: true,
      group: gap.group,
      plannedDays: gap.plannedDays,
      realizedDays: gap.realizedDays,
      plannedOccasions: gap.plannedOccasions,
      gapDays: gap.gapDays,
      recurrence: 'established',
      unit: 'plan_vs_realized_exposure_days'
    }
  });
}

function buildLedgerLimits(metrics) {
  const W = metrics.windows?.W;
  if (!W) return null;
  const noPlan = !metrics.plan?.planMuscleComparable;
  const multiShare = metrics.flags?.multiShareOfR;
  if (!noPlan && !(multiShare != null && multiShare >= 25)) return null;

  const bits = [];
  if (noPlan) {
    bits.push(
      `Aucun jour snapshot suffisant (${fmtInt(
        metrics.plan?.snapshotDayCount || 0
      )}) : aucune affirmation sur les groupes musculaires « prévus » historiques.`
    );
  }
  if (multiShare != null && multiShare >= 25) {
    bits.push(
      `${fmtInt(multiShare)} % des reps sont multi-principales (exposition possible, volume non isolé par muscle).`
    );
  }
  const iso = metrics.W?.reliability?.isoSecondsSum || 0;
  if (iso > 0) {
    bits.push(`${fmtInt(iso)} s isométriques hors total de reps.`);
  }

  return card({
    kind: P32B_KINDS.LEDGER_LIMITS,
    nature: 'trajectory',
    family: 'muscle_p32b_limits',
    contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
    title: 'Limites du compte musculaire sur cette fenêtre',
    body: bits.join(' '),
    evidence: `snapshots=${metrics.plan?.snapshotDayCount || 0} · multiShare=${multiShare}`,
    weights: { importance: 0.32, reliability: 0.95, novelty: 0.2, fit: 0.5 },
    metrics: {
      windowStart: W.start,
      windowEnd: W.end,
      snapshotDayCount: metrics.plan?.snapshotDayCount || 0,
      multiShareOfR: multiShare,
      contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
      findingKind: 'muscle_ledger_limits'
    }
  });
}

/**
 * Si un shift solide et un contraste coexistent : l’évolution prime
 * (évite de publier un portrait statique à la place d’un constat historique).
 */
function applyShiftOverContrastPreference(discoveries, rejected) {
  const shift = discoveries.find((d) => d.kind === P32B_KINDS.EXPOSURE_SHIFT);
  const contrastIdx = discoveries.findIndex((d) => d.kind === P32B_KINDS.EXPOSURE_CONTRAST);
  if (!shift || contrastIdx < 0) return discoveries;
  const contrast = discoveries[contrastIdx];
  discoveries.splice(contrastIdx, 1);
  rejected.push({
    kind: P32B_KINDS.EXPOSURE_CONTRAST,
    reason: 'superseded_by_exposure_shift',
    relativeGap: Number(contrast.metrics?.relativeGap) || null,
    shiftGroup: shift.metrics?.group || null
  });
  return discoveries;
}

/**
 * @param {object} opts
 * @param {boolean} [opts.publishPlanVsActual=true]
 * @returns {{ metrics: object, discoveries: object[], rejected: object[] }}
 */
export function buildP32bMuscleDiscoveries({
  snapshot,
  window,
  getExerciseNameById = null,
  nameById = null,
  publishPlanVsActual = true
} = {}) {
  const metrics = buildP32bMuscleMetrics({
    snapshot,
    window,
    getExerciseNameById,
    nameById
  });
  const rejected = [];
  const discoveries = [];

  const tryPush = (builder, kind) => {
    const cardOut = builder(metrics);
    if (cardOut) discoveries.push(cardOut);
    else {
      rejected.push({
        kind,
        reason:
          kind === P32B_KINDS.EXPOSURE_SHIFT && metrics.comparability && !metrics.comparability.ok
            ? `incomparable:${metrics.comparability.level}`
            : 'thresholds_or_data_not_met',
        window: metrics.windows?.W || null,
        comparability: metrics.comparability || null
      });
    }
  };

  tryPush(buildExposureContrast, P32B_KINDS.EXPOSURE_CONTRAST);
  tryPush(buildExposureShift, P32B_KINDS.EXPOSURE_SHIFT);
  tryPush(buildMovementStructure, P32B_KINDS.MOVEMENT_STRUCTURE);

  if (publishPlanVsActual) {
    const planCard = buildPlanVsActual(metrics);
    if (planCard) discoveries.push(planCard);
    else
      rejected.push({
        kind: P32B_KINDS.PLAN_VS_ACTUAL,
        reason: metrics.plan?.planMuscleComparable
          ? (metrics.plan?.observedTwiceGaps || []).length
            ? 'observed_twice_not_recurrent'
            : (metrics.plan?.punctualGaps || []).length
              ? 'punctual_only'
              : 'no_material_gap'
          : 'insufficient_snapshots',
        snapshotDayCount: metrics.plan?.snapshotDayCount || 0,
        singleOccasionGroups: metrics.plan?.singleOccasionGroups || [],
        punctualGaps: metrics.plan?.punctualGaps || [],
        observedTwiceGaps: metrics.plan?.observedTwiceGaps || []
      });
  }

  const limits = buildLedgerLimits(metrics);
  if (limits) discoveries.push(limits);
  else rejected.push({ kind: P32B_KINDS.LEDGER_LIMITS, reason: 'no_material_limit' });

  applyShiftOverContrastPreference(discoveries, rejected);

  return { metrics, discoveries, rejected };
}
