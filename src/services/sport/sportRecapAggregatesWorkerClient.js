/**
 * Client single-flight pour agrégats muscle / muscu hors thread principal.
 * - Rejet des résultats obsolètes (revision)
 * - Fallback idle (jamais synchrone bloquant multi-secondes)
 */

import { computeRecapMuscleState } from '../../utils/sport/recapMuscleLoadEngine';
import { buildRecapStrengthCompareModel } from '../../utils/sport/recapStrengthPeriodStats';
import { buildSportXpNameMap } from '../xp/sportXpWorkerClient';

let worker = null;
let workerFailed = false;
let seq = 0;
/** @type {Map<number, { resolve: Function, reject: Function, revision: string, kind: string }>} */
const pending = new Map();
/** @type {Map<string, number>} dernière demande par kind — pour rejet stale */
const latestRevisionByKind = new Map();

function ensureWorker() {
  if (workerFailed) return null;
  if (worker) return worker;
  if (typeof Worker === 'undefined') {
    workerFailed = true;
    return null;
  }
  try {
    worker = new Worker(new URL('../../workers/sportRecapAggregates.worker.js', import.meta.url), {
      type: 'module'
    });
    worker.onmessage = (event) => {
      const msg = event.data || {};
      const entry = pending.get(msg.requestId);
      if (!entry) return;
      pending.delete(msg.requestId);
      const latest = latestRevisionByKind.get(entry.kind);
      if (latest != null && latest !== entry.revision) {
        entry.resolve({ stale: true, result: null, via: 'worker-stale', durMs: msg.durMs });
        return;
      }
      if (!msg.ok) {
        entry.reject(new Error(msg.error || 'sport-recap-worker-failed'));
        return;
      }
      entry.resolve({ stale: false, result: msg.result, via: 'worker', durMs: msg.durMs });
    };
    worker.onerror = () => {
      workerFailed = true;
      worker = null;
      for (const [, entry] of pending) {
        entry.reject(new Error('sport-recap-worker-crashed'));
      }
      pending.clear();
    };
    return worker;
  } catch {
    workerFailed = true;
    return null;
  }
}

/**
 * Sans Worker : mode dégradé explicite — ne lance PAS un sync multi-secondes dans idle.
 * Le hook conserve le dernier résultat valide (result null ici).
 */
function idleFallback(_computeFn, revision, kind) {
  return new Promise((resolve) => {
    const latest = latestRevisionByKind.get(kind);
    if (latest != null && latest !== revision) {
      resolve({ stale: true, result: null, via: 'idle-stale', durMs: 0, degraded: true });
      return;
    }
    resolve({
      stale: false,
      result: null,
      via: 'degraded-no-worker',
      durMs: 0,
      degraded: true
    });
  });
}

/**
 * @param {{
 *   kind: 'muscle'|'strength',
 *   revision: string,
 *   snapshot: object,
 *   period: string,
 *   getExerciseNameById: Function,
 *   referenceDate?: Date,
 *   numBars?: number,
 *   windowOverride?: object|null
 * }} opts
 */
export function computeSportRecapAggregateOffMain(opts) {
  const {
    kind,
    revision,
    snapshot,
    period,
    getExerciseNameById,
    referenceDate = new Date(),
    numBars = 8,
    windowOverride = null
  } = opts;

  latestRevisionByKind.set(kind, revision);
  const referenceYmd =
    referenceDate instanceof Date && !Number.isNaN(referenceDate.getTime())
      ? referenceDate.toISOString().slice(0, 10)
      : String(referenceDate || '').slice(0, 10);

  const nameMap = buildSportXpNameMap(snapshot, getExerciseNameById);
  const w = ensureWorker();

  if (!w) {
    return idleFallback(() => {
      if (kind === 'muscle') {
        return computeRecapMuscleState(
          snapshot,
          period,
          getExerciseNameById,
          referenceDate,
          windowOverride
        );
      }
      return buildRecapStrengthCompareModel(
        snapshot,
        period,
        getExerciseNameById,
        referenceDate,
        numBars,
        windowOverride
      );
    }, revision, kind);
  }

  const requestId = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(requestId, { resolve, reject, revision, kind });
    try {
      w.postMessage({
        requestId,
        revision,
        kind,
        snapshot,
        period,
        nameMap,
        referenceYmd,
        numBars,
        windowOverride
      });
    } catch (err) {
      pending.delete(requestId);
      idleFallback(() => {
        if (kind === 'muscle') {
          return computeRecapMuscleState(
            snapshot,
            period,
            getExerciseNameById,
            referenceDate,
            windowOverride
          );
        }
        return buildRecapStrengthCompareModel(
          snapshot,
          period,
          getExerciseNameById,
          referenceDate,
          numBars,
          windowOverride
        );
      }, revision, kind).then(resolve, reject);
    }
  });
}
