/**
 * Agrégateur pur pour le panneau « coach transversal » Récap (~28 j, locale).
 * Compose le résultat de computeRecapUserAssessment avec nutrition partielle et nutritionPlanChecks.
 */

import DateHelper from '../dateHelper';
import { aggregateLiftVolumeKgByDate } from '../exerciseLoadVolume';
import { buildTotalStrengthRepsByDate } from './recapDailyChartData';
import {
  countUniqueDaysWithActivityInWindow,
  deriveJourneyStartYmd,
  deriveLastActivityYmd,
  parseCheckedExerciseDatePrefix
} from './recapUserAssessment';
import { buildWeightByDateMap, getLatestWeightSnapshot } from './recapAssessmentSeries';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import { computeCardioBiasMultiplier } from '../../features/profileQuestionnaire/quizInfluence';

/** @typedef {'loading'|'ready'|'skipped'} NutritionBundleStatus */

/**
 * Somme volumes kg×reps sur une fenêtre inclusive YYYY-MM-DD.
 */
export function sumLiftVolumeKgBetween(map, startYmd, endYmd) {
  let s = 0;
  if (!(map instanceof Map)) return 0;
  map.forEach((v, k) => {
    if (k >= startYmd && k <= endYmd && Number(v) > 0) s += Number(v);
  });
  return s;
}

export function sumRepsBetween(repMap, startYmd, endYmd) {
  let s = 0;
  if (!(repMap instanceof Map)) return 0;
  repMap.forEach((v, k) => {
    if (k >= startYmd && k <= endYmd) s += Number(v) || 0;
  });
  return s;
}

function intersectRange(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return null;
  const s = aStart > bStart ? aStart : bStart;
  const e = aEnd < bEnd ? aEnd : bEnd;
  if (s > e) return null;
  return { startYmd: s, endYmd: e };
}

/**
 * Synthèse des coches « plan repas » stockées dans le snapshot synchrone.
 */
export function summarizeNutritionPlanChecks(snapshot, window28) {
  const npc = snapshot?.nutritionPlanChecks;
  const { startYmd, endYmd } = window28 || {};
  if (!npc || typeof npc !== 'object' || !startYmd || !endYmd) {
    return {
      daysWithAnyPlanCheck: 0,
      checkedLeafTotal: 0,
      streakDaysWithAnyCheckEndingToday: 0
    };
  }

  let checkedLeafTotal = 0;
  let daysWithAnyPlanCheck = 0;

  const range = DateHelper.getDateRange(startYmd, endYmd);
  range.forEach((day) => {
    const dayObj = npc[day];
    let any = false;
    const leaf = (node) => {
      if (!node || typeof node !== 'object') return;
      if (typeof node.checked === 'boolean') {
        if (node.checked) {
          checkedLeafTotal += 1;
          any = true;
        }
        return;
      }
      Object.keys(node).forEach((k) => leaf(node[k]));
    };
    if (dayObj && typeof dayObj === 'object') leaf(dayObj);
    if (any) daysWithAnyPlanCheck += 1;
  });

  let streak = 0;
  let d = endYmd;
  while (DateHelper.isAfterOrEqual(d, startYmd)) {
    const dayObj = npc[d];
    let ok = false;
    const leaf2 = (node) => {
      if (!node || typeof node !== 'object') return;
      if (typeof node.checked === 'boolean') {
        if (node.checked) ok = true;
        return;
      }
      Object.keys(node).forEach((k) => leaf2(node[k]));
    };
    if (dayObj && typeof dayObj === 'object') leaf2(dayObj);
    if (ok) streak += 1;
    else break;
    d = DateHelper.addDays(d, -1);
  }

  return {
    daysWithAnyPlanCheck,
    checkedLeafTotal,
    streakDaysWithAnyCheckEndingToday: streak
  };
}

function coachToNum(v) {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : null;
  }
  if (typeof v === 'object') {
    if (v.value != null) return coachToNum(v.value);
    if (v.avg != null) return coachToNum(v.avg);
    if (v.average != null) return coachToNum(v.average);
    if (v.total != null) return coachToNum(v.total);
  }
  return null;
}

function coachStressFromDay(stress) {
  if (stress == null) return null;
  if (typeof stress === 'number' && Number.isFinite(stress)) return stress;
  if (typeof stress === 'object') {
    const a =
      coachToNum(stress.average) ??
      coachToNum(stress.avg) ??
      coachToNum(stress.avgStressLevel) ??
      coachToNum(stress.value);
    return a;
  }
  return null;
}

/** Durée sommeil en heures si possible (durée brute souvent en minutes côté Garmin). */
export function coachSleepHours(rawSleep) {
  if (!rawSleep || typeof rawSleep !== 'object') return null;
  const dur = coachToNum(rawSleep.duration ?? rawSleep.totalSleep ?? rawSleep.totalMinutes);
  if (dur == null || dur <= 0) return null;
  if (dur > 48) return dur / 60;
  if (dur > 24) return dur / 60;
  return dur;
}

export function countDistinctCheckedExerciseIds28(snapshot, startYmd, endYmd) {
  const set = new Set();
  const checked = snapshot?.checkedExercises || {};
  Object.keys(checked).forEach((k) => {
    if (!checked[k]) return;
    const d = parseCheckedExerciseDatePrefix(k);
    if (!d || d < startYmd || d > endYmd) return;
    const m = String(k).match(/^(\d{4}-\d{2}-\d{2})_(.+)$/);
    if (!m) return;
    const tail = String(m[2]);
    const idPart = tail.split('_')[0];
    if (!/^\d+$/.test(idPart)) return;
    set.add(idPart);
  });
  return set.size;
}

/** Delta poids (dernière − première mesure) sur les 7 derniers j calendaires finissant endYmd. */
export function computeWeightDelta7FromSnapshot(snapshot, endYmd) {
  const start7 = DateHelper.addDays(endYmd, -6);
  const m = buildWeightByDateMap(snapshot?.progressEntries);
  const pts = [];
  m.forEach((w, d) => {
    if (d >= start7 && d <= endYmd) pts.push({ d, w });
  });
  pts.sort((a, b) => a.d.localeCompare(b.d));
  if (pts.length < 2) return null;
  return Math.round((pts[pts.length - 1].w - pts[0].w) * 10) / 10;
}

/**
 * Synthèse légère Garmin sur [startYmd,endYmd] inclusive (pour panneau coach Récap).
 * @returns {object} champs utilisés par computeRecapCrossCoachInsights.
 */
export function computeGarminDailyStats(dailyMetrics, startYmd, endYmd) {
  const dm = dailyMetrics && typeof dailyMetrics === 'object' ? dailyMetrics : {};
  const range = DateHelper.getDateRange(startYmd, endYmd);

  let totalSteps28 = 0;
  let daysWithStepsData = 0;
  const stressVals = [];
  const sleepH = [];

  for (const d of range) {
    const day = dm[d];
    if (!day || typeof day !== 'object') continue;
    const stp = coachToNum(day.steps);
    if (stp != null && stp >= 0) {
      totalSteps28 += stp;
      daysWithStepsData += 1;
    }
    const s = coachStressFromDay(day.stress ?? day.stressLevel ?? day.avgStress);
    if (s != null && Number.isFinite(s)) stressVals.push(s);
    const sh = coachSleepHours(day.sleep);
    if (sh != null && sh > 0 && sh <= 24) sleepH.push(sh);
  }

  const segments = [];
  for (let w = 0; w < 4; w += 1) {
    const blockEnd = DateHelper.addDays(endYmd, -w * 7);
    const blockStart = DateHelper.addDays(blockEnd, -6);
    const hit = intersectRange(blockStart, blockEnd, startYmd, endYmd);
    if (!hit) {
      segments.push({ sumSteps: 0, daySpan: 0 });
      continue;
    }
    const dr = DateHelper.getDateRange(hit.startYmd, hit.endYmd);
    let sumSteps = 0;
    dr.forEach((d) => {
      const x = coachToNum(dm[d]?.steps);
      if (x != null && x >= 0) sumSteps += x;
    });
    segments.push({ sumSteps, daySpan: dr.length });
  }

  const currentSeg = segments[0];
  const priorSegs = segments.slice(1).filter((s) => s.daySpan >= 5);
  const avgPriorSteps =
    priorSegs.length > 0
      ? priorSegs.reduce((a, b) => a + b.sumSteps, 0) / priorSegs.length
      : null;
  const weekStepsTrendConfident =
    currentSeg &&
    currentSeg.daySpan >= 5 &&
    priorSegs.length >= 2 &&
    avgPriorSteps != null &&
    avgPriorSteps > 800;

  return {
    hasAnyGarminSignal:
      daysWithStepsData > 0 || stressVals.length > 0 || sleepH.length > 0,
    daysWithStepsData,
    totalSteps28: Math.round(totalSteps28),
    avgSteps28:
      daysWithStepsData > 0 ? Math.round(totalSteps28 / daysWithStepsData) : null,
    avgStress28:
      stressVals.length > 0
        ? Math.round((stressVals.reduce((a, b) => a + b, 0) / stressVals.length) * 10) / 10
        : null,
    stressSampleDays: stressVals.length,
    avgSleepHours28:
      sleepH.length > 0
        ? Math.round((sleepH.reduce((a, b) => a + b, 0) / sleepH.length) * 100) / 100
        : null,
    sleepSampleDays: sleepH.length,
    weekStepsCurrent: Math.round(currentSeg?.sumSteps ?? 0),
    avgPriorWeeksSteps:
      avgPriorSteps != null ? Math.round(avgPriorSteps) : null,
    weekStepsTrendConfident: Boolean(weekStepsTrendConfident)
  };
}

function weekSlices(endYmd, start28, segmentCount = 4) {
  /** segmentCount blocs de 7 jours en remontant depuis endYmd, intersectés avec [start28, endYmd]. */
  const slices = [];
  for (let w = 0; w < segmentCount; w += 1) {
    const blockEnd = DateHelper.addDays(endYmd, -w * 7);
    const blockStart = DateHelper.addDays(blockEnd, -6);
    const hit = intersectRange(blockStart, blockEnd, start28, endYmd);
    slices.push(hit);
  }
  return slices;
}

/**
 * @param {object} opts
 * @param {object} opts.snapshot
 * @param {object} opts.assessment résultat computeRecapUserAssessment
 * @param {object|null} [opts.activeProgram]
 * @param {{
 *   status: NutritionBundleStatus,
 *   daysWithLoggedMeals28?: number,
 *   avgComplianceScore?: number|null,
 *   meanPctCaloriesVsTarget?: number|null,
 *   calorieDeltaStdApprox?: number|null,
 *   programsOwnedCount?: number,
 * }} [opts.nutritionPartial]
 * @param {object|null} [opts.garminPartial]
 * @param {object|null} [opts.profileQuestionnaireRaw]
 */
export function buildRecapCrossCoachAggregate({
  snapshot = {},
  assessment,
  activeProgram = null,
  nutritionPartial = null,
  garminPartial = null,
  profileQuestionnaireRaw = null
}) {
  const endYmd = assessment?.window28?.endYmd || DateHelper.getTodayLocal();
  const start28 = assessment?.window28?.startYmd || DateHelper.addDays(endYmd, -27);
  const window28 = { startYmd: start28, endYmd };

  const liftMap = aggregateLiftVolumeKgByDate(snapshot);
  const repsMap = buildTotalStrengthRepsByDate(snapshot);

  const slices = weekSlices(endYmd, start28, 4);
  const segments = slices.map((r, idx) => {
    if (!r) {
      return { idx, startYmd: null, endYmd: null, activeDays: 0, liftVolumeSum: 0, repsSum: 0, daySpan: 0 };
    }
    const span =
      typeof DateHelper.daysBetween === 'function'
        ? (DateHelper.daysBetween(r.startYmd, r.endYmd) ?? 0) + 1
        : 7;
    return {
      idx,
      ...r,
      activeDays: countUniqueDaysWithActivityInWindow(snapshot, r.startYmd, r.endYmd),
      liftVolumeSum: Math.round(sumLiftVolumeKgBetween(liftMap, r.startYmd, r.endYmd)),
      repsSum: Math.round(sumRepsBetween(repsMap, r.startYmd, r.endYmd)),
      daySpan: span
    };
  });

  const currentSeg = segments[0];
  const priorSegs = segments.slice(1).filter((s) => s.startYmd != null);

  let avgPriorActiveDays =
    priorSegs.length > 0
      ? priorSegs.reduce((a, b) => a + b.activeDays, 0) / priorSegs.length
      : null;
  let avgPriorLift =
    priorSegs.length > 0
      ? priorSegs.reduce((a, b) => a + b.liftVolumeSum, 0) / priorSegs.length
      : null;
  let avgPriorReps =
    priorSegs.length > 0
      ? priorSegs.reduce((a, b) => a + b.repsSum, 0) / priorSegs.length
      : null;

  /** Confiance minimale pour comparatif textuel : bloc courant doit couvrir ≥5 j inclus dans fenêtre réelle. */
  const currentSpanDays = currentSeg?.daySpan || 0;
  const confidentWeekTrend =
    currentSeg &&
    priorSegs.length >= 2 &&
    currentSpanDays >= 5 &&
    priorSegs.filter((s) => s.daySpan >= 5).length >= 2;

  const planChecks = summarizeNutritionPlanChecks(snapshot, window28);
  const bodySnap = getLatestWeightSnapshot(snapshot?.progressEntries);

  const np = nutritionPartial || { status: 'skipped' };
  const gp = garminPartial || { status: 'skipped' };

  const firstActivityYmd = deriveJourneyStartYmd(snapshot);
  const lastActivityYmd = deriveLastActivityYmd(snapshot);
  let daysSinceLastActivity = null;
  if (lastActivityYmd && /^\d{4}-\d{2}-\d{2}$/.test(lastActivityYmd)) {
    const db = DateHelper.daysBetween(lastActivityYmd, endYmd);
    daysSinceLastActivity = db != null ? db : null;
  }

  const distinctExercises28 = countDistinctCheckedExerciseIds28(snapshot, start28, endYmd);
  const weightDelta7 = computeWeightDelta7FromSnapshot(snapshot, endYmd);
  const sla = assessment.sessionLoadAlignment28 || {};
  const qq = normalizeProfileQuestionnaire(profileQuestionnaireRaw || null);

  const garminOut =
    gp.status === 'loading'
      ? { status: 'loading', hasAnyGarminSignal: false }
      : gp.status === 'ready'
        ? {
            status: 'ready',
            hasAnyGarminSignal: gp.hasAnyGarminSignal === true,
            daysWithStepsData: gp.daysWithStepsData ?? 0,
            totalSteps28: gp.totalSteps28 ?? 0,
            avgSteps28: gp.avgSteps28 ?? null,
            avgStress28: gp.avgStress28 ?? null,
            stressSampleDays: gp.stressSampleDays ?? 0,
            avgSleepHours28: gp.avgSleepHours28 ?? null,
            sleepSampleDays: gp.sleepSampleDays ?? 0,
            weekStepsCurrent: gp.weekStepsCurrent ?? 0,
            avgPriorWeeksSteps: gp.avgPriorWeeksSteps ?? null,
            weekStepsTrendConfident: gp.weekStepsTrendConfident === true
          }
        : { status: 'skipped', hasAnyGarminSignal: false };

  return {
    window28,
    programLabel: activeProgram?.name ? String(activeProgram.name) : null,
    fitness: {
      activeDays28: assessment.activeDays28,
      totalReps28: assessment.totalReps28,
      volumeKgRepsSum28: assessment.volumeKgRepsSum28,
      weightedDays28: assessment.weightedDays28,
      regularityScore: assessment.regularityScore,
      sessionLoadAlignment28: assessment.sessionLoadAlignment28,
      programCompletion28: assessment.programCompletion28,
      level0to100: assessment.level0to100,
      tenureDays: assessment.tenureDays,
      distinctExercisesChecked28: distinctExercises28,
      sessionOverrideDays28: sla.seriesOverrideDays28 ?? 0,
      sessionOverrideTouches28: sla.seriesOverrideExerciseTouches28 ?? 0
    },
    weekSlices: segments,
    weekTrend: {
      currentActiveDays: currentSeg?.activeDays ?? 0,
      avgPriorWeeksActiveDays: avgPriorActiveDays != null ? Math.round(avgPriorActiveDays * 10) / 10 : null,
      currentLiftSum: currentSeg?.liftVolumeSum ?? 0,
      avgPriorWeeksLift: avgPriorLift != null ? Math.round(avgPriorLift) : null,
      currentRepsSum: currentSeg?.repsSum ?? 0,
      avgPriorWeeksReps: avgPriorReps != null ? Math.round(avgPriorReps) : null,
      confident: confidentWeekTrend
    },
    body: {
      latestWeightKg: bodySnap?.weightKg ?? null,
      latestFatPct: bodySnap?.bodyFat ?? null,
      weightDelta28: assessment.weightDelta28 ?? null,
      weightDelta7
    },
    journey: {
      firstActivityYmd,
      lastActivityYmd,
      daysSinceLastActivity
    },
    profileHints: {
      goalPhysique: qq.answers?.goalPhysique ?? null,
      currentPhysique: qq.answers?.currentPhysique ?? null,
      priorityMuscleGroups: Array.isArray(qq.answers?.priorityMuscleGroups) ? qq.answers.priorityMuscleGroups : [],
      availableEquipment: Array.isArray(qq.answers?.availableEquipment) ? qq.answers.availableEquipment : [],
      cardioQuizBias: computeCardioBiasMultiplier(qq.answers || {}),
      stretchingHabit: qq.answers?.stretchingHabit ?? null,
      circuitTrainingStyle: qq.answers?.circuitTrainingStyle ?? null
    },
    planChecks28: planChecks,
    nutrition: {
      status: np.status || 'skipped',
      daysWithLoggedMeals28: np.daysWithLoggedMeals28 ?? null,
      avgComplianceScore: np.avgComplianceScore ?? null,
      meanPctCaloriesVsTarget: np.meanPctCaloriesVsTarget ?? null,
      calorieDeltaStdApprox: np.calorieDeltaStdApprox ?? null,
      programsOwnedCount: np.programsOwnedCount ?? null
    },
    quiz: assessment.quiz,
    garmin: garminOut
  };
}
