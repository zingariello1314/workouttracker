/**
 * Robustesse des performances : PR isolé vs niveau établi vs outlier.
 */

import { collectCheckedExerciseRepHistory } from './recapAdaptiveInsights';

/** @typedef {'PR_EVENT'|'LEVEL_ESTABLISHED'|'LEVEL_STABLE'|'OUTLIER'|null} PerformanceLevelKind */

function stdDev(nums) {
  const v = nums.filter((n) => Number.isFinite(n));
  if (v.length < 2) return 0;
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / v.length);
}

/**
 * @param {{ date: string, reps: number }[]} sessions
 * @returns {{ kind: PerformanceLevelKind, maxReps: number|null, stableBand: number|null, confidence: number, evidence: string[] }}
 */
export function classifyExercisePerformanceLevel(sessions) {
  if (!sessions?.length) {
    return { kind: null, maxReps: null, stableBand: null, confidence: 0, evidence: [] };
  }

  const reps = sessions.map((s) => s.reps);
  const maxReps = Math.max(...reps);
  const last = sessions[sessions.length - 1];
  const tail = reps.slice(-Math.min(6, reps.length));
  const sd = stdDev(tail);
  const mean = tail.reduce((a, b) => a + b, 0) / tail.length;
  const evidence = [];

  const nearMaxCount = tail.filter((r) => r >= maxReps - 1).length;
  const priorMax = sessions.length >= 2
    ? Math.max(...sessions.slice(0, -1).map((s) => s.reps))
    : 0;

  if (last.reps > priorMax && priorMax > 0 && last.reps - priorMax >= 1) {
    if (sd > Math.max(2, mean * 0.18) && nearMaxCount <= 1) {
      evidence.push(`pic isolé ${last.reps} reps (écart-type élevé sur les dernières séances)`);
      return { kind: 'OUTLIER', maxReps: last.reps, stableBand: sd, confidence: 0.72, evidence };
    }
    evidence.push(`record ${priorMax} → ${last.reps} reps`);
    return { kind: 'PR_EVENT', maxReps: last.reps, stableBand: sd, confidence: 0.8, evidence };
  }

  if (nearMaxCount >= 3 && sd <= Math.max(1.5, mean * 0.08)) {
    evidence.push(`niveau ~${Math.round(mean)} reps stabilisé sur ${nearMaxCount} séances récentes`);
    return { kind: 'LEVEL_ESTABLISHED', maxReps, stableBand: sd, confidence: 0.85, evidence };
  }

  if (tail.length >= 3 && sd <= Math.max(2, mean * 0.12)) {
    evidence.push(`performances stables (~${Math.round(mean)} reps ±${Math.round(sd)})`);
    return { kind: 'LEVEL_STABLE', maxReps, stableBand: sd, confidence: 0.7, evidence };
  }

  return { kind: null, maxReps, stableBand: sd, confidence: 0.4, evidence };
}

/**
 * @param {object} opts
 * @returns {Array<{ exerciseId: string, exerciseName: string, kind: PerformanceLevelKind, confidence: number, evidence: string[], maxReps: number|null }>}
 */
export function analyzePerformanceRobustness(opts = {}) {
  const { snapshot, window, getExerciseNameById = null } = opts;
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  const out = [];

  for (const [exId, sessions] of byEx) {
    if (!sessions || sessions.length < 2) continue;
    const row = classifyExercisePerformanceLevel(sessions);
    if (!row.kind) continue;
    let exerciseName = `Exercice ${exId}`;
    if (typeof getExerciseNameById === 'function') {
      const n = parseInt(String(exId), 10);
      if (Number.isFinite(n)) {
        const label = getExerciseNameById(n);
        if (label?.trim()) exerciseName = label.trim();
      }
    }
    out.push({
      exerciseId: exId,
      exerciseName,
      kind: row.kind,
      confidence: row.confidence,
      evidence: row.evidence,
      maxReps: row.maxReps
    });
  }

  return out.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}

export function topRobustnessKind(robustnessRows, kind) {
  return (robustnessRows || []).find((r) => r.kind === kind) || null;
}
