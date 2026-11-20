/**
 * Publication souveraine P6. Les colonnes et la réserve utilisateur
 * viennent uniquement des conclusions finales, jamais des sources fusionnées.
 * Toute non-publication porte une disposition explicite (aucune disparition silencieuse).
 */

import { analyticalCategory } from './horizonPublicationPolicy';

const NATURE_COLUMN = {
  now: 'shortTerm',
  trajectory: 'mediumTerm',
  journey: 'longTerm'
};

export function stablePublicationId(row) {
  if (row?.id) return String(row.id);
  const kind = row?.kind || 'conclusion';
  const subject = row?.metrics?.exerciseId || row?.metrics?.group || row?.claim?.subject?.key || '';
  const evidence = typeof row?.evidence === 'string' ? row.evidence.slice(0, 48) : '';
  const title = String(row?.title || '').slice(0, 64);
  return `${kind}:${subject}:${evidence}:${title}`;
}

export function phenomenonIdOf(row) {
  if (row?.phenomenonId) return String(row.phenomenonId);
  if (row?.claim?.phenomenonId) return String(row.claim.phenomenonId);
  const metrics = row?.metrics || {};
  const subject = metrics.exerciseId || metrics.group || metrics.matchKey || '';
  const anchor = metrics.eventDate || metrics.lastDate || metrics.date || '';
  if (subject || anchor) return `${row?.kind || 'phenomenon'}|${subject}|${anchor}`;
  return `${row?.kind || 'phenomenon'}|${row?.title || ''}`;
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
  const id = stablePublicationId(row);
  return {
    id,
    phenomenonId: phenomenonIdOf(row),
    publicationId: `pub:${id}`,
    title: row.title,
    body: row.body || '',
    text: row.body || '',
    evidence: typeof row.evidence === 'string' ? row.evidence : '',
    kind: row.kind || '',
    family: row.family || '',
    nature: row.nature || null,
    column,
    analyticalCategory: row.analyticalCategory || analyticalCategory(row),
    claim: gate.claim,
    metrics: row.metrics || null,
    inspection: row.inspection || null,
    marginal: row.marginal || null,
    p6Disposition: row.p6Disposition || disposition,
    lineage: row.lineage || null,
    horizonFit: row.horizonFit || gate.claim.horizon || null,
    exploration: row.exploration || null,
    disposition,
    reason: disposition === 'priority' ? 'p6_priority' : 'p6_reserve'
  };
}

function dispositionRecord(row, disposition, reason, { collapsedInto = null } = {}) {
  return {
    id: stablePublicationId(row),
    phenomenonId: phenomenonIdOf(row),
    title: row?.title || null,
    kind: row?.kind || null,
    disposition,
    reason,
    collapsedInto: collapsedInto || row?.collapsedInto || null,
    lineage: row?.lineage || null
  };
}

/**
 * Réconciliation forte : compare les identifiants P6 ↔ catalogue publié.
 * Une perte compensée numériquement par un doublon ne passe jamais.
 */
export function reconcilePublicationIds({
  registryIds = [],
  publishedIds = [],
  dispositions = []
} = {}) {
  const registry = new Set(registryIds.filter(Boolean));
  const published = new Set(publishedIds.filter(Boolean));
  const explained = new Set(
    (dispositions || [])
      .filter((row) => row?.id && row.disposition && row.disposition !== 'published')
      .map((row) => row.id)
  );
  const lostSilent = [...registry].filter((id) => !published.has(id) && !explained.has(id));
  const unexpected = [...published].filter((id) => !registry.has(id));
  const duplicatesInPublished = publishedIds.length - published.size;
  return {
    registryCount: registry.size,
    publishedCount: published.size,
    lostSilent,
    unexpected,
    duplicatesInPublished,
    reconciled: lostSilent.length === 0 && unexpected.length === 0 && duplicatesInPublished === 0
  };
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
  const seen = new Set();
  const registryRows = [...(p6.priority || []), ...(p6.reserve || [])];
  const registryIds = registryRows.map((row) => stablePublicationId(row));

  (p6.priority || []).forEach((row) => {
    const column = NATURE_COLUMN[row.nature] || 'mediumTerm';
    const gate = publishabilityOf(row);
    if (!gate.ok) {
      dispositions.push(dispositionRecord(row, 'unpublished_invalid', gate.reason));
      return;
    }
    const card = publishableP6Card(row, { column, disposition: 'priority' });
    if (!card) {
      dispositions.push(dispositionRecord(row, 'unpublished_invalid', 'publishable_null'));
      return;
    }
    if (seen.has(card.id)) {
      dispositions.push(
        dispositionRecord(row, 'exact_duplicate_suppressed', 'duplicate_publication_id', {
          collapsedInto: card.id
        })
      );
      return;
    }
    seen.add(card.id);
    columns[column].push(card);
    dispositions.push(dispositionRecord(row, 'published', 'priority'));
  });

  const accessibleReserve = [];
  (p6.reserve || []).forEach((row) => {
    if (
      row?.p6Disposition === 'source_retained' ||
      row?.p6Disposition === 'exact_duplicate_suppressed' ||
      row?.collapsedInto
    ) {
      dispositions.push(
        dispositionRecord(row, 'source_retained', row.p6Disposition || 'collapsed', {
          collapsedInto: row.collapsedInto
        })
      );
      return;
    }
    const gate = publishabilityOf(row);
    if (!gate.ok) {
      dispositions.push(dispositionRecord(row, 'unpublished_invalid', gate.reason));
      return;
    }
    const card = publishableP6Card(row, {
      column: NATURE_COLUMN[row.nature] || null,
      disposition: 'demoted_priority'
    });
    if (!card) {
      dispositions.push(dispositionRecord(row, 'unpublished_invalid', 'publishable_null'));
      return;
    }
    if (seen.has(card.id)) {
      dispositions.push(
        dispositionRecord(row, 'exact_duplicate_suppressed', 'already_in_priority_or_reserve', {
          collapsedInto: card.id
        })
      );
      return;
    }
    seen.add(card.id);
    accessibleReserve.push({
      ...card,
      period: period || card.period || null,
      disposition: 'demoted_priority',
      reason: card.reason || 'p6_reserve'
    });
    dispositions.push(dispositionRecord(row, 'published', 'reserve'));
  });

  const dispositionedIds = new Set(dispositions.map((row) => row.id));
  (p6.sources || []).forEach((row) => {
    const id = stablePublicationId(row);
    if (dispositionedIds.has(id)) return;
    dispositionedIds.add(id);
    dispositions.push(
      dispositionRecord(row, 'source_retained', row.p6Disposition || 'source_retained', {
        collapsedInto: row.collapsedInto
      })
    );
  });
  (p6.blocked || []).forEach((row) => {
    const id = stablePublicationId(row);
    if (dispositionedIds.has(id)) return;
    dispositionedIds.add(id);
    dispositions.push(dispositionRecord(row, 'blocked', row.p6Disposition || 'unresolved_contradiction'));
  });

  const published = [...columns.shortTerm, ...columns.mediumTerm, ...columns.longTerm, ...accessibleReserve];
  const publicationReconciliation = reconcilePublicationIds({
    registryIds,
    publishedIds: published.map((card) => card.id),
    dispositions
  });

  const authority = publicationReconciliation.reconciled ? 'p6' : 'p6_partial';

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
    publishedAccessible: published.length
  };
}
