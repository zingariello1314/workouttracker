/**
 * Comparaisons inter-séances pour ProgressionInsight (Phase 2C).
 */

import { getExerciseVolumeFromLog } from '../exerciseLoadVolume';
import { collectDedupedCheckedVolumeKeys } from '../trainingLoadUtils';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';

/** @typedef {'strength'|'hypertrophy'|'volume'|'technical'|'deload'|'fatigue_accumulated'|'stall'|'regression'|'neutral'} ProgressionType */

/**
 * @typedef {object} ProgressionInsight
 * @property {ProgressionType} progressionType
 * @property {number} confidence — 0–1
 * @property {string} explanation
 * @property {string} [exerciseId]
 * @property {string} [exerciseName]
 * @property {string} [prevDate]
 * @property {string} [currDate]
 * @property {{ volumeDeltaPct?: number, avgWeightDeltaPct?: number, avgRepsDeltaPct?: number, setCountDelta?: number }} [metrics]
 */

/**
 * @typedef {object} ExerciseSessionSummary
 * @property {string} storageKey
 * @property {string} dateYmd
 * @property {string} exerciseId
 * @property {number} totalReps
 * @property {number} setCount
 * @property {number} avgWeight
 * @property {number} volumeKgReps
 * @property {'structured'|'legacy'} source
 */

function exerciseIdFromStorageKey(storageKey) {
  const m = String(storageKey || '').match(/^\d{4}-\d{2}-\d{2}_(.+)$/);
  return m ? m[1].replace(/_semaineA$|_semaineB$/, '') : '';
}

function pctDelta(prev, curr) {
  if (!(prev > 0)) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

/**
 * Schéma reps/série : force (≤6), hypertrophie (7–12), volume (13–20), endurance (21+).
 */
export function classifyRepScheme(setCount, totalReps) {
  const sets = Math.max(1, setCount || 1);
  const avg = (totalReps || 0) / sets;
  if (avg <= 6) return 'strength';
  if (avg <= 12) return 'hypertrophy';
  if (avg <= 20) return 'volume';
  return 'endurance';
}

/**
 * @param {object} workoutData
 * @param {string} storageKey
 * @returns {ExerciseSessionSummary|null}
 */
export function summarizeExerciseSession(workoutData, storageKey) {
  if (!workoutData?.checkedExercises?.[storageKey]) return null;
  const vol = getExerciseVolumeFromLog(workoutData, storageKey);
  const sets = vol.sets?.length
    ? vol.sets
    : (() => {
        const reps = Math.max(0, parseInt(String(workoutData.reps?.[storageKey]), 10) || 0);
        return reps > 0 ? [{ reps, weight: null }] : [];
      })();
  if (!sets.length && vol.volumeKgReps <= 0) return null;

  const totalReps = sets.reduce((s, x) => s + Math.max(0, Math.floor(Number(x?.reps) || 0)), 0);
  const weights = sets
    .map((x) => (x?.weight != null && Number(x.weight) > 0 ? Number(x.weight) : null))
    .filter((w) => w != null);
  const avgWeight =
    weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0;

  return {
    storageKey,
    dateYmd: String(storageKey).slice(0, 10),
    exerciseId: exerciseIdFromStorageKey(storageKey),
    totalReps,
    setCount: sets.length || 1,
    avgWeight,
    volumeKgReps: vol.volumeKgReps,
    source: vol.source
  };
}

/**
 * @param {ExerciseSessionSummary|null|undefined} prev
 * @param {ExerciseSessionSummary|null|undefined} curr
 * @returns {ProgressionInsight}
 */
export function interpretExerciseProgression(prev, curr) {
  const neutral = {
    progressionType: 'neutral',
    confidence: 0,
    explanation: '',
    exerciseId: curr?.exerciseId || prev?.exerciseId,
    prevDate: prev?.dateYmd,
    currDate: curr?.dateYmd
  };
  if (!prev || !curr) return neutral;

  const volPrev = prev.volumeKgReps || 0;
  const volCurr = curr.volumeKgReps || 0;
  const repsPrev = prev.totalReps || 0;
  const repsCurr = curr.totalReps || 0;
  const wPrev = prev.avgWeight || 0;
  const wCurr = curr.avgWeight || 0;
  const setsPrev = prev.setCount || 1;
  const setsCurr = curr.setCount || 1;
  const avgRepsPrev = repsPrev / setsPrev;
  const avgRepsCurr = repsCurr / setsCurr;
  const schemePrev = classifyRepScheme(setsPrev, repsPrev);
  const schemeCurr = classifyRepScheme(setsCurr, repsCurr);

  const metrics = {
    volumeDeltaPct: Math.round(pctDelta(volPrev, volCurr)),
    avgWeightDeltaPct: wPrev > 0 ? Math.round(pctDelta(wPrev, wCurr)) : undefined,
    avgRepsDeltaPct: repsPrev > 0 ? Math.round(pctDelta(repsPrev, repsCurr)) : undefined,
    setCountDelta: setsCurr - setsPrev
  };

  const base = {
    exerciseId: curr.exerciseId,
    prevDate: prev.dateYmd,
    currDate: curr.dateYmd,
    metrics,
    schemePrev,
    schemeCurr
  };

  if (
    schemePrev !== schemeCurr &&
    schemeCurr === 'strength' &&
    avgRepsCurr < avgRepsPrev - 1 &&
    (wCurr >= wPrev * 0.95 || wPrev <= 0)
  ) {
    return {
      ...base,
      progressionType: 'strength',
      confidence: curr.source === 'structured' ? 0.9 : 0.76,
      explanation: `Schéma orienté force (${setsCurr}×~${Math.round(avgRepsCurr)} vs ${setsPrev}×~${Math.round(avgRepsPrev)} avant)${
        wCurr > wPrev * 1.02 ? ` — charge montée à ~${Math.round(wCurr)} kg` : wCurr < wPrev * 0.98 ? ` — charge allégée à ~${Math.round(wCurr)} kg` : ''
      }`
    };
  }

  if (
    schemePrev === 'strength' &&
    schemeCurr === 'hypertrophy' &&
    repsCurr > repsPrev * 1.05 &&
    Math.abs(wCurr - wPrev) / Math.max(wPrev, 1) <= 0.08
  ) {
    return {
      ...base,
      progressionType: 'hypertrophy',
      confidence: curr.source === 'structured' ? 0.86 : 0.74,
      explanation: `Passage vers plus de reps par série (${setsCurr}×~${Math.round(avgRepsCurr)} vs ${setsPrev}×~${Math.round(avgRepsPrev)}) à charge stable`
    };
  }

  if (wPrev > 0 && wCurr >= wPrev * 1.05 && repsCurr <= repsPrev * 0.95 && volCurr >= volPrev * 0.85) {
    return {
      ...base,
      progressionType: 'strength',
      confidence: curr.source === 'structured' ? 0.91 : 0.78,
      explanation: 'Charge fortement augmentée malgré baisse des répétitions'
    };
  }

  if (wPrev > 0 && Math.abs(wCurr - wPrev) / wPrev <= 0.06 && repsCurr >= repsPrev * 1.08) {
    return {
      ...base,
      progressionType: 'hypertrophy',
      confidence: curr.source === 'structured' ? 0.84 : 0.72,
      explanation: 'Plus de répétitions à charge stable'
    };
  }

  if (setsCurr > setsPrev && Math.abs(wCurr - wPrev) / Math.max(wPrev, 1) <= 0.08 && volCurr > volPrev * 1.05) {
    return {
      ...base,
      progressionType: 'volume',
      confidence: 0.8,
      explanation: 'Volume en hausse via davantage de séries'
    };
  }

  if (
    volPrev > 0 &&
    volCurr < volPrev * 0.88 &&
    repsCurr < repsPrev * 0.92 &&
    !(wCurr > wPrev * 1.03)
  ) {
    return {
      ...base,
      progressionType: 'regression',
      confidence: 0.65,
      explanation: 'Baisse du volume et des répétitions par rapport à la séance précédente'
    };
  }

  if (
    volPrev > 0 &&
    Math.abs(metrics.volumeDeltaPct) < 6 &&
    Math.abs(metrics.avgRepsDeltaPct ?? 0) < 6 &&
    Math.abs(metrics.avgWeightDeltaPct ?? 0) < 6
  ) {
    return {
      ...base,
      progressionType: 'stall',
      confidence: 0.7,
      explanation: 'Performances stables sur les deux dernières séances comparables'
    };
  }

  if (volCurr > volPrev * 1.12) {
    return {
      ...base,
      progressionType: 'volume',
      confidence: 0.75,
      explanation: 'Volume total en hausse'
    };
  }

  return { ...neutral, ...base, metrics };
}

/**
 * Historique par exercice (sessions triées par date).
 * @param {object} workoutData
 * @param {string} exerciseId
 * @param {{ start?: string|null, end?: string }|null} [window]
 * @returns {ExerciseSessionSummary[]}
 */
export function collectExerciseSessionSummaries(workoutData, exerciseId, window = null) {
  const exId = String(exerciseId || '').trim();
  if (!exId || !workoutData) return [];

  const keys = collectDedupedCheckedVolumeKeys(workoutData).filter((key) => {
    if (exerciseIdFromStorageKey(key) !== exId) return false;
    if (window?.end) {
      const d = String(key).slice(0, 10);
      return isDateInRecapWindow(d, window);
    }
    return true;
  });

  const summaries = keys
    .map((key) => summarizeExerciseSession(workoutData, key))
    .filter(Boolean)
    .sort((a, b) => a.dateYmd.localeCompare(b.dateYmd) || a.storageKey.localeCompare(b.storageKey));

  return summaries;
}

/**
 * Insights progression pour tous les exos avec au moins 2 séances dans la fenêtre.
 * @param {object} workoutData
 * @param {{ start?: string|null, end?: string }|null} window
 * @param {(id: number|string) => string} [getExerciseNameById]
 * @returns {ProgressionInsight[]}
 */
export function computeProgressionInsights(workoutData, window, getExerciseNameById) {
  if (!workoutData) return [];

  const byEx = new Map();
  collectDedupedCheckedVolumeKeys(workoutData).forEach((key) => {
    const exId = exerciseIdFromStorageKey(key);
    if (!exId) return;
    if (window?.end) {
      const d = String(key).slice(0, 10);
      if (!isDateInRecapWindow(d, window)) return;
    }
    const summary = summarizeExerciseSession(workoutData, key);
    if (!summary) return;
    if (!byEx.has(exId)) byEx.set(exId, []);
    byEx.get(exId).push(summary);
  });

  const insights = [];
  for (const [exId, sessions] of byEx.entries()) {
    sessions.sort((a, b) => a.dateYmd.localeCompare(b.dateYmd));
    if (sessions.length < 2) continue;
    const prev = sessions[sessions.length - 2];
    const curr = sessions[sessions.length - 1];
    const insight = interpretExerciseProgression(prev, curr);
    if (insight.progressionType === 'neutral' || insight.confidence < 0.6) continue;
    let exerciseName = `Exercice ${exId}`;
    if (typeof getExerciseNameById === 'function') {
      const n = parseInt(exId, 10);
      if (Number.isFinite(n)) {
        const label = getExerciseNameById(n);
        if (label && String(label).trim()) exerciseName = String(label).trim();
      }
    }
    insights.push({
      ...insight,
      exerciseName,
      currStorageKey: curr.storageKey,
      prevStorageKey: prev.storageKey
    });
  }

  return insights.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}

/** Progression utile au panneau Repères — pas les messages « stable / neutre ». */
export function isActionableProgressionInsight(insight) {
  if (!insight?.explanation) return false;
  const type = insight.progressionType;
  const conf = insight.confidence || 0;
  if (type === 'neutral' || type === 'stall') return false;
  if (conf < 0.72) return false;
  const m = insight.metrics || {};
  if (type === 'regression' && conf < 0.78) return false;
  if (type === 'volume' && Math.abs(m.volumeDeltaPct ?? 0) < 8) return false;
  if (
    type !== 'strength' &&
    type !== 'hypertrophy' &&
    Math.abs(m.setCountDelta ?? 0) === 0 &&
    Math.abs(m.volumeDeltaPct ?? 0) < 8 &&
    Math.abs(m.avgWeightDeltaPct ?? 0) < 5 &&
    Math.abs(m.avgRepsDeltaPct ?? 0) < 6
  ) {
    return false;
  }
  return true;
}

/**
 * Texte coach lisible pour le panneau Repères Récap.
 * @param {ProgressionInsight} insight
 */
export function formatProgressionCoachText(insight) {
  if (!insight?.explanation) return null;
  const name = insight.exerciseName || `Exercice ${insight.exerciseId}`;
  const m = insight.metrics || {};
  const parts = [insight.explanation];

  if (m.setCountDelta != null || m.avgWeightDeltaPct != null || m.volumeDeltaPct != null) {
    if (m.setCountDelta != null && m.setCountDelta !== 0) {
      parts.push(
        m.setCountDelta > 0
          ? `${Math.abs(m.setCountDelta)} série(s) de plus`
          : `${Math.abs(m.setCountDelta)} série(s) de moins`
      );
    }
    if (m.avgWeightDeltaPct != null && Math.abs(m.avgWeightDeltaPct) >= 3) {
      parts.push(`charge ${m.avgWeightDeltaPct > 0 ? '+' : ''}${m.avgWeightDeltaPct} %`);
    }
    if (m.volumeDeltaPct != null && Math.abs(m.volumeDeltaPct) >= 5) {
      parts.push(`tonnage ${m.volumeDeltaPct > 0 ? '+' : ''}${m.volumeDeltaPct} %`);
    }
  }

  const detail = parts.length > 1 ? ` (${parts.slice(1).join(' · ')})` : '';
  return `${name} : ${parts[0]}${detail}.`;
}