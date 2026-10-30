/**
 * P3.1 — Découvertes Adhérence × Progression
 *
 * Findings structurés d’abord, prose ensuite.
 * Réutilise la matrice P3.0 + trajectoires P0 (pas de second moteur).
 *
 * @module recapProgramAdherenceDiscoveries
 */

import {
  buildPlanRealizationMatrix,
  PLAN_SOURCE
} from './recapProgramAdherenceProgression.js';
import { buildExerciseTrajectory, trajectoryToMetrics } from './exerciseTrajectoryAnalysis.js';
import { collectLifetimeRepHistory } from './athleteJourney.js';
import { userFacingExerciseLabel, resolveUserFacingExerciseName } from './recapStrengthPeriodStats.js';
import { normalizeGtgData } from '../../services/endurance/gtgService.js';
import {
  resolveGtgCanonicalExerciseId,
  resolveGtgWorkoutStorageKey
} from '../../services/endurance/gtgWorkoutSync.js';
import { inclusiveCalendarSpanDays } from './garminRunningPeriodStats.js';
import { isDateInRecapWindow } from './recapMuscleLoadEngine.js';

const MIN_SNAPSHOT_DAYS_FOR_RATE = 3;
const RECURRING_MIN_PLANNED = 3;
const RECURRING_SKIP_RATIO = 0.6;
const OFFPLAN_MIN_DAYS = 3;

/** @typedef {'certain'|'probable'|'uncertain'} IdentityConfidence */

/**
 * Rapproche ids stockage / original / GTG sans inventer de certitude.
 * @returns {{
 *   storageIds: string[],
 *   gtgIds: string[],
 *   confidence: IdentityConfidence,
 *   reasons: string[]
 * }}
 */
export function resolveExerciseIdentityLinks({
  storageId = null,
  originalId = null,
  gtgId = null,
  gtgConfig = null
} = {}) {
  const storageIds = new Set();
  const gtgIds = new Set();
  const reasons = [];
  let confidence = 'uncertain';

  const pushStorage = (v) => {
    if (v == null || v === '') return;
    storageIds.add(String(v));
  };
  const pushGtg = (v) => {
    if (v == null || v === '') return;
    gtgIds.add(String(v));
  };

  pushStorage(storageId);
  pushStorage(originalId);
  pushGtg(gtgId);

  if (gtgId != null && gtgId !== '') {
    try {
      const key = resolveGtgWorkoutStorageKey('2000-01-01', gtgId, gtgConfig || {});
      const sid = key.slice('2000-01-01_'.length);
      const builtinOrDb =
        sid &&
        !String(sid).startsWith('gtg_') &&
        (String(gtgId) === 'pullups' ||
          String(gtgId) === 'dips' ||
          String(gtgId) === 'pushups' ||
          String(gtgId).startsWith('db_') ||
          String(sid).startsWith('db_'));
      if (builtinOrDb) {
        pushStorage(sid);
        reasons.push('gtg_storage_key');
        confidence = 'certain';
      } else if (sid && !String(sid).startsWith('gtg_')) {
        // Banque / custom : probable seulement (homonymes / ids historiques possibles)
        pushStorage(sid);
        reasons.push('gtg_bank_or_custom_probable');
        confidence = 'probable';
      } else {
        reasons.push('gtg_unmapped_fallback');
        confidence = 'uncertain';
      }
      const canon = resolveGtgCanonicalExerciseId(gtgId, gtgConfig || {});
      if (canon && !String(canon).startsWith('gtg_')) {
        pushStorage(canon);
        if (confidence === 'uncertain') confidence = 'probable';
        reasons.push('gtg_canonical_map');
      }
    } catch {
      reasons.push('gtg_resolve_failed');
      confidence = 'uncertain';
    }
  }

  if (storageIds.size && gtgIds.size && confidence === 'uncertain') {
    confidence = 'probable';
    reasons.push('ids_present_without_builtin_map');
  }
  if (storageIds.size && !gtgIds.size && (storageId != null || originalId != null)) {
    confidence = 'certain';
    reasons.push('classic_ids_only');
  }

  return {
    storageIds: [...storageIds],
    gtgIds: [...gtgIds],
    confidence,
    reasons
  };
}

/**
 * Agrège la matrice snapshot pour l’axe A (findings purs).
 */
export function buildAdherenceFindingsFromMatrix(matrix, { getExerciseNameById = null } = {}) {
  const findings = [];
  if (!matrix?.days) {
    return {
      findings: [
        {
          kind: 'plan_data_insufficient',
          stance: 'impossible',
          metrics: { reason: 'no_matrix' },
          limits: ['no_matrix']
        }
      ]
    };
  }

  const snapshotDays = matrix.days.filter((d) => d.planSource === PLAN_SOURCE.SNAPSHOT);
  const reconstructDays = matrix.days.filter((d) => d.planSource === PLAN_SOURCE.RECONSTRUCT);
  const adherence = matrix.adherenceSnapshotOnly || {};

  if (snapshotDays.length < MIN_SNAPSHOT_DAYS_FOR_RATE) {
    findings.push({
      kind: 'plan_data_insufficient',
      stance: 'impossible',
      metrics: {
        snapshotDayCount: snapshotDays.length,
        reconstructDayCount: reconstructDays.length,
        minRequired: MIN_SNAPSHOT_DAYS_FOR_RATE,
        reason:
          snapshotDays.length === 0
            ? 'no_historical_plan_snapshots'
            : 'snapshot_days_below_threshold'
      },
      limits: [
        'historical_adherence_rate_unavailable',
        'reconstruct_cannot_prove_skips'
      ]
    });
  } else {
    const adj = adherence.adjusted || {};
    const ini = adherence.initial || {};
    findings.push({
      kind: 'plan_follow_rate',
      stance: 'observed',
      metrics: {
        snapshotDayCount: snapshotDays.length,
        adjustedPlannedSlots: adj.plannedSlots ?? adherence.plannedSlots,
        adjustedRealizedSlots: adj.realizedSlots ?? adherence.realizedSlots,
        adjustedPartialSlots: adj.partiallyRealizedSlots ?? adherence.partiallyRealizedSlots,
        adjustedNotRealizedSlots: adj.notRealizedSlots ?? adherence.notRealizedSlots,
        adjustedRateFull: adj.rateFull ?? adherence.rateFull,
        adjustedRateInclPartial: adj.rateIncludingPartial ?? adherence.rateIncludingPartial,
        initialPlannedSlots: ini.plannedSlots ?? null,
        initialRateFull: ini.rateFull ?? null,
        suppressedSlots: adherence.suppressedSlots ?? 0
      },
      limits: ['snapshot_days_only', 'not_causal']
    });
  }

  /** @type {Map<string, { name: string, planned: number, notRealized: number, partial: number, realized: number, suppressed: number }>} */
  const byEx = new Map();
  let offplanDays = 0;
  let suppressedTotal = 0;

  for (const day of snapshotDays) {
    if ((day.supplementalExercises || []).length) offplanDays += 1;
    suppressedTotal += day.suppressedExercises?.length || 0;
    for (const ex of day.plannedExercises || []) {
      const key = String(ex.matchKey || ex.originalId || ex.id || '');
      if (!key) continue;
      if (!byEx.has(key)) {
        const label = userFacingExerciseLabel(
          ex.name || resolveUserFacingExerciseName(key, getExerciseNameById),
          key
        );
        byEx.set(key, {
          matchKey: key,
          name: label,
          planned: 0,
          notRealized: 0,
          partial: 0,
          realized: 0,
          suppressed: 0
        });
      }
      const row = byEx.get(key);
      row.planned += 1;
      if (ex.status === 'suppressed') row.suppressed += 1;
      else if (ex.status === 'not_realized') row.notRealized += 1;
      else if (ex.status === 'partially_realized') row.partial += 1;
      else if (ex.status === 'realized') row.realized += 1;
    }
  }

  if (snapshotDays.length >= MIN_SNAPSHOT_DAYS_FOR_RATE) {
    for (const row of byEx.values()) {
      const eligible = row.planned - row.suppressed;
      if (eligible < RECURRING_MIN_PLANNED) continue;
      const skipRatio = row.notRealized / eligible;
      if (row.notRealized >= RECURRING_MIN_PLANNED || skipRatio >= RECURRING_SKIP_RATIO) {
        findings.push({
          kind: 'plan_recurring_not_realized',
          stance: 'observed',
          metrics: {
            matchKey: row.matchKey,
            name: row.name,
            plannedOccurrences: row.planned,
            eligibleOccurrences: eligible,
            notRealizedCount: row.notRealized,
            partialCount: row.partial,
            realizedCount: row.realized,
            suppressedCount: row.suppressed,
            notRealizedRatio: Math.round(skipRatio * 1000) / 1000
          },
          limits: [
            'not_labelled_forgotten_or_abandoned',
            'snapshot_days_only',
            'no_intent_inference'
          ]
        });
      }
    }

    if (offplanDays >= OFFPLAN_MIN_DAYS) {
      findings.push({
        kind: 'plan_offplan_pattern',
        stance: 'observed',
        metrics: {
          offplanDayCount: offplanDays,
          snapshotDayCount: snapshotDays.length,
          suppressedExerciseSlots: suppressedTotal
        },
        limits: ['replacement_not_asserted', 'snapshot_days_only']
      });
    }
  }

  return { findings, byExercise: byEx, snapshotDays, reconstructDays };
}

/**
 * Jointure fréquence réelle × trajectoire P0 (findings purs).
 */
export function buildFrequencyProgressFindings({
  snapshot,
  window,
  getExerciseNameById = null,
  matrix = null
} = {}) {
  const findings = [];
  if (!snapshot || !window?.start || !window?.end) {
    return { findings: [], exerciseRows: [] };
  }

  const spanDays = inclusiveCalendarSpanDays(window.start, window.end) || 1;
  const weeks = spanDays / 7;
  const lifetime = collectLifetimeRepHistory(snapshot, window.end);
  const gtgConfig = normalizeGtgData(snapshot?.enduranceData?.gtg)?.config || {};

  /** Jours GTG par storage id (certain only) */
  const gtgDaysByStorage = new Map();
  const gtgRaw = snapshot?.enduranceData?.gtg;
  const gtgDays = gtgRaw?.days || {};
  for (const [dateStr, day] of Object.entries(gtgDays)) {
    if (!isDateInRecapWindow(dateStr, window)) continue;
    const exercises = day?.exercises || {};
    for (const gtgId of Object.keys(exercises)) {
      const slots = exercises[gtgId]?.slots || {};
      const anyDone = Object.values(slots).some((s) => s?.done);
      if (!anyDone && !Array.isArray(day.adHoc)) continue;
      const link = resolveExerciseIdentityLinks({ gtgId, gtgConfig });
      if (link.confidence !== 'certain') continue;
      for (const sid of link.storageIds) {
        if (!gtgDaysByStorage.has(sid)) gtgDaysByStorage.set(sid, new Set());
        gtgDaysByStorage.get(sid).add(dateStr);
      }
    }
  }

  /** Fréquence planifiée (snapshot only) */
  const plannedFreq = new Map();
  if (matrix?.days) {
    for (const day of matrix.days) {
      if (day.planSource !== PLAN_SOURCE.SNAPSHOT) continue;
      for (const ex of day.plannedExercises || []) {
        if (ex.status === 'suppressed') continue;
        const key = String(ex.matchKey || ex.id || '');
        if (!key) continue;
        plannedFreq.set(key, (plannedFreq.get(key) || 0) + 1);
      }
    }
  }

  const exerciseRows = [];
  for (const [exId, sessions] of lifetime.entries()) {
    const inWin = sessions.filter((s) => isDateInRecapWindow(s.date, window));
    if (inWin.length < 2) continue;

    const classicDays = new Set(inWin.map((s) => s.date));
    const gtgOnlyDays = gtgDaysByStorage.get(String(exId)) || new Set();
    // Exposition : union classique ∪ GTG certain — sans double-compter le même jour
    const exposureDays = new Set([...classicDays, ...gtgOnlyDays]);
    const classicSessionCount = classicDays.size;
    const gtgExposureDays = [...gtgOnlyDays].filter((d) => !classicDays.has(d)).length;
    const exposureDayCount = exposureDays.size;
    const volumeReps = inWin.reduce((s, r) => s + (r.reps || 0), 0);
    const sessionsPerWeek = weeks > 0 ? exposureDayCount / weeks : exposureDayCount;

    let freqBand = 'mid';
    if (sessionsPerWeek >= 2.2 || exposureDayCount >= Math.max(8, Math.round(weeks * 2.2))) {
      freqBand = 'high';
    } else if (sessionsPerWeek <= 1.0 || exposureDayCount <= Math.max(2, Math.round(weeks * 0.9))) {
      freqBand = 'low';
    }

    const name = userFacingExerciseLabel(
      resolveUserFacingExerciseName(exId, getExerciseNameById),
      exId
    );
    const traj = buildExerciseTrajectory({
      snapshot,
      exerciseId: exId,
      exerciseName: name,
      window,
      getExerciseNameById,
      mode: 'progress'
    });

    const plannedOcc = plannedFreq.get(String(exId)) || plannedFreq.get(name) || null;
    const plannedFreqUsable = plannedOcc != null && (matrix?.adherenceSnapshotOnly?.dayCount || 0) > 0;

    const row = {
      exerciseId: String(exId),
      name,
      classicSessionCount,
      gtgExposureDays,
      exposureDayCount,
      volumeReps,
      sessionsPerWeek: Math.round(sessionsPerWeek * 100) / 100,
      freqBand,
      plannedOccurrences: plannedFreqUsable ? plannedOcc : null,
      plannedFreqUsable,
      trajectoryOk: Boolean(traj?.ok),
      primaryStory: traj?.ok ? traj.shape?.primaryStory || null : null,
      traj
    };
    exerciseRows.push(row);

    if (!traj?.ok) {
      findings.push({
        kind: 'freq_progress_unevaluable',
        stance: 'watch',
        metrics: {
          exerciseId: row.exerciseId,
          name: row.name,
          exposureDayCount,
          classicSessionCount,
          gtgExposureDays,
          volumeReps,
          sessionsPerWeek: row.sessionsPerWeek,
          freqBand,
          reason: traj?.reason || 'trajectory_not_ok'
        },
        limits: ['no_progress_claim']
      });
      continue;
    }

    const story = row.primaryStory;
    const rising = story === 'net_rise' || story === 'recovered';
    const flatOrDown = story === 'plateau' || story === 'net_decline' || story === 'partial_recovery';

    if (rising && freqBand === 'high') {
      findings.push({
        kind: 'freq_progress_high',
        stance: 'observed',
        metrics: baseFreqMetrics(row, story),
        limits: ['not_causal', 'freq_neq_volume']
      });
    } else if (rising && freqBand === 'low') {
      findings.push({
        kind: 'freq_progress_low',
        stance: 'observed',
        metrics: baseFreqMetrics(row, story),
        limits: ['not_causal', 'freq_neq_volume', 'selection_or_gtg_possible']
      });
    } else if (flatOrDown && freqBand === 'high') {
      findings.push({
        kind: 'freq_high_no_progress',
        stance: 'observed',
        metrics: baseFreqMetrics(row, story),
        limits: ['not_causal', 'may_be_load_or_technique', 'freq_neq_volume']
      });
    } else if (story === 'net_decline' && freqBand === 'low') {
      findings.push({
        kind: 'freq_decline_with_low_exposure',
        stance: 'observed',
        metrics: baseFreqMetrics(row, story),
        limits: ['not_causal', 'co_occurrence_only']
      });
    }
  }

  // Prioriser : au plus quelques findings significatifs (sélection filtrera aussi)
  findings.sort((a, b) => significanceScore(b) - significanceScore(a));
  return { findings, exerciseRows };
}

function baseFreqMetrics(row, story) {
  const shape = row.traj?.shape || {};
  return {
    exerciseId: row.exerciseId,
    name: row.name,
    exposureDayCount: row.exposureDayCount,
    classicSessionCount: row.classicSessionCount,
    gtgExposureDays: row.gtgExposureDays,
    volumeReps: row.volumeReps,
    sessionsPerWeek: row.sessionsPerWeek,
    freqBand: row.freqBand,
    primaryStory: story,
    plannedOccurrences: row.plannedOccurrences,
    plannedFreqUsable: row.plannedFreqUsable,
    trajectoryOk: true,
    earlyMean: shape.earlyMean ?? null,
    lateMean: shape.lateMean ?? null,
    shapeDelta: shape.delta ?? null,
    interpretingWithHistory: Boolean(row.traj?.temporalScope?.interpretingWithHistory)
  };
}

function perfCompareBit(m) {
  if (m.earlyMean == null || m.lateMean == null) return '';
  const hist = m.interpretingWithHistory
    ? ' (arc d’interprétation incluant des séances antérieures à la fenêtre)'
    : ' (comparaison bornée à la fenêtre)';
  return ` Les niveaux comparés par la trajectoire P0 passent d’environ ${fmtInt(m.earlyMean)} à ${fmtInt(m.lateMean)} répétitions${hist}.`;
}

function significanceScore(f) {
  const m = f.metrics || {};
  let s = m.exposureDayCount || 0;
  if (f.kind === 'freq_progress_low' || f.kind === 'freq_high_no_progress') s += 5;
  if (f.kind === 'freq_decline_with_low_exposure') s += 3;
  return s;
}

function fmtInt(n) {
  const x = Math.round(Number(n) || 0);
  return String(x);
}

function fmtPct01(rate) {
  if (rate == null || !Number.isFinite(rate)) return '—';
  return `${Math.round(rate * 100)} %`;
}

function storyFr(story) {
  switch (story) {
    case 'net_rise':
      return 'une hausse nette des performances';
    case 'recovered':
      return 'une récupération après un creux';
    case 'plateau':
      return 'un plateau';
    case 'net_decline':
      return 'un recul net';
    case 'partial_recovery':
      return 'une récupération encore partielle';
    default:
      return 'une évolution difficile à classer';
  }
}

/**
 * Transforme findings → cartes discovery (prose calculée, pas hypothétique).
 */
export function composeProgramAdherenceDiscoveries(adherencePack, freqPack, { trajById = new Map() } = {}) {
  const out = [];
  const adherenceFindings = adherencePack?.findings || [];
  const freqFindings = freqPack?.findings || [];

  for (const f of adherenceFindings) {
    if (f.kind === 'plan_data_insufficient') {
      const m = f.metrics || {};
      const snap = m.snapshotDayCount || 0;
      const recon = m.reconstructDayCount || 0;
      out.push({
        kind: 'disc_plan_data_insufficient',
        nature: 'trajectory',
        family: 'program_adherence',
        title: 'Adhérence historique : données de plan insuffisantes',
        body:
          snap === 0
            ? `Sur cette fenêtre, aucun jour n’a de plan figé (snapshot). ${recon} jour${recon > 1 ? 's' : ''} montrent seulement ce qui a été enregistré (reconstruction), ce qui ne permet pas de calculer un taux d’adhérence au programme prévu. Les expositions réelles et les trajectoires restent exploitables séparément.`
            : `Seulement ${snap} jour${snap > 1 ? 's' : ''} avec plan figé — en dessous du seuil de ${m.minRequired} requis pour un taux d’adhérence historique fiable. Aucun pourcentage d’adhérence n’est donc publié pour cette fenêtre.`,
        evidence: `snapshots=${snap} · reconstruct=${recon}`,
        weights: { importance: 0.72, reliability: 0.95, novelty: 0.7, fit: 0.88 },
        metrics: { ...m, findingKind: f.kind }
      });
      continue;
    }

    if (f.kind === 'plan_follow_rate') {
      const m = f.metrics || {};
      const rate = m.adjustedRateFull;
      const rateP = m.adjustedRateInclPartial;
      const gap = rate != null ? Math.round((1 - rate) * 100) : null;
      if (rate == null || (rate >= 0.85 && (m.adjustedNotRealizedSlots || 0) === 0)) {
        // Suivi élevé : peu informatif comme « découverte » — skip sauf écart notable
        if (rate != null && rate >= 0.85) continue;
      }
      const initialBit =
        m.initialRateFull != null && m.initialPlannedSlots !== m.adjustedPlannedSlots
          ? ` Sur le plan initial (avant suppressions explicites), le taux plein est de ${fmtPct01(m.initialRateFull)} pour ${fmtInt(m.initialPlannedSlots)} créneaux.`
          : '';
      const suppressedBit =
        (m.suppressedSlots || 0) > 0
          ? ` ${fmtInt(m.suppressedSlots)} créneau${m.suppressedSlots > 1 ? 'x' : ''} a/ont été retiré${m.suppressedSlots > 1 ? 's' : ''} explicitement du jour (hors dénominateur ajusté).`
          : '';
      out.push({
        kind: 'disc_plan_follow_rate',
        nature: 'trajectory',
        family: 'program_adherence',
        title:
          rate != null && rate < 0.8
            ? 'Écart mesurable entre le plan figé et l’exécution'
            : 'Lecture du suivi du plan figé',
        body: `Sur ${fmtInt(m.snapshotDayCount)} jours à plan figé, ${fmtInt(m.adjustedRealizedSlots)} créneaux planifiés sont réalisés pleinement sur ${fmtInt(m.adjustedPlannedSlots)} (taux ajusté ${fmtPct01(rate)}${rateP != null && rateP !== rate ? ` ; ${fmtPct01(rateP)} en comptant les réalisations partielles` : ''}).${gap != null && gap >= 15 ? ` L’écart au suivi intégral est d’environ ${gap} points.` : ''} Ce taux ne mélange pas les jours sans snapshot.${initialBit}${suppressedBit} Il ne mesure pas la progression des performances.`,
        evidence: `adj ${fmtPct01(rate)} · ${m.adjustedRealizedSlots}/${m.adjustedPlannedSlots} · snap ${m.snapshotDayCount}j`,
        weights: { importance: 0.78, reliability: 0.9, novelty: 0.74, fit: 0.9 },
        metrics: { ...m, findingKind: f.kind }
      });
      continue;
    }

    if (f.kind === 'plan_recurring_not_realized') {
      const m = f.metrics || {};
      out.push({
        kind: 'disc_plan_recurring_skip',
        nature: 'trajectory',
        family: 'program_adherence',
        title: `${m.name} : souvent prévu, rarement exécuté sur les jours figés`,
        body: `${m.name} apparaît ${fmtInt(m.eligibleOccurrences)} fois dans le plan figé (hors suppressions explicites) et reste non réalisé ${fmtInt(m.notRealizedCount)} fois (${fmtPct01(m.notRealizedRatio)}). ${fmtInt(m.realizedCount)} réalisation${m.realizedCount > 1 ? 's' : ''} et ${fmtInt(m.partialCount)} partielle${m.partialCount > 1 ? 's' : ''} sur la même base. Ce constat décrit uniquement un écart récurrent entre planification et exécution, sans inférer l’intention ni un arrêt définitif.`,
        evidence: `${m.notRealizedCount}/${m.eligibleOccurrences} non réalisés`,
        weights: { importance: 0.8, reliability: 0.88, novelty: 0.82, fit: 0.9 },
        metrics: {
          ...m,
          exerciseId: m.matchKey,
          findingKind: f.kind
        }
      });
      continue;
    }

    if (f.kind === 'plan_offplan_pattern') {
      const m = f.metrics || {};
      out.push({
        kind: 'disc_offplan_pattern',
        nature: 'trajectory',
        family: 'program_adherence',
        title: 'Exercices hors plan répétés sur les jours figés',
        body: `Sur ${fmtInt(m.snapshotDayCount)} jours à plan figé, ${fmtInt(m.offplanDayCount)} jour${m.offplanDayCount > 1 ? 's' : ''} comportent au moins un exercice supplémentaire (déclaré ou touché hors plan). Un remplacement d’exercice n’est pas affirmé : seule la récurrence du hors-plan est établie.`,
        evidence: `${m.offplanDayCount} j. hors-plan / ${m.snapshotDayCount} snap`,
        weights: { importance: 0.7, reliability: 0.86, novelty: 0.76, fit: 0.85 },
        metrics: { ...m, findingKind: f.kind }
      });
    }
  }

  // Fréquence × progression : une carte par pattern fort, max 3
  const freqCards = [];
  for (const f of freqFindings) {
    if (f.kind === 'freq_progress_unevaluable') continue;
    const m = f.metrics || {};
    const traj = trajById.get(String(m.exerciseId));
    const trajMetrics = traj?.ok ? trajectoryToMetrics(traj) : {};
    const gtgBit =
      (m.gtgExposureDays || 0) > 0
        ? ` dont ${fmtInt(m.gtgExposureDays)} jour${m.gtgExposureDays > 1 ? 's' : ''} d’exposition GTG sans séance classique du même exercice`
        : '';
    const plannedBit =
      m.plannedFreqUsable && m.plannedOccurrences != null
        ? ` Le plan figé le prévoyait ${fmtInt(m.plannedOccurrences)} fois (fréquence prévue utilisable uniquement sur snapshots).`
        : ' La fréquence prévue n’est pas utilisée ici : le plan historique n’est pas assez fiable sur la fenêtre.';

    let kind;
    let title;
    let body;
    let importance = 0.82;

    if (f.kind === 'freq_progress_high') {
      kind = 'disc_freq_progress_high';
      title = `${m.name} : progression avec une exposition élevée`;
      body = `${m.name} cumule ${fmtInt(m.exposureDayCount)} jours d’exposition (${fmtInt(m.classicSessionCount)} séance${m.classicSessionCount > 1 ? 's' : ''} classique${m.classicSessionCount > 1 ? 's' : ''}${gtgBit}), soit environ ${m.sessionsPerWeek} jour${m.sessionsPerWeek > 1 ? 's' : ''}/semaine, pour un volume de ${fmtInt(m.volumeReps)} répétitions.${perfCompareBit(m)} La trajectoire indique ${storyFr(m.primaryStory)}. Fréquence, volume et progression sont trois lectures distinctes ; aucune relation causale n’est affirmée.${plannedBit}`;
    } else if (f.kind === 'freq_progress_low') {
      kind = 'disc_freq_progress_low';
      title = `${m.name} : progression malgré une exposition faible`;
      body = `${m.name} n’apparaît que sur ${fmtInt(m.exposureDayCount)} jour${m.exposureDayCount > 1 ? 's' : ''} d’exposition (${fmtInt(m.classicSessionCount)} classique${m.classicSessionCount > 1 ? 's' : ''}${gtgBit}) — rythme ≈ ${m.sessionsPerWeek}/semaine — avec un volume de ${fmtInt(m.volumeReps)} répétitions.${perfCompareBit(m)} La trajectoire indique ${storyFr(m.primaryStory)}. Une progression avec peu d’expositions peut coïncider avec des séances plus denses ou un contexte hors séance ; ce n’est pas une preuve de cause.${plannedBit}`;
      importance = 0.86;
    } else if (f.kind === 'freq_high_no_progress') {
      kind = 'disc_freq_high_no_progress';
      title = `${m.name} : exposition élevée sans progression mesurable`;
      body = `${m.name} est exposé ${fmtInt(m.exposureDayCount)} jours (≈ ${m.sessionsPerWeek}/sem., volume ${fmtInt(m.volumeReps)} reps).${perfCompareBit(m)} La trajectoire lit ${storyFr(m.primaryStory)}. La fréquence ne garantit pas la progression : charge, technique ou granularité des séries peuvent limiter la lecture.${plannedBit}`;
      importance = 0.84;
    } else if (f.kind === 'freq_decline_with_low_exposure') {
      kind = 'disc_freq_decline_low_exposure';
      title = `${m.name} : recul et exposition faible coïncident`;
      body = `${m.name} combine ${storyFr(m.primaryStory)} avec seulement ${fmtInt(m.exposureDayCount)} jour${m.exposureDayCount > 1 ? 's' : ''} d’exposition (≈ ${m.sessionsPerWeek}/sem., volume ${fmtInt(m.volumeReps)} reps).${perfCompareBit(m)} La co-occurrence est établie ; aucune relation causale entre le recul et le niveau d’exposition n’est affirmée.${plannedBit}`;
      importance = 0.8;
    } else continue;

    freqCards.push({
      kind,
      nature: 'trajectory',
      family: 'program_freq_progress',
      title,
      body,
      evidence: `${m.freqBand} · ${m.exposureDayCount} j · ${m.primaryStory}`,
      weights: { importance, reliability: 0.86, novelty: 0.84, fit: 0.9 },
      metrics: {
        ...m,
        ...trajMetrics,
        findingKind: f.kind,
        draftTitle: title,
        draftBody: body
      }
    });
  }

  freqCards.sort(
    (a, b) => (b.weights?.importance || 0) - (a.weights?.importance || 0)
  );
  out.push(...freqCards.slice(0, 3));
  return out;
}

/**
 * API pipeline : matrice → findings → cartes.
 */
export function buildProgramAdherenceDiscoveries({
  snapshot = null,
  window = null,
  getExerciseNameById = null,
  liveExercisesByDate = null
} = {}) {
  if (!snapshot || !window?.start || !window?.end) return [];

  const matrix = buildPlanRealizationMatrix({
    workoutData: snapshot,
    window,
    liveExercisesByDate,
    getExerciseNameById
  });

  const adherencePack = buildAdherenceFindingsFromMatrix(matrix, { getExerciseNameById });
  const freqPack = buildFrequencyProgressFindings({
    snapshot,
    window,
    getExerciseNameById,
    matrix
  });

  const trajById = new Map();
  for (const row of freqPack.exerciseRows || []) {
    if (row.traj?.ok) trajById.set(String(row.exerciseId), row.traj);
  }

  const cards = composeProgramAdherenceDiscoveries(adherencePack, freqPack, { trajById });
  return cards.map((c) => ({
    ...c,
    metrics: {
      ...(c.metrics || {}),
      matrixLimits: matrix.limits || [],
      adherencePrimary: matrix.adherenceSnapshotOnly?.primary || 'adjusted'
    }
  }));
}
