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

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
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

function maxConsecutiveDays(runs) {
  if (!runs.length) return 0;
  const uniq = [...new Set(runs.map((r) => r.__date.toISOString().slice(0, 10)))].map((d) => new Date(`${d}T00:00:00`));
  uniq.sort((a, b) => a - b);
  let best = 1;
  let streak = 1;
  for (let i = 1; i < uniq.length; i += 1) {
    const diff = (uniq[i] - uniq[i - 1]) / 86400000;
    if (diff === 1) streak += 1;
    else streak = 1;
    if (streak > best) best = streak;
  }
  return best;
}

function countImprovedRecords(runs) {
  let bestPace = null;
  let improvements = 0;
  runs.forEach((run) => {
    if (!run.__paceSec) return;
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
  const maxHr = runs.reduce((acc, r) => Math.max(acc, r.__maxHR || 0), 0);
  const fallbackMax = maxHr > 0 ? maxHr : 190;
  return {
    min: Math.round(fallbackMax * 0.6),
    max: Math.round(fallbackMax * 0.75)
  };
}

function buildStats(runs, garminById = new Map()) {
  const weekBuckets = new Map();
  const monthBuckets = new Map();
  let totalDistance = 0;
  let totalEFDistance = 0;
  let totalEFMinutes = 0;
  let intervalCount = 0;
  let morningRuns = 0;
  let rainyRuns = 0;
  let runsWithoutStop = 0;
  let maxContinuousMinutes = 0;
  let maxDistance = 0;
  let best5kPace = null;
  let best10kPace = null;
  let best1kPace = null;
  let negativeSplitRuns = 0;
  let stablePaceRuns = 0;
  let cadenceAbove170 = 0;
  let vo2Improvements = 0;
  let lastVo2 = null;
  let lowHR5kRuns = 0;

  const zone2 = inferZone2Bounds(runs);
  const hr5k = [];

  runs.forEach((run) => {
    const garminId = run.garminId != null ? String(run.garminId) : String(run.id);
    const garmin = garminById.get(garminId) || null;
    run.garmin = garmin;

    totalDistance += run.__distance;
    maxContinuousMinutes = Math.max(maxContinuousMinutes, run.__durationMin);
    maxDistance = Math.max(maxDistance, run.__distance);

    const week = buildWeekKey(run.__date);
    const month = buildMonthKey(run.__date);
    if (!weekBuckets.has(week)) weekBuckets.set(week, { distance: 0, runs: 0 });
    if (!monthBuckets.has(month)) monthBuckets.set(month, { distance: 0, runs: 0 });
    weekBuckets.get(week).distance += run.__distance;
    weekBuckets.get(week).runs += 1;
    monthBuckets.get(month).distance += run.__distance;
    monthBuckets.get(month).runs += 1;

    if ((startHour(run) ?? 99) < 9) morningRuns += 1;

    const weatherText = String(garmin?.weather?.condition || garmin?.weather?.description || '').toLowerCase();
    if (weatherText.includes('rain') || weatherText.includes('pluie')) rainyRuns += 1;

    const laps = garmin?.running?.laps;
    const hasRecovery = Array.isArray(laps) && laps.some((lap) => String(lap.intervalTypeKey || '').includes('RECOVERY'));
    const runType = String(run.type || '').toLowerCase();
    const isInterval = runType.includes('interval') || hasRecovery;
    if (isInterval) intervalCount += 1;

    // Pas d'arrêt : uniquement si on a des signaux Garmin (sinon on évite les faux positifs manuels)
    if (garmin) {
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
        movingSec > 30 && elapsedSec > 0 && elapsedSec - movingSec >= 45; // ~45s d'écart = pause probable
      const hasStop = pauseCount > 0 || hasRestLap || pauseByMoving;
      if (!hasStop) runsWithoutStop += 1;
    }

    if (run.__distance >= 5 && run.__paceSec) {
      best5kPace = best5kPace == null ? run.__paceSec : Math.min(best5kPace, run.__paceSec);
      if (run.__avgHR > 0) hr5k.push(run.__avgHR);
    }
    if (run.__distance >= 10 && run.__paceSec) {
      best10kPace = best10kPace == null ? run.__paceSec : Math.min(best10kPace, run.__paceSec);
    }
    if (run.__distance >= 1 && run.__paceSec) {
      best1kPace = best1kPace == null ? run.__paceSec : Math.min(best1kPace, run.__paceSec);
    }

    if (Array.isArray(laps) && laps.length >= 4) {
      const firstHalf = laps.slice(0, Math.floor(laps.length / 2));
      const secondHalf = laps.slice(Math.floor(laps.length / 2));
      const firstAvg = avgPaceLaps(firstHalf);
      const secondAvg = avgPaceLaps(secondHalf);
      if (firstAvg && secondAvg && secondAvg < firstAvg) negativeSplitRuns += 1;
      const variability = variabilitySecPerKm({ garmin });
      if (variability != null && variability <= 10) stablePaceRuns += 1;
    }

    const avgCadence = toNumber(garmin?.running?.averageCadenceSpm, 0);
    if (avgCadence >= 170) cadenceAbove170 += 1;

    const vo2 = toNumber(garmin?.training?.vo2Max || garmin?.vo2Max || 0, 0);
    if (vo2 > 0) {
      if (lastVo2 != null && vo2 > lastVo2) vo2Improvements += 1;
      lastVo2 = vo2;
    }

    const isEF = run.__avgHR >= zone2.min && run.__avgHR <= zone2.max;
    if (isEF) {
      totalEFDistance += run.__distance;
      totalEFMinutes += run.__durationMin;
    }
  });

  const hrTrendBetter = hr5k.length >= 4 && hr5k.slice(-2).reduce((a, b) => a + b, 0) / 2 < hr5k.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
  if (hrTrendBetter) lowHR5kRuns = 1;

  return {
    totalRuns: runs.length,
    totalDistance,
    totalEFDistance,
    totalEFMinutes,
    weekBuckets,
    monthBuckets,
    intervalCount,
    morningRuns,
    rainyRuns,
    maxStreak: maxConsecutiveDays(runs),
    improvements: countImprovedRecords(runs),
    maxContinuousMinutes,
    maxDistance,
    best5kPace,
    best10kPace,
    best1kPace,
    negativeSplitRuns,
    stablePaceRuns,
    cadenceAbove170,
    vo2Improvements,
    runsWithoutStop,
    lowHR5kRuns
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

function evaluateSingle(trophy, stats, level) {
  if (trophy.auto === false) {
    return { value: 0, target: 0, progress: 0, unlocked: false };
  }
  const mult = LEVEL_MULTIPLIERS[level];
  const target = trophy.adaptive ? trophy.baseTarget * mult : trophy.baseTarget;
  let value = 0;

  switch (trophy.metric) {
    case 'singleDistance': value = stats.maxDistance; break;
    case 'runCount': value = stats.totalRuns; break;
    case 'weeklyDistance': value = getBestWeeklyDistance(stats); break;
    case 'weeklyRuns': value = getBestWeeklyRuns(stats); break;
    case 'monthlyDistance': value = getBestMonthlyDistance(stats); break;
    case 'monthlyRuns': value = getBestMonthlyRuns(stats); break;
    case 'streakDays': value = stats.maxStreak; break;
    case 'morningRuns': value = stats.morningRuns; break;
    case 'rainyRuns': value = stats.rainyRuns; break;
    case 'intervalRuns': value = stats.intervalCount; break;
    case 'continuousMinutes': value = stats.maxContinuousMinutes; break;
    case 'best5kPaceMaxSec': value = stats.best5kPace == null ? 9999 : stats.best5kPace; break;
    case 'best10kPaceMaxSec': value = stats.best10kPace == null ? 9999 : stats.best10kPace; break;
    case 'best1kPaceMaxSec': value = stats.best1kPace == null ? 9999 : stats.best1kPace; break;
    case 'negativeSplits': value = stats.negativeSplitRuns; break;
    case 'stablePaceRuns': value = stats.stablePaceRuns; break;
    case 'highCadenceRuns': value = stats.cadenceAbove170; break;
    case 'vo2Improvements': value = stats.vo2Improvements; break;
    case 'runsWithoutStop': value = stats.runsWithoutStop; break;
    case 'recordImprovements': value = stats.improvements; break;
    case 'totalDistance': value = stats.totalDistance; break;
    case 'efDistance': value = stats.totalEFDistance; break;
    case 'efMinutes': value = stats.totalEFMinutes; break;
    case 'hrTrend': value = stats.lowHR5kRuns; break;
    default: value = 0;
  }

  const isInverse = trophy.metric.endsWith('MaxSec');
  const progress = isInverse
    ? (value <= target ? 1 : target > 0 ? Math.max(0, Math.min(1, target / value)) : 0)
    : (target > 0 ? Math.max(0, Math.min(1, value / target)) : 0);
  const unlocked = isInverse ? value <= target : value >= target;

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
    { id: 'run_5_no_stop', title: 'Courir 5 km sans s’arrêter', metric: 'runsWithoutStop', baseTarget: 1, difficulty: 'simple', category: 'Simples' },
    { id: 'run_30min', title: 'Courir 30 min sans pause', metric: 'continuousMinutes', baseTarget: 30, difficulty: 'simple', category: 'Simples' },
    { id: 'run_morning', title: 'Faire un run le matin (avant 9h)', metric: 'morningRuns', baseTarget: 1, difficulty: 'simple', category: 'Simples' },
    { id: 'run_rain', title: 'Faire un run sous la pluie', metric: 'rainyRuns', baseTarget: 1, difficulty: 'simple', category: 'Simples' },
    { id: 'run_3_streak', title: 'Courir 3 jours d’affilée', metric: 'streakDays', baseTarget: 3, difficulty: 'simple', category: 'Simples' },
    { id: 'run_improve', title: 'Améliorer une allure moyenne sur 5 km', metric: 'recordImprovements', baseTarget: 1, difficulty: 'simple', category: 'Simples' },
    { id: 'run_10_month', title: 'Faire 10 runs dans le mois', metric: 'monthlyRuns', baseTarget: 10, difficulty: 'intermediate', category: 'Intermédiaires' },
    { id: 'run_50_month', title: 'Courir 50 km cumulés en 1 mois', metric: 'monthlyDistance', baseTarget: 50, difficulty: 'intermediate', category: 'Intermédiaires' },
    { id: 'run_5_intervals', title: 'Faire 5 séances d’intervalles', metric: 'intervalRuns', baseTarget: 5, difficulty: 'intermediate', category: 'Intermédiaires' },
    { id: 'run_45min', title: 'Tenir 45 min en continu', metric: 'continuousMinutes', baseTarget: 45, difficulty: 'intermediate', category: 'Intermédiaires' },
    { id: 'run_3_week_month', title: 'Courir 3 fois/semaine pendant 1 mois', metric: 'weeklyRuns', baseTarget: 3, difficulty: 'intermediate', category: 'Intermédiaires', adaptive: true },
    { id: 'negative_split', title: 'Faire un negative split', metric: 'negativeSplits', baseTarget: 1, difficulty: 'specific', category: 'Performance spécifique' },
    { id: 'stable_pace', title: 'Maintenir une allure stable (<10 sec/km)', metric: 'stablePaceRuns', baseTarget: 1, difficulty: 'specific', category: 'Performance spécifique' },
    { id: 'cadence_170', title: 'Cadence moyenne > 170 spm', metric: 'highCadenceRuns', baseTarget: 1, difficulty: 'specific', category: 'Performance spécifique' },
    { id: 'hr_reduce_5k', title: 'Réduire la FC moyenne sur 5 km', metric: 'hrTrend', baseTarget: 1, difficulty: 'specific', category: 'Performance spécifique' },
    { id: 'vo2_improve', title: 'Améliorer le VO2 estimé (Garmin)', metric: 'vo2Improvements', baseTarget: 1, difficulty: 'specific', category: 'Performance spécifique' },
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
    { id: 'run_4_week_2m', title: 'Faire 4 runs/semaine pendant 2 mois', metric: 'weeklyRuns', baseTarget: 4, difficulty: 'elite', category: 'Élites' },
    { id: 'run_7_streak', title: 'Courir 7 jours d’affilée', metric: 'streakDays', baseTarget: 7, difficulty: 'elite', category: 'Élites' },
    { id: 'interval_20', title: 'Faire 20 séances d’intervalles', metric: 'intervalRuns', baseTarget: 20, difficulty: 'elite', category: 'Élites' },
    { id: 'cardio_progress', title: 'Réduire FC moyenne à allure égale', metric: 'hrTrend', baseTarget: 1, difficulty: 'elite', category: 'Élites' },
    { id: 'semi_finish', title: 'Courir un semi-marathon (21,1 km)', metric: 'singleDistance', baseTarget: 21.1, difficulty: 'elite', category: 'Game Boss' },
    { id: 'marathon_finish', title: 'Courir un marathon (42,2 km)', metric: 'singleDistance', baseTarget: 42.2, difficulty: 'elite', category: 'Game Boss' },
    // --- Défis demandés : affichés mais pas encore auto-détectés (évite faux positifs) ---
    { id: 'pace_1000_under_500', title: 'Courir 1000 km < 5:00/km de moyenne cumulée', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Endurance & volume', auto: false },
    { id: 'two_long_week', title: 'Courir 2 sorties longues en 7 jours', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Endurance extrême', auto: false },
    { id: 'month_no_skip', title: 'Un mois complet sans abandon (≥ 3 runs/semaine)', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Élites', auto: false },
    { id: 'improve_3_distances', title: 'Améliorer allure moyenne sur 3 distances différentes', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Élites', auto: false },
    { id: 'complete_simples', title: 'Compléter tous les trophées « simples »', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Élites', auto: false },
    { id: 'ef_15k', title: 'Courir 15 km en EF', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Endurance extrême', auto: false },
    { id: 'ef_25k', title: 'Courir 25 km en EF', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Endurance extrême', auto: false },
    { id: 'ef_30k', title: 'Courir 30 km en EF', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Endurance extrême', auto: false },
    { id: 'marathon_ns', title: 'Marathon avec negative split', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Game Boss', auto: false },
    { id: 'boss_10k_50', title: '10 km < 50 min', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Game Boss', auto: false },
    { id: 'boss_10k_45', title: '10 km < 45 min', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Game Boss', auto: false },
    { id: 'boss_10k_40', title: '10 km < 40 min', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Game Boss', auto: false },
    { id: 'boss_5k_20', title: '5 km < 20 min', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Game Boss', auto: false },
    { id: 'boss_5k_18', title: '5 km < 18 min', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Game Boss', auto: false },
    { id: 'boss_5k_15', title: '5 km < 15 min', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Game Boss', auto: false },
    { id: 'boss_semi_145', title: 'Semi-marathon < 1h45', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Game Boss', auto: false },
    { id: 'boss_semi_130', title: 'Semi-marathon < 1h30', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Game Boss', auto: false },
    { id: 'int_6x1', title: '6×1 min rapide / 1 min récup', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif', auto: false },
    { id: 'int_10x1', title: '10×1 min rapide / 1 min récup', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif', auto: false },
    { id: 'int_6x2', title: '6×2 min rapide / 1 min récup', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif', auto: false },
    { id: 'int_5x3', title: '5×3 min rapide / 2 min récup', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif', auto: false },
    { id: 'int_4x4', title: '4×4 min rapide / 2 min récup', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif', auto: false },
    { id: 'int_3x8', title: '3×8 min seuil', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif', auto: false },
    { id: 'int_2x15', title: '2×15 min tempo', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif', auto: false },
    { id: 'int_after_30', title: 'Fractionné en fatigue (après 30 min de course)', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif', auto: false },
    { id: 'int_desc', title: 'Fractionné allure décroissante (chaque rep plus rapide)', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif', auto: false },
    { id: 'int_no_active_stop', title: 'Fractionné sans arrêt actif (récup = footing lent)', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné évolutif', auto: false },
    { id: 'chaos_1k_active', title: 'Courir 1 km actif (accélérations continues)', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos', auto: false },
    { id: 'chaos_5k_fartlek', title: '5 km avec changements d’allure libres', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos', auto: false },
    { id: 'chaos_10k_500m', title: '10 km avec 1 accélération toutes les 500 m', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos', auto: false },
    { id: 'chaos_30m_2m', title: '30 min avec variations imposées toutes les 2 min', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos', auto: false },
    { id: 'chaos_hills', title: 'Fractionné terrain irrégulier (côtes incluses)', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos', auto: false },
    { id: 'chaos_end', title: 'Fractionné en fin de séance (fatigue extrême)', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos', auto: false },
    { id: 'chaos_hr_cap', title: 'Fractionné avec FC plafonnée', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos', auto: false },
    { id: 'chaos_no_pace', title: 'Fractionné sans regarder l’allure', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos', auto: false },
    { id: 'chaos_ns_internal', title: 'Fractionné objectif negative split interne', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'Fractionné chaos', auto: false },
    { id: 'ef_month_80', title: '1 mois sans sortir de zone EF sur 80% des runs', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'EF avancée', auto: false },
    { id: 'ef_5_perfect', title: '5 runs consécutifs en EF parfaite', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'EF avancée', auto: false },
    { id: 'ef_stable_hr', title: 'EF avec FC stabilisée (écart faible sur toute sortie)', metric: 'manual', baseTarget: 1, difficulty: 'elite', category: 'EF avancée', auto: false },
  ];

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

export function evaluateRunningTrophies({ runningSessions = [], garminById = new Map() }) {
  const runs = normalizeRuns(runningSessions);
  const stats = buildStats(runs, garminById);
  const catalog = buildRunningTrophiesCatalog();
  const results = [];

  let score = 0;
  let maxScore = 0;

  catalog.forEach((trophy) => {
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

    results.push({
      ...trophy,
      levels,
      highestLevel,
      trophyScore: Math.round(trophyScore * 10) / 10
    });
  });

  const unlockedById = results.map((r) => ({
    id: r.id,
    unlockedLevels: r.levels.filter((l) => l.unlocked).map((l) => l.level),
    highestLevel: r.highestLevel
  }));

  return {
    stats,
    results,
    unlockedById,
    scoreComposite: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    scoreRaw: Math.round(score * 10) / 10,
    scoreMax: maxScore
  };
}

