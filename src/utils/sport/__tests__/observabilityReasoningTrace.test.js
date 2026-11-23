import { describe, it, expect } from 'vitest';
import {
  buildAnalyticalReasoningTrace,
  extractTransformations,
  buildModuleExecutionMap,
  buildBulkInspectionIndex,
  serializeForInspector
} from '../evaluation/buildAnalyticalReasoningTrace';
import { serializeConclusion } from '../analysisPeriodExport';
import { ANALYSIS_EDITION_PARTS, analysisEditionKey } from '../analysisEdition';
import { buildUnderexplorationReport } from '../underexplorationReport';

describe('observabilité — reasoning trace', () => {
  it('édition porte observability', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v2\d+$/);
    expect(ANALYSIS_EDITION_PARTS.observability).toMatch(/^reasoning-trace-v\d+$/);
    expect(analysisEditionKey()).toMatch(/observability=reasoning-trace-v\d+/);
  });

  it('serializeForInspector = serializeConclusion (parité)', () => {
    const card = {
      id: 'c1',
      title: 'Reprise collective',
      body: 'Corps',
      claim: { phenomenonId: 'ph1', statement: 'Reprise' },
      drafting: { titleBefore: 'Ancien titre', module: 'editorial', reason: 'polish' },
      memory: { state: 'published', transition: 'first_seen' }
    };
    expect(serializeForInspector(card)).toEqual(serializeConclusion(card, 'priority'));
    const txs = extractTransformations(card);
    expect(txs.some((t) => t.step === 'rewrite_text')).toBe(true);
    expect(txs.some((t) => t.step === 'memory_decision')).toBe(true);
  });

  it('module map marque non instrumenté sans inventer', () => {
    const empty = buildModuleExecutionMap({});
    expect(empty.instrumented).toBe(false);
    expect(empty.summary.unknownNotInstrumented).toBeGreaterThan(0);

    const withSteps = buildModuleExecutionMap({
      pipelineSteps: [
        { id: 'validate', executed: true, inCount: 10, outCount: 8, ms: 12 },
        { id: 'select', executed: true, inCount: 8, outCount: 5, ms: 4 }
      ]
    });
    expect(withSteps.instrumented).toBe(true);
    expect(withSteps.modules.find((m) => m.id === 'validate')?.status).toBe('executed');
  });

  it('trace dérive des dossiers 8 périodes sans second moteur', () => {
    const eight = {
      schema: 'momentum.analysisEightPeriodExport.v1',
      analysisRunId: 'run-test-obs',
      periods: {
        '7d': {
          provenance: 'published_cache',
          window: { start: '2026-11-12', end: '2026-11-18' },
          packId: '7d:pack',
          engine: { edition: analysisEditionKey(), dataFingerprint: 'fp-test' },
          userAccessible: {
            priority: [
              serializeConclusion(
                {
                  id: 'pub-1',
                  title: 'Reprise 11/18',
                  body: 'Collectif',
                  phenomenonId: 'return-ep',
                  claim: { phenomenonId: 'return-ep' },
                  metrics: { sharedFacts: ['f1'] },
                  memory: { state: 'deepened' }
                },
                'priority',
                { order: 1 }
              )
            ],
            reserve: []
          },
          registry: {
            rejected: [
              serializeConclusion(
                { id: 'rej-1', title: 'Rejet', reason: 'insufficient_proof', p6Disposition: 'rejected' },
                'rejected'
              )
            ],
            fused: [],
            blocked: [],
            raw: [],
            underexploration: buildUnderexplorationReport({
              discoveries: [],
              voiceKey: '7d'
            })
          }
        }
      }
    };

    const trace = buildAnalyticalReasoningTrace({
      eightPeriodExport: eight,
      analyticalAudit: {
        schema: 'momentum.analyticalAudit.v2',
        manifest: { analysisRunId: 'run-test-obs', fingerprint: 'fp-test' }
      }
    });

    expect(trace.schema).toBe('momentum.analyticalReasoningTrace.v1');
    expect(trace.manifest.analysisRunId).toBe('run-test-obs');
    expect(trace.manifest.fingerprint).toBe('fp-test');
    expect(trace.sizeHints.conclusionCount).toBeGreaterThanOrEqual(1);
    expect(trace.sizeHints.rejectionCount).toBe(1);
    expect(trace.inspectorParity.serializer).toContain('serializeConclusion');
    expect(trace.explorationLifecycleByPeriod['7d']?.schema).toBe(
      'momentum.explorationLifecycle.v1'
    );
    const never = (trace.explorationLifecycleByPeriod['7d']?.rows || []).filter(
      (r) => r.lane === 'applicable_never_executed'
    );
    expect(never.length).toBeGreaterThan(0);
    expect(never[0].honesty).toMatch(/Aucune preuve/);

    const index = buildBulkInspectionIndex(trace);
    expect(index.count).toBe(trace.sizeHints.conclusionCount);
  });
});
