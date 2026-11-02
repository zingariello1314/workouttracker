/**
 * F7.0f — Worker diagnostic console (hors thread UI).
 */
import { buildAnalysisEngineDiagnosticReport } from '../utils/sport/analysisEngineDiagnostic.js';
import { enrichDiagnosticReport } from '../utils/sport/analysisEngineDiagnosticModel.js';
import { RECAP_ADAPTIVE_WORKER_CONTRACT } from '../utils/sport/recapAdaptiveWorkerContract.js';

let cancelledId = null;

self.onmessage = (event) => {
  const data = event.data || {};
  if (data.type === 'cancel') {
    cancelledId = data.requestId != null ? String(data.requestId) : cancelledId;
    return;
  }
  if (data.type !== 'diagnostic') return;

  const requestId = String(data.requestId || '');
  const t0 =
    typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();

  try {
    if (cancelledId && cancelledId === requestId) {
      self.postMessage({ type: 'cancelled', requestId, status: 'cancelled' });
      return;
    }
    const nameMap = data.nameMap && typeof data.nameMap === 'object' ? data.nameMap : {};
    const getExerciseNameById = (id) => nameMap[String(id)] || nameMap[id] || '';
    const report = enrichDiagnosticReport(
      buildAnalysisEngineDiagnosticReport({
        snapshot: data.snapshot || {},
        period: data.period || '30d',
        window: data.window || null,
        garminData: data.garminData || null,
        garminPartial: data.garminPartial || null,
        getExerciseNameById,
        profileQuestionnaireRaw: data.profileQuestionnaireRaw || null,
        activeProgram: data.activeProgram || null,
        programs: Array.isArray(data.programs) ? data.programs : [],
        isAdmin: Boolean(data.isAdmin),
        isAuthenticated: Boolean(data.isAuthenticated),
        getTodayWorkout: null,
        // F7.0h — historique injecté (Worker sans localStorage)
        insightHistory: data.insightHistory || null,
        lastInsightSignature:
          data.lastInsightSignature !== undefined ? data.lastInsightSignature : null
      })
    );
    if (cancelledId && cancelledId === requestId) {
      self.postMessage({ type: 'cancelled', requestId, status: 'cancelled' });
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
    self.postMessage({
      type: 'result',
      requestId,
      status: 'ok',
      contractVersion: RECAP_ADAPTIVE_WORKER_CONTRACT,
      workerMs: ms,
      report
    });
  } catch (err) {
    self.postMessage({
      type: 'error',
      requestId,
      status: 'error',
      error: { message: String(err?.message || err), name: err?.name || 'Error' }
    });
  }
};
