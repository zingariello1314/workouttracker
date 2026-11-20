import { describe, expect, it } from 'vitest';
import { claimFromDiscovery } from '../analyticalClaim';
import { insightsFromP6, publishableP6Card } from '../p6Publication';

function row(partial) {
  const discovery = {
    kind: partial.kind || 'disc_volume_shape',
    nature: partial.nature || 'trajectory',
    title: partial.title,
    body: partial.body,
    evidence: partial.evidence || 'preuve',
    metrics: partial.metrics || {},
    family: partial.family || 'volume'
  };
  const claim = claimFromDiscovery(discovery);
  return {
    ...discovery,
    claim,
    p6Disposition: partial.p6Disposition || 'autonomous',
    collapsedInto: partial.collapsedInto || null,
    inspection: { claim, proofs: [discovery.evidence] }
  };
}

describe('publication souveraine P6', () => {
  it('publie priorité et réserve avec claim, sans sources fusionnées', () => {
    const priority = row({
      title: 'Le volume repose sur peu de journées',
      body: 'Trois séances portent la semaine.',
      nature: 'now'
    });
    const reserve = row({
      kind: 'disc_repertoire_stability',
      title: 'Le répertoire tient le même niveau',
      body: 'Treize maintiens.',
      nature: 'trajectory',
      p6Disposition: 'consolidated'
    });
    const source = row({
      kind: 'disc_format_consolidation',
      title: 'Hyperextension : le niveau historique se maintient',
      body: 'Maintien.',
      p6Disposition: 'source_retained',
      collapsedInto: 'parent'
    });
    const insights = insightsFromP6({
      counters: { reconciled: true },
      priority: [priority],
      reserve: [reserve, source],
      sources: [source],
      blocked: []
    });
    expect(publishableP6Card(reserve, { disposition: 'demoted_priority' })?.title).toBe(
      'Le répertoire tient le même niveau'
    );
    expect(insights.publicationAuthority).toMatch(/^p6/);
    expect(insights.shortTerm).toHaveLength(1);
    expect(insights.shortTerm[0].claim).toBeTruthy();
    expect(insights.shortTerm[0].id).toBeTruthy();
    expect(insights.shortTerm[0].phenomenonId).toBeTruthy();
    expect(insights.accessibleReserve.map((card) => card.title)).toContain(
      'Le répertoire tient le même niveau'
    );
    expect(insights.accessibleReserve.some((card) => /Hyperextension/.test(card.title))).toBe(false);
    expect(insights.fusedSourcesExcluded).toBe(1);
    expect(insights.publicationReconciliation.lostSilent).toEqual([]);
    expect(insights.publicationDispositions.some((d) => d.disposition === 'source_retained')).toBe(true);
  });

  it('refuse une carte sans claim', () => {
    expect(
      publishableP6Card({
        title: 'Sans claim',
        body: 'Texte',
        kind: 'disc_x'
      })
    ).toBeNull();
  });
});
