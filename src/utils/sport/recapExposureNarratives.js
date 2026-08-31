/**
 * Comparaisons d'exposition (séances, muscles, exercices) pour la période Recap
 * sélectionnée vs fenêtre d'habitude et vs ~90 j.
 * Produit des InterpretationCandidate — le texte est rendu ensuite.
 */

import DateHelper from '../dateHelper';
import {
  extractDateStrFromWorkoutKey,
  extractExerciseIdFromWorkoutKey
} from '../exerciseKeyGenerator';
import { countTrainingDaysInRange } from './recapTrainingDayTruth';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { inferMuscleGroupsForExercise } from './recapMuscleInference';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { classifyMovement } from './recapMovementClassification';

export const MUSCLE_FR = {
  [MuscleGroups.CHEST]: 'pectoraux',
  [MuscleGroups.BACK]: 'dos',
  [MuscleGroups.SHOULDERS]: 'épaules',
  [MuscleGroups.BICEPS]: 'biceps',
  [MuscleGroups.TRICEPS]: 'triceps',
  [MuscleGroups.FOREARMS]: 'avant-bras',
  [MuscleGroups.GLUTES]: 'fessiers',
  [MuscleGroups.LEGS]: 'jambes',
  [MuscleGroups.QUADS]: 'quadriceps',
  [MuscleGroups.HAMSTRINGS]: 'ischio-jambiers',
  [MuscleGroups.CALVES]: 'mollets',
  [MuscleGroups.TIBIALIS_ANTERIOR]: 'tibial antérieur',
  [MuscleGroups.NECK]: 'cou',
  [MuscleGroups.ADDUCTORS]: 'adducteurs',
  [MuscleGroups.CORE]: 'gainage',
  [MuscleGroups.FULL_BODY]: 'corps entier'
};

function windowDayCount(window) {
  if (!window?.end) return 0;
  if (!window.start) return 90;
  return DateHelper.getDateRange(window.start, window.end).length;
}

export function periodPhrase(period, window) {
  switch (period) {
    case 'today':
      return "aujourd'hui";
    case '7d':
      return 'sur les 7 derniers jours';
    case '30d':
      return 'sur les 30 derniers jours';
    case '3m':
      return 'sur les 3 derniers mois';
    case '6m':
      return 'sur les 6 derniers mois';
    case '1y':
      return 'sur la dernière année';
    case '2y':
      return 'sur les deux dernières années';
    default: {
      const n = windowDayCount(window);
      if (n <= 1) return "aujourd'hui";
      if (n <= 8) return 'sur les 7 derniers jours';
      if (n <= 35) return `sur ${n} jours`;
      return `sur la période affichée (${n} j.)`;
    }
  }
}

function habitPhrase(period, habitDays) {
  if (period === 'today' || period === '7d' || (habitDays >= 18 && habitDays <= 24)) {
    return 'sur les 3 semaines précédentes';
  }
  if (habitDays <= 35) return `sur les ${habitDays} jours d'avant`;
  if (habitDays <= 100) return 'sur le trimestre précédent';
  return 'sur la période comparable d’avant';
}

/**
 * Fenêtres : période affichée, habitude (souvent 3 semaines avant une semaine), 90 j.
 */
export function deriveExposureWindows(period, window) {
  const end = window?.end;
  if (!end) return null;
  const len = Math.max(1, windowDayCount(window));
  const current =
    window.start != null
      ? window
      : { start: DateHelper.addDays(end, -(Math.min(len, 28) - 1)), end };

  let habit;
  if (period === 'today' || len <= 2) {
    habit = { start: DateHelper.addDays(end, -21), end: DateHelper.addDays(end, -1) };
  } else if (period === '7d' || len <= 8) {
    habit = {
      start: DateHelper.addDays(current.start, -21),
      end: DateHelper.addDays(current.start, -1)
    };
  } else {
    const prevEnd = DateHelper.addDays(current.start, -1);
    habit = {
      start: DateHelper.addDays(prevEnd, -(len - 1)),
      end: prevEnd
    };
  }

  const longTerm = { start: DateHelper.addDays(end, -89), end };
  return { current, habit, longTerm, currentLen: len, habitLen: windowDayCount(habit) };
}

function muscleLabel(g) {
  return MUSCLE_FR[g] || g;
}

function exerciseName(exId, getExerciseNameById) {
  const n = parseInt(String(exId), 10);
  if (typeof getExerciseNameById === 'function') {
    const label = Number.isFinite(n) ? getExerciseNameById(n) : getExerciseNameById(exId);
    if (label && String(label).trim() && !/^Exercice\s+/i.test(String(label))) {
      return String(label).trim();
    }
  }
  return `Exercice ${exId}`;
}

/**
 * @returns {{
 *   sessions: number,
 *   totalReps: number,
 *   distinctExercises: number,
 *   avgExercisesPerSession: number,
 *   muscles: Array<{ group: string, label: string, reps: number, exercises: number }>,
 *   exercises: Array<{ id: string, name: string, reps: number, sessions: number, firstReps: number, lastReps: number }>
 * }}
 */
export function summarizeExposure(snapshot, win, getExerciseNameById = null, garminData = null) {
  const empty = {
    sessions: 0,
    totalReps: 0,
    distinctExercises: 0,
    avgExercisesPerSession: 0,
    muscles: [],
    exercises: []
  };
  if (!win?.end) return empty;

  const sessions = countTrainingDaysInRange(snapshot, win.start, win.end, garminData);
  const muscleReps = new Map();
  const muscleEx = new Map();
  const byEx = new Map();
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};
  const perDayEx = new Map();

  Object.keys(reps).forEach((k) => {
    if (checked[k] !== true) return;
    const d = extractDateStrFromWorkoutKey(k);
    const exId = extractExerciseIdFromWorkoutKey(k);
    if (!d || !exId || !isDateInRecapWindow(d, win)) return;
    const v = parseInt(String(reps[k]), 10) || 0;
    if (v <= 0) return;

    const name = exerciseName(exId, getExerciseNameById);
    const groups = inferMuscleGroupsForExercise({ name, id: exId }).filter(
      (g) => g && g !== MuscleGroups.FULL_BODY
    );
    const shareGroups = groups.length ? groups : [MuscleGroups.FULL_BODY];
    const share = v / shareGroups.length;
    shareGroups.forEach((g) => {
      muscleReps.set(g, (muscleReps.get(g) || 0) + share);
      const set = muscleEx.get(g) || new Set();
      set.add(exId);
      muscleEx.set(g, set);
    });

    const row = byEx.get(exId) || { id: exId, name, reps: 0, dates: [] };
    row.reps += v;
    row.dates.push({ date: d, reps: v });
    byEx.set(exId, row);

    const daySet = perDayEx.get(d) || new Set();
    daySet.add(exId);
    perDayEx.set(d, daySet);
  });

  let totalReps = 0;
  byEx.forEach((row) => {
    totalReps += row.reps;
  });

  const exPerDay = [...perDayEx.values()].map((s) => s.size);
  const avgExercisesPerSession = exPerDay.length
    ? Math.round((exPerDay.reduce((a, b) => a + b, 0) / exPerDay.length) * 10) / 10
    : 0;

  const muscles = [...muscleReps.entries()]
    .map(([group, r]) => ({
      group,
      label: muscleLabel(group),
      reps: Math.round(r),
      exercises: muscleEx.get(group)?.size || 0
    }))
    .sort((a, b) => b.reps - a.reps);

  const exercises = [...byEx.values()]
    .map((row) => {
      const dates = [...row.dates].sort((a, b) => String(a.date).localeCompare(String(b.date)));
      return {
        id: row.id,
        name: row.name,
        reps: row.reps,
        sessions: dates.length,
        firstReps: dates[0]?.reps ?? 0,
        lastReps: dates[dates.length - 1]?.reps ?? 0
      };
    })
    .sort((a, b) => b.reps - a.reps);

  return {
    sessions,
    totalReps,
    distinctExercises: byEx.size,
    avgExercisesPerSession,
    muscles,
    exercises
  };
}

function topMusclesText(muscles, n = 3) {
  return muscles
    .slice(0, n)
    .map((m) => `${m.label} (${m.reps} reps, ${m.exercises} exo${m.exercises > 1 ? 's' : ''})`)
    .join(', ');
}

export function weeklyRate(sessions, days) {
  if (!days || days <= 0) return 0;
  return Math.round((sessions / days) * 7 * 10) / 10;
}

const PUSH_GROUPS = new Set([
  MuscleGroups.CHEST,
  MuscleGroups.SHOULDERS,
  MuscleGroups.TRICEPS
]);
const PULL_GROUPS = new Set([MuscleGroups.BACK, MuscleGroups.BICEPS]);
const LEG_SHARE_GROUPS = new Set([
  MuscleGroups.QUADS,
  MuscleGroups.HAMSTRINGS,
  MuscleGroups.CALVES,
  MuscleGroups.GLUTES,
  MuscleGroups.ADDUCTORS
]);

export function muscleProfile(summary) {
  const muscles = summary?.muscles || [];
  const total = muscles.reduce((s, m) => s + (m.reps || 0), 0);
  const withShare = muscles.map((m) => ({
    ...m,
    sharePct: total > 0 ? Math.round((m.reps / total) * 1000) / 10 : 0
  }));
  let push = 0;
  let pull = 0;
  let legs = 0;
  withShare.forEach((m) => {
    if (PUSH_GROUPS.has(m.group)) push += m.reps;
    if (PULL_GROUPS.has(m.group)) pull += m.reps;
    if (LEG_SHARE_GROUPS.has(m.group)) legs += m.reps;
  });
  const pp = push + pull;
  return {
    total,
    muscles: withShare,
    pushReps: Math.round(push),
    pullReps: Math.round(pull),
    legReps: Math.round(legs),
    pushPct: pp > 0 ? Math.round((push / pp) * 1000) / 10 : null,
    pullPct: pp > 0 ? Math.round((pull / pp) * 1000) / 10 : null,
    ratio: pull > 0 ? Math.round((push / pull) * 100) / 100 : null
  };
}

export function movementFamily(exId, name, getExerciseNameById) {
  const cls = classifyMovement({ id: exId, name }, getExerciseNameById);
  if (cls.isPushup) return 'pushup';
  if (cls.isPullup || cls.isPull) return 'pull';
  if (cls.isPush) return 'push';
  if (cls.isLeg) return 'legs';
  return 'other';
}

/**
 * Classe les baisses : exposition / performance / remplacement — jamais « régression » ici.
 */
export function classifyExerciseShifts(current, habit, getExerciseNameById) {
  const habitById = new Map((habit?.exercises || []).map((e) => [String(e.id), e]));
  const famNow = new Map();
  const famHabit = new Map();
  const addFam = (map, fam, reps) => map.set(fam, (map.get(fam) || 0) + reps);

  (current?.exercises || []).forEach((e) => {
    addFam(famNow, movementFamily(e.id, e.name, getExerciseNameById), e.reps);
  });
  (habit?.exercises || []).forEach((e) => {
    addFam(famHabit, movementFamily(e.id, e.name, getExerciseNameById), e.reps);
  });

  const exposureDrops = [];
  const performanceDrops = [];
  const replacements = [];
  const rising = [];

  (current?.exercises || []).forEach((e) => {
    const prev = habitById.get(String(e.id));
    const fam = movementFamily(e.id, e.name, getExerciseNameById);
    const famUp = (famNow.get(fam) || 0) > (famHabit.get(fam) || 0) * 1.08;
    const sessNow = e.sessions;
    const sessPrev = prev?.sessions ?? 0;
    const repsPrev = prev?.reps ?? 0;

    if (sessNow >= 2 && e.lastReps >= e.firstReps + 3) {
      rising.push(e);
    }

    if (prev && repsPrev >= 20 && e.reps <= repsPrev * 0.72) {
      if (sessPrev >= 2 && sessNow <= Math.max(1, sessPrev * 0.55)) {
        if (famUp) replacements.push({ ...e, fam, sessNow, sessPrev });
        else exposureDrops.push({ ...e, fam, sessNow, sessPrev, repsPrev });
      } else if (sessNow >= Math.max(2, sessPrev * 0.75) && e.lastReps <= e.firstReps - 6) {
        performanceDrops.push({ ...e, fam, sessNow, sessPrev, repsPrev });
      } else {
        exposureDrops.push({ ...e, fam, sessNow, sessPrev, repsPrev });
      }
    }
  });

  return { exposureDrops, performanceDrops, replacements, rising };
}

function candidateRow(row) {
  return {
    pillar: 'interpretation',
    novelty: 0.84,
    actionability: 0.7,
    severity: 0.25,
    ...row
  };
}

/**
 * @returns {import('./trainingRelationEngine.js').InterpretationCandidate[]}
 */
export function buildExposureInterpretationCandidates(opts = {}) {
  const {
    snapshot = {},
    window = null,
    period = '7d',
    getExerciseNameById = null,
    garminData = null,
    trainingState = null
  } = opts;

  const wins = deriveExposureWindows(period, window);
  if (!wins) return [];

  const current = summarizeExposure(snapshot, wins.current, getExerciseNameById, garminData);
  const habit = summarizeExposure(snapshot, wins.habit, getExerciseNameById, garminData);
  const longTerm = summarizeExposure(snapshot, wins.longTerm, getExerciseNameById, garminData);
  const nowLabel = periodPhrase(period, window);
  const beforeLabel = habitPhrase(period, wins.habitLen);
  const ctxBase = { ...(trainingState?.context || {}), period };

  const out = [];
  const currWeekRate = weeklyRate(current.sessions, wins.currentLen);
  const habitWeekRate = weeklyRate(habit.sessions, wins.habitLen);

  if (current.sessions + habit.sessions >= 2) {
    const rarer = habitWeekRate >= 2 && currWeekRate <= habitWeekRate * 0.65;
    const denser = currWeekRate >= 2 && habitWeekRate > 0 && currWeekRate >= habitWeekRate * 1.25;
    out.push(
      candidateRow({
        id: 'relation.exposure_rhythm',
        type: 'exposure_rhythm',
        horizon: 'short',
        state: 'exposure',
        evidence: [
          `${current.sessions} séances ${nowLabel}`,
          `${habit.sessions} séances ${beforeLabel}`
        ],
        metrics: {
          sessionsCurrent: current.sessions,
          sessionsHabit: habit.sessions,
          currWeekRate,
          habitWeekRate,
          avgExCurrent: current.avgExercisesPerSession,
          avgExHabit: habit.avgExercisesPerSession,
          totalRepsCurrent: current.totalReps,
          totalRepsHabit: habit.totalReps
        },
        confidence: current.sessions + habit.sessions >= 4 ? 0.82 : 0.68,
        relevance: rarer || denser ? 0.94 : 0.8,
        context: {
          ...ctxBase,
          nowLabel,
          beforeLabel,
          currentMuscles: topMusclesText(current.muscles, 3),
          habitMuscles: topMusclesText(habit.muscles, 3),
          rarer,
          denser
        }
      })
    );
  }

  const currM = current.muscles[0];
  const habitM = habit.muscles[0];
  if (currM && habitM && (current.totalReps >= 20 || habit.totalReps >= 40)) {
    const habitMatch = habit.muscles.find((m) => m.group === currM.group);
    const dropped = habit.muscles.filter((h) => !current.muscles.some((c) => c.group === h.group && c.reps >= 8));
    out.push(
      candidateRow({
        id: 'relation.muscle_coverage_shift',
        type: 'muscle_coverage_shift',
        horizon: wins.currentLen <= 10 ? 'short' : 'medium',
        state: 'muscle',
        evidence: [currM.label, habitM.label],
        metrics: {
          currentTopReps: currM.reps,
          habitSameReps: habitMatch?.reps ?? 0,
          droppedCount: dropped.length
        },
        confidence: 0.76,
        relevance: 0.88,
        context: {
          ...ctxBase,
          nowLabel,
          beforeLabel,
          currentList: topMusclesText(current.muscles, 4),
          habitList: topMusclesText(habit.muscles, 4),
          droppedLabels: dropped.slice(0, 3).map((d) => d.label).join(', ')
        }
      })
    );
  }

  const improving = current.exercises
    .filter((e) => e.sessions >= 2 && e.lastReps >= e.firstReps + 2)
    .slice(0, 4);
  const declining = current.exercises
    .filter((e) => e.sessions >= 2 && e.firstReps - e.lastReps >= 6)
    .slice(0, 4);

  if (improving.length) {
    out.push(
      candidateRow({
        id: 'relation.exercise_strengths',
        type: 'exercise_strengths',
        horizon: 'medium',
        state: 'exercise',
        evidence: improving.map((e) => e.name),
        metrics: { count: improving.length },
        confidence: 0.74,
        relevance: 0.86,
        context: {
          ...ctxBase,
          nowLabel,
          items: improving.map((e) => ({
            name: e.name,
            first: e.firstReps,
            last: e.lastReps,
            sessions: e.sessions
          }))
        }
      })
    );
  }

  if (declining.length) {
    const holding = current.exercises
      .filter((e) => e.sessions >= 2 && Math.abs(e.lastReps - e.firstReps) < 4)
      .slice(0, 3);
    out.push(
      candidateRow({
        id: 'relation.exercise_watchlist',
        type: 'exercise_watchlist',
        horizon: 'short',
        state: 'exercise',
        evidence: declining.map((e) => e.name),
        metrics: { count: declining.length },
        confidence: 0.72,
        relevance: 0.9,
        severity: 0.35,
        context: {
          ...ctxBase,
          nowLabel,
          items: declining.map((e) => ({
            name: e.name,
            first: e.firstReps,
            last: e.lastReps
          })),
          holdingNames: holding.map((e) => e.name)
        }
      })
    );
  }

  const longImproving = longTerm.exercises
    .filter((e) => e.sessions >= 4 && e.lastReps >= e.firstReps + 3)
    .slice(0, 3);
  const longFading = longTerm.exercises
    .filter((e) => e.sessions >= 4 && e.firstReps - e.lastReps >= 5)
    .slice(0, 3);

  if (longImproving.length || longFading.length) {
    out.push(
      candidateRow({
        id: 'relation.exercise_long_arc',
        type: 'exercise_long_arc',
        horizon: 'long',
        state: 'trajectory',
        evidence: [...longImproving, ...longFading].map((e) => e.name),
        metrics: {
          improving: longImproving.length,
          fading: longFading.length,
          longSessions: longTerm.sessions
        },
        confidence: 0.73,
        relevance: 0.85,
        context: {
          ...ctxBase,
          improving: longImproving.map((e) => `${e.name} (${e.firstReps} → ${e.lastReps} reps)`),
          fading: longFading.map((e) => `${e.name} (${e.firstReps} → ${e.lastReps} reps)`),
          longSessions: longTerm.sessions
        }
      })
    );
  }

  if (longTerm.muscles.length >= 2 && current.muscles.length >= 1 && wins.currentLen <= 35) {
    const longTop = longTerm.muscles[0];
    const currShare = current.muscles.find((m) => m.group === longTop.group);
    out.push(
      candidateRow({
        id: 'relation.muscle_vs_quarter',
        type: 'muscle_vs_quarter',
        horizon: 'long',
        state: 'muscle',
        evidence: [longTop.label],
        metrics: {
          longTopReps: longTop.reps,
          currentSameReps: currShare?.reps ?? 0
        },
        confidence: 0.7,
        relevance: 0.8,
        context: {
          ...ctxBase,
          nowLabel,
          longList: topMusclesText(longTerm.muscles, 4),
          currentList: topMusclesText(current.muscles, 3),
          longTop: longTop.label
        }
      })
    );
  }

  return out;
}
