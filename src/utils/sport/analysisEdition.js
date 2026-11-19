/**
 * Édition analytique. Une partie change quand le contrat, le calcul,
 * la sélection ou la rédaction change. Le cache s'en sert tel quel :
 * pas de suffixe ajouté à la main après coup.
 */

export const ANALYSIS_EDITION_PARTS = Object.freeze({
  temporal: 'calendar-paris-v1',
  streak: 'window-range-v1',
  duration: 'named-populations-v1',
  gtg: 'classic-exclusive-v1',
  program: 'frozen-plan-only-v1',
  identity: 'no-numeric-label-v1',
  scope: 'short-window-anchor-v1',
  editorial: 'p3-explanatory-v1',
  consolidation: 'mechanism-window-v1'
});

export function analysisEditionKey(parts = ANALYSIS_EDITION_PARTS) {
  return Object.keys(parts)
    .sort()
    .map((key) => `${key}=${parts[key]}`)
    .join(';');
}

/**
 * Décide si un paquet déjà calculé peut être affiché comme l'édition courante.
 * Ne supprime rien : un refus laisse l'ancienne entrée en place, hors affichage actuel.
 */
export function cacheReuseDecision({
  storedEdition = null,
  currentEdition = null,
  storedPeriod = null,
  requestedPeriod = null,
  storedFingerprint = null,
  requestedFingerprint = null,
  storedAt = null,
  incomingAt = null
} = {}) {
  if (storedPeriod && requestedPeriod && storedPeriod !== requestedPeriod) {
    return { reuse: false, reason: 'period_mismatch' };
  }
  if (storedEdition && currentEdition && storedEdition !== currentEdition) {
    return { reuse: false, reason: 'edition_mismatch' };
  }
  if (storedFingerprint && requestedFingerprint && storedFingerprint !== requestedFingerprint) {
    return { reuse: false, reason: 'data_changed' };
  }
  if (incomingAt != null && storedAt != null && incomingAt < storedAt) {
    return { reuse: false, reason: 'stale_worker_response' };
  }
  if (
    storedEdition &&
    storedEdition === currentEdition &&
    storedPeriod === requestedPeriod &&
    storedFingerprint === requestedFingerprint
  ) {
    return { reuse: true, reason: 'exact_edition' };
  }
  return { reuse: false, reason: 'incomplete_key' };
}

/**
 * Un paquet sans l'édition courante peut rester en cache.
 * Il ne doit pas être peint comme le résultat actuel.
 */
export function mayPresentBundleAsCurrent(bundle, currentEdition = analysisEditionKey()) {
  if (!bundle) return { present: false, reason: 'missing' };
  const stored = bundle.analysisEdition || null;
  if (!stored || stored !== currentEdition) {
    return { present: false, reason: 'edition_mismatch' };
  }
  const publication = bundle.recapAssessment?.insightsPublication || null;
  if (bundle.analysisStatus === 'refreshing') {
    return { present: true, as: 'refreshing' };
  }
  if (bundle.analysisStatus === 'ready' || publication?.status === 'ready') {
    return { present: true, as: 'current' };
  }
  return { present: false, reason: 'not_ready' };
}
