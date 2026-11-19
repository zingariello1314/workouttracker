/**
 * Part conventionnelle. Une part ne dépasse pas son ensemble.
 * 966 répétitions sur une longue période et 252 sur les 30 jours inclus
 * donnent 252 / 966, pas 966 / 252.
 */

export function attributeShare({ part, whole } = {}) {
  const a = Number(part);
  const b = Number(whole);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0 || a < 0) {
    return { ok: false, reason: 'missing_population' };
  }
  if (a > b * 1.001) {
    return { ok: false, reason: 'part_exceeds_whole', part: a, whole: b };
  }
  return { ok: true, sharePct: (a / b) * 100, part: a, whole: b };
}

/**
 * Quand la fenêtre affichée contient le mois de référence, la question
 * est « quelle part du long total se trouve dans le mois ».
 * Quand la fenêtre est intérieure au mois, c'est l'inverse.
 */
export function muscleWindowRelation({ periodReps, referenceReps, periodDays } = {}) {
  const period = Number(periodReps);
  const reference = Number(referenceReps);
  const days = Number(periodDays);
  if (!Number.isFinite(period) || !Number.isFinite(reference) || reference < 0 || period < 0) {
    return { ok: false, reason: 'missing_population' };
  }
  const periodContainsReference = Number.isFinite(days) && days > 40 && period + 0.5 >= reference;
  if (periodContainsReference) {
    const share = attributeShare({ part: reference, whole: period });
    return {
      ...share,
      role: 'recent_month_inside_period',
      recentReps: reference,
      periodReps: period
    };
  }
  const share = attributeShare({ part: period, whole: reference });
  return {
    ...share,
    role: 'period_inside_recent_month',
    periodReps: period,
    monthReps: reference
  };
}

export function ledgerConservation(entries = [], identifiedTotal = 0) {
  const sum = (entries || []).reduce((total, row) => total + (Number(row?.reps) || 0), 0);
  const target = Number(identifiedTotal) || 0;
  const tolerance = Math.max(1, Math.abs(target) * 0.02);
  return {
    sum,
    identifiedTotal: target,
    residual: sum - target,
    ok: Math.abs(sum - target) <= tolerance
  };
}
