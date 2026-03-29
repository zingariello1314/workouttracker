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

/** Activité cardio enregistrée comme course (même critères que l’import endurance). */
export function isGarminRunningLikeActivity(gAct) {
  if (!gAct || (gAct.jumps && gAct.jumps > 0)) return false;
  if (gAct.activityType === 'running') return true;
  return Boolean(gAct.running && (gAct.distance > 0 || gAct.running?.distanceMeters > 0));
}

/**
 * @returns {'interval'|'endurance'|null} null = autre cardio (vélo, elliptique, etc.)
 */
export function getGarminCardioActivityRunKind(gAct) {
  if (!isGarminRunningLikeActivity(gAct)) return null;
  return inferRunningSessionTypeFromGarminActivity(gAct);
}
