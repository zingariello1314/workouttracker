/**
 * F7.0e/j — Web Worker Vite : shell période + pipeline composé + insights adaptatifs.
 * Même cœur métier que `computeRecapPeriodWorkerBundle`.
 */
import {
  computeRecapPeriodWorkerBundle,
  isRecapComputeAbort
} from '../utils/sport/recapPeriodWorkerCompute.js';
import {
  RECAP_ADAPTIVE_WORKER_CONTRACT,
  WORKER_MSG
} from '../utils/sport/recapAdaptiveWorkerContract.js';

/** @type {string|null} */
let activeRequestId = null;
/** @type {Set<string>} */
const cancelledIds = new Set();

function workerYield() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function jsonSafe(value, label) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (serErr) {
    throw Object.assign(
      new Error(`worker_result_serialize_${label}: ${serErr?.message || serErr}`),
      { code: 'serialize' }
    );
  }
}

self.onmessage = async (event) => {
  const data = event.data || {};
  if (data.type === WORKER_MSG.CANCEL) {
    if (data.requestId) cancelledIds.add(String(data.requestId));
    return;
  }
  if (data.type !== WORKER_MSG.COMPUTE) return;

  const requestId = String(data.requestId || '');
  activeRequestId = requestId;
  const t0 =
    typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

  const shouldAbort = () =>
    !requestId || cancelledIds.has(requestId) || activeRequestId !== requestId;

  try {
    if (shouldAbort()) {
      self.postMessage({
        type: WORKER_MSG.CANCELLED,
        requestId,
        accountScope: data.accountScope || '',
        period: data.period,
        windowStart: data.windowStart ?? null,
        windowEnd: data.windowEnd ?? null,
        dataRevision: data.dataRevision || '',
        contractVersion: data.contractVersion || RECAP_ADAPTIVE_WORKER_CONTRACT,
        status: 'cancelled'
      });
      return;
    }

    // F7.0j — payload UI en JSON strings pour limiter le structured clone main-thread.
    let msg = data;
    if (typeof data.snapshotJson === 'string' && data.snapshotJson) {
      const snapshot = JSON.parse(data.snapshotJson);
      const side =
        typeof data.sideJson === 'string' && data.sideJson
          ? JSON.parse(data.sideJson)
          : {};
      msg = {
        ...data,
        snapshot,
        garminData: side.garminData ?? data.garminData ?? null,
        garminPartial: side.garminPartial ?? data.garminPartial ?? null,
        garminDailyMetrics: side.garminDailyMetrics ?? data.garminDailyMetrics ?? null,
        nutritionPartial: side.nutritionPartial ?? data.nutritionPartial ?? null,
        activeProgram: side.activeProgram ?? data.activeProgram ?? null,
        programs: side.programs ?? data.programs ?? [],
        profileQuestionnaireRaw:
          side.profileQuestionnaireRaw ?? data.profileQuestionnaireRaw ?? null,
        insightHistory: side.insightHistory ?? data.insightHistory ?? null,
        lastInsightSignature: side.lastInsightSignature ?? data.lastInsightSignature ?? null,
        nameMap: side.nameMap ?? data.nameMap ?? {}
      };
      delete msg.snapshotJson;
      delete msg.sideJson;
    }

    const bundle = await computeRecapPeriodWorkerBundle(msg, {
      shouldAbort,
      yieldFn: workerYield
    });

    if (shouldAbort()) {
      self.postMessage({
        type: WORKER_MSG.CANCELLED,
        requestId,
        accountScope: data.accountScope || '',
        period: data.period,
        windowStart: data.windowStart ?? null,
        windowEnd: data.windowEnd ?? null,
        dataRevision: data.dataRevision || '',
        contractVersion: data.contractVersion || RECAP_ADAPTIVE_WORKER_CONTRACT,
        status: 'cancelled'
      });
      return;
    }

    const ms =
      Math.round(
        ((typeof performance !== 'undefined' && performance.now
          ? performance.now()
          : Date.now()) -
          t0) *
          100
      ) / 100;

    // F7.0i/j — JSON-safe : pas de fonctions (getExerciseNameById) dans le résultat.
    const resultSafe = {
      adaptive: jsonSafe(bundle.adaptive, 'adaptive'),
      recapState: jsonSafe(bundle.recapState, 'recapState'),
      enduranceDigest: jsonSafe(bundle.enduranceDigest, 'enduranceDigest'),
      assessment: jsonSafe(bundle.assessment, 'assessment'),
      enrichment: jsonSafe(bundle.enrichment, 'enrichment'),
      programCoachAnalysis: jsonSafe(bundle.programCoachAnalysis, 'programCoach'),
      workerTimings: bundle.workerTimings || null
    };

    self.postMessage({
      type: WORKER_MSG.RESULT,
      requestId,
      accountScope: data.accountScope || '',
      period: data.period,
      windowStart: data.windowStart ?? null,
      windowEnd: data.windowEnd ?? null,
      dataRevision: data.dataRevision || '',
      contractVersion: data.contractVersion || RECAP_ADAPTIVE_WORKER_CONTRACT,
      status: 'ok',
      workerMs: ms,
      result: resultSafe
    });
  } catch (err) {
    if (isRecapComputeAbort(err) || shouldAbort()) {
      self.postMessage({
        type: WORKER_MSG.CANCELLED,
        requestId,
        accountScope: data.accountScope || '',
        period: data.period,
        windowStart: data.windowStart ?? null,
        windowEnd: data.windowEnd ?? null,
        dataRevision: data.dataRevision || '',
        contractVersion: data.contractVersion || RECAP_ADAPTIVE_WORKER_CONTRACT,
        status: 'cancelled'
      });
      return;
    }
    self.postMessage({
      type: WORKER_MSG.ERROR,
      requestId,
      accountScope: data.accountScope || '',
      period: data.period,
      windowStart: data.windowStart ?? null,
      windowEnd: data.windowEnd ?? null,
      dataRevision: data.dataRevision || '',
      contractVersion: data.contractVersion || RECAP_ADAPTIVE_WORKER_CONTRACT,
      status: 'error',
      error: {
        message: String(err?.message || err),
        name: err?.name || 'Error'
      }
    });
  } finally {
    cancelledIds.delete(requestId);
    if (activeRequestId === requestId) activeRequestId = null;
  }
};
