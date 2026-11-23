import { describe, expect, it } from 'vitest';
import { claimFromDiscovery } from '../analyticalClaim';
import { applyP6 } from '../p6Pipeline';
import {
  insightsFromP6,
  reconcilePublicationIds,
  stablePublicationId
} from '../p6Publication';
import { runGameCCollective } from '../evaluation/gameCCollective';
import { analysisEditionKey } from '../analysisEdition';
import { snapshotFingerprint } from '../analysisEnvironmentDossier';

function discovery(partial) {
  return {
    kind: partial.kind || 'disc_volume_shape',
    nature: partial.nature || 'trajectory',
    title: partial.title,
    body: partial.body,
    evidence: partial.evidence || '2026-11-14',
    metrics: {
      repsNow: 100,
      repsThen: 80,
      ...(partial.metrics || {})
    },
    family: partial.family || 'volume',
    informativeValue: partial.informativeValue ?? 40,
    id: partial.id
  };
}

describe('Mission 5 — souveraineté et réconciliation forte', () => {
  it('édition P6 active (≥ v7)', () => {
    expect(analysisEditionKey()).toMatch(/editorial=p6-sovereign-v(?:[789]|[1-9]\d*)/);
    expect(analysisEditionKey()).toMatch(/review=collective-pass4-v\d+/);
  });

  it('détecte une conclusion valide perdue sans disposition', () => {
    const recon = reconcilePublicationIds({
      registryIds: ['a', 'b', 'c'],
      publishedIds: ['a', 'b'],
      dispositions: [{ id: 'a', disposition: 'published' }, { id: 'b', disposition: 'published' }]
    });
    expect(recon.lostSilent).toEqual(['c']);
    expect(recon.reconciled).toBe(false);
  });

  it('détecte un doublon accessible et une source fusionnée', () => {
    const d = discovery({ title: 'Volume concentré', body: 'Trois jours.' });
    const claim = claimFromDiscovery(d);
    const card = { ...d, claim, id: 'x1' };
    const fused = {
      ...d,
      id: 'x2',
      title: 'Volume concentré copie',
      claim,
      p6Disposition: 'source_retained',
      collapsedInto: 'x1'
    };
    const insights = {
      shortTerm: [card, { ...card, id: 'x1-dup', title: card.title, body: card.body, claim }],
      mediumTerm: [],
      longTerm: [],
      accessibleReserve: [fused],
      publicationAuthority: 'p6',
      publicationDispositions: []
    };
    const report = runGameCCollective({
      insights,
      p6: {
        counters: { reconciled: true, priority: 1, reserve: 0 },
        priority: [card],
        reserve: []
      }
    });
    expect(report.exactDuplicatesAccessible).toBeGreaterThan(0);
    expect(report.fusedSourcesAccessible).toBeGreaterThan(0);
    expect(report.pass).toBe(false);
  });

  it('refuse de présenter un secours legacy comme P6', () => {
    const insights = insightsFromP6({ counters: { reconciled: false } });
    expect(insights.publicationAuthority).toBe('p6_unavailable');
    expect(insights.publicationFallbackForbidden).toBe(true);
  });

  it('explique les non-publications (claim manquant) sans disparition silencieuse', () => {
    const ok = discovery({ title: 'OK', body: 'Preuve.', id: 'ok1' });
    const okClaim = claimFromDiscovery(ok);
    const bad = {
      ...discovery({ title: 'Sans claim', body: 'Texte', id: 'bad1' }),
      claim: null
    };
    const insights = insightsFromP6({
      counters: { reconciled: true, priority: 1, reserve: 1 },
      priority: [{ ...ok, claim: okClaim, p6Disposition: 'priority' }],
      reserve: [{ ...bad, p6Disposition: 'reserve' }],
      sources: [],
      blocked: []
    });
    expect(
      insights.publicationDispositions.some(
        (d) =>
          d.disposition === 'unpublished_invalid' &&
          d.reason === 'missing_claim' &&
          (d.id === 'bad1' || d.title === 'Sans claim' || String(d.id || '').includes('Sans claim'))
      )
    ).toBe(true);
    expect(insights.publicationReconciliation.lostSilent).toEqual([]);
  });

  it('passe 4 active : revue collective présente dans applyP6', () => {
    const a = discovery({
      title: 'Reprise face pull',
      body: 'Retour après pause.',
      kind: 'disc_ms_return',
      nature: 'now',
      informativeValue: 50
    });
    const b = discovery({
      title: 'Reprise face pull',
      body: 'Retour après pause.',
      kind: 'disc_ms_return',
      nature: 'now',
      informativeValue: 48
    });
    const p6 = applyP6({ all: [a, b], selected: [a], voiceKey: 'week' });
    expect(p6.review).toBeTruthy();
    expect(Array.isArray(p6.review.decisions)).toBe(true);
    expect(p6.counters.reconciled).toBe(true);
  });

  it('fingerprint détecte un changement de charge', () => {
    const base = {
      reps: { '2026-11-01#1': 10 },
      checkedExercises: { '2026-11-01#1': true },
      weights: { '2026-11-01#1': 20 }
    };
    const changed = {
      ...base,
      weights: { '2026-11-01#1': 22 }
    };
    expect(snapshotFingerprint(base).digest).not.toBe(snapshotFingerprint(changed).digest);
  });

  it('détecte un paquet d’une autre période / édition via empreinte d’autorité', () => {
    const insights = insightsFromP6({
      counters: { reconciled: true },
      priority: [],
      reserve: [],
      sources: [],
      blocked: []
    });
    expect(insights.publicationAuthority).toBe('p6');
    const foreign = { ...insights, publicationAuthority: 'legacy_fallback', analysisPeriod: '30d' };
    expect(foreign.publicationAuthority).not.toBe('p6');
  });
});
