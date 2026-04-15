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

/**
 * @returns {'interval'|'endurance'|null} null = autre cardio (vélo, elliptique, etc.)
 */
export function getGarminCardioActivityRunKind(gAct) {
  if (!isGarminRunningLikeActivity(gAct)) return null;
  return inferRunningSessionTypeFromGarminActivity(gAct);
}
