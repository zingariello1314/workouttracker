import { applyP6 } from './src/utils/sport/p6Pipeline.js';
import { insightsFromP6 } from './src/utils/sport/p6Publication.js';
import { applyParallelTrajectoryComposition } from './src/utils/sport/parallelTrajectoryComposition.js';
import { selectCollectively, reconcileCounters } from './src/utils/sport/collectiveSelection.js';

function disc(id, title, dates, reps) {
  return {
    kind: 'disc_traj_parallel_probe',
    title,
    body: 'Trajectoire stable sur plusieurs séances pour '+id,
    evidence: 'dates '+dates.join(','),
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

const all = [
  disc('slotA', 'Hyperextension : rythme stable', ['2026-11-01','2026-11-04','2026-11-08'], 120),
  disc('slotB', 'Hyperextension : rythme stable', ['2026-11-02','2026-11-05','2026-11-09'], 118),
  disc('other', 'Squat : volume en hausse', ['2026-11-03','2026-11-07'], 200)
];
const p6 = applyP6({ all, selected: all, window: { start: '2026-11-01', end: '2026-11-10' }, voiceKey: 'week' });
const insights = insightsFromP6(p6, { period: '7d' });
const parallelStep = (p6.pipelineSteps||[]).find(s => s.id === 'parallel_trajectories');
console.log(JSON.stringify({
  reconciled: p6.counters.reconciled,
  composedParallel: p6.counters.composedParallel,
  produced: p6.counters.produced,
  priority: p6.counters.priority,
  reserve: p6.counters.reserve,
  authority: insights.publicationAuthority,
  prioCards: (insights.shortTerm||[]).concat(insights.mediumTerm||[], insights.longTerm||[]).length,
  hasParallelClaim: (p6.priority||[]).some(c => c.kind === 'disc_composed_parallel_trajectories' && c.claim),
  parallelTitles: (p6.priority||[]).filter(c => String(c.kind||'').includes('parallel')).map(c => ({ title: c.title, hasClaim: !!c.claim })),
  parallelStep
}, null, 2));
