import { getGarminCardioActivityRunKind, inferRunningSessionTypeFromGarminActivity } from './garminRunningLaps';

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
 * Type à afficher : priorité aux tours Garmin (fractionné) puis au type enregistré (tempo, sprint, etc.).
 * @param {object} session
 * @param {'interval'|'endurance'|undefined} inferredFromGarmin - résultat de inferRunningSessionTypeFromGarminActivity si laps disponibles
 * @param {boolean} [lapDerivedInterval] - page détail : structure effort/récup détectée sur les tours
 */
export function resolveRunningSessionDisplayType(session, inferredFromGarmin, lapDerivedInterval = false) {
  if (lapDerivedInterval || inferredFromGarmin === 'interval' || session?.type === 'interval') {
    return 'interval';
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
export function inferDisplayTypeFromGarminActivity(session, garminActivity, lapDerivedInterval = false) {
  if (!garminActivity) {
    return resolveRunningSessionDisplayType(session, undefined, lapDerivedInterval);
  }
  const inferred = inferRunningSessionTypeFromGarminActivity(garminActivity);
  return resolveRunningSessionDisplayType(session, inferred, lapDerivedInterval);
}

/** Libellé principal pour une activité cardio Garmin (course classique / fractionné / autre cardio). */
export function garminCardioPrimaryLabel(activity, t) {
  const kind = getGarminCardioActivityRunKind(activity);
  if (kind == null) {
    return t ? t('endurance.running.displayLabels.otherCardio') : 'Cardio';
  }
  return runningSessionTypeLabel(kind === 'interval' ? 'interval' : 'endurance', t);
}

export function garminCardioKindEmoji(activity) {
  return getGarminCardioActivityRunKind(activity) != null ? '🏃' : '❤️';
}
