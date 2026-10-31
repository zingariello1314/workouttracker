/**
 * E0 — Classes de contenu pour la sélection éditoriale.
 *
 * Fiabilité ≠ droit de publication principale.
 * Une limite méthodologique reste calculée et traçable, mais n’occupe pas
 * automatiquement un slot d’analyse sportive.
 */

export const CONTENT_CLASS = Object.freeze({
  ANALYTICAL: 'analytical',
  DESCRIPTIVE: 'descriptive',
  METHODOLOGY_LIMIT: 'methodology_limit',
  TECHNICAL_INTERNAL: 'technical_internal'
});

/** Limites de données / preuve — pas des constats athlète. */
export const METHODOLOGY_LIMIT_KINDS = Object.freeze([
  'disc_plan_data_insufficient'
]);

/**
 * Portraits de composition basés sur parts conventionnelles (repShare / 74-26).
 * Utiles en description, pas comme mesure anatomique précise.
 */
export const DESCRIPTIVE_COMPOSITION_KINDS = Object.freeze([
  'disc_muscle_now',
  'disc_push_pull',
  'disc_muscle_share_shift',
  'disc_muscle_reorient',
  'disc_ratio_structure',
  'disc_volume_shape',
  'disc_density'
]);

/**
 * @param {string} kind
 * @returns {'analytical'|'descriptive'|'methodology_limit'|'technical_internal'}
 */
export function contentClassForKind(kind) {
  const k = String(kind || '');
  if (METHODOLOGY_LIMIT_KINDS.includes(k)) return CONTENT_CLASS.METHODOLOGY_LIMIT;
  if (DESCRIPTIVE_COMPOSITION_KINDS.includes(k)) return CONTENT_CLASS.DESCRIPTIVE;
  if (k.startsWith('__debug') || k.startsWith('tech_')) return CONTENT_CLASS.TECHNICAL_INTERNAL;
  return CONTENT_CLASS.ANALYTICAL;
}

/**
 * @param {object} d
 * @returns {'analytical'|'descriptive'|'methodology_limit'|'technical_internal'}
 */
export function resolveContentClass(d) {
  if (d?.contentClass && Object.values(CONTENT_CLASS).includes(d.contentClass)) {
    return d.contentClass;
  }
  return contentClassForKind(d?.kind);
}

export function isMethodologyLimitDiscovery(d) {
  return resolveContentClass(d) === CONTENT_CLASS.METHODOLOGY_LIMIT;
}

export function isAnalyticalDiscovery(d) {
  return resolveContentClass(d) === CONTENT_CLASS.ANALYTICAL;
}

/**
 * Les limites méthodologiques n’entrent pas dans le pack analytique principal.
 * Elles alimentent `reliabilityNotes` (contexte / fiabilité).
 * Retourne toujours false pour la sélection principale.
 *
 * @param {object[]} [_alreadySelected]
 * @param {object} [_candidate]
 * @param {object[]} [_pool]
 */
export function methodologyLimitMayPublish(_alreadySelected, _candidate, _pool) {
  return false;
}

/** Score minimum pour considérer un candidat analytique « viable » dans le pool. */
export function analyticalCandidateIsViable(d) {
  if (!isAnalyticalDiscovery(d)) return false;
  const score = Number(d?.score) || 0;
  const raw = Number(d?.rawScore != null ? d.rawScore : d?.score) || 0;
  const info = Number(d?.informativeValue) || 0;
  return (
    score >= 36 ||
    (Boolean(d?.metrics?.trajectoryOk) && info >= 85) ||
    (raw >= 55 && info >= 90)
  );
}

/**
 * Note de fiabilité dérivée d’un candidat limite (pour attache / debug UI).
 * @param {object} d
 */
export function reliabilityNoteFromMethodologyDiscovery(d) {
  if (!isMethodologyLimitDiscovery(d)) return null;
  const m = d.metrics || {};
  return {
    kind: d.kind,
    contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
    title: d.title || '',
    summary: d.body || '',
    evidence: d.evidence || '',
    metrics: {
      snapshotDayCount: m.snapshotDayCount ?? null,
      reconstructDayCount: m.reconstructDayCount ?? null,
      minRequired: m.minRequired ?? null,
      reason: m.reason || m.findingKind || null
    }
  };
}
