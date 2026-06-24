/**
 * Utilitaires partagés pour les moteurs d'analyse Récap (magnitude, lookup, Garmin, défis).
 */

import DateHelper from '../dateHelper';
import { computeGarminDailyStats } from './recapCrossCoachAggregate';
import { sumPushupRepsInChallengeWindow } from '../../services/endurance/enduranceChallengesService';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';

export function magnitudeWord(pctAbs) {
  const p = Math.abs(pctAbs);
  if (p >= 30) return 'net';
  if (p >= 15) return 'marqué';
  if (p >= 7) return 'modéré';
  if (p >= 3) return 'léger';
  return 'discret';
}

export function pctChange(current, prior) {
  if (prior == null || prior === 0) return null;
  return ((current - prior) / prior) * 100;
}

export function findExerciseSessions(byEx, exerciseId) {
  if (!byEx || exerciseId == null) return [];
  const id = String(exerciseId);
  if (byEx.has(id)) return byEx.get(id);
  const num = parseInt(id, 10);
  if (Number.isFinite(num)) {
    for (const [k, v] of byEx) {
      if (String(k) === id || parseInt(String(k), 10) === num) return v;
    }
  }
  return [];
}

/** IDs tractions strictes (barre / pronation / supination verticale). */
export const VERTICAL_PULL_EXERCISE_IDS = new Set([101, 501, 1001, 5001]);

/** IDs tractions australiennes / rowing horizontal. */
export const AUSTRALIAN_PULL_EXERCISE_IDS = new Set([102, 502, 1002, 5002, 7002]);

export const PUSHUP_EXERCISE_IDS = new Set([104, 105, 201, 204, 1104, 1105]);

export function exerciseMovementBlob(exLike, getExerciseNameById) {
  const id = parseInt(String(exLike?.id ?? exLike?.exerciseId), 10);
  const nameFromId =
    Number.isFinite(id) && typeof getExerciseNameById === 'function'
      ? getExerciseNameById(id)
      : '';
  return `${exLike?.name || exLike?.nom || nameFromId || ''} ${exLike?.exerciseBankKey || ''}`.toLowerCase();
}

export function isAustralianPullExercise(exerciseId, getExerciseNameById, exLike = null) {
  const id = parseInt(String(exerciseId), 10);
  if (AUSTRALIAN_PULL_EXERCISE_IDS.has(id)) return true;
  const blob = exerciseMovementBlob({ id: exerciseId, ...(exLike || {}) }, getExerciseNameById);
  return (
    (/australien|inverted row|body row|rowing australien/.test(blob) ||
      (/rowing/.test(blob) && !/barre|haltère|haltere|cable|poulie/.test(blob))) &&
    !/d[ée]velopp|bench press|dip\b/.test(blob)
  );
}

export function isVerticalPullExercise(exerciseId, getExerciseNameById, exLike = null) {
  if (isAustralianPullExercise(exerciseId, getExerciseNameById, exLike)) return false;
  const id = parseInt(String(exerciseId), 10);
  if (VERTICAL_PULL_EXERCISE_IDS.has(id)) return true;
  const blob = exerciseMovementBlob({ id: exerciseId, ...(exLike || {}) }, getExerciseNameById);
  return (
    /traction|pull[- ]?up|pullup|chin[- ]?up|chinup|tirage vertical|tirage pronation|tirage supination/.test(
      blob
    ) &&
    !/australien|rowing/.test(blob) &&
    !/d[ée]velopp|bench|press|pector|coude/.test(blob)
  );
}

export function isPushupExercise(exerciseId, getExerciseNameById, exLike = null) {
  const id = parseInt(String(exerciseId), 10);
  if (PUSHUP_EXERCISE_IDS.has(id)) return true;
  const blob = exerciseMovementBlob({ id: exerciseId, ...(exLike || {}) }, getExerciseNameById);
  return /pompe|push[- ]?up|pushup/.test(blob) && !/dip|dips/.test(blob);
}

export function recapWindowWeeks(window) {
  if (!window?.start || !window?.end) return 4;
  const days = DateHelper.daysBetween(window.start, window.end);
  if (days == null || days < 0) return 4;
  return Math.max(1, (days + 1) / 7);
}

export function weeklyRateFromSessionDays(sessionDays, window) {
  const weeks = recapWindowWeeks(window);
  return Math.round((sessionDays / weeks) * 10) / 10;
}

export function garminStatsForWindow(garminDailyMetrics, window) {
  if (!garminDailyMetrics || !window?.start || !window?.end) return null;
  return computeGarminDailyStats(garminDailyMetrics, window.start, window.end);
}

export function dailyRepsMap(snapshot, window) {
  const map = new Map();
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};
  Object.keys(reps).forEach((k) => {
    if (checked[k] !== true) return;
    const d = k.slice(0, 10);
    if (!isDateInRecapWindow(d, window)) return;
    const v = parseInt(String(reps[k]), 10) || 0;
    if (v > 0) map.set(d, (map.get(d) || 0) + v);
  });
  return map;
}

export function acuteChronicRepsRatio(snapshot, window) {
  const map = dailyRepsMap(snapshot, window);
  const endYmd = window?.end || DateHelper.getTodayLocal();
  let acute = 0;
  let chronic = 0;
  for (let i = 0; i < 7; i += 1) acute += map.get(DateHelper.addDays(endYmd, -i)) || 0;
  for (let i = 7; i < 28; i += 1) chronic += map.get(DateHelper.addDays(endYmd, -i)) || 0;
  const chronicWeekly = chronic / 3;
  if (chronicWeekly <= 0) return null;
  return { acute, chronicWeekly, ratio: acute / 7 / (chronicWeekly / 7) };
}

/**
 * Progression estimée d'un défi endurance (0–100 ou null).
 */
export function challengeProgressPct(challenge, snapshot, perActivity = {}) {
  if (!challenge) return null;
  if (challenge.status === 'completed') return 100;

  if (challenge.type === 'pushups_cumul') {
    const goal = Number(challenge.goalTotalCount) || 0;
    if (goal <= 0) return null;
    const current = sumPushupRepsInChallengeWindow(
      challenge,
      snapshot?.enduranceData?.sessions?.pushups || [],
      snapshot
    );
    return Math.min(100, Math.round((current / goal) * 100));
  }

  if (challenge.type === 'ponctuel' && challenge.activityType === 'running') {
    const goal = parseFloat(String(challenge.goalDistance ?? '').replace(',', '.')) || 0;
    if (goal <= 0) return null;
    const sessions = perActivity?.running?.sessions || [];
    const best = sessions.reduce((m, s) => {
      const d =
        s?.runningFactors?.distanceKm ??
        (parseFloat(String(s?.raw?.distance ?? '').replace(',', '.')) || 0);
      return Math.max(m, d);
    }, 0);
    if (best <= 0) return null;
    return Math.min(100, Math.round((best / goal) * 100));
  }

  if (challenge.type === 'ponctuel' && challenge.activityType === 'jumprope') {
    const goal = Number(challenge.goalJumps) || 0;
    if (goal <= 0) return null;
    const sessions = perActivity?.jumprope?.sessions || [];
    const best = sessions.reduce((m, s) => Math.max(m, Number(s?.raw?.jumps) || 0), 0);
    if (best <= 0) return null;
    return Math.min(100, Math.round((best / goal) * 100));
  }

  return null;
}

export function challengeInsightText(challenge, progress) {
  const title = challenge?.title || challenge?.name || 'Défi';
  if (progress == null) {
    return `Défi « ${title} » actif — chaque séance éligible rapproche l’objectif.`;
  }
  if (progress >= 100) {
    return `Défi « ${title} » validé sur la période — bon signal de régularité ciblée.`;
  }
  if (progress >= 85) {
    return `Défi « ${title} » : ~${progress} % — tu touches presque l’objectif, une bonne séance peut suffire.`;
  }
  if (progress >= 50) {
    return `Défi « ${title} » : ~${progress} % — mi-parcours solide, garde le rythme sans forcer tous les jours.`;
  }
  if (progress >= 20) {
    return `Défi « ${title} » : ~${progress} % — le défi avance ; planifie 1–2 séances dédiées cette semaine.`;
  }
  return `Défi « ${title} » : ~${progress} % — encore du chemin, mais chaque rep compte pour le cumul.`;
}
