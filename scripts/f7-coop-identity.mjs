/**
 * F7.0 — identité sync vs async coop (fixtures).
 * Usage: npx vite-node scripts/f7-coop-identity.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildPeriodDiscoveryBundle,
  buildPeriodDiscoveryBundleAsync
} from '../src/utils/sport/recapPeriodDiscoveries.js';
import { createRecapComputeScope } from '../src/utils/sport/recapComputeScope.js';
import { browserYieldFrame } from '../src/utils/sport/recapComputeCoop.js';

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

function fingerprint(bundle) {
  return (bundle.selected || []).map((d) => ({
    kind: d.kind,
    title: d.title,
    body: d.body,
    informativeValue: d.informativeValue,
    exerciseId: d.metrics?.exerciseId || null,
    evidence: d.evidence || null
  }));
}

async function compare(period, window) {
  const scopeA = createRecapComputeScope({ snapshot: snap, period, window });
  const sync = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName,
    computeScope: scopeA
  });
  const scopeB = createRecapComputeScope({ snapshot: snap, period, window });
  const asyncBundle = await buildPeriodDiscoveryBundleAsync({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName,
    computeScope: scopeB,
    coop: { yieldFn: browserYieldFrame }
  });
  const a = JSON.stringify(fingerprint(sync));
  const b = JSON.stringify(fingerprint(asyncBundle));
  return {
    period,
    equal: a === b,
    syncSelected: sync.selected?.length,
    asyncSelected: asyncBundle.selected?.length,
    syncAll: sync.all?.length,
    asyncAll: asyncBundle.all?.length
  };
}

const END = '2026-10-30';
const rows = [];
for (const [period, window] of [
  ['7d', { start: '2026-10-24', end: END }],
  ['30d', { start: '2026-10-01', end: END }],
  ['2y', { start: '2024-10-30', end: END }]
]) {
  rows.push(await compare(period, window));
  console.error(`[identity] ${period} equal=${rows[rows.length - 1].equal}`);
}

const allEqual = rows.every((r) => r.equal);
const dest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f7-coop-identity.json'
);
fs.writeFileSync(
  dest,
  JSON.stringify({ generatedAt: new Date().toISOString(), allEqual, rows }, null, 2),
  'utf8'
);
console.log(JSON.stringify({ allEqual, rows }, null, 2));
process.exit(allEqual ? 0 : 1);
