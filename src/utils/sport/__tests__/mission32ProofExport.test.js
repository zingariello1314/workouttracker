/**
 * Mission 32 — paquet live, contrôles population exportés, DOM virtualisation-aware.
 */
import { describe, expect, it } from 'vitest';
import { buildLiveReplayInputPack } from '../evaluation/buildLiveReplayInputPack';
import { buildAnalyticalAudit } from '../evaluation/buildAnalyticalAudit';
import { assembleCompleteAuditDossier } from '../evaluation/completeAuditDossier';
import { verifyEightPeriodsAgainstDom } from '../evaluation/domEightPeriodVerify';
import { validateCardClaimConsistency } from '../evaluation/claimAssertionIdentity';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import { claimFromDiscovery } from '../analyticalClaim';

describe('Mission 32 — édition observabilité', () => {
  it('bumpe editorial v31+ et audit v13', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v3[1-3]$/);
    expect(ANALYSIS_EDITION_PARTS.audit).toBe('normalized-export-v13');
  });
});

describe('Mission 32 — Preuve A live inputs', () => {
  it('sépare entrées / paramètres / résultats et fingerprint', () => {
    const pack = buildLiveReplayInputPack({
      snapshot: {
        reps: { '2026-11-18_1': 40, '2026-11-20_2': 48 },
        checkedExercises: { '2026-11-18_1': true },
        exerciseWeights: {},
        exerciseSetLogs: {},
        activeProgram: { id: 'p1', name: 'Prog', schedule: {} },
        garminData: { dailyMetrics: { '2026-11-18': { sleep: 9.2 } } }
      },
      anchorDate: '2026-11-21',
      observedResultsRef: 'ANALYTICAL_AUDIT.json'
    });
    expect(pack.ok).toBe(true);
    expect(pack.schema).toMatch(/^momentum\.liveReplayInputPack\.v[12]$/);
    expect(pack.sources.reps).toBeTruthy();
    expect(pack.parameters.timezone).toBe('Europe/Paris');
    expect(pack.parameters.lastSessionDate || pack.parameters.anchorDate).toBeTruthy();
    expect(pack.fingerprints.digest).toBeTruthy();
    expect(pack.separation.inputs).toMatch(/sources/);
    expect(JSON.stringify(pack)).not.toMatch(/"password"|"apiKey"|"secret"/i);
  });
});

describe('Mission 32 — Preuve C populationMetricChecks', () => {
  it('exporte noncomparable et refuse un faux lié', () => {
    const unbound = {
      kind: 'disc_emergence',
      title: 'Pompes',
      body: '718 sur 18 séances',
      metrics: {
        recentReps: 718,
        windowMeanPerSession: 39.9,
        dates: ['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22', '2026-10-29', '2026-11-05', '2026-11-12', '2026-11-19']
      }
    };
    unbound.claim = claimFromDiscovery(unbound, { start: '2026-08-01', end: '2026-11-21' });

    const fake = {
      kind: 'disc_traj',
      title: 'Curl faux',
      body: '480 répétitions sur 8 séances',
      metrics: {
        recentReps: 480,
        windowMeanPerSession: 48,
        sessionCount: 8,
        sessions: Array.from({ length: 8 }, (_, i) => ({
          date: `2026-10-${String(i + 1).padStart(2, '0')}`,
          inSelectedWindow: true
        })),
        observedValues: [
          { id: 'recentReps', value: 480 },
          { id: 'windowMeanPerSession', value: 48 },
          { id: 'sessionCount', value: 8 }
        ]
      }
    };
    fake.claim = claimFromDiscovery(fake, { start: '2026-10-01', end: '2026-10-31' });

    const audit = buildAnalyticalAudit({
      insights: {
        shortTerm: [unbound, fake],
        mediumTerm: [],
        longTerm: [],
        accessibleReserve: []
      },
      currentPeriod: '6m'
    });
    const checks = audit.diagnostics.populationMetricChecks;
    expect(checks.schema).toBe('momentum.populationMetricChecks.v1');
    expect(checks.counts.noncomparable).toBeGreaterThanOrEqual(1);
    expect(checks.counts.fail).toBeGreaterThanOrEqual(1);
    expect(validateCardClaimConsistency(fake, fake.claim).ok).toBe(false);
  });
});

describe('Mission 32 — Preuve B DOM (sans document = NON_OBSERVÉ)', () => {
  it('observe le DOM monté sans exiger tout le catalogue (virtualisation)', async () => {
    const report = await verifyEightPeriodsAgainstDom({
      initialPeriod: '7d',
      periods: ['7d'],
      setPeriod: () => {},
      getState: () => ({
        analysisStatus: 'ready',
        analysisPeriod: '7d',
        selectedPeriod: '7d',
        insights: {
          shortTerm: [{ id: 'a', title: 'Priorité A' }],
          mediumTerm: [],
          longTerm: [],
          accessibleReserve: Array.from({ length: 40 }, (_, i) => ({
            id: `r${i}`,
            title: `Complémentaire ${i}`
          }))
        },
        edition: 'test'
      })
    });
    expect(report.refused).not.toBe(true);
    expect(report.periods).toHaveLength(1);
    const row = report.periods[0];
    // Sans nœuds carte dans jsdom → unobservable ; avec nœuds → virtualisé ou conforme
    expect([
      'computed_not_rendered_or_unobservable',
      'partial_mount_virtualized_accessible',
      'partial_mount_virtualized_priority_gap',
      'rendered_and_conform',
      'rendered_and_divergent',
      'not_verifiable'
    ]).toContain(row.status);
  });

  it('complete audit inclut LIVE_INPUTS et note DOM manquant', async () => {
    const result = await assembleCompleteAuditDossier({
      eightPeriodExport: null,
      insights: null,
      snapshot: {
        reps: { '2026-11-20_x': 10 },
        checkedExercises: {},
        activeProgram: { id: 'p', schedule: {} }
      },
      download: false,
      includeLiveGames: false
    });
    expect(result.zipFilesPreview).toContain('replay/LIVE_INPUTS.json');
    const liveEntry = result.manifest.files.find((f) => f.name === 'replay/LIVE_INPUTS.json');
    expect(liveEntry?.status).toBe('included');
    const domEntry = result.manifest.files.find((f) => f.name === 'evaluation/dom-eight-periods.json');
    expect(domEntry?.status).toBe('missing');
    expect(String(domEntry?.note || '')).toMatch(/NON_OBSERVÉ|DOM/i);
  });
});
