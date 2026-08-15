/**
 * Couche d'état utilisateur pour le Récap Analyse.
 * Transforme données brutes + enrichment + assessment en axes interprétables.
 */

import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import { computeProgressionInsights } from './volumeProgressionEngine';
import { computeWindowHalfTrend } from './strengthBenchmarkExtractors';
import { acuteChronicRepsRatio, garminStatsForWindow } from './recapInsightHelpers';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { computeRepsWeeklyVelocity } from './trainingProgressionVelocity';

/** @typedef {'rising'|'stable'|'falling'|'unknown'} TrendDir */
/** @typedef {'high'|'medium'|'low'|'unknown'} LevelBand */

/**
 * @typedef {object} StateAxis
 * @property {string} value
 * @property {TrendDir} trend
 * @property {number} confidence — 0–1
 * @property {string[]} evidence
 * @property {Record<string, number|null>} metrics
 */

/**
 * @typedef {object} UserTrainingState
 * @property {StateAxis} load
 * @property {StateAxis} adherence
 * @property {StateAxis} performance
 * @property {StateAxis} recovery
 * @property {StateAxis} fatigue
 * @property {StateAxis} programResponse
 * @property {string|null} lifePhase
 * @property {{ goal: string|null, tier: string|null }} context
 * @property {Record<string, number|null>} features — signaux bruts normalisés
 */

function axis(value, trend, confidence, evidence = [], metrics = {}) {
  return {
    value,
    trend: trend || 'unknown',
    confidence: Math.max(0, Math.min(1, confidence)),
    evidence,
    metrics
  };
}

function classifyTrendFromPct(deltaPct, up = 8, down = -8) {
  if (deltaPct == null || !Number.isFinite(deltaPct)) return 'unknown';
  if (deltaPct >= up) return 'rising';
  if (deltaPct <= down) return 'falling';
  return 'stable';
}

function avgOf(values) {
  const v = values.filter((x) => x != null && Number.isFinite(x));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function halfSeriesTrend(series) {
  if (!Array.isArray(series) || series.length < 4) return { trend: 'unknown', deltaPct: null };
  const pts = series
    .filter((p) => p?.value != null && Number.isFinite(p.value) && p.value > 0)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  if (pts.length < 4) return { trend: 'unknown', deltaPct: null };
  const mid = Math.floor(pts.length / 2);
  const first = avgOf(pts.slice(0, mid).map((p) => p.value));
  const second = avgOf(pts.slice(mid).map((p) => p.value));
  if (first == null || second == null || first <= 0) {
    return { trend: 'unknown', deltaPct: null };
  }
  const deltaPct = Math.round(((second - first) / first) * 100);
  return { trend: classifyTrendFromPct(deltaPct, 5, -5), deltaPct, first, second };
}

function collectTrainingDates(snapshot, window) {
  const dates = new Set();
  const addKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((k) => {
      const d = k.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d) && isDateInRecapWindow(d, window)) dates.add(d);
    });
  };
  addKeys(snapshot?.checkedExercises);
  Object.values(snapshot?.enduranceData?.sessions || {}).forEach((list) => {
    if (!Array.isArray(list)) return;
    list.forEach((s) => {
      const d = String(s?.date || '').slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d) && isDateInRecapWindow(d, window)) dates.add(d);
    });
  });
  return [...dates].sort();
}

function detectLifePhase({ trainingDates, assessment, progressionInsights, loadAxis }) {
  if (assessment?.tenureDays != null && assessment.tenureDays < 45) return 'DEVELOPING';
  if (assessment?.tier === 'Débutant') return 'BEGINNER';

  if (trainingDates.length >= 3) {
    let maxGap = 0;
    for (let i = 1; i < trainingDates.length; i += 1) {
      const prev = new Date(`${trainingDates[i - 1]}T12:00:00`);
      const curr = new Date(`${trainingDates[i]}T12:00:00`);
      const gap = Math.round((curr - prev) / 86400000) - 1;
      if (gap > maxGap) maxGap = gap;
    }
    const recentCut = trainingDates[trainingDates.length - 1];
    const recentStart = trainingDates.find((d) => {
      const end = new Date(`${recentCut}T12:00:00`);
      const cur = new Date(`${d}T12:00:00`);
      return (end - cur) / 86400000 <= 21;
    });
    if (maxGap >= 18 && recentStart) return 'RETURNING';
  }

  const stalls = (progressionInsights || []).filter((i) => i.progressionType === 'stall').length;
  const regressions = (progressionInsights || []).filter((i) => i.progressionType === 'regression').length;
  const positives = (progressionInsights || []).filter((i) =>
    ['strength', 'hypertrophy', 'volume', 'technical'].includes(i.progressionType)
  ).length;
  if (stalls >= 2 && positives === 0 && regressions === 0) return 'PLATEAU';
  if (loadAxis.trend === 'rising' && loadAxis.metrics?.priorTrend === 'falling') return 'REBUILDING';

  return null;
}

function aggregatePerformance(progressionInsights, assessment) {
  const improving = (progressionInsights || []).filter((i) =>
    ['strength', 'hypertrophy', 'volume', 'technical'].includes(i.progressionType)
  );
  const declining = (progressionInsights || []).filter((i) =>
    ['regression', 'fatigue_accumulated'].includes(i.progressionType)
  );
  const stalls = (progressionInsights || []).filter((i) => i.progressionType === 'stall');

  const evidence = [];
  const metrics = {
    improvingCount: improving.length,
    decliningCount: declining.length,
    stallCount: stalls.length,
    repsMomentumRatio: assessment?.repsMomentumRatio ?? null
  };

  let trend = 'unknown';
  let value = 'unknown';
  let confidence = 0.35;

  if (improving.length > declining.length && improving.length >= 1) {
    trend = 'rising';
    value = improving.length >= 2 ? 'improving' : 'slightly_improving';
    confidence = Math.min(0.92, 0.55 + improving.length * 0.12);
    evidence.push(`${improving.length} exercice(s) en progression récente`);
  } else if (declining.length > improving.length && declining.length >= 1) {
    trend = 'falling';
    value = 'declining';
    confidence = Math.min(0.9, 0.5 + declining.length * 0.14);
    evidence.push(`${declining.length} exercice(s) en baisse récente`);
  } else if (stalls.length >= 2) {
    trend = 'stable';
    value = 'stable';
    confidence = 0.72;
    evidence.push('performances stables sur plusieurs exercices');
  }

  const mom = assessment?.repsMomentumRatio;
  if (mom != null && Number.isFinite(mom)) {
    if (mom >= 1.1 && trend !== 'falling') {
      trend = trend === 'unknown' ? 'rising' : trend;
      value = value === 'unknown' ? 'improving' : value;
      confidence = Math.max(confidence, 0.62);
      evidence.push(`momentum reps +${Math.round((mom - 1) * 100)} % vs période précédente`);
      metrics.repsMomentumDeltaPct = Math.round((mom - 1) * 100);
    } else if (mom <= 0.9 && trend !== 'rising') {
      trend = trend === 'unknown' ? 'falling' : trend;
      value = value === 'unknown' ? 'declining' : value;
      confidence = Math.max(confidence, 0.58);
      evidence.push(`momentum reps ${Math.round((mom - 1) * 100)} % vs période précédente`);
      metrics.repsMomentumDeltaPct = Math.round((mom - 1) * 100);
    }
  }

  return axis(value, trend, confidence, evidence, metrics);
}

function deriveProgramResponse(load, performance, recovery, fatigue) {
  const evidence = [];
  let value = 'uncertain';
  let confidence = 0.4;

  if (load.trend === 'rising' && ['rising', 'stable', 'slightly_improving'].includes(performance.value)) {
    value = recovery.value === 'insufficient' || fatigue.value === 'high' ? 'adapting_with_strain' : 'adapting';
    confidence = Math.min(load.confidence, performance.confidence) * 0.9;
    evidence.push('charge en hausse avec performance tenue ou en progrès');
  } else if (load.trend === 'rising' && performance.value === 'declining') {
    value = 'regressing';
    confidence = Math.min(load.confidence, performance.confidence) * 0.88;
    evidence.push('charge en hausse mais performance en baisse');
  } else if (load.trend === 'stable' && performance.trend === 'rising') {
    value = 'efficient';
    confidence = Math.min(0.85, performance.confidence);
    evidence.push('progression sans surcharge de volume');
  } else if (load.trend === 'falling' && performance.trend === 'stable') {
    value = 'deloading';
    confidence = 0.65;
    evidence.push('volume en baisse, performances maintenues');
  }

  return axis(value, performance.trend, confidence, evidence, {
    loadTrend: null,
    performanceTrend: null
  });
}

/**
 * @param {object} opts
 * @returns {UserTrainingState|null}
 */
export function buildUserTrainingState(opts = {}) {
  const {
    snapshot = {},
    window = null,
    enrichment = null,
    assessment = null,
    garminPartial = null,
    garminDailyMetrics = null,
    getExerciseNameById = null,
    profileQuestionnaireRaw = null
  } = opts;

  if (!window?.end) return null;

  const profile = normalizeProfileQuestionnaire(profileQuestionnaireRaw);
  const answers = profile?.answers || {};
  const goal = answers.goalPhysique || answers.streetSkillGoal || null;
  const tier = assessment?.tier || null;

  const halfTrend = computeWindowHalfTrend(snapshot, window);
  const acuteLoad = acuteChronicRepsRatio(snapshot, window);
  const loadDeltaPct =
    halfTrend != null
      ? halfTrend.volFirst > 0 || halfTrend.volSecond > 0
        ? halfTrend.volDeltaPct
        : halfTrend.repsDeltaPct
      : acuteLoad?.ratio != null
        ? Math.round((acuteLoad.ratio - 1) * 100)
        : null;

  let loadTrend = classifyTrendFromPct(loadDeltaPct);
  if (loadTrend === 'unknown' && acuteLoad?.ratio != null) {
    if (acuteLoad.ratio >= 1.15) loadTrend = 'rising';
    else if (acuteLoad.ratio <= 0.85) loadTrend = 'falling';
    else loadTrend = 'stable';
  }

  const loadEvidence = [];
  if (loadDeltaPct != null) loadEvidence.push(`volume ${loadDeltaPct >= 0 ? '+' : ''}${loadDeltaPct} %`);
  if (acuteLoad?.ratio != null) {
    loadEvidence.push(`ratio aigu/chronique ${Math.round(acuteLoad.ratio * 100) / 100}`);
  }

  let loadValue = 'stable';
  if (loadTrend === 'rising') loadValue = loadDeltaPct != null && loadDeltaPct >= 20 ? 'high_rising' : 'rising';
  else if (loadTrend === 'falling') loadValue = 'falling';

  const load = axis(loadValue, loadTrend, loadEvidence.length ? 0.78 : 0.35, loadEvidence, {
    deltaPct: loadDeltaPct,
    acuteChronicRatio: acuteLoad?.ratio ?? null
  });

  const programRatio = assessment?.programCompletion28?.ratio;
  const regularity = assessment?.regularityScore;
  const sla = assessment?.sessionLoadAlignment28?.avgScore0to100;
  const adherenceEvidence = [];
  let adherenceValue = 'unknown';
  let adherenceConf = 0.35;

  if (programRatio != null) {
    adherenceEvidence.push(`complétion programme ~${Math.round(programRatio * 100)} %`);
    if (programRatio >= 0.75) adherenceValue = 'high';
    else if (programRatio >= 0.5) adherenceValue = 'medium';
    else adherenceValue = 'low';
    adherenceConf = 0.72;
  } else if (regularity != null) {
    adherenceEvidence.push(`régularité ${Math.round(regularity * 100)} %`);
    if (regularity >= 0.65) adherenceValue = 'high';
    else if (regularity >= 0.4) adherenceValue = 'medium';
    else adherenceValue = 'low';
    adherenceConf = 0.62;
  }
  if (sla != null && assessment?.sessionLoadAlignment28?.sessionDaysScored >= 3) {
    adherenceEvidence.push(`alignement séance ${Math.round(sla)}/100`);
    adherenceConf = Math.max(adherenceConf, 0.68);
  }

  const adherence = axis(adherenceValue, 'unknown', adherenceConf, adherenceEvidence, {
    programRatio: programRatio ?? null,
    regularity: regularity ?? null,
    sessionAlignment: sla ?? null
  });

  const progressionInsights = computeProgressionInsights(snapshot, window, getExerciseNameById);
  const performance = aggregatePerformance(progressionInsights, assessment);
  const repsVelocity = computeRepsWeeklyVelocity(snapshot, window);

  if (repsVelocity.velocityPerWeek != null && performance.trend === 'unknown') {
    if (repsVelocity.velocityPerWeek >= 8) {
      performance.trend = 'rising';
      performance.value = performance.value === 'unknown' ? 'improving' : performance.value;
      performance.confidence = Math.max(performance.confidence, repsVelocity.confidence * 0.9);
      performance.evidence.push(`vitesse reps ~+${repsVelocity.velocityPerWeek}/sem`);
    } else if (repsVelocity.velocityPerWeek <= -8) {
      performance.trend = 'falling';
      performance.value = performance.value === 'unknown' ? 'declining' : performance.value;
      performance.confidence = Math.max(performance.confidence, repsVelocity.confidence * 0.85);
      performance.evidence.push(`vitesse reps ~${repsVelocity.velocityPerWeek}/sem`);
    }
  }

  const g = enrichment?.garmin;
  const dm = garminDailyMetrics || garminPartial?.dailyMetrics;
  const gStats = garminStatsForWindow(dm, window);
  const sleepSeries = enrichment?.sleepDaily || [];
  const sleepHalf = halfSeriesTrend(sleepSeries);

  const recoveryEvidence = [];
  let recoveryValue = 'unknown';
  let recoveryTrend = 'unknown';
  let recoveryConf = 0.35;

  if (g?.avgSleepHours != null) {
    recoveryEvidence.push(`sommeil Garmin ~${g.avgSleepHours.toFixed(1)} h/j`);
    if (g.avgSleepHours >= 7) recoveryValue = 'sufficient';
    else if (g.avgSleepHours >= 6.2) recoveryValue = 'uncertain';
    else recoveryValue = 'insufficient';
    recoveryConf = Math.min(0.88, 0.55 + (g.daysWithSleep || 0) * 0.04);
  } else if (enrichment?.feedback?.sommeil != null) {
    recoveryEvidence.push(`sommeil ressenti ~${enrichment.feedback.sommeil}/10`);
    recoveryValue =
      enrichment.feedback.sommeil >= 7 ? 'sufficient' : enrichment.feedback.sommeil >= 5.5 ? 'uncertain' : 'insufficient';
    recoveryConf = 0.55;
  }

  if (sleepHalf.deltaPct != null) {
    recoveryTrend = sleepHalf.trend;
    recoveryEvidence.push(`sommeil ${sleepHalf.deltaPct >= 0 ? '+' : ''}${sleepHalf.deltaPct} % (2e vs 1re moitié)`);
    recoveryConf = Math.max(recoveryConf, 0.62);
    if (sleepHalf.trend === 'falling' && recoveryValue === 'sufficient') recoveryValue = 'uncertain';
    if (sleepHalf.trend === 'falling' && recoveryValue === 'uncertain') recoveryValue = 'insufficient';
  }

  if (gStats?.avgStress28 != null && gStats.stressSampleDays >= 4 && gStats.avgStress28 >= 48) {
    recoveryEvidence.push(`stress Garmin ~${gStats.avgStress28}/100`);
    if (recoveryValue === 'sufficient') recoveryValue = 'uncertain';
    recoveryConf = Math.max(recoveryConf, 0.6);
  }

  const recovery = axis(recoveryValue, recoveryTrend, recoveryConf, recoveryEvidence, {
    sleepDeltaPct: sleepHalf.deltaPct,
    avgSleepHours: g?.avgSleepHours ?? null
  });

  const fb = enrichment?.feedback;
  const diffHalf = halfSeriesTrend(fb?.difficulteSeries || []);
  const fatigueEvidence = [];
  let fatigueValue = 'unknown';
  let fatigueTrend = diffHalf.trend;
  let fatigueConf = 0.35;

  if (fb?.difficulte != null && fb.count >= 2) {
    fatigueEvidence.push(`difficulté ressentie ~${fb.difficulte}/10`);
    if (fb.difficulte >= 7.5) fatigueValue = 'high';
    else if (fb.difficulte >= 5.5) fatigueValue = 'moderate';
    else fatigueValue = 'low';
    fatigueConf = Math.min(0.85, 0.5 + fb.count * 0.06);
  }
  if (diffHalf.deltaPct != null && fb?.count >= 3) {
    fatigueEvidence.push(`difficulté ${diffHalf.deltaPct >= 0 ? '+' : ''}${diffHalf.deltaPct} % récemment`);
    fatigueConf = Math.max(fatigueConf, 0.68);
    if (diffHalf.trend === 'rising' && fatigueValue === 'moderate') fatigueValue = 'high';
  }

  const fatigue = axis(fatigueValue, fatigueTrend, fatigueConf, fatigueEvidence, {
    difficultyDeltaPct: diffHalf.deltaPct,
    avgDifficulty: fb?.difficulte ?? null
  });

  const programResponse = deriveProgramResponse(load, performance, recovery, fatigue);

  const trainingDates = collectTrainingDates(snapshot, window);
  const lifePhase = detectLifePhase({
    trainingDates,
    assessment,
    progressionInsights,
    loadAxis: load
  });

  const volDelta = loadDeltaPct;
  const perfDelta = performance.metrics.repsMomentumDeltaPct ?? null;
  let progressionEfficiency = null;
  let adaptationCost = 'unknown';
  if (volDelta != null && perfDelta != null && Math.abs(volDelta) >= 5) {
    progressionEfficiency = Math.round((perfDelta / Math.max(Math.abs(volDelta), 1)) * 100) / 100;
    if (progressionEfficiency >= 0.35) adaptationCost = 'low';
    else if (progressionEfficiency >= 0.08) adaptationCost = 'moderate';
    else adaptationCost = 'high';
  } else if (volDelta != null && volDelta >= 15 && performance.value === 'stable') {
    adaptationCost = 'high';
  } else if (volDelta != null && volDelta <= 5 && perfDelta != null && perfDelta >= 5) {
    adaptationCost = 'low';
  }

  return {
    load,
    adherence,
    performance,
    recovery,
    fatigue,
    programResponse,
    lifePhase,
    adaptationCost,
    context: { goal, tier },
    features: {
      volumeDeltaPct: loadDeltaPct,
      performanceMomentumPct: performance.metrics.repsMomentumDeltaPct ?? null,
      sleepDeltaPct: sleepHalf.deltaPct,
      difficultyDeltaPct: diffHalf.deltaPct,
      programCompletionPct: programRatio != null ? Math.round(programRatio * 100) : null,
      acuteChronicRatio: acuteLoad?.ratio ?? null,
      progressionEfficiency,
      progressionVelocityPerWeek: repsVelocity.velocityPerWeek,
      progressionAcceleration: repsVelocity.acceleration
    }
  };
}

export { classifyTrendFromPct, halfSeriesTrend };
