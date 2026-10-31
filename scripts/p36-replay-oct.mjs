/**
 * Rejeu P3.6 sur fixture réelle (jul–oct 2026).
 * Usage: npx vite-node scripts/p36-replay-oct.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildP36Discoveries, P36_KINDS } from '../src/utils/sport/recapP36Discoveries.js';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { resolveContentClass } from '../src/utils/sport/recapDiscoveryContentClass.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = JSON.parse(
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
  '7j': { start: '2026-10-24', end: '2026-10-30' },
  '30j': { start: '2026-10-01', end: '2026-10-30' },
  '3m': { start: '2026-08-01', end: '2026-10-30' }
};

const P36_SET = new Set(Object.values(P36_KINDS));

function slim(d) {
  return {
    kind: d.kind,
    nature: d.nature,
    score: d.score,
    contentClass: resolveContentClass(d),
    title: d.title,
    body: d.body,
    metrics: {
      proofLevel: d.metrics?.proofLevel,
      exerciseId: d.metrics?.exerciseId,
      rateClassicPct: d.metrics?.rateClassicPct,
      sharePct: d.metrics?.sharePct,
      freqStatus: d.metrics?.freqStatus,
      volStatus: d.metrics?.volStatus
    }
  };
}

const out = {
  generatedAt: new Date().toISOString(),
  source: 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json',
  horizons: {}
};

for (const [label, window] of Object.entries(windows)) {
  const t0 = performance.now();
  const pack = buildP36Discoveries({
    snapshot,
    window,
    todayYmd: '2026-10-31',
    getExerciseNameById: getName
  });
  const tPack = performance.now() - t0;

  const t1 = performance.now();
  const bundleOff = buildPeriodDiscoveryBundle({
    snapshot,
    window,
    getExerciseNameById: getName,
    nameById,
    todayYmd: '2026-10-31',
    includeP36Discoveries: false
  });
  const tOff = performance.now() - t1;

  const t2 = performance.now();
  const bundleOn = buildPeriodDiscoveryBundle({
    snapshot,
    window,
    getExerciseNameById: getName,
    nameById,
    todayYmd: '2026-10-31',
    includeP36Discoveries: true
  });
  const tOn = performance.now() - t2;

  const selectedP36 = (bundleOn.selected || []).filter((d) => P36_SET.has(d.kind));
  const allP36 = (bundleOn.all || []).filter((d) => P36_SET.has(d.kind));
  const droppedP36 = (bundleOn.dropped || []).filter((d) => P36_SET.has(d.kind));

  out.horizons[label] = {
    window,
    coverage: pack.metrics?.coverage || null,
    byDowSummary: (pack.metrics?.byDow || []).map((r) => ({
      label: r.label,
      eligible: r.eligibleOccurrences,
      classic: r.withClassicExclusive,
      rateClassicPct: r.rateClassicPct,
      classicReps: r.classicExclusiveRepsSum,
      provenPlanned: r.provenPlannedWorkout
    })),
    abstentions: pack.abstentions || [],
    candidatesProduced: (pack.discoveries || []).map(slim),
    candidatesInPool: allP36.map(slim),
    candidatesSelected: selectedP36.map(slim),
    candidatesDropped: droppedP36.map((d) => ({
      kind: d.kind,
      reason: d.reason,
      title: d.title
    })),
    packSelectedKinds: (bundleOn.selected || []).map((d) => d.kind),
    controlWithoutP36Selected: (bundleOff.selected || []).map((d) => d.kind),
    performance: {
      p36PackMs: Math.round(tPack * 10) / 10,
      bundleWithoutP36Ms: Math.round(tOff * 10) / 10,
      bundleWithP36Ms: Math.round(tOn * 10) / 10,
      overheadMs: Math.round((tOn - tOff) * 10) / 10,
      metricsComputeMs: pack.metrics?.performance?.computeMs
    }
  };
}

const dest = path.join(root, 'docs/analyses-documentation/fixtures/p36-replay-oct-2026.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));
console.log('\nWrote', dest);
