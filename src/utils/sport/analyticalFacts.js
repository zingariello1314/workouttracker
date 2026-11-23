/**
 * Mission 21 — faits analytiques partagés (facts-first).
 * Identité = sujet + métrique + population + fenêtre + méthode + version de définition.
 * Indépendant du titre, du détecteur et de la place éditoriale.
 */

import { POPULATION_ID } from './canonicalAnalyticalPopulations';

export const FACT_DEFINITION_VERSION = 'm21-v1';

export function buildFactId({
  subject = 'period',
  metric = 'unknown',
  populationId = POPULATION_ID.CLASSIC_SESSION,
  window = null,
  method = 'measure',
  definitionVersion = FACT_DEFINITION_VERSION
} = {}) {
  const w =
    window?.start && window?.end ? `${window.start}_${window.end}` : window?.end || 'open';
  return `fact|${subject}|${metric}|${populationId}|${w}|${method}|${definitionVersion}`;
}

export function makeFact(partial) {
  const id = partial.id || buildFactId(partial);
  return {
    id,
    subject: partial.subject || 'period',
    metric: partial.metric,
    value: partial.value,
    unit: partial.unit || 'reps',
    populationId: partial.populationId || POPULATION_ID.CLASSIC_SESSION,
    window: partial.window || null,
    method: partial.method || 'measure',
    definitionVersion: partial.definitionVersion || FACT_DEFINITION_VERSION,
    evidenceRefs: partial.evidenceRefs || [],
    kind: partial.kind || 'numeric'
  };
}

/**
 * Construit le registre de faits pour les parcours migrés (volumes, familles, épisode).
 * Ces faits sont destinés à être *consommés* par plusieurs claims.
 */
export function buildMigratedAnalyticalFacts({
  window = null,
  previousWindow = null,
  inclusiveVolume = null,
  classicVolume = null,
  classicDays = null,
  previousClassicVolume = null,
  previousClassicDays = null,
  decomp = null,
  collective = null
} = {}) {
  const facts = [];
  const push = (row) => facts.push(makeFact(row));

  if (window && classicVolume != null) {
    push({
      subject: 'period',
      metric: 'volume',
      value: classicVolume,
      unit: 'reps',
      populationId: POPULATION_ID.CLASSIC_SESSION,
      window,
      method: 'lifetime_catalog_exclusive'
    });
  }
  if (window && inclusiveVolume != null) {
    push({
      subject: 'period',
      metric: 'volume',
      value: inclusiveVolume,
      unit: 'reps',
      populationId: POPULATION_ID.STRENGTH_INCLUSIVE,
      window,
      method: 'strength_inclusive'
    });
  }
  if (window && classicDays != null) {
    push({
      subject: 'period',
      metric: 'training_days',
      value: classicDays,
      unit: 'days',
      populationId: POPULATION_ID.CLASSIC_SESSION,
      window,
      method: 'lifetime_catalog_exclusive'
    });
  }
  if (previousWindow && previousClassicVolume != null) {
    push({
      subject: 'period',
      metric: 'volume',
      value: previousClassicVolume,
      unit: 'reps',
      populationId: POPULATION_ID.CLASSIC_SESSION,
      window: previousWindow,
      method: 'lifetime_catalog_exclusive'
    });
  }
  if (previousWindow && previousClassicDays != null) {
    push({
      subject: 'period',
      metric: 'training_days',
      value: previousClassicDays,
      unit: 'days',
      populationId: POPULATION_ID.CLASSIC_SESSION,
      window: previousWindow,
      method: 'lifetime_catalog_exclusive'
    });
  }
  if (window && previousWindow && classicVolume != null && previousClassicVolume != null) {
    push({
      subject: 'period',
      metric: 'volume_delta',
      value: classicVolume - previousClassicVolume,
      unit: 'reps',
      populationId: POPULATION_ID.CLASSIC_SESSION,
      window: { start: previousWindow.start, end: window.end },
      method: 'window_compare'
    });
  }

  (decomp?.contributionRegistry || decomp?.contributions || []).forEach((c) => {
    push({
      subject: `family:${c.familyId}`,
      metric: 'volume_contribution',
      value: c.volumeDelta,
      unit: 'reps',
      populationId: POPULATION_ID.CLASSIC_SESSION,
      window,
      method: 'family_freq_content_decomposition',
      evidenceRefs: [
        `freqEffect:${c.freqEffect}`,
        `contentEffect:${c.contentEffect}`,
        `prevVol:${c.previousVolume}`,
        `recentVol:${c.recentVolume}`
      ]
    });
  });

  if (collective?.namedMoves?.length) {
    const episodeId = collective.episodeId || null;
    const returnDate = (collective.dates || [])[0] || null;
    push({
      subject: episodeId || `episode:${returnDate || 'na'}`,
      metric: 'participant_count',
      value: collective.namedMoves.length,
      unit: 'count',
      populationId: POPULATION_ID.CLASSIC_SESSION,
      window,
      method: 'session_episode_ledger',
      kind: 'documentary'
    });
    if (returnDate) {
      push({
        subject: episodeId || `episode:${returnDate}`,
        metric: 'return_date',
        value: returnDate,
        unit: 'date',
        populationId: POPULATION_ID.CLASSIC_SESSION,
        window,
        method: 'session_episode_ledger',
        kind: 'documentary'
      });
    }
    (collective.confirmationDates || []).forEach((d) => {
      push({
        subject: episodeId || `episode:${returnDate || 'na'}`,
        metric: 'confirmation_date',
        value: d,
        unit: 'date',
        populationId: POPULATION_ID.CLASSIC_SESSION,
        window,
        method: 'session_episode_ledger',
        kind: 'documentary'
      });
    });
    collective.namedMoves.forEach((m) => {
      const sid = m.exerciseId || m.name;
      if (m.currentReps != null) {
        push({
          subject: `ex:${sid}`,
          metric: 'return_reps',
          value: m.currentReps,
          unit: 'reps',
          populationId: POPULATION_ID.CLASSIC_SESSION,
          window: { start: m.date || returnDate, end: m.date || returnDate },
          method: 'session_episode_ledger'
        });
      }
      if (m.prevReps != null) {
        push({
          subject: `ex:${sid}`,
          metric: 'pre_gap_reps',
          value: m.prevReps,
          unit: 'reps',
          populationId: POPULATION_ID.CLASSIC_SESSION,
          window: { start: m.lastBefore || 'unknown', end: m.lastBefore || 'unknown' },
          method: 'session_episode_ledger'
        });
      }
    });
  }

  return {
    version: FACT_DEFINITION_VERSION,
    facts,
    byId: Object.fromEntries(facts.map((f) => [f.id, f]))
  };
}

/** Convertit un registre de faits en observedValues pour un claim. */
export function factsToObservedValues(factRegistry, ids = null) {
  const list = factRegistry?.facts || [];
  const filtered = ids ? list.filter((f) => ids.includes(f.id) || ids.includes(f.metric)) : list;
  return filtered.map((f) => ({
    id: f.id,
    value: f.value,
    unit: f.unit,
    populationId: f.populationId,
    kind: f.kind
  }));
}
