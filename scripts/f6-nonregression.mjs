/**
 * F6 — Non-régression : mêmes cartes avec / sans computeScope.
 * Usage: npx vite-node scripts/f6-nonregression.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { createRecapComputeScope } from '../src/utils/sport/recapComputeScope.js';

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

const windows = {
  '7d': { start: '2026-10-24', end: '2026-10-30' },
  '30d': { start: '2026-10-01', end: '2026-10-30' },
  '3m': { start: '2026-08-01', end: '2026-10-30' }
};

function fingerprint(bundle) {
  return (bundle.selected || []).map((d) => ({
    kind: d.kind,
    title: d.title,
    body: d.body,
    informativeValue: d.informativeValue,
    exerciseId: d.metrics?.exerciseId || null,
    composedOk: Boolean(d.metrics?.composedOk),
    continuity: d.metrics?.composedEvidence?.continuity?.kind || null,
    attribution: d.metrics?.composedEvidence?.volumeAttribution?.kind || null
  }));
}

const out = { generatedAt: new Date().toISOString(), periods: {} };
let allEqual = true;
for (const [period, window] of Object.entries(windows)) {
  const without = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName
  });
  const withScope = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName,
    computeScope: createRecapComputeScope({ snapshot: snap, period, window })
  });
  const a = fingerprint(without);
  const b = fingerprint(withScope);
  const equal = JSON.stringify(a) === JSON.stringify(b);
  if (!equal) allEqual = false;
  out.periods[period] = {
    equal,
    selected: a.length,
    kinds: a.map((x) => x.kind),
    cards: a
  };
}
out.allEqual = allEqual;

const dest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f6-nonregression-brief.json'
);
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify({ allEqual, periods: Object.fromEntries(Object.entries(out.periods).map(([k, v]) => [k, { equal: v.equal, selected: v.selected, kinds: v.kinds }])) }, null, 2));
process.exit(allEqual ? 0 : 1);
