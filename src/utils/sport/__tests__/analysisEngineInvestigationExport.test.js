import { describe, it, expect } from 'vitest';
import { buildInvestigationExport, buildInvestigationMarkdown } from '../analysisEngineInvestigationExport';
import { DIAG_STATUS } from '../analysisEngineDiagnosticModel';

function report() {
  return {
    meta: { period: '30d', generatedAt: '2026-11-04T00:00:00.000Z' },
    overview: { period: '30d', totalMs: 2000, window: { start: '2026-10-01', end: '2026-10-30' } },
    registry: {
      rows: [
        {
          id: '1',
          kind: 'disc_emergence',
          title: 'Pompes inclinées reviennent',
          body: 'Reprise après 28 jours.',
          diagStatus: DIAG_STATUS.SHOWN_NOW,
          informativeValue: 80,
          metrics: { exerciseId: '1', name: 'Pompes inclinées', gapDays: 28 }
        },
        {
          id: '2',
          kind: 'disc_emergence',
          title: 'un mouvement entre dans ton historique',
          body: 'x',
          diagStatus: DIAG_STATUS.DEMOTED,
          decisionReason: 'unresolved_exercise_name',
          informativeValue: 75,
          metrics: { exerciseId: '999' }
        }
      ],
      counts: {
        total: 2,
        shown_now: 1,
        intermediate: 0,
        demoted: 1,
        rejected: 0,
        unknown: 0,
        conservation: {
          formula: 'total = shown_now + intermediate + demoted + rejected + unknown',
          holds: true
        }
      }
    },
    stagesDetailed: [{ id: 'a', ms: 10, stageStatus: 'ok' }],
    families: [],
    correlations: [],
    limits: []
  };
}

describe('analysisEngineInvestigationExport', () => {
  it('construit un dossier avec candidats, opportunités et santé', () => {
    const dossier = buildInvestigationExport({ report: report() });
    expect(dossier.schemaVersion).toBe('analysis-investigation-v1');
    expect(dossier.candidates.length).toBe(2);
    expect(dossier.publishedCards.length).toBe(1);
    expect(dossier.lostOpportunities.some((g) => g.reason === 'unresolved_exercise_name')).toBe(true);
    expect(dossier.health.execution).toBe('ok');
    expect(dossier.counts.conservation.holds).toBe(true);
    const md = buildInvestigationMarkdown(dossier);
    expect(md).toContain('Pompes inclinées');
    expect(md).toContain('Opportunités perdues');
  });
});
