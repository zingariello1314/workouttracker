/**
 * Une question se résout par les preuves présentes, pas par un champ obligatoire.
 * Une donnée absente ferme une voie et ouvre la suivante. Elle n'ampute pas la phrase.
 */

export function resolveEvidence({ proofs = [], contradictions = [], comparability = 1 } = {}) {
  const present = proofs.filter((p) => p && p.present);
  const directed = present.filter((p) => p.direction && p.direction !== 'flat');
  const primary = directed.filter((p) => p.role === 'primary');
  const secondary = directed.filter((p) => p.role === 'secondary');
  const context = directed.filter((p) => p.role === 'context' || p.role === 'fallback');
  const sampleCov = primary.length ? Math.max(...primary.map((p) => clamp01(p.coverage ?? 1))) : 0;

  if (!directed.length) {
    return {
      route: null,
      confidence: 0,
      coverage: sampleCov,
      level: 0,
      directed: [],
      primary,
      secondary,
      context,
      missing: proofs.filter((p) => p && !p.present),
      contradictions,
      comparability: clamp01(comparability)
    };
  }

  const quality = directed.reduce(
    (sum, p) => sum + p.strength * (0.45 + 0.55 * clamp01(p.coverage ?? 1)),
    0
  );
  const maxQ = directed.reduce((sum, p) => sum + p.strength, 0) || 1;
  let confidence = quality / maxQ;
  if (!primary.length) confidence *= 0.72;
  if (primary.length && sampleCov < 0.45) confidence *= 0.82;
  if (contradictions.length) confidence *= 0.94;
  const comparable = clamp01(comparability);
  if (comparable < 1) confidence *= 0.55 + 0.45 * comparable;
  confidence = clamp01(confidence);

  let level = 1;
  if (primary.length && sampleCov >= 0.5) level = 2;
  if (level >= 2 && (secondary.length || context.length)) level = 3;
  if (!primary.length && secondary.length && context.length) level = 2;
  if (!primary.length && secondary.length && !context.length) level = 1;
  if (!primary.length) level = Math.min(level, 2);
  if (sampleCov > 0 && sampleCov < 0.4 && primary.length) level = Math.min(level, 2);
  if (contradictions.length && directed.length >= 2) level = Math.max(level, 3);
  const robustPrimary = primary.some((p) => (p.n || 0) >= 8 && (p.coverage ?? 0) >= 0.6);
  if (robustPrimary && context.length && !contradictions.length && level >= 3) level = 4;

  let route = 'D';
  if (contradictions.length && directed.length) route = 'conflict';
  else if (primary.length && sampleCov >= 0.45) route = 'A';
  else if (primary.length) route = 'A_partial';
  else if (secondary.length && context.length) route = 'B';
  else if (secondary.length) route = 'C';

  return {
    route,
    confidence,
    coverage: primary.length ? sampleCov : 0,
    level,
    directed,
    primary,
    secondary,
    context,
    missing: proofs.filter((p) => p && !p.present),
    contradictions,
    comparability: clamp01(comparability)
  };
}

export function voiceFor(kind, confidence) {
  if (kind === 'declared' && confidence >= 0.62) return 'declared';
  if (kind === 'measured') return 'measured';
  if (confidence < 0.5) return 'limited';
  return 'deduced';
}

function clamp01(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}
