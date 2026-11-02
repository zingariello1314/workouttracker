/**
 * F7.0f — Client Worker pour la console diagnostic.
 */
import { buildExerciseNameMap, makeWorkerRequestId } from './recapAdaptiveWorkerContract';
import { loadInsightHistory, loadLastInsightSignature } from './insightNoveltyStore';

let worker = null;
let busyId = null;
const pending = new Map();

function ensure() {
  if (typeof Worker === 'undefined') return null;
  if (!worker) {
    worker = new Worker(new URL('../../workers/recapDiagnostic.worker.js', import.meta.url), {
      type: 'module'
    });
    worker.onmessage = (event) => {
      const data = event.data || {};
      const id = data.requestId != null ? String(data.requestId) : '';
      const entry = pending.get(id);
      if (!entry) return;
      pending.delete(id);
      if (busyId === id) busyId = null;
      if (data.type === 'result' && data.report) entry.resolve(data);
      else if (data.type === 'cancelled') {
        entry.reject(Object.assign(new Error('diagnostic_cancelled'), { code: 'cancelled' }));
      } else {
        entry.reject(
          Object.assign(new Error(data.error?.message || 'diagnostic_error'), { code: 'error' })
        );
      }
    };
    worker.onerror = (err) => {
      for (const [id, entry] of pending) {
        entry.reject(Object.assign(new Error(err?.message || 'diagnostic_runtime'), { code: 'runtime' }));
        pending.delete(id);
      }
      busyId = null;
      try {
        worker.terminate();
      } catch {
        /* ignore */
      }
      worker = null;
    };
  }
  return worker;
}

export function cancelDiagnosticWorker() {
  if (busyId && worker) {
    try {
      worker.postMessage({ type: 'cancel', requestId: busyId });
    } catch {
      /* ignore */
    }
  }
  if (busyId && pending.has(busyId)) {
    const entry = pending.get(busyId);
    pending.delete(busyId);
    entry.reject(Object.assign(new Error('diagnostic_cancelled'), { code: 'cancelled' }));
  }
  busyId = null;
}

export function requestDiagnosticViaWorker(payload = {}) {
  const w = ensure();
  if (!w) {
    return Promise.reject(Object.assign(new Error('worker_unavailable'), { code: 'unavailable' }));
  }
  cancelDiagnosticWorker();
  const requestId = makeWorkerRequestId('diag');
  const nameMap =
    payload.nameMap ||
    buildExerciseNameMap(payload.snapshot, payload.getExerciseNameById || (() => ''));
  // F7.0h : le Worker n’a pas window.localStorage — injecter l’historique comme Analyse.
  const insightHistory =
    payload.insightHistory != null ? payload.insightHistory : loadInsightHistory();
  const lastInsightSignature =
    payload.lastInsightSignature !== undefined
      ? payload.lastInsightSignature
      : loadLastInsightSignature();
  const body = {
    type: 'diagnostic',
    requestId,
    snapshot: payload.snapshot,
    period: payload.period,
    window: payload.window,
    garminData: payload.garminData,
    garminPartial: payload.garminPartial,
    nameMap,
    profileQuestionnaireRaw: payload.profileQuestionnaireRaw,
    activeProgram: payload.activeProgram,
    programs: payload.programs,
    isAdmin: payload.isAdmin,
    isAuthenticated: payload.isAuthenticated,
    insightHistory,
    lastInsightSignature
  };
  return new Promise((resolve, reject) => {
    pending.set(requestId, { resolve, reject });
    busyId = requestId;
    queueMicrotask(() => {
      try {
        if (!pending.has(requestId)) return;
        w.postMessage(body);
      } catch (err) {
        pending.delete(requestId);
        busyId = null;
        reject(err);
      }
    });
  });
}
