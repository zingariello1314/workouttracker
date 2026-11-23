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
import { stampDiscoveryIdentity, stablePublicationId } from './discoveryIdentity';
import { buildConclusionHierarchyView, p7ActionabilityPrepFields } from './conclusionHierarchyContract';
import { buildUnderexplorationReport } from './underexplorationReport';
import { applyParallelTrajectoryComposition } from './parallelTrajectoryComposition';

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
    hierarchyLink: row?.hierarchyLink || row?.discovery?.hierarchyLink || null,
    drafting: row?.discovery?.drafting || null,
    reviewReason: row?.reviewReason || null
  };
}

function wrap(discovery, window, voiceKey) {
  const stamped = stampDiscoveryIdentity(discovery);
  const claim = claimFromDiscovery(stamped, window);
  const fit = horizonFit(voiceKey, stamped?.nature);
  if (claim) claim.horizon = fit;
  const exploration = exploreDiscovery(stamped);
  const drafted = draftFromClaim(stamped, claim, exploration);
  const withIds = stampDiscoveryIdentity({
    ...drafted,
    claim: drafted.claim || claim
  });
  return {
    discovery: {
      ...withIds,
      claim: withIds.claim || claim,
      exploration,
      analyticalCategory: analyticalCategory(withIds),
      horizonFit: fit
    },
    claim: withIds.claim || claim,
    exploration
  };
}

export function applyP6({ all = [], selected = [], window = null, voiceKey = 'week' } = {}) {
  const now =
    typeof performance !== 'undefined' && performance.now ? () => performance.now() : () => Date.now();
  const pipelineSteps = [];
  const markStep = (id, t0, extra = {}) => {
    pipelineSteps.push({
      id,
      executed: true,
      ms: Math.round((now() - t0) * 100) / 100,
      ...extra
    });
  };

  const tWrap = now();
  const wrapped = all.map((row) => wrap(row, window, voiceKey)).filter((row) => row.claim);
  const observations = wrapped.filter((row) => !isAutonomousConclusion(row.claim));
  const conclusions = wrapped.filter((row) => isAutonomousConclusion(row.claim));
  markStep('validation', tWrap, {
    inCount: all.length,
    outCount: conclusions.length,
    functionalLabel: 'Wrap + filtre conclusions autonomes'
  });
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
  const tConsol = now();
  const consolidated = consolidateConclusions(conclusions);
  markStep('composition', tConsol, {
    inCount: conclusions.length,
    outCount: consolidated.survivors.length,
    functionalLabel: 'Consolidation narrative'
  });

  // Passe 4 : examen collectif (contradictions, redondances, monopoles, preuves)
  const tReview = now();
  const reviewed = reviewCollectively(consolidated.survivors, { voiceKey });
  markStep('hierarchy', tReview, {
    inCount: consolidated.survivors.length,
    outCount: reviewed.survivors.length,
    functionalLabel: 'Revue collective + deepenings justifiés'
  });
  // Appliquer les conclusions de réexploration aux textes publiables
  const afterReview = reviewed.survivors.map((row) => {
    if (!row.reexploredFor || !row.exploration?.conclusion) return row;
    // Mission 19 : ne pas écraser une narration d’autorité compositionnelle.
    const authority = row.discovery?.metrics?.narrativeAuthority || row.discovery?.drafting?.authority;
    if (authority === 'composition' || row.discovery?.metrics?.composition?.conclusion) {
      return {
        ...row,
        discovery: {
          ...row.discovery,
          metrics: {
            ...(row.discovery?.metrics || {}),
            exploration: row.exploration,
            reexploredFor: row.reexploredFor
          }
        }
      };
    }
    return {
      ...row,
      discovery: {
        ...row.discovery,
        body: row.exploration.conclusion,
        metrics: {
          ...(row.discovery?.metrics || {}),
          exploration: row.exploration,
          reexploredFor: row.reexploredFor
        }
      }
    };
  });

  // Mission 24/26 — trajectoires parallèles (ids de stockage distincts uniquement)
  const tParallel = now();
  const parallel = applyParallelTrajectoryComposition(afterReview, { voiceKey, window });
  markStep('parallel_trajectories', tParallel, {
    inCount: afterReview.length,
    outCount: parallel.rows.length,
    produced: parallel.composedCount,
    rejectedSameSubject: (parallel.rejectedSameSubject || []).length,
    functionalLabel: 'Composition trajectoires parallèles'
  });

  const tSelect = now();
  const collective = selectCollectively(parallel.rows, { voiceKey });
  // Mission 29 — graphe cohérent AVANT publication : si un parent est supprimé vers
  // une destination, rediriger les enfants ; sinon les détacher (restent accessibles).
  const suppressedById = new Map(
    (collective.suppressed || []).map((row) => [
      stablePublicationId(row.discovery || row),
      row
    ])
  );
  const redirectDeepenings = (rows) =>
    (rows || []).map((row) => {
      if (row?.p6Disposition !== 'deepening_of_collective') return row;
      const parentId = row.collapsedInto || row.discovery?.collapsedInto || null;
      if (!parentId || !suppressedById.has(parentId)) return row;
      const suppressedParent = suppressedById.get(parentId);
      const dest =
        suppressedParent?.collapsedInto ||
        suppressedParent?.discovery?.collapsedInto ||
        null;
      if (dest && dest !== parentId) {
        const link = {
          ...(row.hierarchyLink || row.discovery?.hierarchyLink || {}),
          ok: true,
          reason: 'redirected_after_parent_suppression',
          proof: {
            ...(row.hierarchyLink?.proof || row.discovery?.hierarchyLink?.proof || {}),
            redirectedFrom: parentId,
            redirectedTo: dest
          }
        };
        return {
          ...row,
          collapsedInto: dest,
          hierarchyLink: link,
          discovery: {
            ...(row.discovery || {}),
            collapsedInto: dest,
            hierarchyLink: link
          }
        };
      }
      return {
        ...row,
        collapsedInto: null,
        hierarchyLink: null,
        p6Disposition: 'secondary_autonomous',
        discovery: {
          ...(row.discovery || {}),
          collapsedInto: null,
          hierarchyLink: null,
          p6Disposition: 'secondary_autonomous'
        }
      };
    });
  collective.priority = redirectDeepenings(collective.priority);
  collective.reserve = redirectDeepenings(collective.reserve);
  markStep('select', tSelect, {
    inCount: parallel.rows.length,
    outCount: collective.priority.length,
    functionalLabel: 'Sélection collective (mémoire souveraine)'
  });
  markStep('memory', tSelect, {
    inCount: afterReview.filter((r) => r?.discovery?.metrics?.memory?.publicationDecision).length,
    outCount: collective.reserve.filter((r) => r.p6Disposition === 'demoted_memory_familiarity')
      .length,
    functionalLabel: 'Décisions mémoire appliquées à la sélection'
  });
  markStep('publication', tSelect, {
    inCount: collective.priority.length + collective.reserve.length,
    outCount: collective.priority.length,
    functionalLabel: 'Prêt publication P6'
  });
  const rejected = observations.length;
  const fusedTotal =
    consolidated.fused.length + reviewed.fused.length + (collective.suppressed || []).length;
  const blockedTotal = consolidated.blocked.length + reviewed.abstained.length;
  // Mission 25 — les parents composés après wrap entrent dans le pool admissible.
  // Sans ce compte, reconcileCounters casse → insightsFromP6 refuse → fallback legacy silencieux.
  const composedParallel = parallel.composedCount || 0;
  const counters = reconcileCounters({
    produced: wrapped.length + composedParallel,
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
  counters.composedParallel = composedParallel;

  const publishDiscovery = (row, extra = {}) => {
    const discovery = row?.discovery || {};
    const claim = discovery.claim || row?.claim || null;
    return {
      ...discovery,
      claim,
      ...extra,
      hierarchyLink: extra.hierarchyLink ?? row?.hierarchyLink ?? discovery.hierarchyLink ?? null,
      collapsedInto: extra.collapsedInto ?? row?.collapsedInto ?? discovery.collapsedInto ?? null,
      inspection: inspectConclusion({ ...row, claim, discovery: { ...discovery, claim } })
    };
  };

  const priorityDiscoveries = collective.priority.map((row) =>
    publishDiscovery(row, {
      p6Disposition: row.p6Disposition,
      selectionReason: row.selectionReason || row.discovery?.selectionReason || null,
      marginal: row.marginal
    })
  );
  const reserveDiscoveries = [
    ...collective.reserve.map((row) =>
      publishDiscovery(row, {
        p6Disposition: row.p6Disposition,
        selectionReason: row.selectionReason || row.discovery?.selectionReason || null,
        marginal: row.marginal
      })
    ),
    ...reviewed.demoted.map((row) =>
      publishDiscovery(row, {
        p6Disposition: row.p6Disposition || 'demoted_by_review',
        reviewReason: row.reviewReason
      })
    )
  ];
  const sourceDiscoveries = [
    ...consolidated.fused.map((row) =>
      publishDiscovery(row, {
        p6Disposition: 'source_retained',
        collapsedInto: row.collapsedInto
      })
    ),
    ...reviewed.fused.map((row) =>
      publishDiscovery(row, {
        p6Disposition: 'exact_duplicate_suppressed',
        collapsedInto: row.collapsedInto || null
      })
    ),
    ...(collective.suppressed || []).map((row) =>
      publishDiscovery(row, {
        p6Disposition: 'exact_duplicate_suppressed',
        collapsedInto: row.collapsedInto || null
      })
    )
  ];

  const hierarchy = buildConclusionHierarchyView({
    priority: collective.priority,
    reserve: [...collective.reserve, ...reviewed.demoted],
    suppressed: collective.suppressed || []
  });
  const underexploration = buildUnderexplorationReport({
    discoveries: afterReview.map((r) => ({ ...r.discovery, exploration: r.exploration })),
    reviewDecisions: reviewed.decisions,
    voiceKey
  });

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
    hierarchy,
    underexploration,
    p7Prep: p7ActionabilityPrepFields(),
    counters,
    priorityReading: explainPriorityCounts({ selectedTotal: collective.priority.length }),
    views: {
      aRetenir: collective.priority.length,
      toutes: collective.priority.length + reserveDiscoveries.length,
      autresAngles: sourceDiscoveries.length + reserveDiscoveries.length
    },
    // Mission 23 — instrumentation ciblée du chemin P6 (pas une journalisation totale)
    pipelineSteps,
    instrumented: true
  };
}
