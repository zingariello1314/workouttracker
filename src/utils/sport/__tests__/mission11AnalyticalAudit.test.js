import { describe, expect, it } from 'vitest';
import {
  buildAnalyticalAudit,
  validateAnalyticalAudit
} from '../evaluation/buildAnalyticalAudit';
import {
  buildCoverageMatrix,
  buildUnderexplorationReport
} from '../underexplorationReport';
import { assembleCompleteAuditDossier } from '../evaluation/completeAuditDossier';

describe('Mission 11 — analytical audit + underexploration', () => {
  it('construit un ANALYTICAL_AUDIT validable avec registres', () => {
    const insights = {
      shortTerm: [
        {
          id: 'occ:sleep1',
          kind: 'disc_sleep_quarter',
          title: 'Sommeil et volume',
          body: 'Association observée sans qu’on puisse en conclure une cause.',
          claim: {
            id: 'claim:sleep1',
            statement: 'Association sommeil–volume',
            proof: { observedValues: { nights: 5, reps: 1200 } },
            limitations: ['association_not_causation']
          }
        }
      ],
      mediumTerm: [],
      longTerm: [],
      accessibleReserve: [
        {
          id: 'occ:reserve1',
          kind: 'disc_volume_trend',
          title: 'Volume en baisse',
          body: 'Fréquence et contenu à distinguer.',
          claim: {
            id: 'claim:reserve1',
            statement: 'Volume en baisse',
            proof: { observedValues: { sessions: 4, reps: 800 } }
          }
        }
      ]
    };
    const doc = buildAnalyticalAudit({
      insights,
      p6: {
        underexploration: { schema: 'momentum.underexplorationReport.v3', summary: {} },
        priority: insights.shortTerm,
        reserve: insights.accessibleReserve
      }
    });
    expect(doc.schema).toMatch(/momentum\.analyticalAudit\.v[12]/);
    expect(doc.manifest.cardCount).toBeGreaterThanOrEqual(2);
    expect(Object.keys(doc.claimRegistry).length).toBeGreaterThanOrEqual(1);
    const v = validateAnalyticalAudit(doc);
    expect(v.schemaValidation.ok).toBe(true);
    expect(v.integrityValidation.ok).toBe(true);
    expect(v.ok).toBe(true);
    expect(v.counts.cards).toBe(doc.manifest.cardCount);
  });

  it('matrice de couverture distingue never_tested et tested', () => {
    const matrix = buildCoverageMatrix({
      discoveries: [
        { kind: 'disc_sleep_volume', title: 'Sommeil', body: 'Association' },
        { kind: 'disc_muscle_share_shift', title: 'Répartition', body: 'Shift' }
      ],
      graph: {
        available: true,
        relations: [{ type: 'shared_movement', left: 'a', right: 'b' }]
      },
      assessments: [{ abstained: true, omissionCallable: false }]
    });
    expect(matrix.schema).toBe('momentum.underexplorationCoverageMatrix.v1');
    const sleep = matrix.rows.find((r) => r.relation === 'sleep_x_activity');
    const muscle = matrix.rows.find((r) => r.relation === 'exercise_x_muscle');
    expect(['tested_with_candidate', 'candidate_kind_present_not_elevated']).toContain(sleep.status);
    expect(['tested_with_candidate', 'candidate_kind_present_not_elevated']).toContain(muscle.status);
    expect(matrix.summary.neverTested).toBeGreaterThanOrEqual(0);
  });

  it('underexplorationReport v3 embarque la matrice et les lanes', () => {
    const report = buildUnderexplorationReport({
      discoveries: [{ kind: 'disc_volume_trajectory', exploration: { coverage: 'under_explored' } }],
      graph: { available: false }
    });
    expect(report.schema).toBe('momentum.underexplorationReport.v3');
    expect(report.coverageMatrix?.rows?.length).toBeGreaterThan(5);
    expect(report.summary.opportunityUnused).toBe(1);
    expect(report.lifecycleLanes).toBeTruthy();
    expect(report.lifecycleLanes.applicable_never_executed).toBeGreaterThanOrEqual(0);
  });

  it('ZIP d’audit inclut ANALYTICAL_AUDIT enrichi et sa validation', async () => {
    const result = await assembleCompleteAuditDossier({
      eightPeriodExport: null,
      insights: {
        shortTerm: [{ id: 'a', title: 'T', body: 'B', kind: 'disc_x' }],
        mediumTerm: [],
        longTerm: [],
        accessibleReserve: []
      },
      download: false,
      includeLiveGames: false
    });
    expect(result.zipFilesPreview).toContain('ANALYTICAL_AUDIT.json');
    expect(result.zipFilesPreview).toContain('ANALYTICAL_AUDIT.validation.json');
    expect(result.zipFilesPreview).toContain('ANALYTICAL_REASONING_TRACE.json');
    const auditFile = result.zipFiles.find((f) => f.name === 'ANALYTICAL_AUDIT.json');
    const parsed = JSON.parse(auditFile.data);
    expect(parsed.schema).toMatch(/momentum\.analyticalAudit\.v[12]/);
    expect(parsed.cardRegistry).toBeTruthy();
    expect(parsed.claimRegistry).toBeTruthy();
    expect(parsed.candidateRegistry).toBeTruthy();
  });
});
