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

/**
 * Mission 30 — population de séances liée aux totaux de fenêtre primaire.
 * Ne confond jamais l’arc historique (dates / sessions hors fenêtre) avec
 * l’effectif qui porte windowTotal / meanPerSession.
 *
 * @returns {{
 *   dates: string[],
 *   sessionCount: number|null,
 *   source: string,
 *   referent: string,
 *   distinctFromArc: boolean
 * }}
 */
export function resolvePrimaryWindowSessionPopulation(metrics = {}) {
  const m = metrics || {};
  const ymd = (x) => String(x || '').slice(0, 10);
  const uniqSort = (arr) =>
    [...new Set((arr || []).map(ymd).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();

  const windowDatesFromScope = uniqSort(m.temporalScope?.windowDates || m.windowDates || []);
  const sessions = Array.isArray(m.sessions) ? m.sessions : [];
  const inWindowSessions = sessions.filter((s) => s?.inSelectedWindow === true);
  const hasWindowFlags = sessions.some((s) => s?.inSelectedWindow === true || s?.inSelectedWindow === false);
  const windowSessionDates = hasWindowFlags
    ? uniqSort(inWindowSessions.map((s) => s?.date))
    : [];

  const factSample =
    m.metricFacts?.windowTotalReps?.sampleSize ??
    m.metricFacts?.windowMeanPerSession?.sampleSize ??
    null;
  const explicitCount = Number(m.sessionCount);
  const hasExplicit =
    Number.isFinite(explicitCount) && explicitCount > 0 ? Math.round(explicitCount) : null;
  const hasFactSample =
    Number.isFinite(Number(factSample)) && Number(factSample) > 0
      ? Math.round(Number(factSample))
      : null;

  // Mission 31 — sessionCount porté par observedValues / proof avant tout fallback dates.
  const ovSession = [...(Array.isArray(m.observedValues) ? m.observedValues : [])].find(
    (v) =>
      v?.id === 'sessionCount' ||
      v?.id === 'windowSessionCount' ||
      v?.id === 'metric:sessionCount' ||
      v?.id === 'metric:windowSessionCount'
  );
  const ovCount = Number(ovSession?.value);
  const hasOvCount = Number.isFinite(ovCount) && ovCount > 0 ? Math.round(ovCount) : null;

  if (windowSessionDates.length > 0) {
    return {
      dates: windowSessionDates,
      sessionCount: windowSessionDates.length,
      source: 'sessions.inSelectedWindow',
      referent: METRIC_REFERENT.PRIMARY_WINDOW,
      distinctFromArc: true,
      comparableForSumMean: true
    };
  }
  if (windowDatesFromScope.length > 0) {
    return {
      dates: windowDatesFromScope,
      sessionCount: windowDatesFromScope.length,
      source: 'temporalScope.windowDates',
      referent: METRIC_REFERENT.PRIMARY_WINDOW,
      distinctFromArc: true,
      comparableForSumMean: true
    };
  }
  if (hasExplicit != null) {
    return {
      dates: uniqSort(m.windowSessionDates || []),
      sessionCount: hasExplicit,
      source: 'metrics.sessionCount',
      referent: METRIC_REFERENT.PRIMARY_WINDOW,
      distinctFromArc: true,
      comparableForSumMean: true
    };
  }
  if (hasFactSample != null) {
    return {
      dates: uniqSort(m.windowSessionDates || []),
      sessionCount: hasFactSample,
      source: 'metricFacts.sampleSize',
      referent: METRIC_REFERENT.PRIMARY_WINDOW,
      distinctFromArc: true,
      comparableForSumMean: true
    };
  }
  if (hasOvCount != null) {
    return {
      dates: uniqSort(m.windowSessionDates || []),
      sessionCount: hasOvCount,
      source: 'observedValues.sessionCount',
      referent: METRIC_REFERENT.PRIMARY_WINDOW,
      distinctFromArc: true,
      comparableForSumMean: true
    };
  }

  // Dernier recours : dates plates = souvent un arc tronqué.
  // Ne PAS promouvoir dates.length en effectif comparable (faux échecs M30/v29).
  const flatDates = uniqSort([
    ...(Array.isArray(m.dates) ? m.dates : []),
    ...(Array.isArray(m.sessionDates) ? m.sessionDates : []),
    m.date
  ]);
  return {
    dates: flatDates,
    sessionCount: null,
    arcDateCount: flatDates.length > 0 ? flatDates.length : null,
    source: flatDates.length ? 'dates.fallback_possibly_arc' : 'absent',
    referent: METRIC_REFERENT.PRIMARY_WINDOW,
    distinctFromArc: false,
    comparableForSumMean: false
  };
}

/**
 * Identité algébrique sur un même ensemble : total ≈ mean × sampleSize.
 * Ne s’applique que lorsque les trois mesures déclarent le même référent / population.
 *
 * @param {object} opts
 * @param {boolean} [opts.comparable=true] — si false (effectif non lié), non-comparabilité
 *   explicite : pas de faux PASS ni de faux FAIL.
 */
export function validateSumMeanSampleConsistency({
  total = null,
  mean = null,
  sampleSize = null,
  tolerance = 0.51,
  comparable = true
} = {}) {
  if (comparable === false) {
    return {
      ok: true,
      applicable: false,
      reason: 'populations_not_bound',
      nonComparable: true,
      total: Number.isFinite(Number(total)) ? Number(total) : null,
      mean: Number.isFinite(Number(mean)) ? Number(mean) : null,
      sampleSize: Number.isFinite(Number(sampleSize)) ? Number(sampleSize) : null
    };
  }
  const t = Number(total);
  const mu = Number(mean);
  const n = Number(sampleSize);
  if (![t, mu, n].every((x) => Number.isFinite(x) && x > 0)) {
    return { ok: true, applicable: false, reason: 'insufficient_triple' };
  }
  const expected = mu * n;
  const absGap = Math.abs(t - expected);
  const ok = absGap <= Math.max(tolerance, Math.abs(mu) * 0.02 * n);
  return {
    ok,
    applicable: true,
    reason: ok ? 'consistent' : 'sum_mean_sample_mismatch',
    total: t,
    mean: mu,
    sampleSize: n,
    expectedProduct: expected,
    absGap
  };
}
