/**
 * Client single-flight pour calculateSportXP hors thread principal.
 * - Une requête active par signature
 * - Rejet des résultats obsolètes (signature ≠ dernière demandée)
 * - Fallback synchrone si Worker indisponible
 */

import { calculateSportXP } from './xpCalculations';

let worker = null;
let workerFailed = false;
let seq = 0;
const pending = new Map();

function ensureWorker() {
  if (workerFailed) return null;
  if (worker) return worker;
  if (typeof Worker === 'undefined') {
    workerFailed = true;
    return null;
  }
  try {
    worker = new Worker(new URL('../../workers/sportXp.worker.js', import.meta.url), {
      type: 'module'
    });
    worker.onmessage = (event) => {
      const msg = event.data || {};
      const entry = pending.get(msg.requestId);
      if (!entry) return;
      pending.delete(msg.requestId);
      if (!msg.ok) {
        entry.reject(new Error(msg.error || 'sport-xp-worker-failed'));
        return;
      }
      entry.resolve({ result: msg.result, durMs: msg.durMs, via: 'worker' });
    };
    worker.onerror = () => {
      workerFailed = true;
      worker = null;
      for (const [, entry] of pending) {
        entry.reject(new Error('sport-xp-worker-crashed'));
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
 * Construit une map id→nom pour le worker (getExerciseNameById n’est pas clonable).
 */
export function buildSportXpNameMap(workoutData, getExerciseNameById) {
  const map = Object.create(null);
  if (typeof getExerciseNameById !== 'function') return map;

  const addId = (raw) => {
    const id = String(raw ?? '').replace(/_semaineA$|_semaineB$/, '');
    if (!id || map[id] != null) return;
    try {
      map[id] = getExerciseNameById(id) || '';
    } catch {
      map[id] = '';
    }
  };

  const scanKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const parts = key.split('_');
      if (parts.length >= 2) addId(parts.slice(1).join('_').replace(/_semaineA$|_semaineB$/, ''));
    }
  };

  scanKeys(workoutData?.reps);
  scanKeys(workoutData?.checkedExercises);
  scanKeys(workoutData?.exerciseWeights);
  if (workoutData?.exerciseDisplayNames) {
    for (const id of Object.keys(workoutData.exerciseDisplayNames)) addId(id);
  }
  return map;
}

/**
 * @returns {Promise<{ result: object, durMs: number, via: 'worker'|'main-fallback', transferMs?: number }>}
 */
export function computeSportXpOffMainThread({
  signature,
  workoutData,
  garminData,
  enduranceData,
  getExerciseNameById,
  nutritionMeals,
  programs,
  activeProgram
}) {
  const sportOptions = {
    getExerciseNameById,
    nutritionMeals,
    programs,
    activeProgram
  };
  const nameMap = buildSportXpNameMap(workoutData, getExerciseNameById);
  const w = ensureWorker();

  if (!w) {
    const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const result = calculateSportXP(workoutData, garminData, enduranceData, sportOptions);
    const durMs =
      Math.round(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0) * 10) / 10;
    return Promise.resolve({ result, durMs, via: 'main-fallback' });
  }

  const requestId = ++seq;
  const transferT0 = typeof performance !== 'undefined' ? performance.now() : Date.now();

  return new Promise((resolve, reject) => {
    pending.set(requestId, {
      resolve: (payload) => {
        const transferMs =
          Math.round(
            ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - transferT0) * 10
          ) / 10;
        resolve({ ...payload, transferMs, signature });
      },
      reject,
      signature
    });
    try {
      w.postMessage({
        requestId,
        signature,
        workoutData,
        garminData,
        enduranceData,
        nameMap,
        nutritionMeals,
        programs,
        activeProgram
      });
    } catch (error) {
      pending.delete(requestId);
      const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
      try {
        const result = calculateSportXP(workoutData, garminData, enduranceData, sportOptions);
        const durMs =
          Math.round(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0) * 10) /
          10;
        resolve({ result, durMs, via: 'main-fallback', error: String(error?.message || error) });
      } catch (syncError) {
        reject(syncError);
      }
    }
  });
}

export function isSportXpWorkerAvailable() {
  return Boolean(ensureWorker());
}
