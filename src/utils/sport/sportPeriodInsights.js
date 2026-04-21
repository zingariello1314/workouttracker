import { normalizeDateString } from '../calendarUtils';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { isGarminWalkingLikeActivity, isGarminRunningLikeActivity } from '../garminRunningLaps';

function activityDateKey(act) {
  const raw = act?.date || act?.startTimeLocal || act?.startTimeGmt;
  return normalizeDateString(raw) || null;
}

function distanceKmFromActivity(act) {
  const d = Number(act?.distance);
  if (Number.isFinite(d) && d > 0) {
    if (d > 400 && d < 200000) return d / 1000;
    return d;
  }
  const m = Number(act?.distanceMeters ?? act?.running?.distanceMeters);
  if (Number.isFinite(m) && m > 0) return m / 1000;
  return 0;
}

function jumpRopeMinutesFromSession(s) {
  const dur = Number(s?.duration ?? s?.totalTime);
  if (Number.isFinite(dur) && dur > 0) {
    return dur > 200 ? dur / 60 : dur;
  }
  return 0;
}

/**
 * Synthèse cardio (Garmin + manuel) sur une fenêtre recap, pour pondération « endurance ».
 * @param {{ cardio?: unknown[], jumpRope?: unknown[] }} activities
 * @param {{ sessions?: { running?: unknown[], jumpRope?: unknown[] } }} enduranceData
 * @param {{ start: string, end: string }} win
 */
export function summarizeCardioLoadInWindow(activities = {}, enduranceData = {}, win) {
  const cardio = Array.isArray(activities.cardio) ? activities.cardio : [];
  let runKm = 0;
  let walkKm = 0;
  cardio.forEach((act) => {
    const dk = activityDateKey(act);
    if (!dk || !isDateInRecapWindow(dk, win)) return;
    const km = distanceKmFromActivity(act);
    if (km <= 0) return;
    if (isGarminWalkingLikeActivity(act)) walkKm += km;
    else if (isGarminRunningLikeActivity(act)) runKm += km;
  });

  const jrGarmin = Array.isArray(activities.jumpRope) ? activities.jumpRope : [];
  let jumpMin = 0;
  jrGarmin.forEach((act) => {
    const dk = activityDateKey(act);
    if (!dk || !isDateInRecapWindow(dk, win)) return;
    jumpMin += jumpRopeMinutesFromSession(act);
  });

  const sessionsJr = enduranceData?.sessions?.jumpRope || [];
  sessionsJr.forEach((s) => {
    const dk = normalizeDateString(s?.date || s?.startTimeLocal);
    if (!dk || !isDateInRecapWindow(dk, win)) return;
    jumpMin += jumpRopeMinutesFromSession(s);
  });

  let manualRunKm = 0;
  (enduranceData?.sessions?.running || []).forEach((s) => {
    if (s?.source === 'garmin' || s?.garminId) return;
    const dk = normalizeDateString(s?.date);
    if (!dk || !isDateInRecapWindow(dk, win)) return;
    const km = Number(s?.distance);
    if (Number.isFinite(km) && km > 0) manualRunKm += km;
  });

  return {
    runKm: runKm + manualRunKm,
    walkKm,
    jumpMin,
    swimMin: 0
  };
}

/**
 * Points « endurance » vs « muscu » pour barres % (course > marche > corde en poids).
 */
export function computeCardioVsStrengthShares(cardio, strengthReps) {
  const runPts = (cardio.runKm || 0) * 10;
  const walkPts = (cardio.walkKm || 0) * 4;
  const jumpPts = (cardio.jumpMin || 0) * 1.8;
  const swimPts = (cardio.swimMin || 0) * 2;
  const cardioTotal = runPts + walkPts + jumpPts + swimPts;
  const strengthPts = Math.sqrt(Math.max(0, strengthReps)) * 6;
  const sum = cardioTotal + strengthPts;
  if (sum <= 0) {
    return {
      cardioPct: 0,
      strengthPct: 0,
      runPct: 0,
      walkPct: 0,
      jumpPct: 0,
      swimPct: 0
    };
  }
  const cardioPct = Math.round((cardioTotal / sum) * 100);
  const strengthPct = 100 - cardioPct;
  if (cardioTotal <= 0) {
    return {
      cardioPct,
      strengthPct,
      runPct: 0,
      walkPct: 0,
      jumpPct: 0,
      swimPct: 0
    };
  }
  return {
    cardioPct,
    strengthPct,
    runPct: Math.round((runPts / cardioTotal) * 100),
    walkPct: Math.round((walkPts / cardioTotal) * 100),
    jumpPct: Math.round((jumpPts / cardioTotal) * 100),
    swimPct: Math.round((swimPts / cardioTotal) * 100)
  };
}
