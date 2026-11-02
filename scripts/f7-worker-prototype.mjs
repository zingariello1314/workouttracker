/**
 * F7.0d — Prototype isolé « Worker readiness » (pas branché à l’UI).
 *
 * Mesure :
 * - taille de sérialisation du snapshot fixture
 * - durée sync buildPeriodDiscoveryBundle
 * - identité sync vs re-parse JSON (proxy du coût transfert Worker)
 *
 * Usage: npx vite-node scripts/f7-worker-prototype.mjs
 *
 * Ne crée pas encore de Worker navigateur — validation humaine requise avant intégration.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { createRecapComputeScope } from '../src/utils/sport/recapComputeScope.js';
import { createRecapPerfTimer } from '../src/utils/sport/recapPerfInstrumentation.js';

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
    exerciseId: d.metrics?.exerciseId || null
  }));
}

function runOnce(period, window) {
  const perf = createRecapPerfTimer({ enabled: true });
  const scope = createRecapComputeScope({ snapshot: snap, period, window });
  const t0 = performance.now();
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window,
    period,
    getExerciseNameById: getName,
    computeScope: scope,
    perfTimer: perf
  });
  return {
    ms: Math.round((performance.now() - t0) * 100) / 100,
    steps: perf.snapshot(),
    fp: fingerprint(bundle),
    selected: (bundle.selected || []).length,
    calendarMemoHits: perf.snapshot()?.['calendarLoad:memoHit']?.calls || 0
  };
}

const END = '2026-10-30';
const window2y = { start: '2024-10-30', end: END };

const json = JSON.stringify(snap);
const tSer0 = performance.now();
const parsed = JSON.parse(json);
const serMs = Math.round((performance.now() - tSer0) * 100) / 100;

const a = runOnce('2y', window2y);
const bScopeSnap = { ...parsed };
const perfB = createRecapPerfTimer({ enabled: true });
const scopeB = createRecapComputeScope({ snapshot: bScopeSnap, period: '2y', window: window2y });
const tB0 = performance.now();
const bundleB = buildPeriodDiscoveryBundle({
  snapshot: bScopeSnap,
  window: window2y,
  period: '2y',
  getExerciseNameById: getName,
  computeScope: scopeB,
  perfTimer: perfB
});
const b = {
  ms: Math.round((performance.now() - tB0) * 100) / 100,
  fp: fingerprint(bundleB),
  calendarMemoHits: perfB.snapshot()?.['calendarLoad:memoHit']?.calls || 0
};

const identityOk = JSON.stringify(a.fp) === JSON.stringify(b.fp);
const calendarLoad = a.steps?.calendarLoad;
const memoHits = a.calendarMemoHits;

const out = {
  generatedAt: new Date().toISOString(),
  note: 'Prototype isolé — pas un Worker navigateur branché',
  transfer: {
    snapshotJsonBytes: Buffer.byteLength(json, 'utf8'),
    serializeParseMs: serMs,
    comment: 'Ordre de grandeur du coût postMessage(structured clone) côté Worker'
  },
  compute: {
    syncMs: a.ms,
    afterJsonRoundtripMs: b.ms,
    selected: a.selected,
    identityAfterRoundtrip: identityOk,
    calendarLoadInclusiveMs: calendarLoad?.inclusiveMs ?? null,
    calendarLoadCalls: calendarLoad?.calls ?? null,
    calendarMemoHits: memoHits,
    topExclusive: Object.entries(a.steps || {})
      .map(([name, row]) => ({ name, ...row }))
      .sort((x, y) => y.exclusiveMs - x.exclusiveMs)
      .slice(0, 8)
  },
  workerDesign: {
    entry: 'src/workers/recapPeriodDiscovery.worker.js (à créer à l’intégration)',
    messageIn: ['requestId', 'accountScope', 'period', 'window', 'snapshot', 'nameMap'],
    messageOut: ['requestId', 'ok', 'bundleFingerprint', 'selected', 'error'],
    cancel: 'ignore results with stale requestId; terminate optional',
    keepSyncPath: true,
    risks: [
      'structured clone coût mémoire',
      'imports Vite worker',
      'pas de DOM dans le worker',
      'double RAM snapshot pendant transfert'
    ]
  },
  recommendation:
    'Mesures live : Long Tasks encore 3–15s. Mémo calendaire locale d’abord. Worker justifié si max sync producteur >~2s sur profil réel après mémo — prototype navigateur après validation humaine.'
};

const dest = path.join(
  root,
  'docs/analyses-documentation/moteur analyse v1/fixtures/f7-worker-prototype.json'
);
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));
console.error(`[f7-worker-prototype] wrote ${dest}`);
process.exit(identityOk ? 0 : 1);
