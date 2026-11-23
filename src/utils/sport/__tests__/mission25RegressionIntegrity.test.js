/**
 * Mission 25 — régression v23 (compteurs parallèles) + validation bloquante.
 */
import { describe, expect, it } from 'vitest';
import { applyP6 } from '../p6Pipeline';
import { insightsFromP6, publishableP6Card } from '../p6Publication';
import { applyParallelTrajectoryComposition } from '../parallelTrajectoryComposition';
import { reconcileCounters, selectCollectively } from '../collectiveSelection';
import {
  buildAnalyticalAudit,
  validateAnalyticalAudit
} from '../evaluation/buildAnalyticalAudit';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';

function trajDiscovery(id, title, dates, reps) {
  return {
    kind: 'disc_traj_parallel_probe',
    title,
    body: `Trajectoire stable sur plusieurs séances (${id}).`,
    evidence: `dates ${dates.join(',')}`,
    nature: 'trajectory',
    family: 'repertoire',
    informativeValue: 80,
    metrics: {
      name: 'Hyperextension',
      exerciseId: id,
      dates,
      sessionDates: dates,
      totalReps: reps,
      windowStart: '2026-11-01',
      windowEnd: '2026-11-10',
      populationLabel: 'sessions',
      observedValues: [{ id: 'totalReps', value: reps, unit: 'reps' }]
    }
  };
}

describe('Mission 25 — stabilité parallèles / compteurs', () => {
  it('édition v24 après correction de régression', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v\d+$/);
    expect(ANALYSIS_EDITION_PARTS.selection).toBeTruthy();
    expect(ANALYSIS_EDITION_PARTS.audit).toMatch(/^normalized-export-v\d+$/);
  });

  it('sans correction, composedParallel casse reconcileCounters (contre-exemple v23)', () => {
    const rows = [
      {
        claim: { id: 'c1', statement: 't', status: 'supported' },
        wasPriority: true,
        discovery: trajDiscovery('A', 'Hyperextension : rythme stable', ['2026-11-01', '2026-11-04', '2026-11-08'], 120)
      },
      {
        claim: { id: 'c2', statement: 't', status: 'supported' },
        wasPriority: true,
        discovery: trajDiscovery('B', 'Hyperextension : rythme stable', ['2026-11-02', '2026-11-05', '2026-11-09'], 118)
      }
    ];
    const parallel = applyParallelTrajectoryComposition(rows);
    const collective = selectCollectively(parallel.rows, { voiceKey: 'week' });
    const broken = reconcileCounters({
      produced: 2,
      rejected: 0,
      fused: 0,
      priority: collective.priority.length,
      reserve: collective.reserve.length,
      blocked: 0,
      suppressed: (collective.suppressed || []).length
    });
    expect(parallel.composedCount).toBeGreaterThanOrEqual(1);
    expect(broken.reconciled).toBe(false);
  });

  it('applyP6 compte les parents composés et publie avec claim', () => {
    const all = [
      trajDiscovery('slotA', 'Hyperextension : rythme stable', ['2026-11-01', '2026-11-04', '2026-11-08'], 120),
      trajDiscovery('slotB', 'Hyperextension : rythme stable', ['2026-11-02', '2026-11-05', '2026-11-09'], 118),
      trajDiscovery('other', 'Squat : volume en hausse', ['2026-11-03', '2026-11-07'], 200)
    ];
    const p6 = applyP6({
      all,
      selected: all,
      window: { start: '2026-11-01', end: '2026-11-10' },
      voiceKey: 'week'
    });
    expect(p6.counters.reconciled).toBe(true);
    expect(p6.counters.composedParallel).toBeGreaterThanOrEqual(1);
    const insights = insightsFromP6(p6, { period: '7d' });
    expect(insights.publicationAuthority).toBe('p6');
    const parallel = (p6.priority || []).find((c) =>
      String(c.kind || '').includes('parallel_trajectories')
    );
    expect(parallel).toBeTruthy();
    expect(parallel.claim).toBeTruthy();
    const card = publishableP6Card(parallel, { disposition: 'priority' });
    expect(card?.claim).toBeTruthy();
    expect(card?.title).toMatch(/trajectoires parallèles|créneaux parallèles/i);
  });

  it('injection d’erreur après composition → pas de pack P6 valide silencieux', () => {
    const all = [
      trajDiscovery('A', 'Pompes : rythme stable', ['2026-11-01', '2026-11-04'], 90),
      trajDiscovery('B', 'Tirage : volume en hausse', ['2026-11-02', '2026-11-05'], 110)
    ];
    const p6 = applyP6({
      all,
      selected: all,
      window: { start: '2026-11-01', end: '2026-11-10' },
      voiceKey: 'week'
    });
    expect(p6.counters.reconciled).toBe(true);
    const sabotaged = {
      ...p6,
      counters: { ...p6.counters, reconciled: false, produced: p6.counters.produced - 1 }
    };
    const insights = insightsFromP6(sabotaged, { period: '7d' });
    expect(insights.publicationAuthority).toBe('p6_unavailable');
    expect(insights.publicationFallbackForbidden).toBe(true);
    expect(insights.reason).toBe('p6_counters_not_reconciled');
  });

  it('injection d’erreur après sélection (priority sans claim) → unpublished_invalid', () => {
    const all = [trajDiscovery('solo', 'Gainage : tenue stable', ['2026-11-01', '2026-11-08'], 40)];
    const p6 = applyP6({
      all,
      selected: all,
      window: { start: '2026-11-01', end: '2026-11-10' },
      voiceKey: 'week'
    });
    const stripped = {
      ...p6,
      priority: (p6.priority || []).map((row) => {
        const { claim, inspection, ...rest } = row;
        return { ...rest, claim: null, inspection: { ...(inspection || {}), claim: null } };
      })
    };
    const insights = insightsFromP6(stripped, { period: '7d' });
    const unpublished = (insights.publicationDispositions || []).filter(
      (d) => d.disposition === 'unpublished_invalid'
    );
    expect(unpublished.length).toBeGreaterThan(0);
    const published =
      (insights.shortTerm || []).length +
      (insights.mediumTerm || []).length +
      (insights.longTerm || []).length;
    expect(published).toBe(0);
  });
});

describe('Mission 25 — validation intégrité vs schéma', () => {
  it('contre-exemple style v23 : schema ok, integrity ko (claims massivement absents)', () => {
    const cards = {};
    for (let i = 0; i < 60; i += 1) {
      const period = i < 14 ? 'today' : '7d';
      cards[`${period}|card-${i}`] = {
        id: `card-${i}`,
        role: 'priority',
        period,
        title: `Carte ${i}`,
        body: `Corps ${i}`,
        claimId: i < 14 ? `claim-today-${i}` : null
      };
    }
    const claims = {};
    for (let i = 0; i < 14; i += 1) {
      claims[`claim-today-${i}`] = {
        id: `claim-today-${i}`,
        period: 'today',
        statement: `s${i}`,
        scope: { start: '2026-11-10', end: '2026-11-10' }
      };
    }
    const doc = {
      schema: 'momentum.analyticalAudit.v2',
      manifest: { edition: 'test-v23-regression' },
      cardRegistry: cards,
      claimRegistry: claims,
      candidateRegistry: {},
      factRegistry: {},
      periods: {
        today: {
          accessibleCount: 14,
          cardRefs: Array.from({ length: 14 }, (_, i) => `today|card-${i}`),
          publicationAuthority: 'p6',
          reconciledStrict: true,
          publicationCount: 14,
          registryCount: 14
        },
        '7d': {
          accessibleCount: 46,
          cardRefs: Array.from({ length: 8 }, (_, i) => `7d|card-${14 + i}`),
          publicationAuthority: 'legacy_fallback',
          publicationFallback: true,
          reconciledStrict: true,
          publicationCount: null,
          registryCount: null
        }
      },
      diagnostics: { cardClaimDivergenceCount: 0 }
    };
    const v = validateAnalyticalAudit(doc);
    expect(v.schemaValidation.ok).toBe(true);
    expect(v.integrityValidation.ok).toBe(false);
    expect(v.ok).toBe(false);
    expect(v.errors.some((e) => e === 'mass_claim_loss' || e.startsWith('published_card_missing_claim'))).toBe(
      true
    );
    expect(v.errors.some((e) => e.startsWith('degraded_publication_authority'))).toBe(true);
    expect(v.errors.some((e) => e.startsWith('reconciled_strict_without_counts'))).toBe(true);
  });

  it('audit construit depuis insights P6 avec claims → integrity ok sur claims publiés', () => {
    const all = [
      trajDiscovery('A', 'Hyperextension : rythme stable', ['2026-11-01', '2026-11-04', '2026-11-08'], 120),
      trajDiscovery('B', 'Hyperextension : rythme stable', ['2026-11-02', '2026-11-05', '2026-11-09'], 118)
    ];
    const p6 = applyP6({
      all,
      selected: all,
      window: { start: '2026-11-01', end: '2026-11-10' },
      voiceKey: 'week'
    });
    const insights = insightsFromP6(p6, { period: '7d' });
    const priority = [
      ...(insights.shortTerm || []),
      ...(insights.mediumTerm || []),
      ...(insights.longTerm || [])
    ];
    const dossier = {
      packId: 'probe-7d',
      window: { start: '2026-11-01', end: '2026-11-10' },
      publicationAuthority: insights.publicationAuthority,
      publicationFallback: false,
      userAccessible: {
        priority,
        reserve: insights.accessibleReserve || [],
        counts: {
          priority: priority.length,
          reserve: (insights.accessibleReserve || []).length,
          accessible: priority.length + (insights.accessibleReserve || []).length
        }
      },
      registry: {
        publicationReconciliation: insights.publicationReconciliation,
        finalCatalogReconciliation: insights.finalCatalogReconciliation,
        raw: all.map((d) => ({ id: d.metrics.exerciseId, title: d.title, kind: d.kind })),
        publicationDispositions: insights.publicationDispositions
      },
      engine: { edition: 'probe' }
    };
    const audit = buildAnalyticalAudit({
      eightPeriodExport: { periods: { '7d': dossier } },
      analysisRunId: 'mission25-probe'
    });
    const v = validateAnalyticalAudit(audit);
    expect(v.schemaValidation.ok).toBe(true);
    expect(Object.keys(audit.claimRegistry || {}).length).toBeGreaterThan(0);
    expect(v.counts.publishedWithoutClaim).toBe(0);
  });
});
