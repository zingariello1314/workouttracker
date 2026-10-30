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
import { resolveAnalysisFamily, analysisFamilyLabel } from './recapSelectionDiagnostics';
import {
  assertAnalyticalDepthPositive,
  hasDeferredReasoningPhrase
} from './recapAnalysisDepthAssert';
import { kindFromNarrativeCandidate } from './recapNarrativeClaims';
import { enrichDiagnosticReport } from './analysisEngineDiagnosticModel';
import { buildAnalysisEngineDataCatalog } from './analysisEngineDataCatalog';

const PERIODS = ['today', '7d', '30d', '3m', '6m', '1y', 'all'];

function nowMs() {
  return typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
}

function cardText(row) {
  const ctx = row?.interpretation?.context || row?.context || {};
  return {
    title: ctx.title || row?.title || '',
    body: ctx.body || row?.body || row?.text || '',
    evidence: ctx.evidenceLine || row?.evidence || '',
    kind: ctx.kind || row?.kind || kindFromNarrativeCandidate(row) || '',
    rewardTone: ctx.rewardTone || row?.rewardTone || null
  };
}

function producerHintFor(row, kind) {
  const id = String(row?.id || '');
  const k = String(kind || '');
  if (k.startsWith('disc_ms_')) return 'recapMilestoneEngine';
  if (k.startsWith('disc_gtg_')) return 'recapGtgUnplannedReading';
  if (k.startsWith('disc_sleep_')) return 'sleep / periodDiscoveries';
  if (k.startsWith('disc_')) return 'recapPeriodDiscoveries → horizon essays';
  if (id.includes('span_')) return 'spanStories';
  if (id.startsWith('relation.reading.')) return 'recapHorizonEssays / discoveries';
  if (k.includes('gtg')) return 'recapGtgUnplannedReading';
  if (k.includes('sleep')) return 'sleep / periodDiscoveries';
  return 'pipeline';
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

function summarizeDataAvailability(ctx) {
  const catalog = buildAnalysisEngineDataCatalog(ctx);
  // Compat inventaire : même shape enrichie (source = originPath)
  return catalog.items.map((it) => ({
    ...it,
    family: it.tab,
    source: it.originPath,
    nConsumed: 'non instrumenté'
  }));
}

function annotateCandidate(row, status, reason = null, stage = null) {
  const t = cardText(row);
  const family =
    resolveAnalysisFamily({ ...row, kind: t.kind }) || signalFamilyOfKind(t.kind) || 'misc';
  const metrics =
    row.metrics ||
    row.interpretation?.metrics ||
    row.interpretation?.context?.metrics ||
    null;
  const evidenceList = Array.isArray(row.evidence)
    ? row.evidence
    : Array.isArray(row.interpretation?.evidence)
      ? row.interpretation.evidence
      : null;
  return {
    id: row.id || `${t.kind}|${status}`,
    kind: t.kind,
    family,
    familyLabel: analysisFamilyLabel(family),
    signalFamily: signalFamilyOfKind(t.kind),
    title: t.title,
    body: t.body,
    evidence: typeof row.evidence === 'string' ? row.evidence : t.evidence,
    evidenceList,
    weight: row.weight ?? null,
    score: row.score ?? null,
    confidence: row.confidence ?? row.interpretation?.confidence ?? null,
    relevance: row.relevance ?? row.interpretation?.relevance ?? null,
    horizon: row.horizon || row.interpretation?.horizon || null,
    nature: row.nature || row.interpretation?.nature || row.interpretation?.context?.nature || null,
    status,
    reason: reason || row.reason || null,
    stage,
    metrics,
    scope: row.scope || row.interpretation?.scope || null,
    noveltyKey: row.noveltyKey || null,
    evidenceFamilyId: row.evidenceFamilyId || null,
    interpretation: row.interpretation || null,
    quality: qualityOfText(t.title, t.body),
    rewardTone: t.rewardTone,
    producerHint: producerHintFor(row, t.kind)
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
  const wall0 = Date.now();
  const stages = [];
  const pushStage = (id, label, module, extra = {}) => {
    const ms = extra.ms ?? null;
    const endedAt = extra.endedAt || new Date().toISOString();
    const startedAt =
      extra.startedAt ||
      (ms != null ? new Date(Date.now() - ms).toISOString() : endedAt);
    stages.push({
      id,
      label,
      module,
      executed: extra.executed !== false,
      skippedReason: extra.skippedReason || null,
      ms,
      startedAt,
      endedAt,
      inCount: extra.inCount ?? null,
      outCount: extra.outCount ?? null,
      countUnit: extra.countUnit || null,
      countSemantics: extra.countSemantics || null,
      produced: extra.produced ?? null,
      filtered: extra.filtered ?? null,
      merged: extra.merged ?? null,
      dropped: extra.dropped ?? null,
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
        outCount: 1,
        countUnit: 'bundle',
        produced: 1
      });
    } catch (e) {
      pushStage('assessment', 'Assessment utilisateur', 'recapUserAssessment', {
        ms: Math.round(nowMs() - s0),
        executed: false,
        countUnit: 'bundle',
        errors: [String(e?.message || e)]
      });
    }
  } else {
    pushStage('assessment', 'Assessment utilisateur', 'recapUserAssessment', {
      executed: true,
      skippedReason: 'fourni par l’appelant',
      outCount: 1,
      countUnit: 'bundle',
      produced: 1
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
        outCount: 1,
        countUnit: 'bundle',
        produced: 1
      });
    } catch (e) {
      pushStage('enrichment', 'Enrichissement Recap', 'recapEnrichmentMetrics', {
        ms: Math.round(nowMs() - s1),
        executed: false,
        countUnit: 'bundle',
        errors: [String(e?.message || e)]
      });
    }
  } else {
    pushStage('enrichment', 'Enrichissement Recap', 'recapEnrichmentMetrics', {
      skippedReason: 'fourni par l’appelant',
      outCount: 1,
      countUnit: 'bundle',
      produced: 1
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
    const shownN =
      (adaptive?.insights?.shortTerm?.length || 0) +
      (adaptive?.insights?.mediumTerm?.length || 0) +
      (adaptive?.insights?.longTerm?.length || 0);
    const producedN = adaptive?.diagnostic?.candidateStages?.produced?.length ?? null;
    pushStage('adaptive', 'Insights adaptatifs + sélection', 'recapAdaptiveInsights', {
      ms: Math.round(nowMs() - s2),
      inCount: producedN,
      outCount: shownN,
      countUnit: 'candidates',
      produced: producedN,
      dropped: producedN != null ? Math.max(0, producedN - shownN) : null,
      detail: {
        wallClockOffsetMs: Math.round(Date.now() - wall0),
        produced: producedN,
        shown: shownN,
        insufficient: adaptive?.diagnostic?.candidateStages?.insufficient?.length ?? null,
        deduped: adaptive?.diagnostic?.candidateStages?.deduped?.length ?? null,
        rankedOut: adaptive?.diagnostic?.candidateStages?.rankedOut?.length ?? null
      }
    });
  } catch (e) {
    pushStage('adaptive', 'Insights adaptatifs + sélection', 'recapAdaptiveInsights', {
      ms: Math.round(nowMs() - s2),
      executed: false,
      countUnit: 'candidates',
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
  // Préférer les candidats complets (metrics / interpretation) — toInsightCard les strippe.
  const shownSource =
    Array.isArray(pipelineStages.shown) && pipelineStages.shown.length
      ? pipelineStages.shown
      : [
          ...(adaptive?.insights?.shortTerm || []).map((c) => ({ ...c, horizon: c.horizon || 'short' })),
          ...(adaptive?.insights?.mediumTerm || []).map((c) => ({
            ...c,
            horizon: c.horizon || 'medium'
          })),
          ...(adaptive?.insights?.longTerm || []).map((c) => ({ ...c, horizon: c.horizon || 'long' }))
        ];
  const shownCards = shownSource.map((c) => annotateCandidate(c, 'shown', null, 'final'));

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

  const dataCatalog = buildAnalysisEngineDataCatalog({
    snapshot,
    enrichment,
    garminData,
    garminPartial,
    window,
    assessment,
    activeProgram,
    programs: Array.isArray(programs) ? programs : [],
    profileQuestionnaireRaw
  });
  const dataInventory = summarizeDataAvailability({
    snapshot,
    enrichment,
    garminData,
    garminPartial,
    window,
    assessment,
    activeProgram,
    programs: Array.isArray(programs) ? programs : [],
    profileQuestionnaireRaw
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
    dataTotals: dataCatalog.totals,
    warnings: [
      ...dataInventory
        .filter((d) => d.status === 'missing')
        .map((d) => `Donnée manquante : ${d.label} (${d.tab} › ${d.subtab})`),
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
    dataCatalog,
    dataCatalogShort: dataCatalog.short,
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
