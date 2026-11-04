/**
 * Identité d’exécution diagnostic + contrat de comparabilité.
 * Ne fabrique pas de signatures approximatives : réutilise les empreintes
 * déjà portées par le rapport / l’historique quand elles existent.
 */

export const RUN_MANIFEST_SCHEMA = 'analysis-engine-run-manifest-v1';
export const COMPARABILITY = Object.freeze({
  EQUIVALENT: 'equivalent',
  SAME_DATA_DIFF_CONFIG: 'same_data_diff_config',
  DIFF_DATA: 'diff_data',
  DIFF_EDITORIAL_HISTORY: 'diff_editorial_history',
  DOM_INCOMPLETE: 'dom_incomplete',
  UNKNOWN: 'unknown',
  NON_COMPARABLE: 'non_comparable'
});

function stableRunId(parts) {
  const raw = parts.filter((p) => p != null && p !== '').join('|');
  let h = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    h ^= raw.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `run_${(h >>> 0).toString(16)}_${String(parts[0] || 'x').slice(0, 8)}`;
}

/**
 * Pseudonymise un identifiant utilisateur pour exports.
 */
export function pseudonymizeAccountId(userId) {
  if (userId == null || userId === '') return null;
  const s = String(userId);
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `acct_${(h >>> 0).toString(16)}`;
}

/**
 * Construit le manifeste d’un run à partir du rapport + contexte UI.
 */
export function buildRunManifest({
  report = null,
  period = null,
  accountId = null,
  producerVersions = {},
  cacheStatus = null,
  dataPreparedAt = null,
  computedAt = null,
  publishedAt = null,
  loadCompleteness = null
} = {}) {
  const meta = report?.meta || {};
  const overview = report?.overview || {};
  const window = overview.window || null;
  const dataSignature =
    meta.dataSignature || meta.snapshotSignature || overview.signature || null;
  const garminSignature = meta.garminSignature || overview.garminSignature || null;
  const programSignature = meta.programSignature || null;
  const editorialHistorySignature =
    meta.editorialHistorySignature ||
    (meta.insightHistoryEntryCount != null
      ? `hist:${meta.insightHistoryEntryCount}:${meta.insightHistoryInjected ? 1 : 0}`
      : null);
  const generatedAt = computedAt || meta.generatedAt || null;
  const runId =
    meta.runId ||
    stableRunId([
      period || meta.period || overview.period,
      window?.start,
      window?.end,
      dataSignature,
      editorialHistorySignature,
      generatedAt
    ]);

  return {
    schemaVersion: RUN_MANIFEST_SCHEMA,
    runId,
    period: period || meta.period || overview.period || null,
    window: window
      ? { start: window.start || null, end: window.end || null, endAt: window.endAt || null }
      : null,
    account: {
      pseudonymizedId: pseudonymizeAccountId(accountId),
      present: Boolean(accountId)
    },
    signatures: {
      trainingData: dataSignature,
      garmin: garminSignature,
      programs: programSignature,
      editorialHistory: editorialHistorySignature,
      overview: overview.signature || null
    },
    versions: {
      producers: producerVersions.producers || meta.producerVersion || null,
      workerContract: producerVersions.workerContract || meta.workerContractVersion || null,
      selectionEngine: producerVersions.selectionEngine || meta.selectionEngineVersion || null,
      editorialRules: producerVersions.editorialRules || meta.editorialRulesVersion || null,
      engine: meta.engineVersion || meta.version || null
    },
    insightHistory: {
      injected: Boolean(meta.insightHistoryInjected),
      entryCount: meta.insightHistoryEntryCount ?? null
    },
    cacheStatus: cacheStatus || meta.cacheStatus || 'non_instrumenté',
    timestamps: {
      dataPreparedAt: dataPreparedAt || meta.dataPreparedAt || null,
      computedAt: generatedAt,
      publishedAt: publishedAt || meta.publishedAt || null
    },
    loadCompleteness: loadCompleteness || meta.loadCompleteness || {
      status: 'unknown',
      note: 'Completeness non instrumentée sur ce run'
    },
    samePipeline: Boolean(meta.samePipeline),
    sideEffectsSuppressed: Boolean(meta.sideEffectsSuppressed)
  };
}

/**
 * Compare deux manifests / rapports pour qualifier la comparabilité.
 */
export function assessRunComparability(manifestA, manifestB, { mode = 'period' } = {}) {
  if (!manifestA || !manifestB) {
    return {
      status: COMPARABILITY.UNKNOWN,
      comparableAsRegression: false,
      reason: !manifestA && !manifestB ? 'missing_both' : !manifestA ? 'missing_A' : 'missing_B',
      mode
    };
  }
  const sigA = manifestA.signatures || {};
  const sigB = manifestB.signatures || {};
  const sameTraining =
    sigA.trainingData && sigB.trainingData && sigA.trainingData === sigB.trainingData;
  const sameHist =
    sigA.editorialHistory &&
    sigB.editorialHistory &&
    sigA.editorialHistory === sigB.editorialHistory;
  const sameWindow =
    manifestA.window?.start === manifestB.window?.start &&
    manifestA.window?.end === manifestB.window?.end &&
    manifestA.period === manifestB.period;

  if (mode === 'execution' || mode === 'same_period_runs') {
    if (!sameWindow) {
      return {
        status: COMPARABILITY.NON_COMPARABLE,
        comparableAsRegression: false,
        reason: 'different_windows',
        mode,
        details: { sameTraining, sameHist, sameWindow }
      };
    }
    if (sameTraining && sameHist) {
      return {
        status: COMPARABILITY.EQUIVALENT,
        comparableAsRegression: true,
        reason: 'same_data_same_history',
        mode,
        details: { sameTraining, sameHist, sameWindow }
      };
    }
    if (sameTraining && !sameHist) {
      return {
        status: COMPARABILITY.DIFF_EDITORIAL_HISTORY,
        comparableAsRegression: false,
        reason: 'editorial_history_differs',
        mode,
        details: {
          sameTraining,
          sameHist,
          histA: sigA.editorialHistory,
          histB: sigB.editorialHistory
        }
      };
    }
    if (!sameTraining) {
      return {
        status: COMPARABILITY.DIFF_DATA,
        comparableAsRegression: false,
        reason: 'training_or_garmin_signature_differs',
        mode,
        details: {
          sameTraining,
          sigA: sigA.trainingData,
          sigB: sigB.trainingData,
          note: 'Des totaux reps / jours différents indiquent des snapshots non équivalents.'
        }
      };
    }
  }

  // mode period (30d vs 7d) : fenêtres différentes attendues
  if (mode === 'period') {
    const dataRelated =
      sigA.trainingData &&
      sigB.trainingData &&
      // même hash final de signature overview (dernier champ) souvent diverge ; on compare hist + pipeline
      manifestA.insightHistory?.entryCount === manifestB.insightHistory?.entryCount;
    if (!dataRelated && sigA.trainingData !== sigB.trainingData) {
      // Toujours consultable, mais si les signatures overview parents diffèrent hors période, flag
    }
    const histAligned =
      (manifestA.insightHistory?.entryCount ?? null) ===
      (manifestB.insightHistory?.entryCount ?? null);
    return {
      status: histAligned ? COMPARABILITY.EQUIVALENT : COMPARABILITY.DIFF_EDITORIAL_HISTORY,
      comparableAsRegression: false,
      reason: histAligned
        ? 'period_comparison_same_history_context'
        : 'period_comparison_but_history_mismatch_between_sides',
      mode,
      details: {
        histA: manifestA.insightHistory,
        histB: manifestB.insightHistory,
        note: 'Une comparaison de périodes n’est pas une preuve de régression moteur.'
      }
    };
  }

  return {
    status: COMPARABILITY.UNKNOWN,
    comparableAsRegression: false,
    reason: 'unclassified',
    mode
  };
}

/**
 * Compare deux overview.signature pipe-join (format adaptive).
 * period|start|end|km|sessions|streak|pct|reps|cand|hash
 */
export function parseOverviewSignature(sig) {
  const p = String(sig || '').split('|');
  if (p.length < 9) return null;
  return {
    period: p[0],
    start: p[1],
    end: p[2],
    volumeKm: p[3],
    sessionCount: p[4],
    streak: p[5],
    completionPct: p[6],
    totalReps: Number(p[7]),
    candidateCount: Number(p[8]),
    hash: p[9] || null
  };
}

export function repsDeltaFromSignatures(sigA, sigB) {
  const a = parseOverviewSignature(sigA);
  const b = parseOverviewSignature(sigB);
  if (!a || !b || !Number.isFinite(a.totalReps) || !Number.isFinite(b.totalReps)) {
    return null;
  }
  return {
    repsA: a.totalReps,
    repsB: b.totalReps,
    delta: b.totalReps - a.totalReps,
    sameWindow: a.start === b.start && a.end === b.end && a.period === b.period
  };
}
