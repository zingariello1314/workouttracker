/**
 * Trophées « simples » corde à sauter & gainage : volume, durée, pics hebdo/mensuel,
 * enchaînements (plusieurs séances / jour), séries de jours (streaks).
 * Données alignées sur les champs réellement saisis (enduranceFormSchema + enrichissements session).
 */
import { isMockEnduranceSession } from '../../utils/calendarUtils';
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

/** Métriques cumulées / max où le seuil monte avec le palier (× multiplicateur). */
const SUM_LIKE_METRICS = new Set([
  'totalJumps',
  'totalDurationMin',
  'maxJumpsSingle',
  'maxSessionDurationMin',
  'bestWeeklyJumps',
  'bestMonthlyJumps',
  'bestWeeklyDurationMin',
  'bestMonthlyDurationMin',
  'maxFieldStreakJumps',
  'totalPlankSec',
  'maxPlankSingleSec',
  'totalGainageSessionMin',
  'maxGainageSessionMinSingle',
  'bestWeeklyPlankSec',
  'bestMonthlyPlankSec'
]);

/** Entiers : ceil(base × palier) avec anti-plateau comme la course. */
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

function parseMmSsToSec(str) {
  if (str == null || str === '') return 0;
  const parts = String(str).split(':');
  if (parts.length === 2) {
    const m = toNumber(parts[0], 0);
    const s = toNumber(parts[1], 0);
    return m * 60 + s;
  }
  return toNumber(str, 0);
}

function sessionDateKey(session) {
  if (typeof session?.date === 'string') {
    const m = session.date.match(/^\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];
  }
  return null;
}

function parseSessionDateTime(session) {
  const dk = sessionDateKey(session);
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

  const isInverse = false;
  if (isInverse) return base;

  const raw = base * mult;
  if (SUM_LIKE_METRICS.has(trophy.metric)) {
    if (
      trophy.metric === 'totalJumps' ||
      trophy.metric === 'maxJumpsSingle' ||
      trophy.metric === 'bestWeeklyJumps' ||
      trophy.metric === 'bestMonthlyJumps' ||
      trophy.metric === 'maxFieldStreakJumps' ||
      trophy.metric === 'totalPlankSec' ||
      trophy.metric === 'maxPlankSingleSec' ||
      trophy.metric === 'bestWeeklyPlankSec' ||
      trophy.metric === 'bestMonthlyPlankSec'
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

function buildJumpRopeStats(sessions = []) {
  const rows = (sessions || [])
    .filter((s) => s && !isMockEnduranceSession(s))
    .map((s) => {
      const dateKey = sessionDateKey(s);
      if (!dateKey) return null;
      let durationSec = toNumber(s.durationSec, NaN);
      if (!Number.isFinite(durationSec) || durationSec < 0) {
        if (typeof s.duration === 'number' && Number.isFinite(s.duration)) {
          durationSec = s.duration * 60;
        } else {
          durationSec = parseMmSsToSec(s.duration);
        }
      }
      const durationMin = durationSec > 0 ? durationSec / 60 : 0;
      const jumps = Math.max(0, Math.floor(toNumber(s.jumps, 0)));
      const d = parseSessionDateTime(s) || new Date(`${dateKey}T12:00:00`);
      return {
        raw: s,
        dateKey,
        weekKey: buildWeekKey(d),
        monthKey: buildMonthKey(d),
        durationMin,
        jumps,
        fieldStreak: Math.max(0, Math.floor(toNumber(s.bestStreak, 0))),
        hour: startHour(s)
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0));

  const weekMap = new Map();
  const monthMap = new Map();
  const byDay = new Map();

  let totalJumps = 0;
  let totalDurationMin = 0;
  let maxJumpsSingle = 0;
  let maxSessionDurationMin = 0;
  let maxFieldStreakJumps = 0;
  let morningSessionCount = 0;

  rows.forEach((r) => {
    totalJumps += r.jumps;
    totalDurationMin += r.durationMin;
    maxJumpsSingle = Math.max(maxJumpsSingle, r.jumps);
    maxSessionDurationMin = Math.max(maxSessionDurationMin, r.durationMin);
    maxFieldStreakJumps = Math.max(maxFieldStreakJumps, r.fieldStreak);
    if (r.hour != null && r.hour < 9) morningSessionCount += 1;

    byDay.set(r.dateKey, (byDay.get(r.dateKey) || 0) + 1);

    const w = weekMap.get(r.weekKey) || { sessions: 0, jumps: 0, durationMin: 0 };
    w.sessions += 1;
    w.jumps += r.jumps;
    w.durationMin += r.durationMin;
    weekMap.set(r.weekKey, w);

    const m = monthMap.get(r.monthKey) || { sessions: 0, jumps: 0, durationMin: 0 };
    m.sessions += 1;
    m.jumps += r.jumps;
    m.durationMin += r.durationMin;
    monthMap.set(r.monthKey, m);
  });

  const uniqueDays = Array.from(new Set(rows.map((r) => r.dateKey))).sort();
  const streakDays = maxConsecutiveDayStreak(uniqueDays);
  let maxSessionsSingleDay = 0;
  byDay.forEach((n) => {
    maxSessionsSingleDay = Math.max(maxSessionsSingleDay, n);
  });

  let bestWeeklySessions = 0;
  let bestWeeklyJumps = 0;
  let bestWeeklyDurationMin = 0;
  weekMap.forEach((w) => {
    bestWeeklySessions = Math.max(bestWeeklySessions, w.sessions);
    bestWeeklyJumps = Math.max(bestWeeklyJumps, w.jumps);
    bestWeeklyDurationMin = Math.max(bestWeeklyDurationMin, w.durationMin);
  });

  let bestMonthlySessions = 0;
  let bestMonthlyJumps = 0;
  let bestMonthlyDurationMin = 0;
  monthMap.forEach((m) => {
    bestMonthlySessions = Math.max(bestMonthlySessions, m.sessions);
    bestMonthlyJumps = Math.max(bestMonthlyJumps, m.jumps);
    bestMonthlyDurationMin = Math.max(bestMonthlyDurationMin, m.durationMin);
  });

  return {
    activity: 'jumprope',
    sessionCount: rows.length,
    totalJumps,
    totalDurationMin,
    maxJumpsSingle,
    maxSessionDurationMin,
    maxFieldStreakJumps,
    streakDays,
    maxSessionsSingleDay,
    bestWeeklySessions,
    bestMonthlySessions,
    bestWeeklyJumps,
    bestMonthlyJumps,
    bestWeeklyDurationMin,
    bestMonthlyDurationMin,
    morningSessionCount,
    __rows: rows
  };
}

function buildGainageStats(sessions = []) {
  const rows = (sessions || [])
    .filter((s) => s && !isMockEnduranceSession(s))
    .map((s) => {
      const dateKey = sessionDateKey(s);
      if (!dateKey) return null;
      const plankSec = Math.max(0, Math.floor(toNumber(s.count, 0)));
      const sessionMin = Math.max(0, toNumber(s.duration, 0));
      const d = parseSessionDateTime(s) || new Date(`${dateKey}T12:00:00`);
      return {
        raw: s,
        dateKey,
        weekKey: buildWeekKey(d),
        monthKey: buildMonthKey(d),
        plankSec,
        sessionMin,
        hour: startHour(s)
      };
    })
    .filter(Boolean)
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : a.dateKey > b.dateKey ? 1 : 0));

  const weekMap = new Map();
  const monthMap = new Map();
  const byDay = new Map();

  let totalPlankSec = 0;
  let totalGainageSessionMin = 0;
  let maxPlankSingleSec = 0;
  let maxGainageSessionMinSingle = 0;
  let morningSessionCount = 0;

  rows.forEach((r) => {
    totalPlankSec += r.plankSec;
    totalGainageSessionMin += r.sessionMin;
    maxPlankSingleSec = Math.max(maxPlankSingleSec, r.plankSec);
    maxGainageSessionMinSingle = Math.max(maxGainageSessionMinSingle, r.sessionMin);
    if (r.hour != null && r.hour < 9) morningSessionCount += 1;
    byDay.set(r.dateKey, (byDay.get(r.dateKey) || 0) + 1);

    const w = weekMap.get(r.weekKey) || { sessions: 0, plank: 0 };
    w.sessions += 1;
    w.plank += r.plankSec;
    weekMap.set(r.weekKey, w);

    const m = monthMap.get(r.monthKey) || { sessions: 0, plank: 0 };
    m.sessions += 1;
    m.plank += r.plankSec;
    monthMap.set(r.monthKey, m);
  });

  const uniqueDays = Array.from(new Set(rows.map((r) => r.dateKey))).sort();
  const streakDays = maxConsecutiveDayStreak(uniqueDays);
  let maxSessionsSingleDay = 0;
  byDay.forEach((n) => {
    maxSessionsSingleDay = Math.max(maxSessionsSingleDay, n);
  });

  let bestWeeklySessions = 0;
  let bestWeeklyPlankSec = 0;
  weekMap.forEach((w) => {
    bestWeeklySessions = Math.max(bestWeeklySessions, w.sessions);
    bestWeeklyPlankSec = Math.max(bestWeeklyPlankSec, w.plank);
  });

  let bestMonthlySessions = 0;
  let bestMonthlyPlankSec = 0;
  monthMap.forEach((m) => {
    bestMonthlySessions = Math.max(bestMonthlySessions, m.sessions);
    bestMonthlyPlankSec = Math.max(bestMonthlyPlankSec, m.plank);
  });

  return {
    activity: 'gainage',
    sessionCount: rows.length,
    totalPlankSec,
    totalGainageSessionMin,
    maxPlankSingleSec,
    maxGainageSessionMinSingle,
    streakDays,
    maxSessionsSingleDay,
    bestWeeklySessions,
    bestMonthlySessions,
    bestWeeklyPlankSec,
    bestMonthlyPlankSec,
    morningSessionCount,
    __rows: rows
  };
}

export function buildSimpleEnduranceStats(activityType, sessions) {
  if (activityType === 'gainage') return buildGainageStats(sessions);
  return buildJumpRopeStats(sessions);
}

function buildJumpRopeCatalog() {
  return [
    { id: 'jr_first', title: 'Première séance corde', metric: 'sessionCount', baseTarget: 1, difficulty: 'simple', category: 'Premiers pas' },
    { id: 'jr_volume_jumps_400', title: '400 sauts au total (cumul)', metric: 'totalJumps', baseTarget: 400, difficulty: 'simple', category: 'Volume' },
    { id: 'jr_volume_time_25', title: '25 minutes de corde cumulées (durée séance)', metric: 'totalDurationMin', baseTarget: 25, difficulty: 'simple', category: 'Volume' },
    { id: 'jr_day_double', title: '2 séances de corde le même jour', metric: 'maxSessionsSingleDay', baseTarget: 2, difficulty: 'simple', category: 'Rythme du jour' },
    { id: 'jr_morning_3', title: '3 séances avant 9 h', metric: 'morningSessionCount', baseTarget: 3, difficulty: 'intermediate', category: 'Rythme' },
    { id: 'jr_week_sessions_3', title: '3 séances sur une même semaine ISO', metric: 'bestWeeklySessions', baseTarget: 3, difficulty: 'intermediate', category: 'Semaine' },
    { id: 'jr_month_sessions_10', title: '10 séances sur un même mois calendaire', metric: 'bestMonthlySessions', baseTarget: 10, difficulty: 'intermediate', category: 'Mois' },
    { id: 'jr_streak_4', title: '4 jours d’affilée avec au moins une séance', metric: 'streakDays', baseTarget: 4, difficulty: 'intermediate', category: 'Série' },
    { id: 'jr_streak_10', title: '10 jours consécutifs avec séance', metric: 'streakDays', baseTarget: 10, difficulty: 'specific', category: 'Série' },
    { id: 'jr_streak_21', title: '21 jours consécutifs avec séance', metric: 'streakDays', baseTarget: 21, difficulty: 'endurance', category: 'Série' },
    { id: 'jr_single_150', title: '150 sauts sur une séance', metric: 'maxJumpsSingle', baseTarget: 150, difficulty: 'simple', category: 'Pic séance' },
    { id: 'jr_single_400', title: '400 sauts sur une séance', metric: 'maxJumpsSingle', baseTarget: 400, difficulty: 'specific', category: 'Pic séance' },
    { id: 'jr_field_streak_80', title: '80 sauts d’affilée enregistrés (champ « meilleure série »)', metric: 'maxFieldStreakJumps', baseTarget: 80, difficulty: 'intermediate', category: 'Pic séance' },
    { id: 'jr_week_jumps_800', title: '800 sauts sur une semaine ISO', metric: 'bestWeeklyJumps', baseTarget: 800, difficulty: 'intermediate', category: 'Semaine' },
    { id: 'jr_month_jumps_3500', title: '3500 sauts sur un mois calendaire', metric: 'bestMonthlyJumps', baseTarget: 3500, difficulty: 'endurance', category: 'Mois' },
    { id: 'jr_week_time_45', title: '45 minutes de corde sur une semaine ISO', metric: 'bestWeeklyDurationMin', baseTarget: 45, difficulty: 'specific', category: 'Semaine' },
    { id: 'jr_total_jumps_6000', title: '6000 sauts au total', metric: 'totalJumps', baseTarget: 6000, difficulty: 'elite', category: 'Volume' },
    { id: 'jr_day_triple', title: '3 séances de corde dans la même journée', metric: 'maxSessionsSingleDay', baseTarget: 3, difficulty: 'specific', category: 'Rythme du jour' }
  ];
}

function buildGainageCatalog() {
  return [
    { id: 'ga_first', title: 'Première séance de gainage', metric: 'sessionCount', baseTarget: 1, difficulty: 'simple', category: 'Premiers pas' },
    { id: 'ga_plank_total_180', title: '3 minutes cumulées en planche (secondes saisies)', metric: 'totalPlankSec', baseTarget: 180, difficulty: 'simple', category: 'Temps planche' },
    { id: 'ga_session_time_20', title: '20 minutes de séance cumulées (durée séance)', metric: 'totalGainageSessionMin', baseTarget: 20, difficulty: 'simple', category: 'Temps séance' },
    { id: 'ga_day_double', title: '2 séances de gainage le même jour', metric: 'maxSessionsSingleDay', baseTarget: 2, difficulty: 'simple', category: 'Rythme du jour' },
    { id: 'ga_day_triple', title: '3 séances de gainage dans la même journée', metric: 'maxSessionsSingleDay', baseTarget: 3, difficulty: 'intermediate', category: 'Rythme du jour' },
    { id: 'ga_morning_3', title: '3 séances avant 9 h', metric: 'morningSessionCount', baseTarget: 3, difficulty: 'intermediate', category: 'Rythme' },
    { id: 'ga_week_sessions_4', title: '4 séances sur une même semaine ISO', metric: 'bestWeeklySessions', baseTarget: 4, difficulty: 'intermediate', category: 'Semaine' },
    { id: 'ga_month_sessions_12', title: '12 séances sur un même mois calendaire', metric: 'bestMonthlySessions', baseTarget: 12, difficulty: 'intermediate', category: 'Mois' },
    { id: 'ga_streak_4', title: '4 jours d’affilée avec au moins une séance', metric: 'streakDays', baseTarget: 4, difficulty: 'intermediate', category: 'Série' },
    { id: 'ga_streak_10', title: '10 jours consécutifs avec séance', metric: 'streakDays', baseTarget: 10, difficulty: 'specific', category: 'Série' },
    { id: 'ga_streak_21', title: '21 jours consécutifs avec séance', metric: 'streakDays', baseTarget: 21, difficulty: 'endurance', category: 'Série' },
    { id: 'ga_single_plank_60', title: '60 secondes de planche sur une séance', metric: 'maxPlankSingleSec', baseTarget: 60, difficulty: 'simple', category: 'Pic séance' },
    { id: 'ga_single_plank_180', title: '3 minutes de planche sur une séance', metric: 'maxPlankSingleSec', baseTarget: 180, difficulty: 'specific', category: 'Pic séance' },
    { id: 'ga_single_session_15', title: '15 minutes sur une séance (durée séance)', metric: 'maxGainageSessionMinSingle', baseTarget: 15, difficulty: 'specific', category: 'Pic séance' },
    { id: 'ga_week_plank_600', title: '10 minutes de planche sur une semaine ISO (cumul secondes)', metric: 'bestWeeklyPlankSec', baseTarget: 600, difficulty: 'intermediate', category: 'Semaine' },
    { id: 'ga_month_plank_3000', title: '50 minutes de planche sur un mois (cumul)', metric: 'bestMonthlyPlankSec', baseTarget: 3000, difficulty: 'endurance', category: 'Mois' },
    { id: 'ga_total_plank_7200', title: '2 h de planche cumulées (toutes séances)', metric: 'totalPlankSec', baseTarget: 7200, difficulty: 'elite', category: 'Temps planche' }
  ];
}

export function buildSimpleEnduranceTrophiesCatalog(activityType) {
  if (activityType === 'gainage') return buildGainageCatalog();
  return buildJumpRopeCatalog();
}

function formatInt(n) {
  return Math.round(n).toLocaleString('fr-FR');
}

function formatMinOne(n) {
  if (!Number.isFinite(n)) return '—';
  const v = Math.round(n * 10) / 10;
  return `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} min`;
}

export function describeSimpleEnduranceTrophyCurrentProgress(trophy, stats) {
  if (!stats || !trophy) return '—';
  switch (trophy.metric) {
    case 'sessionCount':
      return `Séances enregistrées : ${formatInt(stats.sessionCount)}`;
    case 'totalJumps':
      return `Sauts cumulés : ${formatInt(stats.totalJumps)}`;
    case 'totalDurationMin':
      return `Durée cumulée (séances) : ${formatMinOne(stats.totalDurationMin)}`;
    case 'maxJumpsSingle':
      return `Record sauts / séance : ${formatInt(stats.maxJumpsSingle)}`;
    case 'maxSessionDurationMin':
      return `Plus longue séance : ${formatMinOne(stats.maxSessionDurationMin)}`;
    case 'maxFieldStreakJumps':
      return `Meilleure série (champ) : ${formatInt(stats.maxFieldStreakJumps)}`;
    case 'streakDays':
      return `Plus longue série de jours avec séance : ${formatInt(stats.streakDays)} j`;
    case 'maxSessionsSingleDay':
      return `Pic séances / jour : ${formatInt(stats.maxSessionsSingleDay)}`;
    case 'bestWeeklySessions':
      return `Pic hebdo (semaine ISO) : ${formatInt(stats.bestWeeklySessions)} séances`;
    case 'bestMonthlySessions':
      return `Pic mensuel : ${formatInt(stats.bestMonthlySessions)} séances`;
    case 'bestWeeklyJumps':
      return `Pic hebdo sauts : ${formatInt(stats.bestWeeklyJumps)}`;
    case 'bestMonthlyJumps':
      return `Pic mensuel sauts : ${formatInt(stats.bestMonthlyJumps)}`;
    case 'bestWeeklyDurationMin':
      return `Pic hebdo durée : ${formatMinOne(stats.bestWeeklyDurationMin)}`;
    case 'bestMonthlyDurationMin':
      return `Pic mensuel durée : ${formatMinOne(stats.bestMonthlyDurationMin)}`;
    case 'morningSessionCount':
      return `Séances avant 9 h : ${formatInt(stats.morningSessionCount)}`;
    case 'totalPlankSec':
      return `Secondes planche cumulées : ${formatInt(stats.totalPlankSec)}`;
    case 'totalGainageSessionMin':
      return `Minutes de séance cumulées : ${formatMinOne(stats.totalGainageSessionMin)}`;
    case 'maxPlankSingleSec':
      return `Max planche / séance : ${formatInt(stats.maxPlankSingleSec)} s`;
    case 'maxGainageSessionMinSingle':
      return `Plus longue séance : ${formatMinOne(stats.maxGainageSessionMinSingle)}`;
    case 'bestWeeklyPlankSec':
      return `Pic hebdo planche : ${formatInt(stats.bestWeeklyPlankSec)} s`;
    case 'bestMonthlyPlankSec':
      return `Pic mensuel planche : ${formatInt(stats.bestMonthlyPlankSec)} s`;
    default:
      return '—';
  }
}

export function describeSimpleEnduranceTrophyLevelRequirement(trophy, target, levelLabel) {
  if (!trophy) return '';
  const m = trophy.metric;
  if (m === 'totalJumps' || m === 'maxJumpsSingle' || m === 'bestWeeklyJumps' || m === 'bestMonthlyJumps' || m === 'maxFieldStreakJumps') {
    return `${levelLabel} : atteindre ≥ ${formatInt(target)} sauts`;
  }
  if (m === 'totalDurationMin' || m === 'maxSessionDurationMin' || m === 'bestWeeklyDurationMin' || m === 'bestMonthlyDurationMin' || m === 'totalGainageSessionMin' || m === 'maxGainageSessionMinSingle') {
    return `${levelLabel} : atteindre ≥ ${formatMinOne(target)}`;
  }
  if (m === 'totalPlankSec' || m === 'maxPlankSingleSec' || m === 'bestWeeklyPlankSec' || m === 'bestMonthlyPlankSec') {
    return `${levelLabel} : atteindre ≥ ${formatInt(target)} s`;
  }
  if (COUNT_LIKE_METRICS.has(m)) {
    return `${levelLabel} : atteindre ≥ ${formatInt(target)}`;
  }
  return `${levelLabel} : seuil ${formatInt(target)}`;
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

export function evaluateSimpleEnduranceTrophies({ activityType, sessions }) {
  const stats = buildSimpleEnduranceStats(activityType, sessions);
  const catalog = buildSimpleEnduranceTrophiesCatalog(activityType);
  const results = catalog.map((trophy) => {
    const levels = LEVELS.map((level) => {
      const ev = evaluateSingle(trophy, stats, level);
      return { level, ...ev };
    });
    const highestIdx = [...levels].reverse().findIndex((l) => l.unlocked);
    const highestLevel = highestIdx >= 0 ? levels[levels.length - 1 - highestIdx].level : null;
    return {
      ...trophy,
      levels,
      highestLevel,
      contributingSessions: [],
      contributingMoreCount: 0
    };
  });
  const { scoreRaw, scoreMax, scoreComposite } = scoreFromResults(results);
  return { activityType, stats, results, scoreRaw, scoreMax, scoreComposite };
}

export function computeSimpleEnduranceTrophiesXpDetailed(results) {
  return computeRunningTrophiesXpDetailed(results);
}
