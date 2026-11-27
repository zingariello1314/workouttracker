/**
 * Worker XP sport — même moteur métier que le thread principal.
 * Entrées déjà normalisées (nameMap inclus) ; aucun accès DOM / IndexedDB.
 */

import { calculateSportXP } from '../services/xp/xpCalculations.js';

self.onmessage = (event) => {
  const msg = event?.data || {};
  const {
    requestId,
    signature,
    workoutData,
    garminData,
    enduranceData,
    nameMap,
    nutritionMeals,
    programs,
    activeProgram
  } = msg;

  const t0 = typeof performance !== 'undefined' ? performance.now() : Date.now();
  try {
    const result = calculateSportXP(workoutData, garminData, enduranceData, {
      getExerciseNameById: (id) => {
        if (!nameMap) return '';
        const key = String(id ?? '');
        return nameMap[key] || nameMap[id] || '';
      },
      nutritionMeals,
      programs,
      activeProgram
    });
    const durMs =
      Math.round(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0) * 10) / 10;
    self.postMessage({
      ok: true,
      requestId,
      signature,
      result,
      durMs
    });
  } catch (error) {
    const durMs =
      Math.round(((typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0) * 10) / 10;
    self.postMessage({
      ok: false,
      requestId,
      signature,
      error: String(error?.message || error || 'sport-xp-worker-error'),
      durMs
    });
  }
};
