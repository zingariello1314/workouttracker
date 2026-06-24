/**
 * Notes d'entraînement / 100 pour le calendrier sport.
 * — Note musculation : reps × difficulté × charge (poids du corps vs haltères).
 * — Note globale : agrège muscu, endurance, Garmin, ressenti si saisi ; pas de malus sommeil/stress absent.
 */

import { exerciseUsesExternalLoad } from './programUtils';
import {
  aggregateCheckedRepsByDateAndExerciseId,
  resolveExerciseIntensityCoeff,
  computeStrengthCalendarContribution,
  computeExternalLoadMultiplier,
  computeMedianWeightKgForExercise,
  enduranceSessionCalendarLoad
} from './trainingLoadUtils';
import {
  computeVolumeKgReps,
  getExerciseVolumeFromLog,
  lookupProgramExerciseStub
} from './exerciseLoadVolume';
import { mergedDailySteps, normalizeManualDailyWalkByDate } from './sport/manualDailyWalkUtils';
import { isMockEnduranceSession, collectEnduranceSessionsForCalendarDay, parseDurationToMinutes } from './calendarUtils';
import { normalizeDifficultyForCalendarModel } from './sessionFeedbackUtils';
import { parseRunningSessionDurationMinutes } from './runningPersonalRecords';

const STRENGTH_REF_LOAD = 420;
const ENDURANCE_REF_LOAD = 95;
const GARMIN_REF_SCORE = 72;

function clampScore(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function loadToScore(load, ref) {
  if (!Number.isFinite(load) || load <= 0) return 0;
  const r = ref > 0 ? ref : STRENGTH_REF_LOAD;
  const ratio = load / r;
  if (ratio <= 0.15) return clampScore(ratio / 0.15 * 28);
  if (ratio <= 0.45) return clampScore(28 + ((ratio - 0.15) / 0.3) * 32);
  if (ratio <= 1) return clampScore(60 + ((ratio - 0.45) / 0.55) * 28);
  return clampScore(88 + Math.min(12, (ratio - 1) * 18));
}

function coeffToDifficultyScore(coeff) {
  const c = Math.max(0.05, Number(coeff) || 1);
  const logNorm = Math.log10(c / 0.08) / Math.log10(6 / 0.08);
  return clampScore(logNorm * 100);
}

function collectDayExerciseKeys(dateStr, workoutData) {
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    workoutData?.reps,
    workoutData?.checkedExercises
  );
  const keys = [];
  grouped.forEach(({ key }, gkey) => {
    if (gkey.startsWith(`${dateStr}::`) && key) keys.push(key);
  });
  return keys;
}

function resolveExerciseForKey(storageKey, workoutData, getExerciseNameById) {
  const rawId = String(storageKey).slice(11).replace(/_semaineA$|_semaineB$/, '');
  const stub = lookupProgramExerciseStub(rawId);
  const name =
    (typeof getExerciseNameById === 'function' ? getExerciseNameById(rawId) : null) ||
    stub.name ||
    'Exercice';
  return { ...stub, id: stub.id ?? rawId, name, nom: name };
}

function pickWeightFields(workoutData, keys) {
  const weightsStore = workoutData?.exerciseWeights || {};
  let single = '';
  let perArm = false;
  let setArr = null;
  for (const k of keys) {
    const v = weightsStore[k];
    if (v !== undefined && v !== null && String(v).trim() !== '') single = String(v);
    if (workoutData?.exerciseWeightPerArm?.[k]) perArm = true;
    const a = workoutData?.exerciseSetWeights?.[k];
    if (Array.isArray(a) && a.some((x) => String(x ?? '').trim() !== '')) setArr = a;
  }
  return { single, perArm, setArr };
}

/**
 * Charge musculation intelligente pour un jour (poids du corps vs charge externe).
 * @returns {{ totalLoad: number, volumeKg: number, exerciseCount: number, bodyweightLoad: number, weightedLoad: number }}
 */
export function computeDayStrengthWeightedLoad(
  dateStr,
  workoutData,
  getExerciseNameById
) {
  const keys = collectDayExerciseKeys(dateStr, workoutData);
  const coeffs = workoutData?.exerciseIntensityCoeffs || {};
  const weightsStore = workoutData?.exerciseWeights || {};

  let totalLoad = 0;
  let volumeKg = 0;
  let bodyweightLoad = 0;
  let weightedLoad = 0;
  let weightedCoeffSum = 0;
  let weightedCoeffReps = 0;
  let structuredSets = 0;
  let loadExercises = 0;
  let structureAppropriate = 0;

  keys.forEach((storageKey) => {
    const exercise = resolveExerciseForKey(storageKey, workoutData, getExerciseNameById);
    const reps = parseInt(String(workoutData?.reps?.[storageKey] ?? ''), 10) || 0;
    if (reps <= 0) return;

    const coeff = resolveExerciseIntensityCoeff(exercise, coeffs);
    const usesLoad = exerciseUsesExternalLoad(exercise);
    const volFromLog = getExerciseVolumeFromLog(workoutData, storageKey);
    let vol = volFromLog.volumeKgReps;
    if (vol <= 0) {
      const { single, perArm, setArr } = pickWeightFields(workoutData, [storageKey]);
      vol = computeVolumeKgReps({
        exercise,
        totalReps: reps,
        singleWeightStr: single,
        perArm,
        setWeightStrs: setArr
      });
    }
    volumeKg += vol;

    const medianKg = computeMedianWeightKgForExercise(weightsStore, exercise.id);
    const wKg = reps > 0 && vol > 0 ? vol / reps : 0;
    const wMult = computeExternalLoadMultiplier(usesLoad, wKg, medianKg);

    const bwContrib = computeStrengthCalendarContribution(exercise, reps, coeff, 1);
    const fullContrib = computeStrengthCalendarContribution(exercise, reps, coeff, wMult);

    if (usesLoad && vol > 0) {
      weightedLoad += fullContrib;
      totalLoad += fullContrib;
    } else {
      bodyweightLoad += bwContrib;
      totalLoad += bwContrib;
    }

    weightedCoeffSum += coeff * reps;
    weightedCoeffReps += reps;

    if (volFromLog.source === 'structured' && volFromLog.sets?.length > 0) {
      structuredSets += volFromLog.sets.length;
    }

    if (usesLoad) {
      loadExercises += 1;
      if (volFromLog.source === 'structured' && volFromLog.sets?.length > 0) {
        const weightedSets = volFromLog.sets.filter(
          (s) => s.weight != null && Number(s.weight) > 0
        ).length;
        structureAppropriate += weightedSets > 0 ? 1 : 0.65;
      } else {
        const { single, setArr } = pickWeightFields(workoutData, [storageKey]);
        const hasWeight =
          (single && String(single).trim() !== '') ||
          (Array.isArray(setArr) && setArr.some((x) => String(x ?? '').trim() !== ''));
        structureAppropriate += hasWeight ? 0.9 : 0.6;
      }
    } else {
      structureAppropriate += volFromLog.source === 'structured' ? 1 : 0.92;
    }
  });

  return {
    totalLoad,
    volumeKg,
    exerciseCount: keys.length,
    bodyweightLoad,
    weightedLoad,
    avgCoeff: weightedCoeffReps > 0 ? weightedCoeffSum / weightedCoeffReps : 0,
    structuredSets,
    loadExercises,
    structureAppropriate
  };
}

/**
 * @param {string} dateStr
 * @param {object} workoutData
 * @param {Function} [getExerciseNameById]
 * @param {{ p90Load?: number }} [refs]
 */
export function computeCalendarDayStrengthScore(
  dateStr,
  workoutData,
  getExerciseNameById,
  refs = {}
) {
  const metrics = computeDayStrengthWeightedLoad(dateStr, workoutData, getExerciseNameById);
  if (metrics.exerciseCount === 0 || metrics.totalLoad <= 0) {
    return {
      score: null,
      totalLoad: 0,
      criteria: [],
      metrics
    };
  }

  const refLoad = refs.p90Load > 0 ? refs.p90Load : STRENGTH_REF_LOAD;

  const difficultyScore = coeffToDifficultyScore(metrics.avgCoeff);
  const repsScore = loadToScore(metrics.bodyweightLoad + metrics.weightedLoad * 0.92, refLoad);
  const volumeKgScore =
    metrics.volumeKg > 0
      ? loadToScore(metrics.volumeKg / 4.2, refLoad * 0.55)
      : loadToScore(metrics.bodyweightLoad, refLoad * 0.85);
  const crossoverScore = clampScore(
    metrics.volumeKg > 0 && metrics.bodyweightLoad > 0
      ? Math.max(volumeKgScore, repsScore)
      : metrics.volumeKg > 0
        ? volumeKgScore
        : repsScore
  );
  const varietyScore = clampScore(Math.min(100, 22 + metrics.exerciseCount * 14));
  const structureRatio =
    metrics.exerciseCount > 0 ? metrics.structureAppropriate / metrics.exerciseCount : 0;
  const structureScore = clampScore(
    metrics.exerciseCount === 0
      ? 0
      : structureRatio >= 0.98
        ? 96
        : structureRatio >= 0.85
          ? 78 + (structureRatio - 0.85) * 120
          : structureRatio >= 0.65
            ? 58 + (structureRatio - 0.65) * 100
            : 38 + structureRatio * 32
  );
  const structureDetail =
    metrics.loadExercises > 0
      ? `${metrics.exerciseCount} exo. · ${metrics.loadExercises} avec charge possible : ${
          metrics.structuredSets > 0
            ? `${metrics.structuredSets} série(s) détaillée(s)`
            : 'reps enregistrées (poids optionnel si applicable)'
        }.`
      : `${metrics.exerciseCount} exo. au poids du corps — saisie complète si reps cochées${
          metrics.structuredSets > 0 ? ` · ${metrics.structuredSets} série(s) détaillée(s)` : ''
        }.`;

  const criteria = [
    {
      id: 'difficulty',
      label: 'Difficulté des exercices',
      score: difficultyScore,
      detail: `Coeff. moyen pondéré : ${metrics.avgCoeff.toFixed(2)} (tractions / dips / pompes vs curls).`
    },
    {
      id: 'reps',
      label: 'Volume de répétitions',
      score: repsScore,
      detail: `${Math.round(metrics.bodyweightLoad + metrics.weightedLoad)} pts de charge estimée (reps × difficulté).`
    },
    {
      id: 'load',
      label: 'Charge (kg ou équivalent)',
      score: crossoverScore,
      detail:
        metrics.volumeKg > 0
          ? `${Math.round(metrics.volumeKg)} kg soulevés${metrics.bodyweightLoad > 0 ? ` · équivalent poids du corps : ${Math.round(metrics.bodyweightLoad)} pts` : ''}.`
          : `Séance au poids du corps — équivalent ${Math.round(metrics.bodyweightLoad)} pts (difficulté × reps).`
    },
    {
      id: 'variety',
      label: 'Variété',
      score: varietyScore,
      detail: `${metrics.exerciseCount} exercice(s) enregistré(s) ce jour.`
    },
    {
      id: 'structure',
      label: 'Précision de saisie',
      score: structureScore,
      detail: structureDetail
    }
  ];

  const score = clampScore(
    difficultyScore * 0.28 +
      crossoverScore * 0.32 +
      repsScore * 0.18 +
      varietyScore * 0.12 +
      structureScore * 0.1
  );

  return { score, totalLoad: metrics.totalLoad, criteria, metrics };
}

function runningMetricsForDate(dateStr, workoutData) {
  const { rows, runningDistanceKm } = collectEnduranceSessionsForCalendarDay(
    workoutData,
    dateStr
  );
  let minutes = 0;
  rows
    .filter((r) => r.activityType === 'running')
    .forEach(({ session }) => {
      const m =
        parseRunningSessionDurationMinutes(session?.duration) ||
        parseDurationToMinutes(session?.duration, 'holistic.running');
      if (m > 0) minutes += m;
    });

  const km = runningDistanceKm > 0 ? runningDistanceKm : 0;
  if (km <= 0 && minutes <= 0) return null;

  const kmScore = clampScore(Math.min(92, (km / 10) * 72));
  const minScore = clampScore(Math.min(88, (minutes / 50) * 68));
  const score = clampScore(km > 0 && minutes > 0 ? kmScore * 0.55 + minScore * 0.45 : km > 0 ? kmScore : minScore);

  return { score, km, minutes };
}

function enduranceLoadForDate(dateStr, workoutData) {
  let load = 0;
  const sessions = workoutData?.enduranceData?.sessions || {};
  Object.entries(sessions).forEach(([activityType, arr]) => {
    if (!Array.isArray(arr)) return;
    arr.forEach((session) => {
      if (isMockEnduranceSession(session)) return;
      let ds = session?.date;
      if (typeof ds === 'string' && ds.includes('T')) ds = ds.split('T')[0];
      if (ds !== dateStr) return;
      load += enduranceSessionCalendarLoad(activityType, session);
    });
  });
  return load;
}

function garminActivityScore(dateStr, garminData, workoutData) {
  const dm = garminData?.dailyMetrics?.[dateStr];
  if (!dm) return { score: null, parts: [] };

  const manual = normalizeManualDailyWalkByDate(workoutData?.enduranceData?.manualDailyWalkByDate);
  const steps = mergedDailySteps(dm?.steps, manual[dateStr]);
  const kcal =
    dm?.calories?.active != null
      ? Number(dm.calories.active) || 0
      : Number(dm.activeKilocalories ?? dm.activeKcal) || 0;

  let intMin = 0;
  const im = dm.intensityMinutes;
  if (im) {
    const mod = Math.max(0, Number(im.moderate) || 0);
    const vig = Math.max(0, Number(im.vigorous) || 0);
    intMin = mod + vig * 2 || Number(im.total) || 0;
  }

  const stepsS = steps > 0 ? clampScore((steps / 14000) * 55) : 0;
  const kcalS = kcal > 0 ? clampScore((kcal / 900) * 50) : 0;
  const intS = intMin > 0 ? clampScore((intMin / 75) * 45) : 0;

  const parts = [];
  if (stepsS > 0) parts.push({ label: 'Pas', score: stepsS, detail: `${steps.toLocaleString('fr-FR')} pas` });
  if (kcalS > 0) parts.push({ label: 'Kcal actives', score: kcalS, detail: `${Math.round(kcal)} kcal` });
  if (intS > 0) {
    parts.push({ label: 'Minutes intensives', score: intS, detail: `${Math.round(intMin)} min (modéré + soutenu)` });
  }

  if (parts.length === 0) return { score: null, parts: [] };

  const score = clampScore(parts.reduce((s, p) => s + p.score, 0) / parts.length);
  return { score, parts };
}

function sessionFeedbackScore(workoutData, dateStr) {
  const fb = workoutData?.sessionFeedbacks?.[dateStr];
  if (!fb) return null;
  const diff = normalizeDifficultyForCalendarModel(fb);
  if (diff == null) return null;
  return clampScore(35 + ((diff - 1) / 4) * 65);
}

function sleepBonusScore(garminData, dateStr) {
  const sleep = garminData?.dailyMetrics?.[dateStr]?.sleep;
  if (!sleep || typeof sleep !== 'object') return null;
  const duration = Number(sleep.duration);
  if (!Number.isFinite(duration) || duration <= 0) return null;
  const hours = duration > 200 ? duration / 3600 : duration > 24 ? duration / 60 : duration;
  if (hours < 4 || hours > 12) return null;
  if (hours >= 7 && hours <= 9) return 8;
  if (hours >= 6) return 5;
  return 2;
}

/**
 * Note globale : plus de paramètres saisis = mieux récompensé ; pas de malus si sommeil/stress absents.
 */
export function computeCalendarDayHolisticScore({
  dateStr,
  workoutData,
  garminData,
  getExerciseNameById,
  strengthRefs = {}
}) {
  const strength = computeCalendarDayStrengthScore(
    dateStr,
    workoutData,
    getExerciseNameById,
    strengthRefs
  );
  const running = runningMetricsForDate(dateStr, workoutData);
  const enduranceLoad = enduranceLoadForDate(dateStr, workoutData);
  const enduranceScore =
    running?.score ??
    (enduranceLoad > 0 ? loadToScore(enduranceLoad, ENDURANCE_REF_LOAD) : null);
  const garmin = garminActivityScore(dateStr, garminData, workoutData);
  const feedbackScore = sessionFeedbackScore(workoutData, dateStr);
  const sleepBonus = sleepBonusScore(garminData, dateStr);

  const criteria = [];

  if (strength.score != null) {
    criteria.push({
      id: 'strength',
      label: 'Musculation / street',
      score: strength.score,
      detail: `Charge pondérée : ${Math.round(strength.totalLoad)} pts · ${strength.metrics.exerciseCount} exo.`
    });
  }

  if (running) {
    criteria.push({
      id: 'running',
      label: 'Course',
      score: running.score,
      detail: `${running.km > 0 ? `${running.km} km` : '—'} · ${
        running.minutes > 0 ? `${Math.round(running.minutes)} min` : '—'
      } — pris en compte même si vous courez un jour sur deux.`
    });
  } else if (enduranceScore != null) {
    criteria.push({
      id: 'endurance',
      label: 'Endurance saisie',
      score: enduranceScore,
      detail: `Charge endurance estimée : ${Math.round(enduranceLoad)} pts.`
    });
  }

  if (garmin.score != null) {
    criteria.push({
      id: 'garmin',
      label: 'Activité Garmin / pas',
      score: garmin.score,
      detail: garmin.parts.map((p) => `${p.label} ${p.score}/100`).join(' · ')
    });
  }

  if (feedbackScore != null) {
    criteria.push({
      id: 'feedback',
      label: 'Ressenti séance',
      score: feedbackScore,
      detail: 'Basé sur votre évaluation de difficulté (si renseignée).'
    });
  }

  if (sleepBonus != null) {
    criteria.push({
      id: 'sleep',
      label: 'Sommeil (bonus)',
      score: clampScore(sleepBonus * 12.5),
      detail: 'Bonus optionnel si sommeil Garmin présent — aucun malus si absent.'
    });
  }

  const loggedDimensions = [
    strength.score != null,
    running != null || enduranceScore != null,
    garmin.score != null,
    feedbackScore != null,
    sleepBonus != null
  ].filter(Boolean).length;

  if (loggedDimensions === 0) {
    return { score: null, criteria: [], completenessBonus: 0, loggedDimensions: 0 };
  }

  const weights = { strength: 0.34, running: 0.24, endurance: 0.14, garmin: 0.18, feedback: 0.07, sleep: 0.03 };
  let sum = 0;
  let wSum = 0;
  if (strength.score != null) {
    sum += strength.score * weights.strength;
    wSum += weights.strength;
  }
  if (running) {
    sum += running.score * weights.running;
    wSum += weights.running;
  } else if (enduranceScore != null) {
    sum += enduranceScore * weights.endurance;
    wSum += weights.endurance;
  }
  if (garmin.score != null) {
    sum += garmin.score * weights.garmin;
    wSum += weights.garmin;
  }
  if (feedbackScore != null) {
    sum += feedbackScore * weights.feedback;
    wSum += weights.feedback;
  }
  if (sleepBonus != null) {
    sum += clampScore(sleepBonus * 12.5) * weights.sleep;
    wSum += weights.sleep;
  }

  const base = wSum > 0 ? sum / wSum : 0;
  const completenessBonus = clampScore(Math.min(8, (loggedDimensions - 1) * 2.5));
  const score = clampScore(base + completenessBonus * 0.35);

  criteria.push({
    id: 'completeness',
    label: 'Complétude du jour',
    score: clampScore(40 + loggedDimensions * 12),
    detail: `${loggedDimensions} type(s) de données enregistrées — plus vous complétez, mieux la note reflète votre journée (sans pénaliser l'absence de sommeil/stress).`
  });

  return {
    score,
    criteria,
    completenessBonus,
    loggedDimensions,
    strength,
    enduranceScore,
    garmin,
    feedbackScore
  };
}

/** Référence annuelle (p90 charge muscu) pour normaliser les scores. */
export function buildYearStrengthLoadReference(workoutData, getExerciseNameById, year) {
  const prefix = `${year}-`;
  const loads = [];
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    workoutData?.reps,
    workoutData?.checkedExercises
  );
  const dates = new Set();
  grouped.forEach((_, gkey) => {
    const dateStr = gkey.slice(0, 10);
    if (dateStr.startsWith(prefix)) dates.add(dateStr);
  });

  dates.forEach((dateStr) => {
    const m = computeDayStrengthWeightedLoad(dateStr, workoutData, getExerciseNameById);
    if (m.totalLoad > 0) loads.push(m.totalLoad);
  });

  loads.sort((a, b) => a - b);
  if (loads.length === 0) return { p90Load: STRENGTH_REF_LOAD, maxLoad: 0 };
  const p90Idx = Math.min(loads.length - 1, Math.floor(loads.length * 0.9));
  return {
    p90Load: Math.max(STRENGTH_REF_LOAD * 0.55, loads[p90Idx]),
    maxLoad: loads[loads.length - 1]
  };
}
