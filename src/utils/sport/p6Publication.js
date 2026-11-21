/**
 * Publication souveraine P6. Les colonnes et la réserve utilisateur
 * viennent uniquement des conclusions finales, jamais des sources fusionnées.
 * Toute non-publication porte une disposition explicite (aucune disparition silencieuse).
 *
 * Mission 6 : l’identité de publication est l’occurrence (sujet+épisode+aspect),
 * jamais le seul détecteur. Une suppression « équivalente » exige une preuve.
 */

import { analyticalCategory } from './horizonPublicationPolicy';
import {
  buildFusionLineage,
  detectorKind,
  phenomenonIdOf as phenId,
  stablePublicationId as occurrencePublicationId,
  stampDiscoveryIdentity,
  substantiveEquivalence
} from './discoveryIdentity';
import { polishCardProse } from './editorialProseGuard';

const NATURE_COLUMN = {
  now: 'shortTerm',
  trajectory: 'mediumTerm',
  journey: 'longTerm'
};

export function stablePublicationId(row) {
  return occurrencePublicationId(row);
}

export function phenomenonIdOf(row) {
  return phenId(row);
}

export function publishabilityOf(row) {
  if (!row?.title) return { ok: false, reason: 'missing_title' };
  if (!row?.body && !row?.evidence) return { ok: false, reason: 'missing_body_and_evidence' };
  const claim = row.claim || row.inspection?.claim || null;
  if (!claim) return { ok: false, reason: 'missing_claim' };
  return { ok: true, reason: null, claim };
}

export function publishableP6Card(row, { column = null, disposition = 'priority' } = {}) {
  const gate = publishabilityOf(row);
  if (!gate.ok) return null;
  const stamped = stampDiscoveryIdentity(row);
  const id = stablePublicationId(stamped);
  const polished = polishCardProse({
    ...stamped,
    title: stamped.title,
    body: stamped.body || '',
    evidence: typeof stamped.evidence === 'string' ? stamped.evidence : ''
  });
  return {
    id,
    detectorKind: detectorKind(stamped),
    phenomenonId: phenomenonIdOf(stamped),
    occurrenceId: stamped.occurrenceId || id,
    publicationId: `pub:${id}`,
    title: polished.title,
    body: polished.body || '',
    text: polished.body || '',
    evidence: polished.evidence || '',
    kind: stamped.kind || '',
    family: stamped.family || '',
    nature: stamped.nature || null,
    column,
    analyticalCategory: stamped.analyticalCategory || analyticalCategory(stamped),
    claim: gate.claim,
    metrics: stamped.metrics || null,
    inspection: stamped.inspection || null,
    marginal: stamped.marginal || null,
    p6Disposition: stamped.p6Disposition || disposition,
    lineage: stamped.lineage || null,
    fusionLineage: stamped.fusionLineage || null,
    horizonFit: stamped.horizonFit || gate.claim.horizon || null,
    exploration: stamped.exploration || null,
    editorialGuard: polished.editorialGuard || null,
    disposition,
    reason: disposition === 'priority' ? 'p6_priority' : 'p6_reserve'
  };
}

function dispositionRecord(
  row,
  disposition,
  reason,
  { collapsedInto = null, equivalence = null, fusionLineage = null } = {}
) {
  const stamped = stampDiscoveryIdentity(row);
  return {
    id: stablePublicationId(stamped),
    detectorKind: detectorKind(stamped),
    phenomenonId: phenomenonIdOf(stamped),
    occurrenceId: stamped.occurrenceId || stablePublicationId(stamped),
    title: stamped?.title || null,
    kind: stamped?.kind || null,
    subjectKey: stamped?.metrics?.exerciseId
      ? `ex:${stamped.metrics.exerciseId}`
      : null,
    disposition,
    reason,
    collapsedInto: collapsedInto || stamped?.collapsedInto || null,
    equivalence: equivalence || null,
    fusionLineage: fusionLineage || stamped?.fusionLineage || null,
    lineage: stamped?.lineage || null
  };
}

/**
 * Réconciliation forte : compare les identifiants P6 ↔ catalogue publié.
 * Une perte compensée numériquement par un doublon ne passe jamais.
 */
function addAliasVariants(explained, rawId) {
  if (rawId == null || rawId === '') return;
  const id = String(rawId).replace(/^pub:/, '');
  explained.add(id);
  // fact:rhythm|streak|5 → aussi rhythm|streak|5 (id court du registre)
  const fact = id.match(/(?:^|\|)fact:([^|]+(?:\|[^|]+)*)/);
  if (fact?.[1]) {
    const factBody = fact[1].replace(/\|aspect:.*$/, '').replace(/\|ep:.*$/, '');
    if (factBody) explained.add(factBody);
  }
  // disc_x|...|claim:123|... → claim:123 comme alias sujet
  const claim = id.match(/claim:([^|]+)/);
  if (claim?.[1]) explained.add(`claim:${claim[1]}`);
}

function dispositionAliasSet(dispositions = []) {
  const explained = new Set();
  (dispositions || []).forEach((row) => {
    // Les dispositions « published » fournissent aussi des alias d’identité
    // (phenomenonId legacy ≠ occurrenceId) — utiles pour la réconciliation.
    if (!row?.disposition) return;
    if (row.disposition === 'published') {
      [row.id, row.occurrenceId, row.publicationId, row.phenomenonId]
        .filter(Boolean)
        .forEach((id) => addAliasVariants(explained, id));
      return;
    }
    [row.id, row.occurrenceId, row.publicationId, row.phenomenonId, row.collapsedInto]
      .filter(Boolean)
      .forEach((id) => addAliasVariants(explained, id));
    const sources = row.fusionLineage?.sources || [];
    sources.forEach((s) => {
      [s.occurrenceId, s.publicationId, s.phenomenonId]
        .filter(Boolean)
        .forEach((id) => addAliasVariants(explained, id));
    });
  });
  return explained;
}

export function reconcilePublicationIds({
  registryIds = [],
  publishedIds = [],
  dispositions = []
} = {}) {
  const registry = new Set(registryIds.filter(Boolean).map((id) => String(id).replace(/^pub:/, '')));
  const published = new Set(publishedIds.filter(Boolean).map((id) => String(id).replace(/^pub:/, '')));
  const explained = dispositionAliasSet(dispositions);
  // Aussi : toute disposition non-published dont l’id est préfixe/suffixe d’un registre
  const lostSilent = [...registry].filter((id) => {
    if (published.has(id)) return false;
    if (explained.has(id)) return false;
    // Correspondance souple : occurrence vs phénomène vs id tronqué / fact embarqué
    for (const alias of explained) {
      if (!alias) continue;
      if (id === alias || id.startsWith(alias) || alias.startsWith(id)) return false;
      if (alias.includes(`|fact:${id}|`) || alias.includes(`|fact:${id}`) || alias.endsWith(`fact:${id}`)) {
        return false;
      }
      if (id.length >= 8 && alias.includes(id)) return false;
      // Même sujet exercice + même détecteur approximatif
      const idEx = id.match(/ex:([^|]+)/)?.[1];
      const aliasEx = alias.match(/ex:([^|]+)/)?.[1];
      if (idEx && aliasEx && idEx === aliasEx) {
        const idKind = id.match(/disc_[a-z0-9_]+|emergence|return/i)?.[0];
        const aliasKind = alias.match(/disc_[a-z0-9_]+|emergence|return/i)?.[0];
        if (idKind && aliasKind && idKind.replace(/^disc_/, '') === aliasKind.replace(/^disc_/, '')) {
          return false;
        }
      }
    }
    return true;
  });
  const unexpected = [...published].filter((id) => !registry.has(id));
  const duplicatesInPublished = publishedIds.length - published.size;
  // Écart de comptage : chaque id registre absent d’accessible doit être expliqué
  const missingFromAccessible = [...registry].filter((id) => !published.has(id));
  const gapAudit = missingFromAccessible.map((id) => {
    const viaAlias =
      explained.has(id) ||
      [...explained].some((alias) => {
        if (!alias) return false;
        if (id === alias || id.startsWith(alias) || alias.startsWith(id)) return true;
        if (alias.includes(id) && id.length >= 8) return true;
        return false;
      });
    const disposition = (dispositions || []).find((d) => {
      const did = String(d?.id || '').replace(/^pub:/, '');
      return (
        did === id ||
        String(d?.collapsedInto || '').replace(/^pub:/, '') === id ||
        String(d?.occurrenceId || '') === id ||
        String(d?.phenomenonId || '') === id
      );
    });
    const explainedGap = viaAlias || Boolean(disposition);
    return {
      id,
      status: explainedGap ? 'explained_by_disposition_or_alias' : 'unexplained_count_gap',
      disposition: disposition?.disposition || null,
      reason: disposition?.reason || null,
      collapsedInto: disposition?.collapsedInto || null
    };
  });
  const unexplainedGaps = gapAudit.filter((row) => row.status === 'unexplained_count_gap');
  const countGap = registry.size - published.size;
  const countsReconciled = unexplainedGaps.length === 0;
  return {
    registryCount: registry.size,
    publishedCount: published.size,
    countGap,
    missingFromAccessible,
    gapAudit,
    unexplainedCountGaps: unexplainedGaps,
    lostSilent,
    unexpected,
    duplicatesInPublished,
    // reconciled = aucune perte silencieuse d’identité (alias admis)
    reconciled: lostSilent.length === 0 && unexpected.length === 0 && duplicatesInPublished === 0,
    // countsReconciled = tout écart numérique est expliqué (fusion / suppression)
    countsReconciled,
    reconciledStrict:
      lostSilent.length === 0 &&
      unexpected.length === 0 &&
      duplicatesInPublished === 0 &&
      countsReconciled
  };
}

function findPublishedDestination(seenCards, row) {
  for (const card of seenCards.values()) {
    const eq = substantiveEquivalence(row, card);
    if (eq.equivalent) return { card, equivalence: eq };
  }
  return null;
}

export function insightsFromP6(p6, { period = null } = {}) {
  const empty = {
    shortTerm: [],
    mediumTerm: [],
    longTerm: [],
    accessibleReserve: [],
    publicationAuthority: null,
    publicationDispositions: [],
    publicationReconciliation: null
  };
  if (!p6?.counters?.reconciled) {
    return {
      ...empty,
      publicationAuthority: 'p6_unavailable',
      publicationFallbackForbidden: true,
      reason: 'p6_counters_not_reconciled'
    };
  }

  const columns = { shortTerm: [], mediumTerm: [], longTerm: [] };
  const dispositions = [];
  /** @type {Map<string, object>} */
  const seenById = new Map();
  const registryRows = [...(p6.priority || []), ...(p6.reserve || [])].map(stampDiscoveryIdentity);
  const registryIds = registryRows.map((row) => stablePublicationId(row));

  const publishRow = (row, { column, dispositionLabel }) => {
    const stamped = stampDiscoveryIdentity(row);
    const gate = publishabilityOf(stamped);
    if (!gate.ok) {
      dispositions.push(dispositionRecord(stamped, 'unpublished_invalid', gate.reason));
      return null;
    }
    const card = publishableP6Card(stamped, { column, disposition: dispositionLabel });
    if (!card) {
      dispositions.push(dispositionRecord(stamped, 'unpublished_invalid', 'publishable_null'));
      return null;
    }

    if (seenById.has(card.id)) {
      const dest = seenById.get(card.id);
      dispositions.push(
        dispositionRecord(stamped, 'exact_duplicate_suppressed', 'same_occurrence_id', {
          collapsedInto: dest.id,
          equivalence: {
            equivalent: true,
            reason: 'same_occurrence_id',
            proof: { occurrenceId: card.id }
          },
          fusionLineage: buildFusionLineage(dest, [stamped])
        })
      );
      return null;
    }

    // Collision sémantique : fusion uniquement si preuve forte.
    // Une carte prioritaire ne disparaît jamais d’accessible sans destination
    // déjà publiée et sans preuve d’équivalence textuelle/preuves.
    const semanticHit = findPublishedDestination(seenById, stamped);
    if (semanticHit) {
      const strong =
        semanticHit.equivalence?.reason === 'same_text_and_proof' ||
        semanticHit.equivalence?.reason === 'same_semantic_phenomenon' ||
        semanticHit.equivalence?.reason === 'same_text_shared_population';
      const keepPriorityDistinct =
        dispositionLabel === 'priority' &&
        !strong &&
        semanticHit.equivalence?.reason !== 'same_occurrence_id';
      if (!keepPriorityDistinct) {
        const dest = semanticHit.card;
        dispositions.push(
          dispositionRecord(stamped, 'semantic_equivalent_suppressed', semanticHit.equivalence.reason, {
            collapsedInto: dest.id,
            equivalence: semanticHit.equivalence,
            fusionLineage: buildFusionLineage(dest, [stamped])
          })
        );
        dest.fusionLineage = buildFusionLineage(dest, [
          ...(dest.fusionLineage?.sources || []).map((s) => ({
            id: s.publicationId,
            title: s.title,
            kind: s.detectorKind,
            metrics: { exerciseId: s.subjectKey?.replace(/^ex:/, '') }
          })),
          stamped
        ]);
        return null;
      }
      // Priorité distincte : on publie les deux ; la filiation note la proximité
      card.metrics = {
        ...(card.metrics || {}),
        nearEquivalentOf: semanticHit.card.id,
        nearEquivalenceReason: semanticHit.equivalence?.reason || 'weak'
      };
    }

    seenById.set(card.id, card);
    dispositions.push(dispositionRecord(stamped, 'published', dispositionLabel));
    return card;
  };

  const priorityPublished = [];
  (p6.priority || []).forEach((row) => {
    const column = NATURE_COLUMN[row.nature] || 'mediumTerm';
    const card = publishRow(row, { column, dispositionLabel: 'priority' });
    if (card) {
      columns[column].push(card);
      priorityPublished.push(card);
    }
  });

  const accessibleReserve = [];
  (p6.reserve || []).forEach((row) => {
    if (
      row?.p6Disposition === 'source_retained' ||
      row?.p6Disposition === 'exact_duplicate_suppressed' ||
      row?.p6Disposition === 'semantic_equivalent_suppressed' ||
      row?.collapsedInto
    ) {
      dispositions.push(
        dispositionRecord(row, 'source_retained', row.p6Disposition || 'collapsed', {
          collapsedInto: row.collapsedInto,
          fusionLineage: row.fusionLineage || null
        })
      );
      return;
    }
    // Ne pas republier en réserve une conclusion déjà prioritaire (même occurrence / équivalent)
    const stampedReserve = stampDiscoveryIdentity(row);
    const alreadyPriority = priorityPublished.some((card) => {
      if (card.id === stablePublicationId(stampedReserve)) return true;
      const eq = substantiveEquivalence(stampedReserve, card);
      return Boolean(eq?.equivalent);
    });
    if (alreadyPriority) {
      dispositions.push(
        dispositionRecord(stampedReserve, 'source_retained', 'already_in_priority', {
          collapsedInto: priorityPublished.find(
            (card) =>
              card.id === stablePublicationId(stampedReserve) ||
              substantiveEquivalence(stampedReserve, card)?.equivalent
          )?.id
        })
      );
      return;
    }
    const card = publishRow(row, {
      column: NATURE_COLUMN[row.nature] || null,
      dispositionLabel: 'demoted_priority'
    });
    if (card) {
      accessibleReserve.push({
        ...card,
        period: period || card.period || null,
        disposition: 'demoted_priority',
        reason: card.reason || 'p6_reserve'
      });
    }
  });

  const dispositionedIds = new Set(dispositions.map((row) => row.id));
  (p6.sources || []).forEach((row) => {
    const stamped = stampDiscoveryIdentity(row);
    const id = stablePublicationId(stamped);
    if (dispositionedIds.has(id)) return;
    dispositionedIds.add(id);
    dispositions.push(
      dispositionRecord(stamped, 'source_retained', row.p6Disposition || 'source_retained', {
        collapsedInto: row.collapsedInto,
        fusionLineage: row.fusionLineage || buildFusionLineage({ id: row.collapsedInto }, [stamped])
      })
    );
  });
  (p6.blocked || []).forEach((row) => {
    const stamped = stampDiscoveryIdentity(row);
    const id = stablePublicationId(stamped);
    if (dispositionedIds.has(id)) return;
    dispositionedIds.add(id);
    dispositions.push(
      dispositionRecord(stamped, 'blocked', row.p6Disposition || 'unresolved_contradiction')
    );
  });

  const published = [
    ...columns.shortTerm,
    ...columns.mediumTerm,
    ...columns.longTerm,
    ...accessibleReserve
  ];
  const publicationReconciliation = reconcilePublicationIds({
    registryIds,
    publishedIds: published.map((card) => card.id),
    dispositions
  });

  const priorityAccessibleIds = new Set(priorityPublished.map((card) => card.id));
  const priorityMissingAccessible = (p6.priority || [])
    .map((row) => stampDiscoveryIdentity(row))
    .filter((row) => {
      const id = stablePublicationId(row);
      if (priorityAccessibleIds.has(id)) return false;
      // Expliqué seulement si fusion vers une destination déjà accessible
      return !dispositions.some(
        (d) =>
          d.id === id &&
          (d.disposition === 'semantic_equivalent_suppressed' ||
            d.disposition === 'exact_duplicate_suppressed') &&
          d.collapsedInto &&
          (priorityAccessibleIds.has(d.collapsedInto) ||
            published.some((card) => card.id === d.collapsedInto))
      );
    })
    .map((row) => ({ id: stablePublicationId(row), kind: row.kind, title: row.title }));

  const unjustifiedSuppressions = dispositions.filter(
    (d) =>
      (d.disposition === 'exact_duplicate_suppressed' ||
        d.disposition === 'semantic_equivalent_suppressed') &&
      !d.equivalence?.proof &&
      !d.collapsedInto
  );

  const priorityContractOk = priorityMissingAccessible.length === 0;
  const authority =
    publicationReconciliation.reconciled &&
    unjustifiedSuppressions.length === 0 &&
    priorityContractOk
      ? 'p6'
      : 'p6_partial';

  return {
    ...empty,
    ...columns,
    accessibleReserve,
    publicationAuthority: authority,
    fusedSourcesExcluded: (p6.sources || []).length,
    blockedExcluded: (p6.blocked || []).length,
    publicationDispositions: dispositions,
    publicationReconciliation,
    registryAccessibleExpected: (p6.priority || []).length + (p6.reserve || []).length,
    publishedAccessible: published.length,
    priorityPublished: priorityPublished.length,
    priorityMissingAccessible,
    priorityContractOk,
    unjustifiedSuppressions
  };
}
