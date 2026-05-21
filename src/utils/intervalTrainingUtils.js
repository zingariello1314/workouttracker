/**
 * Fractionné structuré : config programme, lecture Garmin, XP performance.
 */

import { classifyLapPhase, isGarminRunningLikeActivity } from './garminRunningLaps';
import { computeBestWeightedIntervalSession } from './runningCalendarSpecialRecords';

export const FRACTIONNE_BANK_KEYS = {
  CUSTOM: 'fractionné',
  SHORT_30_30: 'fractionné 30/30',
  LONG_VMA: 'fractionné long VMA'
};

const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

export function isFractionneBankKey(key) {
  const k = String(key || '').toLowerCase();
  return k.includes('fractionn');
}

export function intervalPresetFromBankKey(key) {
  const k = String(key || '').toLowerCase();
  if (k.includes('30/30') || k.includes('30 30')) {
    return { preset: '30_30', activeMin: 0.5, recoveryMin: 0.5, rounds: 20 };
  }
  if (k.includes('long vma') || k.includes('long')) {
    return { preset: 'long_vma', activeMin: 3, recoveryMin: 2, rounds: 5 };
  }
  return { preset: 'custom', activeMin: 1, recoveryMin: 1, rounds: 8 };
}

export function normalizeIntervalConfig(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const activeMin = Number(raw.activeMin);
  const recoveryMin = Number(raw.recoveryMin);
  const rounds = Math.round(Number(raw.rounds));
  if (!Number.isFinite(activeMin) || activeMin <= 0) return null;
  if (!Number.isFinite(recoveryMin) || recoveryMin < 0) return null;
  if (!Number.isFinite(rounds) || rounds < 1) return null;
  return {
    preset: raw.preset || 'custom',
    activeMin,
    recoveryMin,
    rounds: Math.min(99, Math.max(1, rounds))
  };
}

export function formatIntervalMinutes(min) {
  const m = Number(min);
  if (!Number.isFinite(m) || m <= 0) return '0 min';
  if (m < 1) return `${Math.round(m * 60)} s`;
  if (Number.isInteger(m)) return `${m} min`;
  const whole = Math.floor(m);
  const sec = Math.round((m - whole) * 60);
  return sec > 0 ? `${whole} min ${sec} s` : `${m} min`;
}

export function buildIntervalSeriesLabel(config) {
  const c = normalizeIntervalConfig(config);
  if (!c) return '';
  return `${c.rounds}×(${formatIntervalMinutes(c.activeMin)} effort / ${formatIntervalMinutes(c.recoveryMin)} récup)`;
}

function dayNameFromDateStr(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return DAY_NAMES[d.getDay()];
}

export function findProgramExerciseForCheckedKey(programs, activeProgram, dateStr, exerciseId) {
  const dayName = dayNameFromDateStr(dateStr);
  if (!dayName) return null;
  const progs = [];
  if (activeProgram?.schedule) progs.push(activeProgram);
  if (Array.isArray(programs)) progs.push(...programs);

  for (const prog of progs) {
    const day = prog?.schedule?.[dayName];
    if (!day) continue;
    const lists = [
      day.exercises,
      day.salleVariants?.semaineA?.exercises,
      day.salleVariants?.semaineB?.exercises
    ].filter(Array.isArray);
    for (const list of lists) {
      const ex = list.find((e) => String(e?.id) === String(exerciseId));
      if (ex) return ex;
    }
  }
  return null;
}

function lapPhaseBucket(lap) {
  const p = classifyLapPhase(lap);
  if (p === 'recovery' || p === 'cooldown') return 'recovery';
  if (p === 'effort' || p === 'other') return 'effort';
  return 'skip';
}

function lapDurationSeconds(lap) {
  const n = Number(lap?.durationSeconds);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function lapDistanceKm(lap) {
  const dk = Number(lap?.distanceKm);
  if (Number.isFinite(dk) && dk > 0) return dk;
  const m = Number(lap?.distanceMeters);
  return Number.isFinite(m) && m > 0 ? m / 1000 : 0;
}

/** Analyse les tours Garmin vs le plan (durées effort / récup, nombre de tours). */
export function analyzeGarminIntervalVsPlan(garminActivity, plan) {
  const config = normalizeIntervalConfig(plan);
  if (!config || !garminActivity) {
    return { ok: false, score: 0, effortLaps: 0, matchRatio: 0 };
  }

  const laps = garminActivity?.running?.laps;
  if (!Array.isArray(laps) || laps.length < 2) {
    return { ok: false, score: 0, effortLaps: 0, matchRatio: 0, reason: 'no_laps' };
  }

  const targetEffortSec = config.activeMin * 60;
  const targetRecSec = config.recoveryMin * 60;
  const tol = 0.35;

  let effortLaps = 0;
  let recoveryLaps = 0;
  let matchedEffort = 0;
  let matchedRecovery = 0;
  let effSec = 0;
  let effKm = 0;
  let recSec = 0;
  let recKm = 0;

  for (const lap of laps) {
    const bucket = lapPhaseBucket(lap);
    const ds = lapDurationSeconds(lap);
    const dk = lapDistanceKm(lap);
    if (ds <= 0) continue;

    if (bucket === 'effort') {
      effortLaps += 1;
      effSec += ds;
      effKm += dk;
      if (Math.abs(ds - targetEffortSec) <= targetEffortSec * tol + 15) matchedEffort += 1;
    } else if (bucket === 'recovery') {
      recoveryLaps += 1;
      recSec += ds;
      recKm += dk;
      if (targetRecSec <= 0 || Math.abs(ds - targetRecSec) <= targetRecSec * tol + 20) {
        matchedRecovery += 1;
      }
    }
  }

  const roundsMatch = effortLaps >= Math.max(1, config.rounds - 1);
  const structureMatch =
    effortLaps >= 1 &&
    (config.recoveryMin <= 0 || recoveryLaps >= 1) &&
    matchedEffort >= Math.min(config.rounds, effortLaps) * 0.5;

  const matchRatio = roundsMatch && structureMatch
    ? Math.min(1, (matchedEffort + matchedRecovery) / Math.max(1, config.rounds * 2))
    : effortLaps >= 1
      ? 0.35
      : 0;

  let performanceScore = 0;
  if (effKm >= 0.08 && effSec > 0) {
    const paceEffSecPerKm = effSec / effKm;
    const speedEff = paceEffSecPerKm > 0 ? 3600 / paceEffSecPerKm : 0;
    let speedRec = 0;
    if (recSec > 0 && recKm >= 0.05) {
      const paceRec = recSec / recKm;
      if (paceRec > 0) speedRec = 3600 / paceRec;
    }
    performanceScore = (speedEff + 0.38 * speedRec) * Math.pow(1 + effortLaps, 0.42);
  }

  return {
    ok: roundsMatch && effortLaps >= 1,
    score: performanceScore,
    effortLaps,
    recoveryLaps,
    matchedEffort,
    matchedRecovery,
    matchRatio,
    speedEffortKmh: effKm > 0 ? (effKm / effSec) * 3600 : 0
  };
}

export function findGarminRunningActivitiesOnDate(garminData, dateStr) {
  const cardio = garminData?.activities?.cardio;
  if (!Array.isArray(cardio) || !dateStr) return [];
  return cardio.filter((act) => {
    if (!isGarminRunningLikeActivity(act)) return false;
    const d =
      act.date ||
      (typeof act.startTime === 'string' ? act.startTime.slice(0, 10) : null) ||
      (typeof act.startDate === 'string' ? act.startDate.slice(0, 10) : null);
    return d === dateStr;
  });
}

function garminToPseudoSession(gAct, dateStr) {
  return {
    id: gAct.id || gAct.garminId,
    date: dateStr,
    type: 'interval',
    garminId: gAct.id || gAct.garminId
  };
}

/** Meilleur score historique fractionné Garmin avant une date (exclue). */
export function bestHistoricalIntervalScoreBefore(garminData, beforeDateStr) {
  const cardio = garminData?.activities?.cardio;
  if (!Array.isArray(cardio)) return 0;

  const garminById = new Map();
  const sessions = [];

  for (const act of cardio) {
    if (!isGarminRunningLikeActivity(act)) continue;
    const dateStr =
      act.date ||
      (typeof act.startTime === 'string' ? act.startTime.slice(0, 10) : '') ||
      (typeof act.startDate === 'string' ? act.startDate.slice(0, 10) : '');
    if (!dateStr || (beforeDateStr && dateStr >= beforeDateStr)) continue;
    const id = String(act.id || act.garminId || `${dateStr}_${sessions.length}`);
    garminById.set(id, act);
    sessions.push(garminToPseudoSession(act, dateStr));
  }

  const best = computeBestWeightedIntervalSession(sessions, garminById);
  return best?.score > 0 ? best.score : 0;
}

/**
 * XP fractionné : plan coché + Garmin du jour + comparaison historique.
 */
export function computeIntervalTrainingXpForSession({
  plan,
  garminActivity,
  garminData,
  dateStr
}) {
  const config = normalizeIntervalConfig(plan);
  if (!config) return { xp: 0, detail: null };

  const analysis = analyzeGarminIntervalVsPlan(garminActivity, config);
  const historicalBest = bestHistoricalIntervalScoreBefore(garminData, dateStr);

  const baseXp = 40 + config.rounds * 8;
  let xp = 0;

  if (!garminActivity) {
    xp = Math.round(baseXp * 0.2);
    return {
      xp,
      detail: { ...analysis, historicalBest, tier: 'no_garmin', relative: 0 }
    };
  }

  if (!analysis.ok) {
    xp = Math.round(baseXp * (0.25 + analysis.matchRatio * 0.35));
    return {
      xp,
      detail: { ...analysis, historicalBest, tier: 'partial', relative: 0 }
    };
  }

  const perfFactor = Math.min(1.8, 0.75 + analysis.score / 45);
  let relativeFactor = 1;
  if (historicalBest > 0 && analysis.score > 0) {
    const ratio = analysis.score / historicalBest;
    if (ratio >= 1.02) relativeFactor = 1.45;
    else if (ratio >= 0.95) relativeFactor = 1.2;
    else if (ratio >= 0.85) relativeFactor = 1;
    else relativeFactor = 0.75;
  } else if (analysis.score > 0) {
    relativeFactor = 1.1;
  }

  xp = Math.round(baseXp * analysis.matchRatio * perfFactor * relativeFactor);
  xp = Math.max(15, Math.min(450, xp));

  return {
    xp,
    detail: {
      ...analysis,
      historicalBest,
      relative: historicalBest > 0 ? analysis.score / historicalBest : null,
      tier: relativeFactor >= 1.2 ? 'pr' : 'ok'
    }
  };
}

export function collectFractionneIntervalXp(workoutData, garminData, sportOptions = {}) {
  const checked = workoutData?.checkedExercises || {};
  const programs = Array.isArray(sportOptions?.programs) ? sportOptions.programs : [];
  const activeProgram = sportOptions?.activeProgram || null;

  let totalXp = 0;
  let sessions = 0;
  const byDate = {};

  for (const [key, value] of Object.entries(checked)) {
    if (value !== true) continue;
    const m = String(key).match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
    if (!m) continue;
    const dateStr = m[1];
    const exerciseId = m[2].replace(/_semaineA$|_semaineB$/, '');

    const progEx = findProgramExerciseForCheckedKey(programs, activeProgram, dateStr, exerciseId);
    const config =
      normalizeIntervalConfig(progEx?.meta?.intervalConfig) ||
      (progEx?.programSubType === 'running_interval' && progEx?.meta?.intervalPreset
        ? intervalPresetFromBankKey(progEx.meta.intervalPreset)
        : null);

    if (!config && progEx?.programSubType !== 'running_interval') continue;
    if (!config) continue;

    const activities = findGarminRunningActivitiesOnDate(garminData, dateStr);
    let bestAct = activities[0] || null;
    let bestAnalysis = analyzeGarminIntervalVsPlan(bestAct, config);
    for (const act of activities.slice(1)) {
      const a = analyzeGarminIntervalVsPlan(act, config);
      if (a.score > bestAnalysis.score) {
        bestAnalysis = a;
        bestAct = act;
      }
    }

    const { xp, detail } = computeIntervalTrainingXpForSession({
      plan: config,
      garminActivity: bestAct,
      garminData,
      dateStr
    });

    if (xp > 0) {
      totalXp += xp;
      sessions += 1;
      byDate[dateStr] = { xp, detail, exerciseName: progEx?.name || 'Fractionné' };
    }
  }

  return { totalXp, sessions, byDate };
}
