/**
 * Fusion « difficulté » : étoiles saisies le jour des exos cochés + tendance reps
 * (en ignorant montées de charge qui font baisser les reps).
 * @module exerciseSessionEffortBlend
 */

import { extractDateStrFromWorkoutKey, extractExerciseIdFromWorkoutKey } from './exerciseKeyGenerator';
import { computeVolumeKgForWorkoutKey } from './exerciseLoadVolume';
import {
  computeGlobalDifficultyPerceived5,
  perceivedStorageToDraft
} from './exercisePerceivedRatingsModel';
import { intensityCoeffToStarCount, resolveExerciseIntensityCoeff } from './trainingLoadUtils';

function pickStoredPerceivedRatings(workoutData, exercise) {
  const map = workoutData?.exercisePerceivedRatings || {};
  const ids = [exercise?.id, exercise?.originalId].filter((x) => x != null).map(String);
  for (const id of ids) {
    const row = map[id];
    if (row && typeof row === 'object') return row;
  }
  return null;
}

function clampInt(n, lo, hi) {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return lo;
  return Math.max(lo, Math.min(hi, x));
}

function median(nums) {
  const a = nums.filter((x) => Number.isFinite(x)).slice().sort((u, v) => u - v);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

/**
 * @param {object} workoutData
 * @param {{ id: string|number, originalId?: string|number }} exercise
 * @returns {Array<{ key: string, dateStr: string, reps: number, volumeKg: number, weightKg: number|null, stars: number|null }>}
 */
export function collectCompletedSessionsForExercise(workoutData, exercise) {
  const ids = new Set(
    [exercise?.id, exercise?.originalId].filter((x) => x != null).map(String)
  );
  const checked = workoutData?.checkedExercises || {};
  const repsMap = workoutData?.reps || {};
  const starsMap = workoutData?.exerciseSessionEffortStars || {};

  const out = [];
  for (const [key, v] of Object.entries(checked)) {
    if (v !== true) continue;
    const exId = extractExerciseIdFromWorkoutKey(key);
    if (!ids.has(exId)) continue;
    const dateStr = extractDateStrFromWorkoutKey(key);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
    const r = parseInt(String(repsMap[key] ?? ''), 10) || 0;
    const vol = computeVolumeKgForWorkoutKey(key, workoutData);
    const weightKg =
      r > 0 && Number.isFinite(vol) && vol > 0 ? vol / r : null;
    const sr = starsMap[key];
    const stars =
      sr >= 1 && sr <= 5 && Number.isFinite(Number(sr))
        ? Math.round(Number(sr))
        : null;
    out.push({ key, dateStr, reps: r, volumeKg: vol, weightKg, stars });
  }
  out.sort((a, b) => b.dateStr.localeCompare(a.dateStr));
  return out;
}

/**
 * Tendance « plus dur / plus facile » à partir des enchaînements chronologiques,
 * en ignorant les couples où la charge par rep monte sensiblement avec des reps qui baissent.
 * @param {Array<{ dateStr: string, reps: number, weightKg: number|null }>} sessionsChronoNewestFirst
 */
function repsTrendAdjustment(sessionsChronoNewestFirst) {
  const sorted = [...sessionsChronoNewestFirst].sort((a, b) =>
    a.dateStr.localeCompare(b.dateStr)
  );
  if (sorted.length < 3) return 0;

  let harder = 0;
  let easier = 0;
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.reps < 6 || curr.reps < 6) continue;

    const wPrev =
      prev.weightKg != null && prev.weightKg > 0 ? prev.weightKg : null;
    const wCurr =
      curr.weightKg != null && curr.weightKg > 0 ? curr.weightKg : null;

    const repRatio =
      prev.reps > 0 ? curr.reps / prev.reps : 1;

    if (wPrev != null && wCurr != null) {
      const loadRatio = wCurr / (wPrev > 1e-6 ? wPrev : 1);
      if (loadRatio > 1.12 && repRatio < 0.94) continue;
      if (loadRatio < 0.88 && repRatio > 1.06) continue;
      if (loadRatio > 1.08 && curr.reps >= prev.reps) harder += 1;
      else if (loadRatio < 0.92 && curr.reps <= prev.reps) easier += 1;
      else if (Math.abs(loadRatio - 1) <= 0.06) {
        if (repRatio < 0.88) harder += 1;
        else if (repRatio > 1.12) easier += 1;
      }
    } else {
      if (repRatio < 0.88) harder += 1;
      else if (repRatio > 1.12) easier += 1;
    }
  }

  return clampInt(Math.round(harder - easier), -3, 3);
}

/**
 * Note 1–5 affichée + source pour la fiche / tooltips.
 */
export function computeBlendedExerciseEffortStars(workoutData, exercise) {
  const coeffs = workoutData?.exerciseIntensityCoeffs || {};
  const autoCoeff = resolveExerciseIntensityCoeff(exercise, coeffs);
  const autoStars = intensityCoeffToStarCount(autoCoeff);

  const sessions = collectCompletedSessionsForExercise(workoutData, exercise);
  const starred = sessions.filter((s) => s.stars != null).map((s) => s.stars);
  const userMedianStars = starred.length ? median(starred) : null;
  const lastStarredMedian =
    starred.length >= 2 ? median(starred.slice(0, 8)) : userMedianStars;

  const trend = repsTrendAdjustment(
    sessions.map((s) => ({
      dateStr: s.dateStr,
      reps: s.reps,
      weightKg: s.weightKg
    }))
  );
  /** @type {number} */
  let trendStars = 3;
  if (trend <= -2) trendStars = 1;
  else if (trend === -1) trendStars = 2;
  else if (trend === 0) trendStars = 3;
  else if (trend === 1) trendStars = 4;
  else trendStars = 5;

  let display = autoStars;
  let source = 'auto';

  if (lastStarredMedian != null && starred.length >= 2) {
    display = clampInt(
      0.55 * lastStarredMedian + 0.25 * trendStars + 0.2 * autoStars,
      1,
      5
    );
    source = 'blend_stars_history';
  } else if (lastStarredMedian != null) {
    display = clampInt(0.65 * lastStarredMedian + 0.35 * autoStars, 1, 5);
    source = 'blend_stars_auto';
  } else if (sessions.filter((s) => s.reps >= 8).length >= 5 && trend !== 0) {
    display = clampInt(0.52 * trendStars + 0.48 * autoStars, 1, 5);
    source = 'blend_reps_trend';
  }

  const perceivedRow = pickStoredPerceivedRatings(workoutData, exercise);
  const perceivedGlobal = computeGlobalDifficultyPerceived5(
    perceivedStorageToDraft(perceivedRow || {})
  );
  let perceivedStars = null;
  if (perceivedGlobal != null && Number.isFinite(perceivedGlobal)) {
    perceivedStars = clampInt(Math.round(perceivedGlobal), 1, 5);
    display = clampInt(Math.round(0.44 * display + 0.56 * perceivedStars), 1, 5);
    source =
      source === 'auto'
        ? 'perceived_auto'
        : `${source}_perceived`;
  }

  return {
    displayStars: display,
    source,
    /** Indice automatique sans prise en compte des séances */
    autoStars,
    autoCoeff,
    userMedianStars,
    starredSessionCount: starred.length,
    trendScore: trend,
    perceivedStars
  };
}
