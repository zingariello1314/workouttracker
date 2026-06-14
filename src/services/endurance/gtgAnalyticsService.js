/**
 * Statistiques, régularité et suggestions coach GTG.
 * @module services/endurance/gtgAnalyticsService
 */

import DateHelper from '../../utils/dateHelper';
import { calculateAutoReps } from '../../utils/exerciseCalculations';
import { getDayName } from '../../utils/dateUtils';
import {
  buildGtgDayPlan,
  getPerExerciseSchedule,
  collectGtgMiniSetHistory,
  getGtgExerciseLabel,
  normalizeGtgData,
  summarizeGtgWindow
} from './gtgService';
import {
  findBankExerciseById,
  isGtgFundamentalBankEntry,
  listGtgBankExercises,
  matchBuiltinGtgIdForName
} from './gtgExerciseBank';

function parsePlannedReps(exercise) {
  if (Array.isArray(exercise?.repsPerSeries) && exercise.repsPerSeries.length) {
    return exercise.repsPerSeries.reduce((s, r) => s + (Number(r) || 0), 0);
  }
  const fromSeries = calculateAutoReps(String(exercise?.series || ''), { round: true });
  return fromSeries != null && fromSeries > 0 ? fromSeries : 0;
}

function extractExerciseIdFromKey(key) {
  const k = String(key || '');
  const i = k.indexOf('_');
  if (i < 0) return k;
  return k.slice(i + 1).replace(/_semaineA$|_semaineB$/, '');
}

function sumActualRepsForExercise(workoutData, exerciseId, startYmd, endYmd) {
  const reps = workoutData?.reps || {};
  const checked = workoutData?.checkedExercises || {};
  let total = 0;
  Object.keys(reps).forEach((key) => {
    if (!checked[key]) return;
    const date = key.slice(0, 10);
    if (date < startYmd || date > endYmd) return;
    const id = extractExerciseIdFromKey(key);
    if (String(id) !== String(exerciseId)) return;
    total += Math.max(0, parseInt(reps[key], 10) || 0);
  });
  return total;
}

function collectProgramExercisesForDay(program, dateStr, isGymMode = false) {
  if (!program?.schedule) return [];
  const dayName = getDayName(new Date(dateStr));
  const day = program.schedule[dayName];
  if (!day || day.active === false) return [];
  let list = day.exercises || [];
  if (isGymMode && day.salleVariants) {
    const wk = 'semaineA';
    if (day.salleVariants[wk]?.exercises) list = day.salleVariants[wk].exercises;
  }
  return list.filter((ex) => ex && ex.id != null);
}

/** Reps prévues vs coches sur ~28 j par exercice du programme actif. */
export function analyzeProgramRepsGaps(workoutData, activeProgram, endYmd, days = 28) {
  if (!activeProgram?.schedule) return [];
  const startYmd = DateHelper.addDays(endYmd, -(days - 1));
  const range = DateHelper.getDateRange(startYmd, endYmd);
  const plannedById = new Map();
  const metaById = new Map();

  range.forEach((d) => {
    const exercises = collectProgramExercisesForDay(activeProgram, d);
    exercises.forEach((ex) => {
      const id = String(ex.id);
      const planned = parsePlannedReps(ex);
      if (planned <= 0) return;
      plannedById.set(id, (plannedById.get(id) || 0) + planned);
      if (!metaById.has(id)) metaById.set(id, { id, name: ex.name || id });
    });
  });

  const gaps = [];
  plannedById.forEach((plannedReps, id) => {
    const actual = sumActualRepsForExercise(workoutData, id, startYmd, endYmd);
    const ratio = plannedReps > 0 ? actual / plannedReps : 0;
    const meta = metaById.get(id) || { id, name: id };
    gaps.push({
      exerciseId: id,
      name: meta.name,
      plannedReps28: Math.round(plannedReps),
      actualReps28: actual,
      ratio: Math.round(ratio * 100) / 100,
      suggestedBuiltinGtg: matchBuiltinGtgIdForName(meta.name),
      isFundamentalName: Boolean(matchBuiltinGtgIdForName(meta.name))
    });
  });

  return gaps.sort((a, b) => a.ratio - b.ratio);
}

export function buildGtgExerciseRankings(gtgData, ctx, startYmd, endYmd) {
  const normalized = normalizeGtgData(gtgData);
  const history = collectGtgMiniSetHistory(normalized, startYmd, endYmd, ctx);
  const byExercise = new Map();

  history.forEach((row) => {
    const cur = byExercise.get(row.exerciseId) || {
      exerciseId: row.exerciseId,
      label: getGtgExerciseLabel(row.exerciseId, normalized.config, ctx),
      miniSetsDone: 0,
      repsDone: 0,
      days: new Set()
    };
    cur.miniSetsDone += 1;
    cur.repsDone += row.reps;
    cur.days.add(row.dateStr);
    byExercise.set(row.exerciseId, cur);
  });

  const range = DateHelper.getDateRange(startYmd, endYmd);
  const totalDays = range.length;

  const stats = Array.from(byExercise.values()).map((s) => {
    const daysActive = s.days.size;
    const plannedPerDay = normalized.config.selectedIds.includes(s.exerciseId)
      ? getPerExerciseSchedule(normalized.config, s.exerciseId).slotTimes.length
      : 0;
    const possibleMiniSets = daysActive * plannedPerDay || 1;
    return {
      exerciseId: s.exerciseId,
      label: s.label,
      miniSetsDone: s.miniSetsDone,
      repsDone: s.repsDone,
      daysActive,
      regularityPct: totalDays > 0 ? Math.round((daysActive / totalDays) * 100) : 0,
      adherencePct:
        plannedPerDay > 0
          ? Math.round((s.miniSetsDone / (plannedPerDay * daysActive || 1)) * 100)
          : 0
    };
  });

  const byVolume = [...stats].sort((a, b) => b.miniSetsDone - a.miniSetsDone);
  const byRegularity = [...stats].sort((a, b) => {
    if (b.daysActive !== a.daysActive) return b.daysActive - a.daysActive;
    return b.miniSetsDone - a.miniSetsDone;
  });

  return {
    stats,
    mostDone: byVolume.slice(0, 5),
    leastDone: [...byVolume].reverse().slice(0, 5).filter((s) => s.miniSetsDone > 0),
    mostRegular: byRegularity.slice(0, 5),
    leastRegular: [...byRegularity].reverse().slice(0, 5).filter((s) => s.daysActive > 0),
    totalMiniSets: history.length,
    totalReps: history.reduce((s, r) => s + r.reps, 0)
  };
}

/**
 * Suggestions contextuelles (priorité décroissante).
 */
export function computeGtgPracticeSuggestions({
  gtgData,
  ctx = {},
  activeProgram = null,
  endYmd = DateHelper.getTodayLocal()
}) {
  const normalized = normalizeGtgData(gtgData);
  const start28 = DateHelper.addDays(endYmd, -27);
  const window = summarizeGtgWindow(normalized, start28, endYmd, ctx);
  const rankings = buildGtgExerciseRankings(normalized, ctx, start28, endYmd);
  const programGaps = analyzeProgramRepsGaps(ctx.workoutData, activeProgram, endYmd);
  const suggestions = [];

  const underProgram = programGaps.filter((g) => g.plannedReps28 >= 20 && g.ratio < 0.55);
  underProgram.slice(0, 3).forEach((g) => {
    const gtgId = g.suggestedBuiltinGtg;
    const inGtg = gtgId && normalized.config.selectedIds.includes(gtgId);
    suggestions.push({
      id: `program_gap_${g.exerciseId}`,
      priority: 88,
      tone: 'tip',
      templateKey: inGtg ? 'gtgCoachProgramGapActive' : 'gtgCoachProgramGapAdd',
      payload: {
        name: g.name,
        planned: g.plannedReps28,
        actual: g.actualReps28,
        pct: Math.round(g.ratio * 100)
      }
    });
  });

  const fundamentalsNotInGtg = listGtgBankExercises()
    .filter((e) => e.isFundamental)
    .filter((e) => !normalized.config.selectedIds.includes(e.id))
    .slice(0, 2);
  fundamentalsNotInGtg.forEach((e) => {
    suggestions.push({
      id: `fundamental_${e.id}`,
      priority: 62,
      tone: 'tip',
      templateKey: 'gtgCoachAddFundamental',
      payload: { name: e.name }
    });
  });

  if (window.daysWithAny >= 5 && window.daysAt50 < 2) {
    suggestions.push({
      id: 'volume_high_low_adherence',
      priority: 70,
      tone: 'warn',
      templateKey: 'gtgCoachReduceSlots',
      payload: {
        slots: Math.max(
          ...normalized.config.selectedIds.map(
            (id) => getPerExerciseSchedule(normalized.config, id).slotTimes.length
          ),
          0
        )
      }
    });
  }

  if (rankings.mostRegular.length > 0) {
    const top = rankings.mostRegular[0];
    if (top.daysActive >= 5) {
      suggestions.push({
        id: 'regular_top',
        priority: 58,
        tone: 'positive',
        templateKey: 'gtgCoachRegularExercise',
        payload: { name: top.label, days: top.daysActive }
      });
    }
  }

  if (rankings.leastRegular.length > 0 && rankings.stats.length >= 2) {
    const weak = rankings.leastRegular[0];
    if (weak.daysActive >= 1 && weak.daysActive <= 2 && weak.miniSetsDone >= 1) {
      suggestions.push({
        id: 'irregular_exercise',
        priority: 48,
        tone: 'tip',
        templateKey: 'gtgCoachIrregularExercise',
        payload: { name: weak.label }
      });
    }
  }

  const todayPlan = buildGtgDayPlan(normalized, endYmd, ctx);
  if (todayPlan.progressPct >= 50 && todayPlan.progressPct < 100) {
    suggestions.push({
      id: 'today_almost',
      priority: 75,
      tone: 'positive',
      templateKey: 'gtgCoachTodayAlmost',
      payload: { pct: Math.round(todayPlan.progressPct) }
    });
  }

  if (window.daysWithAny === 0 && programGaps.some((g) => g.isFundamentalName && g.ratio < 0.7)) {
    suggestions.push({
      id: 'try_gtg_fundamentals',
      priority: 55,
      tone: 'tip',
      templateKey: 'gtgCoachTryFundamentals',
      payload: {}
    });
  }

  if (window.daysWithAny >= 8 && window.daysAt100 >= 4) {
    suggestions.push({
      id: 'progression_hint',
      priority: 52,
      tone: 'positive',
      templateKey: 'gtgCoachProgressionRep',
      payload: {}
    });
  }

  const selectedCustom = normalized.config.selectedIds.filter((id) => String(id).startsWith('db_'));
  selectedCustom.forEach((id) => {
    const bank = findBankExerciseById(id);
    if (bank && isGtgFundamentalBankEntry(bank.bankKey, { name: bank.name })) return;
    const stat = rankings.stats.find((s) => s.exerciseId === id);
    if (stat && stat.daysActive >= 4) {
      suggestions.push({
        id: `custom_strong_${id}`,
        priority: 44,
        tone: 'positive',
        templateKey: 'gtgCoachCustomWorking',
        payload: { name: stat.label }
      });
    }
  });

  suggestions.sort((a, b) => b.priority - a.priority);
  return {
    suggestions: suggestions.slice(0, 8),
    programGaps: programGaps.slice(0, 10),
    window,
    rankings
  };
}

export function buildGtgAnalyticsBundle(opts) {
  const endYmd = opts.endYmd || DateHelper.getTodayLocal();
  const start28 = DateHelper.addDays(endYmd, -27);
  const analytics = computeGtgPracticeSuggestions({ ...opts, endYmd });
  return {
    endYmd,
    start28,
    ...analytics
  };
}
