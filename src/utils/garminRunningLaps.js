/**
 * Phase d'un tour Garmin (course) — aligné sur RunningSessionDetailPage / export Garmin.
 * @returns {'effort'|'recovery'|'warmup'|'cooldown'|'other'}
 */
export function classifyLapPhase(lap) {
  const raw = String(lap?.intervalTypeKey || lap?.lapType || lap?.type || '').toUpperCase();
  if (!raw) return 'effort';
  if (/REST|RECOVERY|STATIONARY|PAUSE|STOP|RESTING|INTERVAL_REST/.test(raw)) return 'recovery';
  if (/COOLDOWN|COOL_DOWN|COOL/.test(raw)) return 'cooldown';
  if (/WARMUP|WARM_UP|WARM-UP/.test(raw)) return 'warmup';
  if (/ACTIVE|INTERVAL|WORK|WORKOUT|SPEED|RACE|REP|LAP/.test(raw)) return 'effort';
  return 'other';
}

/**
 * Infère le type de séance course pour l’import Garmin : fractionné si au moins un tour
 * récup / retour au calme et au moins un tour effort (même logique que l’UI des tours).
 * @returns {'interval'|'endurance'}
 */
export function inferRunningSessionTypeFromGarminActivity(gAct) {
  const laps = gAct?.running?.laps;
  if (!Array.isArray(laps) || laps.length === 0) return 'endurance';
  let effort = 0;
  let recovery = 0;
  for (const lap of laps) {
    const phase = classifyLapPhase(lap);
    if (phase === 'recovery' || phase === 'cooldown') recovery += 1;
    else effort += 1;
  }
  return recovery > 0 && effort > 0 ? 'interval' : 'endurance';
}

/** Clé type Garmin d’origine (à privilégier : activityType peut être forcé à « running » côté serveur). */
function garminTypeKeyLower(gAct) {
  return String(gAct?.garminTypeKey || gAct?.activityTypeDTO?.typeKey || '').toLowerCase();
}

function displayActivityTypeLower(gAct) {
  return String(gAct?.activityType || '').toLowerCase();
}

/** Marche / rando : à exclure du cumul « distance courue ». */
function isGarminWalkingLikeTypeKey(tk) {
  if (!tk) return false;
  if (
    tk === 'walking' ||
    tk === 'indoor_walking' ||
    tk === 'speed_walking' ||
    tk === 'hiking' ||
    tk === 'hike' ||
    tk === 'trail_hiking' ||
    tk === 'snow_shoeing' ||
    tk === 'ultra_hike'
  ) {
    return true;
  }
  if (tk.includes('hiking') || tk.includes('hike')) return true;
  if (tk.includes('walk') && !tk.includes('running')) return true;
  return false;
}

/**
 * Aligné sur garmin-server `is_running_like_activity` : course à pied / tapis / trail, etc.
 * Ne s’appuie pas sur activityType seul si garminTypeKey indique marche.
 */
function isGarminRunningLikeTypeKey(tk) {
  if (!tk || isGarminWalkingLikeTypeKey(tk)) return false;
  if (/running|treadmill|trail|virtual_run|race|jog/.test(tk)) return true;
  const keys = new Set([
    'running',
    'street_running',
    'track_running',
    'indoor_running',
    'treadmill_running',
    'trail_running',
    'virtual_run',
    'ultra_run',
    'track_run',
    'indoor_track',
    'race',
    'treadmill',
  ]);
  return keys.has(tk);
}

function garminHasPositiveRunDistance(gAct) {
  let d = gAct?.distance;
  if (d != null && typeof d === 'object') {
    d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
  }
  const n = Number(d);
  if (Number.isFinite(n) && n > 0) return true;
  const m = gAct?.running?.distanceMeters ?? gAct?.distanceMeters;
  return m != null && Number(m) > 0;
}

/** Marche / rando côté activité complète (clés Garmin + libellé). */
export function isGarminWalkingLikeActivity(gAct) {
  if (!gAct) return false;
  const gTk = garminTypeKeyLower(gAct);
  const dTk = displayActivityTypeLower(gAct);
  return isGarminWalkingLikeTypeKey(gTk) || isGarminWalkingLikeTypeKey(dTk);
}

/** Activité cardio enregistrée comme course (même critères que l’import endurance). */
export function isGarminRunningLikeActivity(gAct) {
  if (!gAct || (gAct.jumps && gAct.jumps > 0)) return false;

  const gTk = garminTypeKeyLower(gAct);
  const dTk = displayActivityTypeLower(gAct);

  if (isGarminWalkingLikeTypeKey(gTk) || isGarminWalkingLikeTypeKey(dTk)) return false;

  if (isGarminRunningLikeTypeKey(gTk) || isGarminRunningLikeTypeKey(dTk)) return true;

  // Legacy : bloc `running` (tours, allure…) — sans garminTypeKey : même heuristique qu’historiquement
  if (gAct.running && garminHasPositiveRunDistance(gAct)) {
    if (!gTk) return true;
    if (gTk === 'indoor_cardio' || gTk === 'cardio' || gTk === 'fitness_equipment' || gTk === 'hiit') {
      return true;
    }
    if (dTk === 'running') return true;
  }

  return false;
}

function lapDistanceKm(lap) {
  if (lap == null) return 0;
  if (lap.distanceKm != null) {
    const k = Number(lap.distanceKm);
    if (Number.isFinite(k) && k > 0) return k;
  }
  let d = lap.distance;
  if (d != null && typeof d === 'object') {
    d = d.total ?? d.value ?? d.current ?? d.avg ?? 0;
  }
  const n = Number(d);
  if (Number.isFinite(n) && n > 0) {
    if (n > 400 && n < 200000) return n / 1000;
    return n;
  }
  const m = Number(lap.distanceMeters ?? lap.distanceMeter ?? 0);
  if (Number.isFinite(m) && m > 0) return m / 1000;
  return 0;
}

function lapDurationSec(lap) {
  const sec = Number(lap?.durationSeconds ?? lap?.duration ?? lap?.elapsedDuration ?? 0);
  return Number.isFinite(sec) && sec > 0 ? sec : 0;
}

/**
 * Pic d’allure / vitesse sur les tours « effort » (pas récup ni retour au calme).
 * Si aucun tour exploitable en strict, retente en excluant seulement récup / cooldown (warmup inclus).
 * @returns {{ bestPaceSecPerKm: number, bestSpeedKmh: number } | null}
 */
export function getRunningPeakPaceFromEffortLaps(activity) {
  const laps = activity?.running?.laps;
  if (!Array.isArray(laps) || laps.length === 0) return null;

  const scan = (strictEffortOnly) => {
    let bestPace = null;
    let bestSpeed = 0;
    for (const lap of laps) {
      const phase = classifyLapPhase(lap);
      if (strictEffortOnly) {
        if (phase !== 'effort') continue;
      } else if (phase === 'recovery' || phase === 'cooldown') {
        continue;
      }
      const km = lapDistanceKm(lap);
      const sec = lapDurationSec(lap);
      if (km < 0.03 || sec < 5) continue;
      const pace = sec / km;
      const spd =
        lap.avgSpeedKmh != null && Number.isFinite(Number(lap.avgSpeedKmh)) && Number(lap.avgSpeedKmh) > 0
          ? Number(lap.avgSpeedKmh)
          : (km / sec) * 3600;
      if (bestPace == null || pace < bestPace) bestPace = pace;
      if (spd > bestSpeed) bestSpeed = spd;
    }
    return bestPace != null ? { bestPaceSecPerKm: bestPace, bestSpeedKmh: bestSpeed } : null;
  };

  return scan(true) || scan(false);
}

/**
 * @returns {'interval'|'endurance'|null} null = autre cardio (vélo, elliptique, etc.)
 */
export function getGarminCardioActivityRunKind(gAct) {
  if (!isGarminRunningLikeActivity(gAct)) return null;
  return inferRunningSessionTypeFromGarminActivity(gAct);
}
