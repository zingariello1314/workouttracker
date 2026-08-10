/**
 * Résolution grade progression vs grade mérité.
 */

import {
  SPORT_GRADE_IDS,
  SPORT_GRADE_GATES,
  progressionTierFromLevel,
  maxTierInGradeForLevel,
  gateForGradeId
} from './sportGradeCatalog';
import { sessionsMeetMinutesMin } from './sportActivityAggregates';

export function gatePassed(gate, masteryScore, aggregates, workoutData) {
  if (!gate) return false;
  const m = Number(masteryScore) || 0;
  const agg = aggregates || {};
  if (m >= gate.masteryMin) return { ok: true, path: 'A' };
  const sessionsOk = sessionsMeetMinutesMin(workoutData, gate.minutesMin);
  if (sessionsOk >= gate.sessionsMin) {
    return { ok: true, path: 'B' };
  }
  if ((agg.lifetimeReps ?? 0) >= gate.repsMin) return { ok: true, path: 'C' };
  if ((agg.lifetimeActiveKcal ?? 0) >= gate.kcalMin) return { ok: true, path: 'D' };
  const f = 0.7;
  if (
    m >= gate.masteryMin * f &&
    sessionsOk >= gate.sessionsMin * f &&
    (agg.lifetimeReps ?? 0) >= gate.repsMin * f &&
    (agg.lifetimeActiveKcal ?? 0) >= gate.kcalMin * f
  ) {
    return { ok: true, path: 'E' };
  }
  return { ok: false, path: null };
}

export function evaluateGateProgress(gate, masteryScore, aggregates, workoutData) {
  if (!gate) return null;
  const agg = aggregates || {};
  const m = Number(masteryScore) || 0;
  const sessionsOk = sessionsMeetMinutesMin(workoutData, gate.minutesMin);
  return {
    gate,
    paths: {
      A: { label: 'Maîtrise', current: m, target: gate.masteryMin, pct: gate.masteryMin ? Math.min(100, (m / gate.masteryMin) * 100) : 0, met: m >= gate.masteryMin },
      B: {
        label: 'Séances qualifiées',
        current: sessionsOk,
        target: gate.sessionsMin,
        pct: gate.sessionsMin ? Math.min(100, (sessionsOk / gate.sessionsMin) * 100) : 0,
        met: sessionsOk >= gate.sessionsMin
      },
      C: {
        label: 'Reps cumulées',
        current: agg.lifetimeReps ?? 0,
        target: gate.repsMin,
        pct: gate.repsMin ? Math.min(100, ((agg.lifetimeReps ?? 0) / gate.repsMin) * 100) : 0,
        met: (agg.lifetimeReps ?? 0) >= gate.repsMin
      },
      D: {
        label: 'kcal actives',
        current: agg.lifetimeActiveKcal ?? 0,
        target: gate.kcalMin,
        pct: gate.kcalMin ? Math.min(100, ((agg.lifetimeActiveKcal ?? 0) / gate.kcalMin) * 100) : 0,
        met: (agg.lifetimeActiveKcal ?? 0) >= gate.kcalMin
      }
    },
    passed: gatePassed(gate, masteryScore, aggregates, workoutData)
  };
}

export function resolveSportGrades({ level, masteryScore, aggregates, workoutData }) {
  const progression = progressionTierFromLevel(level);

  let meritedGradeIndex = 0;
  const gateHistory = [];

  for (let i = 0; i < SPORT_GRADE_GATES.length; i += 1) {
    const gate = SPORT_GRADE_GATES[i];
    const gradeIdx = SPORT_GRADE_IDS.indexOf(gate.toGradeId);
    if (gradeIdx < 0) continue;
    if (level < gate.levelMin) break;
    const result = gatePassed(gate, masteryScore, aggregates, workoutData);
    gateHistory.push({
      toGradeId: gate.toGradeId,
      levelMin: gate.levelMin,
      passed: result.ok,
      path: result.path
    });
    if (result.ok) {
      meritedGradeIndex = gradeIdx;
    } else {
      break;
    }
  }

  const meritedGradeId = SPORT_GRADE_IDS[meritedGradeIndex];
  const meritedTier = maxTierInGradeForLevel(meritedGradeId, level);

  const nextGradeId =
    meritedGradeIndex < SPORT_GRADE_IDS.length - 1
      ? SPORT_GRADE_IDS[meritedGradeIndex + 1]
      : null;
  const nextGate = nextGradeId ? gateForGradeId(nextGradeId) : null;

  return {
    progression: {
      gradeId: progression.gradeId,
      tier: progression.tier,
      levelMin: progression.levelMin
    },
    merited: {
      gradeId: meritedGradeId,
      tier: meritedTier
    },
    gateHistory,
    nextGate,
    nextGateProgress: nextGate
      ? evaluateGateProgress(nextGate, masteryScore, aggregates, workoutData)
      : null
  };
}
