/**
 * Identités distinctes pour phénomène vs assertion contextualisée (Mission 15).
 * Un même phénomène peut avoir des assertions différentes selon la fenêtre / l’horizon.
 */

function ymd(v) {
  return v == null ? null : String(v).slice(0, 10);
}

/**
 * Identité du phénomène (sujet + mécanisme) — partageable entre horizons.
 */
export function phenomenonClaimId(claim, card = null) {
  if (claim?.phenomenonId) return String(claim.phenomenonId);
  if (claim?.id && !/\|period:|\\|win:/.test(String(claim.id))) return String(claim.id);
  const subject =
    claim?.subject?.key ||
    card?.metrics?.exerciseId ||
    card?.phenomenonId ||
    card?.kind ||
    'unknown';
  const kind = card?.kind || claim?.producer || 'claim';
  return `phen:${subject}|${kind}`;
}

/**
 * Identité de l’assertion contextualisée (phénomène + fenêtre + population + période d’assemblage).
 */
export function assertionClaimKey(claim, card = null, period = null) {
  const phen = phenomenonClaimId(claim, card);
  const scope = claim?.scope || {};
  const winStart =
    ymd(scope.start) ||
    ymd(card?.metrics?.windowStart) ||
    ymd(card?.window?.start) ||
    '';
  const winEnd =
    ymd(scope.end) ||
    ymd(card?.metrics?.windowEnd) ||
    ymd(card?.window?.end) ||
    '';
  const rawPop = claim?.population || card?.metrics?.populationLabel || card?.population || '';
  const population =
    rawPop == null || rawPop === ''
      ? ''
      : typeof rawPop === 'string'
        ? rawPop
        : rawPop.label || rawPop.id || rawPop.key || rawPop.name || 'population';
  const periodKey = period || 'unscoped';
  return `${periodKey}|${phen}|win:${winStart}:${winEnd}|pop:${population}`;
}

/**
 * Compare deux jeux de valeurs observées pour la même assertion.
 */
export function observedValuesCompatible(a, b, { epsilon = 0.51 } = {}) {
  const listA = Array.isArray(a) ? a : [];
  const listB = Array.isArray(b) ? b : [];
  if (!listA.length || !listB.length) return { ok: true, reason: 'missing_one_side' };
  const byId = new Map();
  listA.forEach((row) => {
    if (row?.id != null) byId.set(String(row.id), row);
  });
  const conflicts = [];
  listB.forEach((row) => {
    if (row?.id == null) return;
    const other = byId.get(String(row.id));
    if (!other) return;
    const va = Number(other.value);
    const vb = Number(row.value);
    if (Number.isFinite(va) && Number.isFinite(vb) && Math.abs(va - vb) > epsilon) {
      conflicts.push({ id: row.id, a: va, b: vb });
    }
  });
  return {
    ok: conflicts.length === 0,
    reason: conflicts.length ? 'value_mismatch' : 'compatible',
    conflicts
  };
}

/**
 * Valide cohérence carte ↔ claim référencé (même fenêtre / mêmes valeurs d’assertion).
 */
export function validateCardClaimConsistency(card, claim) {
  if (!card || !claim) return { ok: false, issue: 'missing' };
  const cardVals = card.observedValues || card.metrics?.observedValues || null;
  const claimVals = claim.proof?.observedValues || null;
  const metrics = card.metrics || {};
  const conflicts = [];

  const checkMetric = (key) => {
    if (metrics[key] == null) return;
    const fromClaim =
      (claimVals || []).find((v) => v.id === key || v.id === `metric:${key}`)?.value ??
      claim.assertions?.find((a) => a?.id === key || a?.metric === key)?.value;
    if (fromClaim == null) return;
    const a = Number(metrics[key]);
    const b = Number(fromClaim);
    if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) > 0.51) {
      conflicts.push({ metric: key, card: a, claim: b });
    }
  };
  ['windowMeanPerSession', 'arcEarlyMean', 'arcLateMean', 'totalReps', 'sharePct'].forEach(checkMetric);

  const ov = observedValuesCompatible(cardVals, claimVals);
  if (!ov.ok) {
    ov.conflicts.forEach((c) => conflicts.push({ metric: c.id, card: c.a, claim: c.b }));
  }

  const cardWin = ymd(metrics.windowEnd) || ymd(card.window?.end);
  const claimWin = ymd(claim.scope?.end);
  if (cardWin && claimWin && cardWin !== claimWin) {
    conflicts.push({ metric: 'windowEnd', card: cardWin, claim: claimWin });
  }

  return {
    ok: conflicts.length === 0,
    issue: conflicts.length ? 'card_claim_value_divergence' : null,
    conflicts
  };
}
