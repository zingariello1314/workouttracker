/**
 * Coach live v5 — perturbation bornée (bande shadow), sans recalcul du global.
 */

import { scaleSeriesForProgressionPhase } from './quizProgression';
import { getLiveProgressionMeta } from './quizProgramWeek';
import { applyRepProgressionFromHistory } from './quizRepProgression';
import { compressExercisesForDay } from './quizDailyCompression';
import { resolveDailyCompression } from './quizDailyCompression';
import { resolveMissedSessionFallback } from './quizMissedSessionFallback';
import { computeLiveSessionAdjustment } from './quizGlobalLoadEngine';
import { buildUserWhyBullets } from './quizCoachDecisionTrace';
import { computeLiveBudgetAdjustment } from './quizWeeklyBudgetLive';

function scaleExerciseList(exercises, weekMeta) {
  if (!Array.isArray(exercises)) return exercises;
  return exercises.map((ex) => {
    const s = String(ex.series || '');
    if (!s || /min|sec|course/i.test(s)) return ex;
    const series = scaleSeriesForProgressionPhase(s, weekMeta);
    return series === s ? ex : { ...ex, series };
  });
}

function scaleBySessionFactor(exercises, sessionMul) {
  if (!Array.isArray(exercises) || sessionMul >= 0.995 && sessionMul <= 1.005) return exercises;
  return compressExercisesForDay(
    exercises.map((ex) => {
      const s = String(ex.series || '');
      if (!s || /min|sec|course/i.test(s)) return ex;
      const scaled = scaleSeriesForProgressionPhase(s, {
        volumeFactor: sessionMul,
        phase: 'live'
      });
      return scaled === s ? ex : { ...ex, series: scaled };
    }),
    sessionMul < 1 ? sessionMul : 1
  );
}

/**
 * @returns {{ exercises: object[], coachNotes: string[], liveTrace: object[] }}
 */
export function applyLiveCoachToExercises(exercises, opts = {}) {
  const { activeProgram, sessionYmd, snapshot, trainingEvidence } = opts;
  const notes = [];
  const liveTrace = [];

  if (!Array.isArray(exercises) || !activeProgram?.quizGenerationMeta || !sessionYmd) {
    return { exercises: exercises || [], coachNotes: notes, liveTrace };
  }

  const meta = activeProgram.quizGenerationMeta;
  const frozenGlobal =
    meta.globalLoad?.factor ?? meta.globalLoadFactor ?? meta.volumeResponseIndex ?? 1;
  const liveBand = meta.shadowValidation?.liveBand ?? { min: 0.85, max: 1.1, allowUplift: false };

  let list = exercises.map((ex) => ({ ...ex }));

  const weekMeta = getLiveProgressionMeta(activeProgram, sessionYmd);
  const liveBudget = computeLiveBudgetAdjustment({
    program: activeProgram,
    snapshot,
    sessionYmd,
    trainingEvidence
  });

  const effectiveVolumeFactor =
    (weekMeta.volumeFactor || 1) * (liveBudget.strengthVolumeMul || 1);
  const effectiveWeekMeta = {
    ...weekMeta,
    volumeFactor: Math.round(effectiveVolumeFactor * 1000) / 1000
  };

  if (
    effectiveWeekMeta.week > 1 ||
    (effectiveWeekMeta.volumeFactor && effectiveWeekMeta.volumeFactor < 0.995) ||
    (effectiveWeekMeta.volumeFactor && effectiveWeekMeta.volumeFactor > 1.005)
  ) {
    list = scaleExerciseList(list, effectiveWeekMeta);
    liveTrace.push({
      layer: 'cycle',
      key: 'week',
      value: effectiveWeekMeta.volumeFactor,
      reason: weekMeta.labelFr || `Semaine ${weekMeta.week}`
    });
  }

  if (liveBudget.adjustments?.length) {
    liveBudget.adjustments.forEach((adj) => {
      liveTrace.push({
        layer: 'live_budget',
        key: adj.action,
        value: adj.factor ?? adj.reasonFr,
        reason: adj.reasonFr
      });
    });
    if (liveBudget.summaryFr) notes.push(liveBudget.summaryFr);
  }

  const missed = resolveMissedSessionFallback(snapshot, activeProgram.schedule, sessionYmd);
  const daily = resolveDailyCompression(snapshot, sessionYmd, trainingEvidence);

  const liveAdj = computeLiveSessionAdjustment(frozenGlobal, {
    missedFactor: missed.factor,
    dailyFactor: daily.factor,
    dailyUpliftFactor: daily.upliftFactor,
    liveBand
  });
  liveTrace.push(...(liveAdj.trace || []));

  if (liveAdj.liveSessionMul < 0.995 || liveAdj.liveSessionMul > 1.005) {
    list = scaleBySessionFactor(list, liveAdj.liveSessionMul);
  }

  list = applyRepProgressionFromHistory(list, snapshot, sessionYmd);

  const causal = buildUserWhyBullets({ trace: liveTrace, summaryFr: null }, liveTrace);
  causal.slice(0, 2).forEach((c) => notes.push(c));

  return { exercises: list, coachNotes: notes.slice(0, 3), liveTrace };
}

export function formatLiveCoachBanner(coachNotes) {
  if (!Array.isArray(coachNotes) || !coachNotes.length) return null;
  return coachNotes[0];
}

