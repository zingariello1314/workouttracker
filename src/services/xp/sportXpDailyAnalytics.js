/**
 * Jours calendrier avec XP Sport + moyenne journalière (total ÷ jours actifs).
 */

import { parseStretchItemKey } from '../../utils/exerciseKeyGenerator';
import {
  aggregateCheckedRepsByDateAndExerciseId,
  enduranceSessionCalendarLoad,
  normalizeSessionDate
} from '../../utils/trainingLoadUtils';
import { readGarminActivityDateOverrides } from '../../utils/sessionCalendarDate';
import {
  computeStepsXpFromResolved,
  normalizeManualDailyWalkByDate
} from '../../utils/sport/manualDailyWalkUtils';
import { getDaySteps } from '../sport/WalkingMetricsService';
import { buildGtgDayPlan, normalizeGtgData } from '../endurance/gtgService';
import { computeGtgXpForDayPlan } from './gtgXpService';

function addYmdFromKey(dates, key) {
  const m = String(key || '').match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) dates.add(m[1]);
}

/** @param {{ workoutData?: object, garminData?: object, nutritionMeals?: object[] }} input */
export function collectSportXpActiveDates({ workoutData, garminData, nutritionMeals }) {
  const dates = new Set();
  const wd = workoutData && typeof workoutData === 'object' ? workoutData : {};

  aggregateCheckedRepsByDateAndExerciseId(wd.reps, wd.checkedExercises).forEach((_, gkey) => {
    const sep = gkey.lastIndexOf('::');
    if (sep > 0) dates.add(gkey.slice(0, sep));
  });

  for (const [key, v] of Object.entries(wd.checkedExercises || {})) {
    if (v === true) addYmdFromKey(dates, key);
  }

  for (const [key, v] of Object.entries(wd.checkedStretches || {})) {
    if (v !== true) continue;
    const parsed = parseStretchItemKey(key);
    if (parsed?.dateStr) dates.add(parsed.dateStr);
    else addYmdFromKey(dates, key);
  }

  Object.keys(wd.sessionFeedbacks || {}).forEach((k) => addYmdFromKey(dates, k));

  for (const [dateStr, byCircuit] of Object.entries(wd.circuitProgress || {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
    if (byCircuit && typeof byCircuit === 'object' && Object.keys(byCircuit).length > 0) {
      dates.add(dateStr);
    }
  }

  const dm = garminData?.dailyMetrics && typeof garminData.dailyMetrics === 'object' ? garminData.dailyMetrics : {};
  const manual = normalizeManualDailyWalkByDate(wd.enduranceData?.manualDailyWalkByDate);
  const metricKeys = new Set([...Object.keys(dm), ...Object.keys(manual)]);
  metricKeys.forEach((dateKey) => {
    const activeCal = Number(dm[dateKey]?.calories?.active) || 0;
    if (activeCal > 0) dates.add(dateKey);
    const resolved = getDaySteps(dm[dateKey], manual[dateKey]);
    const xp = computeStepsXpFromResolved(resolved);
    if (xp.stepsXp > 0) dates.add(dateKey);
  });

  const overrides = readGarminActivityDateOverrides(wd);
  const sessions = wd.enduranceData?.sessions || {};
  Object.entries(sessions).forEach(([activityType, list]) => {
    if (!Array.isArray(list)) return;
    list.forEach((session) => {
      const ds = normalizeSessionDate(session, overrides);
      if (!ds) return;
      const load = enduranceSessionCalendarLoad(activityType, session);
      const ch =
        Array.isArray(session?.validatedChallenges) &&
        session.validatedChallenges.some((id) => id !== null && id !== undefined);
      if (load > 0 || ch) dates.add(ds);
    });
  });

  const normalizedGtg = normalizeGtgData(wd.enduranceData?.gtg);
  const gtgCtx = { workoutData: wd, repsInWorkout: true };
  Object.keys(normalizedGtg.days || {}).forEach((dateStr) => {
    const plan = buildGtgDayPlan(normalizedGtg, dateStr, gtgCtx);
    if (plan.doneMiniSets <= 0) return;
    const dayXp = computeGtgXpForDayPlan(plan, { repsInWorkout: true });
    if (dayXp.xp > 0) dates.add(dateStr);
  });

  if (Array.isArray(nutritionMeals)) {
    for (const meal of nutritionMeals) {
      const raw = meal?.date;
      if (!raw) continue;
      const dateStr = String(raw).includes('T') ? String(raw).split('T')[0] : String(raw).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue;
      const foods = meal?.foods;
      if (!Array.isArray(foods)) continue;
      const hasItem = foods.some((f) => {
        const qty = Number(f?.quantity);
        if (!Number.isFinite(qty) || qty <= 0) return false;
        return Boolean(String(f?.name || '').trim() || String(f?.id || '').trim());
      });
      if (hasItem) dates.add(dateStr);
    }
  }

  return dates;
}

const BREAKDOWN_XP_ROWS = [
  { id: 'weightedReps', xpKey: 'weightedRepsXp', labelKey: 'sport.xpInsight.repsWeighted', fallback: 'Reps pondérées' },
  { id: 'liftedVolume', xpKey: 'liftedVolumeKgXp', labelKey: 'sport.xpInsight.volumeKg', fallback: 'Volume kg×reps' },
  { id: 'exercises', xpKey: 'exercisesXp', labelKey: 'sport.xpInsight.exercises', fallback: 'Exercices cochés' },
  { id: 'stretches', xpKey: 'stretchesXp', labelKey: 'sport.xpInsight.stretches', fallback: 'Étirements' },
  { id: 'circuits', xpKey: 'circuitsXp', labelKey: 'sport.xpInsight.circuits', fallback: 'Circuits' },
  { id: 'calories', xpKey: 'caloriesXp', labelKey: 'sport.xpInsight.calories', fallback: 'Kcal actives (Garmin)' },
  { id: 'steps', xpKey: 'stepsXp', labelKey: 'sport.xpInsight.steps', fallback: 'Pas' },
  { id: 'nutrition', xpKey: 'nutritionFoodXp', labelKey: 'sport.xpInsight.nutrition', fallback: 'Journal nutrition' },
  { id: 'challenges', xpKey: 'challengesXp', labelKey: 'sport.xpInsight.challenges', fallback: 'Défis endurance' },
  { id: 'sessionsFeedback', xpKey: 'sessionsFeedbackXp', labelKey: 'sport.xpInsight.sessionFeedback', fallback: 'Feedback séance' },
  { id: 'gtg', xpKey: 'gtgXp', labelKey: 'sport.xpInsight.gtg', fallback: 'GTG' },
  { id: 'interval', xpKey: 'intervalTrainingXp', labelKey: 'sport.xpInsight.interval', fallback: 'Fractionné' },
  { id: 'programBonus', xpKey: 'programCompletionBonusXp', labelKey: 'sport.xpInsight.programBonus', fallback: 'Bonus programme terminé' },
  { id: 'runningTrophies', xpKey: 'runningTrophies', labelKey: 'sport.xpInsight.runningTrophies', fallback: 'Trophées course' },
  { id: 'jumpRopeTrophies', xpKey: 'jumpRopeTrophies', labelKey: 'sport.xpInsight.jumpRopeTrophies', fallback: 'Trophées corde' },
  { id: 'gainageTrophies', xpKey: 'gainageTrophies', labelKey: 'sport.xpInsight.gainageTrophies', fallback: 'Trophées gainage' },
  { id: 'pushupTrophies', xpKey: 'pushupTrophies', labelKey: 'sport.xpInsight.pushupTrophies', fallback: 'Trophées pompes' }
];

export function sportXpBreakdownRows(breakdown) {
  const b = breakdown || {};
  const rows = BREAKDOWN_XP_ROWS.map((row) => ({
    id: row.id,
    labelKey: row.labelKey,
    fallback: row.fallback,
    xp: Math.max(0, Math.round(Number(b[row.xpKey]) || 0))
  })).filter((row) => row.xp > 0);
  const sumXp = rows.reduce((s, r) => s + r.xp, 0);
  return rows.map((row) => ({
    ...row,
    pctOfTotal: sumXp > 0 ? Math.round((row.xp / sumXp) * 1000) / 10 : 0
  }));
}

/**
 * @returns {{ daysWithXp: number, averageDailyXp: number, breakdownRows: ReturnType<typeof sportXpBreakdownRows> }}
 */
export function computeSportXpDailyInsights({
  totalXP,
  breakdown,
  workoutData,
  garminData,
  nutritionMeals
}) {
  const activeDates = collectSportXpActiveDates({ workoutData, garminData, nutritionMeals });
  const daysWithXp = activeDates.size;
  const total = Math.max(0, Math.round(Number(totalXP) || 0));
  const averageDailyXp = daysWithXp > 0 ? Math.round(total / daysWithXp) : 0;
  return {
    daysWithXp,
    averageDailyXp,
    breakdownRows: sportXpBreakdownRows(breakdown)
  };
}
