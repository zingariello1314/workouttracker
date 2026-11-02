/**
 * F7.0e/f — Client UI du Worker adaptatif.
 * Soft-cancel par défaut ; terminate seulement si demandé (période lourde obsolète).
 */
import {
  RECAP_ADAPTIVE_WORKER_CONTRACT,
  WORKER_MSG,
  matchesWorkerPublicationGate,
  makeWorkerRequestId
} from './recapAdaptiveWorkerContract';

/** @type {Worker|null} */
let workerInstance = null;
/** @type {string|null} */
let busyRequestId = null;
/** @type {Map<string, { resolve: Function, reject: Function, request: object }>} */
const pending = new Map();

function canUseWorker() {
  return typeof Worker !== 'undefined' && typeof window !== 'undefined';
}

function attachHandlers(w) {
  w.onmessage = (event) => {
    const data = event.data || {};
    const requestId = data.requestId != null ? String(data.requestId) : '';
    const entry = pending.get(requestId);
    if (!entry) return;

    if (data.type === WORKER_MSG.RESULT) {
      pending.delete(requestId);
      if (busyRequestId === requestId) busyRequestId = null;
      if (!matchesWorkerPublicationGate(entry.request, data)) {
        entry.reject(Object.assign(new Error('worker_publication_gate_failed'), { code: 'gate' }));
        return;
      }
      entry.resolve(data);
      return;
    }
    if (data.type === WORKER_MSG.CANCELLED) {
      pending.delete(requestId);
      if (busyRequestId === requestId) busyRequestId = null;
      entry.reject(Object.assign(new Error('worker_cancelled'), { code: 'cancelled' }));
      return;
    }
    if (data.type === WORKER_MSG.ERROR) {
      pending.delete(requestId);
      if (busyRequestId === requestId) busyRequestId = null;
      entry.reject(
        Object.assign(new Error(data.error?.message || 'worker_error'), {
          code: 'error',
          detail: data.error
        })
      );
    }
  };
  w.onerror = (err) => {
    const msg = err?.message || 'worker_runtime_error';
    for (const [id, entry] of pending.entries()) {
      entry.reject(Object.assign(new Error(msg), { code: 'runtime' }));
      pending.delete(id);
    }
    busyRequestId = null;
    try {
      w.terminate();
    } catch {
      /* ignore */
    }
    if (workerInstance === w) workerInstance = null;
  };
}

function createWorker() {
  const w = new Worker(new URL('../../workers/recapAdaptiveInsights.worker.js', import.meta.url), {
    type: 'module'
  });
  attachHandlers(w);
  return w;
}

function ensureWorker() {
  if (!canUseWorker()) return null;
  if (!workerInstance) workerInstance = createWorker();
  return workerInstance;
}

export function terminateAdaptiveInsightsWorker(reason = 'terminated') {
  const w = workerInstance;
  workerInstance = null;
  busyRequestId = null;
  for (const [id, entry] of pending.entries()) {
    entry.reject(Object.assign(new Error(reason), { code: 'terminated' }));
    pending.delete(id);
  }
  if (w) {
    try {
      w.terminate();
    } catch {
      /* ignore */
    }
  }
}

export function cancelAdaptiveInsightsRequest(requestId) {
  if (!requestId) return;
  const w = workerInstance;
  if (w) {
    try {
      w.postMessage({ type: WORKER_MSG.CANCEL, requestId: String(requestId) });
    } catch {
      /* ignore */
    }
  }
  const entry = pending.get(String(requestId));
  if (entry) {
    pending.delete(String(requestId));
    if (busyRequestId === String(requestId)) busyRequestId = null;
    entry.reject(Object.assign(new Error('worker_cancelled'), { code: 'cancelled' }));
  }
}

/** Soft-cancel la requête en cours (sans tuer le Worker). */
export function softCancelBusyAdaptiveRequest() {
  if (busyRequestId) cancelAdaptiveInsightsRequest(busyRequestId);
}

/**
 * @param {object} payload
 * @param {{ forceTerminate?: boolean }} [opts]
 *   forceTerminate: true pour 2y→7j (coupe le CPU). false = cancel coop + réutilise le Worker.
 */
export function requestAdaptiveInsightsViaWorker(payload = {}, opts = {}) {
  if (!canUseWorker()) {
    return Promise.reject(Object.assign(new Error('worker_unavailable'), { code: 'unavailable' }));
  }

  const forceTerminate = opts.forceTerminate === true;
  const prevId = busyRequestId;

  if (forceTerminate) {
    terminateAdaptiveInsightsWorker('superseded');
  } else if (prevId) {
    softCancelBusyAdaptiveRequest();
  }

  const w = ensureWorker();
  if (!w) {
    return Promise.reject(Object.assign(new Error('worker_unavailable'), { code: 'unavailable' }));
  }

  const requestId = String(payload.requestId || makeWorkerRequestId());
  const request = {
    ...payload,
    type: WORKER_MSG.COMPUTE,
    requestId,
    contractVersion: payload.contractVersion || RECAP_ADAPTIVE_WORKER_CONTRACT
  };

  return new Promise((resolve, reject) => {
    pending.set(requestId, { resolve, reject, request });
    busyRequestId = requestId;
    try {
      // Yield microtask avant clone : laisse le paint/période UI passer d’abord.
      queueMicrotask(() => {
        try {
          if (!pending.has(requestId)) return;
          w.postMessage(request);
        } catch (err) {
          pending.delete(requestId);
          if (busyRequestId === requestId) busyRequestId = null;
          reject(err);
        }
      });
    } catch (err) {
      pending.delete(requestId);
      busyRequestId = null;
      reject(err);
    }
  });
}

export function isAdaptiveInsightsWorkerAvailable() {
  return canUseWorker();
}

export function isAdaptiveInsightsWorkerBusy() {
  return Boolean(busyRequestId);
}

export { RECAP_ADAPTIVE_WORKER_CONTRACT, matchesWorkerPublicationGate };
