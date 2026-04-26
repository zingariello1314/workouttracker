import { parseRunningSessionDurationMinutes } from '../../utils/runningPersonalRecords';
import { shouldExcludeStoredGarminRunningSession } from '../../utils/garminRunningLaps';

const LEVELS = ['bronze', 'silver', 'gold', 'elite'];

function toKm(session) {
  const km = Number(String(session?.distance ?? '').replace(',', '.'));
  return Number.isFinite(km) && km > 0 ? km : 0;
}

function toMinutes(session) {
  return Math.max(0, Number(parseRunningSessionDurationMinutes(session?.duration)) || 0);
}

function toCalories(session) {
  const kcal = Number(String(session?.calories ?? '').replace(',', '.'));
  return Number.isFinite(kcal) && kcal > 0 ? kcal : 0;
}

function toPaceMinPerKm(session) {
  const minutes = toMinutes(session);
  const km = toKm(session);
  if (!minutes || !km) return 0;
  return minutes / km;
}

function toCadence(session) {
  const val = Number(String(session?.averageCadence ?? session?.cadence ?? '').replace(',', '.'));
  return Number.isFinite(val) && val > 0 ? val : 0;
}

function sessionTs(session) {
  const t = session?.time && String(session.time).length >= 5 ? String(session.time).slice(0, 5) : '00:00';
  return new Date(`${session?.date || '1970-01-01'}T${t}:00`).getTime();
}

function toDateKey(session) {
  const d = String(session?.date || '');
  return d.includes('T') ? d.slice(0, 10) : d.slice(0, 10);
}

function weekKey(ds) {
  const d = new Date(`${ds}T00:00:00`);
  const dayNum = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayNum + 3);
  const firstThursday = new Date(d.getFullYear(), 0, 4);
  const firstThursdayDayNum = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDayNum + 3);
  const week = 1 + Math.round((d - firstThursday) / 604800000);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

function monthKey(ds) {
  return String(ds || '').slice(0, 7);
}

function computeStreakMax(daysSorted = []) {
  if (daysSorted.length === 0) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < daysSorted.length; i += 1) {
    const a = new Date(`${daysSorted[i - 1]}T00:00:00`);
    const b = new Date(`${daysSorted[i]}T00:00:00`);
    const diff = Math.round((b - a) / 86400000);
    if (diff === 1) {
      cur += 1;
      if (cur > best) best = cur;
    } else {
      cur = 1;
    }
  }
  return best;
}

function formatCurrent(value, unit) {
  if (!Number.isFinite(value)) return '0';
  if (unit === 'km') return `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km`;
  if (unit === 'min') return `${Math.round(value)} min`;
  if (unit === 'kcal') return `${Math.round(value)} kcal`;
  if (unit === 'pas') return `${Math.round(value).toLocaleString('fr-FR')} pas`;
  if (unit === 'pas/min') return `${Math.round(value)} pas/min`;
  if (unit === 'min/km') return `${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} min/km`;
  if (unit === 'sessions') return `${Math.round(value)} séances`;
  if (unit === 'jours') return `${Math.round(value)} jours`;
  if (unit === 'semaines') return `${Math.round(value)} semaines`;
  if (unit === 'mois') return `${Math.round(value)} mois`;
  return `${Math.round(value)}`;
}

function progression(current, target, reverse = false) {
  if (!Number.isFinite(target) || target <= 0) return 0;
  if (reverse) {
    if (!Number.isFinite(current) || current <= 0) return 0;
    return Math.max(0, Math.min(1, target / current));
  }
  return Math.max(0, Math.min(1, current / target));
}

function pickTopSessions(ordered, selector, limit = 6) {
  return [...ordered]
    .map((s) => ({ s, score: selector(s) }))
    .filter((row) => Number.isFinite(row.score) && row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.s);
}

function buildStats(sessions = []) {
  const ordered = [...(Array.isArray(sessions) ? sessions : [])].sort((a, b) => sessionTs(a) - sessionTs(b));
  const totalKm = ordered.reduce((sum, s) => sum + toKm(s), 0);
  const totalMin = ordered.reduce((sum, s) => sum + toMinutes(s), 0);
  const totalCalories = ordered.reduce((sum, s) => sum + toCalories(s), 0);
  const longestKm = ordered.reduce((max, s) => Math.max(max, toKm(s)), 0);
  const longestMin = ordered.reduce((max, s) => Math.max(max, toMinutes(s)), 0);
  const bestCadence = ordered.reduce((max, s) => Math.max(max, toCadence(s)), 0);
  const fastestPace = ordered.reduce((best, s) => {
    const pace = toPaceMinPerKm(s);
    if (!pace) return best;
    if (!best) return pace;
    return Math.min(best, pace);
  }, 0);

  const days = Array.from(new Set(ordered.map((s) => toDateKey(s)).filter(Boolean))).sort();
  const streakMax = computeStreakMax(days);

  const weeks = new Set(days.map((d) => weekKey(d)));
  const months = new Set(days.map((d) => monthKey(d)));

  const distancesByWeek = new Map();
  const minutesByWeek = new Map();
  const distancesByMonth = new Map();
  const minutesByMonth = new Map();
  ordered.forEach((s) => {
    const d = toDateKey(s);
    if (!d) return;
    const wk = weekKey(d);
    const mk = monthKey(d);
    distancesByWeek.set(wk, (distancesByWeek.get(wk) || 0) + toKm(s));
    minutesByWeek.set(wk, (minutesByWeek.get(wk) || 0) + toMinutes(s));
    distancesByMonth.set(mk, (distancesByMonth.get(mk) || 0) + toKm(s));
    minutesByMonth.set(mk, (minutesByMonth.get(mk) || 0) + toMinutes(s));
  });

  const bestWeekKm = Math.max(0, ...distancesByWeek.values());
  const bestWeekMin = Math.max(0, ...minutesByWeek.values());
  const bestMonthKm = Math.max(0, ...distancesByMonth.values());
  const bestMonthMin = Math.max(0, ...minutesByMonth.values());

  return {
    ordered,
    sessionsCount: ordered.length,
    totalKm,
    totalMin,
    totalCalories,
    longestKm,
    longestMin,
    bestCadence,
    fastestPace,
    activeDays: days.length,
    activeWeeks: weeks.size,
    activeMonths: months.size,
    streakMax,
    bestWeekKm,
    bestWeekMin,
    bestMonthKm,
    bestMonthMin
  };
}

export const WALKING_TROPHIES = [
  { id: 'walk_sessions_total', title: 'Nombre de marches', category: 'Volume global', difficulty: 'easy', metric: 'sessionsCount', levels: [1, 5, 15, 40], unit: 'sessions', source: (ordered) => ordered.slice(-6).reverse() },
  { id: 'walk_total_km', title: 'Distance cumulée', category: 'Volume global', difficulty: 'moderate', metric: 'totalKm', levels: [5, 25, 100, 250], unit: 'km', source: (ordered) => pickTopSessions(ordered, toKm) },
  { id: 'walk_total_min', title: 'Temps cumulé', category: 'Volume global', difficulty: 'moderate', metric: 'totalMin', levels: [120, 600, 1800, 4800], unit: 'min', source: (ordered) => pickTopSessions(ordered, toMinutes) },
  { id: 'walk_total_kcal', title: 'Calories cumulées', category: 'Volume global', difficulty: 'hard', metric: 'totalCalories', levels: [300, 1500, 5000, 12000], unit: 'kcal', source: (ordered) => pickTopSessions(ordered, toCalories) },
  { id: 'walk_longest_km', title: 'Plus longue marche', category: 'Performance', difficulty: 'moderate', metric: 'longestKm', levels: [3, 5, 10, 15], unit: 'km', source: (ordered) => pickTopSessions(ordered, toKm) },
  { id: 'walk_longest_min', title: 'Plus longue durée', category: 'Performance', difficulty: 'moderate', metric: 'longestMin', levels: [30, 60, 90, 120], unit: 'min', source: (ordered) => pickTopSessions(ordered, toMinutes) },
  { id: 'walk_fast_pace', title: 'Allure la plus rapide', category: 'Performance', difficulty: 'hard', metric: 'fastestPace', levels: [12, 11, 10, 9], unit: 'min/km', reverse: true, source: (ordered) => pickTopSessions(ordered, (s) => (toPaceMinPerKm(s) ? 1 / toPaceMinPerKm(s) : 0)) },
  { id: 'walk_best_cadence', title: 'Cadence maximale', category: 'Performance', difficulty: 'hard', metric: 'bestCadence', levels: [90, 105, 118, 128], unit: 'pas/min', source: (ordered) => pickTopSessions(ordered, toCadence) },
  { id: 'walk_streak_days', title: 'Série de jours consécutifs', category: 'Régularité', difficulty: 'hard', metric: 'streakMax', levels: [2, 4, 7, 14], unit: 'jours', source: (ordered) => ordered.slice(-10).reverse() },
  { id: 'walk_active_days', title: 'Jours actifs', category: 'Régularité', difficulty: 'moderate', metric: 'activeDays', levels: [3, 15, 40, 90], unit: 'jours', source: (ordered) => ordered.slice(-8).reverse() },
  { id: 'walk_active_weeks', title: 'Semaines actives', category: 'Régularité', difficulty: 'hard', metric: 'activeWeeks', levels: [2, 6, 12, 24], unit: 'semaines', source: (ordered) => ordered.slice(-10).reverse() },
  { id: 'walk_active_months', title: 'Mois actifs', category: 'Régularité', difficulty: 'hard', metric: 'activeMonths', levels: [1, 3, 6, 12], unit: 'mois', source: (ordered) => ordered.slice(-10).reverse() },
  { id: 'walk_best_week_km', title: 'Semaine record (km)', category: 'Records calendaires', difficulty: 'hard', metric: 'bestWeekKm', levels: [8, 18, 30, 45], unit: 'km', source: (ordered) => ordered.slice(-12).reverse() },
  { id: 'walk_best_week_min', title: 'Semaine record (minutes)', category: 'Records calendaires', difficulty: 'hard', metric: 'bestWeekMin', levels: [120, 220, 350, 500], unit: 'min', source: (ordered) => ordered.slice(-12).reverse() },
  { id: 'walk_best_month_km', title: 'Mois record (km)', category: 'Records calendaires', difficulty: 'elite', metric: 'bestMonthKm', levels: [20, 45, 80, 130], unit: 'km', source: (ordered) => ordered.slice(-14).reverse() }
];

export function evaluateWalkingTrophies(sessions = [], supplemental = null) {
  const pool = (Array.isArray(sessions) ? sessions : []).filter((s) => !shouldExcludeStoredGarminRunningSession(s));
  const stats = buildStats(pool);
  const mergedStats = {
    ...stats,
    supplementalWalkKmAllTime: Number(supplemental?.walkKmAllTime) || 0,
    supplementalStepsAllTime: Number(supplemental?.stepsAllTime) || 0
  };
  const dynamicTrophies = [
    ...WALKING_TROPHIES,
    {
      id: 'walk_realistic_all_time_km',
      title: 'Marche réaliste all-time',
      category: 'All-time Garmin',
      difficulty: 'hard',
      metric: 'supplementalWalkKmAllTime',
      levels: [30, 80, 180, 350],
      unit: 'km',
      source: (ordered) => ordered.slice(-10).reverse()
    },
    {
      id: 'walk_steps_all_time',
      title: 'Pas cumulés all-time',
      category: 'All-time Garmin',
      difficulty: 'moderate',
      metric: 'supplementalStepsAllTime',
      levels: [50000, 150000, 400000, 900000],
      unit: 'pas',
      source: (ordered) => ordered.slice(-10).reverse()
    }
  ];
  const results = dynamicTrophies.map((trophy) => {
    const current = Number(mergedStats?.[trophy.metric]) || 0;
    const levels = trophy.levels.map((target, idx) => {
      const progress = progression(current, target, Boolean(trophy.reverse));
      const unlocked = trophy.reverse ? current > 0 && current <= target : current >= target;
      return {
        level: LEVELS[idx],
        target,
        progress,
        unlocked
      };
    });
    const unlockedLevels = levels.filter((lvl) => lvl.unlocked);
    const highestLevel = unlockedLevels.length ? unlockedLevels[unlockedLevels.length - 1].level : null;
    const contributingSessions = typeof trophy.source === 'function' ? trophy.source(stats.ordered) : [];
    const contributingMoreCount = Math.max(0, stats.ordered.length - contributingSessions.length);

    return {
      ...trophy,
      current,
      currentLabel: formatCurrent(current, trophy.unit),
      levels,
      highestLevel,
      contributingSessions,
      contributingMoreCount
    };
  });

  return {
    stats: mergedStats,
    results
  };
}
