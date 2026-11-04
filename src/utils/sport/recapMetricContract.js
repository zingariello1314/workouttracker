/**
 * Contrat canonique d’une affirmation numérique (Étape B).
 * Ne remplace pas les producteurs : annote et compare leurs métriques.
 */

export const METRIC_REFERENT = Object.freeze({
  PRIMARY_WINDOW: 'primary_window',
  PREVIOUS_EQUAL_WINDOW: 'previous_equal_window',
  ARC_EARLY_LATE: 'arc_early_late',
  FIRST_LAST_SESSION: 'first_last_session',
  HISTORICAL_HABIT: 'historical_habit',
  BEST_PHASE: 'best_phase',
  LAST_RESULT: 'last_result',
  LIFETIME: 'lifetime'
});

export const METRIC_GRANULARITY = Object.freeze({
  TOTAL: 'total',
  PER_SESSION: 'per_session',
  PER_ACTIVE_DAY: 'per_active_day',
  PER_EXERCISE_OCCURRENCE: 'per_exercise_occurrence',
  PER_SET: 'per_set',
  FREQUENCY_PER_WEEK: 'frequency_per_week'
});

export const METRIC_UNIT = Object.freeze({
  REPS: 'reps',
  SESSIONS: 'sessions',
  DAYS: 'days',
  KG: 'kg',
  PERCENT: 'percent',
  SECONDS: 'seconds'
});

/**
 * @param {object} partial
 * @returns {object} métrique annotée
 */
export function buildMetricFact(partial = {}) {
  const value = partial.value;
  const n = Number(value);
  return {
    schemaVersion: 'metric-fact-v1',
    subjectKey: partial.subjectKey || null,
    exerciseId: partial.exerciseId != null ? String(partial.exerciseId) : null,
    variantKey: partial.variantKey || null,
    source: partial.source || null,
    periodId: partial.periodId || null,
    windowStart: partial.windowStart || null,
    windowEnd: partial.windowEnd || null,
    eventIds: Array.isArray(partial.eventIds) ? partial.eventIds : [],
    granularity: partial.granularity || null,
    unit: partial.unit || null,
    denominator: partial.denominator || null,
    aggregation: partial.aggregation || null,
    referent: partial.referent || null,
    sampleSize: partial.sampleSize ?? null,
    coverage: partial.coverage ?? null,
    snapshotVersion: partial.snapshotVersion || null,
    reliability: partial.reliability || 'unknown',
    value: Number.isFinite(n) ? n : value ?? null,
    labelFr: partial.labelFr || null
  };
}

/**
 * Deux métriques sont-elles comparables sans mélange silencieux ?
 */
export function metricsAreComparable(a, b) {
  if (!a || !b) return { ok: false, reason: 'missing_metric' };
  if (a.unit && b.unit && a.unit !== b.unit) return { ok: false, reason: 'unit_mismatch' };
  if (a.granularity && b.granularity && a.granularity !== b.granularity) {
    return { ok: false, reason: 'granularity_mismatch' };
  }
  if (a.denominator && b.denominator && a.denominator !== b.denominator) {
    return { ok: false, reason: 'denominator_mismatch' };
  }
  if (a.referent && b.referent && a.referent !== b.referent) {
    return { ok: false, reason: 'referent_mismatch', needsExplicitDistinction: true };
  }
  if (a.subjectKey && b.subjectKey && a.subjectKey !== b.subjectKey) {
    return { ok: false, reason: 'subject_mismatch' };
  }
  return { ok: true, reason: 'comparable' };
}

/**
 * Annoter une attribution volume avec des metric facts explicites.
 */
export function annotateVolumeAttributionMetrics(attrib) {
  if (!attrib?.metrics) return attrib;
  const m = attrib.metrics;
  const facts = {
    windowSessions: buildMetricFact({
      value: m.windowSessionCount,
      granularity: METRIC_GRANULARITY.TOTAL,
      unit: METRIC_UNIT.SESSIONS,
      referent: METRIC_REFERENT.PRIMARY_WINDOW,
      aggregation: 'count',
      source: 'classifyVolumeAttribution',
      reliability: 'high',
      labelFr: 'nombre de séances (fenêtre)'
    }),
    prevSessions: buildMetricFact({
      value: m.prevSessionCount,
      granularity: METRIC_GRANULARITY.TOTAL,
      unit: METRIC_UNIT.SESSIONS,
      referent: METRIC_REFERENT.PREVIOUS_EQUAL_WINDOW,
      aggregation: 'count',
      source: 'classifyVolumeAttribution',
      reliability: 'high',
      labelFr: 'nombre de séances (période précédente)'
    }),
    windowMeanPerSession: buildMetricFact({
      value: m.meanPerSession,
      granularity: METRIC_GRANULARITY.PER_SESSION,
      unit: METRIC_UNIT.REPS,
      denominator: 'session',
      referent: METRIC_REFERENT.PRIMARY_WINDOW,
      aggregation: 'mean',
      source: 'classifyVolumeAttribution',
      reliability: 'high',
      labelFr: 'reps moyennes par séance (fenêtre)'
    }),
    prevMeanPerSession: buildMetricFact({
      value: m.prevMeanPerSession,
      granularity: METRIC_GRANULARITY.PER_SESSION,
      unit: METRIC_UNIT.REPS,
      denominator: 'session',
      referent: METRIC_REFERENT.PREVIOUS_EQUAL_WINDOW,
      aggregation: 'mean',
      source: 'classifyVolumeAttribution',
      reliability: 'high',
      labelFr: 'reps moyennes par séance (précédente)'
    })
  };
  return {
    ...attrib,
    metrics: {
      ...m,
      metricFacts: facts,
      referent: m.referent || METRIC_REFERENT.PREVIOUS_EQUAL_WINDOW
    }
  };
}

/**
 * Détecte un mélange silencieux arc early/late vs moyennes fenêtre.
 */
export function detectSilentReferentMix({ arcEarlyLate = null, windowMeans = null } = {}) {
  if (!arcEarlyLate || !windowMeans) return { mixed: false };
  const cmp = metricsAreComparable(
    { ...arcEarlyLate, referent: METRIC_REFERENT.ARC_EARLY_LATE },
    { ...windowMeans, referent: METRIC_REFERENT.PRIMARY_WINDOW }
  );
  if (cmp.needsExplicitDistinction || cmp.reason === 'referent_mismatch') {
    return { mixed: true, reason: 'arc_vs_window_per_session', requiresLabel: true };
  }
  return { mixed: false };
}
