/**
 * Export d'audit par période. Le paquet d'une autre période ne remplace
 * jamais la période demandée. Le registre brut reste distinct des
 * conclusions accessibles à l'utilisateur.
 */

import { analysisEditionKey } from './analysisEdition';
import { snapshotFingerprint } from './analysisEnvironmentDossier';

export const EIGHT_PERIODS = ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all'];

const COLUMNS = ['shortTerm', 'mediumTerm', 'longTerm'];

function text(value) {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map((item) => String(item || '')).filter(Boolean).join(' · ');
  return '';
}

export function serializeConclusion(card, role, { order = null, section = null } = {}) {
  const claim = card?.claim || card?.inspection?.claim || null;
  const inspection = card?.inspection || null;
  return {
    audience: role === 'raw' || role === 'rejected' || role === 'fused_source' || role === 'blocked' ? 'registry' : 'user',
    role,
    presentationOrder: order,
    section: section || (role === 'priority' ? 'a_retenir' : role === 'reserve' ? 'autres_angles' : role),
    id: card?.id || card?.publicationId || null,
    phenomenonId: card?.phenomenonId || claim?.phenomenonId || null,
    publicationId: card?.publicationId || null,
    kind: card?.kind || card?.context?.kind || '',
    column: card?.column || card?.nature || null,
    title: text(card?.title),
    body: text(card?.body || card?.text),
    subtitle: text(card?.subtitle || ''),
    leadFigure: text(card?.leadFigure || card?.figure || ''),
    evidence: text(card?.evidence),
    footer: text(card?.footer || card?.meta || ''),
    confidence: card?.confidence || claim?.confidence || null,
    category: card?.analyticalCategory || card?.category || claim?.horizon?.category || null,
    family: card?.family || card?.context?.family || '',
    claim,
    metrics: card?.metrics || inspection?.metrics || null,
    assertions: claim?.assertions || inspection?.metrics || null,
    proofs: inspection?.proofs || text(card?.evidence),
    sources: inspection?.sourceRecords || card?.lineage || null,
    method: inspection?.method || claim?.producer || card?.metrics?.producer || null,
    hypotheses: inspection?.competingHypotheses || card?.exploration?.hypotheses || null,
    limitations: claim?.limitations || card?.metrics?.limits || null,
    exploration: card?.exploration || null,
    disposition: card?.p6Disposition || card?.disposition || null,
    reason: card?.reason || card?.admission?.reason || null,
    admissibility: inspection?.admissibility || card?.admission || null,
    marginal: card?.marginal || inspection?.priority || null,
    selectionReason: card?.reason || card?.lineage?.selection || inspection?.publication || null,
    rivals: card?.rivals || card?.marginal?.rivals || null,
    relations: inspection?.relations || card?.relations || null,
    horizon: card?.horizonFit || claim?.horizon || null,
    collapsedInto: card?.collapsedInto || inspection?.collapsedInto || null,
    selection: card?.lineage?.selection || inspection?.publication || null,
    coverage: card?.exploration?.coverage || inspection?.coverage || null,
    drafting: card?.drafting || inspection?.drafting || null,
    richness: card?.informativeValue ?? card?.score ?? card?.weights ?? null,
    memory: card?.memory || null,
    inspector: {
      claim,
      inspection,
      metrics: card?.metrics || null,
      exploration: card?.exploration || null,
      marginal: card?.marginal || null
    }
  };
}

export function resolveAuditSource({
  requestedPeriod,
  requestedWindow = null,
  live = null,
  cached = null
} = {}) {
  const liveDecision = sourceDecision(live, requestedPeriod, requestedWindow);
  if (liveDecision.ready) {
    return { refused: false, bundle: live, provenance: 'published_rendered', reason: 'ready' };
  }
  const cacheDecision = sourceDecision(cached, requestedPeriod, requestedWindow);
  if (cacheDecision.ready) {
    return { refused: false, bundle: cached, provenance: 'published_cache', reason: 'ready' };
  }
  return {
    refused: true,
    bundle: null,
    provenance: null,
    reason: live ? liveDecision.reason : cacheDecision.reason,
    requestedPeriod: requestedPeriod || null,
    livePeriod:
      live?.recapAssessment?.insightsPublication?.period || live?.analysisPeriod || null,
    liveStatus: live?.analysisStatus || null
  };
}

function sourceDecision(bundle, requestedPeriod, requestedWindow) {
  if (!bundle) return { ready: false, reason: 'published_pack_unavailable' };
  if (!requestedPeriod) return { ready: false, reason: 'period_missing' };
  const edition = analysisEditionKey();
  if (bundle.analysisEdition && bundle.analysisEdition !== edition) {
    return { ready: false, reason: 'edition_mismatch' };
  }
  if (bundle.analysisStatus !== 'ready') return { ready: false, reason: 'period_computing' };
  const publication = bundle.recapAssessment?.insightsPublication || null;
  if (!publication || publication.status !== 'ready') return { ready: false, reason: 'period_computing' };
  const packPeriod = publication.period || bundle.analysisPeriod || null;
  if (String(packPeriod) !== String(requestedPeriod)) return { ready: false, reason: 'period_mismatch' };
  if (bundle.analysisPeriod && String(bundle.analysisPeriod) !== String(requestedPeriod)) {
    return { ready: false, reason: 'period_mismatch' };
  }
  if (requestedWindow?.start && publication.windowStart !== requestedWindow.start) {
    return { ready: false, reason: 'window_mismatch' };
  }
  if (requestedWindow?.end && publication.windowEnd !== requestedWindow.end) {
    return { ready: false, reason: 'window_mismatch' };
  }
  return { ready: true, reason: 'ready' };
}

function correspondDom(dom, period, window, provenance) {
  if (provenance !== 'published_rendered') {
    return {
      verified: false,
      reason: provenance === 'computed_not_rendered' ? 'computed_not_rendered' : 'not_the_rendered_pack',
      renderedPeriod: dom?.renderedPeriod || dom?.period || null,
      renderedCount: Array.isArray(dom?.cards) ? dom.cards.length : 0
    };
  }
  if (!dom || dom.discarded) {
    return { verified: false, reason: 'dom_not_captured', renderedPeriod: null, renderedCount: 0 };
  }
  const renderedPeriod = dom.renderedPeriod || dom.period || null;
  const renderedTitles = (dom.cards || []).map((card) => text(card.title)).filter(Boolean);
  const samePeriod = renderedPeriod === period;
  const sameWindow =
    (!dom.renderedWindowStart || !window?.start || dom.renderedWindowStart === window.start) &&
    (!dom.renderedWindowEnd || !window?.end || dom.renderedWindowEnd === window.end);
  return {
    verified: false,
    reason: samePeriod && sameWindow ? 'dom_captured_titles_recorded' : 'dom_period_mismatch',
    samePeriod,
    sameWindow,
    renderedPeriod,
    renderedWindowStart: dom.renderedWindowStart || null,
    renderedWindowEnd: dom.renderedWindowEnd || null,
    renderedEdition: dom.renderedEdition || null,
    renderedTitles,
    renderedCount: renderedTitles.length
  };
}

export function buildPeriodAuditDossier({
  requestedPeriod,
  requestedWindow = null,
  bundle,
  provenance,
  banner = null,
  measure = null,
  snapshot = null,
  history = null,
  signature = null,
  publicationTrace = null,
  domCapture = null,
  timings = null
} = {}) {
  const assessment = bundle?.recapAssessment || {};
  const insights = assessment.insights || {};
  const discoveries = assessment.periodDiscoveries || {};
  const p6 = discoveries.p6 || {};
  const publication = assessment.insightsPublication || null;
  const priority = [];
  COLUMNS.forEach((column) => {
    (insights?.[column] || []).forEach((card, index) => {
      priority.push(
        serializeConclusion(
          { ...card, column },
          'priority',
          { order: priority.length + 1, section: `priority:${column}` }
        )
      );
    });
  });
  const reserve = (insights.accessibleReserve || []).map((card, index) =>
    serializeConclusion(card, 'reserve', { order: index + 1, section: 'reserve' })
  );
  const fused = (p6.sources || [])
    .filter((card) => card?.p6Disposition === 'source_retained' || card?.collapsedInto || card?.p6Disposition === 'exact_duplicate_suppressed')
    .map((card, index) => serializeConclusion(card, 'fused_source', { order: index + 1, section: 'registry' }));
  const rejected = (discoveries.dropped || []).map((card, index) =>
    serializeConclusion(card, 'rejected', { order: index + 1, section: 'registry' })
  );
  const raw = (discoveries.all || []).map((card, index) =>
    serializeConclusion(card, 'raw', { order: index + 1, section: 'registry' })
  );
  const fusedTitles = new Set(fused.map((card) => card.title).filter(Boolean));
  const accessibleClean = [...priority, ...reserve].filter((card) => !fusedTitles.has(card.title));
  const window = {
    start: publication?.windowStart || requestedWindow?.start || null,
    end: publication?.windowEnd || requestedWindow?.end || null
  };
  const dom = correspondDom(domCapture, requestedPeriod, window, provenance);
  const priorityTitles = new Set(priority.map((card) => card.title).filter(Boolean));
  // Périmètre DOM = catalogue accessible (priorité + réserve), pas la seule priorité
  const accessibleTitles = new Set(
    [...priority, ...reserve].map((card) => card.title).filter(Boolean)
  );
  if (dom.renderedTitles) {
    dom.compareScope = 'accessible_including_reserve';
    dom.missingFromDom = [...accessibleTitles].filter(
      (title) => title && !dom.renderedTitles.includes(title)
    );
    dom.missingPriorityFromDom = [...priorityTitles].filter(
      (title) => title && !dom.renderedTitles.includes(title)
    );
    dom.extraInDom = dom.renderedTitles.filter((title) => !accessibleTitles.has(title));
    dom.verified =
      provenance === 'published_rendered' &&
      dom.samePeriod === true &&
      dom.sameWindow === true &&
      dom.missingFromDom.length === 0 &&
      dom.extraInDom.length === 0 &&
      dom.renderedCount > 0;
  }
  const mismatches = [];
  if (publication?.period && publication.period !== requestedPeriod) mismatches.push('period');
  if (requestedWindow?.start && window.start && requestedWindow.start !== window.start) mismatches.push('windowStart');
  if (requestedWindow?.end && window.end && requestedWindow.end !== window.end) mismatches.push('windowEnd');
  if (banner && measure && Number(banner.totalReps) !== Number(measure.totalReps)) mismatches.push('banner_measure_reps');
  if (dom && dom.verified === false && provenance === 'published_rendered') mismatches.push('dom');
  return {
    schema: 'momentum.analysisEnvironmentDossier.v2',
    capturedAt: new Date().toISOString(),
    requestedPeriod,
    period: publication?.period || requestedPeriod,
    provenance,
    domVerified: dom.verified === true,
    window,
    agreement: {
      selectedPeriod: requestedPeriod,
      packPeriod: publication?.period || null,
      window,
      bannerReps: banner?.totalReps ?? null,
      measureReps: measure?.totalReps ?? null,
      snapshot: snapshotFingerprint(snapshot),
      edition: bundle?.analysisEdition || analysisEditionKey(),
      renderedPeriod: dom.renderedPeriod || null,
      concordant: mismatches.length === 0,
      mismatches
    },
    banner: banner
      ? {
          ...banner,
          definitions: {
            trainingDays: measure?.dayContracts?.trainingDays || 'calendar_training_union_day',
            strengthDays: measure?.dayContracts?.strengthDays || 'positive_reps_days',
            duration: measure?.durationContract || null
          }
        }
      : null,
    measure,
    publication,
    packId:
      bundle?.packId ||
      publication?.packId ||
      `${requestedPeriod}:${publication?.windowStart || ''}:${publication?.windowEnd || ''}:${bundle?.analysisEdition || analysisEditionKey()}`,
    engine: {
      edition: bundle?.analysisEdition || analysisEditionKey(),
      status: bundle?.analysisStatus || null,
      packRole: provenance === 'computed_not_rendered' ? 'computed_not_rendered' : bundle?.packRole || provenance,
      referenceDate: window.end || null,
      dataFingerprint: snapshotFingerprint(snapshot)
    },
    publicationAuthority: insights?.publicationAuthority || null,
    userAccessible: {
      priority,
      reserve: reserve.filter((card) => !fusedTitles.has(card.title)),
      accessible: accessibleClean,
      counts: {
        priority: priority.length,
        reserve: reserve.filter((card) => !fusedTitles.has(card.title)).length,
        accessible: accessibleClean.length
      }
    },
    registry: {
      raw,
      fused,
      rejected,
      blocked: (p6.blocked || []).map((card, index) =>
        serializeConclusion(card, 'blocked', { order: index + 1, section: 'registry' })
      ),
      relations: p6.relations || [],
      counters: p6.counters || null,
      views: p6.views || null,
      priorityReading: p6.priorityReading || null,
      review: p6.review || null,
      publicationDispositions: insights?.publicationDispositions || null,
      publicationReconciliation: insights?.publicationReconciliation || null,
      technicalNonDiscoveries: (discoveries.all || [])
        .filter((card) => /SNAPSHOTS=0|JOURNAL_ABSENT|MULTISHARE|CMP-SOLID|plan_unknown|methodology/i.test(`${card?.title || ''} ${card?.body || ''}${card?.kind || ''}`))
        .map((card) => serializeConclusion(card, 'technical', { section: 'technical' }))
    },
    selection: assessment.selectionDiagnostics || null,
    memory: {
      signature: signature || assessment.insightSignature || null,
      // history peut être un tableau OU un objet insightHistory { entries }
      historyCount: Array.isArray(history)
        ? history.length
        : Array.isArray(history?.entries)
          ? history.entries.length
          : Number.isFinite(Number(history?.count))
            ? Number(history.count)
            : null,
      historyShape: Array.isArray(history)
        ? 'array'
        : Array.isArray(history?.entries)
          ? 'insight_history_object'
          : history == null
            ? 'absent_not_passed_to_export'
            : typeof history,
      note:
        history == null
          ? 'historyCount nul = historique non fourni à l’export (souvent), pas forcément mémoire vide'
          : null
    },
    horizons: priority.map((card) => card.horizon).filter(Boolean),
    timings: timings || bundle?.workerTimings || null,
    dom,
    publicationTrace: Array.isArray(publicationTrace) ? publicationTrace.slice(-40) : null
  };
}

function cardKey(card) {
  return `${card?.kind || ''}|${card?.title || ''}|${card?.evidence || ''}`;
}

export function compareAuditDossiers(left, right) {
  const leftPriority = left?.userAccessible?.priority || [];
  const rightPriority = right?.userAccessible?.priority || [];
  const leftKeys = new Set(leftPriority.map(cardKey));
  const rightKeys = new Set(rightPriority.map(cardKey));
  const relations = [...(left?.registry?.relations || []), ...(right?.registry?.relations || [])];
  return {
    common: leftPriority.filter((card) => rightKeys.has(cardKey(card))),
    distinctA: leftPriority.filter((card) => !rightKeys.has(cardKey(card))),
    distinctB: rightPriority.filter((card) => !leftKeys.has(cardKey(card))),
    priorityOnlyA: leftPriority.filter((card) => !rightKeys.has(cardKey(card))).map((card) => card.title),
    priorityOnlyB: rightPriority.filter((card) => !leftKeys.has(cardKey(card))).map((card) => card.title),
    fusedA: (left?.registry?.fused || []).map((card) => card.title),
    fusedB: (right?.registry?.fused || []).map((card) => card.title),
    reformulated: relations.filter((link) => link?.relation === 'reformulation'),
    coverage: {
      a: left?.registry?.counters || null,
      b: right?.registry?.counters || null
    }
  };
}

function slimDossierRef(dossier) {
  if (!dossier) return null;
  if (dossier.refused) {
    return { refused: true, reason: dossier.reason || null, period: dossier.period || null };
  }
  return {
    schema: 'momentum.analysisPeriodRef.v1',
    period: dossier.period || dossier.requestedPeriod || null,
    provenance: dossier.provenance || null,
    packId: dossier.packId || null,
    window: dossier.window || null,
    edition: dossier.engine?.edition || null,
    fingerprint: dossier.engine?.dataFingerprint || null,
    counts: dossier.userAccessible?.counts || null,
    priorityIds: (dossier.userAccessible?.priority || []).map((c) => c.id || c.kind).filter(Boolean),
    reserveIds: (dossier.userAccessible?.reserve || []).map((c) => c.id || c.kind).filter(Boolean)
  };
}

export function buildComparisonExport(dossierA, dossierB) {
  // Ne plus embarquer les dossiers complets (×4 comparaisons ≈ explosion 187 Mo).
  // Les dossiers complets restent dans eight-periods/periods/* ; ici : refs + diff.
  return {
    schema: 'momentum.analysisComparisonExport.v2',
    capturedAt: new Date().toISOString(),
    periodA: slimDossierRef(dossierA),
    periodB: slimDossierRef(dossierB),
    provenanceA: dossierA?.provenance || dossierA?.reason || null,
    provenanceB: dossierB?.provenance || dossierB?.reason || null,
    diff: dossierA?.refused || dossierB?.refused ? null : compareAuditDossiers(dossierA, dossierB)
  };
}

export const EIGHT_PERIOD_COMPARISON_PAIRS = [
  ['7d', '30d'],
  ['6m', '1y'],
  ['1y', '2y'],
  ['2y', 'all']
];

export async function buildEightPeriodAudit({
  periods = EIGHT_PERIODS,
  loadPublished,
  computeMissing = null,
  domCapture = null,
  onProgress = null,
  comparisonPairs = EIGHT_PERIOD_COMPARISON_PAIRS
} = {}) {
  const out = {};
  const unavailable = [];
  const total = periods.length;
  for (let index = 0; index < periods.length; index += 1) {
    const period = periods[index];
    onProgress?.({ period, phase: 'lookup', index: index + 1, total });
    const loaded = await loadPublished?.(period);
    if (loaded?.bundle) {
      out[period] = buildPeriodAuditDossier({
        requestedPeriod: period,
        requestedWindow: loaded.window || null,
        bundle: loaded.bundle,
        provenance: loaded.provenance || 'published_cache',
        banner: loaded.banner || null,
        measure: loaded.measure || null,
        snapshot: loaded.snapshot || null,
        domCapture: loaded.provenance === 'published_rendered' ? domCapture : null,
        timings: loaded.timings || null
      });
      continue;
    }
    if (computeMissing) {
      onProgress?.({ period, phase: 'compute', index: index + 1, total });
      try {
        const computed = await computeMissing(period);
        if (!computed?.bundle) {
          unavailable.push({ period, reason: 'compute_returned_empty' });
          continue;
        }
        out[period] = buildPeriodAuditDossier({
          requestedPeriod: period,
          requestedWindow: computed?.window || null,
          bundle: computed.bundle,
          provenance: 'computed_not_rendered',
          banner: computed.banner || null,
          measure: computed.measure || null,
          snapshot: computed.snapshot || null,
          timings: computed.timings || computed.bundle?.workerTimings || null
        });
      } catch (error) {
        unavailable.push({ period, reason: String(error?.message || error) });
      }
      continue;
    }
    unavailable.push({ period, reason: 'published_pack_unavailable' });
  }
  const comparisons = {};
  comparisonPairs.forEach(([a, b]) => {
    const key = `${a}_vs_${b}`;
    if (!out[a] || !out[b]) {
      comparisons[key] = {
        refused: true,
        reason: !out[a] ? `missing_${a}` : `missing_${b}`
      };
      return;
    }
    comparisons[key] = buildComparisonExport(out[a], out[b]);
  });
  const complete = unavailable.length === 0 && periods.every((period) => Boolean(out[period]));
  return {
    schema: 'momentum.analysisEightPeriodExport.v1',
    capturedAt: new Date().toISOString(),
    complete,
    periods: out,
    comparisons,
    unavailable,
    domNote:
      'Un paquet computed_not_rendered reste un calcul non rendu. Il n’est pas une publication DOM vérifiée. domVerified=true uniquement si le DOM de cette période a été observé.'
  };
}
