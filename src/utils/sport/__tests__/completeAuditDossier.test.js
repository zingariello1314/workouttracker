import { describe, expect, it } from 'vitest';
import { assembleCompleteAuditDossier } from '../evaluation/completeAuditDossier';
import { analyticalJsonStringify } from '../analysisExportDownload';

describe('assembleCompleteAuditDossier', () => {
  it('signale les artefacts manquants sans prétendre à un aveugle humain', async () => {
    const result = await assembleCompleteAuditDossier({
      eightPeriodExport: null,
      insights: null,
      download: false,
      includeLiveGames: false
    });
    expect(result.schema).toBe('momentum.completeAuditDossier.v1');
    expect(result.manifest.didNotRerunVitestSuite).toBe(true);
    expect(result.manifest.humanBlindComparison.performed).toBe(false);
    const missing = result.manifest.files.filter((f) => f.status === 'missing');
    expect(missing.length).toBeGreaterThan(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('inclut l’export 8 périodes et les comparaisons quand fournis', async () => {
    const eight = {
      schema: 'momentum.analysisEightPeriodExport.v1',
      capturedAt: '2026-11-20T00:00:00.000Z',
      complete: true,
      periods: { '7d': { period: '7d' }, '30d': { period: '30d' } },
      comparisons: {
        '7d_vs_30d': { schema: 'cmp', periodA: '7d', periodB: '30d' },
        '6m_vs_1y': { refused: true, reason: 'missing_6m' },
        '1y_vs_2y': { refused: true, reason: 'missing_1y' },
        '2y_vs_all': { refused: true, reason: 'missing_2y' }
      },
      unavailable: []
    };
    const result = await assembleCompleteAuditDossier({
      eightPeriodExport: eight,
      insights: { shortTerm: [], mediumTerm: [], longTerm: [], accessibleReserve: [] },
      download: false,
      includeLiveGames: true
    });
    expect(result.zipFilesPreview).toContain('eight-periods/eight-periods.json');
    expect(result.zipFilesPreview).toContain('comparisons/7d_vs_30d.json');
    expect(result.zipFilesPreview).toContain('evaluation/live/game-B.json');
    expect(result.zipFilesPreview).toContain('evaluation/publication-reconciliation.json');
    expect(result.zipFilesPreview).toContain('MANIFEST.json');
    expect(result.manifest.didNotRerunVitestSuite).toBe(true);
    expect(result.manifest.humanBlindComparison.performed).toBe(false);
    const text = analyticalJsonStringify(result.manifest);
    expect(text).not.toMatch(/\[Circular\]/);
  });

  it('extrait dispositions et réconciliation depuis registry.* (concordance JSON principal)', async () => {
    const dispositions = [
      { id: 'occ:a', disposition: 'published' },
      {
        id: 'occ:b',
        disposition: 'semantic_equivalent_suppressed',
        collapsedInto: 'occ:a',
        equivalence: { equivalent: true, reason: 'same_text_and_proof', proof: { leftProof: '1' } }
      }
    ];
    const publicationReconciliation = {
      lostSilent: [],
      reconciled: true,
      registryCount: 2,
      publishedCount: 1
    };
    const eight = {
      schema: 'momentum.analysisEightPeriodExport.v1',
      capturedAt: '2026-11-20T00:00:00.000Z',
      complete: true,
      periods: {
        '7d': {
          period: '7d',
          publicationAuthority: 'p6',
          userAccessible: { priority: [{ id: 'occ:a' }], reserve: [] },
          registry: {
            counters: { priority: 1, reserve: 1 },
            publicationDispositions: dispositions,
            publicationReconciliation
          }
        }
      },
      comparisons: {},
      unavailable: []
    };
    const result = await assembleCompleteAuditDossier({
      eightPeriodExport: eight,
      insights: null,
      download: false,
      includeLiveGames: false
    });
    const reconFile = result.zipFiles.find((f) => f.name === 'evaluation/publication-reconciliation.json');
    const dispFile = result.zipFiles.find((f) => f.name === 'evaluation/selection-dispositions.json');
    expect(reconFile).toBeTruthy();
    expect(dispFile).toBeTruthy();
    const recon = JSON.parse(reconFile.data);
    const disp = JSON.parse(dispFile.data);
    expect(recon.periods[0].registryExpected).toBe(2);
    expect(recon.periods[0].dispositionsCount).toBe(2);
    expect(recon.periods[0].publicationReconciliation.reconciled).toBe(true);
    expect(disp.periods['7d']).toHaveLength(2);
    expect(disp.concordance.periods[0].matchesMain).toBe(true);
    expect(disp.concordance.periods[0].source).toBe('registry.publicationDispositions');
  });
});
