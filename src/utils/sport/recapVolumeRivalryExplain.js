/**
 * Explication démontrable span_volume_vs_frequency vs disc_volume_shape.
 * Utilisé par la console / diagnostics — pas un score opaque.
 */

export function classifyVolumeCardRole(candidate) {
  const kind = String(
    candidate?.kind ||
      candidate?.interpretation?.context?.kind ||
      candidate?.context?.kind ||
      ''
  );
  const findings = candidate?.findings || candidate?.metrics?.findings || [];
  const exerciseId =
    candidate?.metrics?.exerciseId ??
    candidate?.interpretation?.context?.exerciseId ??
    candidate?.context?.exerciseId ??
    null;

  if (exerciseId != null && exerciseId !== '') {
    return { role: 'exercise_volume', kind, exerciseId: String(exerciseId), rivalsGlobal: false };
  }
  if (kind === 'span_volume_vs_frequency') {
    return { role: 'global_attribution', kind, rivalsGlobal: true };
  }
  if (kind === 'disc_volume_shape') {
    return { role: 'global_portrait', kind, rivalsGlobal: true };
  }
  if (
    String(kind).startsWith('span_') &&
    (findings || []).some((f) => /^volume_change:from_/.test(String(f || '')))
  ) {
    return { role: 'global_attribution', kind, rivalsGlobal: true };
  }
  if (kind === 'disc_density' || kind === 'disc_gtg_unplanned_now' || String(kind).startsWith('disc_gtg_')) {
    return { role: 'complementary', kind, rivalsGlobal: false };
  }
  return { role: 'other', kind, rivalsGlobal: false };
}

/**
 * @returns {{ winner, loser, reason, complementary, factors }}
 */
export function explainVolumeRivalry(a, b) {
  const ra = classifyVolumeCardRole(a);
  const rb = classifyVolumeCardRole(b);

  if (!ra.rivalsGlobal || !rb.rivalsGlobal) {
    return {
      winner: null,
      loser: null,
      reason: 'not_same_phenomenon',
      complementary: true,
      factors: [
        { id: 'roles', a: ra.role, b: rb.role },
        { id: 'detail', text: 'Volume d’exercice / densité / GTG ≠ portrait ou attribution globale.' }
      ]
    };
  }

  const score = (card, role) => {
    let s = Number(card?.weight || card?.informativeValue || card?.score || 0);
    const factors = [];
    if (role.role === 'global_attribution') {
      s += 40;
      factors.push({ id: 'explanatory_mechanism', delta: 40 });
    }
    if (role.role === 'global_portrait') {
      s -= 25;
      factors.push({ id: 'descriptive_portrait', delta: -25 });
    }
    const findings = card?.findings || [];
    if ((findings || []).some((f) => /^volume_change:from_/.test(String(f || '')))) {
      s += 35;
      factors.push({ id: 'volume_change_finding', delta: 35 });
    }
    return { score: s, factors };
  };

  const sa = score(a, ra);
  const sb = score(b, rb);
  const aWins = sa.score >= sb.score;
  return {
    winner: aWins ? a : b,
    loser: aWins ? b : a,
    winnerKind: aWins ? ra.kind : rb.kind,
    loserKind: aWins ? rb.kind : ra.kind,
    reason: aWins
      ? 'attribution_outranks_portrait'
      : 'portrait_kept_unexpected',
    complementary: false,
    factors: aWins ? sa.factors : sb.factors,
    scores: { a: sa.score, b: sb.score }
  };
}
