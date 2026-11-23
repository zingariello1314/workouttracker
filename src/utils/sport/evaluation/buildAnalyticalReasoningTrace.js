/**
 * Trace de raisonnement analytique (observabilité P6).
 * Réutilise serializeConclusion des dossiers 8 périodes — pas un second moteur.
 * Ne fabrique jamais une trace rétrospective absente du run.
 */

import { analysisEditionKey } from '../analysisEdition';
import { serializeConclusion } from '../analysisPeriodExport';
import { normalizePipelineStages } from '../analysisEnginePipelineModel';
import { buildUnderexplorationReport } from '../underexplorationReport';

const COLUMNS = ['shortTerm', 'mediumTerm', 'longTerm'];

function text(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((item) => String(item || '')).filter(Boolean).join(' · ');
  return value == null ? '' : String(value);
}

function significantDiff(before, after, fields) {
  const changes = [];
  for (const field of fields) {
    const a = before?.[field];
    const b = after?.[field];
    if (a === b) continue;
    const sa = text(a).slice(0, 280);
    const sb = text(b).slice(0, 280);
    if (sa === sb) continue;
    changes.push({ field, before: sa || null, after: sb || null });
  }
  return changes;
}

/**
 * Transformations sémantiques pertinentes (diffs), pas copies intégrales.
 */
export function extractTransformations(card) {
  const out = [];
  const drafting = card?.drafting || card?.inspection?.drafting || null;
  const lineage = card?.lineage || null;
  const inspection = card?.inspection || null;

  if (drafting?.producer || drafting?.module) {
    out.push({
      step: 'create_or_compose',
      module: drafting.producer || drafting.module || card?.metrics?.producer || 'unknown',
      justification: drafting.reason || drafting.note || null,
      diff: null
    });
  }

  if (drafting?.titleBefore || drafting?.bodyBefore) {
    const changes = significantDiff(
      { title: drafting.titleBefore, body: drafting.bodyBefore },
      { title: card?.title, body: card?.body || card?.text },
      ['title', 'body']
    );
    if (changes.length) {
      out.push({
        step: 'rewrite_text',
        module: drafting.rewriter || drafting.module || 'editorial',
        justification: drafting.rewriteReason || drafting.reason || null,
        diff: changes
      });
    }
  }

  if (drafting?.thesisBefore || drafting?.claimBefore) {
    const changes = significantDiff(
      { thesis: drafting.thesisBefore || drafting.claimBefore },
      { thesis: card?.claim?.thesis || card?.claim?.statement || card?.title },
      ['thesis']
    );
    if (changes.length) {
      out.push({
        step: 'transform_thesis',
        module: drafting.thesisModule || drafting.module || 'narrative_authority',
        justification: drafting.thesisReason || null,
        diff: changes
      });
    }
  }

  if (card?.collapsedInto || card?.p6Disposition === 'source_retained') {
    out.push({
      step: 'merge_or_deepen',
      module: 'p6_selection',
      justification: card?.reason || card?.admission?.reason || 'collapsed_into_parent',
      targetId: card?.collapsedInto || null,
      diff: null
    });
  }

  if (card?.p6Disposition === 'ranked_out' || card?.disposition === 'reserve') {
    out.push({
      step: 'demote_or_reserve',
      module: 'selection',
      justification: card?.reason || card?.lineage?.selection || null,
      diff: null
    });
  }

  if (inspection?.invalidated || card?.validation?.ok === false) {
    out.push({
      step: 'invalidate_claim',
      module: inspection?.validator || 'validate',
      justification: inspection?.invalidationReason || card?.validation?.reason || null,
      diff: null
    });
  }

  if (lineage?.classificationBefore && lineage?.classificationBefore !== (card?.analyticalCategory || card?.category)) {
    out.push({
      step: 'reclassify',
      module: lineage.classifier || 'classification',
      justification: lineage.classificationReason || null,
      diff: significantDiff(
        { category: lineage.classificationBefore },
        { category: card?.analyticalCategory || card?.category },
        ['category']
      )
    });
  }

  if (card?.memory?.transition) {
    out.push({
      step: 'memory_decision',
      module: 'analytical_memory',
      justification: `${card.memory.state || '?'} ← ${card.memory.transition}`,
      diff: null
    });
  }

  return out;
}

export function buildModuleExecutionMap({ pipelineSteps = null, debug = null, p6 = null } = {}) {
  const rawSteps =
    pipelineSteps ||
    debug?.pipelineSteps ||
    debug?.stages ||
    p6?.pipelineSteps ||
    [];
  const normalized = normalizePipelineStages(Array.isArray(rawSteps) ? rawSteps : []);

  const modules = normalized.map((st) => ({
    id: st.id,
    role: st.functionalLabel || st.label || st.id,
    status:
      st.stageStatus === 'ok'
        ? 'executed'
        : st.stageStatus === 'skipped'
          ? 'not_applicable'
          : st.stageStatus === 'not_run'
            ? 'not_called'
            : st.stageStatus === 'error'
              ? 'error'
              : st.stageStatus === 'untraceable'
                ? 'untraceable'
                : st.executed === false
                  ? 'not_called'
                  : 'executed',
    inputsUsed: st.inCount ?? null,
    examined: st.inCount ?? st.examined ?? null,
    produced: st.outCount ?? st.produced ?? null,
    significantOutputs: (st.sampleOut || st.outputs || []).slice?.(0, 8) || null,
    consumers: st.consumers || st.next || null,
    ms: st.ms ?? null,
    skippedReason: st.skippedReason || null,
    errors: st.errors || null
  }));

  // Capacités connues — sans instrumentation, statut = unknown (≠ non appelé)
  const EXPECTED = [
    'assessment',
    'enrichment',
    'adaptive',
    'composed',
    'span_stories',
    'weight_novelty',
    'dedup',
    'validate',
    'select',
    'facts',
    'exploration',
    'memory',
    'hierarchy',
    'publication'
  ];
  const instrumented = normalized.length > 0;
  const seen = new Set(modules.map((m) => m.id));
  const missingExpected = EXPECTED.filter((id) => !seen.has(id)).map((id) => ({
    id,
    role: id,
    status: instrumented ? 'not_called' : 'unknown_not_instrumented',
    note: instrumented
      ? 'Attendu dans le modèle, absent des étapes observées'
      : 'Exécution inconnue faute d’instrumentation — ne pas conclure à une non-exécution'
  }));

  const all = [...modules, ...missingExpected];
  return {
    schema: 'momentum.moduleExecutionMap.v2',
    modules: all,
    summary: {
      executed: all.filter((m) => m.status === 'executed').length,
      notCalled: all.filter((m) => m.status === 'not_called').length,
      unknownNotInstrumented: all.filter((m) => m.status === 'unknown_not_instrumented').length,
      error: all.filter((m) => m.status === 'error').length,
      totalMs: modules.reduce((s, m) => s + (Number(m.ms) > 0 ? Number(m.ms) : 0), 0)
    },
    instrumented,
    note: instrumented
      ? 'Carte dérivée des étapes instrumentées du run'
      : 'Aucune étape pipeline dans le pack — modules en unknown_not_instrumented (pas not_called)'
  };
}

function collectFromDossier(dossier, period) {
  const conclusions = {};
  const rejected = {};
  const fused = {};
  const paths = [
    ['priority', dossier?.userAccessible?.priority],
    ['reserve', dossier?.userAccessible?.reserve],
    ['rejected', dossier?.registry?.rejected],
    ['fused', dossier?.registry?.fused],
    ['blocked', dossier?.registry?.blocked],
    ['raw', dossier?.registry?.raw]
  ];

  for (const [lane, list] of paths) {
    (list || []).forEach((row, index) => {
      const id = row?.id || row?.publicationId || `${lane}-${index}`;
      const key = `${period}|${id}`;
      const entry = {
        ...row,
        period,
        lane,
        transformations: extractTransformations(row),
        reasoningPath: {
          facts: row?.metrics?.sharedFacts || row?.sharedFacts || row?.proofs || null,
          hypothesesExamined: row?.hypotheses || null,
          validation: row?.admissibility || row?.inspection?.admissibility || null,
          memory: row?.memory || null,
          selection: row?.selectionReason || row?.disposition || null,
          publication: row?.role === 'priority' || row?.role === 'reserve' ? row.role : null
        }
      };
      if (lane === 'rejected' || lane === 'blocked') rejected[key] = entry;
      else if (lane === 'fused') fused[key] = entry;
      else if (lane === 'priority' || lane === 'reserve') conclusions[key] = entry;
      // raw: index léger seulement si pas déjà dans une autre voie
      else if (!conclusions[key] && !rejected[key] && !fused[key]) {
        conclusions[key] = { ...entry, lane: 'raw_unselected' };
      }
    });
  }

  return { conclusions, rejected, fused };
}

function buildExplorationLifecycle({ underexploration, dossier, period }) {
  const report =
    underexploration ||
    dossier?.registry?.underexploration ||
    null;
  const matrix = report?.coverageMatrix?.rows || report?.coverageMatrix || [];
  const rows = Array.isArray(matrix) ? matrix : matrix?.rows || [];

  const lifecycle = (rows.length ? rows : []).map((row) => {
    const status = row.status;
    let lane = 'unknown';
    if (status === 'never_tested') lane = 'applicable_never_executed';
    else if (status === 'applicability_data_dependent') lane = 'relation_not_applicable_or_data_unavailable';
    else if (status === 'examined_abstained') lane = 'data_insufficient_abstained';
    else if (status === 'data_present_not_elevated') lane = 'explored_no_conclusion';
    else if (status === 'tested_non_conclusive') lane = 'explored_no_conclusion';
    else if (status === 'candidate_kind_present_not_elevated') lane = 'validated_not_selected';
    else if (status === 'tested_with_candidate') lane = 'conclusion_produced_or_published';

    return {
      period,
      relation: row.relation,
      question: row.question,
      lane,
      status,
      methodExecuted: row.methodExecuted || null,
      candidatesExamined: row.candidatesExamined ?? 0,
      conclusions: row.conclusions || [],
      abstentionReason: row.abstentionReason || null,
      honesty:
        status === 'never_tested'
          ? 'Aucune preuve d’exécution du mécanisme — ne pas prétendre que la relation a été examinée'
          : null
    };
  });

  return {
    schema: 'momentum.explorationLifecycle.v1',
    period,
    rows: lifecycle,
    summary: {
      dataUnavailableOrConditional: lifecycle.filter((r) =>
        r.lane.includes('data')
      ).length,
      neverExecuted: lifecycle.filter((r) => r.lane === 'applicable_never_executed').length,
      exploredNoConclusion: lifecycle.filter((r) => r.lane === 'explored_no_conclusion').length,
      producedOrPublished: lifecycle.filter((r) => r.lane === 'conclusion_produced_or_published')
        .length
    }
  };
}

/**
 * @param {object} opts
 * @param {object} opts.eightPeriodExport — dossiers déjà sérialisés (source de vérité)
 * @param {object} [opts.analyticalAudit] — pour rapprocher runId / fingerprint
 * @param {boolean} [opts.detailed=true]
 */
export function buildAnalyticalReasoningTrace({
  eightPeriodExport = null,
  analyticalAudit = null,
  liveBundle = null,
  detailed = true,
  instrumentedRun = false
} = {}) {
  const assembledAt = new Date().toISOString();
  const edition = analysisEditionKey();
  const periods = eightPeriodExport?.periods || {};
  const periodIds = Object.keys(periods);

  const conclusionRegistry = {};
  const rejectionRegistry = {};
  const fusionRegistry = {};
  const moduleMaps = {};
  const explorationByPeriod = {};
  const anomalies = {
    claimsChangedAfterValidation: [],
    candidatesWithoutProof: [],
    hypothesesNotExplored: [],
    contradictoryConclusions: [],
    unjustifiedFusions: [],
    memoryAbsentOrIgnored: [],
    modulesExpectedNotRun: []
  };

  for (const period of periodIds) {
    const dossier = periods[period];
    if (!dossier) continue;

    const { conclusions, rejected, fused } = collectFromDossier(dossier, period);
    Object.assign(conclusionRegistry, conclusions);
    Object.assign(rejectionRegistry, rejected);
    Object.assign(fusionRegistry, fused);

    const p6 = dossier?.registry || null;
    const moduleMap = buildModuleExecutionMap({
      pipelineSteps: dossier?.timings?.pipelineSteps || dossier?.selection?.pipelineSteps,
      debug: dossier?.debug || null,
      p6
    });
    moduleMaps[period] = moduleMap;
    moduleMap.modules
      .filter((m) => m.status === 'not_called')
      .forEach((m) => {
        anomalies.modulesExpectedNotRun.push({ period, moduleId: m.id });
      });
    // unknown_not_instrumented : ne pas compter comme non-exécution démontrée

    const under =
      p6?.underexploration ||
      (p6
        ? buildUnderexplorationReport({
            discoveries: [
              ...(dossier.userAccessible?.priority || []),
              ...(dossier.userAccessible?.reserve || []),
              ...(dossier.registry?.raw || [])
            ],
            reviewDecisions: p6?.review?.decisions || p6?.pass4Decisions || [],
            graph: null,
            assessments: [],
            voiceKey: period
          })
        : null);
    explorationByPeriod[period] = buildExplorationLifecycle({
      underexploration: under,
      dossier,
      period
    });
    (explorationByPeriod[period].rows || [])
      .filter((r) => r.lane === 'applicable_never_executed')
      .forEach((r) => {
        anomalies.hypothesesNotExplored.push({
          period,
          relation: r.relation,
          question: r.question
        });
      });
  }

  // Anomalies sur conclusions
  Object.values(conclusionRegistry).forEach((c) => {
    const hasProof =
      c.proofs ||
      c.evidence ||
      c.metrics?.sharedFacts?.length ||
      c.claim?.proof ||
      c.inspector?.proofs;
    if (!hasProof && (c.role === 'priority' || c.role === 'reserve')) {
      anomalies.candidatesWithoutProof.push({ period: c.period, id: c.id, title: c.title });
    }
    // Mission 26 — mémoire absente ≠ anomalie si la carte n’est pas un phénomène mémorisable.
    // applicable : retours / émergences / collectifs / consolidations format ; pas chaque trajectoire.
    if (c.memory == null && (c.role === 'priority' || c.role === 'reserve')) {
      const kind = String(c.kind || c.detectorKind || '');
      const memoryApplicable =
        /collective_return|ms_return|emergence|format_consolidation|structural_memory|reinstall/i.test(
          kind
        ) || Boolean(c.phenomenonId && /return|emergence|collective/i.test(String(c.phenomenonId)));
      if (memoryApplicable) {
        anomalies.memoryAbsentOrIgnored.push({
          period: c.period,
          id: c.id,
          title: c.title,
          status: 'applicable_but_absent'
        });
      }
      // sinon : not_applicable — ne pas compter comme anomalie
    }
    const rewriteAfterValidate = (c.transformations || []).some(
      (t) => t.step === 'rewrite_text' || t.step === 'transform_thesis'
    );
    if (rewriteAfterValidate && c.admissibility) {
      anomalies.claimsChangedAfterValidation.push({
        period: c.period,
        id: c.id,
        title: c.title,
        transformations: c.transformations.filter(
          (t) => t.step === 'rewrite_text' || t.step === 'transform_thesis'
        )
      });
    }
  });

  Object.values(fusionRegistry).forEach((c) => {
    if (!c.reason && !c.collapsedInto) {
      anomalies.unjustifiedFusions.push({ period: c.period, id: c.id, title: c.title });
    }
  });
  // Mission 23 — parentId / deepening sans hierarchyLink.ok = anomalie (pas une fusion)
  Object.values(conclusionRegistry).forEach((c) => {
    const parentId = c.parentId || c.collapsedInto || null;
    const linkOk = c.hierarchyLink?.ok === true;
    if (
      parentId &&
      !linkOk &&
      (c.disposition === 'deepening_of_collective' ||
        c.reason === 'verified_hierarchy_deepening' ||
        c.lane === 'reserve')
    ) {
      anomalies.unjustifiedFusions.push({
        period: c.period,
        id: c.id,
        title: c.title,
        kind: 'unverified_hierarchy_parentId',
        parentId,
        hierarchyLink: c.hierarchyLink || null
      });
    }
  });

  // Contredictions simples : même phenomenonId, thèses opposées publiées
  const byPhenomenon = {};
  Object.values(conclusionRegistry).forEach((c) => {
    if (!c.phenomenonId || c.role !== 'priority') return;
    const k = `${c.period}|${c.phenomenonId}`;
    (byPhenomenon[k] ||= []).push(c);
  });
  Object.entries(byPhenomenon).forEach(([k, list]) => {
    if (list.length < 2) return;
    const titles = [...new Set(list.map((c) => c.title))];
    if (titles.length > 1) {
      anomalies.contradictoryConclusions.push({
        key: k,
        ids: list.map((c) => c.id),
        titles
      });
    }
  });

  const runId =
    eightPeriodExport?.analysisRunId ||
    analyticalAudit?.manifest?.analysisRunId ||
    `trace-${Date.now().toString(36)}`;

  const fingerprint =
    analyticalAudit?.manifest?.fingerprint ||
    periodIds
      .map((p) => periods[p]?.agreement?.snapshot || periods[p]?.engine?.dataFingerprint)
      .find(Boolean) ||
    null;

  const liveObservation = liveBundle
    ? {
        available: true,
        period: liveBundle?.recapAssessment?.insightsPublication?.period || liveBundle?.analysisPeriod,
        edition: liveBundle?.analysisEdition || null,
        packRole: liveBundle?.packRole || 'product_ui',
        status: liveBundle?.analysisStatus || null,
        fingerprint: liveBundle?.dataFingerprint || null
      }
    : { available: false };

  return {
    schema: 'momentum.analyticalReasoningTrace.v1',
    assembledAt,
    manifest: {
      analysisRunId: runId,
      edition,
      fingerprint,
      windows: periodIds.map((p) => ({
        period: p,
        start: periods[p]?.window?.start || null,
        end: periods[p]?.window?.end || null,
        provenance: periods[p]?.provenance || null,
        packId: periods[p]?.packId || null
      })),
      dataOrigin: 'eight_period_dossiers',
      executionMode: instrumentedRun ? 'instrumented_recompute' : 'reuse_existing_packs',
      memoryState: analyticalAudit?.memoryEvidence || null,
      provenanceProductReplayOrDom: {
        product: liveObservation,
        replay: eightPeriodExport?.schema || null,
        dom: analyticalAudit?.domEvidence || eightPeriodExport?.domNote || null
      },
      pairedAuditSchema: analyticalAudit?.schema || null,
      detailed,
      note:
        'Trace dérivée des dossiers 8 périodes (serializeConclusion). Pas un second ANALYTICAL_AUDIT. Pas de fabrication rétrospective si le module n’a pas instrumenté le run.'
    },
    conclusionRegistry: detailed ? conclusionRegistry : summarizeRegistry(conclusionRegistry),
    rejectionRegistry: detailed ? rejectionRegistry : summarizeRegistry(rejectionRegistry),
    fusionRegistry: detailed ? fusionRegistry : summarizeRegistry(fusionRegistry),
    moduleExecutionByPeriod: moduleMaps,
    explorationLifecycleByPeriod: explorationByPeriod,
    anomalies,
    inspectorParity: {
      serializer: 'serializeConclusion@analysisPeriodExport',
      sameAsPeriodDossier: true,
      sameAsInspectorWhenUsingSharedPayload: true,
      note: 'L’inspecteur UI et cette trace doivent partager serializeConclusion pour le même run'
    },
    sizeHints: {
      conclusionCount: Object.keys(conclusionRegistry).length,
      rejectionCount: Object.keys(rejectionRegistry).length,
      fusionCount: Object.keys(fusionRegistry).length,
      anomalyCounts: Object.fromEntries(
        Object.entries(anomalies).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0])
      )
    }
  };
}

function summarizeRegistry(reg) {
  return Object.fromEntries(
    Object.entries(reg).map(([k, v]) => [
      k,
      {
        id: v.id,
        period: v.period,
        lane: v.lane,
        title: v.title,
        disposition: v.disposition,
        transformationCount: (v.transformations || []).length
      }
    ])
  );
}

/**
 * Construit une conclusion sérialisée à partir d’une carte live (parité inspecteur).
 */
export function serializeForInspector(card, role = 'priority') {
  return serializeConclusion(card, role);
}

/**
 * Index d’inspection bulk : refs résolubles vers conclusionRegistry.
 */
export function buildBulkInspectionIndex(trace) {
  const entries = Object.entries(trace?.conclusionRegistry || {}).map(([key, row]) => ({
    key,
    id: row.id,
    period: row.period,
    title: row.title,
    role: row.role || row.lane,
    phenomenonId: row.phenomenonId,
    disposition: row.disposition
  }));
  return {
    schema: 'momentum.bulkInspectionIndex.v1',
    count: entries.length,
    entries
  };
}
