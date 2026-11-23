import { buildAnalyticalReasoningTrace } from '../../src/utils/sport/evaluation/buildAnalyticalReasoningTrace.js';
import { buildAnalyticalAudit } from '../../src/utils/sport/evaluation/buildAnalyticalAudit.js';
import { serializeConclusion } from '../../src/utils/sport/analysisPeriodExport.js';
import { analysisEditionKey } from '../../src/utils/sport/analysisEdition.js';
import { buildUnderexplorationReport } from '../../src/utils/sport/underexplorationReport.js';

const periods = {};
for (const p of ['today', '7d', '30d', '3m', '6m', '1y', '2y', 'all']) {
  const priority = Array.from({ length: 12 }, (_, i) =>
    serializeConclusion(
      {
        id: `${p}-${i}`,
        title: `T${i}`,
        body: 'B'.repeat(80),
        phenomenonId: `ph${i}`,
        claim: { phenomenonId: `ph${i}`, statement: 'S' },
        metrics: { sharedFacts: ['f1', 'f2'], producer: 'test' },
        drafting: { titleBefore: 'Old', module: 'editorial' },
        memory: { state: 'published', transition: 'seen' }
      },
      'priority',
      { order: i + 1 }
    )
  );
  periods[p] = {
    provenance: 'published_cache',
    window: { start: '2026-01-01', end: '2026-11-18' },
    packId: `${p}:pack`,
    engine: { edition: analysisEditionKey(), dataFingerprint: 'fp' },
    userAccessible: { priority, reserve: [] },
    registry: {
      rejected: [],
      fused: [],
      blocked: [],
      raw: [],
      underexploration: buildUnderexplorationReport({ discoveries: priority })
    },
    timings: {
      pipelineSteps: [
        { id: 'validate', executed: true, inCount: 20, outCount: 12, ms: 10 },
        { id: 'select', executed: true, inCount: 12, outCount: 8, ms: 5 }
      ]
    }
  };
}
const eight = {
  schema: 'momentum.analysisEightPeriodExport.v1',
  analysisRunId: 'bench',
  periods
};
const t0 = Date.now();
const audit = buildAnalyticalAudit({ eightPeriodExport: eight, analysisRunId: 'bench' });
const t1 = Date.now();
const trace = buildAnalyticalReasoningTrace({ eightPeriodExport: eight, analyticalAudit: audit });
const t2 = Date.now();
const as = JSON.stringify(audit).length;
const ts = JSON.stringify(trace).length;
console.log(
  JSON.stringify(
    {
      auditBytes: as,
      traceBytes: ts,
      auditMs: t1 - t0,
      traceMs: t2 - t1,
      conclusions: trace.sizeHints.conclusionCount,
      ratioTraceOverAudit: +(ts / as).toFixed(2)
    },
    null,
    2
  )
);
