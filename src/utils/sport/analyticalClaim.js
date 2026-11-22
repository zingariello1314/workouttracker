/**
 * Contrat commun P6. Une observation valide n'est pas une découverte.
 * Les producteurs hérités passent par cet adaptateur, puis le paquet publié
 * lit le claim. Les couches restent distinctes.
 */

import { occurrenceId, phenomenonIdOf, stampDiscoveryIdentity } from './discoveryIdentity';

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
  if (/pushPull|push_pull/i.test(String(discovery?.kind || ''))) {
    return { type: 'period', key: 'push_pull' };
  }
  if (/near_equal|session_compare|th_concentration|volume_shape/i.test(String(discovery?.kind || ''))) {
    return { type: 'period', key: 'activity_window' };
  }
  if (Array.isArray(metrics.dates) && metrics.dates.length) {
    return { type: 'session', key: String(metrics.dates.slice(0, 3).join(',')) };
  }
  if (metrics.dates) return { type: 'session', key: String(metrics.dates) };
  return { type: 'period', key: 'period_activity' };
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
  push('gapDays', metrics.gapDays ?? metrics.gap, 'days');
  push('returnReps', metrics.returnReps, 'reps');
  push('priorAvg', metrics.priorAvg, 'reps');
  push('vsPriorPct', metrics.vsPriorPct, 'percent');
  push('pushReps', metrics.pushReps ?? metrics.push, 'reps');
  push('pullReps', metrics.pullReps ?? metrics.pull, 'reps');
  push('totalReps', metrics.totalReps ?? metrics.reps, 'reps');
  push('sharePct', metrics.sharePct, 'percent');
  push('repsPerSessionNow', metrics.repsPerSessionNow, 'reps');
  push('repsPerSessionThen', metrics.repsPerSessionThen, 'reps');
  push('activeDaysNow', metrics.activeDaysNow ?? metrics.trainingDays, 'days');
  push('activeDaysThen', metrics.activeDaysThen, 'days');
  push('sleepHours', metrics.sleepHours ?? metrics.hours, 'hours');
  push('pairedNights', metrics.pairedNights ?? metrics.nights, 'nights');
  push('durationMinutes', metrics.durationMinutes ?? metrics.timerMinutes, 'minutes');
  push('peakReps', metrics.peakReps, 'reps');
  push('troughReps', metrics.troughReps, 'reps');
  push('recentReps', metrics.recentReps, 'reps');
  push('peakDays', metrics.peakDays, 'days');
  push('troughDays', metrics.troughDays, 'days');
  push('recentDays', metrics.recentDays, 'days');
  push('freqShareOfDrop', metrics.freqShareOfDrop, 'ratio');
  push('plannedReps', metrics.plannedReps ?? metrics.leftPlannedReps, 'reps');
  push('sharedMoves', metrics.sharedCount ?? metrics.sharedMoves?.length, 'count');
  push('supportCount', metrics.supportCount, 'sessions');
  push('beforeMed', metrics.beforeMed ?? metrics.beforeMedian, 'reps');
  push('blockAReps', metrics.blockAReps, 'reps');
  push('blockBReps', metrics.blockBReps, 'reps');
  push('windowReps', metrics.windowReps, 'reps');
  push('ratio', metrics.ratio, 'ratio');
  push('threshold', metrics.threshold, metrics.thresholdUnit || 'hours');
  push('highN', metrics.highN, 'sessions');
  push('lowN', metrics.lowN, 'sessions');
  push('highVol', metrics.highVol, 'reps');
  push('lowVol', metrics.lowVol, 'reps');
  push('delta', metrics.delta, metrics.deltaUnit || 'reps');
  push('deltaPct', metrics.deltaPct, 'percent');
  push('highMin', metrics.highMin, 'minutes');
  push('lowMin', metrics.lowMin, 'minutes');
  push('highDens', metrics.highDens, 'reps_per_hour');
  push('lowDens', metrics.lowDens, 'reps_per_hour');
  push('highOk', metrics.highOk, 'sessions');
  push('lowShort', metrics.lowShort, 'sessions');
  push('okVol', metrics.okVol, 'reps');
  push('restVol', metrics.restVol, 'reps');
  push('okN', metrics.okN, 'sessions');
  push('restN', metrics.restN, 'sessions');
  push('pushRetain', metrics.pushRetain, 'percent');
  push('pullRetain', metrics.pullRetain, 'percent');
  push('shortN', metrics.shortN, 'sessions');
  push('longN', metrics.longN, 'sessions');
  push('highLead', metrics.highLead, 'reps');
  push('lowLead', metrics.lowLead, 'reps');
  push('sample', metrics.sample, 'label');
  push('volShare', metrics.volShare, 'percent');
  push('nightShare', metrics.nightShare, 'percent');
  push('highReps', metrics.highReps, 'reps');
  push('totalRepsSleep', metrics.totalReps, 'reps');
  if (metrics.metricFacts && typeof metrics.metricFacts === 'object') {
    Object.entries(metrics.metricFacts).forEach(([key, fact]) => {
      if (fact && fact.value != null) push(key, fact.value, fact.unit || null);
    });
  }
  if (Array.isArray(metrics.observedValues)) {
    metrics.observedValues.forEach((row) => {
      if (row?.id) push(row.id, row.value, row.unit);
    });
  }
  if (Array.isArray(metrics.exercises)) {
    metrics.exercises.forEach((ex, index) => {
      if (typeof ex === 'string') return;
      const name = ex?.name || ex?.id || index;
      if (ex?.reps != null) push(`exerciseReps:${name}`, ex.reps, 'reps');
      if (ex?.monthReps != null) push(`monthReps:${name}`, ex.monthReps, 'reps');
      if (ex?.ofMonthPct != null) push(`sharePct:${name}`, ex.ofMonthPct, 'percent');
    });
  }
  // Séances proches : volumes par date depuis metrics.days / exploration
  const days = Array.isArray(metrics.days)
    ? metrics.days
    : Array.isArray(metrics.exploration?.nearDays)
      ? metrics.exploration.nearDays
      : null;
  if (Array.isArray(days)) {
    days.forEach((day) => {
      if (!day?.date) return;
      push(`volume:${day.date}`, day.reps ?? day.volume, 'reps');
      if (day.challengeReps != null) push(`challenge:${day.date}`, day.challengeReps, 'reps');
      if (day.programReps != null) push(`program:${day.date}`, day.programReps, 'reps');
      if (day.exerciseCount != null) push(`exercises:${day.date}`, day.exerciseCount, 'count');
    });
  }
  if (Array.isArray(metrics.sessions)) {
    metrics.sessions.forEach((session, index) => {
      if (session?.reps != null) push(`sessionReps:${session.date || index}`, session.reps, 'reps');
    });
  }
  return values;
}

function sourceEventsOf(discovery, metrics) {
  const events = [];
  const pushDate = (date, type = 'date') => {
    if (!date) return;
    const id = String(date).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(id)) return;
    if (events.some((e) => e.id === id && e.type === type)) return;
    events.push({ type, id });
  };
  const dates = metrics.dates || metrics.sourceDates || discovery?.lineage?.sourceDates || null;
  if (Array.isArray(dates)) {
    dates.filter(Boolean).forEach((date) => pushDate(date, 'date'));
  } else if (typeof dates === 'string' && dates) {
    pushDate(dates, 'date');
  }
  // Mission 20 — preuves de confirmation et retours doivent voyager dans le claim.
  if (Array.isArray(metrics.returnDates)) {
    metrics.returnDates.forEach((date) => pushDate(date, 'return_date'));
  }
  if (Array.isArray(metrics.confirmationDates)) {
    metrics.confirmationDates.forEach((date) => pushDate(date, 'confirmation_date'));
  }
  if (Array.isArray(metrics.days)) {
    metrics.days.forEach((day) => {
      if (day?.date) pushDate(day.date, 'session_day');
    });
  }
  if (metrics.eventDate) pushDate(metrics.eventDate, 'date');
  if (metrics.date) pushDate(metrics.date, 'date');
  if (metrics.prevDate) pushDate(metrics.prevDate, 'prev_date');
  if (metrics.lastDate) pushDate(metrics.lastDate, 'date');
  if (metrics.sessionId) events.push({ type: 'session', id: String(metrics.sessionId) });
  if (discovery?.evidence && /^\d{4}-\d{2}-\d{2}/.test(String(discovery.evidence))) {
    pushDate(String(discovery.evidence).slice(0, 10), 'evidence_date');
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
  const kind = String(discovery?.kind || '');
  let operator = 'present';
  let metricId = metrics.metricId || null;
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
  } else if (/near_equal|session_compare/i.test(kind)) {
    operator = 'compare';
    metricId = 'session_volume_composition';
  } else if (/pushPull|push_pull/i.test(kind)) {
    operator = 'ratio';
    metricId = 'push_pull_reps';
  } else if (/disc_ms_return|disc_emergence/i.test(kind)) {
    operator = Number.isFinite(Number(metrics.gapDays)) ? 'resume_after_gap' : 'present';
    metricId = 'exercise_return';
  } else if (/sleep/i.test(kind)) {
    operator = 'associate';
    metricId = metrics.metricId || 'sleep_association';
  }
  if (!metricId) metricId = kind || 'observation';
  const value = Number.isFinite(Number(metrics.value))
    ? Number(metrics.value)
    : Number.isFinite(Number(metrics.level))
      ? Number(metrics.level)
      : Number.isFinite(Number(metrics.repsNow))
        ? Number(metrics.repsNow)
        : Number.isFinite(Number(metrics.pushReps))
          ? Number(metrics.pushReps)
          : Number.isFinite(Number(metrics.returnReps))
            ? Number(metrics.returnReps)
            : null;
  const referenceValue = Number.isFinite(Number(metrics.referenceValue))
    ? Number(metrics.referenceValue)
    : Number.isFinite(Number(metrics.repsThen))
      ? Number(metrics.repsThen)
      : Number.isFinite(Number(metrics.pullReps))
        ? Number(metrics.pullReps)
        : Number.isFinite(Number(metrics.priorAvg))
          ? Number(metrics.priorAvg)
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
    definitionVersion: 'p6.v3'
  };
}

export function claimFromDiscovery(discovery, window = null) {
  if (!discovery?.kind) return null;
  const stamped = stampDiscoveryIdentity(discovery);
  const assertion = assertionFrom(stamped, window);
  const metrics = stamped?.metrics || {};
  const statement = String(stamped.title || '').trim();
  const hasThesis = statement.length > 0 && String(stamped.body || stamped.evidence || '').trim().length > 0;
  const sourceEvents = sourceEventsOf(stamped, metrics);
  const limitations = [
    ...(Array.isArray(metrics.limits) ? metrics.limits : []),
    ...(Array.isArray(stamped.limitations) ? stamped.limitations : [])
  ].filter(Boolean);
  // Limite documentaire / non numérique : légitime sans chiffres
  if (metrics.documentaryOnly || metrics.nonNumericProof) {
    limitations.push('non_numeric_documentary_proof');
  }
  const allowed = [];
  if (hasThesis) allowed.push(statement);
  if (assertion.progressionDimension) {
    allowed.push(`dimension:${assertion.progressionDimension}`);
  }
  if (assertion.direction) {
    allowed.push(`direction:${assertion.direction}`);
  }
  // Relation descriptive ≠ causalité
  if (String(stamped.kind || '').includes('sleep') || metrics.associationOnly) {
    limitations.push('association_not_causation');
    allowed.push('association_only');
  }
  const occ = occurrenceId(stamped);
  return {
    id: stamped.id && stamped.id !== stamped.kind ? stamped.id : occ,
    phenomenonId: phenomenonIdOf(stamped),
    occurrenceId: occ,
    layer: hasThesis ? CLAIM_LAYER.CONCLUSION : CLAIM_LAYER.OBSERVATION,
    subject: subjectOf(stamped),
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
    claimType: stamped.metrics?.trajectoryOk
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
      progressionDimension: assertion.progressionDimension,
      comparisonMethod: assertion.comparisonMethod,
      documentary: Boolean(metrics.documentaryOnly || metrics.nonNumericProof)
    },
    statement,
    evidenceIds: assertion.evidenceIds,
    limitations,
    confidence: stamped.weights?.reliability ?? null,
    allowedStatements: allowed,
    status: hasThesis ? 'supported' : 'conditional',
    producer: stamped.lineage?.producer || stamped.metrics?.producer || 'legacy_adapter'
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
