/**
 * Worker agrégats sidebar sport (muscle + muscu) — mêmes moteurs métier que le main.
 */

import { computeRecapMuscleState } from '../utils/sport/recapMuscleLoadEngine.js';
import { buildRecapStrengthCompareModel } from '../utils/sport/recapStrengthPeriodStats.js';

self.onmessage = (event) => {
  const msg = event?.data || {};
  const {
    requestId,
    revision,
    kind,
    snapshot,
    period,
    nameMap,
    referenceYmd,
    numBars,
    windowOverride
  } = msg;

  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    const getExerciseNameById = (id) => {
      if (!nameMap) return '';
      const key = String(id ?? '');
      return nameMap[key] || nameMap[id] || '';
    };
    const refDate = referenceYmd ? new Date(`${referenceYmd}T12:00:00`) : new Date();
    let result;
    if (kind === 'muscle') {
      result = computeRecapMuscleState(
        snapshot,
        period,
        getExerciseNameById,
        refDate,
        windowOverride
      );
    } else if (kind === 'strength') {
      result = buildRecapStrengthCompareModel(
        snapshot,
        period,
        getExerciseNameById,
        refDate,
        numBars || 8,
        windowOverride
      );
    } else {
      throw new Error(`unknown-aggregate-kind:${kind}`);
    }
    const durMs =
      Math.round(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0) * 10) / 10;
    self.postMessage({ ok: true, requestId, revision, kind, result, durMs });
  } catch (error) {
    const durMs =
      Math.round(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0) * 10) / 10;
    self.postMessage({
      ok: false,
      requestId,
      revision,
      kind,
      error: String(error?.message || error || 'sport-recap-worker-error'),
      durMs
    });
  }
};
