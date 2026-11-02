/**
 * Benchmark avant/après producteurs sur fixture réelle jul-oct.
 * Usage: npx vite-node scripts/f70l-perf-benchmark.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { createRecapPerfTimer } from '../src/utils/sport/recapPerfInstrumentation.js';
import { computeP35WindowMetrics } from '../src/utils/sport/recapP35Metrics.js';
import { computeP36WindowMetrics } from '../src/utils/sport/recapP36Metrics.js';
import { buildP35DayTable } from '../src/utils/sport/recapP35DayModel.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'),
    'utf8'
  )
);
const nameById = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/exercise-name-map-main.json'),
    'utf8'
  )
);
const getName = (id) => nameById[String(id)] || nameById[id] || '';

const window = { start: '2025-11-02', end: '2026-11-01' }; // ~1y overlapping fixture

function ms(fn) {
  const t0 = performance.now();
  const v = fn();
  return { ms: performance.now() - t0, v };
}

console.log('--- isolated producers ---');
{
  const a = ms(() => buildP35DayTable(snap, window, { getExerciseNameById: getName }));
  const cache = new Map();
  const b1 = ms(() =>
    buildP35DayTable(snap, window, { getExerciseNameById: getName, dayTableCache: cache })
  );
  const b2 = ms(() =>
    buildP35DayTable(snap, window, { getExerciseNameById: getName, dayTableCache: cache })
  );
  console.log(
    JSON.stringify(
      {
        p35TableCold: Math.round(a.ms),
        p35TableCached1: Math.round(b1.ms),
        p35TableCached2Hit: Math.round(b2.ms),
        days: a.v.days?.length
      },
      null,
      2
    )
  );
}
{
  const cache = new Map();
  const p35 = ms(() =>
    computeP35WindowMetrics(snap, window, { getExerciseNameById: getName, dayTableCache: cache })
  );
  const p36 = ms(() =>
    computeP36WindowMetrics(snap, window, { getExerciseNameById: getName, dayTableCache: cache })
  );
  console.log(
    JSON.stringify(
      {
        p35WithSharedCache: Math.round(p35.ms),
        p36WithSharedCacheAfterP35: Math.round(p36.ms),
        p36OccasionMs: p36.v.performance?.occasionMs
      },
      null,
      2
    )
  );
}

console.log('--- full bundle 1y-like ---');
{
  const perf = createRecapPerfTimer();
  const t0 = performance.now();
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window,
    period: '1y',
    getExerciseNameById: getName,
    perfTimer: perf
  });
  const total = performance.now() - t0;
  const snapPerf = perf.snapshot() || {};
  const steps = Object.entries(snapPerf)
    .map(([name, row]) => ({
      name,
      exclusiveMs: Math.round(row.exclusiveMs || 0),
      inclusiveMs: Math.round(row.inclusiveMs || 0),
      calls: row.calls || 0
    }))
    .sort((a, b) => b.exclusiveMs - a.exclusiveMs)
    .slice(0, 12);
  console.log(
    JSON.stringify(
      {
        totalMs: Math.round(total),
        selected: bundle?.selected?.length ?? bundle?.discoveries?.length,
        topExclusive: steps
      },
      null,
      2
    )
  );
}
