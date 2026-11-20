/**
 * Contrat commun P6. Une observation valide n'est pas une découverte.
 * Les producteurs hérités passent par cet adaptateur, puis le paquet publié
 * lit le claim. Les couches restent distinctes.
 */

export const CLAIM_LAYER = Object.freeze({
  SOURCE: 'source',
  OBSERVATION: 'observation',
  SIGNAL: 'signal',
  HYPOTHESIS: 'hypothesis',
  PHENOMENON: 'phenomenon',
  CONCLUSION: 'conclusion',
  PROOF: 'proof',
  INTERPRETATION: 'interpretation',
  UNCERTAINTY: 'uncertainty',
  EDITORIAL_DECISION: 'editorial_decision',
  PUBLISHED_CARD: 'published_card'
});

export const CLAIM_TYPE = Object.freeze({
  OBSERVED_FACT: 'observed_fact',
  DESCRIPTIVE_INFERENCE: 'descriptive_inference',
  SPORTING_IMPLICATION: 'sporting_implication',
  CONDITIONAL_PROJECTION: 'conditional_projection'
});

/** Dimensions de progression non interchangeables. */
export const PROGRESSION_DIMENSION = Object.freeze({
  SESSION_COUNT: 'session_count',
  REPS_PER_SESSION: 'reps_per_session',
  REPS_PER_SET: 'reps_per_set',
  SET_COUNT: 'set_count',
  LOAD: 'load',
  TIME_AT_SAME_FORMAT: 'time_at_same_format',
  REPERTOIRE: 'repertoire',
  SESSION_ORGANIZATION: 'session_organization'
});

function subjectOf(discovery) {
  const metrics = discovery?.metrics || {};
  if (metrics.exerciseId) return { type: 'exercise', key: String(metrics.exerciseId) };
  if (metrics.group) return { type: 'muscle', key: String(metrics.group) };
  if (discovery?.kind === 'disc_program_practice') return { type: 'program', key: 'historical_plan' };
  if (metrics.dates) return { type: 'session', key: String(metrics.dates) };
  return { type: 'period', key: discovery?.kind || 'period' };
}

function observedValuesOf(metrics) {
  const values = [];
  const push = (id, value, unit) => {
    if (value == null || value === '') return;
    const n = Number(value);
    values.push({
      id,
      value: Number.isFinite(n) ? n : value,
      unit: unit || metrics.unit || null
    });
  };
  push('value', metrics.value, metrics.unit);
  push('level', metrics.level, metrics.unit || 'reps');
  push('repsNow', metrics.repsNow, 'reps');
  push('repsThen', metrics.repsThen, 'reps');
  push('sessionsNow', metrics.sessionsNow, 'sessions');
  push('sessionsThen', metrics.sessionsThen, 'sessions');
  push('minutes', metrics.minutes ?? metrics.durationMinutes, 'minutes');
  push('loadKg', metrics.loadKg ?? metrics.weightKg, 'kg');
  if (Array.isArray(metrics.observedValues)) {
    metrics.observedValues.forEach((row) => {
      if (row?.id) push(row.id, row.value, row.unit);
    });
  }
  return values;
}

function sourceEventsOf(discovery, metrics) {
  const events = [];
  const dates = metrics.dates || metrics.sourceDates || discovery?.lineage?.sourceDates || null;
  if (Array.isArray(dates)) {
    dates.filter(Boolean).forEach((date) => events.push({ type: 'date', id: String(date) }));
  } else if (typeof dates === 'string' && dates) {
    events.push({ type: 'date', id: dates });
  }
  if (metrics.eventDate) events.push({ type: 'date', id: String(metrics.eventDate) });
  if (metrics.lastDate) events.push({ type: 'date', id: String(metrics.lastDate) });
  if (metrics.sessionId) events.push({ type: 'session', id: String(metrics.sessionId) });
  if (discovery?.evidence && /^\d{4}-\d{2}-\d{2}/.test(String(discovery.evidence))) {
    events.push({ type: 'evidence_date', id: String(discovery.evidence).slice(0, 10) });
  }
  return events;
}

function progressionDimensionOf(metrics, mechanism) {
  if (metrics.progressionDimension && PROGRESSION_DIMENSION[metrics.progressionDimension]) {
    return metrics.progressionDimension;
  }
  if (metrics.dimension && Object.values(PROGRESSION_DIMENSION).includes(metrics.dimension)) {
    return metrics.dimension;
  }
  if (mechanism === 'time_at_same_format' || metrics.formatConstant === true) {
    return PROGRESSION_DIMENSION.TIME_AT_SAME_FORMAT;
  }
  if (metrics.loadKg != null || metrics.weightKg != null) return PROGRESSION_DIMENSION.LOAD;
  if (metrics.repsPerSetNow != null || metrics.repsPerSet != null) return PROGRESSION_DIMENSION.REPS_PER_SET;
  if (metrics.setsNow != null || metrics.setCount != null) return PROGRESSION_DIMENSION.SET_COUNT;
  if (metrics.sessionsNow != null || metrics.sessionCount != null) return PROGRESSION_DIMENSION.SESSION_COUNT;
  if (metrics.repsPerSessionNow != null) return PROGRESSION_DIMENSION.REPS_PER_SESSION;
  if (metrics.repertoireChanged != null) return PROGRESSION_DIMENSION.REPERTOIRE;
  return null;
}

function assertionFrom(discovery, window) {
  const metrics = discovery?.metrics || {};
  const mechanism = metrics.mechanism || metrics.phenomenon || null;
  let operator = 'present';
  let metricId = discovery?.kind || 'observation';
  if (mechanism === 'historical_maintenance') {
    operator = 'stable';
    metricId = 'format_level';
  } else if (
    mechanism === 'resumed_former_level' ||
    mechanism === 'higher_level_consolidation' ||
    mechanism === 'partial_resume'
  ) {
    operator = 'increase';
    metricId = 'format_level';
  } else if (mechanism === 'interrupted_progression' || mechanism === 'stabilized_after_drop') {
    operator = 'decrease';
    metricId = 'format_level';
  } else if (metrics.operator) {
    operator = metrics.operator;
    metricId = metrics.metricId || metricId;
  } else if (Number.isFinite(Number(metrics.repsNow)) && Number.isFinite(Number(metrics.repsThen))) {
    const now = Number(metrics.repsNow);
    const then = Number(metrics.repsThen);
    operator = now > then ? 'increase' : now < then ? 'decrease' : 'stable';
    metricId = 'volume_reps';
  }
  const value = Number.isFinite(Number(metrics.value))
    ? Number(metrics.value)
    : Number.isFinite(Number(metrics.level))
      ? Number(metrics.level)
      : Number.isFinite(Number(metrics.repsNow))
        ? Number(metrics.repsNow)
        : null;
  const referenceValue = Number.isFinite(Number(metrics.referenceValue))
    ? Number(metrics.referenceValue)
    : Number.isFinite(Number(metrics.repsThen))
      ? Number(metrics.repsThen)
      : null;
  const observedValues = observedValuesOf(metrics);
  const dimension = progressionDimensionOf(metrics, mechanism);
  return {
    subjectId: subjectOf(discovery).key,
    metricId,
    windowId: window?.start && window?.end ? `${window.start}:${window.end}` : null,
    comparatorWindowId: metrics.comparatorWindowId || null,
    populationId: metrics.population || 'recorded_activity',
    channel: String(discovery?.kind || '').includes('sleep') ? 'sleep' : 'strength',
    operator,
    value,
    referenceValue,
    unit: metrics.unit || (metricId.includes('time') ? 'minutes' : 'reps'),
    comparisonMethod: metrics.comparisonMethod || 'recorded_comparison',
    observationUnit: 'session',
    referencePolicyId: metrics.referencePolicyId || 'same_population_named',
    evidenceIds: [discovery?.evidence, metrics.evidenceId].filter(Boolean),
    observedValues,
    progressionDimension: dimension,
    direction: operator === 'increase' || operator === 'decrease' ? operator : null,
    definitionVersion: 'p6.v2'
  };
}

export function claimFromDiscovery(discovery, window = null) {
  if (!discovery?.kind) return null;
  const assertion = assertionFrom(discovery, window);
  const metrics = discovery?.metrics || {};
  const statement = String(discovery.title || '').trim();
  const hasThesis = statement.length > 0 && String(discovery.body || discovery.evidence || '').trim().length > 0;
  const sourceEvents = sourceEventsOf(discovery, metrics);
  const limitations = [
    ...(Array.isArray(metrics.limits) ? metrics.limits : []),
    ...(Array.isArray(discovery.limitations) ? discovery.limitations : [])
  ].filter(Boolean);
  const allowed = [];
  if (hasThesis) allowed.push(statement);
  if (assertion.progressionDimension) {
    allowed.push(`dimension:${assertion.progressionDimension}`);
  }
  if (assertion.direction) {
    allowed.push(`direction:${assertion.direction}`);
  }
  // Relation descriptive ≠ causalité
  if (String(discovery.kind || '').includes('sleep') || metrics.associationOnly) {
    limitations.push('association_not_causation');
    allowed.push('association_only');
  }
  return {
    id:
      discovery.id ||
      `${discovery.kind}:${assertion.subjectId}:${assertion.metricId}:${assertion.operator}:${assertion.value ?? 'x'}:${assertion.referenceValue ?? 'y'}:${discovery.evidence || discovery.title || ''}`,
    phenomenonId:
      discovery.phenomenonId ||
      `${discovery.kind}|${assertion.subjectId}|${metrics.eventDate || metrics.lastDate || window?.end || ''}`,
    layer: hasThesis ? CLAIM_LAYER.CONCLUSION : CLAIM_LAYER.OBSERVATION,
    subject: subjectOf(discovery),
    population: {
      id: assertion.populationId,
      label: metrics.populationLabel || null
    },
    scope: {
      start: window?.start || metrics.windowStart || null,
      end: window?.end || metrics.windowEnd || null,
      channel: assertion.channel,
      phenomenonPeriod: metrics.phenomenonPeriod || null,
      referencePeriod: metrics.referencePeriod || metrics.comparatorWindowId || null
    },
    horizon: null,
    metric: assertion.metricId,
    claimType: discovery.metrics?.trajectoryOk
      ? CLAIM_TYPE.DESCRIPTIVE_INFERENCE
      : metrics.causalClaim
        ? CLAIM_TYPE.SPORTING_IMPLICATION
        : CLAIM_TYPE.OBSERVED_FACT,
    assertions: [assertion],
    proof: {
      metricsUsed: assertion.observedValues.map((row) => row.id),
      observedValues: assertion.observedValues,
      units: [...new Set(assertion.observedValues.map((row) => row.unit).filter(Boolean))],
      sourceEvents,
      direction: assertion.direction,
      progressionDimension: assertion.progressionDimension
    },
    statement,
    evidenceIds: assertion.evidenceIds,
    limitations,
    confidence: discovery.weights?.reliability ?? null,
    allowedStatements: allowed,
    status: hasThesis ? 'supported' : 'conditional',
    producer: discovery.lineage?.producer || discovery.metrics?.producer || 'legacy_adapter'
  };
}

/** Une observation sans thèse n'entre pas dans les découvertes autonomes. */
export function isAutonomousConclusion(claim) {
  return Boolean(
    claim &&
      claim.layer === CLAIM_LAYER.CONCLUSION &&
      claim.status === 'supported' &&
      claim.allowedStatements.length > 0
  );
}
