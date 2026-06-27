/**
 * Progression par exercice — historique séances, tendances, interprétations.
 */

import { collectDedupedCheckedVolumeKeys } from '../trainingLoadUtils';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import {
  summarizeExerciseSession,
  interpretExerciseProgression,
  classifyRepScheme
} from './volumeProgressionEngine';
import { buildExerciseRepInsights } from './repSetSemanticAnalysis';
import { getExercisePrescriptionStruct } from '../programPrescriptionNormalizer';
import { lookupProgramExerciseStub } from '../exerciseLoadVolume';

function exerciseIdFromStorageKey(storageKey) {
  const m = String(storageKey || '').match(/^\d{4}-\d{2}-\d{2}_(.+)$/);
  return m ? m[1].replace(/_semaineA$|_semaineB$/, '') : '';
}

function resolveExerciseName(exerciseId, getExerciseNameById) {
  const n = parseInt(exerciseId, 10);
  if (typeof getExerciseNameById === 'function' && Number.isFinite(n)) {
    const label = getExerciseNameById(n);
    if (label && String(label).trim()) return String(label).trim();
  }
  return `Exercice ${exerciseId}`;
}

function pctDelta(prev, curr) {
  if (!(prev > 0)) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}

function avgOf(arr, pick) {
  if (!arr.length) return 0;
  return arr.reduce((s, x) => s + pick(x), 0) / arr.length;
}

/**
 * Détail enrichi d'une séance (séries, maintien, schéma).
 */
export function enrichExerciseSessionDetail(workoutData, storageKey, getExerciseNameById) {
  const summary = summarizeExerciseSession(workoutData, storageKey);
  if (!summary) return null;
  const structured = analyzeStructuredSession(workoutData, storageKey, getExerciseNameById);
  if (!structured) return { ...summary, schemeLabel: null, isHold: false };

  return {
    ...summary,
    sets: structured.sets || [],
    schemeLabel: structured.schemeLabel,
    maxSetReps: structured.maxSetReps,
    maxHoldSeconds: structured.maxHoldSeconds,
    maxSetWeight: structured.maxSetWeight,
    isHold: Boolean(structured.isHold),
    metricValue: structured.isHold
      ? structured.maxHoldSeconds || 0
      : structured.maxSetWeight > 0
        ? structured.maxSetWeight
        : structured.maxSetReps || summary.totalReps
  };
}

/**
 * Exercices distincts présents dans la fenêtre (au moins 1 séance cochée).
 */
export function collectDistinctExercisesInWindow(workoutData, window, getExerciseNameById) {
  if (!workoutData) return [];

  const map = new Map();
  collectDedupedCheckedVolumeKeys(workoutData).forEach((key) => {
    const dateYmd = String(key).slice(0, 10);
    if (window?.end && !isDateInRecapWindow(dateYmd, window)) return;

    const summary = summarizeExerciseSession(workoutData, key);
    if (!summary) return;

    const exId = summary.exerciseId;
    const prev = map.get(exId) || {
      exerciseId: exId,
      sessionCount: 0,
      firstDate: dateYmd,
      lastDate: dateYmd,
      totalReps: 0
    };
    prev.sessionCount += 1;
    prev.totalReps += summary.totalReps;
    if (dateYmd < prev.firstDate) prev.firstDate = dateYmd;
    if (dateYmd > prev.lastDate) prev.lastDate = dateYmd;
    map.set(exId, prev);
  });

  return [...map.values()]
    .map((row) => ({
      ...row,
      name: resolveExerciseName(row.exerciseId, getExerciseNameById)
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

/**
 * Historique enrichi trié pour un exercice.
 */
export function collectEnrichedExerciseHistory(workoutData, exerciseId, window, getExerciseNameById) {
  const exId = String(exerciseId || '').trim();
  if (!exId || !workoutData) return [];

  return collectDedupedCheckedVolumeKeys(workoutData)
    .filter((key) => {
      if (exerciseIdFromStorageKey(key) !== exId) return false;
      if (window?.end) {
        const d = String(key).slice(0, 10);
        return isDateInRecapWindow(d, window);
      }
      return true;
    })
    .map((key) => enrichExerciseSessionDetail(workoutData, key, getExerciseNameById))
    .filter(Boolean)
    .sort((a, b) => a.dateYmd.localeCompare(b.dateYmd) || a.storageKey.localeCompare(b.storageKey));
}

/**
 * @typedef {'rising'|'stall'|'regression'|'single'|'insufficient'} ProgressionStatus
 */

/**
 * Analyse multi-séances avec interprétation coach.
 */
export function analyzeExerciseProgressionHistory(sessions) {
  if (!sessions?.length) {
    return { status: 'insufficient', headline: null, detail: null, bullets: [] };
  }

  if (sessions.length === 1) {
    const s = sessions[0];
    const label = s.schemeLabel || `${s.setCount} séries · ${s.totalReps} reps`;
    return {
      status: 'single',
      headline: 'Une seule séance sur la période',
      detail: `${label} le ${s.dateYmd}. Refaites l'exercice pour mesurer l'évolution.`,
      bullets: [],
      recentInsight: null,
      pr: null
    };
  }

  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  const recentInsight = interpretExerciseProgression(sessions[sessions.length - 2], last);

  const mid = Math.floor(sessions.length / 2);
  const firstHalf = sessions.slice(0, Math.max(1, mid));
  const secondHalf = sessions.slice(Math.max(1, mid));

  const volFirst = avgOf(firstHalf, (s) => s.volumeKgReps || s.totalReps);
  const volSecond = avgOf(secondHalf, (s) => s.volumeKgReps || s.totalReps);
  const volTrendPct = pctDelta(volFirst, volSecond);

  const repsFirst = avgOf(firstHalf, (s) => s.totalReps);
  const repsSecond = avgOf(secondHalf, (s) => s.totalReps);
  const repsTrendPct = pctDelta(repsFirst, repsSecond);

  const wSessions = sessions.filter((s) => (s.avgWeight || 0) > 0);
  const wFirst = avgOf(
    wSessions.filter((s) => firstHalf.includes(s)),
    (s) => s.avgWeight
  );
  const wSecond = avgOf(
    wSessions.filter((s) => secondHalf.includes(s)),
    (s) => s.avgWeight
  );
  const weightTrendPct = wFirst > 0 && wSecond > 0 ? pctDelta(wFirst, wSecond) : null;

  const isHold = sessions.some((s) => s.isHold);
  const metricKey = isHold ? 'maxHoldSeconds' : 'maxSetReps';
  const prVal = Math.max(...sessions.map((s) => (isHold ? s.maxHoldSeconds : s.maxSetReps || s.totalReps) || 0));
  const prSession = sessions.find(
    (s) => (isHold ? s.maxHoldSeconds : s.maxSetReps || s.totalReps) === prVal
  );

  const last3 = sessions.slice(-3);
  let stagnant = false;
  if (last3.length >= 3) {
    const vols = last3.map((s) => s.volumeKgReps || s.totalReps);
    const minV = Math.min(...vols);
    const maxV = Math.max(...vols);
    stagnant = minV > 0 && (maxV - minV) / minV <= 0.08;
  }

  const bullets = [];
  if (Math.abs(volTrendPct) >= 10) {
    bullets.push(
      volTrendPct > 0
        ? `Volume moyen en hausse de ${volTrendPct} % (1ère → 2ème moitié de période)`
        : `Volume moyen en baisse de ${Math.abs(volTrendPct)} % sur la période`
    );
  }
  if (weightTrendPct != null && Math.abs(weightTrendPct) >= 5) {
    bullets.push(
      weightTrendPct > 0
        ? `Charge moyenne +${weightTrendPct} % entre début et fin de période`
        : `Charge moyenne ${weightTrendPct} % — possible phase de décharge ou technique`
    );
  }
  if (Math.abs(repsTrendPct) >= 10 && !isHold) {
    bullets.push(
      repsTrendPct > 0
        ? `+${repsTrendPct} % de reps totales en moyenne`
        : `${repsTrendPct} % de reps totales en moyenne`
    );
  }

  let status = 'rising';
  let headline = null;
  let detail = null;

  if (recentInsight.progressionType === 'regression' && recentInsight.confidence >= 0.65) {
    status = 'regression';
    headline = 'Régression récente';
    detail = recentInsight.explanation;
  } else if (stagnant || recentInsight.progressionType === 'stall') {
    status = 'stall';
    headline = 'Plateau détecté';
    const scheme = classifyRepScheme(last.setCount, last.totalReps);
    detail = `Les ${Math.min(3, last3.length)} dernières séances sont stables${
      last.schemeLabel ? ` (${last.schemeLabel})` : ''
    }. Levier typique en schéma ${scheme} : +1 rep/série, +1 série ou +2,5 kg si chargé.`;
  } else if (
    recentInsight.progressionType === 'strength' ||
    recentInsight.progressionType === 'hypertrophy' ||
    recentInsight.progressionType === 'volume' ||
    volTrendPct >= 8
  ) {
    status = 'rising';
    headline = 'Progression en cours';
    detail =
      recentInsight.explanation && recentInsight.confidence >= 0.7
        ? recentInsight.explanation
        : `Tendance positive sur la période (${sessions.length} séances).`;
  } else {
    status = 'stall';
    headline = 'Évolution modérée';
    detail = 'Pas de rupture nette — poursuivez le suivi sur quelques séances de plus.';
  }

  if (prSession && prVal > 0) {
    const prLabel = isHold
      ? `${prVal >= 60 ? `${Math.floor(prVal / 60)} min ${prVal % 60 ? `${prVal % 60} s` : ''}`.trim() : `${prVal} s`}`
      : `${prVal} reps${prSession.schemeLabel ? ` (${prSession.schemeLabel})` : ''}`;
    bullets.unshift(`Record période : ${prLabel} le ${prSession.dateYmd}`);
  }

  const lastSetReps = (last.sets || []).map((s) => s.reps).filter((r) => r != null && r > 0);
  const prevSession = sessions.length >= 2 ? sessions[sessions.length - 2] : null;
  const prevSetReps = prevSession
    ? (prevSession.sets || []).map((s) => s.reps).filter((r) => r != null && r > 0)
    : [];
  if (lastSetReps.length >= 2 && !isHold) {
    const stub = lookupProgramExerciseStub(last.exerciseId);
    const prescription = getExercisePrescriptionStruct(stub);
    const plannedPerSet =
      prescription?.repsMax != null
        ? prescription.repsMax
        : prescription?.repsMin != null
          ? prescription.repsMin
          : undefined;
    const plannedTotal =
      prescription?.setCount && prescription?.repsMin != null
        ? prescription.setCount *
          (prescription.repsMin === prescription.repsMax
            ? prescription.repsMin
            : Math.round((prescription.repsMin + prescription.repsMax) / 2))
        : undefined;

    buildExerciseRepInsights({
      currentSetReps: lastSetReps,
      previousSetReps: prevSetReps.length >= 2 ? prevSetReps : undefined,
      plannedTotalReps: plannedTotal,
      plannedRepsPerSet: plannedPerSet
    }).forEach((line) => {
      if (line && !bullets.includes(line)) bullets.push(line);
    });
  }

  return {
    status,
    headline,
    detail,
    bullets,
    recentInsight,
    pr: prSession ? { value: prVal, dateYmd: prSession.dateYmd, isHold } : null,
    volTrendPct,
    repsTrendPct,
    weightTrendPct,
    sessionCount: sessions.length,
    dateRange: { start: first.dateYmd, end: last.dateYmd }
  };
}

/**
 * Séries pour graphique DenseDailyLineChart.
 */
export function buildExerciseChartSeries(sessions) {
  const reps = sessions.map((s) => ({
    date: s.dateYmd,
    value: s.isHold ? s.maxHoldSeconds || s.totalReps : s.totalReps
  }));
  const hasWeight = sessions.some((s) => (s.avgWeight || 0) > 0);
  const weight = hasWeight
    ? sessions.map((s) => ({ date: s.dateYmd, value: s.avgWeight || 0 }))
    : null;
  return { reps, weight, hasWeight, isHold: sessions.some((s) => s.isHold) };
}
