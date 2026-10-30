/**
 * Modèle d’observabilité du pipeline diagnostic.
 * Normalise les étapes hétérogènes (bundles vs candidats) sans recalcul métier.
 * (Pas d’import depuis analysisEngineDiagnosticModel — évite cycle.)
 */

/** Unités de compteurs — ne pas comparer des bundles à des candidats. */
export const STAGE_COUNT_UNITS = {
  bundle: { label: 'agrégat', short: 'agr.' },
  candidates: { label: 'candidats', short: 'cand.' },
  discoveries: { label: 'découvertes', short: 'déc.' },
  essays: { label: 'essais', short: 'ess.' },
  unknown: { label: 'non typé', short: '?' }
};

const STAGE_DEFAULTS = {
  assessment: {
    countUnit: 'bundle',
    functionalLabel: 'Assessment utilisateur',
    countSemantics:
      'out = 1 paquet assessment (pas un nombre de cartes). in non applicable.'
  },
  enrichment: {
    countUnit: 'bundle',
    functionalLabel: 'Enrichissement Recap',
    countSemantics:
      'out = 1 paquet d’enrichissement (métriques dérivées). in non applicable.'
  },
  adaptive: {
    countUnit: 'candidates',
    functionalLabel: 'Insights adaptatifs + sélection',
    countSemantics:
      'out = cartes retenues dans le pack final (short+medium+long).'
  },
  composed: {
    countUnit: 'candidates',
    functionalLabel: 'Pipeline composé (state, discoveries, essays)',
    countSemantics:
      'out = candidats issus du pipeline composé (découvertes + essais rendus).'
  },
  span_stories: {
    countUnit: 'candidates',
    functionalLabel: 'Span stories',
    countSemantics: 'out = histoires de période générées (span_*).'
  },
  weight_novelty: {
    countUnit: 'candidates',
    functionalLabel: 'Pondération novelty / nature / familles',
    countSemantics: 'in = pool brut ; out = pool pondéré (même cardinalité typique).'
  },
  dedup: {
    countUnit: 'candidates',
    functionalLabel: 'Déduplication kinship',
    countSemantics: 'in = pondérés ; out = distincts ; pertes ≈ doublons sémantiques.'
  },
  validate: {
    countUnit: 'candidates',
    functionalLabel: 'Validation insights',
    countSemantics: 'in = distincts ; out = valides ; pertes = rejet validation.'
  },
  select: {
    countUnit: 'candidates',
    functionalLabel: 'Sélection colonnes + rescue familles',
    countSemantics: 'in = valides ; out = affichés ; pertes = ranked_out / caps.'
  }
};

function resolveStatus(st) {
  if (st.executed === false && st.errors?.length) return 'error';
  if (st.executed === false && st.skippedReason) return 'skipped';
  if (st.executed === false) return 'not_run';
  if (st.errors?.length) return 'error';
  if (st.warnings?.length) return 'warn';
  if (st.executed !== false && st.outCount == null && st.inCount == null && st.ms == null) {
    return 'untraceable';
  }
  return 'ok';
}

function inferCountUnit(st) {
  if (st.countUnit && STAGE_COUNT_UNITS[st.countUnit]) return st.countUnit;
  const def = STAGE_DEFAULTS[st.id];
  if (def?.countUnit) return def.countUnit;
  if (st.inCount != null || st.outCount != null) return 'candidates';
  return 'unknown';
}

function computeFlow(st) {
  const produced = st.produced ?? (st.outCount != null ? st.outCount : null);
  const filtered =
    st.filtered ??
    (st.inCount != null && st.outCount != null && st.inCount >= st.outCount
      ? st.inCount - st.outCount
      : null);
  const merged = st.merged ?? null;
  const dropped = st.dropped ?? filtered;
  return { produced, filtered, merged, dropped };
}

/**
 * Normalise une liste d’étapes brutes (diagnostic + adaptive.pipelineSteps).
 */
export function normalizePipelineStages(stages = []) {
  const timedTotal = stages.reduce((s, st) => s + (Number(st.ms) > 0 ? Number(st.ms) : 0), 0);

  return stages.map((st, index) => {
    const stageStatus = resolveStatus(st);
    const countUnit = inferCountUnit(st);
    const defaults = STAGE_DEFAULTS[st.id] || {};
    const flow = computeFlow(st);
    const ms = st.ms != null ? Number(st.ms) : null;
    const msShare =
      ms != null && timedTotal > 0 ? Math.round((ms / timedTotal) * 1000) / 10 : null;

    const countsComparable =
      st.inCount != null &&
      st.outCount != null &&
      countUnit !== 'bundle' &&
      countUnit !== 'unknown';

    return {
      ...st,
      order: index + 1,
      id: st.id || `stage_${index + 1}`,
      label: st.label || defaults.functionalLabel || st.id || `Étape ${index + 1}`,
      functionalLabel: defaults.functionalLabel || st.label || st.id,
      module: st.module || '—',
      stageStatus,
      countUnit,
      countUnitMeta: STAGE_COUNT_UNITS[countUnit],
      countSemantics: st.countSemantics || defaults.countSemantics || null,
      produced: flow.produced,
      filtered: flow.filtered,
      merged: flow.merged,
      dropped: flow.dropped,
      droppedApprox: countsComparable ? flow.dropped : null,
      countsComparable,
      ms,
      msShare,
      startedAt: st.startedAt || null,
      endedAt: st.endedAt || null,
      hasTiming: ms != null,
      hasIO: st.inCount != null || st.outCount != null,
      technicallyExecuted: st.executed !== false,
      functionallyOk:
        st.executed !== false &&
        !st.errors?.length &&
        stageStatus !== 'untraceable' &&
        stageStatus !== 'warn'
    };
  });
}

export function buildPipelineSummary(stages = []) {
  const list = normalizePipelineStages(stages);
  const withMs = list.filter((s) => s.ms != null);
  const totalMs = withMs.reduce((s, st) => s + st.ms, 0);
  const slowest = [...withMs].sort((a, b) => b.ms - a.ms)[0] || null;
  const losses = list.filter((s) => s.droppedApprox != null && s.droppedApprox > 0);
  const totalDropped = losses.reduce((s, st) => s + st.droppedApprox, 0);
  const byStatus = list.reduce((acc, st) => {
    acc[st.stageStatus] = (acc[st.stageStatus] || 0) + 1;
    return acc;
  }, {});

  return {
    stageCount: list.length,
    executedCount: list.filter((s) => s.technicallyExecuted).length,
    timedCount: withMs.length,
    untimedCount: list.length - withMs.length,
    totalMs,
    slowest,
    lossSteps: losses.length,
    totalDropped,
    byStatus,
    stages: list
  };
}

/**
 * Snapshot léger pour historique de runs (session).
 */
export function buildPipelineRunSnapshot(report) {
  if (!report) return null;
  const summary = buildPipelineSummary(report.stagesDetailed || report.stages || []);
  return {
    id: `${report.meta?.generatedAt || Date.now()}_${report.meta?.period || ''}`,
    generatedAt: report.meta?.generatedAt || new Date().toISOString(),
    period: report.meta?.period || null,
    totalMs: report.overview?.totalMs ?? summary.totalMs,
    shown: report.overview?.candidatesShown ?? null,
    rejected: report.overview?.candidatesRejected ?? null,
    stages: summary.stages.map((s) => ({
      id: s.id,
      label: s.label,
      ms: s.ms,
      inCount: s.inCount ?? null,
      outCount: s.outCount ?? null,
      dropped: s.droppedApprox,
      stageStatus: s.stageStatus,
      countUnit: s.countUnit
    }))
  };
}

export function comparePipelineRuns(current, previous) {
  if (!current || !previous) return null;
  const prevById = Object.fromEntries((previous.stages || []).map((s) => [s.id, s]));
  const rows = (current.stages || []).map((s) => {
    const p = prevById[s.id];
    const msDelta = s.ms != null && p?.ms != null ? s.ms - p.ms : null;
    const outDelta = s.outCount != null && p?.outCount != null ? s.outCount - p.outCount : null;
    const dropDelta = s.dropped != null && p?.dropped != null ? s.dropped - p.dropped : null;
    return {
      id: s.id,
      label: s.label,
      ms: s.ms,
      prevMs: p?.ms ?? null,
      msDelta,
      outCount: s.outCount,
      prevOut: p?.outCount ?? null,
      outDelta,
      dropped: s.dropped,
      prevDropped: p?.dropped ?? null,
      dropDelta
    };
  });
  return {
    periodA: previous.period,
    periodB: current.period,
    totalMsDelta:
      current.totalMs != null && previous.totalMs != null
        ? current.totalMs - previous.totalMs
        : null,
    rows
  };
}

const HISTORY_KEY = 'aec-pipeline-run-history-v1';
const HISTORY_MAX = 8;

export function loadPipelineRunHistory() {
  try {
    const raw = sessionStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushPipelineRunHistory(snapshot) {
  if (!snapshot?.id) return loadPipelineRunHistory();
  const prev = loadPipelineRunHistory().filter((r) => r.id !== snapshot.id);
  const next = [snapshot, ...prev].slice(0, HISTORY_MAX);
  try {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    /* quota / private mode */
  }
  return next;
}
