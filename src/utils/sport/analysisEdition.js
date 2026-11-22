/**
 * Édition analytique. Une partie change quand le contrat, le calcul,
 * la sélection ou la rédaction change. Le cache s'en sert tel quel :
 * pas de suffixe ajouté à la main après coup.
 */

export const ANALYSIS_EDITION_PARTS = Object.freeze({
  temporal: 'calendar-paris-v1',
  streak: 'window-range-v1',
  duration: 'paired-density-v3',
  gtg: 'classic-exclusive-v1',
  program: 'structural-context-v4',
  identity: 'discovery-occurrence-v1',
  scope: 'short-window-anchor-v1',
  editorial: 'p6-sovereign-v19',
  consolidation: 'narrative-coherence-v3',
  stimulus: 'challenge-unknown-v1',
  review: 'collective-pass4-v13',
  claim: 'assertion-window-v2',
  sleep: 'association-prose-v4',
  audit: 'normalized-export-v5',
  composition: 'phenomenon-compose-v7',
  coherence: 'inter-horizon-v4',
  classification: 'modality-authority-v1',
  matching: 'session-slot-v3',
  hierarchy: 'verified-deepening-v1',
  programReasoning: 'variant-mix-direction-v3',
  collectiveReturn: 'session-episode-ledger-v5',
  narrativeAuthority: 'thesis-composition-v2',
  populations: 'canonical-populations-v1',
  fingerprint: 'exercise-weights-v3'
});

export function analysisEditionKey(parts = ANALYSIS_EDITION_PARTS) {
  return Object.keys(parts)
    .sort()
    .map((key) => `${key}=${parts[key]}`)
    .join(';');
}

/**
 * Libellé de mission dérivé de l’édition (évite les hardcodes Mission N).
 * Convention : editorial p6-sovereign-vN → Mission (N+1) depuis v12↔M13.
 */
export function analysisMissionLabel(parts = ANALYSIS_EDITION_PARTS) {
  const ed = String(parts.editorial || '');
  const m = ed.match(/p6-sovereign-v(\d+)/i);
  if (!m) return 'Mission P6';
  const n = Number(m[1]);
  return Number.isFinite(n) ? `Mission ${n + 1}` : 'Mission P6';
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
