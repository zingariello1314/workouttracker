/**
 * Mémoire sportive depuis la première saisie — pas de texte UI.
 *
 * Distingue : première donnée ≠ première référence fiable ≠ PR ≠ niveau habituel.
 * La fenêtre Recap borne la date de fin ; l'historique commence au premier check.
 */

import {
  extractDateStrFromWorkoutKey,
  extractExerciseIdFromWorkoutKey
} from '../exerciseKeyGenerator';
import { classifyExercisePerformanceLevel } from './performanceRobustness';
import { daysBetweenYmd, isRunningLikeName } from './recapTrainingTimeline';
import { movementFamily } from './recapExposureNarratives';

function median(nums) {
  const v = (nums || []).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function mean(nums) {
  const v = (nums || []).filter((n) => Number.isFinite(n));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function round1(n) {
  if (n == null || !Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
}

function exerciseName(id, getExerciseNameById) {
  const n = parseInt(String(id), 10);
  if (typeof getExerciseNameById === 'function') {
    const label = Number.isFinite(n) ? getExerciseNameById(n) : getExerciseNameById(id);
    if (label?.trim()) return label.trim();
  }
  return `Exercice ${id}`;
}

/**
 * Historique complet jusqu'à `endYmd` (inclus), toutes dates antérieures gardées.
 */
export function collectLifetimeRepHistory(snapshot, endYmd = null) {
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};
  const byEx = new Map();

  for (const key of Object.keys(reps)) {
    if (checked[key] !== true) continue;
    const dateStr = extractDateStrFromWorkoutKey(key);
    if (!dateStr) continue;
    if (endYmd && dateStr > endYmd) continue;
    const exId = extractExerciseIdFromWorkoutKey(key);
    if (!exId || String(exId).includes('complementary')) continue;
    const val = parseInt(String(reps[key]), 10);
    if (!Number.isFinite(val) || val <= 0) continue;
    if (!byEx.has(exId)) byEx.set(exId, []);
    const list = byEx.get(exId);
    const existing = list.find((s) => s.date === dateStr);
    if (existing) existing.reps = Math.max(existing.reps, val);
    else list.push({ date: dateStr, reps: val });
  }

  for (const list of byEx.values()) {
    list.sort((a, b) => a.date.localeCompare(b.date));
  }
  return byEx;
}

/**
 * Première saisie vs première référence fiable (écarte un premier jour atypique).
 */
export function firstReliableReference(sessions) {
  if (!sessions?.length) return null;
  const first = sessions[0];
  if (sessions.length < 4) {
    return {
      date: first.date,
      reps: first.reps,
      source: 'first_capture',
      skippedOutlier: false
    };
  }
  const early = sessions.slice(0, 4);
  const restMed = median(early.slice(1).map((s) => s.reps));
  let startIdx = 0;
  if (restMed > 0 && (first.reps > restMed * 1.45 || first.reps < restMed * 0.55)) {
    startIdx = 1;
  }
  const slice = sessions.slice(startIdx, startIdx + 3);
  const reps = median(slice.map((s) => s.reps));
  return {
    date: slice[0].date,
    reps: round1(reps),
    source: startIdx > 0 ? 'first_reliable' : 'first_capture',
    skippedOutlier: startIdx > 0
  };
}

/**
 * Niveau habituel : médiane récente, en écartant un PR isolé.
 */
export function habitualLevel(sessions) {
  if (!sessions?.length) return null;
  const tail = sessions.slice(-Math.min(6, sessions.length));
  const reps = tail.map((s) => s.reps);
  const mx = Math.max(...reps);
  const withoutMax = reps.filter((r) => r !== mx);
  const restMed = median(withoutMax.length ? withoutMax : reps);
  const maxCount = reps.filter((r) => r === mx).length;
  const used =
    maxCount === 1 && restMed > 0 && mx >= restMed * 1.22 && withoutMax.length >= 3
      ? withoutMax
      : reps;
  return {
    median: round1(median(used)),
    mean: round1(mean(used)),
    sample: used.length
  };
}

export const JOURNEY_MILESTONES = [5, 8, 10, 12, 15, 18, 20, 25, 30];

/**
 * Premier franchissement de chaque palier, plus le temps entre deux paliers.
 */
export function detectMilestones(sessions) {
  const hits = [];
  let reached = 0;
  for (const s of sessions || []) {
    for (const t of JOURNEY_MILESTONES) {
      if (t > reached && s.reps >= t) {
        hits.push({ reps: t, date: s.date, sessionReps: s.reps });
        reached = t;
      }
    }
  }
  const steps = [];
  for (let i = 1; i < hits.length; i += 1) {
    steps.push({
      from: hits[i - 1].reps,
      to: hits[i].reps,
      days: daysBetweenYmd(hits[i - 1].date, hits[i].date)
    });
  }
  const dayList = steps.map((s) => s.days).filter((d) => d != null && d > 0);
  let pace = null;
  if (dayList.length >= 2) {
    const first = dayList[0];
    const last = dayList[dayList.length - 1];
    if (last < first * 0.65) pace = 'accelerating';
    else if (last > first * 1.5) pace = 'slowing';
    else pace = 'stable';
  }
  return { hits, steps, pace };
}

/**
 * Niveau habituel coincé dans une bande étroite pendant ≥ 28 jours, sans nouveau palier récent.
 */
export function detectPlateau(sessions, habit, endYmd, lastMilestoneDate = null) {
  if (!sessions || sessions.length < 6 || habit?.median == null) return null;
  const tail = sessions.slice(-6);
  const band = tail.every((s) => Math.abs(s.reps - habit.median) <= 1.5);
  if (!band) return null;
  const spanDays = daysBetweenYmd(tail[0].date, tail[tail.length - 1].date);
  if (spanDays == null || spanDays < 28) return null;
  if (lastMilestoneDate && endYmd) {
    const sinceHit = daysBetweenYmd(lastMilestoneDate, endYmd);
    if (sinceHit != null && sinceHit < 28) return null;
  }
  return {
    median: habit.median,
    sessions: tail.length,
    spanDays,
    since: tail[0].date
  };
}

function medianIntervalDays(sessions) {
  if (!sessions || sessions.length < 3) return null;
  const gaps = [];
  for (let i = 1; i < sessions.length; i += 1) {
    const d = daysBetweenYmd(sessions[i - 1].date, sessions[i].date);
    if (d != null && d >= 0) gaps.push(d);
  }
  return round1(median(gaps));
}

function describeExercise(exId, sessions, endYmd, getExerciseNameById) {
  const name = exerciseName(exId, getExerciseNameById);
  if (isRunningLikeName(name)) return null;
  if (sessions.length < 4) return null;

  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  const reliable = firstReliableReference(sessions);
  const habit = habitualLevel(sessions);
  const prReps = Math.max(...sessions.map((s) => s.reps));
  const prSession = sessions.find((s) => s.reps === prReps);
  const robustness = classifyExercisePerformanceLevel(sessions);
  const currentMean = round1(mean(sessions.slice(-3).map((s) => s.reps)));
  const atHabit =
    habit?.median != null
      ? sessions.filter((s) => Math.abs(s.reps - habit.median) <= 1).length
      : 0;

  const absGain =
    reliable?.reps != null && habit?.median != null ? habit.median - reliable.reps : null;
  const pct =
    reliable?.reps > 0 && absGain != null ? round1((absGain / reliable.reps) * 100) : null;
  const meaningfulProgress =
    sessions.length >= 6 &&
    reliable?.reps >= 3 &&
    absGain != null &&
    absGain >= 2 &&
    pct != null &&
    Math.abs(pct) >= 15;

  const prGap =
    prReps != null && habit?.median != null ? round1(prReps - habit.median) : null;
  const prDistinct = prGap != null && prGap >= 2 && atHabit >= 3;
  const milestones = detectMilestones(reliable.skippedOutlier ? sessions.slice(1) : sessions);
  const lastHit = milestones.hits[milestones.hits.length - 1] || null;
  const plateau = detectPlateau(sessions, habit, endYmd, lastHit?.date);
  const daysSince = endYmd ? daysBetweenYmd(last.date, endYmd) : null;
  const medInterval = medianIntervalDays(sessions);

  return {
    exerciseId: String(exId),
    name,
    sessions: sessions.length,
    firstCapture: { date: first.date, reps: first.reps },
    firstReliable: reliable,
    current: { date: last.date, reps: last.reps, meanLast3: currentMean },
    habitual: habit,
    pr: prSession ? { date: prSession.date, reps: prReps } : null,
    prAgeDays: prSession && endYmd ? daysBetweenYmd(prSession.date, endYmd) : null,
    spanDays: daysBetweenYmd(first.date, last.date),
    sessionsAtHabitual: atHabit,
    robustnessKind: robustness.kind,
    robustnessConfidence: robustness.confidence,
    pctFromReliable: pct,
    absGainFromReliable: absGain,
    meaningfulProgress,
    prDistinctFromHabitual: prDistinct,
    milestones,
    plateau,
    daysSinceLast: daysSince,
    medianIntervalDays: medInterval,
    family: movementFamily(exId, name, getExerciseNameById)
  };
}

function pickNarratives(exercises, endYmd) {
  const progress = [];
  const seenNames = new Set();
  exercises
    .filter((e) => e.meaningfulProgress)
    .sort((a, b) => Math.abs(b.pctFromReliable) - Math.abs(a.pctFromReliable))
    .forEach((e) => {
      const key = String(e.name || '').toLowerCase().replace(/\s+/g, ' ').trim();
      if (!key || seenNames.has(key)) return;
      seenNames.add(key);
      progress.push(e);
    });
  const uniqueProgress = progress.slice(0, 3);
  const progressIds = new Set(uniqueProgress.map((e) => e.exerciseId));
  const prVsLevel = exercises
    .filter((e) => e.prDistinctFromHabitual && !progressIds.has(e.exerciseId))
    .sort((a, b) => (b.pr?.reps || 0) - (b.habitual?.median || 0) - ((a.pr?.reps || 0) - (a.habitual?.median || 0)))
    .slice(0, 1);

  const milestoneStory = uniqueProgress[0]?.milestones?.hits?.length >= 3
    ? uniqueProgress[0]
    : exercises
        .filter((e) => (e.milestones?.hits || []).length >= 3)
        .sort((a, b) => b.milestones.hits.length - a.milestones.hits.length)[0] || null;

  const plateau = exercises
    .filter((e) => e.plateau && !progressIds.has(e.exerciseId))
    .sort((a, b) => (b.plateau?.spanDays || 0) - (a.plateau?.spanDays || 0))[0] || null;

  const abandoned = exercises
    .filter(
      (e) =>
        e.daysSinceLast >= 21 &&
        e.sessions >= 5 &&
        e.medianIntervalDays != null &&
        e.medianIntervalDays <= 16
    )
    .sort((a, b) => b.daysSinceLast - a.daysSinceLast)
    .slice(0, 2)
    .map((row) => {
      const replacement =
        exercises.find(
          (e) =>
            e.exerciseId !== row.exerciseId &&
            e.family &&
            e.family === row.family &&
            e.family !== 'other' &&
            (e.daysSinceLast == null || e.daysSinceLast <= 14)
        ) || null;
      return {
        ...row,
        replacement: replacement ? { name: replacement.name, exerciseId: replacement.exerciseId } : null
      };
    });

  return {
    progress: uniqueProgress,
    prVsLevel: prVsLevel[0] || null,
    milestoneStory: milestoneStory || null,
    plateau,
    abandoned
  };
}

/**
 * @returns {{
 *   startYmd: string|null,
 *   endYmd: string|null,
 *   trainingDays: number,
 *   totalReps: number,
 *   exercises: object[],
 *   narratives: { progress: object[], prVsLevel: object|null }
 * }}
 */
export function buildAthleteJourney({ snapshot = {}, window = null, getExerciseNameById = null } = {}) {
  const endYmd = window?.end || null;
  const byEx = collectLifetimeRepHistory(snapshot, endYmd);
  const allDates = new Set();
  let totalReps = 0;
  const exercises = [];

  byEx.forEach((sessions, exId) => {
    sessions.forEach((s) => {
      allDates.add(s.date);
      totalReps += s.reps;
    });
    const row = describeExercise(exId, sessions, endYmd, getExerciseNameById);
    if (row) exercises.push(row);
  });

  const dates = [...allDates].sort();
  return {
    startYmd: dates[0] || null,
    endYmd,
    trainingDays: dates.length,
    totalReps,
    exercises: exercises.sort((a, b) => b.sessions - a.sessions),
    narratives: pickNarratives(exercises, endYmd),
    tenureDays: dates[0] && endYmd ? daysBetweenYmd(dates[0], endYmd) : dates.length || 0
  };
}

export function journeyHasProgressStory(journey) {
  return Boolean(journey?.narratives?.progress?.length);
}
