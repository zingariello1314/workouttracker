/**
 * F7.0e — Identité complète sync vs chemin Worker (même computeAdaptiveInsightsPayload).
 * Usage: npx vite-node scripts/f7-worker-identity.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildComposedInterpretationPipeline } from '../src/utils/sport/recapInterpretationPipeline.js';
import { buildAdaptiveRecapInsights } from '../src/utils/sport/recapAdaptiveInsights.js';
import { computeAdaptiveInsightsPayload } from '../src/utils/sport/recapAdaptiveWorkerCompute.js';
import {
  adaptiveResultsEqual,
  fingerprintAdaptiveResult,
  buildExerciseNameMap
} from '../src/utils/sport/recapAdaptiveWorkerContract.js';
import { createRecapComputeScope } from '../src/utils/sport/recapComputeScope.js';
import { emptyInsightHistory } from '../src/utils/sport/insightNoveltyStore.js';

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

const END = '2026-10-30';
const PERIODS = [
  { period: 'today', window: { start: END, end: END } },
  { period: '7d', window: { start: '2026-10-24', end: END } },
  { period: '30d', window: { start: '2026-09-30', end: END } },
  { period: '3m', window: { start: '2026-07-30', end: END } },
  { period: '6m', window: { start: '2026-04-30', end: END } },
  { period: '1y', window: { start: '2025-10-30', end: END } },
  { period: '2y', window: { start: '2024-10-30', end: END } },
  { period: 'all', window: { start: '2020-01-01', end: END } }
];

async function runSync(period, window) {
  const insightHistory = emptyInsightHistory();
  const scope = createRecapComputeScope({ snapshot: snap, period, window });
  const composed = buildComposedInterpretationPipeline({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName,
    insightHistory,
    computeScope: scope
  });
  // sync path (pas de coop)
  const adaptive = buildAdaptiveRecapInsights({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName,
    precomputedComposed: composed,
    insightHistory,
    lastInsightSignature: null,
    persistHistory: false
  });
  return adaptive;
}

async function runWorkerPath(period, window) {
  const nameMap = { ...nameById, ...buildExerciseNameMap(snap, getName) };
  const { adaptive } = await computeAdaptiveInsightsPayload(
    {
      snapshot: snap,
      period,
      windowStart: window.start,
      windowEnd: window.end,
      nameMap,
      insightHistory: emptyInsightHistory(),
      lastInsightSignature: null,
      assessment: null,
      enrichment: null,
      recapState: null
    },
    { yieldFn: async () => {} }
  );
  return adaptive;
}

const rows = [];
let allOk = true;
for (const { period, window } of PERIODS) {
  const t0 = performance.now();
  const sync = await runSync(period, window);
  const t1 = performance.now();
  const workerish = await runWorkerPath(period, window);
  const t2 = performance.now();
  const equal = adaptiveResultsEqual(sync, workerish);
  if (!equal) allOk = false;
  rows.push({
    period,
    equal,
    syncMs: Math.round(t1 - t0),
    workerPathMs: Math.round(t2 - t1),
    syncSelected:
      (sync.insights?.shortTerm?.length || 0) +
      (sync.insights?.mediumTerm?.length || 0) +
      (sync.insights?.longTerm?.length || 0),
    fpPreview: fingerprintAdaptiveResult(sync)?.signature ?? null
  });
  console.log(
    `[f7-worker-identity] ${period}: equal=${equal} sync=${rows.at(-1).syncMs}ms workerPath=${rows.at(-1).workerPathMs}ms`
  );
}

const out = {
  generatedAt: new Date().toISOString(),
  allEqual: allOk,
  rows
};
const dest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f7-worker-identity.json'
);
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify({ allEqual: allOk, periods: rows.length }, null, 2));
process.exit(allOk ? 0 : 1);
