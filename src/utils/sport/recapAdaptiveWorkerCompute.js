/**
 * F7.0e — Cœur métier exécuté dans le Worker (et réutilisé pour l’identité Node).
 * Aucune dépendance DOM / React / localStorage.
 */
import { buildComposedInterpretationPipeline } from './recapInterpretationPipeline';
import { buildAdaptiveRecapInsights } from './recapAdaptiveInsights';
import { makeRecapComputeAbort, isRecapComputeAbort } from './recapComputeCoop';
import { RECAP_ADAPTIVE_WORKER_CONTRACT } from './recapAdaptiveWorkerContract';

/**
 * @param {object} msg — payload sérialisé (contrat Worker)
 * @param {{ shouldAbort?: () => boolean, yieldFn?: () => Promise<void> }} [coop]
 */
export async function computeAdaptiveInsightsPayload(msg, coop = {}) {
  const shouldAbort =
    typeof coop.shouldAbort === 'function'
      ? coop.shouldAbort
      : () => false;
  if (shouldAbort()) throw makeRecapComputeAbort();

  const nameMap = msg.nameMap && typeof msg.nameMap === 'object' ? msg.nameMap : {};
  const getExerciseNameById = (id) => {
    if (id == null) return '';
    return nameMap[String(id)] || nameMap[id] || '';
  };

  const window = {
    start: msg.windowStart ?? msg.window?.start ?? null,
    end: msg.windowEnd ?? msg.window?.end ?? null
  };

  const precomputedComposed = await buildComposedInterpretationPipeline({
    snapshot: msg.snapshot,
    window,
    enrichment: msg.enrichment || null,
    assessment: msg.assessment || null,
    garminData: msg.garminData || null,
    garminPartial: msg.garminPartial || null,
    garminDailyMetrics: msg.garminDailyMetrics || null,
    period: msg.period || '7d',
    getExerciseNameById,
    profileQuestionnaireRaw: msg.profileQuestionnaireRaw || null,
    activeProgram: msg.activeProgram || null,
    programs: Array.isArray(msg.programs) ? msg.programs : [],
    insightHistory: msg.insightHistory || null,
    recapState: msg.recapState || null,
    coop: {
      shouldAbort,
      yieldFn: coop.yieldFn
    }
  });

  if (shouldAbort()) throw makeRecapComputeAbort();

  const adaptive = buildAdaptiveRecapInsights({
    legacyPistes: msg.legacyPistes || msg.assessment?.insights || {},
    enrichment: msg.enrichment || null,
    assessment: msg.assessment || null,
    recapState: msg.recapState || null,
    snapshot: msg.snapshot || {},
    window,
    garminData: msg.garminData || null,
    garminPartial: msg.garminPartial || null,
    garminDailyMetrics: msg.garminDailyMetrics || null,
    period: msg.period || '7d',
    getExerciseNameById,
    profileQuestionnaireRaw: msg.profileQuestionnaireRaw || null,
    activeProgram: msg.activeProgram || null,
    programs: Array.isArray(msg.programs) ? msg.programs : [],
    precomputedComposed,
    insightHistory: msg.insightHistory || null,
    lastInsightSignature: msg.lastInsightSignature ?? null,
    persistHistory: false
  });

  return {
    contractVersion: RECAP_ADAPTIVE_WORKER_CONTRACT,
    adaptive,
    aborted: false
  };
}

export { isRecapComputeAbort, makeRecapComputeAbort };
