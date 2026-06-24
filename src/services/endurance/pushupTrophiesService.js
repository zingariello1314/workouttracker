/**
 * Trophées pompes (saisie onglet Pompes) : volume, records, régularité, pics hebdo/mensuel.
 * Même logique de paliers que course / corde / gainage (réutilise l’XP course).
 */
import { isMockEnduranceSession } from '../../utils/calendarUtils';
import { enduranceSessionCalendarYmd } from '../../services/sport/TrainingDayTruthService';
import { computeRunningTrophiesXpDetailed } from './runningTrophiesService';

const LEVEL_MULTIPLIERS = {
  bronze: 1,
  silver: 1.35,
  gold: 1.75,
  elite: 2.2
};

const LEVELS = ['bronze', 'silver', 'gold', 'elite'];

const DIFFICULTY_POINTS = {
  simple: 10,
  intermediate: 25,
  specific: 35,
  endurance: 45,
  elite: 60
};

const SUM_LIKE_METRICS = new Set([
  'totalReps',
  'maxRepsSingle',
  'bestWeeklyReps',
  'bestMonthlyReps',
  'totalDurationMin',
  'maxSessionDurationMin',
  'bestWeeklyDurationMin'
]);

const COUNT_LIKE_METRICS = new Set([
  'sessionCount',
  'streakDays',
  'maxSessionsSingleDay',
  'bestWeeklySessions',
  'bestMonthlySessions',
  'morningSessionCount'
]);

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sessionDateKey(session, workoutAggregate = null) {
  const logical = enduranceSessionCalendarYmd(session, workoutAggregate);
  if (logical) return logical;
  if (typeof session?.date === 'string') {
    const m = session.date.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
  }
  return null;
}

function parseSessionDateTime(session, workoutAggregate = null) {
  const dk = sessionDateKey(session, workoutAggregate);
  if (!dk) return null;
  const t = session?.time && String(session.time).trim() ? String(session.time).trim() : '12:00:00';
  const iso = `${dk}T${t.length === 5 ? `${t}:00` : t}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startHour(session) {
  if (!session?.time) return null;
  const hh = Number(String(session.time).split(':')[0]);
  return Number.isFinite(hh) ? hh : null;
}

function buildWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

function buildMonthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function maxConsecutiveDayStreak(sortedDateKeys) {
  if (!sortedDateKeys.length) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < sortedDateKeys.length; i += 1) {
    const prev = new Date(`${sortedDateKeys[i - 1]}T12:00:00`);
    const curr = new Date(`${sortedDateKeys[i]}T12:00:00`);
    const diffDays = Math.round((curr - prev) / (24 * 60 * 60 * 1000));
    if (diffDays === 1) {
      cur += 1;
      best = Math.max(best, cur);
    } else if (diffDays > 1) {
      cur = 1;
    }
  }
  return best;
}

function resolveTierTarget(trophy, level) {
  const mult = LEVEL_MULTIPLIERS[level];
  const base = toNumber(trophy.baseTarget, 0);
  if (trophy.auto === false) return 0;
  const raw = base * mult;
  if (SUM_LIKE_METRICS.has(trophy.metric)) {
    if (
      trophy.metric === 'totalReps' ||
      trophy.metric === 'maxRepsSingle' ||
      trophy.metric === 'bestWeeklyReps' ||
      trophy.metric === 'bestMonthlyReps' ||
      trophy.metric === 'totalDurationMin' ||
      trophy.metric === 'maxSessionDurationMin' ||
      trophy.metric === 'bestWeeklyDurationMin'
    ) {
      return Math.max(1, Math.round(raw));
    }
    return Math.round(raw * 10) / 10;
  }
  if (COUNT_LIKE_METRICS.has(trophy.metric)) {
    const idx = LEVELS.indexOf(level);
    const baseN = toNumber(trophy.baseTarget, 0);
    let prev = 0;
    let out = 1;
    for (let i = 0; i <= idx; i += 1) {
      const m = LEVEL_MULTIPLIERS[LEVELS[i]];
      let t = Math.max(1, Math.ceil(baseN * m - 1e-9));
      if (t <= prev) t = prev + 1;
      prev = t;
      out = t;
    }
    return out;
  }
  return Math.round(raw * 100) / 100;
}

function evaluateSingle(trophy, stats, level) {
  if (trophy.auto === false) {
    return { value: 0, target: 0, progress: 0, unlocked: false };
  }
  const target = resolveTierTarget(trophy, level);
  const value = toNumber(stats[trophy.metric], 0);
  const progress = target > 0 ? Math.max(0, Math.min(1, value / target)) : 0;
  const unlocked = value >= target;
  return { value, target, progress, unlocked };
}

/** Dates (YYYY-MM-DD) de la plus longue chaîne de jours consécutifs avec séance. */
function longestStreakDateKeys(sortedUniqueDays) {
  if (!sortedUniqueDays.length) return [];
  let best = 1;
  let bestStart = 0;
  let curStart = 0;
  let streak = 1;
  for (let i = 1; i < sortedUniqueDays.length; i += 1) {
    const prev = new Date(`${sortedUniqueDays[i - 1]}T12:00:00`);
    const cur = new Date(`${sortedUniqueDays[i]}T12:00:00`);
    const diff = Math.round((cur - prev) / 86400000);
    if (diff === 1) {
      streak += 1;
    } else {
      streak = 1;
      curStart = i;
    }
    if (streak > best) {
      best = streak;
      bestStart = curStart;
    }
  }
  const keys = [];
  for (let j = 0; j < best; j += 1) keys.push(sortedUniqueDays[bestStart + j]);
  return keys;
}

export function buildPushupStats(sessions = [], workoutAggregate = null) {
  const rows = (sessions || [])
    .filter((s) => s && !isMockEnduranceSession(s))
    .map((s) => {
      const dateKey = sessionDateKey(s, workoutAggregate);
      if (!dateKey) return null;
      const reps = Math.max(0, Math.floor(toNumber(s.count, 0)));
      const durationMin = Math.max(0, toNumber(s.duration, 0));
      const d = parseSessionDateTime(s, workoutAggregate) || new Date(`${dateKey}T12:00:00`);
      return {
        raw: s,
        dateKey,
        weekKey: buildWeekKey(d),
        monthKey: buildMonthKey(d),
        reps,
        durationMin,
        hour: startHour(s)
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0));

  const weekMap = new Map();
  const monthMap = new Map();
  const byDay = new Map();

  let totalReps = 0;
  let totalDurationMin = 0;
  let maxRepsSingle = 0;
  let maxSessionDurationMin = 0;
  let morningSessionCount = 0;

  rows.forEach((r) => {
    totalReps += r.reps;
    totalDurationMin += r.durationMin;
    maxRepsSingle = Math.max(maxRepsSingle, r.reps);
    maxSessionDurationMin = Math.max(maxSessionDurationMin, r.durationMin);
    if (r.hour != null && r.hour < 9) morningSessionCount += 1;
    byDay.set(r.dateKey, (byDay.get(r.dateKey) || 0) + 1);

    const w = weekMap.get(r.weekKey) || { sessions: 0, reps: 0, durationMin: 0 };
    w.sessions += 1;
    w.reps += r.reps;
    w.durationMin += r.durationMin;
    weekMap.set(r.weekKey, w);

    const m = monthMap.get(r.monthKey) || { sessions: 0, reps: 0 };
    m.sessions += 1;
    m.reps += r.reps;
    monthMap.set(r.monthKey, m);
  });

  const uniqueDays = Array.from(new Set(rows.map((r) => r.dateKey))).sort();
  const streakDays = maxConsecutiveDayStreak(uniqueDays);
  let maxSessionsSingleDay = 0;
  byDay.forEach((n) => {
    maxSessionsSingleDay = Math.max(maxSessionsSingleDay, n);
  });

  let bestWeeklyReps = 0;
  let bestWeeklySessions = 0;
  let bestWeeklyDurationMin = 0;
  let peakWeekRepsKey = null;
  let peakWeekRepsVal = -1;
  weekMap.forEach((w, k) => {
    bestWeeklyReps = Math.max(bestWeeklyReps, w.reps);
    bestWeeklySessions = Math.max(bestWeeklySessions, w.sessions);
    bestWeeklyDurationMin = Math.max(bestWeeklyDurationMin, w.durationMin);
    if (w.reps > peakWeekRepsVal) {
      peakWeekRepsVal = w.reps;
      peakWeekRepsKey = k;
    }
  });

  let bestMonthlyReps = 0;
  let bestMonthlySessions = 0;
  let peakMonthRepsKey = null;
  let peakMonthRepsVal = -1;
  monthMap.forEach((m, k) => {
    bestMonthlyReps = Math.max(bestMonthlyReps, m.reps);
    bestMonthlySessions = Math.max(bestMonthlySessions, m.sessions);
    if (m.reps > peakMonthRepsVal) {
      peakMonthRepsVal = m.reps;
      peakMonthRepsKey = k;
    }
  });

  return {
    activity: 'pushups',
    sessionCount: rows.length,
    totalReps,
    totalDurationMin,
    maxRepsSingle,
    maxSessionDurationMin,
    streakDays,
    maxSessionsSingleDay,
    bestWeeklyReps,
    bestMonthlyReps,
    bestWeeklySessions,
    bestMonthlySessions,
    bestWeeklyDurationMin,
    morningSessionCount,
    peakWeekRepsKey,
    peakMonthRepsKey,
    streakDates: new Set(longestStreakDateKeys(uniqueDays)),
    __rows: rows
  };
}

export function buildPushupTrophiesCatalog() {
  return [
    { id: 'pu_first', title: 'Première séance pompes', metric: 'sessionCount', baseTarget: 1, difficulty: 'simple', category: 'Premiers pas' },
    { id: 'pu_total_300', title: '300 pompes au total (cumul)', metric: 'totalReps', baseTarget: 300, difficulty: 'simple', category: 'Volume' },
    { id: 'pu_total_2500', title: '2500 pompes au total', metric: 'totalReps', baseTarget: 2500, difficulty: 'intermediate', category: 'Volume' },
    { id: 'pu_total_15000', title: '15 000 pompes au total', metric: 'totalReps', baseTarget: 15000, difficulty: 'endurance', category: 'Volume' },
    { id: 'pu_total_50000', title: '50 000 pompes au total (long terme)', metric: 'totalReps', baseTarget: 50000, difficulty: 'elite', category: 'Volume' },
    { id: 'pu_single_30', title: '30 pompes sur une séance', metric: 'maxRepsSingle', baseTarget: 30, difficulty: 'simple', category: 'Pic séance' },
    { id: 'pu_single_60', title: '60 pompes sur une séance', metric: 'maxRepsSingle', baseTarget: 60, difficulty: 'intermediate', category: 'Pic séance' },
    { id: 'pu_single_100', title: '100 pompes sur une séance', metric: 'maxRepsSingle', baseTarget: 100, difficulty: 'specific', category: 'Pic séance' },
    { id: 'pu_single_150', title: '150 pompes sur une séance', metric: 'maxRepsSingle', baseTarget: 150, difficulty: 'endurance', category: 'Pic séance' },
    { id: 'pu_day_double', title: '2 séances pompes le même jour', metric: 'maxSessionsSingleDay', baseTarget: 2, difficulty: 'simple', category: 'Rythme' },
    { id: 'pu_day_triple', title: '3 séances pompes dans la même journée', metric: 'maxSessionsSingleDay', baseTarget: 3, difficulty: 'intermediate', category: 'Rythme' },
    { id: 'pu_morning_5', title: '5 séances avant 9 h', metric: 'morningSessionCount', baseTarget: 5, difficulty: 'intermediate', category: 'Rythme' },
    { id: 'pu_week_sessions_4', title: '4 séances sur une même semaine ISO', metric: 'bestWeeklySessions', baseTarget: 4, difficulty: 'intermediate', category: 'Semaine' },
    { id: 'pu_week_reps_400', title: '400 pompes sur une semaine ISO', metric: 'bestWeeklyReps', baseTarget: 400, difficulty: 'intermediate', category: 'Semaine' },
    { id: 'pu_week_reps_1200', title: '1200 pompes sur une semaine ISO', metric: 'bestWeeklyReps', baseTarget: 1200, difficulty: 'specific', category: 'Semaine' },
    { id: 'pu_month_sessions_16', title: '16 séances sur un même mois', metric: 'bestMonthlySessions', baseTarget: 16, difficulty: 'specific', category: 'Mois' },
    { id: 'pu_month_reps_3500', title: '3500 pompes sur un mois calendaire', metric: 'bestMonthlyReps', baseTarget: 3500, difficulty: 'endurance', category: 'Mois' },
    { id: 'pu_streak_5', title: '5 jours d’affilée avec au moins une séance', metric: 'streakDays', baseTarget: 5, difficulty: 'intermediate', category: 'Série' },
    { id: 'pu_streak_14', title: '14 jours consécutifs avec séance', metric: 'streakDays', baseTarget: 14, difficulty: 'specific', category: 'Série' },
    { id: 'pu_streak_30', title: '30 jours consécutifs avec séance', metric: 'streakDays', baseTarget: 30, difficulty: 'endurance', category: 'Série' },
    { id: 'pu_time_total_120', title: '120 minutes de séance cumulées (champ durée)', metric: 'totalDurationMin', baseTarget: 120, difficulty: 'intermediate', category: 'Temps' },
    { id: 'pu_week_time_45', title: '45 min de séance sur une semaine ISO (cumul durées)', metric: 'bestWeeklyDurationMin', baseTarget: 45, difficulty: 'specific', category: 'Temps' },
    { id: 'pu_long_session_25', title: '25 minutes sur une séance (durée saisie)', metric: 'maxSessionDurationMin', baseTarget: 25, difficulty: 'elite', category: 'Temps' },
    /** Paliers volume cumul (saisie pompes) — complètent 300 → 2500 → 15k → 50k */
    { id: 'pu_total_1000', title: '1000 pompes enregistrées (cumul)', metric: 'totalReps', baseTarget: 1000, difficulty: 'simple', category: 'Volume' },
    { id: 'pu_total_5000', title: '5000 pompes enregistrées (cumul)', metric: 'totalReps', baseTarget: 5000, difficulty: 'intermediate', category: 'Volume' },
    { id: 'pu_total_10000', title: '10 000 pompes enregistrées (cumul)', metric: 'totalReps', baseTarget: 10000, difficulty: 'specific', category: 'Volume' },
    { id: 'pu_total_20000', title: '20 000 pompes enregistrées (cumul)', metric: 'totalReps', baseTarget: 20000, difficulty: 'endurance', category: 'Volume' },
    { id: 'pu_total_25000', title: '25 000 pompes enregistrées (cumul)', metric: 'totalReps', baseTarget: 25000, difficulty: 'endurance', category: 'Volume' },
    /** Pics hebdo / mensuel plus exigeants */
    { id: 'pu_week_reps_800', title: '800 pompes sur une semaine ISO', metric: 'bestWeeklyReps', baseTarget: 800, difficulty: 'intermediate', category: 'Semaine' },
    { id: 'pu_week_reps_2000', title: '2000 pompes sur une semaine ISO', metric: 'bestWeeklyReps', baseTarget: 2000, difficulty: 'endurance', category: 'Semaine' },
    { id: 'pu_month_reps_6000', title: '6000 pompes sur un mois calendaire', metric: 'bestMonthlyReps', baseTarget: 6000, difficulty: 'specific', category: 'Mois' },
    { id: 'pu_month_reps_8000', title: '8000 pompes sur un mois calendaire', metric: 'bestMonthlyReps', baseTarget: 8000, difficulty: 'endurance', category: 'Mois' },
    /** Rythme & série */
    { id: 'pu_streak_10', title: '10 jours d’affilée avec au moins une séance', metric: 'streakDays', baseTarget: 10, difficulty: 'intermediate', category: 'Série' },
    { id: 'pu_streak_21', title: '21 jours consécutifs avec séance', metric: 'streakDays', baseTarget: 21, difficulty: 'specific', category: 'Série' },
    { id: 'pu_day_quad', title: '4 séances pompes le même jour', metric: 'maxSessionsSingleDay', baseTarget: 4, difficulty: 'endurance', category: 'Rythme' },
    { id: 'pu_morning_12', title: '12 séances avant 9 h', metric: 'morningSessionCount', baseTarget: 12, difficulty: 'specific', category: 'Rythme' },
    { id: 'pu_week_sessions_6', title: '6 séances sur une même semaine ISO', metric: 'bestWeeklySessions', baseTarget: 6, difficulty: 'endurance', category: 'Semaine' },
    /** Pic séance très haut — record unique */
    { id: 'pu_single_200', title: '200 pompes sur une seule séance', metric: 'maxRepsSingle', baseTarget: 200, difficulty: 'elite', category: 'Pic séance' }
  ];
}

function sliceContributing(arr, max) {
  const items = arr.slice(0, max);
  const moreCount = Math.max(0, arr.length - items.length);
  return { items, moreCount };
}

function sortDescRaw(rows) {
  return [...rows].sort((a, b) => {
    const ta = parseSessionDateTime(a.raw)?.getTime() ?? 0;
    const tb = parseSessionDateTime(b.raw)?.getTime() ?? 0;
    return tb - ta;
  });
}

export function collectPushupContributingSessions(trophy, rows, stats) {
  if (!stats || trophy.auto === false) {
    return { items: [], moreCount: 0, hint: null };
  }
  const m = trophy.metric;
  const maxPreview = 12;
  const rawList = (r) => r.raw;

  if (m === 'totalReps' || m === 'totalDurationMin') {
    const sorted = sortDescRaw(rows);
    const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
    return {
      items,
      moreCount,
      hint: m === 'totalReps' ? 'Toutes les séances comptent dans le cumul de pompes.' : 'Toutes les séances comptent dans le cumul des durées saisies.'
    };
  }

  if (m === 'maxRepsSingle') {
    const ref = stats.maxRepsSingle;
    const hits = rows.filter((r) => r.reps >= ref - 1e-6).sort((a, b) => b.reps - a.reps);
    const { items, moreCount } = sliceContributing(
      hits.map(rawList),
      maxPreview
    );
    return {
      items,
      moreCount,
      hint: ref > 0 ? `Séances au record (ou ex aequo) : ${ref} pompes.` : 'Pas encore de séance avec pompes saisies.'
    };
  }

  if (m === 'maxSessionDurationMin') {
    const ref = stats.maxSessionDurationMin;
    const hits = rows.filter((r) => r.durationMin + 1e-6 >= ref).sort((a, b) => b.durationMin - a.durationMin);
    const { items, moreCount } = sliceContributing(
      hits.map(rawList),
      maxPreview
    );
    return {
      items,
      moreCount,
      hint: ref > 0 ? `Séances les plus longues (durée saisie) : ≥ ${ref} min.` : 'Pas de durée de séance enregistrée.'
    };
  }

  if (m === 'bestWeeklyReps') {
    if (stats.peakWeekRepsKey) {
      const hits = rows.filter((r) => r.weekKey === stats.peakWeekRepsKey);
      const sorted = sortDescRaw(hits);
      const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
      return {
        items,
        moreCount,
        hint: `Semaine la plus chargée en reps : ${stats.peakWeekRepsKey} (${stats.bestWeeklyReps} pompes).`
      };
    }
    const sorted = sortDescRaw(rows);
    const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
    return { items, moreCount, hint: 'Aperçu des séances (semaine record non isolée).' };
  }

  if (m === 'bestMonthlyReps') {
    if (stats.peakMonthRepsKey) {
      const hits = rows.filter((r) => r.monthKey === stats.peakMonthRepsKey);
      const sorted = sortDescRaw(hits);
      const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
      return {
        items,
        moreCount,
        hint: `Mois le plus dense : ${stats.peakMonthRepsKey} (${stats.bestMonthlyReps} pompes).`
      };
    }
    const sorted = sortDescRaw(rows);
    const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
    return { items, moreCount, hint: 'Aperçu des séances (mois record non isolé).' };
  }

  if (m === 'bestWeeklySessions') {
    const best = stats.bestWeeklySessions;
    if (best <= 0) return { items: [], moreCount: 0, hint: null };
    const countByWeek = new Map();
    rows.forEach((r) => {
      countByWeek.set(r.weekKey, (countByWeek.get(r.weekKey) || 0) + 1);
    });
    let targetWeek = null;
    countByWeek.forEach((cnt, wk) => {
      if (cnt === best) targetWeek = wk;
    });
    if (targetWeek) {
      const hits = rows.filter((r) => r.weekKey === targetWeek);
      const sorted = sortDescRaw(hits);
      const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
      return {
        items,
        moreCount,
        hint: `Semaine ISO avec le plus de séances : ${targetWeek} (${best} séances).`
      };
    }
  }

  if (m === 'bestMonthlySessions') {
    const best = stats.bestMonthlySessions;
    const monthHit = findPeakMonthKey(rows, (list) => list.length);
    if (monthHit) {
      const hits = rows.filter((r) => r.monthKey === monthHit);
      const sorted = sortDescRaw(hits);
      const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
      return {
        items,
        moreCount,
        hint: `Mois avec le plus de séances : ${monthHit} (${best} séances).`
      };
    }
  }

  if (m === 'streakDays' && stats.streakDates && stats.streakDates.size > 0) {
    const hits = rows.filter((r) => stats.streakDates.has(r.dateKey));
    const sorted = [...hits].sort((a, b) => a.dateKey.localeCompare(b.dateKey));
    const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
    return {
      items,
      moreCount,
      hint: `Jours de ta plus longue série (${stats.streakDays} j).`
    };
  }

  if (m === 'maxSessionsSingleDay') {
    const best = stats.maxSessionsSingleDay;
    const dayKeys = [];
    byDayCounts(rows).forEach((cnt, dk) => {
      if (cnt === best && best > 0) dayKeys.push(dk);
    });
    const dk = dayKeys[0];
    if (dk) {
      const hits = rows.filter((r) => r.dateKey === dk);
      const sorted = sortDescRaw(hits);
      const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
      return {
        items,
        moreCount,
        hint: `Journée la plus dense : ${dk} (${best} séances).`
      };
    }
  }

  if (m === 'morningSessionCount') {
    const hits = rows.filter((r) => (r.hour ?? 99) < 9);
    const sorted = sortDescRaw(hits);
    const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
    return { items, moreCount, hint: 'Séances commencées avant 9 h (heure saisie).' };
  }

  if (m === 'bestWeeklyDurationMin') {
    let bestWk = null;
    let bestVal = -1;
    const wm = new Map();
    rows.forEach((r) => {
      wm.set(r.weekKey, (wm.get(r.weekKey) || 0) + r.durationMin);
    });
    wm.forEach((v, k) => {
      if (v > bestVal) {
        bestVal = v;
        bestWk = k;
      }
    });
    if (bestWk) {
      const hits = rows.filter((r) => r.weekKey === bestWk);
      const sorted = sortDescRaw(hits);
      const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
      return {
        items,
        moreCount,
        hint: `Semaine la plus longue en temps de séance : ${bestWk} (${stats.bestWeeklyDurationMin} min cumulées).`
      };
    }
  }

  if (m === 'sessionCount') {
    const sorted = sortDescRaw(rows);
    const { items, moreCount } = sliceContributing(sorted.map(rawList), maxPreview);
    return { items, moreCount, hint: 'Aperçu des séances les plus récentes.' };
  }

  return { items: [], moreCount: 0, hint: null };
}

function byDayCounts(rows) {
  const m = new Map();
  rows.forEach((r) => {
    m.set(r.dateKey, (m.get(r.dateKey) || 0) + 1);
  });
  return m;
}

function findPeakMonthKey(rows, scoreFn) {
  const byMonth = new Map();
  rows.forEach((r) => {
    if (!byMonth.has(r.monthKey)) byMonth.set(r.monthKey, []);
    byMonth.get(r.monthKey).push(r);
  });
  let bestK = null;
  let bestS = -1;
  byMonth.forEach((list, k) => {
    const s = scoreFn(list);
    if (s > bestS) {
      bestS = s;
      bestK = k;
    }
  });
  return bestK;
}

function scoreFromResults(results) {
  let raw = 0;
  let max = 0;
  results.forEach((r) => {
    const pts = DIFFICULTY_POINTS[r.difficulty] ?? 10;
    max += pts;
    if (r.highestLevel) raw += pts;
  });
  const composite = max > 0 ? Math.round((raw / max) * 1000) / 10 : 0;
  return { scoreRaw: raw, scoreMax: max, scoreComposite: composite };
}

export function evaluatePushupTrophies({ sessions = [], workoutAggregate = null } = {}) {
  const stats = buildPushupStats(sessions, workoutAggregate);

  const catalog = buildPushupTrophiesCatalog();
  const results = [];
  catalog.forEach((trophy) => {
    const levels = LEVELS.map((level) => ({ level, ...evaluateSingle(trophy, stats, level) }));
    const highestIdx = [...levels].map((l, i) => (l.unlocked ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
    const highestLevel = highestIdx >= 0 ? levels[highestIdx].level : null;
    const contrib = collectPushupContributingSessions(trophy, stats.__rows || [], stats);
    results.push({
      ...trophy,
      levels,
      highestLevel,
      contributingSessions: contrib.items,
      contributingMoreCount: contrib.moreCount,
      contributingHint: contrib.hint
    });
  });

  const { scoreRaw, scoreMax, scoreComposite } = scoreFromResults(results);
  return {
    activityType: 'pushups',
    stats,
    results,
    scoreRaw,
    scoreMax,
    scoreComposite
  };
}

export function describePushupTrophyCurrentProgress(trophy, stats) {
  if (!stats || !trophy) return '—';
  switch (trophy.metric) {
    case 'sessionCount':
      return `Séances : ${stats.sessionCount}`;
    case 'totalReps':
      return `Pompes cumulées : ${stats.totalReps.toLocaleString('fr-FR')}`;
    case 'maxRepsSingle':
      return `Record / séance : ${stats.maxRepsSingle.toLocaleString('fr-FR')} pompes`;
    case 'totalDurationMin':
      return `Minutes de séance cumulées : ${Math.round(stats.totalDurationMin * 10) / 10}`;
    case 'maxSessionDurationMin':
      return `Plus longue séance : ${Math.round(stats.maxSessionDurationMin * 10) / 10} min`;
    case 'streakDays':
      return `Plus longue série (jours avec séance) : ${stats.streakDays} j`;
    case 'maxSessionsSingleDay':
      return `Max séances / jour : ${stats.maxSessionsSingleDay}`;
    case 'bestWeeklySessions':
      return `Pic hebdo séances : ${stats.bestWeeklySessions}`;
    case 'bestMonthlySessions':
      return `Pic mensuel séances : ${stats.bestMonthlySessions}`;
    case 'bestWeeklyReps':
      return `Pic hebdo pompes : ${stats.bestWeeklyReps.toLocaleString('fr-FR')}`;
    case 'bestMonthlyReps':
      return `Pic mensuel pompes : ${stats.bestMonthlyReps.toLocaleString('fr-FR')}`;
    case 'bestWeeklyDurationMin':
      return `Pic hebdo durée séance : ${Math.round(stats.bestWeeklyDurationMin * 10) / 10} min`;
    case 'morningSessionCount':
      return `Séances avant 9 h : ${stats.morningSessionCount}`;
    default:
      return '—';
  }
}

export function describePushupTrophyLevelRequirement(trophy, target, levelLabel) {
  if (!trophy) return '';
  const m = trophy.metric;
  if (m === 'totalReps' || m === 'maxRepsSingle' || m === 'bestWeeklyReps' || m === 'bestMonthlyReps') {
    return `${levelLabel} : ≥ ${Math.round(target).toLocaleString('fr-FR')} pompes`;
  }
  if (m === 'totalDurationMin' || m === 'maxSessionDurationMin' || m === 'bestWeeklyDurationMin') {
    return `${levelLabel} : ≥ ${target.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} min`;
  }
  if (COUNT_LIKE_METRICS.has(m)) {
    return `${levelLabel} : ≥ ${Math.round(target).toLocaleString('fr-FR')}`;
  }
  return `${levelLabel} : seuil ${target}`;
}

export function computePushupTrophiesXpDetailed(results) {
  return computeRunningTrophiesXpDetailed(results);
}
