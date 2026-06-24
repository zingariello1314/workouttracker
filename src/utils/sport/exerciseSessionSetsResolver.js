/**
 * Résolution fiable séries × reps / durée pour benchmarks et analyses.
 * Croise programme (ex. 4×10, 3×1 min), exerciseSetLogs et saisie legacy.
 */

import { getOrBuildExerciseSetLog } from '../exerciseSetLogUtils';
import {
  lookupProgramExerciseStub,
  distributeRepsToSets,
  parseSeriesSetCount
} from '../exerciseLoadVolume';
import { detectExerciseUnit } from '../exerciseCalculations';

function exerciseIdFromKey(storageKey) {
  return String(storageKey || '')
    .slice(11)
    .replace(/_semaineA$|_semaineB$/, '');
}

function exerciseStub(storageKey, getExerciseNameById) {
  const rawId = exerciseIdFromKey(storageKey);
  const stub = lookupProgramExerciseStub(rawId);
  const name =
    typeof getExerciseNameById === 'function' ? getExerciseNameById(rawId) : '';
  return name ? { ...stub, name: String(name).trim() } : stub;
}

/** Valeur saisie → secondes pour exercices isométriques. */
export function rawHoldValueToSeconds(rawValue, exercise) {
  const v = Math.max(0, Math.floor(Number(rawValue) || 0));
  if (v <= 0) return 0;
  const unitInfo = detectExerciseUnit(exercise) || { unit: 'reps', isTimeBased: false };
  if (!unitInfo.isTimeBased) return v;
  if (unitInfo.unit === 'min') return v * 60;
  const n = String(exercise?.name || '').toLowerCase();
  if (/wall\s*sit|chaise\s*(murale|au mur)|chair\s*hold/.test(n)) return v * 60;
  return v;
}

/**
 * Durée cible par série depuis le texte programme (ex. 3×1 min → 60 s).
 */
export function parsePerSetHoldSecondsFromSeries(exercise) {
  const series = String(exercise?.series || '');
  const minMatch = series.match(/(\d+)\s*[×x]\s*(\d+)\s*min/i);
  if (minMatch) {
    return {
      setCount: parseInt(minMatch[1], 10),
      perSetSeconds: parseInt(minMatch[2], 10) * 60
    };
  }
  const secMatch = series.match(/(\d+)\s*[×x]\s*(\d+)\s*sec/i);
  if (secMatch) {
    return {
      setCount: parseInt(secMatch[1], 10),
      perSetSeconds: parseInt(secMatch[2], 10)
    };
  }
  const loneMin = series.match(/(\d+)\s*min/i);
  if (loneMin) {
    return { setCount: 1, perSetSeconds: parseInt(loneMin[1], 10) * 60 };
  }
  const loneSec = series.match(/(\d+)\s*sec/i);
  if (loneSec) {
    return { setCount: 1, perSetSeconds: parseInt(loneSec[1], 10) };
  }
  return null;
}

function expectedSetCount(exercise, setsLength) {
  const fromSeries = parseSeriesSetCount(exercise?.series);
  const holdTpl = parsePerSetHoldSecondsFromSeries(exercise);
  if (holdTpl?.setCount > 0) return holdTpl.setCount;
  if (fromSeries > 0) return fromSeries;
  return Math.max(1, setsLength || 1);
}

/**
 * Si une seule série contient le total journalier, redistribue selon le programme.
 */
function inferSetCountFromTotalReps(total) {
  const t = Math.max(0, Math.floor(Number(total) || 0));
  if (t < 8) return 1;
  for (const n of [4, 3, 5, 6, 2]) {
    if (t % n === 0) {
      const per = t / n;
      if (per >= 1 && per <= 35) return n;
    }
  }
  return 1;
}

function expandSingleSetTotalIfNeeded(sets, exercise, totalFallback) {
  if (!sets.length) return sets;
  const unitInfo = detectExerciseUnit(exercise);
  const total = Math.max(
    sets.reduce((s, x) => s + (x.reps || 0), 0),
    sets[0]?.reps || 0,
    totalFallback || 0
  );

  if (total <= 0) return sets;

  if (sets.length > 1) return sets;

  let expected = expectedSetCount(exercise, sets.length);
  if (expected <= 1 && !unitInfo?.isTimeBased && total >= 8) {
    expected = inferSetCountFromTotalReps(total);
  }

  if (expected > 1) {
    if (unitInfo?.isTimeBased) {
      const holdTpl = parsePerSetHoldSecondsFromSeries(exercise);
      if (holdTpl && holdTpl.setCount === expected) {
        const perMin = holdTpl.perSetSeconds / 60;
        if (/wall\s*sit|chaise/.test(String(exercise?.name || '').toLowerCase())) {
          return Array.from({ length: expected }, () => ({
            ...sets[0],
            reps: perMin
          }));
        }
        const perRaw =
          unitInfo.unit === 'min' ? holdTpl.perSetSeconds / 60 : holdTpl.perSetSeconds;
        return Array.from({ length: expected }, () => ({
          ...sets[0],
          reps: perRaw
        }));
      }
      const distributed = distributeRepsToSets(total, expected);
      return distributed.map((reps) => ({ ...sets[0], reps }));
    }

    const distributed = distributeRepsToSets(total, expected);
    if (Math.max(...distributed) < total) {
      return distributed.map((reps) => ({ ...sets[0], reps }));
    }
  }

  return sets;
}

/**
 * @returns {{
 *   sets: Array<{ reps: number, weight: number|null, holdSeconds?: number }>,
 *   maxSetReps: number,
 *   maxHoldSeconds: number,
 *   isTimeBased: boolean,
 *   setCount: number,
 *   schemeLabel: string|null,
 *   source: 'structured'|'legacy'
 * }}
 */
export function resolveExerciseSetsForAnalysis(workoutData, storageKey, getExerciseNameById) {
  const exercise = exerciseStub(storageKey, getExerciseNameById);
  const unitInfo = detectExerciseUnit(exercise) || { unit: 'reps', isTimeBased: false };
  const isTimeBased = unitInfo.isTimeBased === true;

  const structured = workoutData?.exerciseSetLogs?.[storageKey];
  const hasStructured = Array.isArray(structured?.sets) && structured.sets.length > 0;
  const log = getOrBuildExerciseSetLog(workoutData, storageKey, exercise);
  const totalFallback = Math.max(0, parseInt(String(workoutData?.reps?.[storageKey]), 10) || 0);

  let rawSets = (log?.sets || []).map((s) => ({
    reps: Math.max(0, Math.floor(Number(s?.reps) || 0)),
    weight:
      s?.weight != null && Number.isFinite(Number(s.weight)) && Number(s.weight) > 0
        ? Number(s.weight)
        : null,
    weightMode: s?.weightMode
  }));

  if (!rawSets.length && totalFallback > 0) {
    rawSets = [{ reps: totalFallback, weight: null }];
  }

  rawSets = expandSingleSetTotalIfNeeded(rawSets, exercise, totalFallback);

  const sets = rawSets.map((s) => {
    const holdSeconds = isTimeBased ? rawHoldValueToSeconds(s.reps, exercise) : 0;
    return { ...s, holdSeconds };
  });

  const maxSetReps = sets.reduce((m, s) => Math.max(m, s.reps), 0);
  const maxHoldSeconds = isTimeBased
    ? sets.reduce((m, s) => Math.max(m, s.holdSeconds || 0), 0)
    : 0;

  const setCount = sets.length;
  let schemeLabel = null;
  if (setCount > 0) {
    if (isTimeBased) {
      const bestSec = maxHoldSeconds;
      const bestDisplay =
        unitInfo.unit === 'min' || /wall\s*sit|chaise/.test(String(exercise.name).toLowerCase())
          ? `${Math.round(bestSec / 60)} min`
          : `${bestSec} s`;
      schemeLabel =
        setCount > 1 ? `${setCount}×${bestDisplay} (meilleure série)` : bestDisplay;
    } else {
      schemeLabel = setCount > 1 ? `${setCount}×${maxSetReps}` : `${maxSetReps} reps`;
    }
  }

  return {
    sets,
    maxSetReps,
    maxHoldSeconds,
    isTimeBased,
    setCount,
    schemeLabel,
    source: hasStructured ? 'structured' : 'legacy'
  };
}
