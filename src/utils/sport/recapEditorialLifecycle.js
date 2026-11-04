/**
 * Étape D — cycle de vie éditorial (pertinence vs vérité).
 * Pas de TTL uniforme : dépend du phénomène, de l’horizon et des preuves.
 */

export const ANALYSIS_STATUS = Object.freeze({
  SIGNAL: 'signal',
  HYPOTHESIS: 'hypothesis',
  ENRICHING: 'enriching',
  NOT_PUBLISHABLE: 'not_publishable',
  PUBLISHABLE: 'publishable',
  PUBLISHABLE_NOT_SELECTED: 'publishable_not_selected',
  PUBLISHED: 'published',
  UPDATED: 'updated',
  CONSOLIDATED: 'consolidated',
  ARCHIVED: 'archived',
  INVALIDATED: 'invalidated'
});

/**
 * Une perf ponctuelle (ex. 112 reps J1) reste vraie mais perd la priorité
 * sur un horizon court si aucune nouvelle preuve n’arrive.
 */
export function assessPunctualClaimFreshness({
  firstPublishedAt = null,
  lastProofAt = null,
  lastSignificantInterpretationAt = null,
  timesShown = 0,
  voiceKey = 'week',
  hasNewProof = false,
  hasNewInterpretation = false,
  phenomenonClass = 'other',
  now = Date.now()
} = {}) {
  const dayMs = 86400000;
  const first = firstPublishedAt ? Number(firstPublishedAt) : null;
  const lastProof = lastProofAt ? Number(lastProofAt) : first;
  const daysSinceProof =
    lastProof != null ? Math.floor((now - lastProof) / dayMs) : null;
  const daysSinceFirst =
    first != null ? Math.floor((now - first) / dayMs) : null;

  if (hasNewProof || hasNewInterpretation) {
    return {
      stillTrue: true,
      stillInteresting: true,
      priority: 'high',
      reason: hasNewProof ? 'new_proof' : 'new_interpretation',
      statusHint: ANALYSIS_STATUS.UPDATED
    };
  }

  // Horizons longs : une analyse structurelle peut rester pertinente
  if (voiceKey === 'long' || voiceKey === 'year' || voiceKey === 'half') {
    if (
      phenomenonClass === 'decline_then_recovery' ||
      phenomenonClass === 'frequency_attribution' ||
      phenomenonClass === 'volume_rise' ||
      phenomenonClass === 'volume_decline'
    ) {
      return {
        stillTrue: true,
        stillInteresting: true,
        priority: 'medium',
        reason: 'long_horizon_structural',
        statusHint: ANALYSIS_STATUS.CONSOLIDATED
      };
    }
  }

  // Court horizon : ponctuel sans nouvelle séance → décroissance rapide
  if (voiceKey === 'week' || voiceKey === 'today') {
    if (daysSinceProof != null && daysSinceProof >= 1 && timesShown >= 1) {
      const stale =
        daysSinceProof >= 2 || (daysSinceFirst != null && daysSinceFirst >= 2 && timesShown >= 1);
      if (stale) {
        return {
          stillTrue: true,
          stillInteresting: false,
          priority: 'low',
          reason: 'punctual_no_new_proof',
          statusHint: ANALYSIS_STATUS.ARCHIVED,
          demoteNovelty: true
        };
      }
    }
  }

  return {
    stillTrue: true,
    stillInteresting: true,
    priority: 'medium',
    reason: 'default_keep',
    statusHint: ANALYSIS_STATUS.PUBLISHED
  };
}

/**
 * Pénalité de sélection pour une carte déjà communiquée sans nouvelle preuve.
 * À composer avec computeCandidateNovelty (ne le remplace pas).
 */
export function lifecycleSelectionPenalty(freshness) {
  if (!freshness) return 0;
  if (freshness.priority === 'high') return 0;
  if (freshness.demoteNovelty || freshness.reason === 'punctual_no_new_proof') return 32;
  if (freshness.priority === 'low') return 18;
  return 0;
}

/**
 * Réserve : méta minimale pour republier / recalculer sans stocker tout le texte.
 */
export function buildPublishableReserveEntry({
  phenomenonId,
  proofFingerprint,
  conclusionKey,
  status,
  notSelectedReason,
  lastPublishedAt,
  dataVersion,
  voiceKey
} = {}) {
  return {
    schemaVersion: 'reserve-v1',
    phenomenonId: phenomenonId || null,
    proofFingerprint: proofFingerprint || null,
    conclusionKey: conclusionKey || null,
    status: status || ANALYSIS_STATUS.PUBLISHABLE_NOT_SELECTED,
    notSelectedReason: notSelectedReason || null,
    lastPublishedAt: lastPublishedAt || null,
    dataVersion: dataVersion || null,
    voiceKey: voiceKey || null,
    storedAt: Date.now()
  };
}
