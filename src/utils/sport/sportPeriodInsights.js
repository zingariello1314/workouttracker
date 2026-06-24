import { normalizeDateString, parseDurationToMinutes } from '../calendarUtils';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import {
  isGarminWalkingLikeActivity,
  isGarminRunningLikeActivity,
  shouldExcludeStoredGarminRunningSession
} from '../garminRunningLaps';
import { isWalkingLikeRunningSession } from '../runningSessionMovementKind';
import { aggregateCheckedRepsByDateAndExerciseId } from '../trainingLoadUtils';
import { buildAllTimeWalkingFromSteps } from './walkingFromSteps';
import {
  resolveSessionCalendarDate,
  readGarminActivityDateOverrides
} from '../sessionCalendarDate';

function activityDateKey(act) {
  const raw = act?.date || act?.startTimeLocal || act?.startTimeGmt;
  return normalizeDateString(raw) || null;
}

function distanceKmFromActivity(act) {
  const rawDistance =
    act?.distance?.total ??
    act?.distance?.value ??
    act?.distance ??
    act?.summaryDTO?.distance ??
    act?.summary?.distance ??
    act?.metrics?.distance;
  const d = parsePositiveNumberLoose(rawDistance);
  if (Number.isFinite(d) && d > 0) {
    if (d > 400 && d < 200000) return d / 1000;
    return d;
  }
  const m = parsePositiveNumberLoose(
    act?.distanceMeters ??
    act?.running?.distanceMeters ??
    act?.summaryDTO?.distanceMeters ??
    act?.summary?.distanceMeters ??
    act?.metrics?.distanceMeters
  );
  if (Number.isFinite(m) && m > 0) return m / 1000;
  return 0;
}

function parsePositiveNumberLoose(value) {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : 0;
  const txt = String(value).trim().replace(',', '.');
  if (!txt) return 0;
  const match = txt.match(/-?\d+(\.\d+)?/);
  if (!match) return 0;
  const n = Number(match[0]);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseDistanceKmFromRunningSession(session) {
  const km = parsePositiveNumberLoose(session?.distance);
  if (km > 0) return km;
  const meters = parsePositiveNumberLoose(session?.distanceMeters ?? session?.running?.distanceMeters);
  if (meters > 0) return meters / 1000;
  return 0;
}

function jumpRopeMinutesFromSession(s) {
  const raw = s?.duration ?? s?.totalTime ?? s?.movingDuration;
  return parseDurationToMinutes(raw, 'sportPeriodInsights.jumpRope');
}

function normalizedSessionDate(s, workoutAggregate = null) {
  const overrides = readGarminActivityDateOverrides(workoutAggregate);
  const logical = resolveSessionCalendarDate(s, overrides);
  if (logical) return logical;
  return normalizeDateString(s?.date || s?.startTimeLocal || s?.startTimeGmt || s?.startTime);
}

function runningSessionIdentityKey(s, workoutAggregate = null) {
  if (s?.garminId != null && s.garminId !== '') return `garmin:${s.garminId}`;
  if (s?.id != null && s.id !== '') return `id:${s.id}`;
  const ds = normalizedSessionDate(s, workoutAggregate);
  const dist = parseDistanceKmFromRunningSession(s).toFixed(3);
  const dur = parseDurationToMinutes(s?.duration ?? s?.movingDuration ?? s?.totalTime, 'sportPeriodInsights.running');
  return `d:${ds}:dist:${dist}:dur:${dur}:type:${String(s?.type || '').toLowerCase()}`;
}

function uniqueSessionsByIdOrSignature(list, workoutAggregate = null) {
  const seen = new Set();
  const out = [];
  (Array.isArray(list) ? list : []).forEach((s) => {
    const ds = normalizedSessionDate(s, workoutAggregate);
    const dur = parseDurationToMinutes(s?.duration ?? s?.totalTime ?? s?.movingDuration, 'sportPeriodInsights.unique');
    const key =
      s?.id != null && s.id !== ''
        ? `id:${s.id}`
        : `d:${ds}:dur:${dur}:type:${s?.activityType || s?.type || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(s);
  });
  return out;
}

function getGarminLikeId(act) {
  if (!act) return null;
  const id = act.garminId ?? act.activityId ?? act.id;
  if (id == null || id === '') return null;
  return String(id);
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

function to05Scale(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n <= 5) return n;
  if (n <= 10) return n / 2;
  return 5;
}

function runningTypeDifficulty(type) {
  const t = String(type || '').toLowerCase();
  if (!t) return 2.5;
  if (t === 'interval' || t === 'sprint' || t === 'threshold' || t === 'tempo') return 4.5;
  if (t === 'fartlek') return 4.1;
  if (t === 'long_run') return 3.8;
  if (t === 'endurance' || t === 'easy') return 2.8;
  if (t.includes('walk') || t.includes('marche') || t.includes('hike')) return 2.0;
  return 3.0;
}

function sessionSelfRatedDifficulty05(session) {
  const candidates = [
    session?.difficulty,
    session?.difficulte,
    session?.effort,
    session?.rpe,
    session?.RPE,
    session?.sentimentApres,
    session?.transpiration
  ];
  for (const v of candidates) {
    const n = to05Scale(v);
    if (n > 0) return n;
  }
  return 0;
}

function feedbackDifficulty05(feedback) {
  const n = to05Scale(feedback?.difficulte);
  return n > 0 ? n : 3.0;
}

export function summarizeStrengthLoadInWindow(snapshot = {}, win) {
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};
  const grouped = aggregateCheckedRepsByDateAndExerciseId(reps, checked);
  const activeDays = new Set();
  let totalReps = 0;

  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    if (sep <= 0) return;
    const ds = gkey.slice(0, sep);
    if (!ds || !isDateInRecapWindow(ds, win)) return;
    const repsInt = Math.max(0, Math.floor(Number(r) || 0));
    if (repsInt <= 0) return;
    activeDays.add(ds);
    totalReps += repsInt;
  });

  const pushups = [
    ...(Array.isArray(snapshot?.enduranceData?.sessions?.pushups) ? snapshot.enduranceData.sessions.pushups : []),
    ...(Array.isArray(snapshot?.enduranceData?.pushupSessions) ? snapshot.enduranceData.pushupSessions : [])
  ];
  pushups.forEach((s) => {
    const ds = normalizeDateString(s?.date || s?.startTimeLocal);
    if (!ds || !isDateInRecapWindow(ds, win)) return;
    const count = Math.max(0, Math.floor(Number(s?.count ?? s?.reps ?? 0) || 0));
    if (count <= 0) return;
    activeDays.add(ds);
    totalReps += count;
  });

  const sessionFeedbacks = snapshot?.sessionFeedbacks || {};
  let diffSum = 0;
  let diffCount = 0;
  let durationMin = 0;
  activeDays.forEach((ds) => {
    const fb = sessionFeedbacks?.[ds];
    const d = feedbackDifficulty05(fb);
    if (d > 0) {
      diffSum += d;
      diffCount += 1;
    }
    durationMin += Math.max(0, Number(fb?.sessionDuration) || 0);
  });
  const avgDifficulty05 = diffCount > 0 ? diffSum / diffCount : 3.0;
  const days = activeDays.size;
  const avgDurationMin = days > 0 ? durationMin / days : 0;

  // Score principal basé sur les jours actifs, ajusté par difficulté et temps moyen.
  const dayBase = days;
  const difficultyFactor = 1 + (avgDifficulty05 - 3) * 0.16; // 5/5 => +32%, 1/5 => -32%
  const durationFactor = 1 + clamp((avgDurationMin - 45) / 150, -0.2, 0.25); // borne pour rester stable
  const volumeFactor = 1 + clamp(Math.log10(Math.max(1, totalReps)) / 12, 0, 0.25);
  const score = dayBase * difficultyFactor * durationFactor * volumeFactor;

  return {
    days,
    totalReps,
    avgDifficulty05,
    avgDurationMin,
    score
  };
}

/**
 * Synthèse cardio (Garmin + manuel) sur une fenêtre recap, pour pondération « endurance ».
 * @param {{ cardio?: unknown[], jumpRope?: unknown[] }} activities
 * @param {{ sessions?: { running?: unknown[], jumpRope?: unknown[] } }} enduranceData
 * @param {{ start: string, end: string }} win
 */
export function summarizeCardioLoadInWindow(
  activities = {},
  enduranceData = {},
  win,
  dailyMetrics = {},
  workoutAggregate = null
) {
  const cardioActivities = Array.isArray(activities.cardio) ? activities.cardio : [];
  const garminById = new Map();
  cardioActivities.forEach((act) => {
    const id = getGarminLikeId(act);
    if (!id) return;
    garminById.set(id, act);
  });

  const runningSessions = uniqueSessionsByIdOrSignature([
    ...(Array.isArray(enduranceData?.sessions?.running) ? enduranceData.sessions.running : []),
    ...(Array.isArray(enduranceData?.runningSessions) ? enduranceData.runningSessions : [])
  ], workoutAggregate).filter((s) => !shouldExcludeStoredGarminRunningSession(s));
  const runningByGarminId = new Map();
  runningSessions.forEach((s) => {
    const dk = normalizedSessionDate(s, workoutAggregate);
    if (!dk || !isDateInRecapWindow(dk, win)) return;
    const gId = s?.garminId != null && s.garminId !== '' ? String(s.garminId) : null;
    if (!gId) return;
    const km = parseDistanceKmFromRunningSession(s);
    if (km <= 0) return;
    const garminAct = garminById.get(gId) || null;
    runningByGarminId.set(gId, {
      km,
      isWalk: isWalkingLikeRunningSession(s, garminAct),
      date: dk,
      session: s
    });
  });

  const cardio = cardioActivities;
  let runKm = 0;
  let walkKm = 0;
  const cardioDayMap = new Map(); // ds -> { runKm, walkKm, jumpMin, runDifficultySum, runDifficultyCount }
  cardio.forEach((act) => {
    const dk = activityDateKey(act);
    if (!dk || !isDateInRecapWindow(dk, win)) return;
    const gId = getGarminLikeId(act);
    // Si la même activité existe dans sessions.running, on se base sur la session
    // (elle porte la meilleure classification marche/course côté Défis).
    if (gId && runningByGarminId.has(gId)) return;
    const km = distanceKmFromActivity(act);
    if (km <= 0) return;
    if (!cardioDayMap.has(dk)) {
      cardioDayMap.set(dk, { runKm: 0, walkKm: 0, jumpMin: 0, runDifficultySum: 0, runDifficultyCount: 0 });
    }
    const day = cardioDayMap.get(dk);
    if (isGarminWalkingLikeActivity(act)) walkKm += km;
    else if (isGarminRunningLikeActivity(act)) {
      runKm += km;
      day.runDifficultySum += 3.2;
      day.runDifficultyCount += 1;
    }
    if (isGarminWalkingLikeActivity(act)) day.walkKm += km;
    else if (isGarminRunningLikeActivity(act)) day.runKm += km;
  });

  const jrGarmin = Array.isArray(activities.jumpRope) ? activities.jumpRope : [];
  let jumpMin = 0;
  jrGarmin.forEach((act) => {
    const dk = activityDateKey(act);
    if (!dk || !isDateInRecapWindow(dk, win)) return;
    const mins = jumpRopeMinutesFromSession(act);
    jumpMin += mins;
    if (!cardioDayMap.has(dk)) {
      cardioDayMap.set(dk, { runKm: 0, walkKm: 0, jumpMin: 0, runDifficultySum: 0, runDifficultyCount: 0 });
    }
    cardioDayMap.get(dk).jumpMin += mins;
  });

  const sessionsJr = uniqueSessionsByIdOrSignature([
    ...(Array.isArray(enduranceData?.sessions?.jumprope) ? enduranceData.sessions.jumprope : []),
    ...(Array.isArray(enduranceData?.sessions?.jumpRope) ? enduranceData.sessions.jumpRope : []),
    ...(Array.isArray(enduranceData?.jumpropeSessions) ? enduranceData.jumpropeSessions : []),
    ...(Array.isArray(enduranceData?.jumpRopeSessions) ? enduranceData.jumpRopeSessions : [])
  ]);
  sessionsJr.forEach((s) => {
    const dk = normalizedSessionDate(s, workoutAggregate);
    if (!dk || !isDateInRecapWindow(dk, win)) return;
    const mins = jumpRopeMinutesFromSession(s);
    jumpMin += mins;
    if (!cardioDayMap.has(dk)) {
      cardioDayMap.set(dk, { runKm: 0, walkKm: 0, jumpMin: 0, runDifficultySum: 0, runDifficultyCount: 0 });
    }
    cardioDayMap.get(dk).jumpMin += mins;
  });

  let sessionRunKm = 0;
  let sessionWalkKm = 0;
  const seenRunningKeys = new Set();
  runningSessions.forEach((s) => {
    const key = runningSessionIdentityKey(s, workoutAggregate);
    if (seenRunningKeys.has(key)) return;
    seenRunningKeys.add(key);
    const dk = normalizedSessionDate(s, workoutAggregate);
    if (!dk || !isDateInRecapWindow(dk, win)) return;
    const km = parseDistanceKmFromRunningSession(s);
    if (!Number.isFinite(km) || km <= 0) return;
    if (!cardioDayMap.has(dk)) {
      cardioDayMap.set(dk, { runKm: 0, walkKm: 0, jumpMin: 0, runDifficultySum: 0, runDifficultyCount: 0 });
    }
    const day = cardioDayMap.get(dk);
    const gId = s?.garminId != null && s.garminId !== '' ? String(s.garminId) : null;
    const garminAct = gId ? garminById.get(gId) || null : null;
    if (isWalkingLikeRunningSession(s, garminAct)) {
      sessionWalkKm += km;
      day.walkKm += km;
    } else {
      sessionRunKm += km;
      day.runKm += km;
      const runDiff = Math.max(
        runningTypeDifficulty(s?.type),
        sessionSelfRatedDifficulty05(s),
      );
      day.runDifficultySum += runDiff > 0 ? runDiff : 3.0;
      day.runDifficultyCount += 1;
    }
  });

  let cardioWeightedDayScore = 0;
  let cardioDifficultySum = 0;
  let cardioDifficultyCount = 0;
  cardioDayMap.forEach((day) => {
    const hasRun = day.runKm > 0.05;
    const hasWalk = day.walkKm > 0.05;
    const hasJump = day.jumpMin >= 2;
    // Base centrée sur "un jour actif vaut d'abord un jour"
    let base = 1;
    if (hasRun) base += 0.45;
    if (!hasRun && hasWalk) base += 0.2;
    if (hasJump) base += 0.25;
    // Bonus volume volontairement borné pour ne pas écraser la logique par jours
    const volumeBonus =
      clamp(day.runKm * 0.03, 0, 0.22) +
      clamp(day.walkKm * 0.015, 0, 0.12) +
      clamp(day.jumpMin * 0.01, 0, 0.2);
    base += Math.min(0.35, volumeBonus);
    const runDiffAvg = day.runDifficultyCount > 0 ? day.runDifficultySum / day.runDifficultyCount : 3.0;
    const dayDifficulty = clamp(runDiffAvg, 1, 5);
    cardioDifficultySum += dayDifficulty;
    cardioDifficultyCount += 1;
    const dayDifficultyFactor = 1 + (dayDifficulty - 3) * 0.12;
    cardioWeightedDayScore += base * dayDifficultyFactor;
  });
  const cardioDays = cardioDayMap.size;
  const cardioAvgDifficulty05 =
    cardioDifficultyCount > 0 ? cardioDifficultySum / cardioDifficultyCount : 3.0;

  // Source de vérité "marche nette" (pas Garmin - pas course), alignée avec la carte Marche.
  try {
    const walkingNet = buildAllTimeWalkingFromSteps({
      dailyMetrics: dailyMetrics || {},
      activities: { cardio },
      manualStepsByDate: workoutAggregate?.enduranceData?.manualDailyWalkByDate
    });
    const points = Array.isArray(walkingNet?.points) ? walkingNet.points : [];
    const walkKmNetInWindow = points.reduce((sum, p) => {
      const dk = p?.date;
      if (!dk || !isDateInRecapWindow(dk, win)) return sum;
      return sum + Math.max(0, Number(p?.walkingKm || 0));
    }, 0);
    if (walkKmNetInWindow > 0) {
      walkKm = Math.max(walkKm, walkKmNetInWindow);
    }
  } catch {
    // no-op
  }

  return {
    runKm: runKm + sessionRunKm,
    walkKm: walkKm + sessionWalkKm,
    jumpMin,
    swimMin: 0,
    cardioDays,
    cardioWeightedDayScore,
    cardioAvgDifficulty05
  };
}

/**
 * Points « endurance » vs « muscu » pour barres % (course > marche > corde en poids).
 */
export function computeCardioVsStrengthShares(cardio, strengthInput) {
  const runPts = (cardio.runKm || 0) * 10;
  const walkPts = (cardio.walkKm || 0) * 4;
  const jumpPts = (cardio.jumpMin || 0) * 1.8;
  const swimPts = (cardio.swimMin || 0) * 2;
  const cardioTotal = runPts + walkPts + jumpPts + swimPts;
  const strengthMeta =
    typeof strengthInput === 'number'
      ? { score: Math.sqrt(Math.max(0, strengthInput)) * 6, days: 0, avgDifficulty05: 3, avgDurationMin: 0 }
      : (strengthInput || {});
  const cardioDays = Number(cardio.cardioDays) || 0;
  const strengthDays = Number(strengthMeta.days) || 0;
  const sum = cardioDays + strengthDays;
  if (sum <= 0) {
    return {
      cardioPct: 0,
      strengthPct: 0,
      runPct: 0,
      walkPct: 0,
      jumpPct: 0,
      swimPct: 0,
      cardioDays: 0,
      strengthDays: 0,
      cardioAvgDifficulty05: 0,
      strengthAvgDifficulty05: 0
    };
  }
  const cardioPct = Math.round((cardioDays / sum) * 100);
  const strengthPct = 100 - cardioPct;
  if (cardioDays <= 0) {
    return {
      cardioPct,
      strengthPct,
      runPct: 0,
      walkPct: 0,
      jumpPct: 0,
      swimPct: 0,
      cardioDays,
      strengthDays,
      cardioAvgDifficulty05: Number(cardio.cardioAvgDifficulty05) || 0,
      strengthAvgDifficulty05: Number(strengthMeta.avgDifficulty05) || 0
    };
  }
  const cardioMixDen = cardioTotal > 0 ? cardioTotal : 1;
  return {
    cardioPct,
    strengthPct,
    runPct: Math.round((runPts / cardioMixDen) * 100),
    walkPct: Math.round((walkPts / cardioMixDen) * 100),
    jumpPct: Math.round((jumpPts / cardioMixDen) * 100),
    swimPct: Math.round((swimPts / cardioMixDen) * 100),
    cardioDays,
    strengthDays,
    cardioAvgDifficulty05: Number(cardio.cardioAvgDifficulty05) || 0,
    strengthAvgDifficulty05: Number(strengthMeta.avgDifficulty05) || 0
  };
}
