/**
 * Identités distinctes pour phénomène vs assertion contextualisée (Mission 15).
 * Un même phénomène peut avoir des assertions différentes selon la fenêtre / l’horizon.
 */

import {
  resolvePrimaryWindowSessionPopulation,
  validateSumMeanSampleConsistency
} from '../recapMetricContract';

function ymd(v) {
  return v == null ? null : String(v).slice(0, 10);
}

function numFromMetricsOrProof(metrics, claimVals, ids) {
  for (const id of ids) {
    const fromM = metrics?.[id];
    if (fromM != null && typeof fromM === 'object' && fromM.value != null) {
      const n = Number(fromM.value);
      if (Number.isFinite(n)) return n;
    }
    const nM = Number(fromM);
    if (Number.isFinite(nM) && fromM != null && fromM !== '') return nM;
    const fromClaim = (claimVals || []).find((v) => v?.id === id || v?.id === `metric:${id}`);
    const nC = Number(fromClaim?.value);
    if (Number.isFinite(nC)) return nC;
  }
  return null;
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

  // Mission 27 — distinguer observation vs présentation.
  // Divergence présentation (horizon) ↔ observation (dernière preuve) n’est pas une erreur
  // si les fenêtres d’observation coïncident.
  const cardObs =
    ymd(metrics.observationWindow?.end) ||
    ymd(metrics.windowEnd) ||
    ymd(card.window?.end);
  const claimObs =
    ymd(claim.scope?.observationWindow?.end) || ymd(claim.scope?.end);
  const cardPres = ymd(metrics.presentationWindow?.end) || ymd(metrics.windowEnd);
  const claimPres = ymd(claim.scope?.presentationWindow?.end) || ymd(claim.scope?.comparisonWindow?.end);

  if (cardObs && claimObs && cardObs !== claimObs) {
    // Si claim = observation et card windowEnd = présentation, tolérer
    if (cardPres && claimObs === cardObs && cardPres !== claimObs) {
      // ok
    } else if (cardPres && claimObs && cardPres === ymd(metrics.windowEnd) && claimObs !== cardPres) {
      // claim observation vs card présentation : pas un conflit de valeurs d’assertion
    } else {
      conflicts.push({ metric: 'observationWindowEnd', card: cardObs, claim: claimObs });
    }
  } else if (!metrics.observationWindow && cardPres && claimObs && cardPres !== claimObs) {
    // Legacy : éviter de compter présentation≠observation comme divergence dure
    // seulement si la claim end égale une date d’observation documentée
    const dates = Array.isArray(metrics.dates) ? metrics.dates.map(ymd).filter(Boolean).sort() : [];
    const lastObs = dates.length ? dates[dates.length - 1] : null;
    if (!(lastObs && claimObs === lastObs)) {
      conflicts.push({
        metric: 'windowEnd',
        card: cardPres,
        claim: claimObs,
        note: 'unresolved_presentation_vs_observation'
      });
    }
  }
  void claimPres;

  // Mission 30/31 — vérité algébrique seulement si l’effectif est lié à la même
  // population que total/moyenne. Un fallback dates(arc) n’est pas un effectif.
  const population = resolvePrimaryWindowSessionPopulation(metrics);
  const total = numFromMetricsOrProof(metrics, claimVals, [
    'windowTotalReps',
    'recentReps',
    'currentReps',
    'totalReps'
  ]);
  // meanReps peut être une moyenne de totaux (composition) — ne l’utiliser pour
  // le triple que si windowMeanPerSession / meanPerSession est absent ET que
  // la population est explicitement liée.
  const meanPrimary = numFromMetricsOrProof(metrics, claimVals, [
    'windowMeanPerSession',
    'meanPerSession'
  ]);
  const meanFallback = numFromMetricsOrProof(metrics, claimVals, ['meanReps']);
  const mean = meanPrimary != null ? meanPrimary : meanFallback;
  const sampleFromProof = numFromMetricsOrProof(metrics, claimVals, [
    'sessionCount',
    'windowSessionCount'
  ]);
  const sampleSize = population.sessionCount ?? sampleFromProof;
  // Effectif lié = population résolue comparable, OU compteur explicite metrics/proof.
  // dates.fallback seul ≠ effectif (Mission 31 — 75 faux échecs v29).
  const comparable =
    (population.comparableForSumMean === true && sampleSize != null) ||
    (sampleFromProof != null && Number(sampleFromProof) > 0);
  const triple = validateSumMeanSampleConsistency({
    total,
    mean,
    sampleSize: comparable ? sampleSize : null,
    comparable
  });
  const notes = [];
  if (triple.applicable && !triple.ok) {
    conflicts.push({
      metric: 'sum_mean_sample_consistency',
      card: {
        total,
        mean,
        sampleSize,
        populationSource: population.source,
        comparable
      },
      claim: { expectedProduct: triple.expectedProduct, absGap: triple.absGap },
      note: 'same_population_required'
    });
  } else if (triple.nonComparable && total != null && mean != null) {
    // Mission 31 — non-comparabilité explicite : ni faux FAIL ni faux PASS.
    notes.push({
      metric: 'sum_mean_sample_noncomparable',
      severity: 'info',
      card: {
        total,
        mean,
        arcDateCount: population.arcDateCount ?? null,
        populationSource: population.source
      },
      note: 'populations_not_bound_skip_triple'
    });
  }

  // Contradiction prose « sur N séances » vs effectif fenêtre (même population que le total).
  // Déduplique les N cités (title/body/statement répètent souvent la même phrase).
  const body = `${card.title || ''} ${card.body || ''} ${claim?.statement || ''}`;
  const sessionMentions = [
    ...new Set([...body.matchAll(/sur\s+(\d+)\s+séances?/gi)].map((m) => Number(m[1])))
  ];
  if (
    population.distinctFromArc &&
    Number.isFinite(Number(population.sessionCount)) &&
    sessionMentions.length === 1 &&
    sessionMentions[0] !== Number(population.sessionCount)
  ) {
    conflicts.push({
      metric: 'session_count_prose_vs_population',
      card: population.sessionCount,
      claim: sessionMentions[0],
      note: population.source
    });
  }

  return {
    ok: conflicts.length === 0,
    issue: conflicts.length ? 'card_claim_value_divergence' : null,
    conflicts,
    notes
  };
}
