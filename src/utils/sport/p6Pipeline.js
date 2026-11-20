/**
 * P6 branché sur le paquet de production.
 * Quatre passes : découverte (entrée) → exploration → consolidation → revue collective → sélection.
 */

import { claimFromDiscovery, isAutonomousConclusion } from './analyticalClaim';
import { exploreDiscovery } from './analyticalExploration';
import { draftFromClaim } from './draftFromClaim';
import { consolidateConclusions } from './narrativeCoherenceEngine';
import { explainPriorityCounts, reconcileCounters, selectCollectively } from './collectiveSelection';
import { reviewCollectively } from './collectiveReview';
import { analyticalCategory, horizonFit } from './horizonPublicationPolicy';

export function inspectConclusion(row) {
  return {
    claim: row?.claim || null,
    proofs: row?.claim?.evidenceIds || row?.claim?.proof?.sourceEvents || [],
    metrics: row?.claim?.assertions || [],
    method: row?.claim?.producer || row?.discovery?.lineage?.producer || null,
    sourceRecords: row?.discovery?.lineage?.sourceDates || row?.discovery?.metrics?.dates || null,
    competingHypotheses: (row?.exploration?.hypotheses || []).filter((item) => item.status !== 'supported'),
    validation: row?.claim?.status || null,
    admissibility: row?.p6Disposition || null,
    priority: row?.marginal || null,
    publication: row?.discovery?.lineage?.selection || null,
    relations: row?.relations || [],
    coverage: row?.exploration?.coverage || null,
    collapsedInto: row?.collapsedInto || null,
    drafting: row?.discovery?.drafting || null,
    reviewReason: row?.reviewReason || null
  };
}

function wrap(discovery, window, voiceKey) {
  const claim = claimFromDiscovery(discovery, window);
  const fit = horizonFit(voiceKey, discovery?.nature);
  if (claim) claim.horizon = fit;
  const exploration = exploreDiscovery(discovery);
  const drafted = draftFromClaim(discovery, claim, exploration);
  return {
    discovery: {
      ...drafted,
      claim: drafted.claim || claim,
      exploration,
      analyticalCategory: analyticalCategory(drafted),
      horizonFit: fit
    },
    claim: drafted.claim || claim,
    exploration
  };
}

export function applyP6({ all = [], selected = [], window = null, voiceKey = 'week' } = {}) {
  const wrapped = all.map((row) => wrap(row, window, voiceKey)).filter((row) => row.claim);
  const observations = wrapped.filter((row) => !isAutonomousConclusion(row.claim));
  const conclusions = wrapped.filter((row) => isAutonomousConclusion(row.claim));
  const rowKey = (row) =>
    [
      row?.kind,
      row?.metrics?.exerciseId || '',
      row?.metrics?.mechanism || '',
      row?.title || '',
      row?.evidence || ''
    ].join('|');
  const priorityKeys = new Set(selected.map((row) => rowKey(row)));
  conclusions.forEach((row) => {
    row.wasPriority = priorityKeys.has(rowKey(row.discovery));
  });

  // Passes 2–3 : exploration déjà dans wrap ; consolidation narrative
  const consolidated = consolidateConclusions(conclusions);

  // Passe 4 : examen collectif (contradictions, redondances, monopoles, preuves)
  const reviewed = reviewCollectively(consolidated.survivors, { voiceKey });
  const afterReview = reviewed.survivors;

  const collective = selectCollectively(afterReview, { voiceKey });
  const rejected = observations.length;
  const fusedTotal =
    consolidated.fused.length + reviewed.fused.length + (collective.suppressed || []).length;
  const blockedTotal = consolidated.blocked.length + reviewed.abstained.length;
  const counters = reconcileCounters({
    produced: wrapped.length,
    rejected,
    fused: consolidated.fused.length + reviewed.fused.length,
    priority: collective.priority.length,
    reserve: collective.reserve.length + reviewed.demoted.length,
    blocked: blockedTotal,
    suppressed: (collective.suppressed || []).length
  });
  counters.inputPriority = priorityKeys.size;
  counters.inputRows = selected.length;
  counters.reviewDecisions = reviewed.decisions.length;
  counters.reexplored = reviewed.reexplored;

  const priorityDiscoveries = collective.priority.map((row) => ({
    ...row.discovery,
    p6Disposition: row.p6Disposition,
    marginal: row.marginal,
    inspection: inspectConclusion(row)
  }));
  const reserveDiscoveries = [
    ...collective.reserve.map((row) => ({
      ...row.discovery,
      p6Disposition: row.p6Disposition,
      marginal: row.marginal,
      inspection: inspectConclusion(row)
    })),
    ...reviewed.demoted.map((row) => ({
      ...row.discovery,
      p6Disposition: row.p6Disposition || 'demoted_by_review',
      reviewReason: row.reviewReason,
      inspection: inspectConclusion(row)
    }))
  ];
  const sourceDiscoveries = [
    ...consolidated.fused.map((row) => ({
      ...row.discovery,
      p6Disposition: 'source_retained',
      collapsedInto: row.collapsedInto,
      inspection: inspectConclusion(row)
    })),
    ...reviewed.fused.map((row) => ({
      ...row.discovery,
      p6Disposition: 'exact_duplicate_suppressed',
      collapsedInto: row.collapsedInto || null,
      inspection: inspectConclusion(row)
    })),
    ...(collective.suppressed || []).map((row) => ({
      ...row.discovery,
      p6Disposition: 'exact_duplicate_suppressed',
      collapsedInto: row.collapsedInto || null,
      inspection: inspectConclusion(row)
    }))
  ];

  return {
    priority: priorityDiscoveries,
    reserve: reserveDiscoveries,
    sources: sourceDiscoveries,
    blocked: [
      ...consolidated.blocked.map((row) => ({
        ...row.discovery,
        p6Disposition: 'unresolved_contradiction',
        inspection: inspectConclusion(row)
      })),
      ...reviewed.abstained.map((row) => ({
        ...row.discovery,
        p6Disposition: row.p6Disposition || 'abstained_insufficient_proof',
        reviewReason: row.reviewReason,
        inspection: inspectConclusion(row)
      }))
    ],
    relations: consolidated.relations,
    review: {
      decisions: reviewed.decisions,
      reexplored: reviewed.reexplored
    },
    counters,
    priorityReading: explainPriorityCounts({ selectedTotal: collective.priority.length }),
    views: {
      aRetenir: collective.priority.length,
      toutes: collective.priority.length + reserveDiscoveries.length,
      autresAngles: sourceDiscoveries.length + reserveDiscoveries.length
    }
  };
}
