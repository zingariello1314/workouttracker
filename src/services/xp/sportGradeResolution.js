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

export const VOIE_E_MIN_PCT = 70;
export const VOIE_E_MIN_PCT_PENULTIMATE = 80;
export const VOIE_E_MIN_PCT_FINAL = 90;

const PENULTIMATE_GATE_IDS = new Set(['olympien']);
const FINAL_GATE_IDS = new Set(['parangon']);

export function gateTierForGate(gate) {
  if (!gate?.toGradeId) return 'standard';
  if (FINAL_GATE_IDS.has(gate.toGradeId)) return 'final';
  if (PENULTIMATE_GATE_IDS.has(gate.toGradeId)) return 'penultimate';
  return 'standard';
}

export function pathEThresholdPctForGate(gate) {
  const tier = gateTierForGate(gate);
  if (tier === 'final') return VOIE_E_MIN_PCT_FINAL;
  if (tier === 'penultimate') return VOIE_E_MIN_PCT_PENULTIMATE;
  return VOIE_E_MIN_PCT;
}

export function pathsRequiredForGate(gate) {
  const tier = gateTierForGate(gate);
  if (tier === 'final') return 4;
  if (tier === 'penultimate') return 2;
  return 1;
}

function buildPathStates(gate, masteryScore, aggregates, workoutData) {
  const agg = aggregates || {};
  const m = Number(masteryScore) || 0;
  const sessionsOk = sessionsMeetMinutesMin(workoutData, gate.minutesMin);
  return {
    A: {
      label: 'Maîtrise',
      current: m,
      target: gate.masteryMin,
      pct: gate.masteryMin ? Math.min(100, (m / gate.masteryMin) * 100) : 0,
      met: m >= gate.masteryMin
    },
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
  };
}

export function gatePassed(gate, masteryScore, aggregates, workoutData) {
  if (!gate) return { ok: false, path: null };

  const paths = buildPathStates(gate, masteryScore, aggregates, workoutData);
  const tier = gateTierForGate(gate);
  const pathKeys = ['A', 'B', 'C', 'D'];
  const countFull = pathKeys.filter((k) => paths[k].met).length;
  const minPct = Math.min(...pathKeys.map((k) => paths[k].pct ?? 0));
  const pathEThreshold = pathEThresholdPctForGate(gate);

  if (tier === 'standard') {
    for (const k of pathKeys) {
      if (paths[k].met) return { ok: true, path: k };
    }
    if (minPct >= pathEThreshold) return { ok: true, path: 'E' };
    return { ok: false, path: null };
  }

  if (tier === 'penultimate') {
    if (countFull >= 2) return { ok: true, path: 'multi' };
    if (minPct >= pathEThreshold) return { ok: true, path: 'E' };
    return { ok: false, path: null };
  }

  if (tier === 'final') {
    if (countFull >= 4) return { ok: true, path: 'all' };
    if (minPct >= pathEThreshold) return { ok: true, path: 'E' };
    return { ok: false, path: null };
  }

  return { ok: false, path: null };
}

export function evaluateGateProgress(gate, masteryScore, aggregates, workoutData) {
  if (!gate) return null;
  const paths = buildPathStates(gate, masteryScore, aggregates, workoutData);
  const pathKeys = ['A', 'B', 'C', 'D'];
  const pathsFullCount = pathKeys.filter((k) => paths[k].met).length;
  const minPathPct = Math.min(...pathKeys.map((k) => paths[k].pct ?? 0));
  const pathEThresholdPct = pathEThresholdPctForGate(gate);
  const pathsRequired = pathsRequiredForGate(gate);
  const tier = gateTierForGate(gate);

  return {
    gate,
    tier,
    paths,
    pathsFullCount,
    pathsRequired,
    pathEThresholdPct,
    minPathPct,
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
