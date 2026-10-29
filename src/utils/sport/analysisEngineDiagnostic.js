/**
 * Rapport de diagnostic du moteur d'analyse Recap.
 * Observe le même pipeline que l'UI (buildAdaptiveRecapInsights) sans en altérer
 * les résultats métier ni la mémoire d'insights quand collectDiagnostic=true.
 */

import { buildAdaptiveRecapInsights } from './recapAdaptiveInsights';
import { getRecapDateWindow } from './recapMuscleLoadEngine';
import { buildRecapEnrichmentBundle } from './recapEnrichmentMetrics';
import { computeRecapUserAssessment } from './recapUserAssessment';
import { signalFamilyOfKind } from './recapInsightNature';
import { analysisFamilyOfKind } from './recapSelectionDiagnostics';
import {
  assertAnalyticalDepthPositive,
  hasDeferredReasoningPhrase
} from './recapAnalysisDepthAssert';
import { kindFromNarrativeCandidate } from './recapNarrativeClaims';
import { enrichDiagnosticReport } from './analysisEngineDiagnosticModel';

const PERIODS = ['today', '7d', '30d', '3m', '6m', '1y', 'all'];

function nowMs() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

function cardText(row) {
  const ctx = row?.interpretation?.context || {};
  return {
    title: ctx.title || row?.title || '',
    body: ctx.body || row?.body || row?.text || '',
    evidence: ctx.evidenceLine || row?.evidence || '',
    kind: ctx.kind || row?.kind || kindFromNarrativeCandidate(row) || ''
  };
}

function qualityOfText(title, body) {
  const blob = `${title || ''} ${body || ''}`.trim();
  const depth = assertAnalyticalDepthPositive(blob, { requireComparison: false });
  const flags = [...(depth.issues || [])];
  if (hasDeferredReasoningPhrase(blob)) flags.push('deferred_reasoning');
  if (/beaucoup plus robuste|prouve que|causé par/i.test(blob)) flags.push('overconfident');
  if (/il manquerait environ \d/i.test(blob)) flags.push('prescription_quota');
  if (blob.length < 80) flags.push('thin_copy');
  return {
    flags,
    hasComparison: depth.hasComparison,
    hasImplication: depth.hasImplication,
    levelHint: depth.levelHint
  };
}

function summarizeDataAvailability({ snapshot, enrichment, garminData, window, assessment }) {
  const repsKeys = Object.keys(snapshot?.reps || {}).length;
  const checkedKeys = Object.keys(snapshot?.checkedExercises || {}).length;
  const gtgDays = Object.keys(snapshot?.enduranceData?.gtg?.days || {}).length;
  const weightEntries = (snapshot?.progressEntries || []).filter(
    (e) => e?.type === 'metrics' || e?.type === 'impedance'
  ).length;
  const nightHint =
    garminData?.dailyMetrics != null
      ? Object.keys(garminData.dailyMetrics).length
      : enrichment?.sleepDaily?.length || 0;
  return [
    {
      id: 'reps',
      label: 'Répétitions / perfs',
      family: 'performances',
      status: repsKeys > 0 ? 'ok' : 'missing',
      n: repsKeys,
      nInPeriod: 'non instrumenté',
      nConsumed: 'non instrumenté',
      source: 'snapshot.reps',
      fields: ['clé date_exercice', 'valeur']
    },
    {
      id: 'checked',
      label: 'Exercices cochés',
      family: 'séances',
      status: checkedKeys > 0 ? 'ok' : 'missing',
      n: checkedKeys,
      nConsumed: 'non instrumenté',
      source: 'snapshot.checkedExercises',
      fields: ['clé date_exercice', 'bool']
    },
    {
      id: 'completion',
      label: 'Complétion programme',
      family: 'assiduité',
      status: enrichment?.completion ? 'ok' : 'sparse',
      n: enrichment?.completion?.activeTrainingDays ?? null,
      source: 'enrichment.completion',
      fields: ['activeTrainingDays', 'rates']
    },
    {
      id: 'dow',
      label: 'Assiduité par jour',
      family: 'assiduité',
      status: (enrichment?.dayOfWeek || []).some((d) => d.plannedDays > 0) ? 'ok' : 'sparse',
      n: (enrichment?.dayOfWeek || []).filter((d) => d.plannedDays > 0).length,
      source: 'enrichment.dayOfWeek',
      fields: ['plannedDays', 'doneDays']
    },
    {
      id: 'gtg',
      label: 'GTG',
      family: 'gtg',
      status: gtgDays > 0 ? 'ok' : 'missing',
      n: gtgDays,
      source: 'snapshot.enduranceData.gtg',
      fields: ['days', 'config']
    },
    {
      id: 'sleep',
      label: 'Sommeil (Garmin / digest)',
      family: 'sommeil',
      status: nightHint > 0 ? (nightHint >= 8 ? 'ok' : 'sparse') : 'missing',
      n: nightHint,
      source: 'garmin.dailyMetrics | enrichment.sleepDaily',
      fields: ['sleep', 'duration', 'scores']
    },
    {
      id: 'weight',
      label: 'Poids / mensurations',
      family: 'corps',
      status: weightEntries >= 2 ? 'ok' : weightEntries === 1 ? 'sparse' : 'missing',
      n: weightEntries,
      source: 'snapshot.progressEntries',
      fields: ['type', 'weight', 'date']
    },
    {
      id: 'window',
      label: 'Fenêtre d’analyse',
      family: 'temporel',
      status: window?.start && window?.end ? 'ok' : 'missing',
      n: window?.start && window?.end ? 1 : 0,
      source: 'recap window',
      detail: window ? `${window.start} → ${window.end}` : null,
      coverage: window ? `${window.start} → ${window.end}` : null
    },
    {
      id: 'assessment',
      label: 'Assessment Recap',
      family: 'contexte',
      status: assessment ? 'ok' : 'missing',
      n: assessment ? 1 : 0,
      source: 'computeRecapUserAssessment',
      fields: ['insights', 'kpis']
    }
  ];
}

function annotateCandidate(row, status, reason = null, stage = null) {
  const t = cardText(row);
  const family = analysisFamilyOfKind(t.kind) || signalFamilyOfKind(t.kind);
  return {
    id: row.id || `${t.kind}|${status}`,
    kind: t.kind,
    family,
    signalFamily: signalFamilyOfKind(t.kind),
    title: t.title,
    body: t.body,
    evidence: t.evidence,
    weight: row.weight ?? null,
    score: row.score ?? null,
    horizon: row.horizon || null,
    nature: row.nature || row.interpretation?.nature || null,
    status,
    reason: reason || row.reason || null,
    stage,
    metrics: row.metrics || row.interpretation?.metrics || row.interpretation?.context?.metrics || null,
    quality: qualityOfText(t.title, t.body),
    producerHint: String(row.id || '').startsWith('relation.reading.')
      ? 'recapHorizonEssays / discoveries'
      : String(row.id || '').includes('span_')
        ? 'spanStories'
        : 'pipeline'
  };
}

/**
 * Construit un rapport de diagnostic exécuté sur les données réelles.
 * @param {object} opts
 */
export function buildAnalysisEngineDiagnosticReport(opts = {}) {
  const {
    snapshot = {},
    period = '30d',
    window: windowIn = null,
    garminData = null,
    garminPartial = null,
    getExerciseNameById = null,
    profileQuestionnaireRaw = null,
    activeProgram = null,
    programs = [],
    enrichment: enrichmentIn = null,
    assessment: assessmentIn = null,
    recapState = null,
    isAdmin = false,
    isAuthenticated = false,
    getTodayWorkout = null
  } = opts;

  const t0 = nowMs();
  const stages = [];
  const pushStage = (id, label, module, extra = {}) => {
    stages.push({
      id,
      label,
      module,
      executed: extra.executed !== false,
      skippedReason: extra.skippedReason || null,
      ms: extra.ms ?? null,
      inCount: extra.inCount ?? null,
      outCount: extra.outCount ?? null,
      warnings: extra.warnings || [],
      errors: extra.errors || [],
      detail: extra.detail || null
    });
  };

  const window = windowIn || enrichmentIn?.window || getRecapDateWindow(period, new Date());

  let assessment = assessmentIn;
  let enrichment = enrichmentIn;

  if (!assessment) {
    const s0 = nowMs();
    try {
      assessment = computeRecapUserAssessment({
        snapshot,
        activeProgram,
        profileQuestionnaireRaw,
        getExerciseNameById,
        programs: Array.isArray(programs) ? programs : [],
        periodWindow: window,
        garminData,
        garminPartial
      });
      pushStage('assessment', 'Assessment utilisateur', 'recapUserAssessment', {
        ms: Math.round(nowMs() - s0),
        outCount: 1
      });
    } catch (e) {
      pushStage('assessment', 'Assessment utilisateur', 'recapUserAssessment', {
        ms: Math.round(nowMs() - s0),
        executed: false,
        errors: [String(e?.message || e)]
      });
    }
  } else {
    pushStage('assessment', 'Assessment utilisateur', 'recapUserAssessment', {
      executed: true,
      skippedReason: 'fourni par l’appelant',
      outCount: 1
    });
  }

  if (!enrichment) {
    const s1 = nowMs();
    try {
      enrichment = buildRecapEnrichmentBundle({
        snapshot,
        window,
        programs: Array.isArray(programs) ? programs : [],
        garminPartial,
        assessment,
        recapState,
        getExerciseNameById,
        activeProgram: activeProgram ?? null,
        getTodayWorkout,
        isAdmin,
        isAuthenticated
      });
      pushStage('enrichment', 'Enrichissement Recap', 'recapEnrichmentMetrics', {
        ms: Math.round(nowMs() - s1),
        outCount: 1
      });
    } catch (e) {
      pushStage('enrichment', 'Enrichissement Recap', 'recapEnrichmentMetrics', {
        ms: Math.round(nowMs() - s1),
        executed: false,
        errors: [String(e?.message || e)]
      });
    }
  } else {
    pushStage('enrichment', 'Enrichissement Recap', 'recapEnrichmentMetrics', {
      skippedReason: 'fourni par l’appelant',
      outCount: 1
    });
  }

  const s2 = nowMs();
  let adaptive = null;
  try {
    adaptive = buildAdaptiveRecapInsights({
      legacyPistes: assessment?.insights || {},
      enrichment,
      assessment,
      recapState,
      snapshot,
      window,
      garminData,
      garminPartial,
      garminDailyMetrics:
        garminPartial?.status === 'ready' ? garminPartial.dailyMetrics : null,
      period,
      getExerciseNameById,
      profileQuestionnaireRaw,
      activeProgram,
      programs: Array.isArray(programs) ? programs : [],
      collectDiagnostic: true
    });
    pushStage('adaptive', 'Insights adaptatifs + sélection', 'recapAdaptiveInsights', {
      ms: Math.round(nowMs() - s2),
      outCount:
        (adaptive?.insights?.shortTerm?.length || 0) +
        (adaptive?.insights?.mediumTerm?.length || 0) +
        (adaptive?.insights?.longTerm?.length || 0),
      detail: adaptive?.diagnostic?.stages || null
    });
  } catch (e) {
    pushStage('adaptive', 'Insights adaptatifs + sélection', 'recapAdaptiveInsights', {
      ms: Math.round(nowMs() - s2),
      executed: false,
      errors: [String(e?.message || e)]
    });
  }

  const diag = adaptive?.diagnostic || {};
  const discoveries = adaptive?.periodDiscoveries || {};
  const selectionDiagnostics = adaptive?.selectionDiagnostics || null;

  const discoveryCandidates = (discoveries.all || []).map((d) => {
    const dropped = (discoveries.dropped || []).find(
      (x) => (x.id && x.id === d.id) || (x.kind === d.kind && x.title === d.title)
    );
    const selected = (discoveries.selected || []).some(
      (x) => x.kind === d.kind && (x.title === d.title || x.id === d.id)
    );
    return annotateCandidate(
      d,
      selected ? 'discovery_selected' : dropped ? 'discovery_dropped' : 'discovery_not_selected',
      dropped?.reason || null,
      'periodDiscoveries'
    );
  });

  const pipelineStages = diag.candidateStages || {};
  const shownCards = [
    ...(adaptive?.insights?.shortTerm || []).map((c) =>
      annotateCandidate({ ...c, horizon: 'short' }, 'shown', null, 'final')
    ),
    ...(adaptive?.insights?.mediumTerm || []).map((c) =>
      annotateCandidate({ ...c, horizon: 'medium' }, 'shown', null, 'final')
    ),
    ...(adaptive?.insights?.longTerm || []).map((c) =>
      annotateCandidate({ ...c, horizon: 'long' }, 'shown', null, 'final')
    )
  ];

  const rejections = [
    ...(pipelineStages.deduped || []).map((r) =>
      annotateCandidate(r, 'rejected', 'dedup_kinship', 'dedup')
    ),
    ...(pipelineStages.insufficient || []).map((r) =>
      annotateCandidate(r, 'rejected', 'insufficient_or_invalid', 'validate')
    ),
    ...(pipelineStages.rankedOut || []).map((r) =>
      annotateCandidate(r, 'rejected', 'ranked_out_caps', 'select')
    ),
    ...(discoveries.dropped || []).map((r) =>
      annotateCandidate(r, 'rejected', r.reason || 'discovery_drop', 'periodDiscoveries')
    )
  ];

  const signals = {
    phenomena: (adaptive?.phenomena || []).map((p) => ({
      type: p.type,
      status: 'calculated',
      detail: p
    })),
    sleepCandidateTypes: discoveries?.debug?.sleepCandidateTypes || [],
    sleepDetected: discoveries?.debug?.sleepDetected || [],
    sleepSelected: discoveries?.debug?.sleepSelected || [],
    milestonesDetected: discoveries?.debug?.milestonesDetected || [],
    milestonesSelected: discoveries?.debug?.milestonesSelected || [],
    correlations: (discoveries?.extras?.sleepCandidates || []).map((c) => ({
      type: c.type,
      status: 'calculated',
      nHigh: c.highN ?? c.highTrainedN ?? null,
      nLow: c.lowN ?? c.lowTrainedN ?? null,
      confidence: c.confidence || null,
      metrics: c
    })),
    notCalculatedNote:
      'Seules les corrélations effectivement produites par publishSleepCandidates / detectDiscoveries apparaissent ici.'
  };

  const dataInventory = summarizeDataAvailability({
    snapshot,
    enrichment,
    garminData,
    window,
    assessment
  });

  const overview = {
    period,
    window,
    voiceKey: diag.voiceKey || null,
    signalsDetected:
      (discoveries.all || []).length + (adaptive?.phenomena || []).length + signals.correlations.length,
    candidatesProduced: pipelineStages.produced?.length ?? discoveryCandidates.length,
    candidatesRetained: shownCards.length,
    candidatesShown: shownCards.length,
    candidatesRejected: rejections.length,
    starvedFamilies: adaptive?.starvedFamilies || [],
    rescuedFamilies: adaptive?.rescuedFamilies || [],
    totalMs: Math.round(nowMs() - t0),
    warnings: [
      ...dataInventory.filter((d) => d.status === 'missing').map((d) => `Donnée manquante : ${d.label}`),
      ...(adaptive?.starvedFamilies || []).map(
        (f) => `Famille produite mais non affichée : ${f.family}`
      )
    ],
    signature: adaptive?.signature || null
  };

  const baseReport = {
    meta: {
      generatedAt: new Date().toISOString(),
      period,
      supportedPeriods: PERIODS,
      mode: 'diagnostic',
      samePipeline: true,
      sideEffectsSuppressed: true,
      displayScopeNote:
        'shown = pack final de CE run diagnostic uniquement (pas l’historique d’affichages passés).'
    },
    overview,
    stages: [...stages, ...(diag.pipelineSteps || [])],
    dataInventory,
    signals,
    candidates: {
      discoveries: discoveryCandidates,
      produced: (pipelineStages.produced || []).map((r) =>
        annotateCandidate(r, 'produced', null, 'produced')
      ),
      shown: shownCards
    },
    rejections,
    selectionDiagnostics,
    quality: {
      shownFlags: shownCards.flatMap((c) =>
        (c.quality?.flags || []).map((f) => ({ id: c.id, kind: c.kind, flag: f }))
      ),
      deferredShown: shownCards.filter((c) =>
        (c.quality?.flags || []).includes('deferred_reasoning')
      )
    },
    insights: adaptive?.insights || null,
    raw: {
      periodDiscoveriesDebug: discoveries.debug || null,
      caps: diag.caps || null,
      candidateStages: {
        produced: pipelineStages.produced?.length ?? null,
        insufficient: pipelineStages.insufficient?.length ?? null,
        deduped: pipelineStages.deduped?.length ?? null,
        rankedOut: pipelineStages.rankedOut?.length ?? null
      }
    }
  };

  return enrichDiagnosticReport(baseReport);
}

export function compareDiagnosticOverviews(a, b) {
  if (!a?.overview || !b?.overview) return null;
  return {
    periodA: a.meta?.period,
    periodB: b.meta?.period,
    shownDelta: (b.overview.candidatesShown || 0) - (a.overview.candidatesShown || 0),
    rejectedDelta: (b.overview.candidatesRejected || 0) - (a.overview.candidatesRejected || 0),
    signalsDelta: (b.overview.signalsDetected || 0) - (a.overview.signalsDetected || 0),
    familiesA: a.selectionDiagnostics?.byFamily || {},
    familiesB: b.selectionDiagnostics?.byFamily || {}
  };
}

export { PERIODS as DIAGNOSTIC_PERIODS };
