import { reconcileCounters } from './src/utils/sport/collectiveSelection.js';
import { applyParallelTrajectoryComposition } from './src/utils/sport/parallelTrajectoryComposition.js';
import { selectCollectively } from './src/utils/sport/collectiveSelection.js';

function makeRow(id, title, dates, reps) {
  return {
    claim: { id: 'c_'+id, statement: title, status: 'supported' },
    wasPriority: true,
    discovery: {
      id, kind: 'disc_traj', title, body: 'body '+id, evidence: 'ev',
      nature: 'trajectory', family: 'repertoire', informativeValue: 80,
      metrics: { name: 'Hyperextension', exerciseId: id, dates, totalReps: reps, sessionDates: dates }
    }
  };
}

const rows = [
  makeRow('exA', 'Hyperextension : rythme stable', ['2026-11-01','2026-11-04','2026-11-08'], 120),
  makeRow('exB', 'Hyperextension : rythme stable', ['2026-11-02','2026-11-05','2026-11-09'], 118)
];
const parallel = applyParallelTrajectoryComposition(rows);
const collective = selectCollectively(parallel.rows, { voiceKey: 'week' });
const produced = 2; // wrap count without composed
const rejected = 0;
const fused = 0;
const blocked = 0;
const counters = reconcileCounters({
  produced,
  rejected,
  fused,
  priority: collective.priority.length,
  reserve: collective.reserve.length,
  blocked,
  suppressed: (collective.suppressed||[]).length
});
console.log(JSON.stringify({
  parallelRows: parallel.rows.length,
  composed: parallel.composedCount,
  priority: collective.priority.length,
  reserve: collective.reserve.length,
  suppressed: (collective.suppressed||[]).length,
  counters,
  broken: !counters.reconciled
}, null, 2));
