/**
 * Couleur et filtrage communs pour toutes les activités physiques (barres calendrier).
 * Exclut marche, pas, sommeil, étirements (détail vue mois uniquement).
 */

/** Orange vif — reconnaissable immédiatement sur fond sombre / teintes d'intensité. */
export const CALENDAR_PHYSICAL_ACTIVITY_COLOR = '#ff5c00';

export const CALENDAR_PHYSICAL_STRIPE_KINDS = new Set(['workout', 'momentumRun', 'activity']);

export function isPhysicalActivityStripeKind(kind) {
  return CALENDAR_PHYSICAL_STRIPE_KINDS.has(kind);
}

/**
 * Vue année : uniquement exercices / course / cardio Garmin (hors marche).
 * @param {Array<{ kind: string }>} stripes
 */
export function filterCalendarStripesForYearView(stripes) {
  if (!Array.isArray(stripes)) return [];
  return stripes.filter((s) => isPhysicalActivityStripeKind(s.kind));
}
