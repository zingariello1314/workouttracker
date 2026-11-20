import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { claimFromDiscovery } from '../analyticalClaim';
import { insightsFromP6 } from '../p6Publication';
import { runGameAAccuracy } from '../evaluation/gameAAccuracy';
import { runGameBDiscoveryQuality } from '../evaluation/gameBDiscoveryQuality';
import { runGameCCollective } from '../evaluation/gameCCollective';
import {
  runStructuredEvalSuite,
  structureGameAReport,
  structureGameBReport,
  structureGameCReport
} from '../evaluation/structuredEvalReports';
import { writeEvalArtifactFiles } from '../evaluation/evalArchive';

describe('jeux A/B/C reconstitués', () => {
  it('jeu A exige des claims et refuse le défi classé endurance', () => {
    const discovery = {
      kind: 'disc_volume_shape',
      title: 'Volume concentré',
      body: 'Peu de journées.',
      evidence: '3 jours'
    };
    const claim = claimFromDiscovery(discovery);
    const insights = {
      shortTerm: [{ ...discovery, id: 'a', claim }],
      mediumTerm: [],
      longTerm: [],
      accessibleReserve: []
    };
    const report = runGameAAccuracy({
      insights,
      measure: { durationContract: { minutesMostlyChallenge: true }, repsPerHour: null }
    });
    expect(report.pass).toBe(true);
    expect(report.missingClaims).toBe(0);
    const structured = structureGameAReport(report);
    expect(structured.schema).toBe('momentum.evalGameReport.v1');
    expect(structured.humanBlindComparison.performed).toBe(false);
  });

  it('jeu B distingue une décomposition de fréquence d’une absence de phénomène', () => {
    const report = runGameBDiscoveryQuality({});
    expect(report.referenceHits).toBeGreaterThanOrEqual(1);
    expect(report.incorrectAttractive).toBe(0);
    expect(report.blindComparisonAvailable).toBe(false);
    const structured = structureGameBReport(report);
    expect(structured.referenceKindsPresent.synthetic).toBe(true);
    expect(structured.referenceKindsPresent.humanBlind).toBe(false);
    expect(structured.humanBlindComparison.performed).toBe(false);
    expect(structured.cases.every((row) => row.humanBlindPerformed === false)).toBe(true);
  });

  it('jeu C refuse les doublons et les sources fusionnées accessibles', () => {
    const discovery = {
      kind: 'disc_volume_shape',
      nature: 'now',
      title: 'Volume concentré',
      body: 'Peu de journées.',
      evidence: '3 jours'
    };
    const claim = claimFromDiscovery(discovery);
    const row = { ...discovery, claim, p6Disposition: 'autonomous' };
    const fused = {
      ...discovery,
      title: 'Maintien source',
      claim: claimFromDiscovery({ ...discovery, title: 'Maintien source', kind: 'disc_format_consolidation' }),
      p6Disposition: 'source_retained',
      collapsedInto: 'parent'
    };
    const p6 = {
      counters: { reconciled: true, priority: 1, reserve: 1 },
      priority: [row],
      reserve: [fused],
      sources: [fused],
      blocked: []
    };
    const insights = insightsFromP6(p6);
    const report = runGameCCollective({ insights, p6 });
    expect(report.fusedSourcesAccessible).toBe(0);
    expect(report.exactDuplicatesAccessible).toBe(0);
    expect(insights.publicationReconciliation.lostSilent).toEqual([]);
    expect(report.pass).toBe(true);
    expect(structureGameCReport(report).pass).toBe(true);
  });

  it('exporte un bundle structuré A/B/C vers artifacts/analysis-eval', () => {
    const discovery = {
      kind: 'disc_volume_shape',
      nature: 'now',
      title: 'Volume concentré',
      body: 'Peu de journées.',
      evidence: '3 jours'
    };
    const claim = claimFromDiscovery(discovery);
    const insights = {
      shortTerm: [{ ...discovery, id: 'a', claim }],
      mediumTerm: [],
      longTerm: [],
      accessibleReserve: []
    };
    const suite = runStructuredEvalSuite({
      insights,
      measure: { durationContract: { minutesMostlyChallenge: true }, repsPerHour: null },
      p6: { counters: { reconciled: true, priority: 1, reserve: 0 } }
    });
    expect(suite.B.humanBlindComparison.performed).toBe(false);
    const written = writeEvalArtifactFiles(fs, path, {
      executedAt: suite.bundle.executedAt,
      edition: suite.bundle.edition,
      gamesBundle: suite.bundle,
      gameA: suite.A,
      gameB: suite.B,
      gameC: suite.C,
      summaryMd: suite.summaryMd,
      notes: ['export structuré après exécution vitest des jeux A/B/C']
    });
    expect(written.written.some((p) => /games-bundle-latest\.json$/.test(p.replace(/\\/g, '/')))).toBe(true);
  });
});
