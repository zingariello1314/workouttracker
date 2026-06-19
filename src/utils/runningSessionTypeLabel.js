import {
  getGarminCardioActivityRunKind,
  inferRunningSessionTypeFromGarminActivity,
  isGarminRunningLikeActivity
} from './garminRunningLaps';
import { inferRunningSessionKindFromGarminActivity } from './runningSessionClassification';

/**
 * Libellé traduit pour le champ `type` des sessions course (enduranceFormSchema).
 */
export function runningSessionTypeLabel(type, t) {
  if (!type || typeof t !== 'function') return '';
  const key = `endurance.running.sessionTypes.${type}`;
  const label = t(key);
  if (label && label !== key) return label;
  return String(type).charAt(0).toUpperCase() + String(type).slice(1);
}

/**
 * Type à afficher : priorité aux tours Garmin (fractionné / vitesse) puis au type enregistré.
 * @param {object} session
 * @param {'interval'|'speed'|'endurance'|undefined} inferredFromGarmin
 * @param {boolean} [lapDerivedInterval]
 */
export function resolveRunningSessionDisplayType(session, inferredFromGarmin, lapDerivedInterval = false) {
  if (lapDerivedInterval || inferredFromGarmin === 'interval' || session?.type === 'interval') {
    return 'interval';
  }
  if (inferredFromGarmin === 'speed' || session?.type === 'speed') {
    return 'speed';
  }
  if (session?.type && session.type !== 'endurance') {
    return session.type;
  }
  if (inferredFromGarmin === 'endurance') {
    return 'endurance';
  }
  return session?.type || 'endurance';
}

/** Utilitaire pour la page détail quand l’activité Garmin complète est chargée. */
export function inferDisplayTypeFromGarminActivity(session, garminActivity, lapDerivedInterval = false, ctx = {}) {
  if (!garminActivity) {
    return resolveRunningSessionDisplayType(session, undefined, lapDerivedInterval);
  }
  const inferred = isGarminRunningLikeActivity(garminActivity)
    ? inferRunningSessionKindFromGarminActivity(garminActivity, ctx)
    : inferRunningSessionTypeFromGarminActivity(garminActivity);
  return resolveRunningSessionDisplayType(session, inferred, lapDerivedInterval);
}

/** Libellé principal pour une activité cardio Garmin (course / fractionné / vitesse / autre cardio). */
export function garminCardioPrimaryLabel(activity, t, ctx = {}) {
  if (!isGarminRunningLikeActivity(activity)) {
    return t ? t('endurance.running.displayLabels.otherCardio') : 'Cardio';
  }
  const kind = inferRunningSessionKindFromGarminActivity(activity, ctx);
  if (kind === 'interval') return runningSessionTypeLabel('interval', t);
  if (kind === 'speed') return runningSessionTypeLabel('speed', t);
  return runningSessionTypeLabel('endurance', t);
}

export function garminCardioKindEmoji(activity) {
  return getGarminCardioActivityRunKind(activity) != null ? '🏃' : '❤️';
}
