/**
 * Traçabilité causale coach — « pourquoi cette séance / ce programme ».
 */

/**
 * @param {object} loadState — computeGlobalLoadState
 * @param {Array<object>} [extraTrace]
 * @returns {string[]} bullets utilisateur (max 3)
 */
export function buildUserWhyBullets(loadState, extraTrace = []) {
  const trace = [
    ...(loadState?.trace || []),
    ...(extraTrace || [])
  ].filter((t) => t.layer === 'signal' || t.layer === 'live' || t.layer === 'cycle');

  const sorted = trace
    .filter((t) => t.reason && Math.abs(t.value ?? t.delta ?? 0) >= 0.02)
    .sort((a, b) => Math.abs(b.value ?? b.delta ?? 0) - Math.abs(a.value ?? a.delta ?? 0));

  const bullets = [];
  const seen = new Set();
  sorted.forEach((t) => {
    if (bullets.length >= 3 || seen.has(t.reason)) return;
    seen.add(t.reason);
    bullets.push(t.reason);
  });

  if (!bullets.length && loadState?.summaryFr) bullets.push(loadState.summaryFr);
  return bullets;
}

/**
 * Résumé debug / meta (ordre hiérarchique).
 */
export function formatDecisionTraceForMeta(loadState, liveAdjustment = null) {
  const lines = [];
  if (loadState?.globalLoadFactor != null) {
    lines.push(`globalLoadFactor=${loadState.globalLoadFactor}`);
  }
  if (loadState?.effectiveVolumeFactor != null) {
    lines.push(`effectiveVolumeFactor=${loadState.effectiveVolumeFactor}`);
  }
  if (liveAdjustment?.liveSessionMul != null) {
    lines.push(`liveSessionMul=${liveAdjustment.liveSessionMul}`);
  }
  return {
    scalar: loadState?.globalLoadFactor,
    effective: liveAdjustment?.effectiveSessionFactor ?? loadState?.effectiveVolumeFactor,
    hierarchy: lines,
    trace: [...(loadState?.trace || []), ...(liveAdjustment?.trace || [])].slice(0, 16)
  };
}

/**
 * Fusionne why template archétype + bullets causaux sans doublons.
 */
export function mergeWhyTemplate(archetypeWhyLines = [], loadState, extraTrace = []) {
  const causal = buildUserWhyBullets(loadState, extraTrace);
  const out = [];
  archetypeWhyLines.slice(0, 2).forEach((l) => {
    if (l && !out.includes(l)) out.push(l);
  });
  causal.forEach((l) => {
    if (l && !out.includes(l)) out.push(l);
  });
  return out.slice(0, 5);
}
