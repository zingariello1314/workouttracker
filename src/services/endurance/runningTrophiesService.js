import {
  inferRunningSessionTypeFromGarminActivity,
  classifyLapPhase
} from '../../utils/garminRunningLaps';
import { isWalkingLikeRunningSession } from '../../utils/runningSessionMovementKind';

const DIFFICULTY_POINTS = {
  simple: 10,
  intermediate: 25,
  specific: 35,
  endurance: 45,
  elite: 60
};

const LEVEL_MULTIPLIERS = {
  bronze: 1,
  silver: 1.35,
  gold: 1.75,
  elite: 2.2
};

const LEVELS = ['bronze', 'silver', 'gold', 'elite'];

/** Trophées « durée » où l’intitulé exige une sortie sans arrêt (Garmin) ou durée manuelle honnête. */
const CONTINUOUS_TROPHIES_REQUIRE_NO_STOP = new Set([
  'run_30min',
  'run_45min',
  'run_60min',
  'run_130',
  'run_2h',
  'run_3h'
]);

/** Métriques « plus haut = mieux » avec seuil distance (km) qui monte par palier. */
const DISTANCE_LIKE_METRICS = new Set([
  'singleDistance',
  'totalDistance',
  'weeklyDistance',
  'monthlyDistance',
  'efDistance',
  'efSingleDistance'
]);

/** Compteurs entiers (seuil = ceil(base × palier)). */
const COUNT_LIKE_METRICS = new Set([
  'weeklyRuns',
  'monthlyRuns',
  'streakDays',
  'morningRuns',
  'intervalRuns',
  'stablePaceRuns',
  'runsWithoutStop',
  'recordImprovements',
  'runCount',
  'rollingLongRunWeek',
  'monthNoSkipMonths',
  'improveBucketsCount',
  'marathonNegativeSplit',
  'challengeStat',
  'completeSimplesCount'
]);

/**
 * Plancher allure (sec/km) : au-delà, les paliers « élite » ne vont pas (réalisme ~ records mondiaux par distance).
 */
export function inversePaceFloorSec(metric) {
  if (metric === 'best10kPaceMaxSec') return 158; // ~2:38/km (ordre de grandeur record 10 km)
  if (metric === 'best5kPaceMaxSec') return 152; // ~2:32/km
  if (metric === 'best1kPaceMaxSec') return 140; // ~2:20/km sur 1 km
  if (metric === 'pace1000AvgMaxSec') return 258; // ~4:18/km — plancher réaliste côté élite
  return 155;
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Jour calendaire local (YYYY-MM-DD), aligné sur la date saisie — évite les décalages UTC sur les séries. */
function dateKeyLocalFromDate(d) {
  if (!d || !(d instanceof Date) || Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${day}`;
}

function parseDurationToMinutes(duration) {
  if (duration == null || duration === '') return 0;
  if (typeof duration === 'number') return duration;
  const raw = String(duration);
  if (raw.includes(':')) {
    const parts = raw.split(':').map((p) => Number(p));
    if (parts.length === 3) {
      const [h, m, s] = parts;
      return (h * 3600 + m * 60 + s) / 60;
    }
    if (parts.length === 2) {
      const [m, s] = parts;
      return (m * 60 + s) / 60;
    }
  }
  return toNumber(raw, 0);
}

function paceToSecPerKm(pace) {
  if (!pace) return null;
  const raw = String(pace).replace(',', '.');
  if (raw.includes(':')) {
    const [m, s] = raw.split(':').map(Number);
    if (Number.isFinite(m) && Number.isFinite(s)) return m * 60 + s;
  }
  const numeric = toNumber(raw, NaN);
  if (Number.isFinite(numeric) && numeric > 0) return numeric * 60;
  return null;
}

function getPaceSec(session) {
  const explicit = paceToSecPerKm(session.pace);
  if (explicit) return explicit;
  const distanceKm = toNumber(session.distance, 0);
  const durationMin = parseDurationToMinutes(session.duration);
  if (distanceKm > 0 && durationMin > 0) return (durationMin * 60) / distanceKm;
  return null;
}

function startHour(session) {
  if (!session?.time) return null;
  const hh = Number(String(session.time).split(':')[0]);
  return Number.isFinite(hh) ? hh : null;
}

function normalizeRuns(sessions = []) {
  return sessions
    .map((s) => {
      const date = s?.date ? new Date(`${s.date}T${s.time || '00:00:00'}`) : null;
      return {
        ...s,
        __date: date,
        __distance: toNumber(s?.distance, 0),
        __durationMin: parseDurationToMinutes(s?.duration),
        __paceSec: getPaceSec(s),
        __avgHR: toNumber(s?.avgHR, 0),
        __maxHR: toNumber(s?.maxHR, 0)
      };
    })
    .filter((s) => s.__date instanceof Date && !Number.isNaN(s.__date.getTime()) && s.__distance > 0)
    .sort((a, b) => a.__date - b.__date);
}

/**
 * Complète FC moyenne / max depuis l’objet activité Garmin quand la session n’a pas ces champs,
 * pour que les trophées « endurance fondamentale » (basés sur __avgHR / __maxHR) restent alignés
 * sur les données affichées dans le détail Garmin.
 */
function mergeGarminHrIntoRun(run) {
  const g = run?.garmin;
  if (!g || typeof g !== 'object') return;
  const ga = toNumber(g.avgHR, 0);
  const gm = toNumber(g.maxHR, 0);
  if (run.__avgHR <= 0 && ga > 0) run.__avgHR = ga;
  if (run.__maxHR <= 0 && gm > 0) run.__maxHR = gm;
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

/** Semaines ISO qui ont au moins un jour dans ce mois calendaire (local). */
function listIsoWeekKeysTouchingMonth(year, monthIndex0) {
  const keys = [];
  const seen = new Set();
  const lastDay = new Date(year, monthIndex0 + 1, 0).getDate();
  for (let day = 1; day <= lastDay; day += 1) {
    const d = new Date(year, monthIndex0, day);
    const wk = buildWeekKey(d);
    if (!seen.has(wk)) {
      seen.add(wk);
      keys.push(wk);
    }
  }
  return keys.sort();
}

/**
 * Mois qualifié : pour chaque semaine ISO touchant le mois, au moins `minRuns` sorties
 * datées dans ce mois (évite un « pic » sur une seule semaine partielle).
 */
function monthMeetsSustainedWeeklyFloor(monthKey, runs, minRuns) {
  const parts = monthKey.split('-');
  const y = Number(parts[0]);
  const mo = Number(parts[1]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return false;
  const weeksTouching = listIsoWeekKeysTouchingMonth(y, mo - 1);
  if (!weeksTouching.length) return false;
  return weeksTouching.every((wk) => {
    const n = runs.filter((r) => buildMonthKey(r.__date) === monthKey && buildWeekKey(r.__date) === wk).length;
    return n >= minRuns;
  });
}

function enumerateCalendarMonthsBetweenRuns(runs) {
  if (!runs.length) return [];
  let minY = 99999;
  let minMo = 12;
  let maxY = 0;
  let maxMo = 1;
  runs.forEach((r) => {
    const d = r.__date;
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    if (y < minY || (y === minY && m < minMo)) {
      minY = y;
      minMo = m;
    }
    if (y > maxY || (y === maxY && m > maxMo)) {
      maxY = y;
      maxMo = m;
    }
  });
  const keys = [];
  let y = minY;
  let m = minMo;
  while (y < maxY || (y === maxY && m <= maxMo)) {
    keys.push(`${y}-${String(m).padStart(2, '0')}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return keys;
}

function addCalendarMonthKey(monthKey) {
  const [yStr, moStr] = monthKey.split('-');
  const y = Number(yStr);
  const mo = Number(moStr);
  const d = new Date(y, mo - 1, 1);
  d.setMonth(d.getMonth() + 1);
  return buildMonthKey(d);
}

function computeSustainWeeklyRunsStreakBest(runs, minRunsPerWeek) {
  const allMonths = enumerateCalendarMonthsBetweenRuns(runs);
  let bestLen = 0;
  let bestChains = [];
  for (let i = 0; i < allMonths.length; i += 1) {
    const chain = [];
    let expect = allMonths[i];
    for (let k = i; k < allMonths.length; k += 1) {
      const mk = allMonths[k];
      if (mk !== expect) break;
      if (!monthMeetsSustainedWeeklyFloor(mk, runs, minRunsPerWeek)) break;
      chain.push(mk);
      expect = addCalendarMonthKey(mk);
    }
    if (chain.length > bestLen) {
      bestLen = chain.length;
      bestChains = [chain];
    } else if (chain.length === bestLen && chain.length > 0) {
      bestChains.push(chain);
    }
  }
  let best = bestChains[0] || [];
  if (bestChains.length > 1) {
    best = bestChains.reduce((acc, ch) => {
      const accEnd = acc[acc.length - 1] || '';
      const chEnd = ch[ch.length - 1] || '';
      return chEnd.localeCompare(accEnd) >= 0 ? ch : acc;
    });
  }
  return { maxConsecutive: bestLen, bestMonths: best };
}

function maxConsecutiveDays(runs) {
  return computeLongestStreak(runs).length;
}

/** Plus longue série de jours consécutifs avec dates (YYYY-MM-DD) de cette fenêtre. */
function computeLongestStreak(runs) {
  if (!runs.length) return { length: 0, dates: [] };
  const uniq = [...new Set(runs.map((r) => dateKeyLocalFromDate(r.__date)).filter(Boolean))].sort();
  let best = 1;
  let bestStart = 0;
  let curStart = 0;
  let streak = 1;
  for (let i = 1; i < uniq.length; i += 1) {
    const prev = new Date(`${uniq[i - 1]}T12:00:00`);
    const cur = new Date(`${uniq[i]}T12:00:00`);
    const diff = (cur - prev) / 86400000;
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
  const dates = [];
  for (let j = 0; j < best; j += 1) {
    dates.push(uniq[bestStart + j]);
  }
  return { length: best, dates };
}

function countImprovedRecords(runs) {
  let bestPace = null;
  let improvements = 0;
  runs.forEach((run) => {
    if (run.__distance < 5 - 1e-6 || !run.__paceSec) return;
    if (bestPace == null || run.__paceSec < bestPace) {
      if (bestPace != null) improvements += 1;
      bestPace = run.__paceSec;
    }
  });
  return improvements;
}

function variabilitySecPerKm(run) {
  const laps = run?.garmin?.running?.laps;
  if (!Array.isArray(laps) || laps.length < 3) return null;
  const paceSecs = laps
    .map((lap) => {
      const distanceKm = toNumber(lap.distanceKm, 0) || (toNumber(lap.distanceMeters, 0) / 1000);
      const durationSec = toNumber(lap.durationSeconds, 0);
      if (distanceKm <= 0 || durationSec <= 0) return null;
      return durationSec / distanceKm;
    })
    .filter((v) => v && Number.isFinite(v));
  if (paceSecs.length < 3) return null;
  return Math.max(...paceSecs) - Math.min(...paceSecs);
}

function inferZone2Bounds(runs) {
  /** FC max « observée » sur les sorties : sert à estimer zone 2 (60–75 %), pas la FCmax théorique au laboratoire. */
  const maxHr = runs.reduce((acc, r) => Math.max(acc, r.__maxHR || 0), 0);
  const fallbackMax = maxHr > 0 ? maxHr : 190;
  return {
    min: Math.round(fallbackMax * 0.6),
    max: Math.round(fallbackMax * 0.75)
  };
}

function isGarminRunWithoutStop(garmin) {
  if (!garmin) return false;
  const laps = garmin?.running?.laps;
  const pauseCount = toNumber(garmin?.running?.pauseCount, 0);
  const hasRestLap =
    Array.isArray(laps) &&
    laps.some((lap) => {
      const phase = String(lap.intervalPhase || '').toUpperCase();
      const key = String(lap.intervalTypeKey || '').toUpperCase();
      const blob = `${phase} ${key}`;
      return (
        blob.includes('REST') ||
        blob.includes('RECOVERY') ||
        blob.includes('COOLDOWN') ||
        blob.includes('WALK')
      );
    });
  const movingSec = toNumber(garmin?.movingDuration ?? garmin?.movingTime ?? garmin?.running?.movingDuration, 0);
  const elapsedSec = toNumber(garmin?.elapsedDuration ?? garmin?.elapsedTime ?? garmin?.duration, 0);
  const pauseByMoving =
    movingSec > 30 && elapsedSec > 0 && elapsedSec - movingSec >= 45;
  const hasStop = pauseCount > 0 || hasRestLap || pauseByMoving;
  return !hasStop;
}

/** Durée « sans pause » alignée sur maxContinuousNoStopMinutes (Garmin sans arrêt ou manuel). */
function noStopContinuousMinutesForRun(run) {
  const garmin = run.garmin;
  if (garmin && isGarminRunWithoutStop(garmin)) {
    const movSec = toNumber(
      garmin.movingDuration ?? garmin.movingTime ?? garmin.running?.movingDuration,
      0
    );
    return movSec > 30 ? movSec / 60 : run.__durationMin;
  }
  if (!garmin) return run.__durationMin;
  return 0;
}

function isIntervalRun(run, garmin) {
  const runType = String(run.type || '').toLowerCase();
  if (runType === 'interval' || runType.includes('interval') || runType.includes('fraction')) return true;
  if (garmin && inferRunningSessionTypeFromGarminActivity(garmin) === 'interval') return true;
  return false;
}

function lapDurationSeconds(lap) {
  return toNumber(lap?.durationSeconds, 0);
}

function lapDistanceKm(lap) {
  const dk = toNumber(lap?.distanceKm, 0);
  if (dk > 0) return dk;
  return toNumber(lap?.distanceMeters, 0) / 1000;
}

function lapPaceSecPerKm(lap) {
  const dk = lapDistanceKm(lap);
  const ds = lapDurationSeconds(lap);
  if (dk <= 0 || ds <= 0) return null;
  return ds / dk;
}

function inDurRange(sec, [lo, hi]) {
  return sec >= lo && sec <= hi;
}

/** Max de sorties « longues » (≥ minKm) dans une fenêtre glissante de 7 jours. */
function maxLongRunsInSlidingWeek(runs, minKm = 15) {
  return longRunsInBestSlidingWindow(runs, minKm).count;
}

/** Fenêtre glissante 7 jours avec le plus de sorties ≥ minKm ; retourne le compte et les sorties de cette fenêtre. */
function longRunsInBestSlidingWindow(runs, minKm = 15) {
  const longRuns = runs.filter((r) => r.__distance >= minKm - 1e-6).sort((a, b) => a.__date - b.__date);
  if (!longRuns.length) return { count: 0, runsInWindow: [] };
  let best = 0;
  let bestStartIdx = 0;
  for (let i = 0; i < longRuns.length; i += 1) {
    const start = longRuns[i].__date.getTime();
    const end = start + 7 * 86400000;
    let c = 0;
    for (let j = i; j < longRuns.length && longRuns[j].__date.getTime() < end; j += 1) {
      c += 1;
    }
    if (c > best) {
      best = c;
      bestStartIdx = i;
    }
  }
  const t0 = longRuns[bestStartIdx].__date.getTime();
  const t1 = t0 + 7 * 86400000;
  const runsInWindow = longRuns.filter((r) => {
    const t = r.__date.getTime();
    return t >= t0 && t < t1;
  });
  return { count: best, runsInWindow };
}

/** Nombre de mois calendaires où chaque semaine ISO touchée par le mois a au moins 3 sorties. */
function countStrictNoSkipMonths(runs) {
  return listStrictNoSkipMonthKeys(runs).length;
}

/** Mois calendaires qui valident la règle « mois strict » (alignée sur countStrictNoSkipMonths). */
function listStrictNoSkipMonthKeys(runs) {
  const monthKeys = [...new Set(runs.map((r) => buildMonthKey(r.__date)))].sort();
  const ok = [];
  monthKeys.forEach((mk) => {
    const monthRuns = runs.filter((r) => buildMonthKey(r.__date) === mk);
    if (monthRuns.length < 12) return;
    const weeks = buildWeekGroupsInMonth(monthRuns);
    if (weeks.length < 3) return;
    if (weeks.every((w) => w.runs.length >= 3)) ok.push(mk);
  });
  return ok;
}

/** Parmi 5 km, 10 km et semi, combien de « familles » ont au moins une amélioration d’allure chronologique. */
function countDistanceBucketImprovements(runs) {
  return collectFirstImprovementRunPerDistanceBucket(runs).length;
}

/**
 * Première amélioration d’allure chronologique par famille (≥ 5 km, ≥ 10 km, ≥ semi).
 * Utilisé pour le comptage « 3 distances » et pour les sessions liées.
 */
function collectFirstImprovementRunPerDistanceBucket(runs) {
  const thresholds = [5, 10, 21.0975];
  const labels = ['5 km', '10 km', 'semi (21,1 km)'];
  const out = [];
  thresholds.forEach((minKm, idx) => {
    const sub = [...runs]
      .filter((r) => r.__distance >= minKm - 1e-6 && r.__paceSec)
      .sort((a, b) => a.__date - b.__date);
    let best = null;
    for (const run of sub) {
      if (best != null && run.__paceSec < best) {
        out.push({ run, prevPaceSec: best, bucketLabel: labels[idx] });
        break;
      }
      if (best == null || run.__paceSec < best) best = run.__paceSec;
    }
  });
  return out;
}

function splitHalfPaceSec(run, garmin) {
  const laps = garmin?.running?.laps;
  if (!Array.isArray(laps) || laps.length < 4) return null;
  const halfDist = run.__distance / 2;
  let accD = 0;
  let t1 = 0;
  let t2 = 0;
  for (let i = 0; i < laps.length; i += 1) {
    const lap = laps[i];
    const dk = lapDistanceKm(lap);
    const ds = lapDurationSeconds(lap);
    if (dk <= 0 || ds <= 0) continue;
    const nextD = accD + dk;
    if (nextD <= halfDist + 1e-6) {
      t1 += ds;
      accD = nextD;
    } else if (accD < halfDist - 1e-6) {
      const inFirst = halfDist - accD;
      const ratio = inFirst / dk;
      t1 += ds * ratio;
      t2 += ds * (1 - ratio);
      accD = halfDist;
    } else {
      t2 += ds;
      accD += dk;
    }
  }
  const d1 = Math.min(halfDist, run.__distance / 2);
  const d2 = Math.max(0, run.__distance - d1);
  if (d1 <= 0.01 || d2 <= 0.01) return null;
  const p1 = t1 / d1;
  const p2 = t2 / d2;
  return { first: p1, second: p2 };
}

function marathonNegativeSplitRun(run, garmin) {
  if (run.__distance < 42.195 - 0.3) return false;
  const sp = splitHalfPaceSec(run, garmin);
  if (!sp) return false;
  return sp.second < sp.first - 0.5;
}

function cumulativeAvgPaceSec(totalSec, totalKm) {
  if (totalKm <= 0.01 || totalSec <= 0) return null;
  return totalSec / totalKm;
}

const INTERVAL_WORK_REC_SPECS = {
  int_6x1: { reps: 6, work: [48, 90], rec: [48, 95] },
  int_10x1: { reps: 10, work: [48, 90], rec: [45, 100] },
  int_6x2: { reps: 6, work: [105, 150], rec: [48, 95] },
  int_5x3: { reps: 5, work: [165, 210], rec: [105, 155] },
  int_4x4: { reps: 4, work: [225, 270], rec: [105, 155] },
  int_3x8: { reps: 3, work: [450, 510], rec: [60, 200] },
  int_2x15: { reps: 2, work: [870, 960], rec: [90, 240] }
};

function lapsToSequence(garmin) {
  const laps = garmin?.running?.laps;
  if (!Array.isArray(laps) || laps.length < 2) return [];
  return laps
    .map((lap) => ({
      phase: classifyLapPhase(lap),
      dur: lapDurationSeconds(lap),
      dist: lapDistanceKm(lap),
      paceSec: lapPaceSecPerKm(lap)
    }))
    .filter((x) => x.dur > 3);
}

function maxWorkRecChain(seq, spec) {
  let best = 0;
  for (let start = 0; start < seq.length; start += 1) {
    let i = start;
    let c = 0;
    while (c < spec.reps && i + 1 < seq.length) {
      if (inDurRange(seq[i].dur, spec.work) && inDurRange(seq[i + 1].dur, spec.rec)) {
        c += 1;
        i += 2;
      } else {
        break;
      }
    }
    best = Math.max(best, c);
  }
  return best;
}

function matchesIntervalWorkTemplate(run, garmin, templateId) {
  const spec = INTERVAL_WORK_REC_SPECS[templateId];
  if (!spec || !garmin) return false;
  const seq = lapsToSequence(garmin);
  if (seq.length < spec.reps * 2 - 1) return false;
  return maxWorkRecChain(seq, spec) >= spec.reps;
}

function secondsBeforeIndex(seq, idx) {
  let s = 0;
  for (let i = 0; i < idx && i < seq.length; i += 1) {
    s += seq[i].dur;
  }
  return s;
}

function intervalAfterFatigue(run, garmin, minWarmSec = 30 * 60) {
  if (!isIntervalRun(run, garmin)) return false;
  const seq = lapsToSequence(garmin);
  if (seq.length < 4) return run.__durationMin >= 50 && seq.length >= 2;
  const spec = INTERVAL_WORK_REC_SPECS.int_6x1;
  for (let start = 0; start < seq.length; start += 1) {
    let i = start;
    let c = 0;
    while (c < 3 && i + 1 < seq.length) {
      if (inDurRange(seq[i].dur, spec.work) && inDurRange(seq[i + 1].dur, spec.rec)) {
        if (c === 0 && secondsBeforeIndex(seq, i) >= minWarmSec) return true;
        c += 1;
        i += 2;
      } else {
        break;
      }
    }
  }
  return false;
}

function intervalDescendingReps(run, garmin) {
  if (!isIntervalRun(run, garmin)) return false;
  const seq = lapsToSequence(garmin).filter((x) => x.phase === 'effort' || x.phase === 'other');
  const efforts = seq.filter((x) => x.paceSec != null && x.dur >= 40 && x.dur <= 600);
  if (efforts.length < 3) return false;
  for (let k = 1; k < efforts.length; k += 1) {
    if (efforts[k].paceSec >= efforts[k - 1].paceSec - 0.3) return false;
  }
  return true;
}

function intervalNoActiveStop(run, garmin) {
  if (!isIntervalRun(run, garmin)) return false;
  const laps = garmin?.running?.laps;
  if (!Array.isArray(laps) || laps.length < 4) return false;
  let sawRecovery = false;
  for (const lap of laps) {
    const ph = classifyLapPhase(lap);
    if (ph !== 'recovery' && ph !== 'cooldown') continue;
    sawRecovery = true;
    const dk = lapDistanceKm(lap);
    if (dk < 0.12) return false;
  }
  /** Sans tour récup / retour au calme identifié, on ne peut pas valider « récup = footing ». */
  return sawRecovery;
}

function chaosFartlek5k(run, garmin) {
  if (!isIntervalRun(run, garmin)) return false;
  if (run.__distance < 4.5 || run.__distance > 6.5) return false;
  const v = variabilitySecPerKm({ garmin });
  if (v != null && v >= 12) return true;
  const seq = lapsToSequence(garmin);
  return seq.length >= 10;
}

function chaos10k500m(run, garmin) {
  if (!isIntervalRun(run, garmin)) return false;
  if (run.__distance < 9.2 || run.__distance > 11.2) return false;
  const seq = lapsToSequence(garmin);
  if (seq.length < 14) return false;
  const medDist = seq.map((x) => x.dist).sort((a, b) => a - b)[Math.floor(seq.length / 2)];
  return medDist >= 0.35 && medDist <= 0.7;
}

function chaos30m2m(run, garmin) {
  if (!isIntervalRun(run, garmin)) return false;
  const dm = run.__durationMin;
  if (dm < 24 || dm > 42) return false;
  const seq = lapsToSequence(garmin);
  if (seq.length < 10) return false;
  const medDur = seq.map((x) => x.dur).sort((a, b) => a - b)[Math.floor(seq.length / 2)];
  return medDur >= 95 && medDur <= 150;
}

function chaosHrCap(run, garmin) {
  if (!isIntervalRun(run, garmin)) return false;
  if (run.__maxHR <= 0 || run.__avgHR <= 0) return false;
  const laps = garmin?.running?.laps;
  if (!Array.isArray(laps) || laps.length < 3) return false;
  let lapHrSamples = 0;
  laps.forEach((lap) => {
    const h = toNumber(lap.avgHeartRate ?? lap.avgHR ?? lap.meanHeartRate, 0);
    if (h > 40) lapHrSamples += 1;
  });
  if (lapHrSamples < 3) return false;
  return run.__avgHR < run.__maxHR * 0.82;
}

/**
 * ~1 km en fractionné avec micro-segments (accélérations répétées), pas une sortie courte à un seul tour.
 */
function chaos1kActive(run, garmin) {
  if (!isIntervalRun(run, garmin)) return false;
  if (run.__distance < 0.85 || run.__distance > 1.6) return false;
  const laps = garmin?.running?.laps;
  if (!Array.isArray(laps) || laps.length < 6) return false;
  const paces = [];
  laps.forEach((lap) => {
    const p = lapPaceSecPerKm(lap);
    const dk = lapDistanceKm(lap);
    if (p != null && dk > 0.02 && dk < 0.45 && p > 150 && p < 720) paces.push(p);
  });
  if (paces.length < 5) return false;
  let bestImproveStreak = 0;
  let streak = 0;
  for (let i = 1; i < paces.length; i += 1) {
    if (paces[i] < paces[i - 1] - 1.2) {
      streak += 1;
      bestImproveStreak = Math.max(bestImproveStreak, streak);
    } else {
      streak = 0;
    }
  }
  if (bestImproveStreak < 2) return false;
  const dists = laps.map(lapDistanceKm).filter((d) => d > 0);
  if (!dists.length) return false;
  const sorted = [...dists].sort((a, b) => a - b);
  const med = sorted[Math.floor(sorted.length / 2)];
  return med > 0.03 && med < 0.32;
}

function efRunsInMonth(monthRuns, zone2) {
  if (!zone2) return { total: 0, ef: 0 };
  let total = 0;
  let ef = 0;
  monthRuns.forEach((r) => {
    if (r.__avgHR <= 0) return;
    total += 1;
    if (r.__avgHR >= zone2.min && r.__avgHR <= zone2.max) ef += 1;
  });
  return { total, ef };
}

/** Sortie « EF fondamentale » alignée sur l’esprit allure Z2 : FC dans zone 2, volume mini, hors fractionné. */
function isEfFundamentalRun(run, zone2) {
  if (!zone2 || run.__avgHR <= 0) return false;
  if (run.__avgHR < zone2.min || run.__avgHR > zone2.max) return false;
  if (run.__distance < 2.5 - 1e-6) return false;
  if (run.__durationMin < 18 - 1e-6) return false;
  if (isIntervalRun(run, run.garmin)) return false;
  return true;
}

/** Mois calendaires qualifiés pour le trophée « ≥8 sorties dont ≥80 % en zone EF ». */
function listQualifyingEfEightyMonthKeys(runs, zone2) {
  if (!zone2) return [];
  const months = [...new Set(runs.map((r) => buildMonthKey(r.__date)))];
  const ok = [];
  months.forEach((mk) => {
    const monthRuns = runs.filter((r) => buildMonthKey(r.__date) === mk);
    const { total, ef } = efRunsInMonth(monthRuns, zone2);
    if (total >= 8 && ef / total >= 0.8 - 1e-6) ok.push(mk);
  });
  return ok;
}

function countEfEightyPercentMonths(runs, zone2) {
  return listQualifyingEfEightyMonthKeys(runs, zone2).length;
}

/** Plus longue chaîne de jours calendaires consécutifs avec ≥1 sortie EF fondamentale chaque jour. */
function maxConsecutiveEfFundamentalDays(runs, zone2) {
  const daySet = new Set();
  runs.forEach((r) => {
    if (!isEfFundamentalRun(r, zone2)) return;
    const k = dateKeyLocalFromDate(r.__date);
    if (k) daySet.add(k);
  });
  const keys = [...daySet].sort();
  if (!keys.length) return 0;
  let best = 1;
  let cur = 1;
  for (let i = 1; i < keys.length; i += 1) {
    const a = new Date(`${keys[i - 1]}T12:00:00`);
    const b = new Date(`${keys[i]}T12:00:00`);
    const diff = (b.getTime() - a.getTime()) / 86400000;
    if (diff === 1) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 1;
    }
  }
  return best;
}

/** Nombre de semaines ISO où le cumul km en EF fondamental atteint `minKm`. */
function countIsoWeeksWithMinEfFundamentalKm(runs, zone2, minKm) {
  if (!zone2 || minKm <= 0) return 0;
  const weekKm = new Map();
  runs.forEach((r) => {
    if (!isEfFundamentalRun(r, zone2)) return;
    const wk = buildWeekKey(r.__date);
    weekKm.set(wk, (weekKm.get(wk) || 0) + r.__distance);
  });
  let n = 0;
  weekKm.forEach((km) => {
    if (km >= minKm - 1e-6) n += 1;
  });
  return n;
}

function listIsoWeekKeysWithMinEfFundamentalKm(runs, zone2, minKm) {
  if (!zone2 || minKm <= 0) return new Set();
  const weekKm = new Map();
  runs.forEach((r) => {
    if (!isEfFundamentalRun(r, zone2)) return;
    const wk = buildWeekKey(r.__date);
    weekKm.set(wk, (weekKm.get(wk) || 0) + r.__distance);
  });
  const out = new Set();
  weekKm.forEach((km, wk) => {
    if (km >= minKm - 1e-6) out.add(wk);
  });
  return out;
}

function maxConsecutiveEfPerfect(runs, zone2) {
  if (!zone2) return 0;
  const sorted = [...runs].sort((a, b) => a.__date - b.__date);
  let cur = 0;
  let best = 0;
  sorted.forEach((r) => {
    const ok = r.__avgHR > 0 && r.__avgHR >= zone2.min && r.__avgHR <= zone2.max;
    if (ok) {
      cur += 1;
      best = Math.max(best, cur);
    } else {
      cur = 0;
    }
  });
  return best;
}

function efStableHrLongRun(run, garmin, zone2) {
  if (!zone2 || run.__avgHR <= 0) return false;
  if (run.__avgHR < zone2.min || run.__avgHR > zone2.max) return false;
  if (run.__durationMin < 42) return false;
  const laps = garmin?.running?.laps;
  if (!Array.isArray(laps) || laps.length < 5) return false;
  const hrs = laps
    .map((lap) => toNumber(lap.avgHeartRate ?? lap.avgHR ?? lap.meanHeartRate, 0))
    .filter((h) => h > 40);
  if (hrs.length < 4) return false;
  const mean = hrs.reduce((a, b) => a + b, 0) / hrs.length;
  if (mean <= 0) return false;
  const varc =
    hrs.reduce((acc, h) => {
      const d = h - mean;
      return acc + d * d;
    }, 0) / hrs.length;
  const sd = Math.sqrt(varc);
  return sd / mean < 0.075;
}

const CHAOS_SESSION_DETECTORS = {
  chaos1kCount: chaos1kActive,
  chaos5kCount: chaosFartlek5k,
  chaos10kCount: chaos10k500m,
  chaos30mCount: chaos30m2m,
  chaosHrCount: chaosHrCap
};

function buildChallengeDetectionStats(runs) {
  const intervalCounts = {};
  Object.keys(INTERVAL_WORK_REC_SPECS).forEach((k) => {
    intervalCounts[k] = 0;
  });
  let intAfter30 = 0;
  let intDesc = 0;
  let intNoStop = 0;
  let c1k = 0;
  let c5k = 0;
  let c10k = 0;
  let c30m = 0;
  let cHr = 0;
  let marathonNs = 0;
  const zone2 = inferZone2Bounds(runs);
  let ef80m = 0;
  let efStable = 0;
  let efDawn = 0;
  let efEvening = 0;

  runs.forEach((run) => {
    const garmin = run.garmin;
    Object.keys(INTERVAL_WORK_REC_SPECS).forEach((tid) => {
      const spec = INTERVAL_WORK_REC_SPECS[tid];
      const seq = lapsToSequence(garmin);
      if (seq.length >= spec.reps * 2 - 1 && maxWorkRecChain(seq, spec) >= spec.reps) {
        intervalCounts[tid] += 1;
      }
    });

    if (intervalAfterFatigue(run, garmin)) intAfter30 += 1;
    if (intervalDescendingReps(run, garmin)) intDesc += 1;
    if (intervalNoActiveStop(run, garmin)) intNoStop += 1;
    if (chaos1kActive(run, garmin)) c1k += 1;
    if (chaosFartlek5k(run, garmin)) c5k += 1;
    if (chaos10k500m(run, garmin)) c10k += 1;
    if (chaos30m2m(run, garmin)) c30m += 1;
    if (chaosHrCap(run, garmin)) cHr += 1;
    if (marathonNegativeSplitRun(run, garmin)) marathonNs += 1;
    if (efStableHrLongRun(run, garmin, zone2)) efStable += 1;
    const hStart = startHour(run);
    if (hStart != null && hStart < 7 && isEfFundamentalRun(run, zone2)) efDawn += 1;
    if (hStart != null && hStart >= 20 && hStart <= 23 && isEfFundamentalRun(run, zone2)) efEvening += 1;
  });

  ef80m = countEfEightyPercentMonths(runs, zone2);
  const EF_WEEK_VOLUME_KM = 30;
  const efWeek30 = countIsoWeeksWithMinEfFundamentalKm(runs, zone2, EF_WEEK_VOLUME_KM);
  const efDayChain = maxConsecutiveEfFundamentalDays(runs, zone2);

  const out = {
    intAfter30Count: intAfter30,
    intDescCount: intDesc,
    intNoStopCount: intNoStop,
    chaos1kCount: c1k,
    chaos5kCount: c5k,
    chaos10kCount: c10k,
    chaos30mCount: c30m,
    chaosHrCount: cHr,
    marathonNegativeSplitCount: marathonNs,
    efMonthEightyCount: ef80m,
    efPerfectStreakMax: maxConsecutiveEfPerfect(runs, zone2),
    efStableHrCount: efStable,
    efDawnCount: efDawn,
    efEveningCount: efEvening,
    efWeek30EfKmCount: efWeek30,
    efConsecutiveEfDaysMax: efDayChain
  };
  Object.keys(intervalCounts).forEach((k) => {
    out[`tpl_${k}`] = intervalCounts[k];
  });
  return out;
}

function isStablePaceRun(garmin) {
  const v = variabilitySecPerKm({ garmin });
  return v != null && v <= 10;
}

function buildStats(runs, garminById = new Map()) {
  const weekBuckets = new Map();
  const monthBuckets = new Map();
  let totalDistance = 0;
  let totalEFDistance = 0;
  let totalEFMinutes = 0;
  let intervalCount = 0;
  let morningRuns = 0;
  let runsWithoutStop = 0;
  let runsWithoutStop5k = 0;
  let maxContinuousMinutes = 0;
  let maxContinuousNoStopMinutes = 0;
  let maxContinuousSeconds = 0;
  let maxDistance = 0;
  let maxDistancePaceSec = null;
  let best5kPace = null;
  let best10kPace = null;
  let best1kPace = null;
  let stablePaceRuns = 0;
  let lowHR5kRuns = 0;
  let maxEFSingleDistance = 0;
  let maxEFSinglePaceSec = null;
  let totalDurationSec = 0;
  let best5kRaceDurationSec = null;
  let best10kRaceDurationSec = null;
  let bestSemiRaceDurationSec = null;

  const zone2 = inferZone2Bounds(runs);
  /** Séries chronologique pour la tendance FC (sorties ≥ 5 km avec FC ; allure optionnelle). */
  const hr5kSeries = [];
  const longRunWindow = longRunsInBestSlidingWindow(runs, 15);
  const strictNoSkipMonthKeys = listStrictNoSkipMonthKeys(runs);

  runs.forEach((run) => {
    const garminId = run.garminId != null ? String(run.garminId) : String(run.id);
    const garmin = garminById.get(garminId) || null;
    run.garmin = garmin;

    totalDistance += run.__distance;
    maxContinuousMinutes = Math.max(maxContinuousMinutes, run.__durationMin);
    const durSec = Math.round(run.__durationMin * 60);
    totalDurationSec += Number.isFinite(durSec) ? durSec : 0;
    if (run.__distance >= 5 - 1e-6 && Number.isFinite(durSec)) {
      best5kRaceDurationSec =
        best5kRaceDurationSec == null ? durSec : Math.min(best5kRaceDurationSec, durSec);
    }
    if (run.__distance >= 9.99 && Number.isFinite(durSec)) {
      best10kRaceDurationSec =
        best10kRaceDurationSec == null ? durSec : Math.min(best10kRaceDurationSec, durSec);
    }
    if (run.__distance >= 21.0975 - 0.25 && Number.isFinite(durSec)) {
      bestSemiRaceDurationSec =
        bestSemiRaceDurationSec == null ? durSec : Math.min(bestSemiRaceDurationSec, durSec);
    }
    if (Number.isFinite(durSec) && durSec > maxContinuousSeconds) maxContinuousSeconds = durSec;
    if (garmin && isGarminRunWithoutStop(garmin)) {
      const movSec = toNumber(
        garmin.movingDuration ?? garmin.movingTime ?? garmin.running?.movingDuration,
        0
      );
      const dmNoStop = movSec > 30 ? movSec / 60 : run.__durationMin;
      maxContinuousNoStopMinutes = Math.max(maxContinuousNoStopMinutes, dmNoStop);
    } else if (!garmin) {
      maxContinuousNoStopMinutes = Math.max(maxContinuousNoStopMinutes, run.__durationMin);
    }
    if (run.__distance > maxDistance) {
      maxDistance = run.__distance;
      maxDistancePaceSec = run.__paceSec || null;
    } else if (run.__distance > 0 && run.__distance === maxDistance && run.__paceSec) {
      maxDistancePaceSec =
        maxDistancePaceSec == null ? run.__paceSec : Math.min(maxDistancePaceSec, run.__paceSec);
    }

    const week = buildWeekKey(run.__date);
    const month = buildMonthKey(run.__date);
    if (!weekBuckets.has(week)) weekBuckets.set(week, { distance: 0, runs: 0 });
    if (!monthBuckets.has(month)) monthBuckets.set(month, { distance: 0, runs: 0 });
    weekBuckets.get(week).distance += run.__distance;
    weekBuckets.get(week).runs += 1;
    monthBuckets.get(month).distance += run.__distance;
    monthBuckets.get(month).runs += 1;

    if ((startHour(run) ?? 99) < 9) morningRuns += 1;

    const laps = garmin?.running?.laps;
    if (isIntervalRun(run, garmin)) intervalCount += 1;

    // Pas d'arrêt : uniquement si on a des signaux Garmin (sinon on évite les faux positifs manuels)
    if (garmin && isGarminRunWithoutStop(garmin)) {
      runsWithoutStop += 1;
      if (run.__distance >= 5 - 1e-6) runsWithoutStop5k += 1;
    }

    if (run.__distance >= 5 && run.__paceSec) {
      best5kPace = best5kPace == null ? run.__paceSec : Math.min(best5kPace, run.__paceSec);
    }
    if (run.__distance >= 5 - 1e-6 && run.__avgHR > 0) {
      hr5kSeries.push({
        run,
        hr: run.__avgHR,
        date: run.__date,
        paceSec: run.__paceSec,
        distanceKm: run.__distance
      });
    }
    if (run.__distance >= 10 && run.__paceSec) {
      best10kPace = best10kPace == null ? run.__paceSec : Math.min(best10kPace, run.__paceSec);
    }
    if (run.__distance >= 1 && run.__paceSec) {
      best1kPace = best1kPace == null ? run.__paceSec : Math.min(best1kPace, run.__paceSec);
    }

    if (Array.isArray(laps) && laps.length >= 4) {
      if (isStablePaceRun(garmin)) stablePaceRuns += 1;
    }

    const isEF = run.__avgHR > 0 && run.__avgHR >= zone2.min && run.__avgHR <= zone2.max;
    if (isEF) {
      totalEFDistance += run.__distance;
      totalEFMinutes += run.__durationMin;
      if (run.__distance > maxEFSingleDistance) {
        maxEFSingleDistance = run.__distance;
        maxEFSinglePaceSec = run.__paceSec || null;
      } else if (run.__distance > 0 && run.__distance === maxEFSingleDistance && run.__paceSec) {
        maxEFSinglePaceSec =
          maxEFSinglePaceSec == null ? run.__paceSec : Math.min(maxEFSinglePaceSec, run.__paceSec);
      }
    }
  });

  hr5kSeries.sort((a, b) => a.date - b.date);
  let hr5kTrendDetail = {
    meets: false,
    earlyAvg: null,
    lateAvg: null,
    earlyIds: [],
    lateIds: [],
    sampleCount: hr5kSeries.length,
    minRuns: 4
  };
  if (hr5kSeries.length >= 4) {
    const early = hr5kSeries.slice(0, 2);
    const late = hr5kSeries.slice(-2);
    const earlyAvg = (early[0].hr + early[1].hr) / 2;
    const lateAvg = (late[0].hr + late[1].hr) / 2;
    const hrTrendBetter = lateAvg < earlyAvg;
    if (hrTrendBetter) lowHR5kRuns = 1;
    hr5kTrendDetail = {
      meets: hrTrendBetter,
      earlyAvg: Math.round(earlyAvg * 10) / 10,
      lateAvg: Math.round(lateAvg * 10) / 10,
      earlyIds: early.map((e) => String(e.run.id ?? e.run.garminId ?? '')).filter(Boolean),
      lateIds: late.map((e) => String(e.run.id ?? e.run.garminId ?? '')).filter(Boolean),
      sampleCount: hr5kSeries.length,
      minRuns: 4
    };
  }

  const streakInfo = computeLongestStreak(runs);
  const streakDates = new Set(streakInfo.dates);

  let peakWeekDistKey = null;
  let peakWeekDistVal = -1;
  let peakWeekRunsKey = null;
  let peakWeekRunsVal = -1;
  weekBuckets.forEach((v, k) => {
    if (v.distance > peakWeekDistVal) {
      peakWeekDistVal = v.distance;
      peakWeekDistKey = k;
    }
    if (v.runs > peakWeekRunsVal) {
      peakWeekRunsVal = v.runs;
      peakWeekRunsKey = k;
    }
  });

  let peakMonthDistKey = null;
  let peakMonthDistVal = -1;
  let peakMonthRunsKey = null;
  let peakMonthRunsVal = -1;
  monthBuckets.forEach((v, k) => {
    if (v.distance > peakMonthDistVal) {
      peakMonthDistVal = v.distance;
      peakMonthDistKey = k;
    }
    if (v.runs > peakMonthRunsVal) {
      peakMonthRunsVal = v.runs;
      peakMonthRunsKey = k;
    }
  });

  const challenges = buildChallengeDetectionStats(runs);
  const sustain3 = computeSustainWeeklyRunsStreakBest(runs, 3);
  const sustain4 = computeSustainWeeklyRunsStreakBest(runs, 4);

  return {
    totalRuns: runs.length,
    totalDistance,
    totalDurationSec,
    best5kRaceDurationSec,
    best10kRaceDurationSec,
    bestSemiRaceDurationSec,
    totalEFDistance,
    totalEFMinutes,
    weekBuckets,
    monthBuckets,
    intervalCount,
    morningRuns,
    maxStreak: streakInfo.length,
    streakDates,
    peakWeekDistKey,
    peakWeekRunsKey,
    peakMonthDistKey,
    peakMonthRunsKey,
    improvements: countImprovedRecords(runs),
    maxContinuousMinutes,
    maxContinuousNoStopMinutes,
    maxContinuousSeconds,
    runsWithoutStop5k,
    maxDistance,
    maxDistancePaceSec,
    best5kPace,
    best10kPace,
    best1kPace,
    stablePaceRuns,
    runsWithoutStop,
    lowHR5kRuns,
    hr5kTrendDetail,
    zone2,
    maxEFSingleDistance,
    maxEFSinglePaceSec,
    efAvgPaceSec:
      totalEFDistance > 0.01 && totalEFMinutes > 0 ? (totalEFMinutes * 60) / totalEFDistance : null,
    rollingLongRunWeek: longRunWindow.count,
    rollingLongRunWindowRuns: longRunWindow.runsInWindow,
    monthNoSkipMonths: strictNoSkipMonthKeys.length,
    strictNoSkipMonthKeys,
    improveBucketsCount: countDistanceBucketImprovements(runs),
    sustainMin3ConsecutiveMonths: sustain3.maxConsecutive,
    sustainMin3BestMonths: sustain3.bestMonths,
    sustainMin4ConsecutiveMonths: sustain4.maxConsecutive,
    sustainMin4BestMonths: sustain4.bestMonths,
    ...challenges
  };
}

function avgPaceLaps(laps) {
  const values = laps
    .map((lap) => {
      const distanceKm = toNumber(lap.distanceKm, 0) || (toNumber(lap.distanceMeters, 0) / 1000);
      const durationSec = toNumber(lap.durationSeconds, 0);
      if (distanceKm <= 0 || durationSec <= 0) return null;
      return durationSec / distanceKm;
    })
    .filter(Boolean);
  if (!values.length) return null;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function getBestWeeklyDistance(stats) {
  return Math.max(0, ...Array.from(stats.weekBuckets.values()).map((v) => v.distance));
}

function getBestWeeklyRuns(stats) {
  return Math.max(0, ...Array.from(stats.weekBuckets.values()).map((v) => v.runs));
}

function getBestMonthlyDistance(stats) {
  return Math.max(0, ...Array.from(stats.monthBuckets.values()).map((v) => v.distance));
}

function getBestMonthlyRuns(stats) {
  return Math.max(0, ...Array.from(stats.monthBuckets.values()).map((v) => v.runs));
}

/**
 * Seuil numérique par palier : bronze = base le plus accessible, élite = le plus exigeant.
 * - Distance / temps cumulés : base × multiplicateur (plus dur).
 * - Comptages : ceil(base × multiplicateur).
 * - Allure max (sec/km) : base ÷ multiplicateur (plus dur = allure plus rapide, sec plus petit).
 * - hrTrend : même condition pour tous les paliers (0/1).
 */
function resolveTierTarget(trophy, level) {
  const mult = LEVEL_MULTIPLIERS[level];
  const base = toNumber(trophy.baseTarget, 0);
  if (trophy.auto === false) return 0;
  if (trophy.flatTiers || trophy.metric === 'hrTrend') {
    return base;
  }
  if (trophy.metric === 'trialRaceMaxSec') {
    const baseSec = toNumber(trophy.trialBronzeMaxSec, base);
    const floorSec = toNumber(trophy.trialEliteMaxSec, Math.max(60, Math.round(baseSec * 0.82)));
    const idx = LEVELS.indexOf(level);
    const span = Math.max(0, baseSec - floorSec);
    const raw = baseSec - (span * idx) / 3;
    return Math.max(floorSec, Math.round(raw));
  }
  if (trophy.metric === 'completeSimplesCount') {
    const n = Math.max(1, toNumber(trophy.simpleTotal, 1));
    const idx = LEVELS.indexOf(level);
    if (idx === 3) return n;
    return Math.max(1, Math.ceil((n * (idx + 1)) / 4));
  }
  if (trophy.metric === 'improveBucketsCount') {
    const n = 3;
    const idx = LEVELS.indexOf(level);
    if (idx === 3) return n;
    return Math.max(1, Math.ceil((n * (idx + 1)) / 4));
  }
  if (trophy.metric === 'challengeStat' && trophy.statKey === 'efPerfectStreakMax') {
    const m = { bronze: 2, silver: 3, gold: 4, elite: 5 };
    return m[level] ?? 5;
  }
  if (trophy.metric === 'challengeStat' && trophy.statKey === 'efConsecutiveEfDaysMax') {
    const m = { bronze: 7, silver: 14, gold: 30, elite: 56 };
    return m[level] ?? 56;
  }
  if (trophy.metric === 'sustainWeeklyRunsInMonths') {
    const minR = toNumber(trophy.sustainMinRunsPerWeek, 3);
    if (minR >= 4) {
      const m = { bronze: 2, silver: 3, gold: 4, elite: 5 };
      return m[level] ?? 2;
    }
    const m = { bronze: 1, silver: 2, gold: 3, elite: 4 };
    return m[level] ?? 1;
  }
  const isInverse =
    String(trophy.metric || '').endsWith('MaxSec') || trophy.metric === 'pace1000AvgMaxSec';
  if (isInverse) {
    const floor = inversePaceFloorSec(trophy.metric);
    const idx = LEVELS.indexOf(level);
    const span = Math.max(0, base - floor);
    const raw = base - (span * idx) / 3;
    return Math.max(floor, Math.round(raw));
  }
  const raw = base * mult;
  if (DISTANCE_LIKE_METRICS.has(trophy.metric)) {
    return Math.round(raw * 10) / 10;
  }
  if (trophy.metric === 'continuousMinutes' || trophy.metric === 'efMinutes') {
    return Math.round(raw);
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

  if (trophy.metric === 'pace1000AvgMaxSec') {
    const needKm = 1000;
    const D = stats.totalDistance;
    const avg =
      D > 0.01 && stats.totalDurationSec > 0 ? stats.totalDurationSec / D : 99999;
    const paceTarget = resolveTierTarget(trophy, level);
    const distProg = Math.min(1, D / needKm);
    const paceProg = paceTarget > 0 ? (avg <= paceTarget ? 1 : Math.min(1, paceTarget / avg)) : 0;
    const progress = Math.min(distProg, paceProg);
    const unlocked = D >= needKm - 1e-6 && avg <= paceTarget + 1e-6;
    return { value: avg, target: paceTarget, progress, unlocked };
  }

  const target = resolveTierTarget(trophy, level);
  let value = 0;

  switch (trophy.metric) {
    case 'singleDistance': value = stats.maxDistance; break;
    case 'runCount': value = stats.totalRuns; break;
    case 'weeklyDistance': value = getBestWeeklyDistance(stats); break;
    case 'weeklyRuns': value = getBestWeeklyRuns(stats); break;
    case 'sustainWeeklyRunsInMonths': {
      const minR = toNumber(trophy.sustainMinRunsPerWeek, 3);
      value = minR >= 4 ? stats.sustainMin4ConsecutiveMonths ?? 0 : stats.sustainMin3ConsecutiveMonths ?? 0;
      break;
    }
    case 'monthlyDistance': value = getBestMonthlyDistance(stats); break;
    case 'monthlyRuns': value = getBestMonthlyRuns(stats); break;
    case 'streakDays': value = stats.maxStreak; break;
    case 'morningRuns': value = stats.morningRuns; break;
    case 'intervalRuns': value = stats.intervalCount; break;
    case 'continuousMinutes':
      value = CONTINUOUS_TROPHIES_REQUIRE_NO_STOP.has(trophy.id)
        ? stats.maxContinuousNoStopMinutes ?? 0
        : stats.maxContinuousMinutes;
      break;
    case 'best5kPaceMaxSec': value = stats.best5kPace == null ? 9999 : stats.best5kPace; break;
    case 'best10kPaceMaxSec': value = stats.best10kPace == null ? 9999 : stats.best10kPace; break;
    case 'best1kPaceMaxSec': value = stats.best1kPace == null ? 9999 : stats.best1kPace; break;
    case 'stablePaceRuns': value = stats.stablePaceRuns; break;
    case 'runsWithoutStop': {
      const minKm = toNumber(trophy.withoutStopMinKm, 0);
      value = minKm >= 5 ? stats.runsWithoutStop5k ?? stats.runsWithoutStop : stats.runsWithoutStop;
      break;
    }
    case 'recordImprovements': value = stats.improvements; break;
    case 'totalDistance': value = stats.totalDistance; break;
    case 'efDistance': value = stats.totalEFDistance; break;
    case 'efMinutes': value = stats.totalEFMinutes; break;
    case 'efSingleDistance': value = stats.maxEFSingleDistance || 0; break;
    case 'hrTrend': value = stats.lowHR5kRuns; break;
    case 'trialRaceMaxSec': {
      const minKm = toNumber(trophy.trialMinKm, 5);
      if (minKm >= 20) {
        value = stats.bestSemiRaceDurationSec == null ? 99999999 : stats.bestSemiRaceDurationSec;
      } else if (minKm >= 9.5) {
        value = stats.best10kRaceDurationSec == null ? 99999999 : stats.best10kRaceDurationSec;
      } else {
        value = stats.best5kRaceDurationSec == null ? 99999999 : stats.best5kRaceDurationSec;
      }
      break;
    }
    case 'rollingLongRunWeek': value = stats.rollingLongRunWeek ?? 0; break;
    case 'monthNoSkipMonths': value = stats.monthNoSkipMonths ?? 0; break;
    case 'improveBucketsCount': value = stats.improveBucketsCount ?? 0; break;
    case 'marathonNegativeSplit': value = stats.marathonNegativeSplitCount ?? 0; break;
    case 'challengeStat': value = stats[trophy.statKey] ?? 0; break;
    case 'completeSimplesCount': value = stats.completeSimpleCompleted ?? 0; break;
    default: value = 0;
  }

  const isInverse =
    trophy.metric === 'trialRaceMaxSec' ||
    trophy.metric === 'pace1000AvgMaxSec' ||
    String(trophy.metric || '').endsWith('MaxSec');
  let progress = isInverse
    ? (value <= target ? 1 : target > 0 ? Math.max(0, Math.min(1, target / value)) : 0)
    : (target > 0 ? Math.max(0, Math.min(1, value / target)) : 0);
  let unlocked = isInverse ? value <= target : value >= target;

  /** Sans sortie éligible (distance min), pas de « faux » % dû au sentinelle 9999 sec/km. */
  const noQualifyingPace =
    (trophy.metric === 'best5kPaceMaxSec' && stats.best5kPace == null) ||
    (trophy.metric === 'best10kPaceMaxSec' && stats.best10kPace == null) ||
    (trophy.metric === 'best1kPaceMaxSec' && stats.best1kPace == null);
  if (noQualifyingPace) {
    progress = 0;
    unlocked = false;
  }

  /** Chrono trial : sans sortie ≥ distance min, pas de % basé sur le sentinelle 99999999 s. */
  const mkTrial = trophy.metric === 'trialRaceMaxSec' ? toNumber(trophy.trialMinKm, 5) : 0;
  const noQualifyingTrial =
    trophy.metric === 'trialRaceMaxSec' &&
    ((mkTrial >= 20 && stats.bestSemiRaceDurationSec == null) ||
      (mkTrial >= 9.5 && mkTrial < 20 && stats.best10kRaceDurationSec == null) ||
      (mkTrial < 9.5 && stats.best5kRaceDurationSec == null));
  if (noQualifyingTrial) {
    progress = 0;
    unlocked = false;
  }

  return { value, target, progress, unlocked };
}

export function buildRunningTrophiesCatalog() {
  const dPaces = [
    ['5k_700', '5 km < 7:00/km', 'best5kPaceMaxSec', 420, 'intermediate'],
    ['5k_600', '5 km < 6:00/km', 'best5kPaceMaxSec', 360, 'intermediate'],
    ['5k_500', '5 km < 5:00/km', 'best5kPaceMaxSec', 300, 'intermediate'],
    ['5k_430', '5 km < 4:30/km', 'best5kPaceMaxSec', 270, 'elite'],
    ['5k_400', '5 km < 4:00/km', 'best5kPaceMaxSec', 240, 'elite'],
    ['10k_600', '10 km < 6:00/km', 'best10kPaceMaxSec', 360, 'intermediate'],
    ['10k_530', '10 km < 5:30/km', 'best10kPaceMaxSec', 330, 'intermediate'],
    ['10k_500', '10 km < 5:00/km', 'best10kPaceMaxSec', 300, 'elite'],
    ['1k_430', '1 km < 4:30/km', 'best1kPaceMaxSec', 270, 'specific'],
    ['1k_400', '1 km < 4:00/km', 'best1kPaceMaxSec', 240, 'specific'],
    ['1k_330', '1 km < 3:30/km', 'best1kPaceMaxSec', 210, 'specific']
  ];

  const base = [
    { id: 'run_5_once', title: 'Courir 5 km une fois', metric: 'singleDistance', baseTarget: 5, difficulty: 'simple', category: 'Simples' },
    { id: 'run_10_once', title: 'Courir 10 km une fois', metric: 'singleDistance', baseTarget: 10, difficulty: 'simple', category: 'Simples' },
    { id: 'run_3_week', title: 'Faire 3 runs dans une semaine', metric: 'weeklyRuns', baseTarget: 3, difficulty: 'simple', category: 'Simples' },
    { id: 'run_20_week', title: 'Courir 20 km cumulés en une semaine', metric: 'weeklyDistance', baseTarget: 20, difficulty: 'simple', category: 'Simples' },
    {
      id: 'run_5_no_stop',
      title: 'Courir 5 km sans s’arrêter',
      metric: 'runsWithoutStop',
      baseTarget: 1,
      difficulty: 'simple',
      category: 'Simples',
      withoutStopMinKm: 5
    },
    { id: 'run_30min', title: 'Courir 30 min sans pause', metric: 'continuousMinutes', baseTarget: 30, difficulty: 'simple', category: 'Simples' },
    { id: 'run_morning', title: 'Faire un run le matin (avant 9h)', metric: 'morningRuns', baseTarget: 1, difficulty: 'simple', category: 'Simples' },
    { id: 'run_3_streak', title: 'Courir 3 jours d’affilée', metric: 'streakDays', baseTarget: 3, difficulty: 'simple', category: 'Simples' },
    { id: 'run_improve', title: 'Améliorer une allure moyenne sur 5 km', metric: 'recordImprovements', baseTarget: 1, difficulty: 'simple', category: 'Simples' },
    { id: 'run_10_month', title: 'Faire 10 runs dans le mois', metric: 'monthlyRuns', baseTarget: 10, difficulty: 'intermediate', category: 'Intermédiaires' },
    { id: 'run_50_month', title: 'Courir 50 km cumulés en 1 mois', metric: 'monthlyDistance', baseTarget: 50, difficulty: 'intermediate', category: 'Intermédiaires' },
    { id: 'run_5_intervals', title: 'Faire 5 séances d’intervalles', metric: 'intervalRuns', baseTarget: 5, difficulty: 'intermediate', category: 'Intermédiaires' },
    { id: 'run_45min', title: 'Tenir 45 min en continu', metric: 'continuousMinutes', baseTarget: 45, difficulty: 'intermediate', category: 'Intermédiaires' },
    {
      id: 'run_3_week_month',
      title: 'Courir 3 fois/semaine pendant 1 mois',
      metric: 'sustainWeeklyRunsInMonths',
      sustainMinRunsPerWeek: 3,
      baseTarget: 1,
      difficulty: 'intermediate',
      category: 'Intermédiaires'
    },
    { id: 'stable_pace', title: 'Maintenir une allure stable (<10 sec/km)', metric: 'stablePaceRuns', baseTarget: 1, difficulty: 'specific', category: 'Performance spécifique' },
    { id: 'hr_reduce_5k', title: 'Réduire la FC moyenne sur 5 km', metric: 'hrTrend', baseTarget: 1, difficulty: 'specific', category: 'Performance spécifique' },
    { id: 'run_no_stop', title: 'Faire un run avec 0 arrêt complet', metric: 'runsWithoutStop', baseTarget: 1, difficulty: 'specific', category: 'Performance spécifique' },
    { id: 'pr_3_times', title: 'Battre ton record personnel 3 fois', metric: 'recordImprovements', baseTarget: 3, difficulty: 'specific', category: 'Performance spécifique' },
    { id: 'dist_100', title: 'Courir 100 km cumulés', metric: 'totalDistance', baseTarget: 100, difficulty: 'endurance', category: 'Endurance & volume' },
    { id: 'dist_250', title: 'Courir 250 km cumulés', metric: 'totalDistance', baseTarget: 250, difficulty: 'endurance', category: 'Endurance & volume' },
    { id: 'dist_500', title: 'Courir 500 km cumulés', metric: 'totalDistance', baseTarget: 500, difficulty: 'endurance', category: 'Endurance & volume' },
    { id: 'dist_1000', title: 'Courir 1000 km cumulés', metric: 'totalDistance', baseTarget: 1000, difficulty: 'endurance', category: 'Endurance & volume' },
    { id: 'ef_100', title: 'Courir 100 km en endurance fondamentale', metric: 'efDistance', baseTarget: 100, difficulty: 'endurance', category: 'Endurance fondamentale' },
    { id: 'ef_300', title: 'Courir 300 km en endurance fondamentale', metric: 'efDistance', baseTarget: 300, difficulty: 'endurance', category: 'Endurance fondamentale' },
    { id: 'ef_500', title: 'Courir 500 km en endurance fondamentale', metric: 'efDistance', baseTarget: 500, difficulty: 'elite', category: 'Endurance fondamentale' },
    { id: 'ef_1000', title: 'Courir 1000 km en endurance fondamentale', metric: 'efDistance', baseTarget: 1000, difficulty: 'elite', category: 'Endurance fondamentale' },
    { id: 'ef_10h', title: '10h de course EF cumulées', metric: 'efMinutes', baseTarget: 600, difficulty: 'endurance', category: 'Endurance fondamentale' },
    { id: 'ef_25h', title: '25h de course EF cumulées', metric: 'efMinutes', baseTarget: 1500, difficulty: 'endurance', category: 'Endurance fondamentale' },
    { id: 'ef_50h', title: '50h de course EF cumulées', metric: 'efMinutes', baseTarget: 3000, difficulty: 'elite', category: 'Endurance fondamentale' },
    { id: 'long_15k', title: 'Faire une sortie longue de 15 km', metric: 'singleDistance', baseTarget: 15, difficulty: 'endurance', category: 'Endurance & volume' },
    { id: 'long_20k', title: 'Faire une sortie longue de 20 km', metric: 'singleDistance', baseTarget: 20, difficulty: 'endurance', category: 'Endurance & volume' },
    { id: 'run_60min', title: 'Courir 60 min sans interruption', metric: 'continuousMinutes', baseTarget: 60, difficulty: 'endurance', category: 'Endurance & volume' },
    { id: 'run_130', title: 'Courir 1h30 sans arrêt', metric: 'continuousMinutes', baseTarget: 90, difficulty: 'elite', category: 'Endurance extrême' },
    { id: 'run_2h', title: 'Courir 2h sans arrêt', metric: 'continuousMinutes', baseTarget: 120, difficulty: 'elite', category: 'Endurance extrême' },
    { id: 'run_3h', title: 'Courir 3h sans arrêt', metric: 'continuousMinutes', baseTarget: 180, difficulty: 'elite', category: 'Endurance extrême' },
    { id: 'run_50_week', title: 'Courir 50 km cumulés en 1 semaine', metric: 'weeklyDistance', baseTarget: 50, difficulty: 'elite', category: 'Endurance extrême' },
    {
      id: 'run_4_week_2m',
      title: 'Faire 4 runs/semaine pendant 2 mois',
      metric: 'sustainWeeklyRunsInMonths',
      sustainMinRunsPerWeek: 4,
      baseTarget: 2,
      difficulty: 'elite',
      category: 'Élites'
    },
    { id: 'run_7_streak', title: 'Courir 7 jours d’affilée', metric: 'streakDays', baseTarget: 7, difficulty: 'elite', category: 'Élites' },
    { id: 'interval_20', title: 'Faire 20 séances d’intervalles', metric: 'intervalRuns', baseTarget: 20, difficulty: 'elite', category: 'Élites' },
    { id: 'cardio_progress', title: 'Réduire FC moyenne à allure égale', metric: 'hrTrend', baseTarget: 1, difficulty: 'elite', category: 'Élites' },
    { id: 'semi_finish', title: 'Courir un semi-marathon (21,1 km)', metric: 'singleDistance', baseTarget: 21.1, difficulty: 'elite', category: 'Game Boss' },
    { id: 'marathon_finish', title: 'Courir un marathon (42,2 km)', metric: 'singleDistance', baseTarget: 42.2, difficulty: 'elite', category: 'Game Boss' },
    // --- Défis avancés (détection auto : tours Garmin / FC / cumuls quand c’est possible) ---
    {
      id: 'pace_1000_under_500',
      title: 'Courir 1000 km < 5:00/km de moyenne cumulée',
      metric: 'pace1000AvgMaxSec',
      baseTarget: 300,
      difficulty: 'elite',
      category: 'Endurance & volume'
    },
    { id: 'two_long_week', title: 'Courir 2 sorties longues en 7 jours', metric: 'rollingLongRunWeek', baseTarget: 2, difficulty: 'elite', category: 'Endurance extrême' },
    { id: 'month_no_skip', title: 'Un mois complet sans abandon (≥ 3 runs/semaine)', metric: 'monthNoSkipMonths', baseTarget: 1, difficulty: 'elite', category: 'Élites' },
    { id: 'improve_3_distances', title: 'Améliorer allure moyenne sur 3 distances différentes', metric: 'improveBucketsCount', baseTarget: 3, difficulty: 'elite', category: 'Élites' },
    { id: 'complete_simples', title: 'Compléter tous les trophées « simples »', metric: 'completeSimplesCount', baseTarget: 1, difficulty: 'elite', category: 'Élites' },
    { id: 'ef_15k', title: 'Courir 15 km en EF', metric: 'efSingleDistance', baseTarget: 15, difficulty: 'elite', category: 'Endurance extrême' },
    { id: 'ef_25k', title: 'Courir 25 km en EF', metric: 'efSingleDistance', baseTarget: 25, difficulty: 'elite', category: 'Endurance extrême' },
    { id: 'ef_30k', title: 'Courir 30 km en EF', metric: 'efSingleDistance', baseTarget: 30, difficulty: 'elite', category: 'Endurance extrême' },
    { id: 'marathon_ns', title: 'Marathon avec negative split', metric: 'marathonNegativeSplit', baseTarget: 1, difficulty: 'elite', category: 'Game Boss' },
    {
      id: 'boss_10k_50',
      title: '10 km < 50 min',
      metric: 'trialRaceMaxSec',
      trialMinKm: 10,
      trialBronzeMaxSec: 3000,
      trialEliteMaxSec: 2520,
      baseTarget: 3000,
      difficulty: 'elite',
      category: 'Game Boss'
    },
    {
      id: 'boss_10k_45',
      title: '10 km < 45 min',
      metric: 'trialRaceMaxSec',
      trialMinKm: 10,
      trialBronzeMaxSec: 2700,
      trialEliteMaxSec: 2340,
      baseTarget: 2700,
      difficulty: 'elite',
      category: 'Game Boss'
    },
    {
      id: 'boss_10k_40',
      title: '10 km < 40 min',
      metric: 'trialRaceMaxSec',
      trialMinKm: 10,
      trialBronzeMaxSec: 2400,
      trialEliteMaxSec: 2100,
      baseTarget: 2400,
      difficulty: 'elite',
      category: 'Game Boss'
    },
    {
      id: 'boss_5k_20',
      title: '5 km < 20 min',
      metric: 'trialRaceMaxSec',
      trialMinKm: 5,
      trialBronzeMaxSec: 1200,
      trialEliteMaxSec: 1020,
      baseTarget: 1200,
      difficulty: 'elite',
      category: 'Game Boss'
    },
    {
      id: 'boss_5k_18',
      title: '5 km < 18 min',
      metric: 'trialRaceMaxSec',
      trialMinKm: 5,
      trialBronzeMaxSec: 1080,
      trialEliteMaxSec: 960,
      baseTarget: 1080,
      difficulty: 'elite',
      category: 'Game Boss'
    },
    {
      id: 'boss_5k_15',
      title: '5 km < 15 min',
      metric: 'trialRaceMaxSec',
      trialMinKm: 5,
      trialBronzeMaxSec: 900,
      trialEliteMaxSec: 780,
      baseTarget: 900,
      difficulty: 'elite',
      category: 'Game Boss'
    },
    {
      id: 'boss_semi_145',
      title: 'Semi-marathon < 1h45',
      metric: 'trialRaceMaxSec',
      trialMinKm: 21.0975,
      trialBronzeMaxSec: 6300,
      trialEliteMaxSec: 5940,
      baseTarget: 6300,
      difficulty: 'elite',
      category: 'Game Boss'
    },
    {
      id: 'boss_semi_130',
      title: 'Semi-marathon < 1h30',
      metric: 'trialRaceMaxSec',
      trialMinKm: 21.0975,
      trialBronzeMaxSec: 5400,
      trialEliteMaxSec: 5100,
      baseTarget: 5400,
      difficulty: 'elite',
      category: 'Game Boss'
    },
    { id: 'int_6x1', title: '6×1 min rapide / 1 min récup', metric: 'challengeStat', statKey: 'tpl_int_6x1', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif' },
    { id: 'int_10x1', title: '10×1 min rapide / 1 min récup', metric: 'challengeStat', statKey: 'tpl_int_10x1', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif' },
    { id: 'int_6x2', title: '6×2 min rapide / 1 min récup', metric: 'challengeStat', statKey: 'tpl_int_6x2', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif' },
    { id: 'int_5x3', title: '5×3 min rapide / 2 min récup', metric: 'challengeStat', statKey: 'tpl_int_5x3', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif' },
    { id: 'int_4x4', title: '4×4 min rapide / 2 min récup', metric: 'challengeStat', statKey: 'tpl_int_4x4', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif' },
    { id: 'int_3x8', title: '3×8 min seuil', metric: 'challengeStat', statKey: 'tpl_int_3x8', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif' },
    { id: 'int_2x15', title: '2×15 min tempo', metric: 'challengeStat', statKey: 'tpl_int_2x15', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif' },
    { id: 'int_after_30', title: 'Fractionné en fatigue (après 30 min de course)', metric: 'challengeStat', statKey: 'intAfter30Count', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif' },
    { id: 'int_desc', title: 'Fractionné allure décroissante (chaque rep plus rapide)', metric: 'challengeStat', statKey: 'intDescCount', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif' },
    { id: 'int_no_active_stop', title: 'Fractionné sans arrêt actif (récup = footing lent)', metric: 'challengeStat', statKey: 'intNoStopCount', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif' },
    { id: 'chaos_1k_active', title: 'Courir 1 km actif (accélérations continues)', metric: 'challengeStat', statKey: 'chaos1kCount', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos' },
    { id: 'chaos_5k_fartlek', title: '5 km avec changements d’allure libres', metric: 'challengeStat', statKey: 'chaos5kCount', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos' },
    { id: 'chaos_10k_500m', title: '10 km avec 1 accélération toutes les 500 m', metric: 'challengeStat', statKey: 'chaos10kCount', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos' },
    { id: 'chaos_30m_2m', title: '30 min avec variations imposées toutes les 2 min', metric: 'challengeStat', statKey: 'chaos30mCount', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos' },
    { id: 'chaos_hr_cap', title: 'Fractionné avec FC plafonnée', metric: 'challengeStat', statKey: 'chaosHrCount', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos' },
    { id: 'ef_month_80', title: '1 mois sans sortir de zone EF sur 80% des runs', metric: 'challengeStat', statKey: 'efMonthEightyCount', baseTarget: 1, difficulty: 'elite', category: 'EF avancée' },
    { id: 'ef_5_perfect', title: '5 runs consécutifs en EF parfaite', metric: 'challengeStat', statKey: 'efPerfectStreakMax', baseTarget: 2, difficulty: 'elite', category: 'EF avancée' },
    { id: 'ef_stable_hr', title: 'EF avec FC stabilisée (écart faible sur toute sortie)', metric: 'challengeStat', statKey: 'efStableHrCount', baseTarget: 1, difficulty: 'elite', category: 'EF avancée' },
    {
      id: 'ef_ad_dawn',
      title: 'EF fondamental avant 7 h (≥2,5 km, hors fractionné)',
      metric: 'challengeStat',
      statKey: 'efDawnCount',
      baseTarget: 1,
      difficulty: 'elite',
      category: 'EF avancée'
    },
    {
      id: 'ef_ad_evening',
      title: 'EF fondamental en soirée (20 h–23 h, même critère)',
      metric: 'challengeStat',
      statKey: 'efEveningCount',
      baseTarget: 1,
      difficulty: 'elite',
      category: 'EF avancée'
    },
    {
      id: 'ef_ad_week30',
      title: 'Semaine ISO avec ≥ 30 km cumulés en EF Z2',
      metric: 'challengeStat',
      statKey: 'efWeek30EfKmCount',
      baseTarget: 1,
      difficulty: 'elite',
      category: 'EF avancée'
    },
    {
      id: 'ef_ad_daychain',
      title: 'Jours consécutifs avec au moins une sortie EF Z2',
      metric: 'challengeStat',
      statKey: 'efConsecutiveEfDaysMax',
      baseTarget: 7,
      difficulty: 'elite',
      category: 'EF avancée'
    }
  ];

  const simpleTotal = base.filter((t) => t.difficulty === 'simple' && t.id !== 'complete_simples').length;
  const csIdx = base.findIndex((t) => t.id === 'complete_simples');
  if (csIdx >= 0) {
    base[csIdx] = { ...base[csIdx], simpleTotal };
  }

  const paceBased = dPaces.map(([id, title, metric, target, difficulty]) => ({
    id,
    title,
    metric,
    baseTarget: target,
    difficulty,
    category: difficulty === 'elite' ? 'Élites' : difficulty === 'specific' ? 'Performance spécifique' : 'Intermédiaires'
  }));

  return [...base, ...paceBased];
}

/**
 * Allure mm:ss/km à partir de secondes par km.
 */
export function formatPaceSecPerKm(sec) {
  if (sec == null || !Number.isFinite(sec) || sec <= 0) return '—';
  const total = Math.round(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}/km`;
}

export function formatKmOneDecimal(km) {
  if (km == null || !Number.isFinite(km)) return '—';
  return `${km.toLocaleString('fr-FR', { maximumFractionDigits: 1, minimumFractionDigits: km % 1 ? 1 : 0 })} km`;
}

export function formatMinutesRounded(min) {
  if (min == null || !Number.isFinite(min)) return '—';
  if (min >= 60 && min % 60 === 0) return `${Math.round(min / 60)} h`;
  if (min >= 60) {
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
  }
  return `${Math.round(min)} min`;
}

/** Durée type 30:08 ou 1:05:03 (secondes affichées). */
export function formatDurationClock(totalSec) {
  if (totalSec == null || !Number.isFinite(totalSec) || totalSec < 0) return '—';
  const s = Math.round(totalSec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

/** XP de base (palier bronze) par difficulté du trophée — échelle nettement au-dessus de l’ancien plancher ~6–50 XP. */
const RUNNING_TROPHY_BRONZE_XP = {
  simple: 120,
  intermediate: 220,
  specific: 320,
  endurance: 460,
  elite: 640
};

/** Multiplicateur palier pour l’XP sport (bronze → élite). */
export const RUNNING_TROPHY_TIER_XP_MULT = {
  bronze: 1,
  silver: 1.24,
  gold: 1.52,
  elite: 1.95
};

/**
 * XP sport attribuée pour un seul palier débloqué (bronze, argent, or ou élite).
 */
export function runningTrophyLevelXpReward(difficulty, level) {
  const base = RUNNING_TROPHY_BRONZE_XP[difficulty] ?? RUNNING_TROPHY_BRONZE_XP.simple;
  const tm = RUNNING_TROPHY_TIER_XP_MULT[level] || 1;
  return Math.round(base * tm);
}

/**
 * XP course + compteurs (paliers débloqués, trophées avec au moins un palier).
 */
export function computeRunningTrophiesXpDetailed(results) {
  if (!Array.isArray(results)) {
    return { xp: 0, unlockedTierCount: 0, trophiesWithTier: 0 };
  }
  let xp = 0;
  let unlockedTierCount = 0;
  let trophiesWithTier = 0;
  results.forEach((r) => {
    if (r.auto === false) return;
    let anyTier = false;
    (r.levels || []).forEach((lvl) => {
      if (!lvl.unlocked) return;
      anyTier = true;
      unlockedTierCount += 1;
      xp += runningTrophyLevelXpReward(r.difficulty, lvl.level);
    });
    if (anyTier) trophiesWithTier += 1;
  });
  return { xp: Math.round(xp), unlockedTierCount, trophiesWithTier };
}

/**
 * XP sport attribuée par palier débloqué (chaque niveau bronze→élite compte une fois).
 */
export function computeRunningTrophiesXp(results) {
  return computeRunningTrophiesXpDetailed(results).xp;
}

function efZoneHint(stats) {
  const z = stats?.zone2;
  if (!z || !Number.isFinite(z.min) || !Number.isFinite(z.max)) return '';
  return ` (FC ${z.min}–${z.max} bpm, zone 2 ≈ 60–75 % de la FC max relevée sur tes sorties)`;
}

/**
 * Texte court pour l’étiquette « où j’en suis » (données alignées sur evaluateSingle).
 */
export function describeRunningTrophyCurrentProgress(trophy, stats) {
  if (!stats) {
    return '—';
  }
  const zHint = efZoneHint(stats);

  switch (trophy.metric) {
    case 'singleDistance': {
      const pace =
        stats.maxDistancePaceSec != null ? ` à ${formatPaceSecPerKm(stats.maxDistancePaceSec)}` : '';
      return `Plus grande sortie : ${formatKmOneDecimal(stats.maxDistance)}${pace}`;
    }
    case 'totalDistance':
      return `Distance cumulée : ${formatKmOneDecimal(stats.totalDistance)}`;
    case 'weeklyDistance':
      return `Meilleure semaine : ${formatKmOneDecimal(getBestWeeklyDistance(stats))}`;
    case 'weeklyRuns':
      return `Pic hebdo : ${getBestWeeklyRuns(stats)} sorties`;
    case 'sustainWeeklyRunsInMonths': {
      const minR = toNumber(trophy.sustainMinRunsPerWeek, 3);
      const v = minR >= 4 ? stats.sustainMin4ConsecutiveMonths ?? 0 : stats.sustainMin3ConsecutiveMonths ?? 0;
      return `Meilleure série : ${v} mois calendaires consécutifs (≥ ${minR} sorties par semaine ISO touchant chaque mois)`;
    }
    case 'monthlyDistance':
      return `Meilleur mois : ${formatKmOneDecimal(getBestMonthlyDistance(stats))}`;
    case 'monthlyRuns':
      return `Pic mensuel : ${getBestMonthlyRuns(stats)} sorties`;
    case 'streakDays':
      return `Plus longue série : ${stats.maxStreak} j`;
    case 'morningRuns':
      return `Sorties avant 9 h : ${stats.morningRuns}`;
    case 'intervalRuns':
      return `Séances fractionnées détectées : ${stats.intervalCount}`;
    case 'continuousMinutes': {
      if (trophy?.id && CONTINUOUS_TROPHIES_REQUIRE_NO_STOP.has(trophy.id)) {
        const sec = Math.round(toNumber(stats.maxContinuousNoStopMinutes ?? 0, 0) * 60);
        return `Plus longue sortie sans pause (sans arrêt Garmin ou durée manuelle) : ${formatDurationClock(sec)}`;
      }
      const sec =
        stats.maxContinuousSeconds > 0
          ? stats.maxContinuousSeconds
          : Math.round(toNumber(stats.maxContinuousMinutes, 0) * 60);
      return `Plus longue sortie sans interruption : ${formatDurationClock(sec)}`;
    }
    case 'best5kPaceMaxSec':
      if (stats.best5kPace == null) return 'Pas encore de sortie ≥ 5 km avec allure mesurée';
      return `Meilleure allure sur ≥ 5 km : ${formatPaceSecPerKm(stats.best5kPace)}`;
    case 'best10kPaceMaxSec':
      if (stats.best10kPace == null) return 'Pas encore de sortie ≥ 10 km avec allure mesurée';
      return `Meilleure allure sur ≥ 10 km : ${formatPaceSecPerKm(stats.best10kPace)}`;
    case 'best1kPaceMaxSec':
      if (stats.best1kPace == null) return 'Pas encore de segment ≥ 1 km avec allure mesurée';
      return `Meilleure allure sur ≥ 1 km : ${formatPaceSecPerKm(stats.best1kPace)}`;
    case 'stablePaceRuns':
      return trophy?.id === 'stable_pace'
        ? `Sorties allure stable (laps Garmin, variabilité ≤ 10 s/km) : ${stats.stablePaceRuns}`
        : `Sorties allure stable (laps) : ${stats.stablePaceRuns}`;
    case 'runsWithoutStop': {
      const minKm = toNumber(trophy.withoutStopMinKm, 0);
      if (minKm >= 5) {
        return `Sorties ≥ 5 km sans pause (Garmin) : ${stats.runsWithoutStop5k ?? 0}`;
      }
      return `Sorties sans pause détectée (Garmin) : ${stats.runsWithoutStop}`;
    }
    case 'recordImprovements':
      return `Améliorations d’allure (sorties ≥ 5 km) : ${stats.improvements}`;
    case 'efDistance': {
      const pace =
        stats.efAvgPaceSec != null ? `, allure moyenne EF ${formatPaceSecPerKm(stats.efAvgPaceSec)}` : '';
      return `Cumul endurance fondamentale${zHint} : ${formatKmOneDecimal(stats.totalEFDistance)}${pace}`;
    }
    case 'efMinutes':
      return `Temps cumulé en EF${zHint} : ${formatMinutesRounded(stats.totalEFMinutes)}`;
    case 'efSingleDistance': {
      const pace =
        stats.maxEFSinglePaceSec != null
          ? ` à ${formatPaceSecPerKm(stats.maxEFSinglePaceSec)}`
          : stats.efAvgPaceSec != null
            ? ` — allure moyenne sur tout l’EF cumulé : ${formatPaceSecPerKm(stats.efAvgPaceSec)}`
            : '';
      return `Plus longue sortie 100 % en EF${zHint} : ${formatKmOneDecimal(stats.maxEFSingleDistance || 0)}${pace}`;
    }
    case 'hrTrend': {
      const d = stats.hr5kTrendDetail;
      if (!d || d.sampleCount < 4) {
        return `Tendance FC sur ≥ 5 km : ${d?.sampleCount ?? 0} / 4 sorties chronologiques avec FC`;
      }
      return d.meets
        ? `FC moyenne : 2 premières sorties ≥ 5 km ≈ ${d.earlyAvg} bpm, 2 dernières ≈ ${d.lateAvg} bpm (baisse = progression)`
        : `FC moyenne : 2 premières ≥ 5 km ≈ ${d.earlyAvg} bpm vs 2 dernières ≈ ${d.lateAvg} bpm — pas encore une baisse`;
    }
    case 'trialRaceMaxSec': {
      const minKm = toNumber(trophy.trialMinKm, 5);
      let best = null;
      if (minKm >= 20) best = stats.bestSemiRaceDurationSec;
      else if (minKm >= 9.5) best = stats.best10kRaceDurationSec;
      else best = stats.best5kRaceDurationSec;
      if (best == null) return `Pas encore de sortie chronométrée ≥ ${minKm} km`;
      return `Meilleure durée totale sur une sortie ≥ ${minKm} km : ${formatDurationClock(best)}`;
    }
    case 'pace1000AvgMaxSec': {
      const D = stats.totalDistance;
      const avg = cumulativeAvgPaceSec(stats.totalDurationSec, D);
      if (avg == null) return 'Pas assez de données pour une moyenne cumulée';
      return `Moyenne cumulée (toutes sorties) : ${formatPaceSecPerKm(avg)} sur ${formatKmOneDecimal(D)}`;
    }
    case 'rollingLongRunWeek':
      return `Pic sur 7 jours glissants : ${stats.rollingLongRunWeek ?? 0} sorties longues (≥ 15 km)`;
    case 'monthNoSkipMonths':
      return `Mois « stricts » (≥ 3 sorties chaque semaine ISO du mois) : ${stats.monthNoSkipMonths ?? 0}`;
    case 'improveBucketsCount':
      return `Familles de distances avec au moins une progression : ${stats.improveBucketsCount ?? 0} / 3 (5 km, 10 km, semi)`;
    case 'marathonNegativeSplit':
      return `Marathons négative split (tours) : ${stats.marathonNegativeSplitCount ?? 0}`;
    case 'challengeStat': {
      const v = stats[trophy.statKey] ?? 0;
      const sk = trophy.statKey;
      if (sk === 'efMonthEightyCount') {
        return `Mois calendaires qualifiés (≥8 sorties dont ≥80 % FC zone 2) : ${v}`;
      }
      if (sk === 'efPerfectStreakMax') {
        return `Meilleure série de sorties consécutives 100 % zone EF : ${v}`;
      }
      if (sk === 'efStableHrCount') {
        return `Sorties EF longues (≥42 min) avec FC par tour stable : ${v}`;
      }
      if (sk === 'efDawnCount') {
        return `Sorties EF fondamentales avant 7 h : ${v}`;
      }
      if (sk === 'efEveningCount') {
        return `Sorties EF fondamentales 20 h–23 h : ${v}`;
      }
      if (sk === 'efWeek30EfKmCount') {
        return `Semaines ISO avec ≥30 km cumulés en EF Z2 : ${v}`;
      }
      if (sk === 'efConsecutiveEfDaysMax') {
        return `Plus longue série de jours avec ≥1 sortie EF Z2 : ${v} j`;
      }
      return `Détections / score courant : ${v}`;
    }
    case 'completeSimplesCount':
      return `Trophées simples cochés : ${stats.completeSimpleCompleted ?? 0} / ${stats.completeSimpleTotal ?? 0}`;
    default:
      return '—';
  }
}

/**
 * Libellé du seuil pour un palier (bronze…élite), selon la métrique.
 */
export function describeRunningTrophyLevelRequirement(trophy, target, levelLabel) {
  if (trophy?.metric === 'trialRaceMaxSec') {
    const mk = toNumber(trophy.trialMinKm, 5);
    return `${levelLabel} : chrono ≤ ${formatDurationClock(target)} sur une sortie ≥ ${mk} km`;
  }
  if (trophy?.metric === 'pace1000AvgMaxSec') {
    return `${levelLabel} : moyenne cumulée ≤ ${formatPaceSecPerKm(target)} avec ≥ 1000 km cumulés`;
  }
  if (trophy?.metric === 'sustainWeeklyRunsInMonths') {
    const minR = toNumber(trophy.sustainMinRunsPerWeek, 3);
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : ≥ ${n} mois calendaires consécutifs, chaque semaine ISO du mois avec ≥ ${minR} sorties`;
  }
  const isInverse = String(trophy.metric || '').endsWith('MaxSec');
  if (isInverse) {
    const cond =
      trophy.metric === 'best5kPaceMaxSec'
        ? 'sur une sortie ≥ 5 km'
        : trophy.metric === 'best10kPaceMaxSec'
          ? 'sur une sortie ≥ 10 km'
          : 'sur une sortie ≥ 1 km';
    return `${levelLabel} : allure ≤ ${formatPaceSecPerKm(target)} ${cond}`;
  }
  if (trophy.metric === 'continuousMinutes' || trophy.metric === 'efMinutes') {
    return `${levelLabel} : ${formatMinutesRounded(target)}`;
  }
  if (
    trophy.metric === 'singleDistance' ||
    trophy.metric === 'totalDistance' ||
    trophy.metric === 'weeklyDistance' ||
    trophy.metric === 'monthlyDistance' ||
    trophy.metric === 'efDistance' ||
    trophy.metric === 'efSingleDistance'
  ) {
    return `${levelLabel} : ${formatKmOneDecimal(target)}`;
  }
  if (trophy.metric === 'hrTrend') {
    return `${levelLabel} : comparer plusieurs sorties ≥ 5 km (FC moyenne en baisse)`;
  }
  if (trophy.metric === 'streakDays') {
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : série ≥ ${n} jour${n > 1 ? 's' : ''} consécutifs (≥ 1 sortie chaque jour)`;
  }
  if (trophy.metric === 'completeSimplesCount') {
    const n = Math.round(Number(target) || 0);
    const tot = Math.max(1, toNumber(trophy.simpleTotal, 1));
    return `${levelLabel} : ≥ ${n} trophée${n > 1 ? 's' : ''} simple${n > 1 ? 's' : ''} débloqué${n > 1 ? 's' : ''} (sur ${tot})`;
  }
  if (trophy.metric === 'improveBucketsCount') {
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : ≥ ${n} famille${n > 1 ? 's' : ''} sur 3 (5 km, 10 km, semi) avec progression d’allure`;
  }
  if (trophy.metric === 'monthNoSkipMonths') {
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : ≥ ${n} mois calendaires « stricts » (≥ 3 sorties par semaine ISO du mois)`;
  }
  if (trophy.metric === 'rollingLongRunWeek') {
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : ≥ ${n} sortie${n > 1 ? 's' : ''} longue${n > 1 ? 's' : ''} (≥ 15 km) dans une fenêtre 7×24 h`;
  }
  if (trophy.metric === 'marathonNegativeSplit') {
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : ≥ ${n} marathon${n > 1 ? 's' : ''} (≥ 42,2 km) negative split (tours Garmin)`;
  }
  if (trophy.metric === 'challengeStat' && trophy.statKey === 'efMonthEightyCount') {
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : ≥ ${n} mois calendaires qualifiés (≥8 sorties avec FC, ≥80 % en zone EF)`;
  }
  if (trophy.metric === 'challengeStat' && trophy.statKey === 'efPerfectStreakMax') {
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : ≥ ${n} sorties consécutives entièrement en zone EF (FC)`;
  }
  if (trophy.metric === 'challengeStat' && trophy.statKey === 'efStableHrCount') {
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : ≥ ${n} sortie${n > 1 ? 's' : ''} (EF longue, FC stable par tour Garmin)`;
  }
  if (trophy.metric === 'challengeStat' && trophy.statKey === 'efWeek30EfKmCount') {
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : ≥ ${n} semaine${n > 1 ? 's' : ''} ISO avec ≥30 km cumulés en EF Z2 (hors fractionné)`;
  }
  if (trophy.metric === 'challengeStat' && trophy.statKey === 'efConsecutiveEfDaysMax') {
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : ≥ ${n} jour${n > 1 ? 's' : ''} calendaires consécutifs avec ≥1 sortie EF Z2 (≥2,5 km)`;
  }
  if (
    trophy.metric === 'weeklyRuns' ||
    trophy.metric === 'monthlyRuns' ||
    trophy.metric === 'morningRuns' ||
    trophy.metric === 'intervalRuns' ||
    trophy.metric === 'stablePaceRuns' ||
    trophy.metric === 'runsWithoutStop' ||
    trophy.metric === 'recordImprovements' ||
    trophy.metric === 'challengeStat'
  ) {
    const n = Math.round(Number(target) || 0);
    return `${levelLabel} : ≥ ${n} fois`;
  }
  return `${levelLabel} : ${target}`;
}

function toContributingSummary(run, meta = {}) {
  const durSec = Math.max(0, Math.round(toNumber(run.__durationMin, 0) * 60));
  const avgHrBpm = run.__avgHR > 0 ? Math.round(run.__avgHR) : null;
  return {
    id: run.id ?? run.garminId ?? null,
    garminId: run.garminId ?? null,
    date: run.date,
    time: run.time || null,
    distanceKm: run.__distance,
    durationMin: run.__durationMin,
    durationClock: formatDurationClock(durSec),
    avgHrBpm,
    paceLabel: run.__paceSec != null ? formatPaceSecPerKm(run.__paceSec) : null,
    prevPaceLabel: meta.prevPaceSec != null ? formatPaceSecPerKm(meta.prevPaceSec) : null,
    bucketLabel: meta.bucketLabel != null ? String(meta.bucketLabel) : null,
    hrTrendGroup:
      meta.hrTrendRole === 'early'
        ? 'bloc début (2×)'
        : meta.hrTrendRole === 'late'
          ? 'bloc récent (2×)'
          : null,
    source: run.source || 'manual'
  };
}

function sliceContributing(list, max = 12) {
  const items = list.slice(0, max).map(toContributingSummary);
  const moreCount = Math.max(0, list.length - max);
  return { items, moreCount };
}

function collectRecordImprovementRunsChrono(runs) {
  const eligible = runs.filter((r) => r.__distance >= 5 - 1e-6 && r.__paceSec);
  const sorted = [...eligible].sort((a, b) => a.__date - b.__date);
  const out = [];
  let best = null;
  sorted.forEach((run) => {
    if (best == null || run.__paceSec < best) {
      if (best != null) out.push({ run, prevPaceSec: best });
      best = run.__paceSec;
    }
  });
  return out;
}

/** Regroupe les sorties d’un mois calendaire par semaine ISO (ordre chronologique des semaines). */
function buildWeekGroupsInMonth(monthRuns) {
  const byWeek = new Map();
  monthRuns.forEach((r) => {
    const wk = buildWeekKey(r.__date);
    if (!byWeek.has(wk)) byWeek.set(wk, []);
    byWeek.get(wk).push(r);
  });
  const keys = [...byWeek.keys()].sort();
  return keys.map((wk, idx) => ({
    weekIndex: idx + 1,
    weekKey: wk,
    runs: byWeek.get(wk).sort((a, b) => a.__date - b.__date)
  }));
}

function buildStrictWeekGroupsForMonth(monthKey, runs, minRuns) {
  const parts = monthKey.split('-');
  const y = Number(parts[0]);
  const mo = Number(parts[1]);
  const weeksTouching = listIsoWeekKeysTouchingMonth(y, mo - 1);
  return weeksTouching.map((wk, idx) => {
    const wruns = runs
      .filter((r) => buildMonthKey(r.__date) === monthKey && buildWeekKey(r.__date) === wk)
      .sort((a, b) => a.__date - b.__date);
    return {
      weekIndex: idx + 1,
      weekKey: wk,
      runs: wruns,
      meetsMin: wruns.length >= minRuns,
      count: wruns.length
    };
  });
}

function contributingSectionsSustainMonths(trophy, runs, stats) {
  if (trophy.metric !== 'sustainWeeklyRunsInMonths') return null;
  const minR = toNumber(trophy.sustainMinRunsPerWeek, 3);
  const months = minR >= 4 ? stats.sustainMin4BestMonths || [] : stats.sustainMin3BestMonths || [];
  if (!months.length) return null;
  return months.map((mk) => {
    const monthRuns = runs.filter((r) => buildMonthKey(r.__date) === mk);
    const weeks = buildStrictWeekGroupsForMonth(mk, runs, minR).map((w) => {
      const { items, moreCount } = sliceContributing(w.runs, 12);
      return {
        weekIndex: w.weekIndex,
        weekKey: w.weekKey,
        count: w.count,
        meetsMin: w.meetsMin,
        items,
        moreCount
      };
    });
    return {
      kind: 'sustainMonth',
      monthKey: mk,
      totalCount: monthRuns.length,
      meetsMonthRule: monthMeetsSustainedWeeklyFloor(mk, runs, minR),
      weeks
    };
  });
}

/**
 * Sessions les plus utiles pour comprendre le calcul (aperçu, pas exhaustif pour les cumuls globaux).
 */
export function collectContributingSessions(trophy, runs, stats) {
  if (!stats || trophy.auto === false) {
    return {
      items: [],
      moreCount: 0,
      hint: null
    };
  }
  const m = trophy.metric;
  const maxPreview = 12;

  const sortDesc = (arr) => [...arr].sort((a, b) => b.__date - a.__date);

  if (m === 'singleDistance') {
    const tol = 0.08;
    const hits = runs.filter((r) => r.__distance + 1e-6 >= stats.maxDistance - tol).sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return {
      items,
      moreCount,
      hint:
        hits.length > 0
          ? 'Sorties au moins aussi longues que ta plus grande distance (tolérance ~80 m).'
          : 'Aucune sortie avec distance > 0.'
    };
  }

  if (m === 'totalDistance') {
    const sorted = sortDesc(runs);
    const { items, moreCount } = sliceContributing(sorted, maxPreview);
    return {
      items,
      moreCount,
      hint: `Toutes les sorties comptent dans le cumul (${runs.length} au total).`
    };
  }

  if (m === 'weeklyDistance') {
    if (stats.peakWeekDistKey) {
      const hits = runs
        .filter((r) => buildWeekKey(r.__date) === stats.peakWeekDistKey)
        .sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: `Semaine ISO (agrégat lun–dim) la plus chargée : ${stats.peakWeekDistKey} = ${formatKmOneDecimal(getBestWeeklyDistance(stats))} (somme des km de ces sorties).`
      };
    }
    const sorted = sortDesc(runs);
    const { items, moreCount } = sliceContributing(sorted, maxPreview);
    return {
      items,
      moreCount,
      hint: `Km / semaine ISO : aperçu des sorties récentes (aucune semaine record isolée).`
    };
  }

  if (m === 'sustainWeeklyRunsInMonths') {
    const minR = toNumber(trophy.sustainMinRunsPerWeek, 3);
    const months = minR >= 4 ? stats.sustainMin4BestMonths || [] : stats.sustainMin3BestMonths || [];
    const setM = new Set(months);
    const hits = runs.filter((r) => setM.has(buildMonthKey(r.__date))).sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    const hint =
      months.length > 0
        ? `Sorties des mois de ta meilleure série (${months.join(', ')}) : chaque semaine ISO touchant le mois doit avoir ≥ ${minR} sorties.`
        : `Aucune série de mois qualifiée (≥ ${minR} sorties par semaine ISO touchant chaque mois).`;
    return { items, moreCount, hint };
  }

  if (m === 'weeklyRuns') {
    if (stats.peakWeekRunsKey) {
      const hits = runs
        .filter((r) => buildWeekKey(r.__date) === stats.peakWeekRunsKey)
        .sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      const hint = `Semaine avec le plus de sorties : ${stats.peakWeekRunsKey} (${getBestWeeklyRuns(stats)} sorties).`;
      return {
        items,
        moreCount,
        hint
      };
    }
    const sorted = sortDesc(runs);
    const { items, moreCount } = sliceContributing(sorted, maxPreview);
    return {
      items,
      moreCount,
      hint: 'Nombre de sorties / semaine ISO : aperçu des sorties récentes.'
    };
  }

  if (m === 'monthlyDistance') {
    if (stats.peakMonthDistKey) {
      const hits = runs
        .filter((r) => buildMonthKey(r.__date) === stats.peakMonthDistKey)
        .sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: `Mois le plus dense en km : ${stats.peakMonthDistKey}.`
      };
    }
    const sorted = sortDesc(runs);
    const { items, moreCount } = sliceContributing(sorted, maxPreview);
    return {
      items,
      moreCount,
      hint: 'Km / mois calendaire : aperçu des sorties récentes.'
    };
  }

  if (m === 'monthlyRuns') {
    if (stats.peakMonthRunsKey) {
      const hits = runs
        .filter((r) => buildMonthKey(r.__date) === stats.peakMonthRunsKey)
        .sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: `Mois avec le plus de sorties : ${stats.peakMonthRunsKey}.`
      };
    }
    const sorted = sortDesc(runs);
    const { items, moreCount } = sliceContributing(sorted, maxPreview);
    return {
      items,
      moreCount,
      hint: 'Sorties / mois : aperçu des sorties récentes.'
    };
  }

  if (m === 'streakDays' && stats.streakDates && stats.streakDates.size > 0) {
    const hits = runs
      .filter((r) => stats.streakDates.has(dateKeyLocalFromDate(r.__date)))
      .sort((a, b) => a.__date - b.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return {
      items,
      moreCount,
      hint: `Jours de ta plus longue série (${stats.maxStreak} j).`
    };
  }

  if (m === 'morningRuns') {
    const hits = runs.filter((r) => (startHour(r) ?? 99) < 9).sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return { items, moreCount, hint: 'Sorties commencées avant 9 h.' };
  }

  if (m === 'intervalRuns') {
    const hits = runs.filter((r) => isIntervalRun(r, r.garmin)).sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return { items, moreCount, hint: 'Séances détectées comme fractionnées (type ou tours récup Garmin).' };
  }

  if (m === 'continuousMinutes') {
    const tol = 0.5;
    const usesNoStop = Boolean(trophy.id && CONTINUOUS_TROPHIES_REQUIRE_NO_STOP.has(trophy.id));
    const refMax = usesNoStop
      ? stats.maxContinuousNoStopMinutes ?? stats.maxContinuousMinutes
      : stats.maxContinuousMinutes;
    const hits = runs
      .filter((r) => {
        if (refMax <= 0) return false;
        if (usesNoStop) {
          const dm = noStopContinuousMinutesForRun(r);
          return dm > 0 && dm + tol >= refMax;
        }
        return r.__durationMin + tol >= refMax;
      })
      .sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    const hint = usesNoStop
      ? 'Sans pause : temps mû Garmin si aucune pause détectée ; sortie manuelle = durée saisie (intégrale). Les trophées 1h30 / 2h / 3h partagent la même « plus longue » durée.'
      : 'Sorties dont la durée atteint ta durée max continue (toutes sorties, avec ou sans preuve Garmin sans arrêt).';
    return { items, moreCount, hint };
  }

  if (m === 'best5kPaceMaxSec' && stats.best5kPace != null) {
    const best = stats.best5kPace;
    const hits = runs
      .filter((r) => r.__distance >= 5 && r.__paceSec != null && Math.abs(r.__paceSec - best) < 1.5)
      .sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return { items, moreCount, hint: 'Sorties ≥ 5 km ayant ton meilleur allure (ou quasi identique).' };
  }

  if (m === 'best10kPaceMaxSec' && stats.best10kPace != null) {
    const best = stats.best10kPace;
    const hits = runs
      .filter((r) => r.__distance >= 10 && r.__paceSec != null && Math.abs(r.__paceSec - best) < 1.5)
      .sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return { items, moreCount, hint: 'Sorties ≥ 10 km à l’allure record.' };
  }

  if (m === 'best1kPaceMaxSec' && stats.best1kPace != null) {
    const best = stats.best1kPace;
    const hits = runs
      .filter((r) => r.__distance >= 1 && r.__paceSec != null && Math.abs(r.__paceSec - best) < 1.5)
      .sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return { items, moreCount, hint: 'Sorties ≥ 1 km à l’allure record.' };
  }

  if (m === 'stablePaceRuns') {
    const hits = runs.filter((r) => isStablePaceRun(r.garmin)).sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    const hint =
      trophy.id === 'stable_pace'
        ? 'Même détection que le compteur : variabilité d’allure ≤ 10 s/km entre tours Garmin (≥ 4 tours analysables).'
        : 'Sorties à variabilité d’allure faible entre tours.';
    return { items, moreCount, hint };
  }

  if (m === 'runsWithoutStop') {
    const minKm = toNumber(trophy.withoutStopMinKm, 0);
    const hits = runs
      .filter((r) => {
        if (!r.garmin || !isGarminRunWithoutStop(r.garmin)) return false;
        if (minKm > 0 && r.__distance + 1e-6 < minKm) return false;
        return true;
      })
      .sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    const hint =
      trophy.id === 'run_no_stop'
        ? minKm >= 5
          ? 'Trophée performance : uniquement Garmin ≥ 5 km, 0 pause (même compteur que l’objectif).'
          : 'Trophée performance : uniquement Garmin, 0 pause détectée.'
        : minKm >= 5
          ? 'Uniquement les sorties Garmin ≥ 5 km avec 0 pause détectée (distance totale de la séance).'
          : 'Uniquement les sorties liées à Garmin avec 0 pause détectée.';
    return { items, moreCount, hint };
  }

  if (m === 'recordImprovements') {
    const hits = collectRecordImprovementRunsChrono(runs);
    const items = hits.slice(0, maxPreview).map((h) => toContributingSummary(h.run, { prevPaceSec: h.prevPaceSec }));
    const moreCount = Math.max(0, hits.length - maxPreview);
    const hint =
      trophy.id === 'pr_3_times'
        ? 'Chaque ligne = une amélioration chronologique sur ≥ 5 km ; le compteur du trophée est le nombre total de telles lignes (objectif ici : 3).'
        : 'Chaque ligne = une sortie ≥ 5 km où tu améliores ton meilleur allure chronologique ; « battait » indique l’ancien record (allure moyenne sur la séance).';
    return {
      items,
      moreCount,
      hint
    };
  }

  if (m === 'efDistance' || m === 'efMinutes') {
    const z = stats.zone2;
    const hits = runs
      .filter(
        (r) =>
          r.__avgHR > 0 &&
          z &&
          r.__avgHR >= z.min &&
          r.__avgHR <= z.max
      )
      .sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return {
      items,
      moreCount,
      hint: `Chaque séance listée a une FC moyenne dans [${z?.min ?? '—'} ; ${z?.max ?? '—'}] bpm : on compte toute sa distance et toute sa durée saisie dans le cumul EF (pas un découpage minute par minute).`
    };
  }

  if (m === 'efSingleDistance') {
    const z = stats.zone2;
    const tol = 0.08;
    const hits = runs
      .filter(
        (r) =>
          r.__avgHR > 0 &&
          z &&
          r.__avgHR >= z.min &&
          r.__avgHR <= z.max &&
          r.__distance + 1e-6 >= (stats.maxEFSingleDistance || 0) - tol
      )
      .sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return {
      items,
      moreCount,
      hint:
        'Une seule sortie « 100 % EF » : FC moyenne dans la zone 2 estimée ; on retient la plus grande distance parmi elles (même base pour les trophées 15 / 25 / 30 km, seuils différents).'
    };
  }

  if (m === 'hrTrend') {
    const d = stats.hr5kTrendDetail;
    const ridOf = (r) => String(r.id ?? r.garminId ?? '');
    if (d?.earlyIds?.length === 2 && d?.lateIds?.length === 2) {
      const earlyRuns = runs
        .filter((r) => d.earlyIds.includes(ridOf(r)))
        .sort((a, b) => a.__date - b.__date);
      const lateRuns = runs
        .filter((r) => d.lateIds.includes(ridOf(r)))
        .sort((a, b) => a.__date - b.__date);
      const merged = [...earlyRuns, ...lateRuns];
      const items = merged.map((run) =>
        toContributingSummary(run, { hrTrendRole: d.earlyIds.includes(ridOf(run)) ? 'early' : 'late' })
      );
      const hint = d.meets
        ? `Règle : moyenne FC des 2 premières sorties ≥ 5 km avec FC (${d.earlyAvg} bpm) > moyenne des 2 dernières (${d.lateAvg} bpm). Les lignes ci-dessous sont exactement ces 4 sorties.`
        : `Même règle : les 4 sorties ci-dessous sont les 2 premières et 2 dernières du critère ; il faut une moyenne plus basse sur le bloc récent (${d.earlyAvg} vs ${d.lateAvg} bpm actuellement).`;
      return { items, moreCount: 0, hint };
    }
    const pool = runs.filter((r) => r.__distance >= 5 && r.__avgHR > 0).sort((a, b) => a.__date - b.__date);
    const { items, moreCount } = sliceContributing(pool, maxPreview);
    return {
      items,
      moreCount,
      hint:
        'Au moins 4 sorties ≥ 5 km avec FC moyenne saisie ; comparaison des moyennes des 2 premières vs 2 dernières (ordre chronologique des sorties éligibles).'
    };
  }

  if (m === 'runCount') {
    const sorted = sortDesc(runs);
    const { items, moreCount } = sliceContributing(sorted, maxPreview);
    return { items, moreCount, hint: 'Toutes les sorties comptées.' };
  }

  if (m === 'trialRaceMaxSec') {
    const minKm = toNumber(trophy.trialMinKm, 5);
    const hits = [...runs]
      .filter((r) => r.__distance >= minKm - 1e-6)
      .sort((a, b) => {
        const da = Math.round(a.__durationMin * 60);
        const db = Math.round(b.__durationMin * 60);
        return da - db;
      });
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return {
      items,
      moreCount,
      hint: `Sorties dont la distance ≥ ${minKm} km : durée totale de la sortie = « chrono » retenu ; tri du plus court au plus long (le 1er ligne = record pour ce palier).`
    };
  }

  if (m === 'pace1000AvgMaxSec') {
    const sorted = sortDesc(runs);
    const { items, moreCount } = sliceContributing(sorted, maxPreview);
    return {
      items,
      moreCount,
      hint: 'Toutes les sorties alimentent le cumul distance / durée pour la moyenne globale (≥ 1000 km requis).'
    };
  }

  if (m === 'rollingLongRunWeek') {
    const windowRuns = stats.rollingLongRunWindowRuns;
    const arr =
      Array.isArray(windowRuns) && windowRuns.length
        ? windowRuns
        : runs.filter((r) => r.__distance >= 15 - 1e-6);
    const sorted = [...arr].sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(sorted, maxPreview);
    const n = stats.rollingLongRunWeek ?? 0;
    return {
      items,
      moreCount,
      hint:
        n > 0
          ? `Max de sorties ≥ 15 km dans un intervalle de 7×24 h glissant (début = instant d’une de ces sorties) : ${n} — liste = sorties de la meilleure fenêtre trouvée.`
          : 'Pas encore de sortie ≥ 15 km : le pic sur 7 jours glissants reste à 0.'
    };
  }

  if (m === 'monthNoSkipMonths') {
    const keys = stats.strictNoSkipMonthKeys || [];
    if (!keys.length) {
      return {
        items: [],
        moreCount: 0,
        hint:
          'Aucun mois « strict » encore : ≥ 12 sorties dans le mois, ≥ 3 semaines ISO couvertes, ≥ 3 sorties chaque semaine ISO du mois.'
      };
    }
    const setM = new Set(keys);
    const hits = runs.filter((r) => setM.has(buildMonthKey(r.__date))).sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return {
      items,
      moreCount,
      hint: `Mois qualifiés : ${keys.join(', ')}. Les sorties listées appartiennent à ces mois (règle identique au compteur).`
    };
  }

  if (m === 'improveBucketsCount') {
    const bumps = collectFirstImprovementRunPerDistanceBucket(runs);
    const items = bumps
      .slice(0, maxPreview)
      .map((b) => toContributingSummary(b.run, { prevPaceSec: b.prevPaceSec, bucketLabel: b.bucketLabel }));
    const moreCount = Math.max(0, bumps.length - maxPreview);
    return {
      items,
      moreCount,
      hint:
        'Première amélioration d’allure chronologique par famille (5 km, 10 km, semi) — une preuve par famille, pas la liste globale des records.'
    };
  }

  if (m === 'marathonNegativeSplit') {
    const hits = runs.filter((r) => marathonNegativeSplitRun(r, r.garmin)).sort((a, b) => b.__date - a.__date);
    const { items, moreCount } = sliceContributing(hits, maxPreview);
    return {
      items,
      moreCount,
      hint: 'Marathon (≥ 42,2 km) dont la 2ᵉ moitié (tours) est plus rapide que la 1ʳᵉ.'
    };
  }

  if (m === 'challengeStat') {
    if (trophy.statKey?.startsWith('tpl_')) {
      const tid = trophy.statKey.slice(4);
      const hits = runs
        .filter((r) => matchesIntervalWorkTemplate(r, r.garmin, tid))
        .sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: `Sorties où la chaîne travail/récup des tours matche le gabarit ${tid} (même critère que le compteur).`
      };
    }
    if (trophy.statKey === 'intAfter30Count') {
      const hits = runs.filter((r) => intervalAfterFatigue(r, r.garmin)).sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: 'Fractionné avec enchaînement type 6×1 après ≥ 30 min de chauffe (détection par tours).'
      };
    }
    if (trophy.statKey === 'intDescCount') {
      const hits = runs.filter((r) => intervalDescendingReps(r, r.garmin)).sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: 'Au moins 3 efforts successifs avec allure strictement décroissante (fractionné).'
      };
    }
    if (trophy.statKey === 'intNoStopCount') {
      const hits = runs.filter((r) => intervalNoActiveStop(r, r.garmin)).sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: 'Fractionné sans « arrêt actif » court en récup (tours récup ≥ ~120 m).'
      };
    }
    if (trophy.statKey && /^chaos/i.test(trophy.statKey)) {
      const det = CHAOS_SESSION_DETECTORS[trophy.statKey];
      const hits = det
        ? runs.filter((r) => det(r, r.garmin)).sort((a, b) => b.__date - a.__date)
        : [];
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: det
          ? 'Sorties qui matchent la détection spécifique de ce défi (tours / distance / FC selon l’intitulé).'
          : 'Signal agrégé sur tes sorties (voir intitulé du défi).'
      };
    }
    if (trophy.statKey === 'efMonthEightyCount') {
      const z = stats.zone2;
      const monthOk = new Set(listQualifyingEfEightyMonthKeys(runs, z));
      const hits = runs
        .filter((r) => monthOk.has(buildMonthKey(r.__date)))
        .sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: `Uniquement les sorties des mois qualifiés (≥8 avec FC, ≥80 % FC ${z?.min ?? '—'}–${z?.max ?? '—'}).`
      };
    }
    if (trophy.statKey === 'efPerfectStreakMax') {
      const z = stats.zone2;
      const hits = runs
        .filter((r) => r.__avgHR > 0 && z && r.__avgHR >= z.min && r.__avgHR <= z.max)
        .sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return { items, moreCount, hint: 'Sorties 100 % dans la zone EF estimée.' };
    }
    if (trophy.statKey === 'efStableHrCount') {
      const hits = runs.filter((r) => efStableHrLongRun(r, r.garmin, stats.zone2)).sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: 'EF longue avec FC par tour peu dispersée (données Garmin).'
      };
    }
    if (trophy.statKey === 'efDawnCount') {
      const z = stats.zone2;
      const hits = runs
        .filter((r) => {
          const h = startHour(r);
          return h != null && h < 7 && isEfFundamentalRun(r, z);
        })
        .sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: 'Heure de départ avant 7 h, FC zone EF, ≥2,5 km et ≥18 min, hors fractionné.'
      };
    }
    if (trophy.statKey === 'efEveningCount') {
      const z = stats.zone2;
      const hits = runs
        .filter((r) => {
          const h = startHour(r);
          return h != null && h >= 20 && h <= 23 && isEfFundamentalRun(r, z);
        })
        .sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: 'Heure de départ 20 h–23 h, mêmes critères EF fondamental.'
      };
    }
    if (trophy.statKey === 'efWeek30EfKmCount') {
      const z = stats.zone2;
      const weekOk = listIsoWeekKeysWithMinEfFundamentalKm(runs, z, 30);
      const hits = runs
        .filter((r) => weekOk.has(buildWeekKey(r.__date)) && isEfFundamentalRun(r, z))
        .sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: 'Sorties comptées dans des semaines ISO où le cumul EF Z2 (hors fractionné) atteint 30 km.'
      };
    }
    if (trophy.statKey === 'efConsecutiveEfDaysMax') {
      const z = stats.zone2;
      const hits = runs.filter((r) => isEfFundamentalRun(r, z)).sort((a, b) => b.__date - a.__date);
      const { items, moreCount } = sliceContributing(hits, maxPreview);
      return {
        items,
        moreCount,
        hint: 'Toutes les sorties EF Z2 retenues pour la série ; le score = plus longue chaîne de jours calendaires consécutifs.'
      };
    }
    return { items: [], moreCount: 0, hint: 'Signal agrégé sur tes sorties (voir intitulé du défi).' };
  }

  if (m === 'completeSimplesCount') {
    return {
      items: [],
      moreCount: 0,
      hint: `Trophées simples validés : ${stats.completeSimpleCompleted ?? 0} / ${stats.completeSimpleTotal ?? 0}.`
    };
  }

  return { items: [], moreCount: 0, hint: null };
}

export function evaluateRunningTrophies({ runningSessions = [], garminById = new Map() }) {
  const runsNorm = normalizeRuns(runningSessions);
  runsNorm.forEach((run) => {
    const garminId = run.garminId != null ? String(run.garminId) : String(run.id);
    run.garmin = garminById.get(garminId) || null;
    mergeGarminHrIntoRun(run);
  });
  const runs = runsNorm.filter((r) => !isWalkingLikeRunningSession(r, r.garmin));
  const stats = buildStats(runs, garminById);
  const catalog = buildRunningTrophiesCatalog();
  const results = [];

  let score = 0;
  let maxScore = 0;

  catalog.forEach((trophy) => {
    if (trophy.id === 'complete_simples') {
      return;
    }
    const points = DIFFICULTY_POINTS[trophy.difficulty] || 10;
    const auto = trophy.auto !== false;

    const levels = LEVELS.map((level) => {
      const evaluation = evaluateSingle(trophy, stats, level);
      return { level, ...evaluation };
    });

    const highestIdx = [...levels].map((l, i) => (l.unlocked ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
    const highestLevel = highestIdx >= 0 ? levels[highestIdx].level : null;
    const tierShare = highestIdx >= 0 ? (highestIdx + 1) / LEVELS.length : 0;
    const trophyScore = auto ? points * tierShare : 0;
    if (auto) {
      maxScore += points;
      score += trophyScore;
    }

    const contrib = collectContributingSessions(trophy, runs, stats);
    const contributingSections =
      trophy.metric === 'sustainWeeklyRunsInMonths' ? contributingSectionsSustainMonths(trophy, runs, stats) : null;

    results.push({
      ...trophy,
      levels,
      highestLevel,
      trophyScore: Math.round(trophyScore * 10) / 10,
      contributingSessions: contrib.items,
      contributingMoreCount: contrib.moreCount,
      contributingHint: contrib.hint,
      contributingSections
    });
  });

  const simpleIds = catalog
    .filter((t) => t.difficulty === 'simple' && t.id !== 'complete_simples')
    .map((t) => t.id);
  const completedSimple = simpleIds.filter((id) => {
    const row = results.find((r) => r.id === id);
    return row?.levels?.some((l) => l.unlocked);
  }).length;
  const statsComplete = {
    ...stats,
    completeSimpleCompleted: completedSimple,
    completeSimpleTotal: simpleIds.length
  };
  const trophyCs = catalog.find((t) => t.id === 'complete_simples');
  if (trophyCs) {
    const points = DIFFICULTY_POINTS[trophyCs.difficulty] || 10;
    const levels = LEVELS.map((level) => ({ level, ...evaluateSingle(trophyCs, statsComplete, level) }));
    const highestIdx = [...levels].map((l, i) => (l.unlocked ? i : -1)).reduce((a, b) => Math.max(a, b), -1);
    const highestLevel = highestIdx >= 0 ? levels[highestIdx].level : null;
    const tierShare = highestIdx >= 0 ? (highestIdx + 1) / LEVELS.length : 0;
    const trophyScore = points * tierShare;
    maxScore += points;
    score += trophyScore;
    const contrib = collectContributingSessions(trophyCs, runs, statsComplete);
    results.push({
      ...trophyCs,
      levels,
      highestLevel,
      trophyScore: Math.round(trophyScore * 10) / 10,
      contributingSessions: contrib.items,
      contributingMoreCount: contrib.moreCount,
      contributingHint: contrib.hint,
      contributingSections: null
    });
  }

  const unlockedById = results.map((r) => ({
    id: r.id,
    unlockedLevels: r.levels.filter((l) => l.unlocked).map((l) => l.level),
    highestLevel: r.highestLevel
  }));

  const statsOut = {
    ...stats,
    completeSimpleCompleted: completedSimple,
    completeSimpleTotal: simpleIds.length
  };

  return {
    stats: statsOut,
    results,
    unlockedById,
    scoreComposite: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    scoreRaw: Math.round(score * 10) / 10,
    scoreMax: maxScore
  };
}

