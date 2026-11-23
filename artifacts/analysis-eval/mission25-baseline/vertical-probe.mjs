import { applyP6 } from './src/utils/sport/p6Pipeline.js';
import { insightsFromP6 } from './src/utils/sport/p6Publication.js';
import { buildPeriodAuditDossier, serializeConclusion } from './src/utils/sport/analysisPeriodExport.js';
import { buildAnalyticalAudit, validateAnalyticalAudit } from './src/utils/sport/evaluation/buildAnalyticalAudit.js';
import { analysisEditionKey } from './src/utils/sport/analysisEdition.js';
import fs from 'fs';

function disc(id, title, dates, reps, name='Hyperextension') {
  return {
    kind: 'disc_traj_parallel_probe', title,
    body: 'Trajectoire stable '+id, evidence: dates.join(','),
    nature: 'trajectory', family: 'repertoire', informativeValue: 80,
    metrics: { name, exerciseId: id, dates, sessionDates: dates, totalReps: reps,
      windowStart:'2026-11-01', windowEnd:'2026-11-10', populationLabel:'sessions',
      observedValues:[{id:'totalReps',value:reps,unit:'reps'}] }
  };
}

const all = [
  disc('slotA','Hyperextension : rythme stable',['2026-11-01','2026-11-04','2026-11-08'],120),
  disc('slotB','Hyperextension : rythme stable',['2026-11-02','2026-11-05','2026-11-09'],118),
  disc('squat','Squat : volume en hausse',['2026-11-03','2026-11-07'],200,'Squat')
];
const p6 = applyP6({ all, selected: all, window:{start:'2026-11-01',end:'2026-11-10'}, voiceKey:'week' });
const insights = insightsFromP6(p6,{period:'7d'});
const bundle = {
  analysisEdition: analysisEditionKey(),
  recapAssessment: {
    insights: { ...insights },
    periodDiscoveries: { p6, all, dropped: [] },
    insightsPublication: { windowStart:'2026-11-01', windowEnd:'2026-11-10', packId:'m25-7d' }
  }
};
const dossier = buildPeriodAuditDossier({
  requestedPeriod:'7d', requestedWindow:{start:'2026-11-01',end:'2026-11-10'},
  bundle, provenance:'computed_replay_mission25'
});
const audit = buildAnalyticalAudit({
  eightPeriodExport:{ periods:{ '7d': dossier } },
  analysisRunId:'mission25-vertical-probe'
});
const validation = validateAnalyticalAudit(audit);
const priority = dossier.userAccessible.priority;
const parallel = priority.find(c => String(c.kind||'').includes('parallel'));
const out = {
  edition: analysisEditionKey(),
  rootCause: 'parallel.composedCount not in produced → counters.reconciled=false → legacy_fallback sans claims',
  fix: 'produced += composedParallel; claim on parallel parent discovery; integrity validation',
  pipeline: {
    reconciled: p6.counters.reconciled,
    composedParallel: p6.counters.composedParallel,
    authority: insights.publicationAuthority,
    steps: (p6.pipelineSteps||[]).map(s => s.id)
  },
  published: {
    priorityCount: priority.length,
    reserveCount: dossier.userAccessible.reserve.length,
    claimsInAudit: Object.keys(audit.claimRegistry||{}).length,
    cardsInAudit: Object.keys(audit.cardRegistry||{}).length,
    publishedWithoutClaim: validation.counts.publishedWithoutClaim,
    parallelCard: parallel ? { title: parallel.title, hasClaim: !!parallel.claim, disposition: parallel.disposition, childIds: parallel.childIds } : null
  },
  validation: {
    ok: validation.ok,
    schemaOk: validation.schemaValidation.ok,
    integrityOk: validation.integrityValidation.ok,
    errors: validation.errors.slice(0,20)
  },
  comparisonNarrative: {
    v22: { note: 'P6 authority, claims per horizon, large reserve' },
    v23: { note: 'parallel broke counters → legacy_fallback → claims only today, priorities up, cardRegistry down' },
    v24: { note: 'P6 authority restored with composedParallel accounting; parallel claims present' }
  }
};
fs.mkdirSync('artifacts/analysis-eval/mission25-baseline',{recursive:true});
fs.writeFileSync('artifacts/analysis-eval/mission25-baseline/vertical-probe-v24.json', JSON.stringify(out,null,2));
console.log(JSON.stringify(out,null,2));
