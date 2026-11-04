/**
 * Comparaison structurée de deux rapports diagnostic complets (périodes A / B).
 */
import { matchConfidence, buildPhenomenonRecord } from './recapPhenomenonContract';
import { DIAG_STATUS } from './analysisEngineDiagnosticModel';
import { requiresExerciseIdentity, subjectTypeOf } from './analysisEngineSubjectContract';
import {
  assessRunComparability,
  buildRunManifest,
  COMPARABILITY
} from './analysisEngineRunManifest';
import { buildCoherenceReport } from './analysisEngineCoherence';

export const COMPARISON_SCHEMA_VERSION = 'analysis-engine-comparison-v1';
export const DOM_COMPARABILITY = Object.freeze({
  COMPARABLE: 'comparable',
  NON_COMPARABLE: 'non_comparable',
  INDETERMINATE: 'indeterminate'
});

function registryRows(report) {
  return report?.registry?.rows || [];
}

function countsOf(report) {
  return report?.registry?.counts || {};
}

function enrichRow(row, periodKey) {
  const rec = row._phenomenonRecord || buildPhenomenonRecord(row);
  return {
    ...row,
    _periodKey: periodKey,
    _phenomenonRecord: rec,
    _phenomenonId: row._phenomenonId || rec.id
  };
}

/**
 * Apparie les lignes A/B par phénomène.
 */
export function matchRegistryRows(rowsA = [], rowsB = []) {
  const matched = [];
  const usedB = new Set();
  const onlyA = [];
  const onlyB = [];

  rowsA.forEach((a) => {
    let best = null;
    let bestConf = 'none';
    rowsB.forEach((b, bi) => {
      if (usedB.has(bi)) return;
      const conf = matchConfidence(a, b);
      if (conf === 'none') return;
      if (conf === 'exact' || (conf === 'probable' && bestConf !== 'exact')) {
        best = { b, bi, conf };
        bestConf = conf;
      }
    });
    if (best) {
      usedB.add(best.bi);
      matched.push({
        phenomenonId: a._phenomenonId || best.b._phenomenonId,
        matchConfidence: best.conf,
        a,
        b: best.b,
        statusA: a.diagStatus,
        statusB: best.b.diagStatus,
        scoreA: a.informativeValue ?? a.score,
        scoreB: best.b.informativeValue ?? best.b.score,
        titleA: a.title,
        titleB: best.b.title,
        kindA: a.kind,
        kindB: best.b.kind
      });
    } else {
      onlyA.push(a);
    }
  });

  rowsB.forEach((b, bi) => {
    if (!usedB.has(bi)) onlyB.push(b);
  });

  return { matched, onlyA, onlyB };
}

export function buildStatusTransitions(matched) {
  return (matched || [])
    .filter((m) => m.statusA !== m.statusB)
    .map((m) => ({
      phenomenonId: m.phenomenonId,
      matchConfidence: m.matchConfidence,
      from: m.statusA,
      to: m.statusB,
      kindA: m.kindA,
      kindB: m.kindB,
      titleA: m.titleA,
      titleB: m.titleB
    }));
}

export function buildSelectionDiffs(matched) {
  return (matched || []).map((m) => ({
    phenomenonId: m.phenomenonId,
    matchConfidence: m.matchConfidence,
    selectedA: m.statusA === DIAG_STATUS.SHOWN_NOW,
    selectedB: m.statusB === DIAG_STATUS.SHOWN_NOW,
    demotedA: m.statusA === DIAG_STATUS.DEMOTED,
    demotedB: m.statusB === DIAG_STATUS.DEMOTED,
    reasonA: m.a?.decisionReason || null,
    reasonB: m.b?.decisionReason || null,
    ivA: m.scoreA,
    ivB: m.scoreB,
    ivDelta: (Number(m.scoreB) || 0) - (Number(m.scoreA) || 0)
  }));
}

export function buildEvidenceDiffs(matched) {
  return (matched || [])
    .map((m) => {
      const ea = m.a?.evidence || m.a?.evidenceCount;
      const eb = m.b?.evidence || m.b?.evidenceCount;
      const same =
        String(ea || '') === String(eb || '') &&
        (m.a?.evidenceCount || 0) === (m.b?.evidenceCount || 0);
      if (same) return null;
      return {
        phenomenonId: m.phenomenonId,
        evidenceA: m.a?.evidence || null,
        evidenceB: m.b?.evidence || null,
        evidenceCountA: m.a?.evidenceCount ?? null,
        evidenceCountB: m.b?.evidenceCount ?? null
      };
    })
    .filter(Boolean);
}

export function buildMetricDiffs(matched) {
  const keys = [
    'gapDays',
    'trajectoryPrimaryStory',
    'trajectorySetMechanism',
    'totalReps',
    'exerciseId'
  ];
  return (matched || [])
    .map((m) => {
      const diffs = {};
      keys.forEach((k) => {
        const va = m.a?.metrics?.[k];
        const vb = m.b?.metrics?.[k];
        if (va !== vb && (va != null || vb != null)) diffs[k] = { a: va ?? null, b: vb ?? null };
      });
      if (!Object.keys(diffs).length) return null;
      return { phenomenonId: m.phenomenonId, diffs };
    })
    .filter(Boolean);
}

export function buildOverviewDiff(reportA, reportB) {
  const ca = countsOf(reportA);
  const cb = countsOf(reportB);
  return {
    periodA: reportA?.meta?.period || reportA?.overview?.period,
    periodB: reportB?.meta?.period || reportB?.overview?.period,
    windowA: reportA?.overview?.window || null,
    windowB: reportB?.overview?.window || null,
    candidatesA: ca.total ?? null,
    candidatesB: cb.total ?? null,
    shownA: ca.shown_now ?? null,
    shownB: cb.shown_now ?? null,
    intermediateA: ca.intermediate ?? null,
    intermediateB: cb.intermediate ?? null,
    demotedA: ca.demoted ?? null,
    demotedB: cb.demoted ?? null,
    rejectedA: ca.rejected ?? null,
    rejectedB: cb.rejected ?? null,
    unknownA: ca.unknown ?? null,
    unknownB: cb.unknown ?? null,
    msA: reportA?.overview?.totalMs ?? null,
    msB: reportB?.overview?.totalMs ?? null,
    familiesA: reportA?.families?.length ?? null,
    familiesB: reportB?.families?.length ?? null,
    shownDelta: (cb.shown_now || 0) - (ca.shown_now || 0),
    demotedDelta: (cb.demoted || 0) - (ca.demoted || 0),
    note: 'Une hausse de cartes n’est pas une preuve d’amélioration qualitative.'
  };
}

export function buildSourceCoverageDiffs(reportA, reportB) {
  const itemsA = reportA?.dataCatalog?.items || reportA?.dataInventory || [];
  const itemsB = reportB?.dataCatalog?.items || reportB?.dataInventory || [];
  const mapB = new Map(itemsB.map((i) => [i.id, i]));
  const out = [];
  itemsA.forEach((a) => {
    const b = mapB.get(a.id);
    if (!b) {
      out.push({ id: a.id, label: a.label, onlyIn: 'A', statusA: a.status, statusB: null });
      return;
    }
    if (a.status !== b.status || a.n !== b.n) {
      out.push({
        id: a.id,
        label: a.label,
        statusA: a.status,
        statusB: b.status,
        nA: a.n ?? null,
        nB: b.n ?? null
      });
    }
    mapB.delete(a.id);
  });
  mapB.forEach((b) => {
    out.push({ id: b.id, label: b.label, onlyIn: 'B', statusA: null, statusB: b.status });
  });
  return out;
}

export function buildPerformanceDiffs(reportA, reportB) {
  const stagesA = reportA?.stagesDetailed || [];
  const stagesB = reportB?.stagesDetailed || [];
  const mapB = new Map(stagesB.map((s) => [s.id, s]));
  return stagesA.map((a) => {
    const b = mapB.get(a.id);
    return {
      id: a.id,
      label: a.label,
      msA: a.ms ?? null,
      msB: b?.ms ?? null,
      deltaMs: b?.ms != null && a.ms != null ? b.ms - a.ms : null,
      inA: a.inCount ?? null,
      outA: a.outCount ?? null,
      inB: b?.inCount ?? null,
      outB: b?.outCount ?? null
    };
  });
}

/**
 * Construit l’objet comparaison complet pour UI + export JSON.
 */
export function buildDiagnosticComparison(reportA, reportB, context = {}) {
  if (!reportA || !reportB) {
    return {
      schemaVersion: COMPARISON_SCHEMA_VERSION,
      mode: 'comparison',
      incomplete: true,
      reason: !reportA && !reportB ? 'missing_both' : !reportA ? 'missing_A' : 'missing_B'
    };
  }

  const rowsA = registryRows(reportA).map((r) => enrichRow(r, 'A'));
  const rowsB = registryRows(reportB).map((r) => enrichRow(r, 'B'));
  const { matched, onlyA, onlyB } = matchRegistryRows(rowsA, rowsB);

  const issues = [];
  rowsA.concat(rowsB).forEach((r) => {
    if (r.diagStatus === DIAG_STATUS.DEMOTED && r.decisionReason === 'unresolved_exercise_name') {
      issues.push({
        severity: 'high',
        category: 'identity',
        period: r._periodKey,
        kind: r.kind,
        title: r.title,
        reason: 'unresolved_exercise_name',
        confirmed: true
      });
    }
    if (r.diagStatus === DIAG_STATUS.DEMOTED && r.decisionReason === 'cap') {
      issues.push({
        severity: 'medium',
        category: 'selection',
        period: r._periodKey,
        kind: r.kind,
        title: r.title,
        reason: 'lost_to_cap',
        informativeValue: r.informativeValue,
        confirmed: true
      });
    }
  });

  matched.forEach((m) => {
    if (m.matchConfidence === 'probable') {
      issues.push({
        severity: 'low',
        category: 'matching',
        period: 'A/B',
        reason: 'ambiguous_phenomenon_match',
        phenomenonId: m.phenomenonId,
        titleA: m.titleA,
        titleB: m.titleB,
        confirmed: false
      });
    }
  });

  const executionCtx = compareExecutionContext(reportA, reportB, {
    mode: context.comparisonMode || 'period',
    accountId: context.accountId || null
  });

  return {
    schemaVersion: COMPARISON_SCHEMA_VERSION,
    mode: 'comparison',
    context: {
      ...context,
      generatedAt: new Date().toISOString(),
      periodA: reportA.meta?.period,
      periodB: reportB.meta?.period,
      windowA: reportA.overview?.window,
      windowB: reportB.overview?.window,
      engineSamePipeline: Boolean(reportA.meta?.samePipeline && reportB.meta?.samePipeline),
      comparability: executionCtx,
      comparableAsRegression: executionCtx.comparableAsRegression,
      comparabilityLabel: executionCtx.label
    },
    overview: buildOverviewDiff(reportA, reportB),
    matchedPhenomena: matched,
    onlyInA: onlyA,
    onlyInB: onlyB,
    statusTransitions: buildStatusTransitions(matched),
    selectionDiffs: buildSelectionDiffs(matched),
    evidenceDiffs: buildEvidenceDiffs(matched),
    metricDiffs: buildMetricDiffs(matched),
    sourceCoverageDiffs: buildSourceCoverageDiffs(reportA, reportB),
    performanceDiffs: buildPerformanceDiffs(reportA, reportB),
    issues,
    stats: {
      matched: matched.length,
      onlyA: onlyA.length,
      onlyB: onlyB.length,
      exactMatches: matched.filter((m) => m.matchConfidence === 'exact').length,
      probableMatches: matched.filter((m) => m.matchConfidence === 'probable').length,
      statusChanges: matched.filter((m) => m.statusA !== m.statusB).length
    }
  };
}

/**
 * Export JSON enveloppe (simple ou comparatif).
 */
export function buildDiagnosticExportPayload({
  mode = 'single',
  reportA = null,
  reportB = null,
  comparison = null,
  context = {}
}) {
  if (mode === 'comparison' && reportA && reportB) {
    return {
      schemaVersion: COMPARISON_SCHEMA_VERSION,
      mode: 'comparison',
      context,
      periodA: { report: reportA },
      periodB: { report: reportB },
      comparison: comparison || buildDiagnosticComparison(reportA, reportB, context)
    };
  }
  return {
    schemaVersion: COMPARISON_SCHEMA_VERSION,
    mode: 'single',
    context,
    periodA: { report: reportA },
    periodB: null,
    comparison: null
  };
}

/** Preuves structurées souvent présentes hors `evidence` / `evidenceCount`. */
function hasImplicitEvidence(r) {
  const m = r?.metrics || {};
  if (r?.evidence) return true;
  if (Array.isArray(m.evidence) && m.evidence.length) return true;
  if (Array.isArray(m.sessions) && m.sessions.length) return true;
  if (Array.isArray(m.dayRows) && m.dayRows.length) return true;
  if (Array.isArray(m.dates) && m.dates.length) return true;
  if (m.totalReps != null || m.sampleSize != null || m.sessionCount != null) return true;
  if (m.gapDays != null || m.lastDate != null || m.windowStart != null) return true;
  if (m.composedEvidence) return true;
  if (m.nHigh != null || m.highN != null || m.days != null) return true;
  // Affirmation chiffrée dans le titre/corps
  if (/\d/.test(`${r?.title || ''} ${r?.body || ''}`) && (m.name || m.exerciseId || m.family)) {
    return true;
  }
  return false;
}

/**
 * Anomalies instrumentées sur un seul rapport (ou fusion A+B).
 */
export function detectReportIssues(report, periodKey = 'A') {
  const issues = [];
  if (!report) return issues;
  const rows = registryRows(report);
  const counts = countsOf(report);
  const counted =
    (counts.shown_now || 0) +
    (counts.intermediate || 0) +
    (counts.demoted || 0) +
    (counts.rejected || 0) +
    (counts.unknown || 0);
  if (counts.total != null && counted !== counts.total) {
    issues.push({
      severity: 'high',
      category: 'consistency',
      period: periodKey,
      reason: 'counter_registry_mismatch',
      evidence: { total: counts.total, sumStatuses: counted },
      confirmed: true,
      probableFile: 'analysisEngineDiagnosticModel.js'
    });
  }
  rows.forEach((r) => {
    if (r.decisionReason === 'unresolved_exercise_name') {
      const needsIdentity = requiresExerciseIdentity(r);
      const published = r.diagStatus === DIAG_STATUS.SHOWN_NOW;
      // Transversal mal classé : fausse alerte d’identité
      if (!needsIdentity && (r.metrics?.exerciseId == null || r.metrics?.exerciseId === '')) {
        issues.push({
          id: `identity.misclassified_transversal:${periodKey}:${r.kind}:${r.id || ''}`,
          severity: 'low',
          category: 'identity',
          period: periodKey,
          reason: 'transversal_misclassified_as_unresolved_identity',
          kind: r.kind,
          title: r.title,
          candidateId: r.id,
          subjectType: subjectTypeOf(r),
          confirmed: true,
          userImpact: false,
          occurrenceCount: 1,
          probableFile: 'recapEditorialSelection.js',
          note: 'Kind transversal sans exercice unique — ne pas exiger d’identité.'
        });
      } else {
        issues.push({
          id: `identity.unresolved:${periodKey}:${r.kind}:${r.metrics?.exerciseId || r.id || ''}`,
          severity: published ? 'high' : 'medium',
          category: 'identity',
          period: periodKey,
          reason: 'unresolved_exercise_name',
          kind: r.kind,
          title: r.title,
          candidateId: r.id,
          subjectType: subjectTypeOf(r),
          evidence: {
            exerciseId: r.metrics?.exerciseId ?? null,
            nameStatus: r.metrics?.nameIdentityStatus || r.metrics?.identityStatus || null
          },
          confirmed: true,
          userImpact: published,
          publishedAffected: published ? 1 : 0,
          probableFile: 'recapEditorialIdentity.js'
        });
      }
    }
    if (r.decisionReason === 'cap' && (r.informativeValue || 0) >= 70) {
      issues.push({
        id: `selection.cap:${periodKey}:${r.kind}:${r.id || ''}`,
        severity: 'medium',
        category: 'selection',
        period: periodKey,
        reason: 'high_value_lost_to_cap',
        kind: r.kind,
        title: r.title,
        informativeValue: r.informativeValue,
        confirmed: true,
        probableFile: 'recapPeriodSelection.js'
      });
    }
    if ((r.evidenceCount || 0) === 0 && r.diagStatus === 'shown_now' && !hasImplicitEvidence(r)) {
      issues.push({
        id: `evidence.missing:${periodKey}:${r.kind}:${r.id || ''}`,
        severity: 'medium',
        category: 'evidence',
        period: periodKey,
        reason: 'selected_without_evidence',
        kind: r.kind,
        title: r.title,
        confirmed: true
      });
    }
    const body = String(r.body || '');
    if (/disc_|signalFamily|informativeValue|_phenomenon/i.test(body)) {
      issues.push({
        severity: 'high',
        category: 'copy',
        period: periodKey,
        reason: 'technical_artifact_in_prose',
        kind: r.kind,
        title: r.title,
        confirmed: false,
        note: 'heuristique — à vérifier'
      });
    }
    if (
      r.diagStatus === 'shown_now' &&
      r.metrics?.trajectoryOk &&
      !r.metrics?.trajectorySetMechanism &&
      !r.metrics?.composedEvidence?.volumeAttribution &&
      !/série|format|fréquence|charge|tonnage|reprise/i.test(body)
    ) {
      issues.push({
        severity: 'low',
        category: 'depth',
        period: periodKey,
        reason: 'trajectory_without_mechanism_prose',
        kind: r.kind,
        title: r.title,
        confirmed: false,
        note: 'heuristique'
      });
    }
  });
  const costlyEmpty = (report.stagesDetailed || []).filter(
    (s) => (s.ms || 0) > 80 && (s.outCount == null || s.outCount === 0)
  );
  costlyEmpty.forEach((s) => {
    issues.push({
      id: `perf.empty:${periodKey}:${s.id}`,
      severity: 'medium',
      category: 'performance',
      period: periodKey,
      reason: 'costly_stage_empty_output',
      stageId: s.id,
      label: s.label,
      ms: s.ms,
      confirmed: true,
      probableFile: s.module || null
    });
  });

  // Cohérence inter-cartes
  try {
    const coherence = buildCoherenceReport(report);
    coherence.issues.forEach((ci) => {
      issues.push({
        ...ci,
        period: periodKey,
        category: ci.category || 'coherence'
      });
    });
  } catch {
    /* ignore coherence failures */
  }

  // Déduplication par id / reason+kind+period
  const seen = new Map();
  for (const iss of issues) {
    const key = iss.id || `${iss.reason}|${iss.kind}|${iss.period}|${iss.title || ''}`;
    if (!seen.has(key)) {
      seen.set(key, { ...iss, occurrenceCount: iss.occurrenceCount || 1 });
    } else {
      const prev = seen.get(key);
      prev.occurrenceCount = (prev.occurrenceCount || 1) + 1;
    }
  }
  return [...seen.values()];
}

/**
 * Compare pack diagnostic (shown_now) vs cartes capturées dans le DOM Analyse.
 */
export function compareDomToPack(report, domCapture) {
  if (!report || !domCapture) {
    return {
      comparability: DOM_COMPARABILITY.NON_COMPARABLE,
      comparable: false,
      reason: !report ? 'missing_report' : 'missing_dom_capture',
      sameSignature: false
    };
  }

  const packSig = report.meta?.dataSignature || report.meta?.snapshotSignature || null;
  const histSig = report.meta?.editorialHistorySignature || null;
  const domSig = domCapture.dataSignature ?? null;
  const domHist = domCapture.editorialHistorySignature ?? null;
  const source = domCapture.source || 'unknown';
  const domCards = Array.isArray(domCapture.cards) ? domCapture.cards : [];

  // Capture vide : distinguer les causes
  let emptyReason = null;
  if (domCards.length === 0) {
    if (source === 'dom_scrape_empty') emptyReason = 'selector_or_tab_not_ready';
    else if (source === 'no_document') emptyReason = 'no_document';
    else if (source === 'loading') emptyReason = 'loading_in_progress';
    else if (source === 'filter_active') emptyReason = 'user_filter_active';
    else emptyReason = 'zero_cards_or_incomplete_capture';
  }

  // sameSignature : uniquement si les deux côtés ont une signature ET qu’elles matchent.
  // null/null ne doit JAMAIS produire sameSignature=true.
  let sameSignature = false;
  let signatureStatus = 'indeterminate';
  if (!domSig && !packSig) {
    signatureStatus = 'both_missing';
    sameSignature = false;
  } else if (!domSig || !packSig) {
    signatureStatus = 'one_missing';
    sameSignature = false;
  } else if (domSig === packSig) {
    signatureStatus = 'match';
    sameSignature = true;
  } else {
    signatureStatus = 'mismatch';
    sameSignature = false;
  }

  const histStatus =
    !domHist && !histSig
      ? 'both_missing'
      : !domHist || !histSig
        ? 'one_missing'
        : domHist === histSig
          ? 'match'
          : 'mismatch';

  const samePeriod = !domCapture.period || domCapture.period === report.meta?.period;
  const packRows = registryRows(report).filter((r) => r.diagStatus === DIAG_STATUS.SHOWN_NOW);

  let comparability = DOM_COMPARABILITY.INDETERMINATE;
  let reason = signatureStatus;
  if (emptyReason) {
    comparability = DOM_COMPARABILITY.INDETERMINATE;
    reason = emptyReason;
  } else if (!samePeriod) {
    comparability = DOM_COMPARABILITY.NON_COMPARABLE;
    reason = 'period_mismatch';
  } else if (signatureStatus === 'match' && (histStatus === 'match' || histStatus === 'both_missing')) {
    comparability = DOM_COMPARABILITY.COMPARABLE;
    reason = 'signatures_aligned';
  } else if (signatureStatus === 'mismatch' || histStatus === 'mismatch') {
    comparability = DOM_COMPARABILITY.NON_COMPARABLE;
    reason = 'signature_mismatch';
  } else {
    comparability = DOM_COMPARABILITY.INDETERMINATE;
    reason = 'signatures_incomplete';
  }

  const byStable = (r) => {
    const phen = r.phenomenonId || r._phenomenonId || r.metrics?.phenomenonId || null;
    const id = r.publicationId || r.id || null;
    if (phen || id) return `id:${phen || ''}|${id || ''}`;
    return `title:${r.kind || ''}|${String(r.title || '')
      .trim()
      .toLowerCase()
      .slice(0, 80)}`;
  };
  const packKeys = new Set(packRows.map(byStable));
  const domKeys = new Set(
    domCards.map((c) => {
      if (c.phenomenonId || c.cardId || c.id) {
        return `id:${c.phenomenonId || ''}|${c.cardId || c.id || ''}`;
      }
      return `title:${c.kind || ''}|${String(c.title || '')
        .trim()
        .toLowerCase()
        .slice(0, 80)}`;
    })
  );
  const inPackNotDom = packRows.filter((r) => !domKeys.has(byStable(r)));
  const inDomNotPack = domCards.filter((c) => {
    const key =
      c.phenomenonId || c.cardId || c.id
        ? `id:${c.phenomenonId || ''}|${c.cardId || c.id || ''}`
        : `title:${c.kind || ''}|${String(c.title || '')
            .trim()
            .toLowerCase()
            .slice(0, 80)}`;
    return !packKeys.has(key);
  });

  return {
    comparability,
    comparable: comparability === DOM_COMPARABILITY.COMPARABLE,
    reason,
    sameSignature,
    signatureStatus,
    histStatus,
    samePeriod,
    emptyReason,
    source,
    levels: {
      admissible: countsOf(report).total ?? null,
      selectedInDiagnosticPack: packRows.length,
      renderedInAnalyseDom: domCards.length
    },
    inPackNotDom: inPackNotDom.map((r) => ({
      kind: r.kind,
      title: r.title,
      id: r.id,
      phenomenonId: r._phenomenonId || r.phenomenonId || null,
      absenceReason: 'not_in_dom_capture_or_publication_layer'
    })),
    inDomNotPack: inDomNotPack.map((c) => ({
      kind: c.kind || null,
      title: c.title,
      fingerprint: c.fingerprint || null,
      cardId: c.cardId || c.id || null,
      phenomenonId: c.phenomenonId || null
    })),
    note:
      comparability === DOM_COMPARABILITY.COMPARABLE
        ? null
        : comparability === DOM_COMPARABILITY.NON_COMPARABLE
          ? 'Comparaison pack↔DOM non équivalente — ne pas l’utiliser comme preuve de régression.'
          : 'Comparaison indéterminée (signatures absentes, capture vide ou onglet non prêt).'
  };
}

/**
 * Comparabilité de deux runs (même période ou périodes différentes).
 */
export function compareExecutionContext(reportA, reportB, { mode = 'period', accountId = null } = {}) {
  const manifestA = buildRunManifest({ report: reportA, accountId });
  const manifestB = buildRunManifest({ report: reportB, accountId });
  const assessment = assessRunComparability(manifestA, manifestB, { mode });
  return {
    mode,
    manifestA,
    manifestB,
    ...assessment,
    comparableAsRegression: assessment.comparableAsRegression,
    label:
      assessment.status === COMPARABILITY.EQUIVALENT
        ? 'Comparable'
        : assessment.status === COMPARABILITY.DIFF_DATA
          ? 'Données différentes — non comparable comme régression'
          : assessment.status === COMPARABILITY.DIFF_EDITORIAL_HISTORY
            ? 'Historique éditorial différent'
            : 'Comparabilité limitée'
  };
}

export function buildComparisonMarkdown(payload) {
  const cmp = payload?.comparison;
  const ov = cmp?.overview || {};
  const cmpCtx = payload?.context || cmp?.context || {};
  const lines = [
    `# Diagnostic comparatif — ${ov.periodA || '?'} vs ${ov.periodB || '?'}`,
    '',
    `- Schéma : ${payload?.schemaVersion || COMPARISON_SCHEMA_VERSION}`,
    `- Généré : ${cmpCtx.generatedAt || '—'}`,
    `- Comparabilité : ${cmpCtx.comparabilityLabel || cmpCtx.comparability?.label || '—'}`,
    `- Comparable comme régression : ${cmpCtx.comparableAsRegression ? 'oui' : 'non'}`,
    '',
    '## Vue d’ensemble',
    '',
    `| | ${ov.periodA || 'A'} | ${ov.periodB || 'B'} | Δ |`,
    `|---|---:|---:|---:|`,
    `| Candidats | ${ov.candidatesA ?? '—'} | ${ov.candidatesB ?? '—'} | ${(ov.candidatesB ?? 0) - (ov.candidatesA ?? 0)} |`,
    `| Sélectionnées | ${ov.shownA ?? '—'} | ${ov.shownB ?? '—'} | ${ov.shownDelta ?? '—'} |`,
    `| Intermédiaires | ${ov.intermediateA ?? '—'} | ${ov.intermediateB ?? '—'} | — |`,
    `| Déclassées | ${ov.demotedA ?? '—'} | ${ov.demotedB ?? '—'} | ${ov.demotedDelta ?? '—'} |`,
    `| Rejetées | ${ov.rejectedA ?? '—'} | ${ov.rejectedB ?? '—'} | — |`,
    `| Durée (ms) | ${ov.msA ?? '—'} | ${ov.msB ?? '—'} | — |`,
    '',
    `> ${ov.note || ''}`,
    '',
    '## Appariements',
    '',
    `- Communs : ${cmp?.stats?.matched ?? 0} (exact ${cmp?.stats?.exactMatches ?? 0}, probable ${cmp?.stats?.probableMatches ?? 0})`,
    `- Seulement A : ${cmp?.stats?.onlyA ?? 0}`,
    `- Seulement B : ${cmp?.stats?.onlyB ?? 0}`,
    `- Changements de statut : ${cmp?.stats?.statusChanges ?? 0}`,
    '',
    '## Problèmes détectés',
    ''
  ];
  const issues = cmp?.issues || [];
  if (!issues.length) lines.push('- Aucun problème instrumenté.');
  else {
    issues.slice(0, 40).forEach((i) => {
      lines.push(
        `- [${i.severity}/${i.category}] ${i.reason} · ${i.period || ''} · ${i.kind || i.titleA || i.title || ''}${i.confirmed ? '' : ' _(à vérifier)_'}`
      );
    });
  }
  lines.push('', '## Transitions de statut (extrait)', '');
  (cmp?.statusTransitions || []).slice(0, 20).forEach((t) => {
    lines.push(`- ${t.from} → ${t.to} · ${t.kindA}/${t.kindB} · ${t.titleA || ''}`);
  });
  return lines.join('\n');
}
